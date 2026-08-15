import { useState, useEffect } from 'react';
import { globalAudio } from '../lib/globalAudioManager';

export function useGlobalAudio() {
  const [state, setState] = useState({
    activeId: globalAudio.getActiveId(),
    isPlaying: globalAudio.isCurrentlyPlaying(),
    isLoading: globalAudio.isCurrentlyLoading()
  });

  useEffect(() => {
    const unsubscribe = globalAudio.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, []);

  return {
    activeId: state.activeId,
    isPlaying: state.isPlaying,
    isLoading: state.isLoading,
    isItemPlaying: (id: string) => state.isPlaying && state.activeId === id,
    isItemLoading: (id: string) => state.isLoading && state.activeId === id,
    play: (id: string, source: string | Blob | (() => Promise<string | Blob | null>), options?: any) =>
      globalAudio.play(id, source, options),
    stop: () => globalAudio.stop()
  };
}
