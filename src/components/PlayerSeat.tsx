import { Player } from '../game/types';
import { CardView, cn } from './CardView';
import { Coins } from 'lucide-react';

interface PlayerSeatProps {
  player: Player;
  isActiveTurn: boolean;
  isDealer: boolean;
  positionClass: string;
  isSelf: boolean;
  showCards: boolean; // At showdown
}

export const PlayerSeat = ({ player, isActiveTurn, isDealer, positionClass, isSelf, showCards }: PlayerSeatProps) => {
  return (
    <div className={cn("absolute flex flex-col items-center transition-all duration-500 z-10 w-24 md:w-32", positionClass)}>
      
      {/* Cards Overlapping Avatar */}
      <div className={cn(
        "absolute z-30 pointer-events-none flex",
        isSelf && !showCards
          ? "-right-12 top-0 md:-right-20 md:top-2 scale-[1.3] md:scale-[1.5] -space-x-2" 
          : "-top-4 -right-8 -space-x-4 md:-right-6 md:-top-2 scale-75 md:scale-90"
      )}>
        {player.cards.length > 0 && player.cards.map((card, i) => (
          <CardView 
             key={i} 
             card={card} 
             hidden={!isSelf && !showCards} 
             className={isSelf && !showCards 
                ? cn("border-white/50 shadow-2xl", i === 1 ? "rotate-6 translate-x-2 translate-y-1" : "-rotate-6") 
                : cn(i === 1 ? "rotate-12 translate-y-2 translate-x-2" : "-rotate-6")
             } 
          />
        ))}
      </div>

      {/* Action/Bet indicator */}
      {player.currentBet > 0 && (
        <div className={cn(
          "absolute flex flex-col items-center justify-center pointer-events-none z-30 transition-all duration-500",
          positionClass.includes("top") ? "-bottom-10" : "-top-10"
        )}>
          <div className="flex space-x-1 items-center bg-transparent">
            <Coins className="w-4 h-4 text-red-500 fill-red-500 shadow-xl" />
            <span className="text-white font-bold text-sm bg-black/40 px-2 rounded-full border border-white/10 shadow-md">{player.currentBet}</span>
          </div>
        </div>
      )}

      {/* Dealer Button */}
      {isDealer && (
        <div className="absolute -top-2 -left-4 w-6 h-6 rounded-full bg-red-600 border border-red-800 shadow-xl flex items-center justify-center font-bold text-white text-xs z-20">
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
              className="animate-[dash_15s_linear_forwards]"
            />
          </svg>
        )}

        <div className={cn(
          "relative rounded-full w-14 h-14 md:w-16 md:h-16 flex items-center justify-center overflow-hidden border-2 transition-all duration-300 shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-10",
          isActiveTurn ? "border-emerald-400" : "border-slate-500/50 bg-gradient-to-b from-slate-700 to-slate-800",
          player.isFolded ? "opacity-50 grayscale" : "",
          isSelf && !isActiveTurn ? "border-blue-500" : ""
        )}>
          {/* Placeholder Avatar Logo */}
          {!player.isFolded && <div className="text-2xl opacity-70">👤</div>}
        </div>
        
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
        "w-20 md:w-24 mt-[2px] rounded border border-white/10 z-20 flex flex-col overflow-hidden shadow-lg",
        player.isFolded ? "opacity-60 grayscale" : ""
      )}>
        <div className="bg-slate-900/90 py-1 px-1 text-center truncate shadow-[inset_0_1px_rgba(255,255,255,0.1)]">
          <div className="text-slate-200 font-semibold text-[10px] md:text-xs truncate">{player.name}</div>
        </div>
        <div className="bg-black py-1 px-1 text-center border-t border-white/5">
          <div className="text-yellow-400 font-bold text-xs md:text-sm tracking-wide">{player.chips}</div>
        </div>
      </div>

    </div>
  );
};
