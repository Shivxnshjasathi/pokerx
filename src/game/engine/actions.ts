import { Action, GameState } from '../types';
import { advanceRound } from './round';
import { evaluateShowdown } from './evaluate';

export const applyAction = (state: GameState, action: Action): GameState => {
  const newState = { ...state, players: state.players.map(p => ({ ...p })), logs: [...state.logs] };
  let amount = action.amount || 0;

  // Non-turn based actions (Join, Leave, Top-up)
  if (action.type === 'join') {
    if (newState.players.some(p => p.id === action.playerId)) return newState;
    if (newState.players.length >= 6) throw new Error("Table is full");
    
    newState.players.push({
      id: action.playerId,
      name: action.payload?.name || "Player",
      chips: newState.settings.startingChips,
      buyIn: newState.settings.startingChips,
      cards: [],
      currentBet: 0,
      totalContribution: 0,
      isFolded: false,
      isAllIn: false,
      hasActed: false,
      isBot: false,
    });
    newState.logs.push({ message: `${action.payload?.name || "Player"} joined the table`, timestamp: Date.now() });
    newState.lastActivity = Date.now();
    return newState;
  }

  if (action.type === 'leave') {
    newState.players = newState.players.filter(p => p.id !== action.playerId);
    newState.logs.push({ message: `A player left the table`, timestamp: Date.now() });
    
    // If table becomes empty, or game was active and current player left, handle it?
    // For now keep it simple: just remove. logic will skip their turn.
    newState.lastActivity = Date.now();
    return newState;
  }

  if (action.type === 'top-up') {
    const p = newState.players.find(p => p.id === action.playerId);
    if (!p) throw new Error("Player not found");
    p.chips += amount;
    p.buyIn += amount;
    newState.logs.push({ message: `${p.name} topped up ${amount}`, timestamp: Date.now() });
    newState.lastActivity = Date.now();
    return newState;
  }

  if (!state.isActive) throw new Error("Game is not active");
  if (state.players[state.currentTurnIndex].id !== action.playerId) {
    throw new Error("Not your turn");
  }

  const player = newState.players[newState.currentTurnIndex];
  player.hasActed = true;


  switch (action.type) {
    case 'fold':
      player.isFolded = true;
      newState.logs.push({ message: `${player.name} folds`, timestamp: Date.now() });
      break;
    case 'check':
      if (player.currentBet < newState.highestBet) {
        throw new Error("Cannot check, must call or raise");
      }
      newState.logs.push({ message: `${player.name} checks`, timestamp: Date.now() });
      break;
    case 'call':
      const callAmount = newState.highestBet - player.currentBet;
      if (callAmount === 0) {
        throw new Error("Cannot call, nothing to call (check instead)");
      }
      const actualCall = Math.min(callAmount, player.chips);
      player.chips -= actualCall;
      player.currentBet += actualCall;
      player.totalContribution += actualCall;
      if (player.chips === 0) player.isAllIn = true;
      newState.logs.push({ message: `${player.name} calls ${actualCall}`, timestamp: Date.now() });
      break;
    case 'bet':
    case 'raise':
      const raiseTo = amount;
      if (raiseTo < newState.highestBet + newState.minRaise) {
        if (raiseTo < player.chips + player.currentBet) {
          throw new Error(`Minimum raise corresponds to bringing total bet to ${newState.highestBet + newState.minRaise}`);
        }
      }
      
      const additionalAmount = raiseTo - player.currentBet;
      if (additionalAmount > player.chips) {
        throw new Error("Not enough chips");
      }

      player.chips -= additionalAmount;
      player.currentBet += additionalAmount;
      player.totalContribution += additionalAmount;
      if (player.chips === 0) player.isAllIn = true;
      
      const raiseAmount = player.currentBet - newState.highestBet;
      if (raiseAmount > 0) {
        newState.minRaise = Math.max(newState.minRaise, raiseAmount);
        newState.highestBet = player.currentBet;
      }
      newState.logs.push({ message: `${player.name} ${action.type}s to ${player.currentBet}`, timestamp: Date.now() });
      break;
    case 'all-in':
      const allInAmount = player.chips;
      player.chips = 0;
      player.currentBet += allInAmount;
      player.totalContribution += allInAmount;
      player.isAllIn = true;
      if (player.currentBet > newState.highestBet) {
        const raiseVal = player.currentBet - newState.highestBet;
        newState.minRaise = Math.max(newState.minRaise, raiseVal);
        newState.highestBet = player.currentBet;
      }
      newState.logs.push({ message: `${player.name} goes all in for ${allInAmount}`, timestamp: Date.now() });
      break;
  }

  const processedState = calculateNextTurn(newState);
  if (processedState.currentTurnIndex !== state.currentTurnIndex || processedState.round !== state.round) {
    processedState.turnStartedAt = Date.now();
  }
  processedState.lastActivity = Date.now();
  return processedState;
};

export const calculateNextTurn = (state: GameState): GameState => {
  const activePlayers = state.players.filter(p => !p.isFolded);
  if (activePlayers.length === 1) {
    return evaluateShowdown(state);
  }

  // Check if round is over
  // A round is over if everyone who is not folded and not all in has matched the highest bet
  const notFolded = state.players.filter(p => !p.isFolded);
  const actingPlayers = notFolded.filter(p => !p.isAllIn);
  
  const allActingMatched = actingPlayers.every(p => p.currentBet === state.highestBet && p.hasActed);
  
  if (allActingMatched) {
    return advanceRound(state);
  }

  let nextIdx = (state.currentTurnIndex + 1) % state.players.length;
  let loops = 0;
  
  while ((state.players[nextIdx].isFolded || state.players[nextIdx].isAllIn) && loops < state.players.length) {
    nextIdx = (nextIdx + 1) % state.players.length;
    loops++;
  }

  if (loops >= state.players.length) {
    return advanceRound(state);
  }

  state.currentTurnIndex = nextIdx;
  state.turnStartedAt = Date.now();
  return state;
};
