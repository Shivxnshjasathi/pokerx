import { GameState, Action } from '../game/types';
import { PlayerSeat } from './PlayerSeat';
import { CardView } from './CardView';
import { Coins, Loader2 } from 'lucide-react';

interface TableProps {
  gameState: GameState | null;
  playerId: string;
  onAction: (action: Action) => void;
}

export const Table = ({ gameState, playerId, onAction }: TableProps) => {
  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  // Predefined positions for 6 players (vertical oval layout)
  const positions = [
    "bottom-0 translate-y-1/2 left-1/2 -translate-x-1/2", // self/bottom
    "bottom-1/4 -left-6 md:-left-12 translate-y-8", // bottom left
    "top-1/4 -left-6 md:-left-12 -translate-y-8", // top left
    "top-0 -translate-y-1/2 left-1/2 -translate-x-1/2", // top
    "top-1/4 -right-6 md:-right-12 -translate-y-8", // top right
    "bottom-1/4 -right-6 md:-right-12 translate-y-8", // bottom right
  ];

  // Rotate players so current user is at bottom (index 0)
  const myIndex = gameState.players.findIndex(p => p.id === playerId);
  const orderedPlayers = myIndex >= 0 
    ? [...gameState.players.slice(myIndex), ...gameState.players.slice(0, myIndex)]
    : gameState.players;

  const me = gameState.players[myIndex];
  const isMyTurn = gameState.currentTurnIndex === myIndex && gameState.isActive && !me?.isFolded && !me?.isAllIn;

  return (
    <div className="relative w-full max-w-sm sm:max-w-4xl mx-auto h-[600px] sm:h-[800px] flex items-center justify-center p-4 sm:p-12 mt-12 sm:mt-0">
      
      {/* Table Background */}
      <div className="absolute inset-2 sm:inset-12 bg-gradient-to-b from-[#1c7e4b] to-[#0d3f23] rounded-[200px] shadow-[inset_0_20px_100px_rgba(0,0,0,0.8),_0_20px_50px_rgba(0,0,0,0.6)] border-[12px] sm:border-[24px] border-[#181a20] flex items-center justify-center">
        
        {/* Inner Table Ring */}
        <div className="absolute inset-[6%] rounded-[200px] border border-[#2a9c60] opacity-40 pointer-events-none"></div>

        {/* Table Logo / Center Text */}
        <div className="absolute bottom-[20%] text-center pointer-events-none flex flex-col items-center">
          <div className="text-[10px] md:text-sm font-semibold tracking-wider text-white/30 uppercase italic">
            {gameState.settings?.smallBlind || 10}/{ (gameState.settings?.smallBlind || 10) * 2 } - Hold'em
          </div>
          <div className="text-[9px] md:text-xs font-bold tracking-widest text-[#2a9c60] mt-1 shadow-inner px-4 p-1 rounded-full bg-black/20 uppercase flex items-center space-x-1">
            <span className="opacity-50 text-[8px]">★</span>
            <span>Rank {gameState.players.length}</span>
          </div>
        </div>

        {/* Pot & Community Cards */}
        <div className="relative z-10 flex flex-col items-center -mt-8 max-w-[280px]">
          
          <div className="flex flex-col items-center mb-6 z-20">
            <div className="flex items-center space-x-1 -mb-1">
               <Coins className="w-5 h-5 text-red-500 fill-red-500" />
               <span className="text-white font-bold text-lg">{gameState.pot}</span>
            </div>
            <div className="text-emerald-400 font-bold text-sm tracking-widest uppercase bg-black/40 px-3 py-[2px] rounded-full border border-emerald-500/30">
              Pot
            </div>
          </div>
          
          <div className="flex -space-x-2 md:space-x-2 relative z-10">
            {(gameState.communityCards || []).map((card, i) => (
              <div key={i} className="animate-in slide-in-from-top-4 fade-in duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                <CardView card={card} className="md:scale-100" />
              </div>
            ))}
            {/* Empty slots */}
            {Array.from({ length: 5 - (gameState.communityCards?.length || 0) }).map((_, i) => (
              <div key={`empty-${i}`} className="w-14 h-20 md:w-16 md:h-24 border border-white/10 rounded-lg bg-black/10" />
            ))}
          </div>

          {(gameState.sidePots || []).length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {(gameState.sidePots || []).map((sp, i) => (
                <div key={i} className="text-xs bg-indigo-900/80 px-2 py-1 rounded text-indigo-200 uppercase font-semibold">
                  Side Pot: ${sp.amount}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Players */}
      {orderedPlayers.map((player, i) => {
        // Original index in game state for logic
        const stateIndex = gameState.players.findIndex(p => p.id === player.id);
        const isActiveTurn = gameState.currentTurnIndex === stateIndex && gameState.isActive;
        const isDealer = gameState.dealerIndex === stateIndex;
        // Show cards if it's me, or if game is inactive (showdown round basically)
        const showCards = !gameState.isActive;
        
        return (
          <PlayerSeat
            key={player.id}
            player={player}
            isActiveTurn={isActiveTurn}
            isDealer={isDealer}
            positionClass={positions[i % positions.length]}
            isSelf={player.id === playerId}
            showCards={showCards}
          />
        );
      })}

      {/* Action Controls */}
      {isMyTurn && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-transparent z-40 animate-in slide-in-from-bottom fade-in flex justify-between space-x-2 sm:space-x-4 max-w-sm sm:max-w-4xl mx-auto backdrop-blur-sm sm:backdrop-blur-none">
          <button onClick={() => onAction({ playerId, type: 'fold' })} className="flex-1 py-4 bg-[#a62b1a] shadow-[inset_0_2px_rgba(255,255,255,0.2)] text-white rounded font-bold uppercase tracking-wide hover:brightness-110 active:scale-95 transition-all text-sm sm:text-base">
            Fold
          </button>
          
          {gameState.highestBet === me.currentBet ? (
            <button onClick={() => onAction({ playerId, type: 'check' })} className="flex-1 py-4 bg-[#0d7346] shadow-[inset_0_2px_rgba(255,255,255,0.2)] text-white rounded font-bold uppercase tracking-wide hover:brightness-110 active:scale-95 transition-all text-sm sm:text-base">
              Check
            </button>
          ) : (
            <button onClick={() => onAction({ playerId, type: 'call' })} className="flex-1 py-4 bg-[#0d7346] shadow-[inset_0_2px_rgba(255,255,255,0.2)] text-white rounded font-bold uppercase tracking-wide hover:brightness-110 active:scale-95 transition-all flex flex-col items-center justify-center leading-tight text-sm sm:text-base">
              <span>Call</span>
              <span className="text-xs font-semibold opacity-80">{gameState.highestBet - me.currentBet}</span>
            </button>
          )}

          <button onClick={() => {
            const raiseAmt = prompt(`Raise to what amount? (Your chips: ${me.chips}, Min: ${gameState.highestBet + gameState.minRaise})`);
            if (raiseAmt) {
               const amt = parseInt(raiseAmt);
               if (amt === me.chips) onAction({ playerId, type: 'all-in' });
               else onAction({ playerId, type: 'raise', amount: amt });
            }
          }} className="flex-1 py-4 bg-[#c87612] shadow-[inset_0_2px_rgba(255,255,255,0.2)] text-white rounded font-bold uppercase tracking-wide hover:brightness-110 active:scale-95 transition-all text-sm sm:text-base">
            Raise
          </button>
        </div>
      )}

      {/* Showdown Winners Overlay */}
      {!gameState.isActive && gameState.winners && gameState.winners.length > 0 && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in cursor-pointer" onClick={() => {/* can click to hide */}}>
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/20 p-8 rounded-3xl shadow-2xl max-w-lg w-full text-center scale-in">
            <h2 className="text-4xl font-black text-amber-400 mb-6 uppercase tracking-widest drop-shadow-lg">Showdown</h2>
            <div className="space-y-4">
              {gameState.winners.map((w, i) => (
                <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="text-2xl font-bold text-white mb-1">
                    {w.playerIds.map(id => gameState.players.find(p => p.id === id)?.name).join(' & ')}
                  </div>
                  <div className="text-emerald-400 font-bold text-xl mb-2">Wins ${w.amount}</div>
                  <div className="text-slate-400 text-sm italic uppercase tracking-wider font-semibold">{w.handName}</div>
                </div>
              ))}
            </div>
            {/* If host, show button to next hand */}
          </div>
        </div>
      )}
    </div>
  );
};
