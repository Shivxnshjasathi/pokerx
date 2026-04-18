import { GameState, Action, Player } from '../types';
import { Hand } from 'pokersolver';

/**
 * Returns a simple poker card string (e.g. 'Ah', 'Kd') for pokersolver
 */
const toHandNotation = (cards: { rank: string, suit: string }[]) => {
  return cards.map(c => `${c.rank}${c.suit}`);
};

/**
 * A simple AI heuristic function for the bot
 */
export const getBotAction = (state: GameState, botId: string): Action => {
  const bot = state.players.find(p => p.id === botId);
  if (!bot) return { playerId: botId, type: 'fold' };

  const currentCallAmount = state.highestBet - bot.currentBet;
  const potSize = state.pot;
  
  // Basic logic:
  // If we have community cards, evaluate hand strength
  let strength = 0; // 0 to 10 scale
  
  if (state.communityCards.length > 0) {
    const fullHand = toHandNotation([...bot.cards, ...state.communityCards]);
    const solved = Hand.solve(fullHand);
    const rank = solved.rank; // 0 to 9 usually

    // Rank 0: High Card
    // Rank 1: Pair
    // Rank 2: Two Pair
    // Rank 3: Trips
    // ...
    // Rank 9: Royal Flush
    strength = rank;
  } else {
    // Hole cards strength (simplistic)
    const isPair = bot.cards[0].rank === bot.cards[1].rank;
    const isBig = ['A', 'K', 'Q', 'J', 'T'].includes(bot.cards[0].rank) || ['A', 'K', 'Q', 'J', 'T'].includes(bot.cards[1].rank);
    if (isPair) strength = 3;
    else if (isBig) strength = 1.5;
    else strength = 0.5;
  }

  // Randomness factor
  const randomness = Math.random() * 2;
  const decisionFactor = strength + randomness;

  // Decide action based on factor
  if (decisionFactor < 1 && currentCallAmount > 0) {
    return { playerId: botId, type: 'fold' };
  } else if (decisionFactor < 3) {
    return currentCallAmount === 0 ? { playerId: botId, type: 'check' } : { playerId: botId, type: 'call' };
  } else if (decisionFactor < 6) {
    // Raise a bit
    const raiseAmt = state.settings.smallBlind * 2;
    if (bot.chips > state.highestBet + raiseAmt) {
        return { playerId: botId, type: 'raise', amount: state.highestBet + raiseAmt };
    }
    return { playerId: botId, type: 'call' };
  } else {
    // Strong hand - All in or big raise
    if (Math.random() > 0.7) {
        return { playerId: botId, type: 'all-in' };
    }
    return { playerId: botId, type: 'call' };
  }
};
