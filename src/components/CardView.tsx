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
    <div className={cn("relative w-12 h-18 md:w-16 md:h-24 [perspective:1000px] group", className)}>
      <div className={cn(
        "relative w-full h-full transition-all duration-700 [transform-style:preserve-3d]",
        (hidden || !card) ? "" : "[transform:rotateY(180deg)]"
      )}>
        {/* Back Face */}
        <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] bg-[#a62b1a] rounded-lg border-2 border-white shadow-xl flex items-center justify-center overflow-hidden">
          <div className="w-full h-full border-4 border-white/20 flex items-center justify-center">
            <div className="w-8 h-8 md:w-10 md:h-10 border-2 border-white/20 rotate-45 flex items-center justify-center">
              <div className="w-4 h-4 md:w-6 md:h-6 bg-white/10" />
            </div>
          </div>
        </div>

        {/* Front Face */}
        <div className={cn(
          "absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-white rounded-lg border border-gray-300 shadow-sm flex flex-col items-center justify-between p-1 md:p-1.5 select-none",
          isRed ? "text-red-500" : "text-slate-800"
        )}>
          <div className="flex flex-col items-center w-full self-start -mt-0.5 md:-mt-1 -ml-0.5 md:-ml-1">
            <div className="text-lg md:text-2xl font-black leading-none">{card?.rank}</div>
            <div className="text-lg md:text-2xl leading-none -mt-1">{suitChar}</div>
          </div>
          {/* Large Center Suit */}
          <div className="opacity-10 absolute inset-0 flex items-center justify-center text-3xl md:text-5xl pointer-events-none">
            {suitChar}
          </div>
        </div>
      </div>
    </div>
  );
};
