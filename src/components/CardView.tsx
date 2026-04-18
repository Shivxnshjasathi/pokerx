import { Card } from '../game/types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CardView = ({ card, hidden, className }: { card?: Card; hidden?: boolean, className?: string }) => {
  const isRed = card ? (card.suit === 'h' || card.suit === 'd') : false;
  const suitChar = card ? { h: '♥', d: '♦', c: '♣', s: '♠' }[card.suit] : '';
  
  return (
    <div className={cn("relative w-14 h-20 sm:w-20 sm:h-28 md:w-24 md:h-32 [perspective:1200px] group", className)}>
      <div className={cn(
        "relative w-full h-full transition-all duration-700 [transform-style:preserve-3d]",
        (hidden || !card) ? "" : "[transform:rotateY(180deg)]"
      )}>
        {/* Back Face - Custom Poker Pattern */}
        <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] bg-gradient-to-br from-[#1e40af] to-[#1e3a8a] rounded-xl border-2 border-white shadow-2xl flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
          <div className="relative w-full h-full flex items-center justify-center">
             <div className="w-10 h-10 border-2 border-white/30 rotate-45 flex items-center justify-center">
               <div className="w-6 h-6 border border-white/20" />
             </div>
          </div>
        </div>

        {/* Front Face - Premium White Finish */}
        <div className={cn(
          "absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-[#fcfdfe] rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.3)] flex flex-col items-center justify-between p-2 sm:p-3 select-none",
          isRed ? "text-rose-600" : "text-slate-900"
        )}>
          {/* Subtle Paper Texture */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper.png')]"></div>

          {/* Top Left Rank */}
          <div className="flex flex-col items-center w-full self-start -mt-1 -ml-1">
            <div className="text-xl sm:text-3xl font-black leading-none tracking-tighter">{card?.rank}</div>
            <div className="text-sm sm:text-lg leading-none -mt-0.5">{suitChar}</div>
          </div>

          {/* Large Center Suit with Depth */}
          <div className="opacity-10 absolute inset-0 flex items-center justify-center text-5xl sm:text-7xl pointer-events-none filter blur-[0.5px]">
            {suitChar}
          </div>

          {/* Bottom Right Rank (Inverted) */}
          <div className="flex flex-col items-center w-full self-end -mb-1 -mr-1 rotate-180">
            <div className="text-xl sm:text-3xl font-black leading-none tracking-tighter">{card?.rank}</div>
            <div className="text-sm sm:text-lg leading-none -mt-0.5">{suitChar}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
