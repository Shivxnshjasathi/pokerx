"use client";

import { useState, useEffect, useRef } from 'react';
import { Table } from '../components/Table';
import { cn } from '../components/CardView';
import { useGameState } from '../hooks/useGameState';
import { initGame } from '../game/engine/init';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Coins, Play, UserPlus, PlusCircle, Wallet, LogOut, TrendingUp, X, Trophy, Bot, Cpu, ArrowUpRight, ArrowDownRight, Menu, Settings, Info, Clock } from 'lucide-react';
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
  const [showDrawer, setShowDrawer] = useState(false);
  const [turnTimeout, setTurnTimeout] = useState(15);
  const [isJoining, setIsJoining] = useState(false);

  const { gameState, loading: isTableLoading, sendAction } = useGameState(inGame ? tableId : '');
  const hasReceivedInitialState = useRef(false);
  const lastTurnActedRef = useRef<number | null>(null);

  useEffect(() => {
    if (gameState) hasReceivedInitialState.current = true;
    if (!inGame) {
      hasReceivedInitialState.current = false;
      lastTurnActedRef.current = null;
    }
  }, [gameState, inGame]);

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
    // setInGame moved to after setDoc


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
      setTableId(derivedTableId);
      setInGame(true);
    } catch (e: any) {
      console.error(e);
      alert(e.message);
    }
  };

  const joinTable = async () => {
    if (!tableId) {
      alert("Please enter a Table ID!");
      return;
    }
    if (!playerName) {
      alert("Please enter your Alias first!");
      return;
    }

    setIsJoining(true);
    try {
      const ref = doc(db, 'tables', tableId);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        alert("This room does not exist. Please check the code or create a new room.");
        setIsJoining(false);
        return;
      }

      const data = snap.data();
      if (data.players?.length >= 6) {
        alert("This table is already full (max 6 players).");
        setIsJoining(false);
        return;
      }

      const newPlayerId = "player_" + Math.random().toString(36).substr(2, 9);
      setMyPlayerId(newPlayerId);

      const newPlayer: Player = {
        id: newPlayerId,
        name: playerName,
        chips: data.settings?.startingChips || 1000,
        cards: [],
        currentBet: 0,
        totalContribution: 0,
        isFolded: false,
        isAllIn: false,
        hasActed: false,
        isBot: false,
        buyIn: data.settings?.startingChips || 1000
      };

      await updateDoc(ref, {
        players: arrayUnion(newPlayer),
        lastActivity: Date.now()
      });

      setInGame(true);
    } catch (e: any) {
      console.error(e);
      alert("Join failed: " + e.message);
    } finally {
      setIsJoining(false);
    }
  };

  const handleStartGame = async () => {
    if (!gameState || gameState.players.length < 2) {
      alert("Need at least 2 players");
      return;
    }
    try {
      const newState = initGame(tableId, gameState.players as Player[], gameState.settings, gameState.dealerIndex);
      await setDoc(doc(db, 'tables', tableId), newState);
    } catch (e: any) {
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
    if (lastTurnActedRef.current === gameState.currentTurnIndex) return;

    // Small delay to make it feel human
    const timer = setTimeout(() => {
      if (lastTurnActedRef.current === gameState.currentTurnIndex) return;
      lastTurnActedRef.current = gameState.currentTurnIndex;
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
    if (lastTurnActedRef.current === gameState.currentTurnIndex) return;

    const timeoutMs = (gameState.settings?.turnTimeoutSeconds || 15) * 1000;
    const elapsed = Date.now() - gameState.turnStartedAt;
    const remaining = timeoutMs - elapsed;

    if (remaining <= 0) {
      // Time's up! Auto-fold or Check
      lastTurnActedRef.current = gameState.currentTurnIndex;
      if (currentPlayer.currentBet >= gameState.highestBet) {
        sendAction({ playerId: myPlayerId, type: 'check' });
      } else {
        sendAction({ playerId: myPlayerId, type: 'fold' });
      }
      return;
    }

    const timer = setTimeout(() => {
      if (lastTurnActedRef.current === gameState.currentTurnIndex) return;
      lastTurnActedRef.current = gameState.currentTurnIndex;

      if (currentPlayer.currentBet >= gameState.highestBet) {
        sendAction({ playerId: myPlayerId, type: 'check' });
      } else {
        sendAction({ playerId: myPlayerId, type: 'fold' });
      }
    }, remaining);

    return () => clearTimeout(timer);
  }, [gameState?.currentTurnIndex, gameState?.turnStartedAt, myPlayerId]);

  // Clean exit if table is deleted
  useEffect(() => {
    if (inGame && !isTableLoading && !gameState && tableId && hasReceivedInitialState.current) {
      setInGame(false);
      setMyPlayerId('');
      setTableId('');
      alert("This table has been closed or expired.");
    }
  }, [inGame, isTableLoading, gameState, tableId]);

  if (!inGame) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center p-6 sm:p-12 overflow-hidden bg-black font-sans">
        {/* Cinematic Background Image */}
        <div className="absolute inset-0 z-0 scale-105">
          <img
            src="/poker_lobby_bg_1776534734810.png"
            className="w-full h-full object-cover opacity-60 pointer-events-none blur-[1px]"
            alt="Poker Table Background"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-transparent to-[#100624]/40" />
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
        </div>

        <div className="relative z-10 w-full max-w-sm sm:max-w-xl flex flex-col items-center justify-center space-y-6 sm:space-y-12 animate-in fade-in zoom-in duration-1000 px-4">
          {/* Brand Identity */}
          <div className="flex flex-col items-center space-y-2 sm:space-y-4 text-center">
            <div className="relative group">
              <div className="absolute -inset-8 bg-emerald-500/10 blur-[60px] rounded-full opacity-40 group-hover:opacity-80 transition-opacity duration-1000" />
              <h1 className="text-6xl sm:text-9xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white/80 to-emerald-400 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
                POKERX
              </h1>
            </div>
            <p className="text-emerald-500/60 font-black uppercase tracking-[0.4em] text-[8px] sm:text-[10px] max-w-[200px] sm:max-w-none">Elite Multiplayer Experience</p>
          </div>

          {/* Lobby Controls Card */}
          <div className="w-full bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[40px] p-6 sm:p-12 shadow-[0_40px_100px_rgba(0,0,0,0.6)] space-y-6 sm:space-y-10">
            <div className="space-y-3 sm:space-y-4">
              <div className="relative group/input">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-400/50 group-focus-within/input:text-emerald-400 transition-colors">
                  <UserPlus className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Professional Alias"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 sm:py-5 pl-16 pr-8 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/5 transition-all font-bold tracking-wide text-sm sm:text-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="relative group/input">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400/50">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    placeholder="Chips"
                    value={startingChips}
                    onChange={(e) => setStartingChips(parseInt(e.target.value) || 0)}
                    className="w-full bg-black/40 border border-white/5 rounded-xl py-3 sm:py-4 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/40 transition-all font-mono text-xs sm:text-sm"
                  />
                </div>
                <div className="relative group/input">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400/50">
                    <Clock className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    placeholder="Timer"
                    value={turnTimeout}
                    onChange={(e) => setTurnTimeout(parseInt(e.target.value) || 15)}
                    className="w-full bg-black/40 border border-white/5 rounded-xl py-3 sm:py-4 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 transition-all font-mono text-xs sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <button
                onClick={createTable}
                className="w-full p-4 sm:p-6 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/20 rounded-3xl flex items-center justify-center space-x-3 transition-all active:scale-[0.97] shadow-lg shadow-emerald-900/20 group hover:shadow-emerald-500/20"
              >
                <PlusCircle className="w-6 h-6 sm:w-8 sm:h-8" />
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest">Create Private Room</span>
              </button>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="flex flex-col space-y-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] px-2">Join Existing Session</span>
                <div className="flex space-x-3">
                  <div className="relative flex-1 group/input">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400/50">
                      <ArrowDownRight className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="Enter Table ID"
                      maxLength={6}
                      value={tableId}
                      onChange={(e) => setTableId(e.target.value.toUpperCase())}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/40 transition-all font-mono font-black tracking-[0.2em] text-sm"
                    />
                  </div>
                  <button
                    onClick={joinTable}
                    disabled={!tableId || tableId.length < 6}
                    className="px-8 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 disabled:opacity-30"
                  >
                    Connect
                  </button>
                </div>
              </div>
              
              <button
                onClick={startSoloGame}
                className="w-full py-4 bg-white/[0.05] hover:bg-white/[0.08] text-indigo-400 border border-white/5 rounded-2xl flex items-center justify-center space-x-3 transition-all active:scale-[0.97] group"
              >
                <Cpu className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Launch Solo Engine</span>
              </button>
            </div>
          </div>

          {/* Social Proof / Version Footer */}
          <div className="flex flex-col items-center space-y-2 opacity-30 pb-4 sm:pb-0">
            <div className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">Atomic Transactions Active</div>
            <p className="text-[7px] font-bold text-slate-600">POKERX PRO RELEASE v0.9 • 120HZ ENGINE</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#21113c] via-[#100624] to-[#0a0216] font-sans text-slate-200 overflow-hidden box-border">
      {/* Professional Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 h-[70px] sm:h-[80px] bg-black/40 backdrop-blur-2xl border-b border-white/5 flex justify-between items-center px-6 z-[100] pt-[env(safe-area-inset-top)] box-content">
        <div className="flex items-center space-x-4">
          <div className="text-2xl sm:text-3xl font-black tracking-tighter italic">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-white/90">POKER</span>
            <span className="text-emerald-500">X</span>
          </div>
          <div 
            onClick={() => {
              if (tableId) {
                navigator.clipboard.writeText(tableId);
                alert(`Room code ${tableId} copied!`);
              }
            }}
            className="flex items-center px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full cursor-pointer hover:bg-emerald-500/20 transition-all active:scale-95 group"
          >
            <span className="text-[8px] sm:text-[10px] font-black tracking-[0.2em] text-emerald-500 uppercase">
              Table #{tableId}
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowDrawer(true)}
          className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all active:scale-95 shadow-xl group"
        >
          <Menu className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </nav>

      {/* Main Table Area - Positioned below nav */}
      <div className="relative pt-[70px] sm:pt-[80px] h-screen overflow-hidden">

        {/* Side Drawer - Premium Game Controls */}
        <div className={cn(
          "fixed inset-0 z-[200] transition-opacity duration-500",
          showDrawer ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDrawer(false)} />

          {/* Drawer Panel */}
          <div className={cn(
            "absolute top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-[#0c041a]/95 backdrop-blur-3xl border-l border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-transform duration-500 ease-out p-8 flex flex-col pt-[env(safe-area-inset-top)]",
            showDrawer ? "translate-x-0" : "translate-x-full"
          )}>
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-xl font-black uppercase tracking-widest text-white/40 italic">Menu</h3>
              <button
                onClick={() => setShowDrawer(false)}
                className="p-2 hover:bg-white/5 rounded-full transition-colors"
                id="close-drawer"
              >
                <X className="w-6 h-6 text-white/50" />
              </button>
            </div>

            <div className="flex-1 space-y-4">
              {/* Wallet / Top Up */}
              <button
                onClick={() => {
                  const amount = prompt("Top up amount:", "1000");
                  if (amount && parseInt(amount) > 0) {
                    sendAction({ playerId: myPlayerId, type: 'top-up', amount: parseInt(amount) });
                    setShowDrawer(false);
                  }
                }}
                className="w-full p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[24px] flex items-center group transition-all"
              >
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center mr-4">
                  <Wallet className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-black text-white">Refill Wallet</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Add Chips to Stack</div>
                </div>
              </button>

              <button
                onClick={() => { setShowLedger(true); setShowDrawer(false); }}
                className="w-full p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[24px] flex items-center group transition-all"
              >
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center mr-4">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-black text-white">Financials</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Hand History & Ledger</div>
                </div>
              </button>

              <button
                onClick={() => { setShowRules(true); setShowDrawer(false); }}
                className="w-full p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[24px] flex items-center group transition-all"
              >
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center mr-4">
                  <Info className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-black text-white">Game Rules</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Rankings Guide</div>
                </div>
              </button>

              <div className="pt-6 pb-2">
                <div className="h-px bg-white/5 w-full mb-4" />
                <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4 ml-2">Session Control</div>
              </div>

              {gameState && (
                <button
                  onClick={() => { handleStartGame(); setShowDrawer(false); }}
                  className="w-full p-6 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white border border-emerald-400/20 rounded-[28px] flex items-center shadow-lg shadow-emerald-900/40 group transition-all"
                >
                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center mr-4">
                    <Play className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-base font-black uppercase tracking-tighter">Start Hand</div>
                    <div className="text-[9px] font-bold text-white/50 uppercase tracking-widest italic">Proceed to Dealing</div>
                  </div>
                </button>
              )}

              {gameState && !gameState.isActive && (
                <button
                  onClick={() => { addBot(); setShowDrawer(false); }}
                  className="w-full p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[24px] flex items-center group transition-all"
                >
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/20 flex items-center justify-center mr-4">
                    <Cpu className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-black text-white">Join Bots</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Add Professional AI</div>
                  </div>
                </button>
              )}
            </div>

            <div className="mt-auto pt-10">
              <button
                onClick={leaveTable}
                className="w-full p-5 bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 border border-rose-500/10 rounded-[24px] flex items-center group transition-all"
              >
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 flex items-center justify-center mr-4">
                  <LogOut className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-black">Disconnect</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">Exit Current Session</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Main Table Area */}
        {gameState ? (
          <Table gameState={gameState} playerId={myPlayerId} onAction={sendAction} onNextHand={handleStartGame} />
        ) : (
          <div className="h-screen flex items-center justify-center">
            <div className="text-xl font-semibold text-slate-400 animate-pulse">
              {isTableLoading ? "Connecting to Table..." : "Initializing Seat..."}
            </div>
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
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#1a1b26] border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-[32px] w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden scale-in animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
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
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#1a1b26] border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-[32px] w-full max-w-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden scale-in animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 max-h-[95vh] flex flex-col">
              {/* Modal Header */}
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-amber-500/10 to-transparent">
                <div className="flex items-center space-x-3">
                  <div className="bg-amber-500/20 p-2 rounded-xl">
                    <Trophy className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">How to Play Poker</h3>
                    <p className="text-xs text-slate-500 font-semibold tracking-wide">Official PokerOrg Professional Guide</p>
                  </div>
                </div>
                <button onClick={() => setShowRules(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto text-slate-300 leading-relaxed custom-scrollbar">
                <section>
                  <h4 className="text-amber-400 font-black uppercase text-sm tracking-widest mb-3">Quick-Start Texas Hold'em</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 text-xs">
                      <p className="flex items-start"><span className="text-emerald-400 font-black mr-2">1.</span> Each player gets two hole cards face-down.</p>
                      <p className="flex items-start"><span className="text-emerald-400 font-black mr-2">2.</span> Three communal cards are dealt face-up ('The Flop').</p>
                      <p className="flex items-start"><span className="text-emerald-400 font-black mr-2">3.</span> One more communal card is dealt ('The Turn').</p>
                    </div>
                    <div className="space-y-2 text-xs">
                      <p className="flex items-start"><span className="text-emerald-400 font-black mr-2">4.</span> A final communal card is dealt ('The River').</p>
                      <p className="flex items-start"><span className="text-emerald-400 font-black mr-2">5.</span> Remaining players reveal best 5-card hand ('Showdown').</p>
                      <p className="flex items-start"><span className="text-emerald-400 font-black mr-2">6.</span> Strongest hand wins the pot!</p>
                    </div>
                  </div>
                </section>

                <section className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <h4 className="text-white font-bold mb-3 flex items-center"><Coins className="w-4 h-4 mr-2 text-amber-400" /> Hand Rankings (Hierarchy)</h4>
                  <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-[10px]">
                    <li className="flex justify-between border-b border-white/5 pb-1"><span className="text-emerald-400 font-bold">1. Royal Flush</span> <span>A,K,Q,J,10 (Same Suit)</span></li>
                    <li className="flex justify-between border-b border-white/5 pb-1"><span className="text-white font-bold">2. Straight Flush</span> <span>5 Sequence, Same Suit</span></li>
                    <li className="flex justify-between border-b border-white/5 pb-1"><span className="text-white font-bold">3. Four of a Kind</span> <span>4 Cards of one rank</span></li>
                    <li className="flex justify-between border-b border-white/5 pb-1"><span className="text-white font-bold">4. Full House</span> <span>3 Rank + 2 Rank</span></li>
                    <li className="flex justify-between border-b border-white/5 pb-1"><span className="text-white font-bold">5. Flush</span> <span>5 of Same Suit</span></li>
                    <li className="flex justify-between border-b border-white/5 pb-1"><span className="text-white font-bold">6. Straight</span> <span>5 in Sequence</span></li>
                    <li className="flex justify-between border-b border-white/5 pb-1"><span className="text-white font-bold">7. Three of a Kind</span> <span>3 of Same Rank</span></li>
                    <li className="flex justify-between border-b border-white/5 pb-1"><span className="text-white font-bold">8. Two Pairs</span> <span>2 Different Pairs</span></li>
                    <li className="flex justify-between border-b border-white/5 pb-1"><span className="text-white font-bold">9. One Pair</span> <span>2 of Same Rank</span></li>
                    <li className="flex justify-between border-b border-white/5 pb-1"><span className="text-slate-500 font-bold">10. High Card</span> <span>Highest Card Wins</span></li>
                  </ul>
                </section>

                <section>
                  <h4 className="text-amber-400 font-black uppercase text-sm tracking-widest mb-3">Professional Strategy</h4>
                  <div className="space-y-4">
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                      <h5 className="text-white font-bold text-xs mb-1">Rule of 4 and 2</h5>
                      <p className="text-[11px] opacity-70">Count your 'outs' (cards you need). Multiply by 4 on the flop (2 cards to come) or by 2 on the turn (1 card to come) to get your % chance to win.</p>
                    </div>
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5">
                      <h5 className="text-white font-bold text-xs mb-1">Understanding Position</h5>
                      <p className="text-[11px] opacity-70">Acting after others gives you more information. Having 'position' is a massive strategic advantage in Texas Hold'em.</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="text-amber-400 font-black uppercase text-sm tracking-widest mb-3">Betting Options</h4>
                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <div className="bg-black/20 p-2 rounded-lg border border-white/5"><strong>CALL:</strong> Match the current bet.</div>
                    <div className="bg-black/20 p-2 rounded-lg border border-white/5"><strong>RAISE:</strong> Increase the current bet.</div>
                    <div className="bg-black/20 p-2 rounded-lg border border-white/5"><strong>CHECK:</strong> Pass turn (if no prior bet).</div>
                    <div className="bg-black/20 p-2 rounded-lg border border-white/5"><strong>FOLD:</strong> Exit the current hand.</div>
                  </div>
                </section>
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-black/20 border-t border-white/5 flex justify-center text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
                Courtesy of Poker.org Professional Standards
              </div>
            </div>
          </div>
        )}

        {/* Portrait Orientation Hint Overlay */}
        <div className="landscape-hint pointer-events-none">
          <div className="phone-tilt"></div>
          <h2 className="text-2xl font-black mb-2">PLEASE TILT YOUR PHONE</h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">For the best poker experience, play in landscape mode.</p>
        </div>
      </div>
    </div>
  );
}

