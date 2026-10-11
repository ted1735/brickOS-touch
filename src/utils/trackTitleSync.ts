import { 
  Track, 
  CompositionSession, 
  GeneratedImage, 
  GeneratedVideo, 
  NightCafePrompt, 
  TrackTitleChangeHistoryRecord 
} from '../types';
import { updateTrackCatalogDefinitionTitle } from '../data/nextcloudAssetIndex';
import { updateSongVersionCatalogTitle } from '../data/songVersionsCatalog';
import { saveTrackToFirestore, setLocalCachedTracks } from '../lib/firebase';
import { audioMiniDaw } from './audioEngine';

export interface RenameTrackPayload {
  trackId: string;
  newTitle: string;
  newGenre?: string;
  newEp?: string;
  newBpm?: number;
  newKey?: string;
  newThesis?: string;
  newVocalCast?: string;
  reason?: string;
}

export interface SyncTrackTitleResult {
  updatedTrack: Track;
  sessionsUpdated: number;
  imagesUpdated: number;
  videosUpdated: number;
  promptsUpdated: number;
  nextcloudUpdated: number;
  versionCatalogUpdated: boolean;
  summaryMessage: string;
}

/**
 * Universal Song Title & Asset Synchronization Engine.
 * 
 * When a song title changes as the track evolves across edits and genres,
 * this function updates the track identity and cascades the rename to all
 * linked assets:
 * - Composition Sessions
 * - Generated Visual Artwork
 * - Video Reels (Veo & Google Flow)
 * - NightCafe & Suno Prompt Vaults
 * - Nextcloud Stems & Master Asset Definitions
 * - Song Version Comparison Matrix (3-Way Stacking)
 * - Mini-DAW Transport Engine
 * - Persistent Firestore & Local Cache
 */
export async function syncTrackTitleAcrossAllAssets({
  payload,
  tracks,
  setTracks,
  selectedTrack,
  setSelectedTrack,
  sessions,
  setSessions,
  generatedImages,
  setGeneratedImages,
  generatedVideos,
  setGeneratedVideos,
  nightCafePrompts,
  setNightCafePrompts
}: {
  payload: RenameTrackPayload;
  tracks: Track[];
  setTracks: React.Dispatch<React.SetStateAction<Track[]>>;
  selectedTrack: Track;
  setSelectedTrack: React.Dispatch<React.SetStateAction<Track>>;
  sessions?: CompositionSession[];
  setSessions?: React.Dispatch<React.SetStateAction<CompositionSession[]>>;
  generatedImages?: GeneratedImage[];
  setGeneratedImages?: React.Dispatch<React.SetStateAction<GeneratedImage[]>>;
  generatedVideos?: GeneratedVideo[];
  setGeneratedVideos?: React.Dispatch<React.SetStateAction<GeneratedVideo[]>>;
  nightCafePrompts?: NightCafePrompt[];
  setNightCafePrompts?: React.Dispatch<React.SetStateAction<NightCafePrompt[]>>;
}): Promise<SyncTrackTitleResult> {
  const { trackId, newTitle, newGenre, newEp, newBpm, newKey, newThesis, newVocalCast, reason } = payload;
  const cleanTitle = newTitle.trim();
  if (!cleanTitle) {
    throw new Error('Song title cannot be empty.');
  }

  const targetTrack = tracks.find(t => t.id === trackId) || selectedTrack;
  const oldTitle = targetTrack.title;
  const oldEp = targetTrack.ep;
  const cleanGenre = newGenre?.trim() || targetTrack.genre;
  const cleanEp = newEp?.trim() || targetTrack.ep;

  // 1. Create audit revision history record
  const historyRecord: TrackTitleChangeHistoryRecord = {
    id: `title-hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    trackId,
    previousTitle: oldTitle,
    newTitle: cleanTitle,
    previousEp: oldEp,
    newEp: cleanEp,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    author: 'Studio Producer',
    reason: reason?.trim() || (cleanGenre !== targetTrack.genre 
      ? `Evolved through genre transition (${cleanGenre})` 
      : 'Renamed in Studio Workbench')
  };

  // 2. Build updated track object
  const updatedTrack: Track = {
    ...targetTrack,
    title: cleanTitle,
    genre: cleanGenre,
    ep: cleanEp,
    ...(newBpm ? { bpm: newBpm } : {}),
    ...(newKey ? { key: newKey } : {}),
    ...(newThesis !== undefined ? { thesis: newThesis } : {}),
    ...(newVocalCast !== undefined ? { vocalCast: newVocalCast } : {}),
    titleHistory: [historyRecord, ...(targetTrack.titleHistory || [])]
  };

  // Update in-memory tracks
  const updatedTracks = tracks.map(t => (t.id === trackId ? updatedTrack : t));
  setTracks(updatedTracks);
  setLocalCachedTracks(updatedTracks);

  if (selectedTrack.id === trackId) {
    setSelectedTrack(updatedTrack);
  }

  // 3. Sync linked Composition Sessions
  let sessionsUpdated = 0;
  if (setSessions && sessions) {
    const nextSessions = sessions.map(s => {
      const isLinked = s.trackId === trackId || s.trackTitle === oldTitle || (oldTitle && s.name.includes(oldTitle));
      if (!isLinked) return s;

      sessionsUpdated++;
      let updatedName = s.name;
      if (oldTitle && updatedName.includes(oldTitle)) {
        updatedName = updatedName.split(oldTitle).join(cleanTitle);
      } else if (updatedName === oldTitle || updatedName.startsWith('Session:')) {
        updatedName = `Session: ${cleanTitle}`;
      }

      return {
        ...s,
        trackTitle: cleanTitle,
        ep: cleanEp,
        name: updatedName,
        updatedAt: new Date().toISOString()
      };
    });

    setSessions(nextSessions);
    try {
      localStorage.setItem('brickos_studio_sessions', JSON.stringify(nextSessions));
    } catch (_) {}
  }

  // 4. Sync linked Visual Artwork Assets
  let imagesUpdated = 0;
  if (setGeneratedImages && generatedImages) {
    const nextImages = generatedImages.map(img => {
      const isLinked = 
        img.trackId === trackId || 
        img.trackTitle === oldTitle || 
        (oldTitle && img.name?.includes(oldTitle)) || 
        (oldTitle && img.prompt?.includes(oldTitle));
      
      if (!isLinked) return img;

      imagesUpdated++;
      let updatedName = img.name;
      if (oldTitle && updatedName && updatedName.includes(oldTitle)) {
        updatedName = updatedName.split(oldTitle).join(cleanTitle);
      }

      return {
        ...img,
        trackId: trackId,
        trackTitle: cleanTitle,
        name: updatedName || `${cleanTitle} Artwork`
      };
    });

    setGeneratedImages(nextImages);
    try {
      localStorage.setItem('brickos_studio_images', JSON.stringify(nextImages));
    } catch (_) {}
  }

  // 5. Sync linked Video Reels & Flow Assets
  let videosUpdated = 0;
  if (setGeneratedVideos && generatedVideos) {
    const nextVideos = generatedVideos.map(vid => {
      const isLinked = 
        vid.trackId === trackId || 
        vid.trackTitle === oldTitle || 
        (oldTitle && vid.name?.includes(oldTitle));
      
      if (!isLinked) return vid;

      videosUpdated++;
      let updatedName = vid.name;
      if (oldTitle && updatedName && updatedName.includes(oldTitle)) {
        updatedName = updatedName.split(oldTitle).join(cleanTitle);
      }

      return {
        ...vid,
        trackId: trackId,
        trackTitle: cleanTitle,
        name: updatedName || `${cleanTitle} Video Reel`
      };
    });

    setGeneratedVideos(nextVideos);
    try {
      localStorage.setItem('brickos_studio_videos', JSON.stringify(nextVideos));
    } catch (_) {}
  }

  // 6. Sync linked NightCafe & Suno Prompt Vault
  let promptsUpdated = 0;
  if (setNightCafePrompts && nightCafePrompts) {
    const nextPrompts = nightCafePrompts.map(p => {
      const isLinked = p.song === oldTitle || p.song === trackId || (oldTitle && p.title.includes(oldTitle));
      if (!isLinked) return p;

      promptsUpdated++;
      let updatedTitle = p.title;
      if (oldTitle && updatedTitle.includes(oldTitle)) {
        updatedTitle = updatedTitle.split(oldTitle).join(cleanTitle);
      }

      return {
        ...p,
        song: cleanTitle,
        title: updatedTitle
      };
    });

    setNightCafePrompts(nextPrompts);
    try {
      localStorage.setItem('brickos_nightcafe_prompts', JSON.stringify(nextPrompts));
    } catch (_) {}
  }

  // 7. Update Nextcloud in-memory catalog definitions & local cached stems
  const nextcloudUpdated = updateTrackCatalogDefinitionTitle(trackId, cleanTitle, oldTitle);

  // 8. Update Song Version Matrix Catalog
  const versionCatalogUpdated = updateSongVersionCatalogTitle(trackId, cleanTitle);

  // 9. Sync active audio engine mini-DAW transport
  if (audioMiniDaw.getActiveTrackTitle() === oldTitle) {
    audioMiniDaw.setActiveTrackTitle(cleanTitle);
  }

  // 10. Persist track changes to Firestore asynchronously
  try {
    await saveTrackToFirestore(updatedTrack);
  } catch (err) {
    console.warn('Could not persist renamed track to Firestore:', err);
  }

  const linkedParts: string[] = [];
  if (sessionsUpdated > 0) linkedParts.push(`${sessionsUpdated} session${sessionsUpdated > 1 ? 's' : ''}`);
  if (imagesUpdated > 0) linkedParts.push(`${imagesUpdated} visual artwork${imagesUpdated > 1 ? 's' : ''}`);
  if (videosUpdated > 0) linkedParts.push(`${videosUpdated} video reel${videosUpdated > 1 ? 's' : ''}`);
  if (promptsUpdated > 0) linkedParts.push(`${promptsUpdated} prompt${promptsUpdated > 1 ? 's' : ''}`);
  linkedParts.push('Nextcloud stems & version matrix');

  const summaryMessage = `Song renamed from "${oldTitle}" to "${cleanTitle}". Updated across ${linkedParts.join(', ')} in lockstep!`;

  return {
    updatedTrack,
    sessionsUpdated,
    imagesUpdated,
    videosUpdated,
    promptsUpdated,
    nextcloudUpdated,
    versionCatalogUpdated,
    summaryMessage
  };
}
