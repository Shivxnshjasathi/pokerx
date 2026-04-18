import React, { useState, useEffect, useMemo, memo } from 'react';
import { GameState, Action } from '../game/types';
import { PlayerSeat } from './PlayerSeat';
import { CardView, cn } from './CardView';
import { Coins, Loader2, Trophy, Clock, Volume2, Home, Power, X, ArrowUpRight } from 'lucide-react';

interface TableProps {
  gameState: GameState | null;
  playerId: string;
  onAction: (action: Action) => void;
  onNextHand?: () => void;
}

export const Table = ({ gameState, playerId, onAction, onNextHand }: TableProps) => {
  const [showWinners, setShowWinners] = useState(true);

  // Re-show winners when the game is no longer active
  useEffect(() => {
    if (gameState?.isActive === false) {
      setShowWinners(true);
    } else {
      setShowWinners(false);
    }
  }, [gameState?.isActive]);

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07361c]">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  // Position players similar to the image (Optimized for both Portrait and Landscape)
  const positions = useMemo(() => [
    "bottom-[2%] sm:bottom-[12%] left-1/2 -translate-x-1/2", // self
    "bottom-[30%] -left-2 sm:-left-10",         // left middle
    "top-[10%] -left-2 sm:-left-6",            // left top
    "top-[2%] left-1/2 -translate-x-1/2 scale-[0.6] sm:scale-100", // top center
    "top-[10%] -right-2 sm:-right-6",          // right top
    "bottom-[30%] -right-2 sm:-right-10",        // right middle
  ], []);

  const orderedPlayers = useMemo(() => {
    const myIndex = gameState.players.findIndex(p => p.id === playerId);
    return myIndex >= 0 
      ? [...gameState.players.slice(myIndex), ...gameState.players.slice(0, myIndex)]
      : gameState.players;
  }, [gameState.players, playerId]);

  const myIndex = gameState.players.findIndex(p => p.id === playerId);
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
            
            {/* 3D Chip Stack Pile */}
            <div className="relative w-12 h-16 transform -translate-y-2">
               <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col-reverse items-center">
                  {[...Array(6)].map((_, i) => (
                    <div 
                      key={i}
                      className="w-8 h-2 rounded-full border border-black/20 shadow-sm"
                      style={{ 
                        backgroundColor: i === 5 ? '#f8fafc' : '#e2e8f0',
                        marginTop: '-4px',
                        zIndex: i 
                      }}
                    />
                  ))}
               </div>
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
        <div className="fixed bottom-4 sm:bottom-10 left-0 right-0 flex flex-col items-center z-[70] px-4 pointer-events-auto landscape:bottom-[env(safe-area-inset-bottom)] pb-[env(safe-area-inset-bottom)]">
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
      {showWinners && !gameState.isActive && gameState.winners && gameState.winners.length > 0 && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-500">
          <div className="bg-white p-8 sm:p-10 rounded-[40px] max-w-md w-full text-center shadow-[0_20px_60px_rgba(0,0,0,0.4)] scale-in animate-in zoom-in duration-500 relative">
            
            {/* Close Button */}
            <button onClick={() => setShowWinners(false)} className="absolute top-6 right-6 p-2 hover:bg-black/5 rounded-full transition-colors text-slate-400">
               <X className="w-6 h-6" />
            </button>

            <div className="bg-yellow-500/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
               <Trophy className="w-12 h-12 text-yellow-600" />
            </div>

            <h2 className="text-black text-3xl font-black mb-1 uppercase tracking-tighter italic">Victory!</h2>
            <p className="text-slate-400 text-[10px] font-bold tracking-[0.3em] uppercase mb-8">Payout Analysis Complete</p>

            <div className="space-y-4 mb-10">
              {gameState.winners.map((w, i) => (
                <div key={i} className="p-5 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-3xl flex flex-col items-center">
                  <div className="text-black font-black text-xl mb-1 flex items-center">
                      <span className="truncate max-w-[200px]">{w.playerIds.map(id => gameState.players.find(p => p.id === id)?.name).join(' & ')}</span>
                  </div>
                  <div className="text-emerald-600 font-bold text-4xl mb-2">${w.amount.toLocaleString()}</div>
                  <div className="px-4 py-1 bg-black/5 rounded-full text-slate-500 text-[9px] font-black uppercase tracking-widest">{w.handName}</div>
                </div>
              ))}
            </div>

            {/* Continue / Next Hand Button */}
            <button 
                onClick={() => {
                   if (onNextHand) onNextHand();
                   else setShowWinners(false);
                }}
                className="w-full py-5 bg-black text-white rounded-[24px] font-black uppercase tracking-widest text-xs hover:bg-slate-900 transition-all active:scale-95 shadow-xl flex items-center justify-center space-x-3"
            >
               <span>Continue to Next Hand</span>
               <ArrowUpRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
