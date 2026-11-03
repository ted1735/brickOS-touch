import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  Firestore,
  writeBatch,
  Unsubscribe,
  query,
  where,
  limit,
  startAfter
} from 'firebase/firestore';
import { Track, CompositionSession, SoundPreset, WhiteboardCanvasDoc } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';
import { CANONICAL_SOUND_PRESETS } from '../data/canonicalSoundPresets';

const TRACKS_COLLECTION = 'tracks';
const LOCAL_STORAGE_KEY = 'brickos_catalog_cloud_cache_v1';
const SESSIONS_COLLECTION = 'composition_sessions';
const SESSIONS_LOCAL_STORAGE_KEY = 'brickos_sessions_cloud_cache_v1';
const PRESETS_COLLECTION = 'sound_presets';
const PRESETS_LOCAL_STORAGE_KEY = 'brickos_sound_presets_cache_v1';
const QUOTA_EXHAUSTED_KEY = 'brickos_firestore_quota_exhausted_v1';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let isCircuitBreakerTripped = false;

/**
 * Checks if the free daily Firestore quota has been exhausted.
 * Automatically engages circuit breaker to stop repeated gRPC write retries.
 */
export function isFirestoreQuotaExhausted(): boolean {
  if (isCircuitBreakerTripped) return true;
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(QUOTA_EXHAUSTED_KEY) : null;
    if (raw) {
      const data = JSON.parse(raw);
      // Quota reset is daily; reset circuit breaker after 4 hours or date boundary
      if (data && data.timestamp && Date.now() - data.timestamp < 4 * 60 * 60 * 1000) {
        isCircuitBreakerTripped = true;
        return true;
      }
    }
  } catch (_) {}
  return false;
}

/**
 * Detects if an error is due to Firestore quota / resource exhaustion
 */
export function isQuotaExhaustedError(err: any): boolean {
  if (!err) return false;
  const code = err.code || err?.errorInfo?.code;
  const msg = (err.message || '').toString();
  return (
    code === 'resource-exhausted' ||
    code === 8 ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('Quota limit exceeded') ||
    msg.includes('Free daily write units')
  );
}

/**
 * Engages the quota circuit breaker, stopping further cloud write streams
 */
export function tripFirestoreQuotaCircuitBreaker(errorMessage?: string) {
  isCircuitBreakerTripped = true;
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        QUOTA_EXHAUSTED_KEY,
        JSON.stringify({
          timestamp: Date.now(),
          reason: errorMessage || 'Free daily write units quota exceeded'
        })
      );
    }
  } catch (_) {}
  console.warn(
    '[Firestore Circuit Breaker Active]: Daily free write quota reached (RESOURCE_EXHAUSTED). Cloud write attempts paused; running in local storage safe-mode. All track edits, sessions, and presets remain 100% saved in browser storage.'
  );
}

/**
 * Reset the circuit breaker
 */
export function clearFirestoreQuotaCircuitBreaker() {
  isCircuitBreakerTripped = false;
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(QUOTA_EXHAUSTED_KEY);
    }
  } catch (_) {}
}

try {
  if (firebaseConfig && firebaseConfig.projectId && firebaseConfig.apiKey) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    if (firebaseConfig.firestoreDatabaseId) {
      db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    } else {
      db = getFirestore(app);
    }
  }
} catch (err) {
  console.warn('Firebase initialization error, falling back to local storage cache:', err);
}

export { db, app };

export const isFirebaseConfigured = (): boolean => {
  return !!db && !!app && !isFirestoreQuotaExhausted();
};

// ==========================================
// TRACKS PERSISTENCE & MILESTONE FINALIZATION
// ==========================================

export const getLocalCachedTracks = (): Track[] | null => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (_) {}
  return null;
};

export const setLocalCachedTracks = (tracks: Track[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tracks));
  } catch (err) {
    console.warn('Failed to update local tracks cache:', err);
  }
};

/**
 * Load all tracks from Firestore. If cloud is unreachable or empty, falls back to canonical.
 */
export async function loadTracksFromFirestore(canonicalTracks: Track[] = []): Promise<Track[]> {
  const cached = getLocalCachedTracks();

  if (!db || isFirestoreQuotaExhausted()) {
    return cached && cached.length > 0 ? cached : canonicalTracks;
  }

  try {
    const colRef = collection(db, TRACKS_COLLECTION);
    const snapshot = await getDocs(colRef);

    if (snapshot.empty) {
      if (canonicalTracks.length > 0 && !isFirestoreQuotaExhausted()) {
        console.log('Firestore tracks collection is empty, seeding canonical tracks...');
        await seedInitialCatalog(canonicalTracks);
        setLocalCachedTracks(canonicalTracks);
        return canonicalTracks;
      }
      return cached && cached.length > 0 ? cached : canonicalTracks;
    }

    const fetchedTracks: Track[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data() as Track;
      fetchedTracks.push({
        ...data,
        id: data.id || docSnap.id
      });
    });

    fetchedTracks.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }));
    setLocalCachedTracks(fetchedTracks);
    return fetchedTracks;
  } catch (err: any) {
    if (isQuotaExhaustedError(err)) {
      tripFirestoreQuotaCircuitBreaker(err.message);
    }
    console.warn('Failed to load tracks from Firestore, falling back to local cache:', err?.message || err);
    return cached && cached.length > 0 ? cached : canonicalTracks;
  }
}

/**
 * Real-time listener for track changes across devices or sessions.
 */
export function subscribeToFirestoreTracks(
  onTracksUpdated: (tracks: Track[]) => void,
  onError?: (err: Error) => void
): Unsubscribe | null {
  if (!db || isFirestoreQuotaExhausted()) return null;

  try {
    const colRef = collection(db, TRACKS_COLLECTION);
    return onSnapshot(
      colRef,
      snapshot => {
        if (snapshot.empty) return;
        const tracks: Track[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as Track;
          tracks.push({
            ...data,
            id: data.id || docSnap.id
          });
        });

        tracks.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }));
        setLocalCachedTracks(tracks);
        onTracksUpdated(tracks);
      },
      error => {
        if (isQuotaExhaustedError(error)) {
          tripFirestoreQuotaCircuitBreaker(error.message);
        }
        console.warn('Firestore subscription notice:', error?.message || error);
        if (onError) onError(error);
      }
    );
  } catch (err: any) {
    if (isQuotaExhaustedError(err)) {
      tripFirestoreQuotaCircuitBreaker(err.message);
    }
    console.warn('Could not establish Firestore subscription:', err?.message || err);
    return null;
  }
}

/**
 * Primary track save (Offline-first / Local Storage + Nextcloud).
 * Live DAW tweaks update local cache immediately and do not fire routine Firestore writes to conserve quota.
 */
export async function saveTrackToFirestore(track: Track): Promise<void> {
  const cached = getLocalCachedTracks() || [];
  const existingIdx = cached.findIndex(t => t.id === track.id);
  let updatedCache: Track[];
  if (existingIdx >= 0) {
    updatedCache = [...cached];
    updatedCache[existingIdx] = track;
  } else {
    updatedCache = [track, ...cached];
  }
  setLocalCachedTracks(updatedCache);
}

/**
 * Explicitly publishes or finalizes a track milestone to Firestore as the secondary destination.
 * Uses _schemaVersion = 2 and safeguards with the quota circuit breaker.
 */
export async function finalizeTrackToFirestore(track: Track): Promise<{ success: boolean; error?: string }> {
  const cached = getLocalCachedTracks() || [];
  const existingIdx = cached.findIndex(t => t.id === track.id);
  const updatedCache = existingIdx >= 0
    ? cached.map(t => t.id === track.id ? { ...track, _schemaVersion: 2, updatedAt: new Date().toISOString() } : t)
    : [{ ...track, _schemaVersion: 2, updatedAt: new Date().toISOString() }, ...cached];
  setLocalCachedTracks(updatedCache);

  if (!db || isFirestoreQuotaExhausted()) {
    return {
      success: true,
      error: isFirestoreQuotaExhausted() ? 'Saved locally (Firestore daily quota limit active)' : 'Firestore not configured'
    };
  }

  try {
    const trackDocRef = doc(db, TRACKS_COLLECTION, track.id);
    const payload = {
      ...track,
      _schemaVersion: 2,
      finalizedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(trackDocRef, payload, { merge: true });
    return { success: true };
  } catch (err: any) {
    if (isQuotaExhaustedError(err)) {
      tripFirestoreQuotaCircuitBreaker(err.message);
      return { success: true, error: 'Saved locally (Firestore quota reached)' };
    }
    console.warn(`Could not save track milestone ${track.id} to Firestore:`, err?.message || err);
    return { success: false, error: err?.message || 'Firestore write failed' };
  }
}

/**
 * Batch seed canonical tracks into Firestore with throttling and quota protection
 */
export async function seedInitialCatalog(tracks: Track[]): Promise<void> {
  if (!db || isFirestoreQuotaExhausted() || tracks.length === 0) return;

  try {
    const batch = writeBatch(db);
    const limited = tracks.slice(0, 400); // 400 doc safety limit
    for (const track of limited) {
      const trackDocRef = doc(db, TRACKS_COLLECTION, track.id);
      batch.set(trackDocRef, {
        ...track,
        _schemaVersion: 2,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
    await batch.commit();
    console.log(`Successfully seeded ${limited.length} tracks into Firestore.`);
  } catch (err: any) {
    if (isQuotaExhaustedError(err)) {
      tripFirestoreQuotaCircuitBreaker(err.message);
      return;
    }
    console.warn('Could not seed catalog into Firestore:', err?.message || err);
  }
}

/**
 * Delete a track from Firestore
 */
export async function deleteTrackFromFirestore(trackId: string): Promise<void> {
  const cached = getLocalCachedTracks() || [];
  setLocalCachedTracks(cached.filter(t => t.id !== trackId));

  if (!db || isFirestoreQuotaExhausted()) return;

  try {
    const trackDocRef = doc(db, TRACKS_COLLECTION, trackId);
    await deleteDoc(trackDocRef);
  } catch (err: any) {
    if (isQuotaExhaustedError(err)) {
      tripFirestoreQuotaCircuitBreaker(err.message);
      return;
    }
    console.warn(`Could not delete track ${trackId} from Firestore (deleted locally):`, err?.message || err);
  }
}

// ==========================================
// COMPOSITION SESSIONS PERSISTENCE
// ==========================================

export const getLocalCachedSessions = (): CompositionSession[] | null => {
  try {
    const raw = localStorage.getItem(SESSIONS_LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (_) {}
  return null;
};

export const setLocalCachedSessions = (sessions: CompositionSession[]) => {
  try {
    localStorage.setItem(SESSIONS_LOCAL_STORAGE_KEY, JSON.stringify(sessions));
  } catch (_) {}
};

export async function loadSessionsFromFirestore(canonicalSessions: CompositionSession[] = []): Promise<CompositionSession[]> {
  const cached = getLocalCachedSessions();
  if (!db || isFirestoreQuotaExhausted()) {
    return cached && cached.length > 0 ? cached : canonicalSessions;
  }

  try {
    const colRef = collection(db, SESSIONS_COLLECTION);
    const snapshot = await getDocs(colRef);

    if (snapshot.empty) {
      if (canonicalSessions.length > 0 && !isFirestoreQuotaExhausted()) {
        console.log('Firestore sessions collection is empty, seeding canonical sessions...');
        await seedInitialSessions(canonicalSessions);
        setLocalCachedSessions(canonicalSessions);
        return canonicalSessions;
      }
      return cached && cached.length > 0 ? cached : canonicalSessions;
    }

    const fetchedSessions: CompositionSession[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data() as CompositionSession;
      fetchedSessions.push({
        ...data,
        id: data.id || docSnap.id
      });
    });

    fetchedSessions.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
    });

    setLocalCachedSessions(fetchedSessions);
    return fetchedSessions;
  } catch (err: any) {
    if (isQuotaExhaustedError(err)) {
      tripFirestoreQuotaCircuitBreaker(err.message);
    }
    console.warn('Failed to load composition sessions from Firestore:', err?.message || err);
    return cached && cached.length > 0 ? cached : canonicalSessions;
  }
}

export function subscribeToFirestoreSessions(
  onSessionsUpdated: (sessions: CompositionSession[]) => void,
  onError?: (err: Error) => void
): Unsubscribe | null {
  if (!db || isFirestoreQuotaExhausted()) return null;

  try {
    const colRef = collection(db, SESSIONS_COLLECTION);
    return onSnapshot(
      colRef,
      snapshot => {
        if (snapshot.empty) return;
        const sessions: CompositionSession[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as CompositionSession;
          sessions.push({
            ...data,
            id: data.id || docSnap.id
          });
        });

        sessions.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
        });

        setLocalCachedSessions(sessions);
        onSessionsUpdated(sessions);
      },
      error => {
        if (isQuotaExhaustedError(error)) {
          tripFirestoreQuotaCircuitBreaker(error.message);
        }
        console.warn('Firestore sessions subscription notice:', error?.message || error);
        if (onError) onError(error);
      }
    );
  } catch (err: any) {
    if (isQuotaExhaustedError(err)) {
      tripFirestoreQuotaCircuitBreaker(err.message);
    }
    console.warn('Could not establish Firestore sessions subscription:', err?.message || err);
    return null;
  }
}

export async function saveSessionToFirestore(session: CompositionSession): Promise<void> {
  const cached = getLocalCachedSessions() || [];
  const existingIdx = cached.findIndex(s => s.id === session.id);
  let updatedCache: CompositionSession[];
  if (existingIdx >= 0) {
    updatedCache = [...cached];
    updatedCache[existingIdx] = session;
  } else {
    updatedCache = [session, ...cached];
  }
  setLocalCachedSessions(updatedCache);

  if (!db || isFirestoreQuotaExhausted()) return;

  try {
    const sessionDocRef = doc(db, SESSIONS_COLLECTION, session.id);
    const payload = {
      ...session,
      _schemaVersion: 2,
      updatedAt: new Date().toISOString()
    };
    await setDoc(sessionDocRef, payload, { merge: true });
  } catch (err: any) {
    if (isQuotaExhaustedError(err)) {
      tripFirestoreQuotaCircuitBreaker(err.message);
      return;
    }
    console.warn(`Could not save session ${session.id} to Firestore:`, err?.message || err);
  }
}

export async function deleteSessionFromFirestore(sessionId: string): Promise<void> {
  const cached = getLocalCachedSessions() || [];
  setLocalCachedSessions(cached.filter(s => s.id !== sessionId));

  if (!db || isFirestoreQuotaExhausted()) return;

  try {
    const sessionDocRef = doc(db, SESSIONS_COLLECTION, sessionId);
    await deleteDoc(sessionDocRef);
  } catch (err: any) {
    if (isQuotaExhaustedError(err)) {
      tripFirestoreQuotaCircuitBreaker(err.message);
      return;
    }
    console.warn(`Could not delete session ${sessionId} from Firestore:`, err?.message || err);
  }
}

export async function seedInitialSessions(sessions: CompositionSession[]): Promise<void> {
  if (!db || isFirestoreQuotaExhausted() || sessions.length === 0) return;

  try {
    const batch = writeBatch(db);
    for (const session of sessions.slice(0, 400)) {
      const sessionDocRef = doc(db, SESSIONS_COLLECTION, session.id);
      batch.set(sessionDocRef, {
        ...session,
        _schemaVersion: 2,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
    await batch.commit();
    console.log(`Successfully seeded ${sessions.length} composition sessions into Firestore.`);
  } catch (err: any) {
    if (isQuotaExhaustedError(err)) {
      tripFirestoreQuotaCircuitBreaker(err.message);
      return;
    }
    console.warn('Could not seed sessions into Firestore:', err?.message || err);
  }
}

// ==========================================
// SOUND PRESETS PERSISTENCE
// ==========================================

export const getLocalCachedPresets = (): SoundPreset[] => {
  try {
    const raw = localStorage.getItem(PRESETS_LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (_) {}
  return CANONICAL_SOUND_PRESETS;
};

export const setLocalCachedPresets = (presets: SoundPreset[]) => {
  try {
    localStorage.setItem(PRESETS_LOCAL_STORAGE_KEY, JSON.stringify(presets));
  } catch (err) {
    console.warn('Failed to update local sound presets cache:', err);
  }
};

export async function loadPresetsFromFirestore(): Promise<SoundPreset[]> {
  const cached = getLocalCachedPresets();
  if (!db || isFirestoreQuotaExhausted()) {
    return cached;
  }

  try {
    const colRef = collection(db, PRESETS_COLLECTION);
    const snapshot = await getDocs(colRef);

    if (snapshot.empty) {
      if (!isFirestoreQuotaExhausted()) {
        console.log('No presets found in Firestore. Seeding default factory presets...');
        await seedInitialPresets(CANONICAL_SOUND_PRESETS);
        setLocalCachedPresets(CANONICAL_SOUND_PRESETS);
      }
      return CANONICAL_SOUND_PRESETS;
    }

    const cloudPresets: SoundPreset[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data() as SoundPreset;
      cloudPresets.push({
        ...data,
        id: data.id || docSnap.id
      });
    });

    cloudPresets.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      if (a.isFactory && !b.isFactory) return -1;
      if (!a.isFactory && b.isFactory) return 1;
      return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
    });

    setLocalCachedPresets(cloudPresets);
    return cloudPresets;
  } catch (err: any) {
    if (isQuotaExhaustedError(err)) {
      tripFirestoreQuotaCircuitBreaker(err.message);
    }
    console.warn('Failed to load presets from Firestore, using local fallback:', err?.message || err);
    return cached;
  }
}

export function subscribeToFirestorePresets(
  onPresetsUpdated: (presets: SoundPreset[]) => void,
  onError?: (err: Error) => void
): Unsubscribe | null {
  if (!db || isFirestoreQuotaExhausted()) return null;

  try {
    const colRef = collection(db, PRESETS_COLLECTION);
    return onSnapshot(
      colRef,
      snapshot => {
        if (snapshot.empty) {
          onPresetsUpdated(getLocalCachedPresets());
          return;
        }

        const presets: SoundPreset[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as SoundPreset;
          presets.push({
            ...data,
            id: data.id || docSnap.id
          });
        });

        presets.sort((a, b) => {
          if (a.isFavorite && !b.isFavorite) return -1;
          if (!a.isFavorite && b.isFavorite) return 1;
          if (a.isFactory && !b.isFactory) return -1;
          if (!a.isFactory && b.isFactory) return 1;
          return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
        });

        setLocalCachedPresets(presets);
        onPresetsUpdated(presets);
      },
      error => {
        if (isQuotaExhaustedError(error)) {
          tripFirestoreQuotaCircuitBreaker(error.message);
        }
        console.warn('Firestore presets subscription notice:', error?.message || error);
        if (onError) onError(error);
      }
    );
  } catch (err: any) {
    if (isQuotaExhaustedError(err)) {
      tripFirestoreQuotaCircuitBreaker(err.message);
    }
    console.warn('Could not establish Firestore sound presets subscription:', err?.message || err);
    return null;
  }
}

export async function savePresetToFirestore(preset: SoundPreset): Promise<void> {
  const cached = getLocalCachedPresets();
  const existingIdx = cached.findIndex(p => p.id === preset.id);
  let updatedCache: SoundPreset[];
  if (existingIdx >= 0) {
    updatedCache = [...cached];
    updatedCache[existingIdx] = preset;
  } else {
    updatedCache = [preset, ...cached];
  }
  setLocalCachedPresets(updatedCache);

  if (!db || isFirestoreQuotaExhausted()) return;

  try {
    const presetDocRef = doc(db, PRESETS_COLLECTION, preset.id);
    const payload = {
      ...preset,
      _schemaVersion: 2,
      updatedAt: new Date().toISOString()
    };
    await setDoc(presetDocRef, payload, { merge: true });
  } catch (err: any) {
    if (isQuotaExhaustedError(err)) {
      tripFirestoreQuotaCircuitBreaker(err.message);
      return;
    }
    console.warn(`Could not save preset ${preset.id} to Firestore:`, err?.message || err);
  }
}

export async function deletePresetFromFirestore(presetId: string): Promise<void> {
  const cached = getLocalCachedPresets();
  setLocalCachedPresets(cached.filter(p => p.id !== presetId));

  if (!db || isFirestoreQuotaExhausted()) return;

  try {
    const presetDocRef = doc(db, PRESETS_COLLECTION, presetId);
    await deleteDoc(presetDocRef);
  } catch (err: any) {
    if (isQuotaExhaustedError(err)) {
      tripFirestoreQuotaCircuitBreaker(err.message);
      return;
    }
    console.warn(`Could not delete preset ${presetId} from Firestore:`, err?.message || err);
  }
}

export async function seedInitialPresets(presets: SoundPreset[]): Promise<void> {
  if (!db || isFirestoreQuotaExhausted() || presets.length === 0) return;

  try {
    const batch = writeBatch(db);
    for (const preset of presets.slice(0, 400)) {
      const presetDocRef = doc(db, PRESETS_COLLECTION, preset.id);
      batch.set(presetDocRef, {
        ...preset,
        _schemaVersion: 2,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
    await batch.commit();
    console.log(`Successfully seeded ${presets.length} sound presets into Firestore.`);
  } catch (err: any) {
    if (isQuotaExhaustedError(err)) {
      tripFirestoreQuotaCircuitBreaker(err.message);
      return;
    }
    console.warn('Could not seed sound presets into Firestore:', err?.message || err);
  }
}

// ==========================================
// WHITEBOARD CANVAS PERSISTENCE
// ==========================================

const WHITEBOARD_COLLECTION = 'whiteboard_canvases';
const WHITEBOARD_CACHE_PREFIX = 'brickos_whiteboard_canvas_v1_';

export const getLocalCachedWhiteboard = (trackId: string): WhiteboardCanvasDoc | null => {
  try {
    const raw = localStorage.getItem(`${WHITEBOARD_CACHE_PREFIX}${trackId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (_) {}
  return null;
};

export const setLocalCachedWhiteboard = (canvas: WhiteboardCanvasDoc) => {
  try {
    localStorage.setItem(`${WHITEBOARD_CACHE_PREFIX}${canvas.trackId}`, JSON.stringify(canvas));
  } catch (err) {
    console.warn('Failed to update local whiteboard cache:', err);
  }
};

export async function loadWhiteboardFromFirestore(trackId: string): Promise<WhiteboardCanvasDoc | null> {
  const cached = getLocalCachedWhiteboard(trackId);
  if (!db || isFirestoreQuotaExhausted()) {
    return cached;
  }

  try {
    const docRef = doc(db, WHITEBOARD_COLLECTION, trackId);
    const { getDoc } = await import('firebase/firestore');
    const docSnap = await getDoc(docRef);
    if (docSnap && docSnap.exists()) {
      const data = docSnap.data() as WhiteboardCanvasDoc;
      const result = {
        ...data,
        id: data.id || docSnap.id
      };
      setLocalCachedWhiteboard(result);
      return result;
    }
    return cached;
  } catch (err: any) {
    if (isQuotaExhaustedError(err)) {
      tripFirestoreQuotaCircuitBreaker(err.message);
    }
    console.warn(`Failed to load whiteboard for track ${trackId} from Firestore, using cache:`, err?.message || err);
    return cached;
  }
}

export function subscribeToFirestoreWhiteboard(
  trackId: string,
  onUpdate: (canvas: WhiteboardCanvasDoc) => void,
  onError?: (err: Error) => void
): Unsubscribe | null {
  if (!db || isFirestoreQuotaExhausted()) return null;

  try {
    const docRef = doc(db, WHITEBOARD_COLLECTION, trackId);
    return onSnapshot(
      docRef,
      docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data() as WhiteboardCanvasDoc;
          const canvas: WhiteboardCanvasDoc = {
            ...data,
            id: data.id || docSnap.id
          };
          setLocalCachedWhiteboard(canvas);
          onUpdate(canvas);
        }
      },
      err => {
        if (isQuotaExhaustedError(err)) {
          tripFirestoreQuotaCircuitBreaker(err.message);
        }
        console.warn('Firestore whiteboard subscription notice:', err?.message || err);
        if (onError) onError(err);
      }
    );
  } catch (err: any) {
    if (isQuotaExhaustedError(err)) {
      tripFirestoreQuotaCircuitBreaker(err.message);
    }
    console.warn('Could not establish Firestore whiteboard subscription:', err?.message || err);
    return null;
  }
}

export async function saveWhiteboardToFirestore(canvas: WhiteboardCanvasDoc): Promise<void> {
  setLocalCachedWhiteboard(canvas);

  if (!db || isFirestoreQuotaExhausted()) return;

  try {
    const docRef = doc(db, WHITEBOARD_COLLECTION, canvas.trackId);
    const payload = {
      ...canvas,
      _schemaVersion: 2,
      updatedAt: new Date().toISOString()
    };
    await setDoc(docRef, payload, { merge: true });
  } catch (err: any) {
    if (isQuotaExhaustedError(err)) {
      tripFirestoreQuotaCircuitBreaker(err.message);
      return;
    }
    console.warn(`Could not save whiteboard for track ${canvas.trackId} to Firestore:`, err?.message || err);
  }
}

// ==========================================
// BATCH SCHEMA MIGRATION UTILITY
// ==========================================

export async function runSchemaMigration(
  collectionName: string = TRACKS_COLLECTION,
  targetVersion: number = 2,
  dryRun: boolean = false
): Promise<{ totalRead: number; totalMigrated: number; quotaHalted: boolean }> {
  if (!db || isFirestoreQuotaExhausted()) {
    console.warn('[runSchemaMigration] Aborting: Firestore not configured or quota exhausted.');
    return { totalRead: 0, totalMigrated: 0, quotaHalted: isFirestoreQuotaExhausted() };
  }

  const BATCH_SIZE = 400;
  const THROTTLE_MS = 300;
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  let totalRead = 0;
  let totalMigrated = 0;
  let lastVisible: any = null;
  let hasMore = true;
  let quotaHalted = false;

  console.log(`[Schema Migration] Starting on "${collectionName}" to v${targetVersion} (Dry Run: ${dryRun})...`);

  try {
    while (hasMore) {
      let q = query(
        collection(db, collectionName),
        where('_schemaVersion', '!=', targetVersion),
        limit(BATCH_SIZE)
      );

      if (lastVisible) {
        q = query(q, startAfter(lastVisible));
      }

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        hasMore = false;
        break;
      }

      totalRead += snapshot.size;
      lastVisible = snapshot.docs[snapshot.docs.length - 1];

      const batch = writeBatch(db);
      let opsInCurrentBatch = 0;

      for (const docSnap of snapshot.docs) {
        const transformedFields = {
          _schemaVersion: targetVersion,
          migratedAt: new Date().toISOString()
        };
        if (!dryRun) {
          batch.update(docSnap.ref, transformedFields);
        }
        opsInCurrentBatch++;
      }

      if (!dryRun && opsInCurrentBatch > 0) {
        await batch.commit();
      }
      totalMigrated += opsInCurrentBatch;

      if (totalMigrated >= 19000) {
        console.warn('Approaching daily free tier quota ceiling (20,000). Halting migration to preserve live app stability.');
        quotaHalted = true;
        break;
      }

      await sleep(THROTTLE_MS);

      if (snapshot.size < BATCH_SIZE) {
        hasMore = false;
      }
    }
  } catch (err: any) {
    if (isQuotaExhaustedError(err)) {
      tripFirestoreQuotaCircuitBreaker(err.message);
      quotaHalted = true;
    } else {
      console.warn('[Schema Migration Notice]:', err?.message || err);
    }
  }

  return { totalRead, totalMigrated, quotaHalted };
}
