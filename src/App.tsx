import * as React from 'react';
import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Wallet, 
  BarChart3, 
  LayoutGrid, 
  Moon, 
  Sun, 
  ChevronRight, 
  ChevronLeft,
  Lock, 
  Clock, 
  MapPin,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  History,
  Info,
  LogOut,
  Calendar
} from 'lucide-react';
import { cn } from './lib/utils';
import { fetchLatestIPLMatches, fetchIPLStats } from './services/matchService';
import { User, Match, Pick, Transaction, TEAMS, Team } from './types';

// --- COMPONENTS ---

class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    (this as any).state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    const { hasError, error } = (this as any).state;
    if (hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 text-center">
          <div className="glass-card p-8 rounded-3xl max-w-md">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-headline font-black mb-2">Something went wrong</h1>
            <p className="text-sm text-muted-foreground mb-6">
              {error?.message || "An unexpected error occurred."}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-bold"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

const TeamRepresentation = ({ team, size = "md", animate = true }: { team: Team, size?: "sm" | "md" | "lg", animate?: boolean }) => {
  const sizeClasses = {
    sm: "w-10 h-10 text-xs",
    md: "w-20 h-20 text-xl",
    lg: "w-24 h-24 text-2xl"
  };

  const content = (
    <div 
      className={cn(
        "rounded-3xl flex items-center justify-center font-black shadow-xl relative overflow-hidden border border-border/50",
        sizeClasses[size]
      )}
      style={{ backgroundColor: team.color }}
    >
      <div className="absolute inset-0 bg-black/10" />
      <span className="relative z-10 text-white drop-shadow-md italic tracking-tighter">
        {team.shortName}
      </span>
    </div>
  );

  if (!animate) return content;

  return (
    <motion.div
      whileHover={{ scale: 1.12, rotate: size === "lg" ? 6 : -6 }}
      whileTap={{ scale: 0.94 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
    >
      {content}
    </motion.div>
  );
};

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <button 
      onClick={() => setIsDark(!isDark)}
      className="p-2 rounded-full bg-secondary hover:bg-accent transition-colors"
    >
      {isDark ? <Sun className="w-5 h-5 text-primary" /> : <Moon className="w-5 h-5 text-primary" />}
    </button>
  );
};

const Header = ({ user, onSignOut }: { user: User | null, onSignOut: () => void }) => {
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-screen-xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center rotate-12">
            <Trophy className="w-5 h-5 text-primary-foreground -rotate-12" />
          </div>
          <span className="font-headline font-black italic text-primary hidden sm:inline">PADHI RUPAYALA PANCHAYITHI</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-full border border-border">
            <span className="text-xs font-bold text-muted-foreground">{user.username}</span>
            <div className="h-4 w-px bg-border" />
            <motion.div 
              key={user.coins}
              initial={{ scale: 1.5, y: -5, color: '#fcd00e' }}
              animate={{ scale: 1, y: 0, color: 'inherit' }}
              transition={{ type: "spring", stiffness: 600, damping: 12 }}
              className="flex items-center gap-1 text-primary"
            >
              <Wallet className="w-4 h-4" />
              <span className="text-sm font-black tabular-nums">{user.coins}</span>
            </motion.div>
          </div>
          <ThemeToggle />
          <button onClick={onSignOut} className="p-2 text-muted-foreground hover:text-foreground">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Matches', icon: LayoutGrid, path: '/' },
    { label: 'Ranks', icon: Trophy, path: '/ranks' },
    { label: 'Wallet', icon: Wallet, path: '/wallet' },
    { label: 'Reports', icon: BarChart3, path: '/reports' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-lg border-t border-border pb-safe">
      <div className="max-w-screen-xl mx-auto px-4 h-16 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center gap-1 transition-all",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-6 h-6", isActive && "fill-primary/20")} />
              <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="nav-active"
                  className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

// --- PAGES ---

const SignIn = ({ onSignIn }: { onSignIn: (username: string) => void }) => {
  const [username, setUsername] = useState('');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 stadium-gradient">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-block w-20 h-20 bg-primary/20 rounded-2xl rotate-12 flex items-center justify-center stadium-glow"
          >
            <Trophy className="w-10 h-10 text-primary -rotate-12" />
          </motion.div>
          <div className="space-y-2">
            <h1 className="text-4xl font-headline font-black italic text-primary tracking-tighter">Padhi Rupayala Panchayithi</h1>
            <p className="text-muted-foreground text-sm">Pani pata leni aatagalu dabbulu leka padhi rupayala betting start chesaru</p>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-primary">Enter your username</label>
            <input 
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. SixerKing_45"
              className="w-full bg-background border-border rounded-xl px-4 py-3 focus:ring-primary focus:border-primary"
            />
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Info className="w-3 h-3" />
              Your username appears on leaderboards and reports.
            </p>
          </div>

          <button 
            onClick={() => onSignIn(username)}
            disabled={!username}
            className="w-full bg-primary text-primary-foreground font-headline font-bold py-4 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
          >
            Sign in
          </button>

          <div className="text-center">
            <button className="text-sm text-primary font-bold hover:underline">How it works</button>
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-foreground opacity-60">
          Anyone with this link can sign in and play. Please ensure you are sharing with intended participants only.
        </p>
      </div>
    </div>
  );
};

const MatchCountdown = ({ startTime }: { startTime: string }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      const difference = start - now;

      if (difference <= 0) {
        return 'Starting soon...';
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      let timeStr = '';
      if (days > 0) timeStr += `${days}d `;
      timeStr += `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
      
      return timeStr;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  return (
    <span className="text-lg font-headline font-extrabold tabular-nums">
      {timeLeft}
    </span>
  );
};

const Matches = ({ 
  user, 
  matches, 
  userPicks, 
  onPlacePick,
  onRefreshOnline,
  isFetchingOnline
}: { 
  user: User, 
  matches: Match[], 
  userPicks: Pick[], 
  onPlacePick: (match: Match) => void,
  onRefreshOnline: () => void,
  isFetchingOnline: boolean
}) => {
  const [filter, setFilter] = useState<'Upcoming' | 'Live' | 'Completed'>('Upcoming');
  const [showAll, setShowAll] = useState(false);

  const filteredMatches = matches.filter(m => m.status === filter);

  // Filter for matches within the next 48 hours
  const now = new Date().getTime();
  const fortyEightHoursFromNow = now + (48 * 60 * 60 * 1000);

  const nearMatches = filter === 'Upcoming' 
    ? filteredMatches.filter(m => new Date(m.startTime).getTime() <= fortyEightHoursFromNow)
    : filteredMatches;

  const farMatches = filter === 'Upcoming'
    ? filteredMatches.filter(m => new Date(m.startTime).getTime() > fortyEightHoursFromNow)
    : [];

  const displayedMatches = showAll ? [...nearMatches, ...farMatches] : nearMatches;

  return (
    <div className="space-y-8 pb-24">
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-headline font-black tracking-tight">Live Arena</h1>
              <button 
                onClick={onRefreshOnline}
                disabled={isFetchingOnline}
                className={cn(
                  "p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all",
                  isFetchingOnline && "animate-spin"
                )}
                title="Refresh from Online"
              >
                <TrendingUp className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Info className="w-4 h-4" />
              {isFetchingOnline ? "Fetching latest IPL data from online..." : "All users share this global list. Bets lock at match start."}
            </p>
          </div>
          <div className="flex bg-secondary p-1 rounded-xl self-start">
            {(['Upcoming', 'Live', 'Completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFilter(f);
                  setShowAll(false);
                }}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                  filter === f ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {displayedMatches.map((match) => {
            const userPick = userPicks.find(p => p.matchId === match.id);
            const isLocked = match.status !== 'Upcoming';

            return (
              <motion.div 
                key={match.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass-card rounded-3xl p-6 stadium-glow group hover:scale-[1.02] transition-all"
              >
                <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{match.venue}</span>
                <span className={cn(
                  "px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                  match.status === 'Live' ? "bg-red-500/10 text-red-500 animate-pulse" : "bg-primary/10 text-primary"
                )}>
                  {match.status}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 mb-8">
                <div className="flex flex-col items-center gap-2 flex-1">
                  <TeamRepresentation team={match.homeTeam} />
                  <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">{match.homeTeam.name}</span>
                  {match.score && (
                    <span className="text-sm font-black tabular-nums">{match.score.home}</span>
                  )}
                </div>
                <div className="flex flex-col items-center gap-1">
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="text-primary/40 font-black text-2xl italic"
                  >
                    VS
                  </motion.div>
                  {match.score?.overs && (
                    <span className="text-[10px] font-bold text-muted-foreground">{match.score.overs} ov</span>
                  )}
                </div>
                <div className="flex flex-col items-center gap-2 flex-1">
                  <TeamRepresentation team={match.awayTeam} />
                  <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">{match.awayTeam.name}</span>
                  {match.score && (
                    <span className="text-sm font-black tabular-nums">{match.score.away}</span>
                  )}
                </div>
              </div>

              {match.score?.statusText && (
                <div className="mb-6 p-2 bg-primary/5 rounded-lg border border-primary/10 text-center">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{match.score.statusText}</p>
                </div>
              )}

              {match.result && (
                <div className="mb-6 p-2 bg-green-500/5 rounded-lg border border-green-500/10 text-center">
                  <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest">{match.result.margin}</p>
                </div>
              )}

              {match.status === 'Upcoming' ? (
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Starts In</span>
                    <MatchCountdown startTime={match.startTime} />
                  </div>
                  
                  {userPick ? (
                    <div className="bg-muted rounded-2xl p-4 border border-border">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Your Pick</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-black text-white" style={{ backgroundColor: TEAMS[userPick.teamId].color }}>
                          {userPick.teamId}
                        </span>
                      </div>
                      <button 
                        onClick={() => onPlacePick(match)}
                        className="w-full py-2 bg-secondary hover:bg-accent text-foreground text-xs font-bold rounded-xl transition-all"
                      >
                        Change Pick
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => onPlacePick(match)}
                      className="w-full py-4 bg-primary text-primary-foreground text-sm font-black uppercase tracking-widest rounded-xl shadow-xl shadow-primary/20 active:scale-95 transition-all"
                    >
                      Place Pick
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center py-6 bg-muted/30 rounded-2xl border border-dashed border-border">
                    <div className="flex flex-col items-center gap-2">
                      <Lock className="w-5 h-5 text-muted-foreground/50" />
                      <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Betting Locked</span>
                    </div>
                  </div>
                  <button className="w-full py-4 bg-muted text-muted-foreground/40 text-sm font-black uppercase tracking-widest rounded-xl cursor-not-allowed">
                    {match.status === 'Live' ? 'In Progress' : 'Match Ended'}
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
        </AnimatePresence>
      </div>

      {filter === 'Upcoming' && farMatches.length > 0 && (
        <div className="flex justify-center pt-4">
          <button 
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-2 px-8 py-3 bg-secondary hover:bg-accent text-primary font-black uppercase tracking-widest rounded-2xl border border-border transition-all"
          >
            {showAll ? "Show Less" : `Show More (${farMatches.length} matches)`}
            <ChevronRight className={cn("w-4 h-4 transition-transform", showAll ? "-rotate-90" : "rotate-90")} />
          </button>
        </div>
      )}
    </div>
  );
};

const PickModal = ({ match, user, onClose, onConfirm }: { match: Match, user: User, onClose: () => void, onConfirm: (teamId: string) => void }) => {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="relative w-full max-w-lg bg-card rounded-t-[2.5rem] sm:rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-8 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Placing pick as: {user.username}</span>
            <h2 className="text-2xl font-headline font-black italic">
              {match.homeTeam.shortName} <span className="text-muted-foreground not-italic text-sm">VS</span> {match.awayTeam.shortName}
            </h2>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Clock className="w-3 h-3" />
              Accepting picks until match start
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[match.homeTeam, match.awayTeam].map((team) => (
              <motion.button
                key={team.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedTeam(team.id)}
                className={cn(
                  "relative p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3",
                  selectedTeam === team.id 
                    ? "bg-primary/5 border-primary shadow-lg shadow-primary/10" 
                    : "bg-muted/50 border-transparent hover:border-border"
                )}
              >
                {selectedTeam === team.id && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-3 right-3"
                  >
                    <CheckCircle2 className="w-5 h-5 text-primary fill-primary/20" />
                  </motion.div>
                )}
                <TeamRepresentation team={team} size="lg" animate={selectedTeam === team.id} />
                <div className="text-center">
                  <p className="text-xs font-black uppercase tracking-widest">{team.shortName}</p>
                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-tight">{team.name}</p>
                </div>
              </motion.button>
            ))}
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Stake Amount</p>
                <div className="flex items-center gap-2 text-primary font-black text-xl">
                  <Wallet className="w-5 h-5" />
                  <span>10 coins</span>
                </div>
                <p className="text-[10px] text-muted-foreground">₹10 equivalent • Virtual Only</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Your Purse</p>
                <p className="text-lg font-bold">{user.coins} coins</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button 
                disabled={!selectedTeam}
                onClick={() => selectedTeam && onConfirm(selectedTeam)}
                className="w-full bg-primary text-primary-foreground font-headline font-bold py-4 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
              >
                Confirm Pick
              </button>
              <button onClick={onClose} className="w-full py-3 text-sm text-muted-foreground font-bold hover:text-foreground">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const Ranks = ({ user, leaderboard }: { user: User, leaderboard: any[] }) => {
  return (
    <div className="space-y-8 pb-24">
      <section>
        <h1 className="text-3xl font-headline font-black tracking-tight">Global Leaderboard</h1>
        <p className="text-sm text-muted-foreground">Everyone who signs in with this link appears here.</p>
      </section>

      <div className="space-y-4">
        {leaderboard.map((entry, idx) => {
          const isMe = entry.username === user.username;
          const rank = idx + 1;

          return (
            <motion.div 
              key={entry.username}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={cn(
                "glass-card rounded-2xl p-4 flex items-center gap-4 transition-all",
                isMe && "border-primary/40 bg-primary/5 scale-[1.02] shadow-primary/10"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center font-black text-sm",
                rank === 1 ? "bg-yellow-500 text-white" : 
                rank === 2 ? "bg-gray-300 text-gray-700" :
                rank === 3 ? "bg-amber-600 text-white" : "bg-muted text-muted-foreground"
              )}>
                {rank}
              </div>
              <div className="flex-1 flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center font-bold text-muted-foreground">
                  {entry.username[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-bold flex items-center gap-2">
                    {entry.username}
                    {isMe && <span className="text-[8px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full uppercase font-black">You</span>}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                    {entry.picksPlayed} Picks • {entry.winRate}% Win Rate
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-primary font-black">
                  <Wallet className="w-3 h-3" />
                  <span>{entry.coins}</span>
                </div>
                <p className="text-[8px] text-muted-foreground uppercase font-bold">Coins</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const WalletPage = ({ user, history, onAddCoins, onWithdraw }: { user: User, history: Transaction[], onAddCoins: () => void, onWithdraw: () => void }) => {
  return (
    <div className="space-y-8 pb-24">
      <section className="glass-card rounded-3xl p-8 stadium-glow relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
        <div className="relative z-10 space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Your Wallet & History</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-6xl font-headline font-black tracking-tighter">{user.coins}</h2>
            <div className="flex items-center gap-1 px-3 py-1 bg-primary/10 rounded-full text-primary">
              <Wallet className="w-4 h-4" />
              <span className="text-xs font-black italic uppercase">COINS</span>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button 
              onClick={onAddCoins}
              className="flex-1 bg-primary text-primary-foreground font-headline font-bold py-3 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all"
            >
              Add Coins
            </button>
            <button 
              onClick={onWithdraw}
              className="flex-1 bg-secondary text-foreground font-headline font-bold py-3 rounded-xl border border-border active:scale-95 transition-all"
            >
              Withdraw
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-headline font-black tracking-tight flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          Recent Activity
        </h3>
        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground italic">No transactions yet.</div>
          ) : (
            history.map((t) => (
              <motion.div 
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-2xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    t.type === 'Win' ? "bg-green-500/10 text-green-500" :
                    t.type === 'Bet' ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"
                  )}>
                    {t.type === 'Win' ? <Trophy className="w-5 h-5" /> : 
                     t.type === 'Bet' ? <AlertCircle className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{t.description}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(t.timestamp).toLocaleDateString()} • {new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className={cn(
                  "text-sm font-black tabular-nums",
                  t.amount > 0 ? "text-green-500" : "text-red-500"
                )}>
                  {t.amount > 0 ? '+' : ''}{t.amount}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

const Reports = ({ reports, onRefreshOnline, isFetchingOnline }: { reports: any, onRefreshOnline: () => void, isFetchingOnline: boolean }) => {
  const [weeklyReport, setWeeklyReport] = useState<any[]>([]);
  const [loadingWeekly, setLoadingWeekly] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  const fetchWeeklyReport = async () => {
    setLoadingWeekly(true);
    try {
      const now = new Date();
      const start = new Date(now.setDate(now.getDate() - now.getDay() + (weekOffset * 7)));
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      const res = await fetch(`/api/reports/weekly?start=${start.toISOString()}&end=${end.toISOString()}`);
      if (res.ok) {
        setWeeklyReport(await res.json());
      }
    } catch (err) {
      console.error("Weekly report error:", err);
    } finally {
      setLoadingWeekly(false);
    }
  };

  useEffect(() => {
    fetchWeeklyReport();
  }, [weekOffset]);

  if (!reports) return null;

  const getWeekRangeLabel = () => {
    const now = new Date();
    const start = new Date(now.setDate(now.getDate() - now.getDay() + (weekOffset * 7)));
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  return (
    <div className="space-y-8 pb-24">
      <section>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-headline font-black tracking-tight">Reports & Insights</h1>
          <button 
            onClick={onRefreshOnline}
            disabled={isFetchingOnline}
            className={cn(
              "p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-all",
              isFetchingOnline && "animate-spin"
            )}
            title="Refresh from Online"
          >
            <TrendingUp className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Info className="w-4 h-4" />
          {isFetchingOnline ? "Fetching latest IPL statistics from online..." : "Global statistics visible to the community"}
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-3xl relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-primary/10">
            <Wallet className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Total bets placed</p>
            <p className="text-4xl font-black font-headline tracking-tighter">{reports.totalBets.toLocaleString()}</p>
            <div className="mt-4 flex items-center text-primary text-[10px] font-bold gap-1">
              <TrendingUp className="w-3 h-3" />
              +12.5% vs yesterday
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-primary/10">
            <Trophy className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Most picked team</p>
            <p className="text-4xl font-black font-headline tracking-tighter italic text-primary">{reports.mostPickedTeam}</p>
            <p className="text-[10px] text-muted-foreground mt-4 font-bold">FAVORITE OF THE SEASON</p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl relative overflow-hidden">
          <div className="absolute -right-4 -top-4 text-primary/10">
            <BarChart3 className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Avg coins won</p>
            <p className="text-4xl font-black font-headline tracking-tighter">{reports.avgCoinsWon}</p>
            <p className="text-[10px] text-muted-foreground mt-4 font-bold">HIGHEST SINCE START</p>
          </div>
        </div>
      </div>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-headline font-black">Weekly Performance Report</h2>
          <div className="flex items-center gap-4 bg-secondary p-1 rounded-xl">
            <button onClick={() => setWeekOffset(prev => prev - 1)} className="p-2 hover:bg-background rounded-lg transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold min-w-[120px] text-center">{getWeekRangeLabel()}</span>
            <button onClick={() => setWeekOffset(prev => prev + 1)} className="p-2 hover:bg-background rounded-lg transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loadingWeekly ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : weeklyReport.length === 0 ? (
          <div className="glass-card p-12 text-center text-muted-foreground italic rounded-3xl">
            No performance data for this period.
          </div>
        ) : (
          <div className="space-y-4">
            {weeklyReport.map((perf) => (
              <div key={perf.username} className="glass-card rounded-3xl overflow-hidden">
                <div className="p-6 bg-primary/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center font-bold text-primary">
                      {perf.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black">{perf.username}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{perf.breakdown.length} Activities</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-xl font-black tabular-nums",
                      perf.netProfit >= 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {perf.netProfit >= 0 ? '+' : ''}{perf.netProfit}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Net Profit/Loss</p>
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-green-500/5 p-3 rounded-2xl border border-green-500/10">
                      <p className="text-[10px] text-green-500 uppercase font-black mb-1">Total Won</p>
                      <p className="text-lg font-black text-green-500">{perf.totalWon}</p>
                    </div>
                    <div className="bg-red-500/5 p-3 rounded-2xl border border-red-500/10">
                      <p className="text-[10px] text-red-500 uppercase font-black mb-1">Total Lost</p>
                      <p className="text-lg font-black text-red-500">{perf.totalLost}</p>
                    </div>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Match Breakdown</p>
                  <div className="space-y-2">
                    {perf.breakdown.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl text-xs">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            item.type === 'Win' ? "bg-green-500" : "bg-red-500"
                          )} />
                          <span className="font-medium">{item.matchName}</span>
                        </div>
                        <span className={cn(
                          "font-black tabular-nums",
                          item.amount > 0 ? "text-green-500" : "text-red-500"
                        )}>
                          {item.amount > 0 ? '+' : ''}{item.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="glass-card rounded-3xl p-8">
        <h3 className="text-xl font-headline font-black mb-8">Team Popularity Spectrum</h3>
        <div className="flex items-end justify-between h-48 gap-2">
          {reports.teamPopularity.map((team: any) => (
            <div key={team.id} className="flex-1 flex flex-col items-center gap-2 group">
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: `${(team.count / reports.totalBets) * 100}%` }}
                className="w-full rounded-t-lg shadow-lg relative overflow-hidden"
                style={{ backgroundColor: TEAMS[team.id].color }}
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
              <div className="w-6 h-6 rounded-md overflow-hidden bg-muted/20 p-0.5">
                <img 
                  src={TEAMS[team.id].logo} 
                  alt={team.id}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground">{team.id}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

// --- MAIN APP ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [userPicks, setUserPicks] = useState<Pick[]>([]);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [reports, setReports] = useState<any>(null);
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingOnline, setFetchingOnline] = useState(false);

  const fetchData = async (username: string) => {
    try {
      const [userRes, matchesRes, picksRes, historyRes, leaderboardRes, reportsRes] = await Promise.all([
        fetch(`/api/user/${username}`),
        fetch('/api/matches'),
        fetch(`/api/picks/${username}`),
        fetch(`/api/history/${username}`),
        fetch('/api/leaderboard'),
        fetch('/api/reports'),
      ]);

      if (userRes.ok) {
        setUser(await userRes.json());
      } else {
        localStorage.removeItem('ipl_picks_user');
        setUser(null);
      }
      if (matchesRes.ok) setMatches(await matchesRes.json());
      if (picksRes.ok) setUserPicks(await picksRes.json());
      if (historyRes.ok) setHistory(await historyRes.json());
      if (leaderboardRes.ok) setLeaderboard(await leaderboardRes.json());
      if (reportsRes.ok) setReports(await reportsRes.json());
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('ipl_picks_user');
    if (savedUser) {
      fetchData(savedUser);
      // Automatically refresh match data when user is signed in
      handleRefreshOnline();
    } else {
      setLoading(false);
    }

    // Dynamic refresh every 5 minutes
    const interval = setInterval(() => {
      if (localStorage.getItem('ipl_picks_user')) {
        handleRefreshOnline();
      }
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  const handleSignIn = async (username: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      if (res.ok) {
        localStorage.setItem('ipl_picks_user', username);
        await fetchData(username);
        // Automatically refresh match data on sign in
        await handleRefreshOnline();
      } else {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        console.error("SignIn failed:", errorData.error);
        setLoading(false);
      }
    } catch (err) {
      console.error("SignIn error:", err);
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('ipl_picks_user');
    setUser(null);
  };

  const handleConfirmPick = async (teamId: string) => {
    if (!activeMatch || !user) return;

    try {
      const res = await fetch('/api/picks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          matchId: activeMatch.id,
          teamId,
        }),
      });
      if (res.ok) {
        setActiveMatch(null);
        fetchData(user.username);
      } else {
        const errorData = await res.json().catch(() => ({ error: "Failed to place bet" }));
        alert(errorData.error);
      }
    } catch (err) {
      console.error("Pick error:", err);
      alert("Network error while placing bet");
    }
  };

  const handleAddCoins = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/wallet/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, amount: 100 }),
      });
      if (res.ok) {
        fetchData(user.username);
      }
    } catch (err) {
      console.error("Add coins error:", err);
    }
  };

  const handleWithdraw = async () => {
    if (!user) return;
    if (user.coins < 100) return;
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, amount: 100 }),
      });
      if (res.ok) {
        fetchData(user.username);
      }
    } catch (err) {
      console.error("Withdraw error:", err);
    }
  };

  const handleRefreshOnline = async () => {
    setFetchingOnline(true);
    try {
      const [onlineMatches, onlineStats] = await Promise.all([
        fetchLatestIPLMatches(),
        fetchIPLStats()
      ]);
      
      if (onlineMatches.length > 0) {
        setMatches(onlineMatches);
        // Sync matches with server to prevent betting errors
        await fetch('/api/matches/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ matches: onlineMatches }),
        });
      }
      if (onlineStats) {
        setReports(onlineStats);
      }
    } catch (err) {
      console.error("Refresh online error:", err);
    } finally {
      setFetchingOnline(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return <SignIn onSignIn={handleSignIn} />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Header user={user} onSignOut={handleSignOut} />
          
          <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 pt-8">
            <Routes>
              <Route 
                path="/" 
                element={
                  <Matches 
                    user={user} 
                    matches={matches} 
                    userPicks={userPicks} 
                    onPlacePick={setActiveMatch} 
                    onRefreshOnline={handleRefreshOnline}
                    isFetchingOnline={fetchingOnline}
                  />
                } 
              />
              <Route path="/ranks" element={<Ranks user={user} leaderboard={leaderboard} />} />
              <Route path="/wallet" element={<WalletPage user={user} history={history} onAddCoins={handleAddCoins} onWithdraw={handleWithdraw} />} />
              <Route path="/reports" element={<Reports reports={reports} onRefreshOnline={handleRefreshOnline} isFetchingOnline={fetchingOnline} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>

          <BottomNav />

          <AnimatePresence>
            {activeMatch && (
              <PickModal 
                match={activeMatch} 
                user={user} 
                onClose={() => setActiveMatch(null)} 
                onConfirm={handleConfirmPick} 
              />
            )}
          </AnimatePresence>
        </div>
      </Router>
    </ErrorBoundary>
  );
}
