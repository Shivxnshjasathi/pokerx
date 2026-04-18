import React, { useState, useEffect, memo, useMemo } from 'react';
import { Player } from '../game/types';
import { CardView, cn } from './CardView';

interface PlayerSeatProps {
  player: Player;
  isActiveTurn: boolean;
  isDealer: boolean;
  positionClass: string;
  isSelf: boolean;
  showCards: boolean; 
  turnStartedAt: number;
  turnTimeoutSeconds: number;
  lastLog?: string;
}

export const PlayerSeat = memo(({ 
  player, isActiveTurn, isDealer, positionClass, isSelf, showCards, turnStartedAt, turnTimeoutSeconds, lastLog 
}: PlayerSeatProps) => {
  const [timeLeft, setTimeLeft] = useState(turnTimeoutSeconds);

  useEffect(() => {
    if (!isActiveTurn) return;
    
    const interval = setInterval(() => {
        const elapsed = (Date.now() - turnStartedAt) / 1000;
        const remaining = Math.max(0, Math.ceil(turnTimeoutSeconds - elapsed));
        setTimeLeft(remaining);
    }, 500);

    return () => clearInterval(interval);
  }, [isActiveTurn, turnStartedAt, turnTimeoutSeconds]);

  const speechText = lastLog?.toLowerCase().includes(player.name.toLowerCase()) 
    ? lastLog.split(' ').slice(1).join(' ') 
    : null;

  return (
    <div className={cn("absolute flex flex-col items-center transition-all duration-700 z-10 w-24 sm:w-32", positionClass)}>
      
      {/* Speech Bubble */}
      {speechText && (
        <div className="absolute -bottom-16 z-[60] animate-in fade-in slide-in-from-top-2 duration-300">
           <div className="relative bg-white text-black px-4 py-1 rounded-full shadow-lg border border-gray-300">
              <span className="text-[10px] sm:text-xs font-bold uppercase">{speechText}</span>
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-gray-300 rotate-45"></div>
           </div>
        </div>
      )}

      {/* Cards Display */}
      <div className={cn(
        "relative z-30 pointer-events-none flex transition-all duration-500",
        "-mb-6 scale-[0.85] sm:scale-100 -space-x-6"
      )}>
        {player.cards.length > 0 ? player.cards.map((card, i) => (
          <CardView 
             key={i} 
             card={card} 
             hidden={!isSelf && !showCards} 
             className={cn(
                "shadow-xl border-white/20 transition-all duration-500",
                i === 0 ? "-rotate-10" : "rotate-10"
             )} 
          />
        )) : (
           <>
              <div className="w-12 h-16 sm:w-14 sm:h-20 bg-blue-600 rounded-lg border-2 border-white shadow-xl -rotate-10 flex items-center justify-center overflow-hidden">
                <div className="w-full h-full opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
              </div>
              <div className="w-12 h-16 sm:w-14 sm:h-20 bg-blue-600 rounded-lg border-2 border-white shadow-xl rotate-10 flex items-center justify-center overflow-hidden">
                <div className="w-full h-full opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
              </div>
           </>
        )}
      </div>

      {/* Info Badge */}
      <div className="relative z-40 flex flex-col items-center w-full max-w-[100px] sm:max-w-[120px]">
        
        {/* Chips Ribbon */}
        <div className="w-full py-1 px-2 text-center rounded-sm shadow-md border-y border-black/20 z-10 bg-gradient-to-b from-[#8f1e14] to-[#6d130c]">
          <span className="text-white font-black text-xs sm:text-sm tracking-tight drop-shadow-md">
            ${player.chips.toLocaleString()}
          </span>
        </div>

        {/* Name Tag */}
        <div className={cn(
            "w-[85%] -mt-0.5 py-0.5 px-2 text-center rounded-b-sm shadow-inner z-0 border border-gray-400",
            isSelf ? "bg-[#fcc100]" : "bg-[#e5e5e5]"
        )}>
           <span className="text-black font-bold text-[10px] sm:text-xs tracking-tight uppercase truncate block">
             {isSelf ? "YOU" : player.name}
           </span>
        </div>

        {/* Dealer Button */}
        {isDealer && (
            <div className="absolute -right-4 top-2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white border border-gray-400 shadow-md flex items-center justify-center z-50">
                <span className="text-red-700 font-black text-xs">D</span>
            </div>
        )}
      </div>

      {/* Active Timer Overlay */}
      {isActiveTurn && (
         <div className="absolute -inset-4 border-2 border-white/30 rounded-full animate-ping pointer-events-none"></div>
      )}

    </div>
  );
});

PlayerSeat.displayName = 'PlayerSeat';
