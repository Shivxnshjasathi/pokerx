import { Card, GameState, Player } from '../types';
import { createDeck, shuffleDeck } from './deck';

export const initGame = (id: string, players: Player[], settings: any, prevDealerIndex?: number): GameState => {
  const smallBlindAmount = settings?.smallBlind || 10;
  
  // Clean players for new hand
  const newPlayers = players.map(p => ({ ...p, cards: [] as Card[], currentBet: 0, totalContribution: 0, isFolded: p.chips <= 0, isAllIn: false, hasActed: false }));
  
  const activePlayersCount = newPlayers.filter(p => !p.isFolded).length;
  if (activePlayersCount < 2) {
    throw new Error("Need at least 2 players with chips to start a game");
  }

  let deck = shuffleDeck(createDeck());
  
  // Helper to find next active player
  const findNextActive = (startIdx: number): number => {
    let current = startIdx % newPlayers.length;
    let loops = 0;
    while (newPlayers[current].isFolded && loops < newPlayers.length) {
      current = (current + 1) % newPlayers.length;
      loops++;
    }
    return current;
  };

  // Determine dealer index
  let dealerIndex = findNextActive(typeof prevDealerIndex === 'number' ? prevDealerIndex + 1 : 0);
  
  // Blinds calculation
  let smallBlindIndex, bigBlindIndex;
  
  if (activePlayersCount === 2) {
    smallBlindIndex = dealerIndex;
    bigBlindIndex = findNextActive(dealerIndex + 1);
  } else {
    smallBlindIndex = findNextActive(dealerIndex + 1);
    bigBlindIndex = findNextActive(smallBlindIndex + 1);
  }

  // Deal hole cards
  for (let i = 0; i < 2; i++) {
    newPlayers.forEach(p => {
      if (!p.isFolded) {
        p.cards.push(deck.pop()!);
      }
    });
  }

  let state: GameState = {
    id,
    settings: settings || { startingChips: 1000, smallBlind: smallBlindAmount },
    deck,
    communityCards: [],
    players: newPlayers,
    pot: 0,
    sidePots: [],
    currentTurnIndex: 0,
    dealerIndex,
    smallBlindIndex,
    bigBlindIndex,
    round: 'preflop',
    minRaise: smallBlindAmount * 2, // BB amount
    highestBet: 0,
    isActive: true,
    logs: [{ message: 'New Hand Started', timestamp: Date.now() }],
    turnStartedAt: Date.now(),
    lastActivity: Date.now()
  };

  // Post blinds
  state = postBlinds(state, smallBlindAmount);

  // Set current turn to player after BB (or dealer in heads-up)
  let turnIdx = (state.bigBlindIndex + 1) % state.players.length;
  if (activePlayersCount === 2) {
    turnIdx = state.dealerIndex;
  }

  let safety = 0;
  while ((state.players[turnIdx].isFolded || state.players[turnIdx].isAllIn) && safety < state.players.length) {
    turnIdx = (turnIdx + 1) % state.players.length;
    safety++;
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
