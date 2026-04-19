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
    "bottom-[8%] sm:bottom-[10%] left-1/2 -translate-x-1/2 scale-110 sm:scale-125 z-50", // self (bottom) - LOWERED
    "top-[40%] -left-4 sm:left-4 -translate-y-1/2",                   // left middle
    "top-[12%] -left-1 sm:left-10",                                   // left top
    "top-[2%] left-1/2 -translate-x-1/2",                             // top center
    "top-[12%] -right-1 sm:right-10",                                 // right top
    "top-[40%] -right-4 sm:right-4 -translate-y-1/2",                 // right middle
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

  // Calculate Live Pot (Total Pot + Pending Bets in current round)
  const livePot = useMemo(() => {
    if (!gameState) return 0;
    const pendingBets = gameState.players.reduce((acc, p) => acc + (p.currentBet || 0), 0);
    return gameState.pot + pendingBets;
  }, [gameState.pot, gameState.players]);

  if (!gameState) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#1a0b33]">
        <div className="text-xl font-semibold text-slate-400 animate-pulse">Initializing Table...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
      {/* Table Surface */}
      <div className="absolute inset-0 z-0 flex items-center justify-center">
         <div className="w-[120%] h-[120%] bg-[#074723] rounded-full blur-[80px] opacity-20 pointer-events-none" />
         <div className="absolute inset-0 bg-[#074020]/20" />
      </div>

      {/* Center Table Content - Perfectly Centered in available space */}
      <div className="flex-1 w-full flex flex-col items-center justify-center z-10 p-4 sm:p-8 mt-10 sm:mt-20">
          <div className="flex flex-col items-center space-y-6 sm:space-y-12 w-full max-w-4xl">
              {/* Total Pot HUD */}
              <div className="flex flex-col items-center group transition-all duration-500">
                 <div className="text-[8px] sm:text-[10px] font-black text-emerald-400/40 uppercase tracking-[0.5em] mb-2 sm:mb-4">Total Pot</div>
                 <div className="relative">
                    <div className="absolute -inset-10 bg-emerald-500/10 blur-[50px] rounded-full opacity-30 group-hover:opacity-50 transition-opacity" />
                    <h2 className="text-5xl sm:text-8xl font-black text-white relative flex flex-col items-center">
                       <div className="flex items-baseline space-x-2">
                          <span className="text-emerald-500 text-2xl sm:text-4xl font-black italic shadow-emerald-500/50">$</span>
                          <span className="tabular-nums tracking-tighter drop-shadow-2xl">{livePot.toLocaleString()}</span>
                       </div>
                    </h2>
                 </div>
              </div>

              {/* Community Cards Display */}
              <div className="flex space-x-2 sm:space-x-4">
                 {(gameState.communityCards || []).map((card, i) => (
                   <div key={i} className="animate-in slide-in-from-bottom-4 duration-500 scale-[0.8] sm:scale-100 shadow-[0_15px_40px_rgba(0,0,0,0.6)] rounded-xl">
                     <CardView card={card} className="border-white/10" />
                   </div>
                 ))}
                 {Array.from({ length: 5 - (gameState.communityCards?.length || 0) }).map((_, i) => (
                   <div key={i} className="w-12 h-16 sm:w-16 sm:h-24 rounded-[14px] sm:rounded-2xl bg-white/[0.02] border border-white/[0.05] shadow-inner scale-[0.8] sm:scale-100 flex items-center justify-center backdrop-blur-md">
                      <div className="w-6 h-6 border border-white/5 rounded-full opacity-5" />
                   </div>
                 ))}
              </div>
          </div>
      </div>

      {/* Players Ring Overlay */}
      <div className="absolute inset-0 pointer-events-none z-20">
          {orderedPlayers.map((player, i) => (
            <PlayerSeat
              key={player.id}
              player={player}
              isActiveTurn={gameState.currentTurnIndex === gameState.players.findIndex(p => p.id === player.id) && gameState.isActive}
              isDealer={gameState.dealerIndex === gameState.players.findIndex(p => p.id === player.id)}
              isSmallBlind={gameState.smallBlindIndex === gameState.players.findIndex(p => p.id === player.id)}
              isBigBlind={gameState.bigBlindIndex === gameState.players.findIndex(p => p.id === player.id)}
              positionClass={positions[i % positions.length]}
              isSelf={player.id === playerId}
              showCards={!gameState.isActive}
              turnStartedAt={gameState.turnStartedAt}
              turnTimeoutSeconds={gameState.settings?.turnTimeoutSeconds || 15}
              lastLog={lastLog}
            />
          ))}
      </div>

      {/* Action Controls Overlay */}
      {isMyTurn && (
        <div className="fixed bottom-6 left-0 right-0 flex flex-col items-center z-[100] px-6 pointer-events-auto">
          {showRaiseUI && (
            <div className="bg-[#0c051a]/95 backdrop-blur-3xl border border-white/10 p-6 rounded-[32px] mb-6 w-full max-w-lg shadow-[0_50px_100px_rgba(0,0,0,0.9)] animate-in slide-in-from-bottom-8 duration-500">
               <div className="flex justify-between items-end mb-6">
                  <div className="flex flex-col">
                     <span className="text-slate-500 text-[10px] uppercase font-black tracking-[0.2em] mb-1">Set Raise Amount</span>
                     <span className="text-emerald-400 font-black text-4xl italic">${betValue}</span>
                  </div>
                  <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
                     <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Max: ${me?.chips}</span>
                  </div>
               </div>
               <input 
                  type="range"
                  min={minRaiseTo}
                  max={maxRaiseTo}
                  step={10}
                  value={betValue}
                  onChange={(e) => setBetValue(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-emerald-500 mb-8"
               />
               <button 
                onClick={() => {
                    if (betValue >= (me?.chips || 0)) onAction({ playerId, type: 'all-in' });
                    else onAction({ playerId, type: 'raise', amount: betValue });
                    setShowRaiseUI(false);
                }}
                className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all shadow-xl shadow-emerald-900/40"
               >
                 Place Professional Raise
               </button>
            </div>
          )}

          <div className="flex space-x-3 w-full max-w-2xl">
             <button 
               onClick={() => onAction({ playerId, type: 'fold' })} 
               className="flex-1 py-5 bg-black/40 backdrop-blur-xl border border-white/10 text-white rounded-[24px] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-rose-900/20 hover:border-rose-500/30 transition-all active:scale-95 group"
             >
               <span className="group-hover:text-rose-400">Fold</span>
             </button>
             
             {gameState.highestBet === me?.currentBet ? (
               <button 
                 onClick={() => onAction({ playerId, type: 'check' })} 
                 className="flex-1 py-5 bg-white text-black rounded-[24px] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-slate-200 transition-all active:scale-95 shadow-2xl"
               >
                 Check
               </button>
             ) : (
               <button 
                 onClick={() => onAction({ playerId, type: 'call' })} 
                 className="flex-1 py-5 bg-emerald-600 text-white rounded-[24px] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-emerald-500 transition-all active:scale-95 shadow-xl shadow-emerald-900/40"
               >
                 Call
               </button>
             )}

             <button 
                onClick={() => setShowRaiseUI(!showRaiseUI)} 
                className={cn(
                    "flex-1 py-5 bg-black/40 backdrop-blur-xl border border-white/10 text-white rounded-[24px] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white/10 transition-all active:scale-95",
                    showRaiseUI && "bg-white text-black border-transparent"
                )}
             >
                {showRaiseUI ? "Cancel" : "Raise"}
             </button>
          </div>
        </div>
      )}

      {/* Showdown Winners Overlay */}
      {showWinners && !gameState.isActive && gameState.winners && gameState.winners.length > 0 && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="bg-[#0c041a] border border-white/10 p-8 sm:p-12 rounded-[48px] max-w-lg w-full text-center shadow-[0_50px_100px_rgba(0,0,0,0.8)] scale-in animate-in zoom-in duration-500 relative overflow-hidden">
            {/* Victory Glow */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_50px_rgba(16,185,129,0.5)]" />
            
            <button onClick={() => setShowWinners(false)} className="absolute top-8 right-8 p-2 hover:bg-white/5 rounded-full transition-colors text-slate-500">
               <X className="w-6 h-6" />
            </button>

            <div className="bg-emerald-500/10 w-28 h-28 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-emerald-500/20 rotate-12">
               <Trophy className="w-12 h-12 text-emerald-500 -rotate-12" />
            </div>

            <h2 className="text-white text-4xl font-black mb-1 uppercase tracking-tighter italic">Victory!</h2>
            <p className="text-slate-500 text-[10px] font-black tracking-[0.5em] uppercase mb-10 opacity-60">Result Analysis Finalized</p>

            <div className="space-y-4 mb-10">
              {gameState.winners.map((w, i) => (
                <div key={i} className="p-6 bg-white/[0.03] border border-white/5 rounded-3xl flex flex-col items-center">
                  <div className="text-slate-400 font-bold text-sm mb-2 uppercase tracking-widest">
                      {w.playerIds.map(id => gameState.players.find(p => p.id === id)?.name).join(' & ')}
                  </div>
                  <div className="text-emerald-400 font-black text-5xl mb-3 tabular-nums drop-shadow-lg">${w.amount.toLocaleString()}</div>
                  <div className="px-5 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em]">{w.handName}</div>
                </div>
              ))}
            </div>

            <button 
                onClick={() => {
                   if (onNextHand) onNextHand();
                   else setShowWinners(false);
                }}
                className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[28px] font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-95 shadow-2xl shadow-emerald-900/40 flex items-center justify-center space-x-4 group"
            >
               <span>Continue to Next Hand</span>
               <ArrowUpRight className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
