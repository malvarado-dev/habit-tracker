// The Undo bar for History edits (P2-18b). Wraps the scrolling History so the bar stays on
// screen, like Today's. Removing a good habit card shows it; Undo restores the removed log.

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { UndoBar } from '@/components/UndoBar';
import { tuning } from '@/config/tuning';

export type HistoryUndo = { text: string; run: () => void };

const ShowUndo = createContext<(undo: HistoryUndo) => void>(() => {});

/** History edits call this with what they did and how to reverse it. */
export const useShowUndo = () => useContext(ShowUndo);

export function HistoryEditScope({ children }: { children: ReactNode }) {
  const [undo, setUndo] = useState<HistoryUndo | null>(null);

  useEffect(() => {
    if (!undo) return;
    const timer = setTimeout(() => setUndo(null), tuning.habits.undoMs);
    return () => clearTimeout(timer);
  }, [undo]);

  return (
    <ShowUndo.Provider value={setUndo}>
      <View style={styles.fill}>
        {children}
        {undo ? (
          <UndoBar
            text={undo.text}
            undoLabel="Undo"
            onUndo={() => {
              undo.run();
              setUndo(null);
            }}
          />
        ) : null}
      </View>
    </ShowUndo.Provider>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
