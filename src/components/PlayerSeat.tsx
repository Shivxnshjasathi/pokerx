import React, { useState, useEffect } from 'react';
import { Player } from '../game/types';
import { CardView, cn } from './CardView';
import { Coins, Cpu } from 'lucide-react';

interface PlayerSeatProps {
  player: Player;
  isActiveTurn: boolean;
  isDealer: boolean;
  positionClass: string;
  isSelf: boolean;
  showCards: boolean; // At showdown
  turnStartedAt: number;
  turnTimeoutSeconds: number;
}

export const PlayerSeat = ({ 
  player, isActiveTurn, isDealer, positionClass, isSelf, showCards, turnStartedAt, turnTimeoutSeconds 
}: PlayerSeatProps) => {
  const [timeLeft, setTimeLeft] = useState(turnTimeoutSeconds);

  useEffect(() => {
    if (!isActiveTurn) return;
    
    // Initial calculate
    const elapsed = (Date.now() - turnStartedAt) / 1000;
    setTimeLeft(Math.max(0, Math.ceil(turnTimeoutSeconds - elapsed)));

    const interval = setInterval(() => {
        const elapsed = (Date.now() - turnStartedAt) / 1000;
        const remaining = Math.max(0, Math.ceil(turnTimeoutSeconds - elapsed));
        setTimeLeft(remaining);
    }, 500);

    return () => clearInterval(interval);
  }, [isActiveTurn, turnStartedAt, turnTimeoutSeconds]);
  return (
    <div className={cn("absolute flex flex-col items-center transition-all duration-500 z-10 w-24 md:w-32", positionClass)}>
      
      {/* Cards Display */}
      <div className={cn(
        "absolute z-30 pointer-events-none flex",
        isSelf && !showCards
          ? "-top-12 sm:-top-16 left-1/2 -translate-x-1/2 scale-[1.2] sm:scale-[1.4] -space-x-4" 
          : "-top-8 -right-4 sm:-right-8 -space-x-6 scale-[0.6] sm:scale-[0.8]"
      )}>
        {player.cards.length > 0 && player.cards.map((card, i) => (
          <CardView 
             key={i} 
             card={card} 
             hidden={!isSelf && !showCards} 
             className={isSelf && !showCards 
                ? cn("border-white/50 shadow-2xl transition-transform duration-500", i === 1 ? "rotate-[8deg] translate-x-3 translate-y-1" : "-rotate-[8deg] -translate-x-3") 
                : cn("shadow-lg", i === 1 ? "rotate-[15deg] translate-y-1 translate-x-1" : "-rotate-[15deg] -translate-x-1")
             } 
          />
        ))}
      </div>

      {/* Action/Bet indicator */}
      {player.currentBet > 0 && (
        <div className={cn(
          "absolute flex flex-col items-center justify-center pointer-events-none z-50 transition-all duration-500",
          positionClass.includes("top") ? "top-[110%]" : "bottom-[110%]"
        )}>
          <div className="flex space-x-1 items-center bg-black/60 px-3 py-1 rounded-full border border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.3)]">
            <div className="bg-red-600 rounded-full p-0.5 shadow-inner">
              <Coins className="w-3 h-3 text-white fill-white" />
            </div>
            <span className="text-white font-black text-xs sm:text-sm tracking-tighter">
              {player.currentBet}
            </span>
          </div>
        </div>
      )}

      {/* Dealer Button */}
      {isDealer && (
        <div className={cn(
          "absolute w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-100 border-2 border-slate-300 shadow-[0_4px_10px_rgba(0,0,0,0.5)] flex items-center justify-center font-black text-slate-800 text-[10px] sm:text-xs z-40",
          positionClass.includes("right") ? "-left-4 sm:-left-6 top-0" : "-right-4 sm:-right-6 top-0"
        )}>
          D
        </div>
      )}

      {/* Timer Bar & Avatar Circle */}
      <div className="relative">
        {/* Animated Timer Arc if active turn */}
        {isActiveTurn && (
          <svg className="absolute -inset-1.5 w-[calc(100%+12px)] h-[calc(100%+12px)] z-0 -rotate-90 pointer-events-none" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="6" />
            <circle 
              cx="50" cy="50" r="48" 
              fill="none" 
              stroke="#eab308" // yellow-500
              strokeWidth="6"
              strokeDasharray="301.59" 
              strokeDashoffset="0"
              strokeLinecap="round"
              style={{ animationDuration: `${turnTimeoutSeconds}s` }}
              className="animate-[dash_linear_forwards]"
            />
          </svg>
        )}

        <div className={cn(
          "relative rounded-full w-14 h-14 md:w-20 md:h-20 flex items-center justify-center overflow-hidden border-2 transition-all duration-500 shadow-[0_10px_25px_rgba(0,0,0,0.6)] z-10",
          isActiveTurn 
            ? "border-amber-400 scale-110 shadow-[0_0_30px_rgba(251,191,36,0.5)] ring-4 ring-amber-400/20" 
            : "border-slate-500/50 bg-gradient-to-b from-slate-700 to-slate-800",
          player.isFolded ? "opacity-40 grayscale" : "",
          isSelf && !isActiveTurn ? "border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]" : ""
        )}>
          {/* Status Overlay for Turn */}
          {isActiveTurn && (
             <div className="absolute inset-0 bg-amber-400/10 animate-pulse pointer-events-none"></div>
          )}
          
          {/* Avatar Icon */}
          {!player.isFolded ? (
            <div className="text-3xl md:text-4xl drop-shadow-lg select-none">
              {player.isBot ? (
                 <Cpu className="w-10 h-10 text-purple-400 opacity-80" />
              ) : (
                 ['👤', '🎭', '🎩', '🦊', '🕶️', '👑'][player.name.length % 6]
              )}
            </div>
          ) : (
             <div className="text-2xl opacity-40">💤</div>
          )}
        </div>
        
        {/* Thinking / Active Turn Indicator & Countdown */}
        {isActiveTurn && (
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center z-40">
            <div className="bg-amber-400 text-black text-[10px] font-black px-2 py-0.5 rounded shadow-xl mb-1 animate-pulse">
              {timeLeft}s
            </div>
            <div className="bg-black/80 text-white text-[7px] font-black uppercase px-2 py-0.5 rounded shadow-xl border border-white/10 tracking-widest">
              Action
            </div>
          </div>
        )}
        
        {/* Status Badges Overlay */}
        {player.isFolded && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20">
            <div className="bg-slate-700/90 border border-slate-500 px-2 py-[1px] rounded-full text-slate-300 font-bold uppercase text-[9px] tracking-wider whitespace-nowrap shadow-md">
              Fold
            </div>
          </div>
        )}
        {player.isAllIn && !player.isFolded && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20">
            <div className="bg-red-700/90 border border-red-500 px-2 py-[1px] rounded-full text-red-100 font-bold uppercase text-[9px] tracking-wider whitespace-nowrap shadow-md animate-pulse">
              All In
            </div>
          </div>
        )}
      </div>
      
      {/* Player Frame / Info Box closely attached below avatar */}
      <div className={cn(
        "w-24 md:w-28 mt-[4px] rounded-xl border border-white/10 z-20 flex flex-col overflow-hidden shadow-2xl transition-all duration-300",
        player.isFolded ? "opacity-40 grayscale" : "",
        isActiveTurn ? "border-amber-500/50 translate-y-2" : ""
      )}>
        <div className="bg-[#0f1117] py-1.5 px-2 text-center shadow-[inset_0_1px_rgba(255,255,255,0.05)]">
          <div className="text-white font-black text-[10px] md:text-xs truncate tracking-tight flex items-center justify-center">
            {isSelf && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 animate-pulse"></span>}
            {player.name}
          </div>
        </div>
        <div className="bg-black/80 py-1 px-2 text-center border-t border-white/5 flex flex-col items-center">
          <div className="text-amber-400 font-black text-xs md:text-sm tracking-wide flex items-center">
             <span className="text-[10px] mr-1 opacity-60">$</span>
             {player.chips.toLocaleString()}
          </div>
          <div className="w-full bg-white/5 h-[1px] my-0.5"></div>
          <div className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">
            {player.isFolded ? 'OUT' : player.isAllIn ? 'All-In' : 'Active'}
          </div>
        </div>
      </div>

    </div>
  );
};
