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
  Unsubscribe
} from 'firebase/firestore';
import { Track, CompositionSession } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

const TRACKS_COLLECTION = 'tracks';
const LOCAL_STORAGE_KEY = 'brickos_catalog_cloud_cache_v1';
const SESSIONS_COLLECTION = 'composition_sessions';
const SESSIONS_LOCAL_STORAGE_KEY = 'brickos_sessions_cloud_cache_v1';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

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
  return !!db && !!app;
};

// Fallback helper to get local cached tracks
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

// Fallback helper to save local cached tracks
export const setLocalCachedTracks = (tracks: Track[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tracks));
  } catch (_) {}
};

/**
 * Fetch all tracks from the persistent Firestore database.
 * If empty, seeds initial tracks and returns them.
 */
export async function loadTracksFromFirestore(canonicalTracks: Track[]): Promise<Track[]> {
  if (!db) {
    const cached = getLocalCachedTracks();
    return cached && cached.length > 0 ? cached : canonicalTracks;
  }

  try {
    const colRef = collection(db, TRACKS_COLLECTION);
    const snapshot = await getDocs(colRef);

    if (snapshot.empty) {
      // Collection is brand new; seed with canonical tracks in background
      console.log('Firestore tracks collection is empty, seeding catalog...');
      await seedInitialCatalog(canonicalTracks);
      setLocalCachedTracks(canonicalTracks);
      return canonicalTracks;
    }

    const fetchedTracks: Track[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data() as Track;
      fetchedTracks.push({
        ...data,
        id: data.id || docSnap.id
      });
    });

    // Sort stably: Canonical IDs first, then newly added tracks
    fetchedTracks.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }));

    setLocalCachedTracks(fetchedTracks);
    return fetchedTracks;
  } catch (err) {
    console.error('Failed to load tracks from Firestore:', err);
    const cached = getLocalCachedTracks();
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
  if (!db) return null;

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
        console.warn('Firestore subscription error:', error);
        if (onError) onError(error);
      }
    );
  } catch (err: any) {
    console.warn('Could not establish Firestore subscription:', err);
    return null;
  }
}

/**
 * Upsert a track in Firestore
 */
export async function saveTrackToFirestore(track: Track): Promise<void> {
  // Update local cache immediately
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

  if (!db) return;

  try {
    const trackDocRef = doc(db, TRACKS_COLLECTION, track.id);
    const payload = {
      ...track,
      updatedAt: new Date().toISOString()
    };
    await setDoc(trackDocRef, payload, { merge: true });
  } catch (err) {
    console.error(`Failed to save track ${track.id} to Firestore:`, err);
    throw err;
  }
}

/**
 * Batch seed canonical tracks into Firestore
 */
export async function seedInitialCatalog(tracks: Track[]): Promise<void> {
  if (!db) return;

  try {
    const batch = writeBatch(db);
    // Firestore batch limit is 500 ops; catalog has ~26 tracks
    for (const track of tracks) {
      const trackDocRef = doc(db, TRACKS_COLLECTION, track.id);
      batch.set(trackDocRef, {
        ...track,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
    await batch.commit();
    console.log(`Successfully seeded ${tracks.length} tracks into Firestore.`);
  } catch (err) {
    console.error('Failed to seed catalog into Firestore:', err);
  }
}

/**
 * Delete a track from Firestore
 */
export async function deleteTrackFromFirestore(trackId: string): Promise<void> {
  const cached = getLocalCachedTracks() || [];
  setLocalCachedTracks(cached.filter(t => t.id !== trackId));

  if (!db) return;

  try {
    const trackDocRef = doc(db, TRACKS_COLLECTION, trackId);
    await deleteDoc(trackDocRef);
  } catch (err) {
    console.error('Failed to delete track ${trackId} from Firestore:', err);
    throw err;
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

/**
 * Load all composition sessions from Firestore. Seeds default initial sessions if empty.
 */
export async function loadSessionsFromFirestore(canonicalSessions: CompositionSession[] = []): Promise<CompositionSession[]> {
  if (!db) {
    const cached = getLocalCachedSessions();
    return cached && cached.length > 0 ? cached : canonicalSessions;
  }

  try {
    const colRef = collection(db, SESSIONS_COLLECTION);
    const snapshot = await getDocs(colRef);

    if (snapshot.empty) {
      if (canonicalSessions.length > 0) {
        console.log('Firestore sessions collection is empty, seeding canonical sessions...');
        await seedInitialSessions(canonicalSessions);
        setLocalCachedSessions(canonicalSessions);
        return canonicalSessions;
      }
      return [];
    }

    const fetchedSessions: CompositionSession[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data() as CompositionSession;
      fetchedSessions.push({
        ...data,
        id: data.id || docSnap.id
      });
    });

    // Sort by updated date descending (most recent sessions first), with pinned first
    fetchedSessions.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
    });

    setLocalCachedSessions(fetchedSessions);
    return fetchedSessions;
  } catch (err) {
    console.error('Failed to load composition sessions from Firestore:', err);
    const cached = getLocalCachedSessions();
    return cached && cached.length > 0 ? cached : canonicalSessions;
  }
}

/**
 * Real-time listener for composition session updates
 */
export function subscribeToFirestoreSessions(
  onSessionsUpdated: (sessions: CompositionSession[]) => void,
  onError?: (err: Error) => void
): Unsubscribe | null {
  if (!db) return null;

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
        console.warn('Firestore sessions subscription error:', error);
        if (onError) onError(error);
      }
    );
  } catch (err: any) {
    console.warn('Could not establish Firestore sessions subscription:', err);
    return null;
  }
}

/**
 * Upsert a composition session into Firestore
 */
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

  if (!db) return;

  try {
    const sessionDocRef = doc(db, SESSIONS_COLLECTION, session.id);
    const payload = {
      ...session,
      updatedAt: new Date().toISOString()
    };
    await setDoc(sessionDocRef, payload, { merge: true });
  } catch (err) {
    console.error(`Failed to save session ${session.id} to Firestore:`, err);
    throw err;
  }
}

/**
 * Delete a composition session from Firestore
 */
export async function deleteSessionFromFirestore(sessionId: string): Promise<void> {
  const cached = getLocalCachedSessions() || [];
  setLocalCachedSessions(cached.filter(s => s.id !== sessionId));

  if (!db) return;

  try {
    const sessionDocRef = doc(db, SESSIONS_COLLECTION, sessionId);
    await deleteDoc(sessionDocRef);
  } catch (err) {
    console.error(`Failed to delete session ${sessionId} from Firestore:`, err);
    throw err;
  }
}

/**
 * Batch seed initial sessions
 */
export async function seedInitialSessions(sessions: CompositionSession[]): Promise<void> {
  if (!db || sessions.length === 0) return;

  try {
    const batch = writeBatch(db);
    for (const session of sessions) {
      const sessionDocRef = doc(db, SESSIONS_COLLECTION, session.id);
      batch.set(sessionDocRef, {
        ...session,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
    await batch.commit();
    console.log(`Successfully seeded ${sessions.length} composition sessions into Firestore.`);
  } catch (err) {
    console.error('Failed to seed sessions into Firestore:', err);
  }
}

