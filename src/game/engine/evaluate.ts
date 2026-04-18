import { GameState, Card } from '../types';
import Hand from 'pokersolver';

const formatCard = (c: Card) => `${c.rank}${c.suit}`;

export const evaluateShowdown = (state: GameState): GameState => {
  const newState = { ...state, players: state.players.map(p => ({ ...p })) };
  
  if (!newState.isActive || newState.sidePots.length === 0) return newState;

  const communityStr = newState.communityCards.map(formatCard);
  
  newState.winners = [];
  
  // Calculate winners for each side pot
  // Side pots are in order of amount/creation
  for (let i = 0; i < newState.sidePots.length; i++) {
    const pot = newState.sidePots[i];
    if (pot.amount === 0) continue;

    const eligiblePlayers = newState.players.filter(p => !p.isFolded && pot.eligiblePlayerIds.includes(p.id));
    
    if (eligiblePlayers.length === 1) {
      // Only one player eligible (everyone else folded)
      const winner = eligiblePlayers[0];
      winner.chips += pot.amount;
      newState.winners.push({
        playerIds: [winner.id],
        amount: pot.amount,
        handName: 'Default Winner'
      });
      continue;
    }

    // Evaluate hands
    const hands = eligiblePlayers.map(p => {
      const cards = [...p.cards.map(formatCard), ...communityStr];
      const solved = Hand.Hand.solve(cards);
      solved.playerId = p.id;
      return solved;
    });

    const winners = Hand.Hand.winners(hands);
    const winAmount = Math.floor(pot.amount / winners.length);
    const remainder = pot.amount % winners.length;

    const winnerIds = winners.map((w: any) => w.playerId);
    
    for (const w of winners) {
      const p = newState.players.find(p => p.id === w.playerId)!;
      p.chips += winAmount;
    }

    // Give remainder to out of position player (or just dealer for simplicity)
    if (remainder > 0) {
      newState.players.find(p => p.id === winnerIds[0])!.chips += remainder;
    }

    newState.winners.push({
      playerIds: winnerIds,
      amount: pot.amount,
      handName: winners[0].name
    });
  }

  newState.isActive = false; // Hand over
  newState.logs.push({ message: `Showdown! Winners: ${newState.winners.map(w => w.playerIds.join(', ')).join(' | ')}`, timestamp: Date.now() });

  return newState;
};
