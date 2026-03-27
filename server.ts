import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { Match, User, Pick, Transaction, TEAMS } from "./src/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, "db.json");

// --- LOCAL DB HELPER ---
class LocalDB {
  private data: {
    users: Record<string, User>;
    matches: Record<string, Match>;
    picks: Record<string, Pick>;
    transactions: Record<string, Transaction>;
  } = {
    users: {},
    matches: {},
    picks: {},
    transactions: {},
  };

  async init() {
    try {
      const content = await fs.readFile(DB_PATH, "utf-8");
      this.data = JSON.parse(content);
    } catch (error) {
      console.log("No existing database found, creating new one.");
      await this.save();
    }
  }

  async save() {
    await fs.writeFile(DB_PATH, JSON.stringify(this.data, null, 2));
  }

  getCollection<T extends keyof typeof this.data>(name: T) {
    return {
      doc: (id: string) => ({
        get: async () => ({
          exists: !!this.data[name][id],
          data: () => this.data[name][id],
        }),
        set: async (val: any, options?: { merge?: boolean }) => {
          if (options?.merge) {
            this.data[name][id] = { ...this.data[name][id], ...val };
          } else {
            this.data[name][id] = val;
          }
          await this.save();
        },
        update: async (val: any) => {
          this.data[name][id] = { ...this.data[name][id], ...val };
          await this.save();
        },
        delete: async () => {
          delete this.data[name][id];
          await this.save();
        },
      }),
      get: async () => ({
        docs: Object.values(this.data[name]).map((val) => ({
          data: () => val,
          id: (val as any).id || (val as any).username || (val as any).matchId,
        })),
      }),
      where: (field: string, op: string, value: any) => {
        const filtered = Object.values(this.data[name]).filter((item: any) => item[field] === value);
        return {
          get: async () => ({
            docs: filtered.map((val) => ({
              data: () => val,
            })),
          }),
        };
      },
    };
  }

  batch() {
    const operations: (() => Promise<void>)[] = [];
    return {
      set: (ref: any, val: any, options?: any) => {
        operations.push(() => ref.set(val, options));
      },
      commit: async () => {
        for (const op of operations) await op();
      },
    };
  }
}

const db = new LocalDB();

async function startServer() {
  await db.init();
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API ROUTES ---

  // Auth / User
  app.post("/api/auth/signin", async (req, res, next) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "Username required" });

    const userRef = db.getCollection("users").doc(username);
    try {
      const userSnap = await userRef.get();
      if (!userSnap.exists) {
        const newUser: User = {
          username,
          coins: 1000,
          joinedAt: new Date().toISOString(),
        };
        await userRef.set(newUser);
        
        const transId = `t-init-${username}`;
        await db.getCollection("transactions").doc(transId).set({
          id: transId,
          username,
          amount: 1000,
          type: "Initial",
          timestamp: new Date().toISOString(),
          description: "Welcome bonus",
        });
        res.json(newUser);
      } else {
        res.json(userSnap.data());
      }
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/user/:username", async (req, res, next) => {
    const userRef = db.getCollection("users").doc(req.params.username);
    try {
      const userSnap = await userRef.get();
      if (!userSnap.exists) return res.status(404).json({ error: "User not found" });
      res.json(userSnap.data());
    } catch (error) {
      next(error);
    }
  });

  // Matches
  app.get("/api/matches", async (req, res, next) => {
    try {
      const matchesSnap = await db.getCollection("matches").get();
      const matches = matchesSnap.docs.map(doc => doc.data() as Match);
      res.json(matches);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/matches/sync", async (req, res, next) => {
    const { matches: newMatches } = req.body;
    if (!Array.isArray(newMatches)) return res.status(400).json({ error: "Invalid matches data" });

    try {
      const batch = db.batch();
      for (const newMatch of newMatches) {
        const matchRef = db.getCollection("matches").doc(newMatch.id);
        batch.set(matchRef, newMatch, { merge: true });
      }
      await batch.commit();
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Picks
  app.get("/api/picks/:username", async (req, res, next) => {
    try {
      const picksSnap = await db.getCollection("picks")
        .where("username", "==", req.params.username)
        .get();
      const userPicks = picksSnap.docs.map(doc => doc.data() as Pick);
      res.json(userPicks);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/picks", async (req, res, next) => {
    const { username, matchId, teamId } = req.body;
    
    try {
      const userRef = db.getCollection("users").doc(username);
      const matchRef = db.getCollection("matches").doc(matchId);
      
      const [userSnap, matchSnap] = await Promise.all([
        userRef.get(),
        matchRef.get()
      ]);

      if (!userSnap.exists || !matchSnap.exists) {
        return res.status(404).json({ error: "User or Match not found" });
      }

      const user = userSnap.data() as User;
      const match = matchSnap.data() as Match;

      if (match.status !== "Upcoming") return res.status(400).json({ error: "Betting locked" });
      
      const pickId = `${username}_${matchId}`;
      const pickRef = db.getCollection("picks").doc(pickId);
      const pickSnap = await pickRef.get();
      
      if (!pickSnap.exists) {
        if (user.coins < 10) return res.status(400).json({ error: "Insufficient coins" });
        
        const newCoins = user.coins - 10;
        await userRef.update({ coins: newCoins });
        
        const transId = `t-bet-${username}-${matchId}-${Date.now()}`;
        await db.getCollection("transactions").doc(transId).set({
          id: transId,
          username,
          matchId,
          amount: -10,
          type: "Bet",
          timestamp: new Date().toISOString(),
          description: `Pick placed for ${match.homeTeam.shortName} vs ${match.awayTeam.shortName}`,
        });

        const newPick: Pick = {
          matchId,
          username,
          teamId,
          timestamp: new Date().toISOString(),
          status: "Pending",
        };
        await pickRef.set(newPick);
        res.json({ user: { ...user, coins: newCoins }, pick: newPick });
      } else {
        await pickRef.update({
          teamId,
          timestamp: new Date().toISOString()
        });
        const updatedPick = (await pickRef.get()).data();
        res.json({ user, pick: updatedPick });
      }
    } catch (error) {
      next(error);
    }
  });

  // Wallet / History
  app.get("/api/history/:username", async (req, res, next) => {
    try {
      const transSnap = await db.getCollection("transactions")
        .where("username", "==", req.params.username)
        .get();
      const history = transSnap.docs
        .map(doc => doc.data() as Transaction)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      res.json(history);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/wallet/add", async (req, res, next) => {
    const { username, amount } = req.body;
    try {
      const userRef = db.getCollection("users").doc(username);
      const userSnap = await userRef.get();
      if (!userSnap.exists) return res.status(404).json({ error: "User not found" });

      const user = userSnap.data() as User;
      const newCoins = user.coins + amount;
      await userRef.update({ coins: newCoins });

      const transId = `t-add-${username}-${Date.now()}`;
      await db.getCollection("transactions").doc(transId).set({
        id: transId,
        username,
        amount,
        type: "Initial",
        timestamp: new Date().toISOString(),
        description: "Coins added to wallet",
      });

      res.json({ ...user, coins: newCoins });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/wallet/withdraw", async (req, res, next) => {
    const { username, amount } = req.body;
    try {
      const userRef = db.getCollection("users").doc(username);
      const userSnap = await userRef.get();
      if (!userSnap.exists) return res.status(404).json({ error: "User not found" });

      const user = userSnap.data() as User;
      if (user.coins < amount) return res.status(400).json({ error: "Insufficient coins" });

      const newCoins = user.coins - amount;
      await userRef.update({ coins: newCoins });

      const transId = `t-withdraw-${username}-${Date.now()}`;
      await db.getCollection("transactions").doc(transId).set({
        id: transId,
        username,
        amount: -amount,
        type: "Bet",
        timestamp: new Date().toISOString(),
        description: "Coins withdrawn from wallet",
      });

      res.json({ ...user, coins: newCoins });
    } catch (error) {
      next(error);
    }
  });

  // Leaderboard
  app.get("/api/leaderboard", async (req, res, next) => {
    try {
      const usersSnap = await db.getCollection("users").get();
      const allUsers = usersSnap.docs.map(doc => doc.data() as User);
      
      const picksSnap = await db.getCollection("picks").get();
      const allPicks = picksSnap.docs.map(doc => doc.data() as Pick);

      const leaderboard = allUsers
        .map(u => {
          const userPicks = allPicks.filter(p => p.username === u.username);
          const wins = userPicks.filter(p => p.status === "Won").length;
          const winRate = userPicks.length > 0 ? Math.round((wins / userPicks.length) * 100) : 0;
          return {
            username: u.username,
            coins: u.coins,
            picksPlayed: userPicks.length,
            winRate,
          };
        })
        .sort((a, b) => b.coins - a.coins);
      res.json(leaderboard);
    } catch (error) {
      next(error);
    }
  });

  // Reports
  app.get("/api/reports", async (req, res, next) => {
    try {
      const picksSnap = await db.getCollection("picks").get();
      const allPicks = picksSnap.docs.map(doc => doc.data() as Pick);

      const totalBets = allPicks.length;
      const teamCounts: Record<string, number> = {};
      allPicks.forEach(p => {
          teamCounts[p.teamId] = (teamCounts[p.teamId] || 0) + 1;
      });
      const mostPickedTeam = Object.entries(teamCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
      
      res.json({
          totalBets,
          mostPickedTeam,
          avgCoinsWon: 15.5, // Mock
          teamPopularity: Object.entries(teamCounts).map(([id, count]) => ({ id, count })),
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/reports/weekly", async (req, res, next) => {
    const { start, end } = req.query;
    if (!start || !end) return res.status(400).json({ error: "Start and end dates required" });

    const startDate = new Date(start as string);
    const endDate = new Date(end as string);

    try {
      const transSnap = await db.getCollection("transactions").get();
      const allTransactions = transSnap.docs.map(doc => doc.data() as Transaction);

      const matchesSnap = await db.getCollection("matches").get();
      const allMatches = matchesSnap.docs.map(doc => doc.data() as Match);

      const weeklyTransactions = allTransactions.filter(t => {
        const date = new Date(t.timestamp);
        return date >= startDate && date <= endDate && (t.type === "Bet" || t.type === "Win");
      });

      const playerPerformance: Record<string, any> = {};

      weeklyTransactions.forEach(t => {
        if (!playerPerformance[t.username]) {
          playerPerformance[t.username] = {
            username: t.username,
            totalWon: 0,
            totalLost: 0,
            netProfit: 0,
            breakdown: []
          };
        }

        const perf = playerPerformance[t.username];
        if (t.type === "Win") {
          perf.totalWon += t.amount;
        } else if (t.type === "Bet") {
          perf.totalLost += Math.abs(t.amount);
        }
        perf.netProfit = perf.totalWon - perf.totalLost;
        
        if (t.matchId) {
          const match = allMatches.find(m => m.id === t.matchId);
          perf.breakdown.push({
            matchId: t.matchId,
            matchName: match ? `${match.homeTeam.shortName} vs ${match.awayTeam.shortName}` : "Unknown Match",
            amount: t.amount,
            type: t.type,
            timestamp: t.timestamp
          });
        }
      });

      res.json(Object.values(playerPerformance));
    } catch (error) {
      next(error);
    }
  });

  // Admin: Simulate Result
  app.post("/api/admin/complete-match", async (req, res, next) => {
    const { matchId, winnerId } = req.body;
    
    try {
      const matchRef = db.getCollection("matches").doc(matchId);
      const matchSnap = await matchRef.get();
      if (!matchSnap.exists) return res.status(404).json({ error: "Match not found" });

      const match = matchSnap.data() as Match;
      await matchRef.update({
        status: "Completed",
        result: { winnerId, margin: `${winnerId} won comfortably` }
      });

      // Process picks
      const picksSnap = await db.getCollection("picks").get();
      const allPicks = picksSnap.docs.map(doc => doc.data() as Pick);
      const matchPicks = allPicks.filter(p => p.matchId === matchId);
      
      for (const p of matchPicks) {
        const userRef = db.getCollection("users").doc(p.username);
        const userSnap = await userRef.get();
        
        if (userSnap.exists) {
          const user = userSnap.data() as User;
          const pickRef = db.getCollection("picks").doc(`${p.username}_${matchId}`);

          if (p.teamId === winnerId) {
            await pickRef.update({ status: "Won" });
            const newCoins = user.coins + 20;
            await userRef.update({ coins: newCoins });
            
            const transId = `t-win-${p.username}-${matchId}`;
            await db.getCollection("transactions").doc(transId).set({
              id: transId,
              username: p.username,
              matchId,
              amount: 20,
              type: "Win",
              timestamp: new Date().toISOString(),
              description: `Won bet on ${winnerId}`,
            });
          } else {
            await pickRef.update({ status: "Lost" });
          }
        }
      }

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Global error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Server Error:", err);
    res.status(500).json({ 
      error: err.message || "Internal server error",
      details: err.stack
    });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
