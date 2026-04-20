import { initGame } from './src/game/engine/init';
import { applyAction } from './src/game/engine/actions';
import { Player } from './src/game/types';

const p = (id: string, name: string): Player => ({
  id, name, chips: 1000, cards: [], currentBet: 0,
  totalContribution: 0, isFolded: false, isAllIn: false,
  hasActed: false, isBot: false, buyIn: 1000
});

console.log("=== POKERX FULL GAME TEST ===");
let state = initGame("table1", [p("1", "P1"), p("2", "P2"), p("3", "P3")], { startingChips: 1000, smallBlind: 10, turnTimeoutSeconds: 45 }, 0);

console.log("Initial state dealer:", state.dealerIndex);
console.log("Preflop turn:", state.currentTurnIndex);

function act(type: any, amount?: number) {
   const pName = state.players[state.currentTurnIndex].name;
   console.log(`[${state.round}] ${pName} does ${type} ${amount ? amount : ''}`);
   state = applyAction(state, { playerId: state.players[state.currentTurnIndex].id, type, amount });
}

// Preflop 
act('call'); // P3 calls 20
act('call'); // P1 calls 10 (to 20)
act('check'); // P2 checks 20

console.log("Pot:", state.pot, "SidePots:", state.sidePots.length);
console.log("Round:", state.round);

// Flop
if (state.round === 'flop') {
    act('check'); // P1 (SB) acts first
    act('check'); // P2
    act('bet', 20); // P3 bets 20
    act('call'); // P1 calls 20
    act('fold'); // P2 folds
    
    console.log("Pot:", state.pot, "Active round:", state.round);
}

// Turn
if (state.round === 'turn') {
    act('check'); // P1
    act('raise', 40); // P3 bets 40
    act('call'); // P1 calls 40
    console.log("Pot:", state.pot, "Round:", state.round);
}

// River
if (state.round === 'river') {
    act('all-in'); // P1 goes all in
    act('all-in'); // P3 goes all in
}

console.log("Final active state:", state.isActive);
console.log("Winners:", JSON.stringify(state.winners));
