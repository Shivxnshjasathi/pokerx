import { Card } from '../game/types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CardView = ({ card, hidden, className }: { card?: Card; hidden?: boolean, className?: string }) => {
  if (hidden || !card) {
    return (
      <div className={cn("w-14 h-20 md:w-16 md:h-24 bg-red-700 rounded-lg border-2 border-white shadow-xl flex items-center justify-center select-none", className)}>
        <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-sm border border-white/30" />
      </div>
    );
  }

  const isRed = card.suit === 'h' || card.suit === 'd';
  const suitChar = { h: '♥', d: '♦', c: '♣', s: '♠' }[card.suit];
  
  return (
    <div className={cn(
      "w-14 h-20 md:w-16 md:h-24 bg-white rounded-lg border border-gray-300 shadow-sm flex flex-col items-center justify-between p-1 select-none",
      isRed ? "text-red-500" : "text-slate-800",
      className
    )}>
      <div className="flex flex-col items-center w-full self-start -mt-1 -ml-1">
        <div className="text-xl md:text-2xl font-black leading-none">{card.rank}</div>
        <div className="text-xl md:text-2xl leading-none -mt-1">{suitChar}</div>
      </div>
    </div>
  );
};
