import React, { useState, useEffect } from 'react';
import { GameState, Action } from '../game/types';
import { PlayerSeat } from './PlayerSeat';
import { CardView, cn } from './CardView';
import { Coins, Loader2, Trophy } from 'lucide-react';

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

  // Predefined positions for 6 players (vertical oval layout optimized for mobile)
  const positions = [
    "bottom-0 translate-y-1/2 left-1/2 -translate-x-1/2", // self/bottom
    "bottom-[22%] -left-2 sm:-left-12 translate-y-4", // bottom left
    "top-[22%] -left-2 sm:-left-12 -translate-y-4", // top left
    "top-0 -translate-y-1/2 left-1/2 -translate-x-1/2", // top
    "top-[22%] -right-2 sm:-right-12 -translate-y-4", // top right
    "bottom-[22%] -right-2 sm:-right-12 translate-y-4", // bottom right
  ];

  // Rotate players so current user is at bottom (index 0)
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

  // Sync betValue when turn changes
  useEffect(() => {
    if (isMyTurn) {
      setBetValue(minRaiseTo);
      setShowRaiseUI(false);
    }
  }, [isMyTurn, minRaiseTo]);

  return (
    <div className="relative w-full max-w-[360px] sm:max-w-4xl mx-auto h-[580px] sm:h-[800px] flex items-center justify-center p-2 sm:p-12 mt-8 sm:mt-0 select-none touch-none">
      
      {/* Table Background */}
      <div className="absolute inset-0 sm:inset-12 bg-gradient-to-b from-[#1c7e4b] to-[#0d3f23] rounded-[160px] sm:rounded-[200px] shadow-[inset_0_10px_60px_rgba(0,0,0,0.8),_0_15px_40px_rgba(0,0,0,0.6)] border-[10px] sm:border-[24px] border-[#181a20] flex items-center justify-center">
        
        {/* Casino Felt Pattern / Branding */}
        <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden rounded-[160px] sm:rounded-[200px]">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[120px] sm:text-[200px] font-black italic text-white/20 select-none">POKERX</div>
           <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 gap-12 opacity-40">
              {Array.from({ length: 64 }).map((_, i) => (
                <div key={i} className="w-1 h-1 bg-white/10 rounded-full rotate-45 transform translate-x-4 translate-y-4" />
              ))}
           </div>
        </div>

        {/* Inner Table Ring */}
        <div className="absolute inset-[6%] rounded-[160px] sm:rounded-[200px] border-2 border-[#2a9c60]/40 shadow-[0_0_50px_rgba(42,156,96,0.1)] pointer-events-none"></div>

        {/* Table Logo / Center Text */}
        <div className="absolute bottom-[22%] text-center pointer-events-none flex flex-col items-center">
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
          
          <div className="mb-6 z-20">
             <div className="relative group cursor-default">
                <div className="absolute -inset-4 bg-amber-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity animate-pulse"></div>
                <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border-2 border-amber-500/50 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center space-x-3 transition-transform hover:scale-110">
                   <div className="flex -space-x-1">
                      <div className="w-4 h-4 rounded-full bg-red-600 border border-white/20 shadow-sm animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-4 h-4 rounded-full bg-blue-600 border border-white/20 shadow-sm animate-bounce" style={{ animationDelay: '200ms' }}></div>
                      <div className="w-4 h-4 rounded-full bg-slate-100 border border-black/20 shadow-sm animate-bounce" style={{ animationDelay: '400ms' }}></div>
                   </div>
                   <div className="flex flex-col items-start leading-none pt-0.5">
                      <span className="text-[9px] font-black text-amber-500/60 uppercase tracking-tighter">Total Pot</span>
                      <span className="text-xl font-black text-white tracking-tight">${gameState.pot}</span>
                   </div>
                </div>
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
            turnStartedAt={gameState.turnStartedAt}
            turnTimeoutSeconds={gameState.settings?.turnTimeoutSeconds || 15}
          />
        );
      })}

      {/* Action Controls */}
      {isMyTurn && (
        <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black to-transparent z-[60] animate-in slide-in-from-bottom-full duration-500 flex flex-col items-center w-full max-w-lg mx-auto pointer-events-auto">
          
          {/* Raise Slider UI Overlay */}
          {showRaiseUI && (
            <div className="w-full bg-[#1a1b26]/95 backdrop-blur-xl border border-white/10 p-6 rounded-[32px] mb-4 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
               <div className="flex justify-between items-end mb-6">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Raising To</span>
                     <span className="text-3xl font-black text-amber-400 font-mono">${betValue}</span>
                  </div>
                  <div className="flex flex-col items-end">
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Your Stack</span>
                     <span className="text-xl font-bold text-white opacity-40">${me.chips}</span>
                  </div>
               </div>

               {/* Preset Buttons */}
               <div className="grid grid-cols-4 gap-2 mb-6">
                  {[
                    { label: '1/2 Pot', val: Math.min(maxRaiseTo, Math.max(minRaiseTo, Math.floor(gameState.pot * 0.5 + gameState.highestBet))) },
                    { label: '3/4 Pot', val: Math.min(maxRaiseTo, Math.max(minRaiseTo, Math.floor(gameState.pot * 0.75 + gameState.highestBet))) },
                    { label: 'POT', val: Math.min(maxRaiseTo, Math.max(minRaiseTo, Math.floor(gameState.pot + gameState.highestBet))) },
                    { label: 'ALL-IN', val: maxRaiseTo }
                  ].map((btn) => (
                    <button 
                       key={btn.label}
                       onClick={() => setBetValue(btn.val)}
                       className="py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[10px] font-black uppercase transition-all active:scale-95"
                    >
                       {btn.label}
                    </button>
                  ))}
               </div>

               {/* Slider */}
               <div className="px-2 mb-8">
                  <input 
                    type="range"
                    min={minRaiseTo}
                    max={maxRaiseTo}
                    step={gameState.settings?.smallBlind || 10}
                    value={betValue}
                    onChange={(e) => setBetValue(parseInt(e.target.value))}
                    className="w-full h-2 bg-emerald-900/50 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-600">
                     <span>MIN: ${minRaiseTo}</span>
                     <span>MAX: ${maxRaiseTo}</span>
                  </div>
               </div>

               <div className="flex space-x-3">
                  <button 
                    onClick={() => setShowRaiseUI(false)} 
                    className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                       if (betValue >= me.chips) onAction({ playerId, type: 'all-in' });
                       else onAction({ playerId, type: 'raise', amount: betValue });
                       setShowRaiseUI(false);
                    }}
                    className="flex-[2] py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-[0_10px_20px_rgba(16,185,129,0.3)] shadow-emerald-500/20"
                  >
                    Confirm Raise
                  </button>
               </div>
            </div>
          )}

          <div className="flex justify-center space-x-2 w-full">
            <button onClick={() => onAction({ playerId, type: 'fold' })} className="flex-1 py-4 bg-[#a62b1a] shadow-[0_4px_0_#751f12,inset_0_1px_rgba(255,255,255,0.3)] text-white rounded-lg font-black uppercase tracking-wider hover:brightness-110 active:translate-y-1 active:shadow-none transition-all text-xs sm:text-base">
              Fold
            </button>
            
            {gameState.highestBet === me.currentBet ? (
              <button onClick={() => onAction({ playerId, type: 'check' })} className="flex-1 py-4 bg-[#0d7346] shadow-[0_4px_0_#084d2f,inset_0_1px_rgba(255,255,255,0.3)] text-white rounded-lg font-black uppercase tracking-wider hover:brightness-110 active:translate-y-1 active:shadow-none transition-all text-xs sm:text-base">
                Check
              </button>
            ) : (
              <button onClick={() => onAction({ playerId, type: 'call' })} className="flex-1 py-4 bg-[#0d7346] shadow-[0_4px_0_#084d2f,inset_0_1px_rgba(255,255,255,0.3)] text-white rounded-lg font-black uppercase tracking-wider hover:brightness-110 active:translate-y-1 active:shadow-none transition-all flex flex-col items-center justify-center leading-tight text-xs sm:text-base">
                <span className="opacity-70 text-[10px]">CALL</span>
                <span className="font-black text-sm">${gameState.highestBet - me.currentBet}</span>
              </button>
            )}

            <button 
              onClick={() => setShowRaiseUI(!showRaiseUI)} 
              className={cn(
                "flex-1 py-4 shadow-[0_4px_0_#8f540d,inset_0_1px_rgba(255,255,255,0.3)] text-white rounded-lg font-black uppercase tracking-wider transition-all text-xs sm:text-base",
                showRaiseUI ? "bg-amber-600 translate-y-1 shadow-none" : "bg-[#c87612] hover:brightness-110 active:translate-y-1 active:shadow-none"
              )}
            >
              {showRaiseUI ? 'Dismiss' : 'Raise'}
            </button>
          </div>
        </div>
      )}

      {/* Showdown Winners Overlay - PREMIUM DESIGN */}
      {!gameState.isActive && gameState.winners && gameState.winners.length > 0 && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-700">
          <div className="bg-gradient-to-br from-[#1e2330] to-[#11141d] border-2 border-amber-500/30 p-1 md:p-10 rounded-[48px] shadow-[0_0_100px_rgba(245,158,11,0.2)] max-w-2xl w-full text-center scale-in animate-in zoom-in-90 duration-500">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-amber-500 text-black px-8 py-3 rounded-full font-black uppercase tracking-[0.3em] shadow-2xl flex items-center space-x-2">
              <Trophy className="w-6 h-6" />
              <span>Winners</span>
              <Trophy className="w-6 h-6" />
            </div>
            
            <div className="mt-8 space-y-6">
              {gameState.winners.map((w, i) => (
                <div key={i} className="relative group p-6 rounded-3xl bg-white/5 border border-white/10 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="text-3xl font-black text-white mb-2 filter drop-shadow-md">
                      {w.playerIds.map(id => gameState.players.find(p => p.id === id)?.name).join(' & ')}
                    </div>
                    <div className="text-5xl font-black text-emerald-400 mb-4 animate-pulse">
                      ${w.amount}
                    </div>
                    <div className="px-6 py-2 bg-black/40 rounded-full border border-white/10 text-amber-400 text-sm font-black uppercase tracking-widest italic">
                      {w.handName}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <p className="mt-8 text-slate-500 text-xs font-bold uppercase tracking-widest animate-pulse">Waiting for host to deal next hand...</p>
          </div>
        </div>
      )}
    </div>
  );
};
