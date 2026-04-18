import React, { useState, useEffect } from 'react';
import { GameState, Action } from '../game/types';
import { PlayerSeat } from './PlayerSeat';
import { CardView, cn } from './CardView';
import { Coins, Loader2, Trophy, Clock, Volume2, Home, Power } from 'lucide-react';

interface TableProps {
  gameState: GameState | null;
  playerId: string;
  onAction: (action: Action) => void;
}

export const Table = ({ gameState, playerId, onAction }: TableProps) => {
  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07361c]">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  // Position players similar to the image (Optimized for both Portrait and Landscape)
  const positions = [
    "bottom-[2%] sm:bottom-[12%] left-1/2 -translate-x-1/2", // self
    "bottom-[30%] -left-2 sm:-left-10",         // left middle
    "top-[10%] -left-2 sm:-left-6",            // left top
    "top-[2%] left-1/2 -translate-x-1/2 scale-[0.6] sm:scale-100", // top center
    "top-[10%] -right-2 sm:-right-6",          // right top
    "bottom-[30%] -right-2 sm:-right-10",        // right middle
  ];

  const myIndex = gameState.players.findIndex(p => p.id === playerId);
  const orderedPlayers = myIndex >= 0 
    ? [...gameState.players.slice(myIndex), ...gameState.players.slice(0, myIndex)]
    : gameState.players;

  const me = gameState.players[myIndex];
  const isMyTurn = gameState.currentTurnIndex === myIndex && gameState.isActive && !me?.isFolded && !me?.isAllIn;

  const minRaiseTo = gameState.highestBet + gameState.minRaise;
  const maxRaiseTo = me?.chips || 0;

  const [showRaiseUI, setShowRaiseUI] = useState(false);
  const [betValue, setBetValue] = useState(minRaiseTo);

  useEffect(() => {
    if (isMyTurn) {
      setBetValue(minRaiseTo);
    }
  }, [isMyTurn, minRaiseTo]);

  const lastLog = gameState.logs?.[gameState.logs.length - 1]?.message;

  return (
    <div className="relative w-full max-w-6xl mx-auto h-[100dvh] sm:h-[90vh] flex flex-col items-center justify-center overflow-hidden">
      
      {/* HUD Icons (Top) */}
      <div className="absolute top-4 left-4 sm:top-10 sm:left-20 z-50">
         <button className="bg-black border border-white/20 p-2 rounded-lg shadow-xl hover:bg-slate-900 transition-colors">
            <Home className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
         </button>
      </div>
      <div className="absolute top-4 right-4 sm:top-10 sm:right-20 z-50">
         <button className="bg-black border border-white/20 p-2 rounded-lg shadow-xl hover:bg-slate-900 transition-colors">
            <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
         </button>
      </div>

      {/* Main Table Felt Background (No oval, just solid green as requested) */}
      <div className="absolute inset-x-0 top-0 bottom-0 bg-[#074723] z-0 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '15px 15px' }}></div>
        {/* Soft center glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0,transparent_60%)]"></div>
      </div>

      {/* Pot Display (Large text in center) */}
      <div className="relative z-10 -mt-16 sm:-mt-20 flex flex-col items-center scale-75 sm:scale-100 landscape:scale-[0.6] sm:landscape:scale-100">
         <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-6 bg-black/20 rounded-full blur-xl absolute -top-4"></div>
            <div className="text-white font-black text-4xl sm:text-7xl tracking-tighter drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] mb-4">
               ${gameState.pot.toLocaleString()}
            </div>
            
            {/* Top Chip Pile */}
            <div className="relative w-12 h-14 translate-y-2">
               <div className="absolute bottom-0 left-0 w-8 h-8 rounded-full bg-slate-300 border border-black/20 shadow-md transform -translate-y-0 opacity-40"></div>
               <div className="absolute bottom-1 left-0 w-8 h-8 rounded-full bg-slate-300 border border-black/20 shadow-md transform -translate-y-1"></div>
               <div className="absolute bottom-2 left-0 w-8 h-8 rounded-full bg-slate-300 border border-black/20 shadow-md transform -translate-y-2"></div>
               <div className="absolute bottom-3 left-0 w-8 h-8 rounded-full bg-slate-300 border border-black/20 shadow-md transform -translate-y-3"></div>
            </div>
         </div>

         {/* Community Cards (Modern layout with spacing) */}
         <div className="flex space-x-1.5 sm:space-x-3 mt-4">
            {(gameState.communityCards || []).map((card, i) => (
              <div key={i} className="animate-in slide-in-from-bottom duration-700">
                <CardView card={card} className="shadow-2xl border-white/20" />
              </div>
            ))}
            {Array.from({ length: 5 - (gameState.communityCards?.length || 0) }).map((_, i) => (
              <div key={i} className="w-14 h-20 sm:w-16 sm:h-24 rounded-lg bg-black/10 border-2 border-dashed border-white/5" />
            ))}
         </div>
      </div>

      {/* Players Ring */}
      <div className="absolute inset-0 pointer-events-none">
          {orderedPlayers.map((player, i) => (
            <PlayerSeat
              key={player.id}
              player={player}
              isActiveTurn={gameState.currentTurnIndex === gameState.players.findIndex(p => p.id === player.id) && gameState.isActive}
              isDealer={gameState.dealerIndex === gameState.players.findIndex(p => p.id === player.id)}
              positionClass={positions[i % positions.length]}
              isSelf={player.id === playerId}
              showCards={!gameState.isActive}
              turnStartedAt={gameState.turnStartedAt}
              turnTimeoutSeconds={gameState.settings?.turnTimeoutSeconds || 15}
              lastLog={lastLog}
            />
          ))}
      </div>

      {/* Action Controls - Large Black Rounded Buttons */}
      {isMyTurn && (
        <div className="fixed bottom-4 sm:bottom-10 left-0 right-0 flex flex-col items-center z-[70] px-4 pointer-events-auto landscape:bottom-2">
          {showRaiseUI && (
            <div className="bg-black/90 backdrop-blur-xl border border-white/10 p-4 sm:p-6 rounded-3xl mb-4 w-full max-w-md shadow-2xl animate-in slide-in-from-bottom duration-300 landscape:p-3 landscape:mb-2">
               <div className="flex justify-between items-center mb-4 landscape:mb-2">
                  <span className="text-white font-black text-xl sm:text-2xl">${betValue}</span>
                  <span className="text-slate-500 text-[9px] uppercase font-bold tracking-widest">Raise Amount</span>
               </div>
               <input 
                  type="range"
                  min={minRaiseTo}
                  max={maxRaiseTo}
                  step={10}
                  value={betValue}
                  onChange={(e) => setBetValue(parseInt(e.target.value))}
                  className="w-full h-1.5 sm:h-2.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-white mb-4 landscape:mb-2"
               />
               <button 
                onClick={() => {
                    if (betValue >= me.chips) onAction({ playerId, type: 'all-in' });
                    else onAction({ playerId, type: 'raise', amount: betValue });
                    setShowRaiseUI(false);
                }}
                className="w-full py-3 bg-white text-black rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all active:scale-95"
               >
                 Confirm Raise
               </button>
            </div>
          )}

          <div className="flex space-x-2 sm:space-x-4 w-full max-w-xl landscape:max-w-md">
             <button onClick={() => onAction({ playerId, type: 'fold' })} className="flex-1 py-3 sm:py-4 bg-black border border-white/20 text-white rounded-xl font-bold uppercase tracking-widest text-[9px] sm:text-xs hover:bg-slate-900 transition-all active:scale-95 shadow-2xl">
               Fold
             </button>
             
             {gameState.highestBet === me.currentBet ? (
               <button onClick={() => onAction({ playerId, type: 'check' })} className="flex-1 py-3 sm:py-4 bg-black border border-white/20 text-white rounded-xl font-bold uppercase tracking-widest text-[9px] sm:text-xs hover:bg-slate-900 transition-all active:scale-95 shadow-2xl">
                 Check
               </button>
             ) : (
               <button onClick={() => onAction({ playerId, type: 'call' })} className="flex-1 py-3 sm:py-4 bg-black border border-white/20 text-white rounded-xl font-bold uppercase tracking-widest text-[9px] sm:text-xs hover:bg-slate-900 transition-all active:scale-95 shadow-2xl">
                 Call
               </button>
             )}

             <button 
                onClick={() => setShowRaiseUI(!showRaiseUI)} 
                className={cn(
                    "flex-1 py-3 sm:py-4 bg-black border border-white/20 text-white rounded-xl font-bold uppercase tracking-widest text-[9px] sm:text-xs hover:bg-slate-900 transition-all active:scale-95 shadow-2xl",
                    showRaiseUI && "bg-slate-800"
                )}
             >
                {showRaiseUI ? "X" : "Raise"}
             </button>
          </div>
        </div>
      )}

      {/* Showdown Winners Overlay */}
      {!gameState.isActive && gameState.winners && gameState.winners.length > 0 && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-500">
          <div className="bg-white p-10 rounded-[32px] max-w-md w-full text-center shadow-2xl scale-in animate-in zoom-in duration-500">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-black text-2xl font-black mb-6 uppercase tracking-tighter">Hand Winners</h2>
            <div className="space-y-4">
              {gameState.winners.map((w, i) => (
                <div key={i} className="p-4 bg-black/5 rounded-2xl flex flex-col items-center">
                  <div className="text-black font-black text-xl mb-1">
                      {w.playerIds.map(id => gameState.players.find(p => p.id === id)?.name).join(' & ')}
                  </div>
                  <div className="text-emerald-600 font-bold text-3xl mb-2">${w.amount}</div>
                  <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{w.handName}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
