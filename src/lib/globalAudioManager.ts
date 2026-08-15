// Global Single-Source-of-Truth Audio Playback Manager
// Prevents any audio overlapping across the application.

type AudioStateListener = (state: { activeId: string | null; isPlaying: boolean; isLoading: boolean }) => void;

class GlobalAudioManager {
  private currentAudio: HTMLAudioElement | null = null;
  private currentPlayId: number = 0;
  private activeId: string | null = null;
  private isPlaying: boolean = false;
  private isLoading: boolean = false;
  private listeners: Set<AudioStateListener> = new Set();

  public subscribe(listener: AudioStateListener): () => void {
    this.listeners.add(listener);
    listener({
      activeId: this.activeId,
      isPlaying: this.isPlaying,
      isLoading: this.isLoading
    });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const state = {
      activeId: this.activeId,
      isPlaying: this.isPlaying,
      isLoading: this.isLoading
    };
    this.listeners.forEach((l) => l(state));
  }

  public getActiveId(): string | null {
    return this.activeId;
  }

  public isCurrentlyPlaying(id?: string): boolean {
    if (!id) return this.isPlaying;
    return this.isPlaying && this.activeId === id;
  }

  public isCurrentlyLoading(id?: string): boolean {
    if (!id) return this.isLoading;
    return this.isLoading && this.activeId === id;
  }

  public stop(): void {
    this.currentPlayId++; // Invalidate any pending async audio fetches
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio.removeAttribute('src');
        this.currentAudio.load();
      } catch (e) {}
      this.currentAudio = null;
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }

    this.activeId = null;
    this.isPlaying = false;
    this.isLoading = false;
    this.notify();
  }

  /**
   * Plays an audio stream or URL while guaranteeing NO OVERLAP.
   * If an existing audio is playing, it is stopped immediately.
   */
  public async play(
    id: string,
    source: string | Blob | (() => Promise<string | Blob | null>),
    options?: { onEnded?: () => void; onError?: (err: any) => void }
  ): Promise<void> {
    // If already playing this exact item, toggle/stop it
    if (this.activeId === id && (this.isPlaying || this.isLoading)) {
      this.stop();
      return;
    }

    // Stop everything before starting new request
    this.stop();

    const thisPlayId = ++this.currentPlayId;
    this.activeId = id;
    this.isLoading = true;
    this.notify();

    try {
      let resolvedSource: string | Blob | null = null;
      if (typeof source === 'function') {
        resolvedSource = await source();
      } else {
        resolvedSource = source;
      }

      // Check if user clicked something else while waiting for fetch
      if (this.currentPlayId !== thisPlayId) {
        return;
      }

      if (!resolvedSource) {
        this.stop();
        return;
      }

      let audioUrl = '';
      if (resolvedSource instanceof Blob) {
        audioUrl = URL.createObjectURL(resolvedSource);
      } else if (typeof resolvedSource === 'string') {
        if (resolvedSource.startsWith('data:') || resolvedSource.startsWith('http') || resolvedSource.startsWith('blob:')) {
          audioUrl = resolvedSource;
        } else {
          // Assume base64 string
          audioUrl = `data:audio/mp3;base64,${resolvedSource}`;
        }
      }

      const audio = new Audio(audioUrl);
      this.currentAudio = audio;

      audio.onplay = () => {
        if (this.currentPlayId === thisPlayId) {
          this.isPlaying = true;
          this.isLoading = false;
          this.notify();
        }
      };

      audio.onended = () => {
        if (this.currentPlayId === thisPlayId) {
          this.stop();
          options?.onEnded?.();
        }
      };

      audio.onerror = (e) => {
        if (this.currentPlayId === thisPlayId) {
          console.warn('Audio playback error on item:', id, e);
          this.stop();
          options?.onError?.(e);
        }
      };

      await audio.play();
    } catch (err) {
      if (this.currentPlayId === thisPlayId) {
        console.warn('Could not start audio playback:', err);
        this.stop();
        options?.onError?.(err);
      }
    }
  }
}

export const globalAudio = new GlobalAudioManager();
