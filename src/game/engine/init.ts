import { Card, GameState, Player } from '../types';
import { createDeck, shuffleDeck } from './deck';

export const initGame = (id: string, players: Player[], settings: any): GameState => {
  const smallBlindAmount = settings?.smallBlind || 10;
  const activePlayers = players.filter(p => !p.isFolded);
  if (activePlayers.length < 2) {
    throw new Error("Need at least 2 players to start a game");
  }

  let deck = shuffleDeck(createDeck());
  
  // Deal hole cards
  const newPlayers = players.map(p => ({ ...p, cards: [] as Card[], currentBet: 0, totalContribution: 0, isFolded: p.chips <= 0, isAllIn: false, hasActed: false }));
  
  for (let i = 0; i < 2; i++) {
    newPlayers.forEach(p => {
      if (!p.isFolded) {
        p.cards.push(deck.pop()!);
      }
    });
  }

  // Determine dealer, SB, BB for simplicity, dealer is 0 if not set, next is SB, next is BB
  // In a real game, dealer button rotates.
  const dealerIndex = 0; // TODO: rotating dealer
  const smallBlindIndex = (dealerIndex + 1) % newPlayers.length;
  // If 2 players, dealer is SB and other is BB
  const bigBlindIndex = newPlayers.length === 2 ? (dealerIndex + 0) % newPlayers.length : (dealerIndex + 2) % newPlayers.length;

  let state: GameState = {
    id,
    settings: settings || { startingChips: 1000, smallBlind: smallBlindAmount },
    deck,
    communityCards: [],
    players: newPlayers,
    pot: 0,
    sidePots: [],
    currentTurnIndex: 0, // Set after blinds
    dealerIndex,
    smallBlindIndex,
    bigBlindIndex: newPlayers.length === 2 ? 1 : bigBlindIndex,
    round: 'preflop',
    minRaise: smallBlindAmount * 2,
    highestBet: 0,
    isActive: true,
    logs: [{ message: 'Game started', timestamp: Date.now() }],
    turnStartedAt: Date.now(),
    lastActivity: Date.now()
  };

  // Post blinds
  state = postBlinds(state, smallBlindAmount);

  // Set current turn to player after BB
  let turnIdx = (state.bigBlindIndex + 1) % state.players.length;
  while (state.players[turnIdx].isFolded || state.players[turnIdx].isAllIn) {
    turnIdx = (turnIdx + 1) % state.players.length;
  }
  state.currentTurnIndex = turnIdx;

  return state;
};

export const postBlinds = (state: GameState, smallBlindAmount: number): GameState => {
  const newState = { ...state, players: [...state.players] };
  const bbAmount = smallBlindAmount * 2;

  const postBlind = (idx: number, amount: number) => {
    const p = newState.players[idx];
    const actualAmount = Math.min(p.chips, amount);
    p.chips -= actualAmount;
    p.currentBet += actualAmount;
    p.totalContribution += actualAmount;
    if (p.chips === 0) p.isAllIn = true;
    newState.highestBet = Math.max(newState.highestBet, p.currentBet);
    newState.logs.push({ message: `${p.name} posts blind ${actualAmount}`, timestamp: Date.now() });
  };

  if (newState.players.length === 2) {
    // Heads up: dealer is SB, non-dealer is BB
    postBlind(newState.dealerIndex, smallBlindAmount);
    postBlind((newState.dealerIndex + 1) % 2, bbAmount);
    newState.smallBlindIndex = newState.dealerIndex;
    newState.bigBlindIndex = (newState.dealerIndex + 1) % 2;
  } else {
    postBlind(newState.smallBlindIndex, smallBlindAmount);
    postBlind(newState.bigBlindIndex, bbAmount);
  }

  return newState;
};
