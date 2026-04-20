import { initGame } from './src/game/engine/init';
import { applyAction } from './src/game/engine/actions';
import { Player } from './src/game/types';

const p = (id: string, name: string): Player => ({
  id,
  name,
  chips: 1000,
  cards: [],
  currentBet: 0,
  totalContribution: 0,
  isFolded: false,
  isAllIn: false,
  hasActed: false,
  isBot: false,
  buyIn: 1000
});

console.log("--- TEST PREFLOP HEADS UP ---");
let state = initGame("table1", [p("1", "A"), p("2", "B")], { startingChips: 1000, smallBlind: 10 }, 0);
console.log("Dealer:", state.dealerIndex);
console.log("Turn starts with:", state.currentTurnIndex);
console.log("SB:", state.smallBlindIndex, "BB:", state.bigBlindIndex);
try {
  state = applyAction(state, { playerId: state.players[state.currentTurnIndex].id, type: 'call' });
  console.log("After call, turn is:", state.currentTurnIndex);
  state = applyAction(state, { playerId: state.players[state.currentTurnIndex].id, type: 'check' });
  console.log("After check, Round:", state.round, "Turn:", state.currentTurnIndex);
} catch (e) {
  console.error("Error in heads up:", e);
}

console.log("\n--- TEST PREFLOP 3-WAY ---");
state = initGame("table2", [p("1", "A"), p("2", "B"), p("3", "C")], { startingChips: 1000, smallBlind: 10 }, 0);
console.log("Dealer:", state.dealerIndex);
console.log("SB:", state.smallBlindIndex, "BB:", state.bigBlindIndex);
console.log("Turn starts with:", state.currentTurnIndex);
try {
  let actions = ['call', 'call', 'check'];
  for (let a of actions) {
    if (state.round !== 'preflop') break;
    console.log(`Player ${state.currentTurnIndex} does ${a}`);
    state = applyAction(state, { playerId: state.players[state.currentTurnIndex].id, type: a as any });
  }
  console.log("After checking, Round is:", state.round, "Turn is:", state.currentTurnIndex);
} catch (e) { console.error(e); }

console.log("\n--- TEST POSTFLOP TURN ADVANCEMENT (BUG?) ---");
try {
    console.log(`Flop Turn is: ${state.currentTurnIndex}`);
    console.log(`Player ${state.currentTurnIndex} (Dealer=${state.dealerIndex}) checks`);
    state = applyAction(state, { playerId: state.players[state.currentTurnIndex].id, type: 'check' });
    console.log(`Next turn is: ${state.currentTurnIndex}`);
    state = applyAction(state, { playerId: state.players[state.currentTurnIndex].id, type: 'check' });
    console.log(`Next turn is: ${state.currentTurnIndex}`);
    state = applyAction(state, { playerId: state.players[state.currentTurnIndex].id, type: 'check' });
    console.log(`Next Round is: ${state.round}, Turn is: ${state.currentTurnIndex}`);
} catch (e) {
    console.error("Error postflop: ", e);
}

