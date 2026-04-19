import { GameState } from '../types';
import { createSidePots } from './pot';
import { evaluateShowdown } from './evaluate';

export const advanceRound = (state: GameState): GameState => {
  let newState = createSidePots(state); // recalculates pot and zeroes out currentBets appropriately
  // Note: createSidePots shouldn't zero out currentbets if we want to keep them for logging, but we need them clean for next round.
  // Actually, we should clean them.
  newState.players = newState.players.map(p => ({ ...p, currentBet: 0, hasActed: false }));
  newState.highestBet = 0;
  newState.minRaise = newState.settings.smallBlind * 2; // Reset minRaise to 1 Big Blind

  // Check if hand is already over (everyone folded except 1 or everyone all in)
  const activeUnfolded = newState.players.filter(p => !p.isFolded);
  if (activeUnfolded.length <= 1) {
    // 1 player left, fast forward to showdown
    return evaluateShowdown(newState);
  }

  const playersNotAllIn = activeUnfolded.filter(p => !p.isAllIn);
  if (playersNotAllIn.length <= 1) {
    // 0 or 1 player not all in, while others are all in. Still could be active, just need to deal cards.
    // We can auto-advance all rounds.
  }

  switch (newState.round) {
    case 'preflop':
      newState.round = 'flop';
      newState.communityCards = [newState.deck.pop()!, newState.deck.pop()!, newState.deck.pop()!];
      break;
    case 'flop':
      newState.round = 'turn';
      newState.communityCards.push(newState.deck.pop()!);
      break;
    case 'turn':
      newState.round = 'river';
      newState.communityCards.push(newState.deck.pop()!);
      break;
    case 'river':
      newState.round = 'showdown';
      return evaluateShowdown(newState);
    default:
      return newState;
  }

  // Set turn to first player after dealer
  let turnIdx = (newState.dealerIndex + 1) % newState.players.length;
  // If we are auto advancing, don't enter an infinite loop
  let playersChecked = 0;
  while ((newState.players[turnIdx].isFolded || newState.players[turnIdx].isAllIn) && playersChecked < newState.players.length) {
    turnIdx = (turnIdx + 1) % newState.players.length;
    playersChecked++;
  }
  newState.currentTurnIndex = turnIdx;

  if (playersNotAllIn.length <= 1) {
    return advanceRound(newState);
  }

  newState.logs.push({ message: `Dealt ${newState.round}`, timestamp: Date.now() });

  return newState;
};
