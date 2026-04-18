import { useState, useEffect } from 'react';
import { doc, onSnapshot, runTransaction } from 'firebase/firestore';
import { db } from '../services/firebase';
import { GameState, Action } from '../game/types';
import { applyAction } from '../game/engine/actions';

export const useGameState = (tableId: string) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tableId) {
      setGameState(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = onSnapshot(doc(db, 'tables', tableId), (docSnap) => {
      if (docSnap.exists()) {
        setGameState(docSnap.data() as GameState);
      } else {
        setGameState(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firestore subscription error:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [tableId]);

  const sendAction = async (action: Action) => {
    if (!tableId || !gameState) return;
    
    // Optimistic Update: Apply action locally for instant feedback
    const previousState = { ...gameState };
    try {
        const optimisticState = applyAction(gameState, action);
        setGameState(optimisticState);
    } catch (e) {
        // If local apply fails (e.g. invalid action), don't send to server
        return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const tableRef = doc(db, 'tables', tableId);
        const tableSnap = await transaction.get(tableRef);
        
        if (!tableSnap.exists()) {
          throw new Error("This table no longer exists.");
        }

        const currentState = tableSnap.data() as GameState;
        const newState = applyAction(currentState, action);
        
        transaction.set(tableRef, newState);
      });
    } catch (e: any) {
      console.error("Transaction failed:", e.message);
      // Rollback optimistic update on server failure
      setGameState(previousState);
      
      if (!e.message.includes("Not your turn")) {
         alert(e.message);
      }
    }
  };

  return { gameState, loading, sendAction };
};
