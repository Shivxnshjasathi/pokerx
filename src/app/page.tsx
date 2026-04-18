"use client";

import { useState, useEffect } from 'react';
import { Table } from '../components/Table';
import { cn } from '../components/CardView';
import { useGameState } from '../hooks/useGameState';
import { initGame } from '../game/engine/init';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Coins, Play, UserPlus, PlusCircle, Wallet, LogOut, TrendingUp, X, Trophy, Bot, Cpu, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Player, GameSettings } from '../game/types';
import { getBotAction } from '../game/engine/bot';

export default function Home() {
  const [tableId, setTableId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [startingChips, setStartingChips] = useState(1000);
  const [inGame, setInGame] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState('');
  const [showLedger, setShowLedger] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [turnTimeout, setTurnTimeout] = useState(15);

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
      smallBlind: Math.max(10, Math.floor((Number(startingChips) || 1000) / 100)),
      turnTimeoutSeconds: Number(turnTimeout) || 15
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
      isBot: false,
      buyIn: Number(startingChips) || 1000
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
        lastActivity: Date.now(),
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
      let finalSettings: GameSettings = { startingChips: 1000, smallBlind: 10, turnTimeoutSeconds: 15 };
      
      if (snap.exists()) {
         const data = snap.data();
         
         // Inactivity Check (15 minutes = 900,000ms)
         const fifteenMins = 15 * 60 * 1000;
         if (data.lastActivity && (Date.now() - data.lastActivity > fifteenMins)) {
           await deleteDoc(ref);
           alert("This table has expired due to 15 minutes of inactivity and has been deleted. Please create a new one.");
           setInGame(false);
           return;
         }

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
        isBot: false,
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

  const addBot = async () => {
    if (!gameState || !tableId) return;
    if (gameState.players.length >= 6) {
      alert("Table is full!");
      return;
    }

    const botNames = ["GTO_Bot", "TheOracle", "AggroAI", "SmoothBrain", "FishMaster", "SharkAI"];
    const name = botNames[Math.floor(Math.random() * botNames.length)] + "_" + Math.floor(Math.random() * 100);
    const botId = "bot_" + Math.random().toString(36).substr(2, 9);

    const botPlayer: Player = {
      id: botId,
      name,
      chips: gameState.settings.startingChips,
      cards: [],
      currentBet: 0,
      totalContribution: 0,
      isFolded: false,
      isAllIn: false,
      hasActed: false,
      isBot: true,
      buyIn: gameState.settings.startingChips
    };

    try {
      await updateDoc(doc(db, 'tables', tableId), {
        players: arrayUnion(botPlayer)
      });
    } catch (e: any) {
      alert(e.message);
    }
  };

  const startSoloGame = async () => {
    const name = playerName || "ProPlayer";
    const id = Math.random().toString(36).substr(2, 6).toUpperCase();
    const myId = "player_" + Math.random().toString(36).substr(2, 9);
    
    // Create Table
    setTableId(id);
    setMyPlayerId(myId);
    
    const settings: GameSettings = {
      startingChips: 1000,
      smallBlind: 10,
      turnTimeoutSeconds: 10 // faster for solo
    };

    const me: Player = {
      id: myId,
      name,
      chips: settings.startingChips,
      cards: [],
      currentBet: 0,
      totalContribution: 0,
      isFolded: false,
      isAllIn: false,
      hasActed: false,
      isBot: false,
      buyIn: settings.startingChips
    };

    const botNames = ["GTO_Bot", "TheOracle", "AggroAI", "SmoothBrain", "FishMaster", "SharkAI"];
    const bots: Player[] = Array.from({ length: 3 }).map((_, i) => ({
      id: "bot_" + Math.random().toString(36).substr(2, 9),
      name: botNames[i % botNames.length] + "_" + Math.floor(Math.random() * 100),
      chips: settings.startingChips,
      cards: [],
      currentBet: 0,
      totalContribution: 0,
      isFolded: false,
      isAllIn: false,
      hasActed: false,
      isBot: true,
      buyIn: settings.startingChips
    }));

    try {
      await setDoc(doc(db, 'tables', id), {
        id,
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
        players: [me, ...bots],
        isActive: false,
        lastActivity: Date.now(),
        logs: [{ message: `Solo game started by ${name}`, timestamp: Date.now() }]
      });
      setInGame(true);
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Bot Runner - One human client acts as handler for bots
  useEffect(() => {
    if (!gameState || !gameState.isActive || !tableId) return;

    const currentPlayer = gameState.players[gameState.currentTurnIndex];
    if (!currentPlayer || !currentPlayer.isBot) return;

    // To prevent race conditions, only the first human player in the list handles bots
    const firstHuman = gameState.players.find(p => !p.isBot);
    if (firstHuman?.id !== myPlayerId) return;

    // Small delay to make it feel human
    const timer = setTimeout(() => {
        const action = getBotAction(gameState, currentPlayer.id);
        sendAction(action);
    }, 1500 + Math.random() * 2000);

    return () => clearTimeout(timer);
  }, [gameState?.currentTurnIndex, gameState?.isActive, myPlayerId]);

  const leaveTable = async () => {
    if (!confirm("Are you sure you want to leave the table?")) return;
    try {
      if (gameState) {
        const updatedPlayers = gameState.players.filter(p => p.id !== myPlayerId);
        await updateDoc(doc(db, 'tables', tableId), {
          players: updatedPlayers
        });
      }
    } catch (e) {
      console.error("Error leaving table:", e);
    } finally {
      setInGame(false);
      setMyPlayerId('');
      setTableId('');
    }
  };

  // Auto-action logic for turn timeout
  useEffect(() => {
    if (!gameState || !gameState.isActive || !myPlayerId) return;
    
    const currentPlayer = gameState.players[gameState.currentTurnIndex];
    if (currentPlayer.id !== myPlayerId) return;

    const timeoutMs = (gameState.settings?.turnTimeoutSeconds || 15) * 1000;
    const elapsed = Date.now() - gameState.turnStartedAt;
    const remaining = timeoutMs - elapsed;

    if (remaining <= 0) {
      // Time's up! Auto-fold or Check
      if (currentPlayer.currentBet >= gameState.highestBet) {
        sendAction({ playerId: myPlayerId, type: 'check' });
      } else {
        sendAction({ playerId: myPlayerId, type: 'fold' });
      }
      return;
    }

    const timer = setTimeout(() => {
      if (currentPlayer.currentBet >= gameState.highestBet) {
        sendAction({ playerId: myPlayerId, type: 'check' });
      } else {
        sendAction({ playerId: myPlayerId, type: 'fold' });
      }
    }, remaining);

    return () => clearTimeout(timer);
  }, [gameState?.currentTurnIndex, gameState?.turnStartedAt, myPlayerId]);

  if (!inGame) {
    return (
      <div className="min-h-screen bg-[#06070a] flex flex-col items-center justify-center p-4 overflow-hidden relative">
        {/* Animated Background Depth */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[160px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[160px] animate-pulse delay-1000"></div>
        
        {/* Floating Decoration Cards (Visual Only) */}
        <div className="absolute top-10 left-[15%] opacity-20 rotate-12 animate-float pointer-events-none hidden md:block">
           <div className="w-24 h-36 border-4 border-white/10 rounded-2xl bg-gradient-to-br from-white/5 to-transparent backdrop-blur-sm self-center justify-center flex items-center text-4xl">♠️</div>
        </div>
        <div className="absolute bottom-20 right-[15%] opacity-20 -rotate-12 animate-float delay-700 pointer-events-none hidden md:block">
           <div className="w-24 h-36 border-4 border-white/10 rounded-2xl bg-gradient-to-br from-white/5 to-transparent backdrop-blur-sm self-center justify-center flex items-center text-4xl text-red-500">♥️</div>
        </div>

        <div className="bg-[#111218]/90 backdrop-blur-3xl p-10 rounded-[48px] w-full max-w-md shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/[0.05] space-y-10 z-10 scale-in animate-in zoom-in-95 duration-700">
          <div className="text-center space-y-3">
            <div className="relative inline-block group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-emerald-700 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <h1 className="relative text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-emerald-400 to-emerald-600 tracking-tighter filter drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                POKERX
              </h1>
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Elite Multiplayer Hold'em</p>
          </div>
          
          <div className="space-y-6">
            <div className="group relative">
              <label className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 block ml-1 text-left group-focus-within:text-emerald-400 transition-colors">Player Identity</label>
              <div className="relative">
                 <input 
                  className="w-full bg-black/60 border border-white/[0.03] rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-800 font-medium text-lg"
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  placeholder="GUEST_PLAYER"
                />
              </div>
            </div>

             <div className="group relative">
              <label className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 block ml-1 text-left group-focus-within:text-emerald-400 transition-colors">Access Code <span className="opacity-30">(Join)</span></label>
              <input 
                className="w-full bg-black/60 border border-white/[0.03] rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 outline-none transition-all placeholder:text-slate-800 font-mono tracking-widest text-lg"
                value={tableId}
                onChange={e => setTableId(e.target.value.toUpperCase())}
                placeholder="--- ---"
              />
            </div>

            {!tableId && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="group">
                  <label className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 block ml-1 text-left">Buy-in</label>
                  <input 
                    type="number"
                    className="w-full bg-black/60 border border-white/[0.03] rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all font-mono"
                    value={startingChips}
                    onChange={e => setStartingChips(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="group">
                  <label className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2 block ml-1 text-left">Turn (s)</label>
                  <input 
                    type="number"
                    className="w-full bg-black/60 border border-white/[0.03] rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-emerald-500/30 outline-none transition-all font-mono"
                    value={turnTimeout}
                    onChange={e => setTurnTimeout(parseInt(e.target.value) || 15)}
                  />
                </div>
              </div>
            )}
            
            <div className="flex flex-col space-y-4 pt-4">
              <button 
                onClick={joinTable}
                className="w-full group bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] text-white font-bold py-5 rounded-2xl transition-all flex items-center justify-center space-x-3 active:scale-[0.98] relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <span className="tracking-wide">Join Game</span>
              </button>
              
              <div className="relative flex py-3 items-center">
                <div className="flex-grow border-t border-white/[0.03]"></div>
                <span className="flex-shrink-0 mx-6 text-slate-800 text-[9px] font-black tracking-[0.5em] italic">CREATE SESSION</span>
                <div className="flex-grow border-t border-white/[0.03]"></div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={createTable}
                  className="w-full bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white font-black py-5 rounded-2xl transition-all shadow-[0_20px_40px_-15px_rgba(16,185,129,0.4)] active:scale-[0.98] flex items-center justify-center space-x-3 uppercase tracking-widest text-sm"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span>Private Table</span>
                </button>

                <button 
                  onClick={startSoloGame}
                  className="w-full bg-gradient-to-br from-indigo-500 to-purple-700 hover:from-indigo-400 hover:to-purple-600 text-white font-black py-5 rounded-2xl transition-all shadow-[0_20px_40px_-15px_rgba(79,70,229,0.4)] active:scale-[0.98] flex items-center justify-center space-x-3 uppercase tracking-widest text-sm border border-white/10"
                >
                  <Bot className="w-5 h-5" />
                  <span>Play vs AI</span>
                </button>
              </div>
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

          {gameState && (
            <button 
              onClick={() => setShowRules(true)}
              className="bg-slate-800/80 hover:bg-slate-700 text-white rounded-full p-2 sm:px-4 sm:py-2 border border-white/10 flex items-center space-x-1 transition-all"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-xs sm:text-sm font-bold hidden sm:block">Rules</span>
            </button>
          )}

          {gameState && !gameState.isActive && (
            <button 
              onClick={addBot}
              className="bg-slate-800/80 hover:bg-white/10 text-white rounded-full p-2 sm:px-4 sm:py-2 border border-white/10 flex items-center space-x-1 transition-all"
            >
              <Cpu className="w-4 h-4 text-purple-400" />
              <span className="text-xs sm:text-sm font-bold hidden sm:block">Add Bot</span>
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

          <button 
            onClick={leaveTable}
            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-full p-2 border border-rose-500/20 transition-all"
            title="Leave Table"
          >
            <LogOut className="w-4 h-4" />
          </button>
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

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#1a1b26] border border-white/10 rounded-[32px] w-full max-w-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden scale-in animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-amber-500/10 to-transparent">
               <div className="flex items-center space-x-3">
                 <div className="bg-amber-500/20 p-2 rounded-xl">
                   <Trophy className="w-5 h-5 text-amber-400" />
                 </div>
                 <div>
                   <h3 className="text-xl font-black text-white uppercase tracking-tight">Professional Poker Rules</h3>
                   <p className="text-xs text-slate-500 font-semibold tracking-wide">Official Bicycle® Laws of Poker</p>
                 </div>
               </div>
               <button onClick={() => setShowRules(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                 <X className="w-6 h-6 text-slate-400" />
               </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto text-slate-300 leading-relaxed custom-scrollbar">
               <section>
                 <h4 className="text-amber-400 font-black uppercase text-sm tracking-widest mb-3">Basics of Poker</h4>
                 <p className="text-sm">Today, Poker is truly an international game, enjoyed in virtually every country where card games are played. The game requires incredibly great skill, and each player is the master of his own fate.</p>
               </section>

               <section className="bg-white/5 p-4 rounded-2xl border border-white/10">
                 <h4 className="text-white font-bold mb-3 flex items-center"><Coins className="w-4 h-4 mr-2 text-emerald-400" /> Hand Rankings (Highest to Lowest)</h4>
                 <ul className="space-y-2 text-xs">
                   <li className="flex justify-between border-b border-white/5 pb-1"><span className="text-emerald-400 font-bold">1. Royal Flush</span> <span>A, K, Q, J, 10 of same suit</span></li>
                   <li className="flex justify-between border-b border-white/5 pb-1"><span className="text-white font-bold">2. Straight Flush</span> <span>Five in sequence, same suit</span></li>
                   <li className="flex justify-between border-b border-white/5 pb-1"><span className="text-white font-bold">3. Four of a Kind</span> <span>Four cards of one rank</span></li>
                   <li className="flex justify-between border-b border-white/5 pb-1"><span className="text-white font-bold">4. Full House</span> <span>Three of one rank, pair of another</span></li>
                   <li className="flex justify-between border-b border-white/5 pb-1"><span className="text-white font-bold">5. Flush</span> <span>Five cards of the same suit</span></li>
                   <li className="flex justify-between border-b border-white/5 pb-1"><span className="text-white font-bold">6. Straight</span> <span>Five cards in sequence</span></li>
                   <li className="flex justify-between border-b border-white/5 pb-1"><span className="text-white font-bold">7. Three of a Kind</span> <span>Three cards of same rank</span></li>
                   <li className="flex justify-between border-b border-white/5 pb-1"><span className="text-white font-bold">8. Two Pairs</span> <span>Two different pairs</span></li>
                   <li className="flex justify-between border-b border-white/5 pb-1"><span className="text-white font-bold">9. One Pair</span> <span>One pair of same rank</span></li>
                   <li className="flex justify-between"><span className="text-slate-500 font-bold">10. No Pair</span> <span>High card determines winner</span></li>
                 </ul>
               </section>

               <section>
                 <h4 className="text-amber-400 font-black uppercase text-sm tracking-widest mb-3">Betting Interval</h4>
                 <p className="text-sm">Betting is the key to Poker, for the game, in essence, is a game of chip management. Minimizing losses with poor hands and maximizing winnings with good hands is the underlying skill.</p>
                 <div className="grid grid-cols-2 gap-4 mt-4 text-xs italic opacity-80">
                   <div className="bg-slate-800 p-3 rounded-xl border border-white/5"><strong>CALL:</strong> To match the current highest bet.</div>
                   <div className="bg-slate-800 p-3 rounded-xl border border-white/5"><strong>RAISE:</strong> Putting in more than enough to call.</div>
                   <div className="bg-slate-800 p-3 rounded-xl border border-white/5"><strong>CHECK:</strong> To bet nothing (only if no prior bet).</div>
                   <div className="bg-slate-800 p-3 rounded-xl border border-white/5"><strong>FOLD:</strong> Drop out of the current hand.</div>
                 </div>
               </section>

               <section>
                 <h4 className="text-amber-400 font-black uppercase text-sm tracking-widest mb-3">Table Stakes</h4>
                 <p className="text-sm text-slate-400">The limit for each player is the number of chips the player has in front of them. No player may withdraw chips from the table until they leave the game.</p>
               </section>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-black/20 border-t border-white/5 flex justify-center text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
               Courtesy of Bicycle® Cards • PokerX Engine
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
