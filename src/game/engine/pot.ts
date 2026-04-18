import { GameState, SidePot } from '../types';

export const createSidePots = (state: GameState): GameState => {
  const newState = { ...state, players: state.players.map(p => ({ ...p })) };
  
  // Sort players by total contribution to pot (only those who have contributed)
  const contributors = newState.players
    .filter(p => p.totalContribution > 0)
    .sort((a, b) => a.totalContribution - b.totalContribution);

  if (contributors.length === 0) return newState;

  let currentSidePots: SidePot[] = [];
  let previousContribution = 0;

  for (let i = 0; i < contributors.length; i++) {
    const p = contributors[i];
    const marginalContribution = p.totalContribution - previousContribution;
    
    if (marginalContribution > 0) {
      let potAmount = 0;
      let eligiblePlayerIds = [];

      for (const other of newState.players) {
        if (other.totalContribution >= previousContribution + marginalContribution) {
          potAmount += marginalContribution;
          if (!other.isFolded) {
            eligiblePlayerIds.push(other.id);
          }
        } else if (other.totalContribution > previousContribution) {
          const partialMarginal = other.totalContribution - previousContribution;
          potAmount += partialMarginal;
          // they don't get entry into this side pot if they folded, 
          // or if they are all-in with less than this fully, their pot was already created earlier.
        }
      }

      if (potAmount > 0) {
        currentSidePots.push({
          amount: potAmount,
          eligiblePlayerIds
        });
      }
      
      previousContribution += marginalContribution;
    }
  }

  // Update state pot and side pots
  newState.sidePots = currentSidePots;
  
  // Clean up currentBets for the new betting round
  const totalPot = currentSidePots.reduce((acc, sp) => acc + sp.amount, 0);
  newState.pot = totalPot;

  return newState;
};
