import { useState, useEffect } from 'react';
import { globalAudio } from '../lib/globalAudioManager';

export function useGlobalAudio() {
  const [state, setState] = useState({
    activeId: globalAudio.getActiveId(),
    isPlaying: globalAudio.isCurrentlyPlaying(),
    isLoading: globalAudio.isCurrentlyLoading()
  });
  const [timeState, setTimeState] = useState({
    currentTime: globalAudio.getCurrentTime(),
    duration: globalAudio.getDuration(),
    activeId: globalAudio.getActiveId()
  });

  useEffect(() => {
    const unsubscribeState = globalAudio.subscribe((newState) => {
      setState(newState);
    });
    const unsubscribeTime = globalAudio.subscribeTime((currentTime, duration, activeId) => {
      setTimeState({ currentTime, duration, activeId });
    });
    return () => {
      unsubscribeState();
      unsubscribeTime();
    };
  }, []);

  return {
    activeId: state.activeId,
    isPlaying: state.isPlaying,
    isLoading: state.isLoading,
    currentTime: timeState.currentTime,
    duration: timeState.duration,
    isItemPlaying: (id: string) => state.isPlaying && state.activeId === id,
    isItemLoading: (id: string) => state.isLoading && state.activeId === id,
    play: (id: string, source: string | Blob | (() => Promise<string | Blob | null>), options?: any) =>
      globalAudio.play(id, source, options),
    stop: () => globalAudio.stop(),
    setPlaybackRate: (rate: number) => globalAudio.setPlaybackRate(rate)
  };
}
