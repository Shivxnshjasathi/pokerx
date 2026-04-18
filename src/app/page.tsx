"use client";

import { useState } from 'react';
import { Table } from '../components/Table';
import { cn } from '../components/CardView';
import { useGameState } from '../hooks/useGameState';
import { initGame } from '../game/engine/init';
import { setDoc, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Coins, Play, UserPlus, PlusCircle, Wallet, LogOut, TrendingUp, X, Trophy, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Player, GameSettings } from '../game/types';

export default function Home() {
  const [tableId, setTableId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [startingChips, setStartingChips] = useState(1000);
  const [inGame, setInGame] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState('');
  const [showLedger, setShowLedger] = useState(false);

  const { gameState, loading, sendAction } = useGameState(inGame ? tableId : '');

  const createTable = async () => {
    if (!playerName) {
      alert("Please enter your name first!");
      return;
    }
    const derivedTableId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setTableId(derivedTableId);
    
    // Fallback if crypto.randomUUID is not available (e.g., local network testing over HTTP)
    const newPlayerId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
    
    setMyPlayerId(newPlayerId);
    setInGame(true);

    const settings: GameSettings = {
      startingChips: Number(startingChips) || 1000,
      smallBlind: Math.max(10, Math.floor((Number(startingChips) || 1000) / 100))
    };

    const newPlayer: Player = {
      id: newPlayerId,
      name: playerName,
      chips: settings.startingChips,
      cards: [],
      currentBet: 0,
      totalContribution: 0,
      isFolded: false,
      isAllIn: false,
      hasActed: false,
      buyIn: settings.startingChips
    };

    try {
      const ref = doc(db, 'tables', derivedTableId);
      await setDoc(ref, {
        id: derivedTableId,
        settings,
        deck: [],
        communityCards: [],
        pot: 0,
        sidePots: [],
        currentTurnIndex: 0,
        dealerIndex: 0,
        smallBlindIndex: 0,
        bigBlindIndex: 0,
        round: 'preflop',
        minRaise: 0,
        highestBet: 0,
        players: [newPlayer],
        isActive: false,
        logs: [{ message: `Table created by ${playerName}`, timestamp: Date.now() }]
      });
    } catch(e: any) {
      console.error(e);
      alert(e.message);
    }
  };

  const joinTable = async () => {
    if (!tableId || !playerName) return;
    const newPlayerId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
    setMyPlayerId(newPlayerId);
    setInGame(true);

    try {
      const ref = doc(db, 'tables', tableId);
      const snap = await getDoc(ref);
      
      let finalStartingChips = 1000;
      let finalSettings: GameSettings = { startingChips: 1000, smallBlind: 10 };
      
      if (snap.exists()) {
         const data = snap.data();
         if (data.settings && data.settings.startingChips) {
            finalStartingChips = data.settings.startingChips;
            finalSettings = data.settings;
         }
      }

      const newPlayer: Player = {
        id: newPlayerId,
        name: playerName,
        chips: finalStartingChips,
        cards: [],
        currentBet: 0,
        totalContribution: 0,
        isFolded: false,
        isAllIn: false,
        hasActed: false,
        buyIn: finalStartingChips
      };

      if (snap.exists()) {
        await updateDoc(ref, {
          players: arrayUnion(newPlayer)
        });
      } else {
        await setDoc(ref, {
          id: tableId,
          settings: finalSettings,
          deck: [],
          communityCards: [],
          pot: 0,
          sidePots: [],
          currentTurnIndex: 0,
          dealerIndex: 0,
          smallBlindIndex: 0,
          bigBlindIndex: 0,
          round: 'preflop',
          minRaise: 0,
          highestBet: 0,
          players: [newPlayer],
          isActive: false,
          logs: [{ message: `Table created by ${playerName}`, timestamp: Date.now() }]
        });
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleStartGame = async () => {
    if (!gameState || gameState.players.length < 2) {
      alert("Need at least 2 players");
      return;
    }
    try {
      const newState = initGame(tableId, gameState.players as Player[], gameState.settings);
      await setDoc(doc(db, 'tables', tableId), newState);
    } catch(e: any) {
      alert(e.message);
    }
  };

  if (!inGame) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-3xl w-full max-w-md shadow-2xl border border-white/10 space-y-6">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600 text-center mb-8">POKERX</h1>
          
          <div className="space-y-4">
            <div>
              <label className="text-slate-400 text-sm font-semibold mb-2 block">Your Name</label>
              <input 
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                placeholder="Enter Your Name"
              />
            </div>
             <div>
              <label className="text-slate-400 text-sm font-semibold mb-2 block">Table ID (Optional if creating)</label>
              <input 
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                value={tableId}
                onChange={e => setTableId(e.target.value.toUpperCase())}
                placeholder="Enter Table ID to join"
              />
            </div>
            {!tableId && (
              <div>
                <label className="text-slate-400 text-sm font-semibold mb-2 block">Starting Chips (Setting)</label>
                <input 
                  type="number"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono"
                  value={startingChips}
                  onChange={e => setStartingChips(parseInt(e.target.value) || 0)}
                  placeholder="e.g. 1000"
                />
              </div>
            )}
            
            <div className="flex flex-col space-y-3 mt-4">
              <button 
                onClick={joinTable}
                className="w-full bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center space-x-2"
              >
                <UserPlus className="w-5 h-5" />
                <span>Join Table</span>
              </button>
              
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-700"></div>
                <span className="flex-shrink-0 mx-4 text-slate-500 text-sm font-semibold">OR</span>
                <div className="flex-grow border-t border-slate-700"></div>
              </div>

              <button 
                onClick={createTable}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center space-x-2"
              >
                <PlusCircle className="w-5 h-5" />
                <span>Create New Table</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#21113c] via-[#100624] to-[#0a0216] font-sans text-slate-200 overflow-hidden">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex justify-between items-center z-50">
        <div className="text-xl sm:text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">
          POKERX <span className="text-slate-500 text-xs sm:text-sm ml-1 sm:ml-2 font-semibold">[{tableId}]</span>
        </div>
        
        {/* Actions / status */}
        <div className="flex space-x-2 sm:space-x-4 items-center">
          {gameState && (
            <button 
              onClick={() => {
                const amount = prompt("Top up amount (adds to your current stack):", "1000");
                if (amount && parseInt(amount) > 0) {
                   sendAction({ playerId: myPlayerId, type: 'top-up', amount: parseInt(amount) });
                }
              }}
              className="bg-slate-800/80 hover:bg-slate-700 text-white rounded-full p-2 sm:px-4 sm:py-2 border border-white/10 flex items-center space-x-1 transition-all"
            >
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span className="text-xs sm:text-sm font-bold hidden sm:block">Top Up</span>
            </button>
          )}

          {gameState && (
            <button 
              onClick={() => setShowLedger(true)}
              className="bg-slate-800/80 hover:bg-slate-700 text-white rounded-full p-2 sm:px-4 sm:py-2 border border-white/10 flex items-center space-x-1 transition-all"
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-xs sm:text-sm font-bold hidden sm:block">Ledger</span>
            </button>
          )}

          {gameState && !gameState.isActive && (
             <button 
               onClick={handleStartGame}
               className="bg-amber-600 hover:bg-amber-500 text-white px-4 sm:px-6 py-2 rounded-lg font-bold flex items-center space-x-2 transition-all hover:shadow-[0_0_20px_rgba(217,119,6,0.5)] text-xs sm:text-sm"
             >
               <Play className="w-4 h-4" />
               <span className="whitespace-nowrap">{gameState.round === 'showdown' ? 'Next Hand' : 'Start Game'}</span>
             </button>
          )}
        </div>
      </header>

      {/* Main Table Area */}
      {gameState ? (
        <Table gameState={gameState} playerId={myPlayerId} onAction={sendAction} />
      ) : (
        <div className="h-screen flex items-center justify-center">
          <div className="text-xl font-semibold text-slate-400 animate-pulse">Waiting for table data...</div>
        </div>
      )}

      {/* Logs overlay bottom right */}
      <div className="absolute bottom-6 right-6 w-80 bg-black/60 border border-white/10 rounded-2xl p-4 max-h-48 overflow-y-auto backdrop-blur-md hidden md:block">
        <h3 className="text-white/50 text-xs font-bold uppercase tracking-wider mb-2">Game Log</h3>
        <div className="space-y-1">
          {gameState?.logs?.slice(-10).map((log, i) => (
            <div key={i} className="text-sm text-slate-300">
              <span className="text-slate-500 mr-2">{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              {log.message}
            </div>
          ))}
        </div>
      </div>

      {/* Ledger Modal */}
      {showLedger && gameState && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#1a1b26] border border-white/10 rounded-[32px] w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden scale-in animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-emerald-500/10 to-transparent">
               <div className="flex items-center space-x-3">
                 <div className="bg-emerald-500/20 p-2 rounded-xl">
                   <Trophy className="w-5 h-5 text-emerald-400" />
                 </div>
                 <div>
                   <h3 className="text-xl font-black text-white uppercase tracking-tight">Financial Ledger</h3>
                   <p className="text-xs text-slate-500 font-semibold tracking-wide">Real-time Transaction Analysis</p>
                 </div>
               </div>
               <button onClick={() => setShowLedger(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                 <X className="w-6 h-6 text-slate-400" />
               </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
               {gameState.players.map((p, idx) => {
                 const profit = p.chips - p.buyIn;
                 const isProfit = profit >= 0;
                 return (
                   <div key={p.id} className="bg-white/[0.03] border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center space-x-3 text-left">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 text-xl">👤</div>
                        <div>
                          <div className="text-white font-bold text-sm tracking-wide">{p.name}</div>
                          <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Buy-in: ${p.buyIn}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-white font-black text-lg leading-tight">${p.chips}</div>
                        <div className={cn(
                          "flex items-center justify-end font-bold text-xs",
                          isProfit ? "text-emerald-400" : "text-rose-400"
                        )}>
                          {isProfit ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                          {isProfit ? "+" : "-"}${Math.abs(profit)}
                        </div>
                      </div>
                   </div>
                 );
               })}
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-black/20 border-t border-white/5 flex justify-center text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
               System Version 1.0.4 • {gameState.id}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
