export type Suit = 'h' | 'd' | 'c' | 's'; // hearts, diamonds, clubs, spades
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  rank: Rank;
}

export type Round = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

export interface Player {
  id: string;
  name: string;
  chips: number;
  cards: Card[];
  currentBet: number;
  totalContribution: number;
  isFolded: boolean;
  isAllIn: boolean;
  hasActed: boolean;
  buyIn: number; // Tally of total chips bought into the table
}

export interface SidePot {
  amount: number;
  eligiblePlayerIds: string[];
}

export interface GameLog {
  message: string;
  timestamp: number;
}

export interface GameSettings {
  startingChips: number;
  smallBlind: number;
}

export interface GameState {
  id: string; // the table id
  settings: GameSettings;
  deck: Card[];
  communityCards: Card[];
  players: Player[];
  pot: number;
  sidePots: SidePot[];
  currentTurnIndex: number;
  dealerIndex: number;
  smallBlindIndex: number;
  bigBlindIndex: number;
  round: Round;
  minRaise: number;
  highestBet: number;
  isActive: boolean; // Is a hand currently being played?
  logs: GameLog[];
  winners?: {
    playerIds: string[];
    amount: number;
    handName: string;
  }[];
}

export type ActionType = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in' | 'top-up';

export interface Action {
  playerId: string;
  type: ActionType;
  amount?: number;
}
