import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { GameState, Action } from '../game/types';
import { applyAction } from '../game/engine/actions';

export const useGameState = (tableId: string) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tableId) return;
    const unsub = onSnapshot(doc(db, 'tables', tableId), (docSnap) => {
      if (docSnap.exists()) {
        setGameState(docSnap.data() as GameState);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [tableId]);

  const sendAction = async (action: Action) => {
    if (!gameState) return;
    try {
      const newState = applyAction(gameState, action);
      await setDoc(doc(db, 'tables', tableId), newState);
    } catch (e: any) {
      console.error(e.message);
      alert(e.message);
    }
  };

  return { gameState, loading, sendAction };
};
