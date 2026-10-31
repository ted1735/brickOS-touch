import { Track, MixerTrack } from '../types';
import { getTrackStems, CATALOG_TRACK_DEFINITIONS } from '../data/nextcloudAssetIndex';
import { buildNextcloudStreamUrl } from './nextcloudStream';

export interface SectionTimeRange {
  startSec: number;
  startTimeSec: number;
  durationSec: number;
  endSec: number;
  formattedRange: string;
}

/**
 * Normalizes section tag to standard key e.g. "Verse 1", "Chorus", "Bridge"
 */
export function normalizeSectionTag(rawTag: string): string {
  if (!rawTag) return 'Section';
  const clean = rawTag.replace(/[\[\]]/g, '').trim();
  return clean || 'Section';
}

/**
 * Calculates estimated start time & duration based on musical section role and BPM
 */
export function getEstimatedSectionTime(rawTag: string, sectionIndex: number = 0, bpm: number = 76): SectionTimeRange {
  const clean = normalizeSectionTag(rawTag).toLowerCase();

  // Seconds per 4-bar unit at current BPM
  const effectiveBpm = bpm > 40 && bpm < 220 ? bpm : 76;
  const barSec = 4 * (60 / effectiveBpm); // ~3.16s per bar at 76 BPM

  let startSec = 0;
  let durationSec = 24;

  if (clean.includes('intro')) {
    startSec = 0;
    durationSec = Math.round(barSec * 4); // 4 bars (~12-16s)
  } else if (clean.includes('verse 1') || (clean.includes('verse') && !clean.includes('2') && !clean.includes('3'))) {
    startSec = Math.round(barSec * 4); // After intro
    durationSec = Math.round(barSec * 8); // 8 bars (~24-28s)
  } else if (clean.includes('pre-chorus') || clean.includes('pre chorus')) {
    startSec = Math.round(barSec * 12);
    durationSec = Math.round(barSec * 4);
  } else if (clean.includes('chorus 1') || clean === 'chorus' || clean.includes('hook 1') || clean === 'hook') {
    startSec = Math.round(barSec * 16);
    durationSec = Math.round(barSec * 8); // 8 bars (~24-28s)
  } else if (clean.includes('verse 2')) {
    startSec = Math.round(barSec * 24);
    durationSec = Math.round(barSec * 8);
  } else if (clean.includes('chorus 2')) {
    startSec = Math.round(barSec * 32);
    durationSec = Math.round(barSec * 8);
  } else if (clean.includes('bridge') || clean.includes('breakdown')) {
    startSec = Math.round(barSec * 40);
    durationSec = Math.round(barSec * 8);
  } else if (clean.includes('chorus 3') || clean.includes('outro hook')) {
    startSec = Math.round(barSec * 48);
    durationSec = Math.round(barSec * 8);
  } else if (clean.includes('outro')) {
    startSec = Math.round(barSec * 56);
    durationSec = Math.round(barSec * 6);
  } else {
    // Dynamic sequential fallback for custom sections or spoken interludes
    startSec = Math.max(0, sectionIndex * Math.round(barSec * 7));
    durationSec = Math.round(barSec * 8);
  }

  // Guard minimal sensible values
  startSec = Math.max(0, startSec);
  durationSec = Math.max(8, durationSec);
  const endSec = startSec + durationSec;

  return {
    startSec,
    startTimeSec: startSec,
    durationSec,
    endSec,
    formattedRange: `${formatTimeSeconds(startSec)} - ${formatTimeSeconds(endSec)}`
  };
}

/**
 * Format seconds as M:SS
 */
export function formatTimeSeconds(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const formatTimeMMSS = formatTimeSeconds;

/**
 * Resolves the best audio streaming URL for a track and stem category
 */
export function getTrackAudioSnippetUrl(
  track: Track,
  styleIndex: number = 0,
  stemCategory: 'master' | 'vocal' | 'instrumental' = 'master',
  sectionTag?: string
): string {
  try {
    // 1. Check if an exact matching snippet exists in sunoAssets (e.g. drywall, scream, microwave, bridge)
    if (sectionTag && track.sunoAssets?.snippets && track.sunoAssets.snippets.length > 0) {
      const lowerTag = sectionTag.toLowerCase();
      const match = track.sunoAssets.snippets.find(s => {
        const lowerLabel = s.label.toLowerCase();
        const lowerSection = s.lyricSection.toLowerCase();
        const lowerQuote = s.lyricQuote.toLowerCase();
        return (
          lowerLabel.includes(lowerTag) ||
          lowerSection.includes(lowerTag) ||
          lowerQuote.includes(lowerTag) ||
          (lowerTag.includes('bridge') && lowerLabel.includes('bridge')) ||
          (lowerTag.includes('scream') && (lowerLabel.includes('scream') || lowerSection.includes('scream'))) ||
          (lowerTag.includes('chorus') && lowerLabel.includes('chorus')) ||
          (lowerTag.includes('verse 1') && (lowerLabel.includes('verse 1') || lowerLabel.includes('drywall') || lowerLabel.includes('boots'))) ||
          (lowerTag.includes('verse 2') && (lowerLabel.includes('verse 2') || lowerLabel.includes('microwave')))
        );
      });
      if (match?.streamUrl) {
        return match.streamUrl;
      }
    }

    // 2. Check if sunoAssets has authentic audio takes (Remastered Gold Master preferred)
    if (track.sunoAssets?.takes && track.sunoAssets.takes.length > 0) {
      const takes = track.sunoAssets.takes;
      const masterTake = takes.find(t => t.isRemastered && t.isMaster) || takes.find(t => t.isMaster) || takes[styleIndex % takes.length] || takes[0];
      if (masterTake?.streamUrl) {
        return masterTake.streamUrl;
      }
    }

    // 3. Check track stems
    const stems = getTrackStems(track);
    if (stems && stems.length > 0) {
      if (stemCategory === 'vocal') {
        const vocalStem = stems.find(s => s.stemType === 'vocal' || s.name.toLowerCase().includes('vocal'));
        if (vocalStem?.audioUrl) return vocalStem.audioUrl;
      } else if (stemCategory === 'instrumental') {
        const instStem = stems.find(s => (s.stemType as string) === 'instrumental' || s.stemType !== 'vocal' || s.name.toLowerCase().includes('instrumental'));
        if (instStem?.audioUrl) return instStem.audioUrl;
      }

      // Default to Master stem
      const masterStem = stems.find(s => s.stemType === 'master') || stems[styleIndex % stems.length] || stems[0];
      if (masterStem?.audioUrl) return masterStem.audioUrl;
    }

    // 4. Direct resolution from catalog definitions if stems are empty
    const def = CATALOG_TRACK_DEFINITIONS.find(d => d.trackId === track.id) ||
      CATALOG_TRACK_DEFINITIONS.find(d => track.title && d.aliases.some(a => track.title.toLowerCase().includes(a.toLowerCase()))) ||
      ((track.title || '').toLowerCase().includes('manic') ? CATALOG_TRACK_DEFINITIONS.find(d => d.trackId === 'TRK-29') : null);
    if (def && def.stems && def.stems.length > 0) {
      const primary = def.stems.find(s => s.stemType === 'master') || def.stems[0];
      return buildNextcloudStreamUrl(`/remote.php/dav/files/ncted/Music-Production/${def.folderName}/${primary.stemFilename}`);
    }

    // 5. Dynamic resolution based on track title
    const lowerTitle = (track.title || '').toLowerCase();
    if (lowerTitle.includes('manic') || lowerTitle.includes('mundane')) {
      return buildNextcloudStreamUrl(`/remote.php/dav/files/ncted/Music-Production/Manic_In_The_Mundane/7.5sbRManicInTheMundane_Brandon_v5.1_BMV1 (Remastered).mp3`);
    }

    // Fallback directly to verified active project master
    return buildNextcloudStreamUrl(`/remote.php/dav/files/ncted/Music-Production/Meet_Me_Here/Meet-Me-Here-CHH-v2.0bZ-Remastered.mp3`);
  } catch (err) {
    console.warn('[sectionAudioHelper] getTrackAudioSnippetUrl error:', err);
    const lowerTitle = (track?.title || '').toLowerCase();
    if (lowerTitle.includes('manic') || lowerTitle.includes('mundane')) {
      return buildNextcloudStreamUrl(`/remote.php/dav/files/ncted/Music-Production/Manic_In_The_Mundane/7.5sbRManicInTheMundane_Brandon_v5.1_BMV1 (Remastered).mp3`);
    }
    return buildNextcloudStreamUrl(`/remote.php/dav/files/ncted/Music-Production/Meet_Me_Here/Meet-Me-Here-CHH-v2.0bZ-Remastered.mp3`);
  }
}

/**
 * Centralized Section Snippet Audition Manager
 * Handles HTMLAudioElement playback with loop boundaries, seeking, progress tracking,
 * and seamless A/B/C crossfade shootout.
 */
class SectionSnippetPlayer {
  private activeAudio: HTMLAudioElement | null = null;
  private currentBlockId: string | null = null;
  private currentTrackId: string | null = null;
  private currentTrackTitle: string | null = null;
  private currentSectionTag: string | null = null;
  private currentAudioUrl: string | null = null;
  private startTime: number = 0;
  private duration: number = 25;
  private isLooping: boolean = true;
  private animFrameId: number | null = null;
  private listeners: Set<(state: SnippetPlaybackState) => void> = new Set();
  private simultaneousAudios: Map<string, HTMLAudioElement> = new Map();

  public subscribe(cb: (state: SnippetPlaybackState) => void): () => void {
    this.listeners.add(cb);
    cb(this.getState());
    return () => this.listeners.delete(cb);
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach(cb => {
      try { cb(state); } catch (e) { /* ignore */ }
    });
  }

  public getState(): SnippetPlaybackState {
    const isPlaying = !!(this.activeAudio && !this.activeAudio.paused);
    const currentTime = this.activeAudio ? this.activeAudio.currentTime : this.startTime;
    const progressSec = Math.max(0, currentTime - this.startTime);
    const progressPercent = this.duration > 0 ? Math.min(100, (progressSec / this.duration) * 100) : 0;

    return {
      isPlaying,
      currentBlockId: this.currentBlockId,
      currentTrackId: this.currentTrackId,
      currentTrackTitle: this.currentTrackTitle,
      currentSectionTag: this.currentSectionTag,
      audioUrl: this.currentAudioUrl,
      startTime: this.startTime,
      duration: this.duration,
      currentTime,
      currentSec: currentTime,
      durationSec: this.duration,
      progressSec,
      progressPercent,
      isLooping: this.isLooping,
    };
  }

  /**
   * Play or toggle snippet for a specific card / section
   */
  public playSnippet(params: {
    blockId?: string;
    trackId: string;
    trackTitle?: string;
    sectionTag: string;
    audioUrl?: string;
    url?: string;
    startSec?: number;
    startTimeSec?: number;
    durationSec?: number;
    duration?: number;
    loop?: boolean;
    volume?: number;
  }) {
    const rawAudioUrl = params.url || params.audioUrl || '';
    const blockId = params.blockId || `snip_${params.trackId}_${params.sectionTag}`;
    const startSec = params.startTimeSec ?? params.startSec ?? 0;
    const durationSec = params.durationSec ?? params.duration ?? 24;
    const loop = params.loop ?? true;
    const volume = params.volume ?? 0.85;

    // If currently playing this exact section & track, toggle pause
    if (
      this.currentTrackId === params.trackId &&
      this.currentSectionTag === params.sectionTag &&
      this.activeAudio &&
      !this.activeAudio.paused
    ) {
      this.pause();
      return;
    }

    this.stop();

    this.currentBlockId = blockId;
    this.currentTrackId = params.trackId;
    this.currentTrackTitle = params.trackTitle || params.trackId;
    this.currentSectionTag = params.sectionTag;
    this.currentAudioUrl = rawAudioUrl;
    this.startTime = Math.max(0, startSec);
    this.duration = Math.max(5, durationSec);
    this.isLooping = loop;

    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';
    audio.src = rawAudioUrl;
    audio.volume = Math.max(0, Math.min(1, volume));

    audio.addEventListener('loadedmetadata', () => {
      audio.currentTime = this.startTime;
      audio.play().catch(e => console.warn('[SnippetPlayer] Playback note:', e));
    });

    audio.addEventListener('canplay', () => {
      if (audio.currentTime < this.startTime - 0.5 || audio.currentTime > this.startTime + 0.5) {
        audio.currentTime = this.startTime;
      }
    });

    audio.addEventListener('timeupdate', () => {
      const endTime = this.startTime + this.duration;
      if (audio.currentTime >= endTime) {
        if (this.isLooping) {
          audio.currentTime = this.startTime;
          audio.play().catch(() => {});
        } else {
          this.stop();
        }
      }
      this.notify();
    });

    audio.addEventListener('error', (e) => {
      console.warn('[SnippetPlayer] Audio load error, resetting player state:', e);
      this.stop();
    });

    audio.addEventListener('ended', () => {
      if (this.isLooping) {
        audio.currentTime = this.startTime;
        audio.play().catch(() => {});
      } else {
        this.stop();
      }
    });

    // Start loading and seek immediately
    audio.currentTime = this.startTime;
    audio.play().catch(e => {
      console.warn('[SnippetPlayer] Autoplay notice:', e);
    });

    this.activeAudio = audio;
    this.startProgressTicker();
    this.notify();
  }

  public pause() {
    if (this.activeAudio) {
      this.activeAudio.pause();
      this.stopProgressTicker();
      this.notify();
    }
  }

  public resume() {
    if (this.activeAudio && this.activeAudio.paused) {
      this.activeAudio.play().catch(() => {});
      this.startProgressTicker();
      this.notify();
    }
  }

  public stop() {
    this.stopProgressTicker();
    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio.src = '';
      this.activeAudio = null;
    }
    this.currentBlockId = null;
    this.currentTrackId = null;
    this.currentTrackTitle = null;
    this.currentSectionTag = null;
    this.currentAudioUrl = null;
    this.notify();
  }

  public toggleLoop() {
    this.isLooping = !this.isLooping;
    this.notify();
  }

  public setLoop(loop: boolean) {
    this.isLooping = loop;
    this.notify();
  }

  public nudge(deltaSec: number) {
    if (this.activeAudio) {
      const targetTime = Math.max(0, this.activeAudio.currentTime + deltaSec);
      this.activeAudio.currentTime = targetTime;
    } else {
      this.startTime = Math.max(0, this.startTime + deltaSec);
    }
    this.notify();
  }

  public nudgeStartTime(deltaSec: number) {
    this.startTime = Math.max(0, this.startTime + deltaSec);
    if (this.activeAudio) {
      this.activeAudio.currentTime = this.startTime;
    }
    this.notify();
  }

  public setVolume(vol: number) {
    const clamped = Math.max(0, Math.min(1, vol));
    if (this.activeAudio) {
      this.activeAudio.volume = clamped;
    }
  }

  private startProgressTicker() {
    this.stopProgressTicker();
    const tick = () => {
      if (this.activeAudio && !this.activeAudio.paused) {
        this.notify();
        this.animFrameId = requestAnimationFrame(tick);
      }
    };
    this.animFrameId = requestAnimationFrame(tick);
  }

  private stopProgressTicker() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }
}

export interface SnippetPlaybackState {
  isPlaying: boolean;
  currentBlockId: string | null;
  currentTrackId: string | null;
  currentTrackTitle: string | null;
  currentSectionTag: string | null;
  audioUrl: string | null;
  startTime: number;
  duration: number;
  currentTime: number;
  currentSec: number;
  durationSec: number;
  progressSec: number;
  progressPercent: number;
  isLooping: boolean;
}

export const sectionSnippetPlayer = new SectionSnippetPlayer();
