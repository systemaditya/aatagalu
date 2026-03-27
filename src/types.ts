export type MatchStatus = 'Upcoming' | 'Live' | 'Completed';

export interface Team {
  id: string;
  name: string;
  shortName: string;
  color: string;
  logo: string;
}

export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  startTime: string;
  status: MatchStatus;
  venue: string;
  score?: {
    home: string;
    away: string;
    overs?: string;
    target?: string;
    statusText?: string;
  };
  result?: {
    winnerId: string;
    margin: string;
  };
}

export interface User {
  username: string;
  coins: number;
  joinedAt: string;
}

export interface Pick {
  matchId: string;
  username: string;
  teamId: string;
  timestamp: string;
  status: 'Pending' | 'Won' | 'Lost' | 'Refunded';
}

export interface Transaction {
  id: string;
  username: string;
  matchId?: string;
  amount: number;
  type: 'Bet' | 'Win' | 'Refund' | 'Initial';
  timestamp: string;
  description: string;
}

export const TEAMS: Record<string, Team> = {
  CSK: { id: 'CSK', name: 'Chennai Super Kings', shortName: 'CSK', color: '#FFFF33', logo: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/CSK/logos/Logo-Round-Big/CSK.png' },
  MI: { id: 'MI', name: 'Mumbai Indians', shortName: 'MI', color: '#004BA0', logo: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/MI/logos/Logo-Round-Big/MI.png' },
  RCB: { id: 'RCB', name: 'Royal Challengers Bengaluru', shortName: 'RCB', color: '#2B2A29', logo: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/RCB/logos/Logo-Round-Big/RCB.png' },
  KKR: { id: 'KKR', name: 'Kolkata Knight Riders', shortName: 'KKR', color: '#3A225D', logo: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/KKR/logos/Logo-Round-Big/KKR.png' },
  SRH: { id: 'SRH', name: 'Sunrisers Hyderabad', shortName: 'SRH', color: '#FF822A', logo: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/SRH/logos/Logo-Round-Big/SRH.png' },
  GT: { id: 'GT', name: 'Gujarat Titans', shortName: 'GT', color: '#1B2133', logo: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/GT/logos/Logo-Round-Big/GT.png' },
  PBKS: { id: 'PBKS', name: 'Punjab Kings', shortName: 'PBKS', color: '#D71920', logo: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/PBKS/logos/Logo-Round-Big/PBKS.png' },
  DC: { id: 'DC', name: 'Delhi Capitals', shortName: 'DC', color: '#00008B', logo: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/DC/logos/Logo-Round-Big/DC.png' },
  LSG: { id: 'LSG', name: 'Lucknow Super Giants', shortName: 'LSG', color: '#0057A3', logo: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/LSG/logos/Logo-Round-Big/LSG.png' },
  RR: { id: 'RR', name: 'Rajasthan Royals', shortName: 'RR', color: '#EA1A85', logo: 'https://bcciplayerimages.s3.ap-south-1.amazonaws.com/ipl/RR/logos/Logo-Round-Big/RR.png' },
};
