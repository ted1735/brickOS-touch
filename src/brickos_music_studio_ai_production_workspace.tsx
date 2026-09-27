import React, { useState, useRef, useEffect } from 'react';
import {
  Music,
  FileText,
  Film,
  Layers,
  Settings,
  Plus,
  Play,
  Square,
  Volume2,
  Sliders,
  Scissors,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Upload,
  Download,
  Copy,
  Terminal,
  Share2,
  RefreshCw,
  Clock,
  Sparkles,
  Zap,
  Code,
  Clapperboard,
  SlidersHorizontal,
  FileUp,
  Activity,
  HardDrive,
  GitBranch,
  ShieldCheck,
  Send,
  Search,
  MessageSquare,
  Check,
  Heart,
  Flame,
  Radio,
  Eye,
  Video,
  Image as ImageIcon,
  ExternalLink,
  ChevronRight,
  Info,
  Maximize2,
  Database,
  Disc,
  Cloud,
  FolderKanban,
  Save,
  RefreshCcw,
  Sun,
  Moon,
  HelpCircle,
  Keyboard,
  Edit3,
  Trash2
} from 'lucide-react';
import { Track, TrackStatus, TrackVersion, MixerTrack, GeneratedImage, GeneratedVideo, ChatMessage, CompositionSession, NextcloudFolderAsset, PromptItem, UniversalAssetItem } from './types';
import { UniversalAssetEditorModal } from './components/UniversalAssetEditorModal';
import { CANONICAL_TRACKS, NIGHTCAFE_DEFAULT_PROMPTS, VOCAL_ROSTER, EP_COLLECTIONS } from './data/canonicalCatalog';
import { INITIAL_COMPOSITION_SESSIONS } from './data/canonicalSessions';
import { audioMiniDaw } from './utils/audioEngine';
import { KanbanDashboardTab } from './components/KanbanDashboardTab';
import { LyricsAndSunoTab } from './components/LyricsAndSunoTab';
import { MiniDawMixerTab } from './components/MiniDawMixerTab';
import { MasteringLufsSuite } from './components/MasteringLufsSuite';
import { YouTubeSEOTab } from './components/YouTubeSEOTab';
import { OmniPostTab } from './components/OmniPostTab';
import { LiveMinistryChartsTab } from './components/LiveMinistryChartsTab';
import { RelationalDatabaseAndMatrixTab } from './components/RelationalDatabaseAndMatrixTab';
import { CreateProjectModal } from './components/CreateProjectModal';
import { CatalogSidebar } from './components/CatalogSidebar';
import { ProjectSessionsSidebar } from './components/ProjectSessionsSidebar';
import { SideNavigationPanel } from './components/SideNavigationPanel';
import { StudioTwoRowNavigation } from './components/StudioTwoRowNavigation';
import { GlobalAudioTransport } from './components/GlobalAudioTransport';
import { KeyboardShortcutsOverlay } from './components/KeyboardShortcutsOverlay';
import { useGlobalKeyboardShortcuts } from './hooks/useGlobalKeyboardShortcuts';
import { NextcloudBentoSyncTab } from './components/NextcloudBentoSyncTab';
import { PromptEngineeringLibraryTab } from './components/PromptEngineeringLibraryTab';
import { VideoExpressAgentTab } from './components/VideoExpressAgentTab';
import { SongVersionCompareTab } from './components/SongVersionCompareTab';
import { BlockSuiteBrainstormingTab } from './components/BlockSuiteBrainstormingTab';
import { GoogleFlowIntegrationHub } from './components/GoogleFlowIntegrationHub';
import { SectionInstructionModal, StudioSectionId } from './components/SectionInstructionModal';
import { SectionQuickHelpBanner } from './components/SectionQuickHelpBanner';
import { getNextVersionString, CURRENT_STUDIO_VERSION } from './utils/versioning';
import {
  loadTracksFromFirestore,
  subscribeToFirestoreTracks,
  saveTrackToFirestore,
  deleteTrackFromFirestore,
  getLocalCachedTracks,
  isFirebaseConfigured,
  seedInitialCatalog,
  loadSessionsFromFirestore,
  subscribeToFirestoreSessions,
  saveSessionToFirestore,
  deleteSessionFromFirestore,
  getLocalCachedSessions
} from './lib/firebase';
import {
  PRODUCTION_NEXTCLOUD_WEBDAV,
  PRODUCTION_NEXTCLOUD_BASE,
  DEFAULT_WEBDAV_USER,
  generateCurlStemUploadCommand,
  generateRcloneConfigBlock,
  generateRcloneSyncCommand,
  generateWindowsDriveMountCommand,
  generateCatalogJsonManifest
} from './data/relationalCatalogBridge';

export default function BrickOSMusicStudioWorkspace() {
  const [tracks, setTracks] = useState<Track[]>(() => {
    const cached = getLocalCachedTracks();
    return cached && cached.length > 0 ? cached : CANONICAL_TRACKS;
  });
  const [selectedTrack, setSelectedTrack] = useState<Track>(() => {
    const cached = getLocalCachedTracks();
    return cached && cached.length > 0 ? cached[0] : CANONICAL_TRACKS[0];
  });
  const [activeTab, setActiveTab] = useState<
    'kanban' | 'lyrics' | 'mixer' | 'mastering' | 'youtube' | 'omnipost' | 'ministry' | 'veo_visuals' | 'nightcafe' | 'video_express' | 'telemetry' | 'coproducer' | 'search' | 'database' | 'nextcloud_sync' | 'prompt_library' | 'version-matrix' | 'brainstorming'
  >('kanban');
  const [copiedNotification, setCopiedNotification] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error' | 'info'>('success');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotificationType(type);
    setCopiedNotification(message);
    setTimeout(() => setCopiedNotification(''), 4000);
  };

  const copyToClipboard = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    showToast(`Copied ${label} to clipboard!`, 'success');
  };
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('brickos_theme');
      if (saved) return saved === 'dark';
      return true; // Default dark studio aesthetic
    }
    return true;
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('brickos_theme', isDarkMode ? 'dark' : 'light');
    }
  }, [isDarkMode]);

  const handleToggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // Firestore persistent cloud database synchronization state
  const [isDbConnected, setIsDbConnected] = useState<boolean>(isFirebaseConfigured());
  const [isDbSyncing, setIsDbSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>('');

  // Composition Sessions State
  const [sessions, setSessions] = useState<CompositionSession[]>(() => {
    const cached = getLocalCachedSessions();
    return cached && cached.length > 0 ? cached : INITIAL_COMPOSITION_SESSIONS;
  });
  const [activeSessionId, setActiveSessionId] = useState<string | null>('SES-01');
  const [sidebarMode, setSidebarMode] = useState<'sessions' | 'catalog'>('sessions');

  // Side Navigation Panel State (Projects, Sessions & Studio Assets)
  const [isSideNavOpen, setIsSideNavOpen] = useState<boolean>(true);
  const [isSideNavCollapsed, setIsSideNavCollapsed] = useState<boolean>(false);
  const [sideNavTab, setSideNavTab] = useState<'projects' | 'sessions' | 'assets'>('projects');

  // Initialize and synchronize with Firestore Database
  useEffect(() => {
    let unsubscribeTracks: (() => void) | null = null;
    let unsubscribeSessions: (() => void) | null = null;
    let isMounted = true;

    async function initCloudDatabase() {
      try {
        setIsDbSyncing(true);
        // Load cloud catalog from Firestore (seeds if empty)
        const cloudTracks = await loadTracksFromFirestore(CANONICAL_TRACKS);
        if (isMounted && cloudTracks && cloudTracks.length > 0) {
          setTracks(cloudTracks);
          setIsDbConnected(true);
          setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          setSelectedTrack(prev => {
            const found = cloudTracks.find(t => t.id === prev?.id);
            return found || cloudTracks[0];
          });
        }

        // Load composition sessions from Firestore (seeds if empty)
        const cloudSessions = await loadSessionsFromFirestore(INITIAL_COMPOSITION_SESSIONS);
        if (isMounted && cloudSessions && cloudSessions.length > 0) {
          setSessions(cloudSessions);
        }

        // Subscribe to real-time track updates across browser windows and sessions
        unsubscribeTracks = subscribeToFirestoreTracks(
          (realtimeTracks) => {
            if (isMounted && realtimeTracks && realtimeTracks.length > 0) {
              setTracks(realtimeTracks);
              setIsDbConnected(true);
              setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
              setSelectedTrack(prev => {
                const found = realtimeTracks.find(t => t.id === prev?.id);
                return found || prev;
              });
            }
          },
          (err) => {
            console.warn('Firestore real-time subscription error:', err);
          }
        );

        // Subscribe to real-time session changes across browser windows
        unsubscribeSessions = subscribeToFirestoreSessions(
          (realtimeSessions) => {
            if (isMounted && realtimeSessions && realtimeSessions.length > 0) {
              setSessions(realtimeSessions);
            }
          },
          (err) => {
            console.warn('Firestore sessions subscription error:', err);
          }
        );
      } catch (err) {
        console.error('Failed to initialize Firestore cloud catalog:', err);
      } finally {
        if (isMounted) setIsDbSyncing(false);
      }
    }

    initCloudDatabase();

    return () => {
      isMounted = false;
      if (unsubscribeTracks) unsubscribeTracks();
      if (unsubscribeSessions) unsubscribeSessions();
    };
  }, []);

  // Switch to a composition session
  const handleSelectSession = (session: CompositionSession) => {
    setActiveSessionId(session.id);
    
    // Find track or update selected track with snapshot
    const existingTrack = tracks.find(t => t.id === session.trackId);
    if (existingTrack) {
      // Apply snapshot properties so workbench immediately matches session
      const trackWithSnapshot: Track = {
        ...existingTrack,
        lyrics: session.snapshot.lyrics || existingTrack.lyrics,
        sunoPrompt: session.snapshot.sunoPrompt || existingTrack.sunoPrompt,
        negativePrompt: session.snapshot.negativePrompt || existingTrack.negativePrompt,
        engineSliders: session.snapshot.engineSliders || existingTrack.engineSliders,
        bpm: session.snapshot.bpm || existingTrack.bpm,
        key: session.snapshot.key || existingTrack.key,
        status: session.snapshot.status || existingTrack.status,
        notes: session.snapshot.notes || existingTrack.notes
      };
      setSelectedTrack(trackWithSnapshot);
    }

    if (session.activeTab && session.activeTab !== 'kanban') {
      setActiveTab(session.activeTab as any);
    } else if (activeTab === 'kanban') {
      setActiveTab('lyrics');
    }

    setCopiedNotification(`Switched to session: "${session.name}"`);
    setTimeout(() => setCopiedNotification(''), 3500);

    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsCatalogDrawerOpen(false);
    }
  };

  // Save current workspace state as new composition session
  const handleSaveCurrentSession = async (
    name: string,
    description: string,
    tags: string[],
    isPinned: boolean
  ) => {
    const newSessionId = `SES-${Date.now().toString().slice(-4)}`;
    const newSession: CompositionSession = {
      id: newSessionId,
      name,
      trackId: selectedTrack.id,
      trackTitle: selectedTrack.title,
      ep: selectedTrack.ep,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      activeTab: activeTab,
      description,
      tags: tags.length > 0 ? tags : ['Composition'],
      isPinned,
      color: '#6366f1',
      snapshot: {
        lyrics: selectedTrack.lyrics,
        sunoPrompt: selectedTrack.sunoPrompt,
        negativePrompt: selectedTrack.negativePrompt,
        engineSliders: selectedTrack.engineSliders,
        bpm: selectedTrack.bpm,
        key: selectedTrack.key,
        genre: selectedTrack.genre,
        vocal: selectedTrack.vocal,
        vocalCast: selectedTrack.vocalCast,
        thesis: selectedTrack.thesis,
        selahPrayed: selectedTrack.selahPrayed,
        status: selectedTrack.status,
        notes: selectedTrack.notes,
        versionsCount: selectedTrack.versions?.length || 1,
        latestVersionTag: selectedTrack.versions[selectedTrack.versions.length - 1]?.version || 'v1.0'
      }
    };

    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);

    try {
      setIsDbSyncing(true);
      await saveSessionToFirestore(newSession);
      setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setCopiedNotification(`Saved composition session "${newSession.name}" to Cloud!`);
      setTimeout(() => setCopiedNotification(''), 4000);
    } catch (err) {
      console.error('Failed to save session to Firestore:', err);
    } finally {
      setIsDbSyncing(false);
    }
  };

  // Update existing session snapshot with latest workspace edits
  const handleUpdateSessionSnapshot = async (sessionId: string) => {
    let updatedSession: CompositionSession | null = null;
    setSessions(prev =>
      prev.map(s => {
        if (s.id === sessionId) {
          updatedSession = {
            ...s,
            updatedAt: new Date().toISOString(),
            activeTab: activeTab,
            snapshot: {
              ...s.snapshot,
              lyrics: selectedTrack.lyrics,
              sunoPrompt: selectedTrack.sunoPrompt,
              negativePrompt: selectedTrack.negativePrompt,
              engineSliders: selectedTrack.engineSliders,
              bpm: selectedTrack.bpm,
              key: selectedTrack.key,
              status: selectedTrack.status,
              notes: selectedTrack.notes,
              versionsCount: selectedTrack.versions?.length || 1,
              latestVersionTag: selectedTrack.versions[selectedTrack.versions.length - 1]?.version || 'v1.0'
            }
          };
          return updatedSession;
        }
        return s;
      })
    );

    if (updatedSession) {
      try {
        setIsDbSyncing(true);
        await saveSessionToFirestore(updatedSession);
        setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setCopiedNotification(`Updated session snapshot for "${(updatedSession as CompositionSession).name}"!`);
        setTimeout(() => setCopiedNotification(''), 3500);
      } catch (err) {
        console.error('Failed to update session in Firestore:', err);
      } finally {
        setIsDbSyncing(false);
      }
    }
  };

  // Fork / Duplicate session
  const handleDuplicateSession = async (session: CompositionSession) => {
    const forkedId = `SES-${Date.now().toString().slice(-4)}`;
    const forkedSession: CompositionSession = {
      ...session,
      id: forkedId,
      name: `${session.name} (Fork)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPinned: false
    };

    setSessions(prev => [forkedSession, ...prev]);
    setActiveSessionId(forkedId);

    try {
      setIsDbSyncing(true);
      await saveSessionToFirestore(forkedSession);
      setCopiedNotification(`Forked session: "${forkedSession.name}"`);
      setTimeout(() => setCopiedNotification(''), 3500);
    } catch (err) {
      console.error('Failed to fork session:', err);
    } finally {
      setIsDbSyncing(false);
    }
  };

  // Delete session
  const handleDeleteSession = async (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
    }

    try {
      setIsDbSyncing(true);
      await deleteSessionFromFirestore(sessionId);
      setCopiedNotification('Session removed from cloud.');
      setTimeout(() => setCopiedNotification(''), 3000);
    } catch (err) {
      console.error('Failed to delete session:', err);
    } finally {
      setIsDbSyncing(false);
    }
  };

  // Toggle Pin session
  const handleTogglePinSession = async (session: CompositionSession) => {
    const updated: CompositionSession = {
      ...session,
      isPinned: !session.isPinned,
      updatedAt: new Date().toISOString()
    };
    setSessions(prev => {
      const next = prev.map(s => (s.id === session.id ? updated : s));
      next.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
      });
      return next;
    });

    try {
      await saveSessionToFirestore(updated);
    } catch (err) {
      console.error('Failed to update session pin status:', err);
    }
  };

  // Update track status from Kanban and persist to Firestore
  const handleUpdateTrackStatus = async (trackId: string, newStatus: TrackStatus) => {
    let targetTrack: Track | undefined;
    setTracks(prev => prev.map(t => {
      if (t.id === trackId) {
        targetTrack = { ...t, status: newStatus };
        return targetTrack;
      }
      return t;
    }));
    if (selectedTrack.id === trackId) {
      setSelectedTrack(prev => ({ ...prev, status: newStatus }));
    }
    if (targetTrack) {
      try {
        setIsDbSyncing(true);
        await saveTrackToFirestore(targetTrack);
        setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch (err) {
        console.warn('Could not save status change to Firestore:', err);
      } finally {
        setIsDbSyncing(false);
      }
    }
  };

  // Modal for new track project creation
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCatalogDrawerOpen, setIsCatalogDrawerOpen] = useState(false);

  // Add new track from Modal or Kanban and permanently persist to Firestore
  const handleAddNewTrack = async (newTrack: Track, openLyricEngine = true, generatedPrompts?: PromptItem[]) => {
    setTracks(prev => [newTrack, ...prev]);
    setSelectedTrack(newTrack);
    
    // If standard schema prompts were generated, save to NightCafe queue and Prompt Library
    if (generatedPrompts && generatedPrompts.length > 0) {
      setNightCafePrompts(prev => [
        ...generatedPrompts.map((p, idx) => ({
          song: p.song,
          idx: idx + 1,
          title: p.title,
          prompt: p.prompt,
          aspectRatio: p.aspectRatio,
          type: (p.modality === 'audio' ? 'storyboard' : p.modality) as 'image' | 'video' | 'storyboard',
          engine: p.engine,
          initialPrompt: p.initialPrompt,
          extensionPrompt: p.extensionPrompt,
          audioCues: p.audioCues,
          tags: p.tags
        })),
        ...prev
      ]);

      try {
        const saved = localStorage.getItem('brickos_prompt_library');
        const existing: PromptItem[] = saved ? JSON.parse(saved) : [];
        const updated = [...generatedPrompts, ...existing];
        localStorage.setItem('brickos_prompt_library', JSON.stringify(updated));
      } catch (err) {
        console.warn('Could not store generated prompts to localStorage:', err);
      }
    }

    if (openLyricEngine) {
      setActiveTab('lyrics');
    }
    try {
      setIsDbSyncing(true);
      await saveTrackToFirestore(newTrack);
      setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setCopiedNotification(`Created & saved "${newTrack.title}" (${newTrack.id}) with 4-Phase Storyboard Prompts to Cloud Firestore!`);
      setTimeout(() => setCopiedNotification(''), 4500);
    } catch (err) {
      console.error('Failed to save new track to cloud Firestore:', err);
    } finally {
      setIsDbSyncing(false);
    }
  };

  // Manual Re-sync / Backup catalog to Firestore
  const handleManualSyncDatabase = async () => {
    try {
      setIsDbSyncing(true);
      await seedInitialCatalog(tracks);
      setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      showToast(`Successfully synced all ${tracks.length} tracks to Cloud Firestore!`, 'success');
    } catch (err: any) {
      showToast(`Cloud sync error: ${err.message || 'Check connection'}`, 'error');
    } finally {
      setIsDbSyncing(false);
    }
  };

  // Apply a matched Nextcloud asset directly to a catalog track
  const handleApplyAssetToTrack = async (asset: NextcloudFolderAsset, trackId: string) => {
    const targetTrack = tracks.find(t => t.id === trackId);
    if (!targetTrack) return;

    const noteLine = `\n[Nextcloud Asset Linked]: ${asset.filename} (${asset.category}) [${asset.fileSizeFormatted}]`;
    const updatedTrack: Track = {
      ...targetTrack,
      notes: (targetTrack.notes || '') + noteLine,
    };

    if (asset.category === 'MASTER_AUDIO') {
      updatedTrack.status = 'Audio Master';
    } else if (asset.category === 'UVR5_VOCAL_STEM') {
      if (updatedTrack.status === 'Idea / Concept' || updatedTrack.status === 'Lyrics Finalized') {
        updatedTrack.status = 'UVR5 Stem Prep';
      }
    }

    if (asset.previewImageUrl && (asset.category === 'VISUAL_ARTWORK' || asset.category === 'VIDEO_REEL')) {
      setGeneratedImages(prev => [
        {
          id: `img-nc-${Date.now()}`,
          url: asset.previewImageUrl!,
          prompt: asset.notes || asset.filename,
          aspectRatio: asset.filename.includes('9x16') ? '9:16' : '1:1',
          timestamp: new Date().toISOString().split('T')[0],
          mode: 'create',
          trackTitle: targetTrack.title
        },
        ...prev
      ]);
    }

    setTracks(prev => prev.map(t => (t.id === trackId ? updatedTrack : t)));
    if (selectedTrack.id === trackId) {
      setSelectedTrack(updatedTrack);
    }

    try {
      setIsDbSyncing(true);
      await saveTrackToFirestore(updatedTrack);
      setCopiedNotification(`Attached "${asset.filename}" to track ${targetTrack.title}!`);
      setTimeout(() => setCopiedNotification(''), 4000);
    } catch (err) {
      console.warn('Could not persist track update to Firestore:', err);
    } finally {
      setIsDbSyncing(false);
    }
  };

  // Catalog filtering & search
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedEpFilter, setSelectedEpFilter] = useState('ALL');

  // Storage & Nextcloud Modal
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
  const [isSunoBridgeOpen, setIsSunoBridgeOpen] = useState(false);

  // Section Guide & SOP Modal State
  const [isSectionGuideOpen, setIsSectionGuideOpen] = useState(false);
  const [sectionGuideTarget, setSectionGuideTarget] = useState<StudioSectionId>('kanban');

  const handleOpenSectionGuide = (sectionId?: StudioSectionId) => {
    if (sectionId) {
      setSectionGuideTarget(sectionId);
    } else {
      setSectionGuideTarget(activeTab as StudioSectionId);
    }
    setIsSectionGuideOpen(true);
  };

  // Mini-DAW Mixer State
  const [isPlaying, setIsPlaying] = useState(false);
  const [masterVolume, setMasterVolume] = useState(85);
  const [trackStates, setTrackStates] = useState<MixerTrack[]>([
    { id: 1, name: "Track 1: Master Instrumental", vol: 90, pan: 0, muted: false, solo: false, trimIn: 0, trimOut: 100, freq: 110, waveType: 'sawtooth', color: '#6366f1' },
    { id: 2, name: "Track 2: Dry Vocal (UVR5)", vol: 95, pan: 0, muted: false, solo: false, trimIn: 0, trimOut: 100, freq: 220, waveType: 'triangle', color: '#10b981' },
    { id: 3, name: "Track 3: Harmonies & Ad-libs", vol: 75, pan: -20, muted: false, solo: false, trimIn: 0, trimOut: 100, freq: 330, waveType: 'sine', color: '#f59e0b' },
    { id: 4, name: "Track 4: Click & Ambient Plate", vol: 60, pan: 20, muted: false, solo: false, trimIn: 0, trimOut: 100, freq: 440, waveType: 'square', color: '#ec4899' }
  ]);

  // A/B Master Switcher State
  const [activeBus, setActiveBus] = useState<'master' | 'suno' | 'vocal' | 'instrumental' | 'ref'>('master');
  const [isMonoCollapse, setIsMonoCollapse] = useState(false);

  // Global Audio Engine Controls for Keyboard Shortcuts
  const [isMutedAudio, setIsMutedAudio] = useState(false);

  const handleTogglePlayPauseAudio = () => {
    if (audioMiniDaw.getIsPlaying()) {
      audioMiniDaw.stopPlayback();
      setIsPlaying(false);
      showToast('Audio preview paused [Space]', 'info');
    } else {
      audioMiniDaw.init();
      audioMiniDaw.startPlayback(trackStates, selectedTrack.bpm);
      setIsPlaying(true);
      showToast(`Playing stem preview: "${selectedTrack.title}" (${selectedTrack.bpm} BPM) [Space]`, 'success');
    }
  };

  const handleToggleMuteAudio = () => {
    if (isMutedAudio) {
      audioMiniDaw.setMasterVolume(masterVolume);
      setIsMutedAudio(false);
      showToast('Master audio unmuted [M]', 'info');
    } else {
      audioMiniDaw.setMasterVolume(0);
      setIsMutedAudio(true);
      showToast('Master audio muted [M]', 'info');
    }
  };

  const handleResetAudioEngine = () => {
    audioMiniDaw.stopPlayback();
    setIsPlaying(false);
    showToast('Audio synthesizers reset [R]', 'info');
  };

  const handleNextTrack = () => {
    const currentIndex = tracks.findIndex(t => t.id === selectedTrack.id);
    const nextIndex = (currentIndex + 1) % tracks.length;
    const nextTrack = tracks[nextIndex];
    setSelectedTrack(nextTrack);
    showToast(`Switched to: ${nextTrack.id} - ${nextTrack.title} [ ] ]`, 'info');
  };

  const handlePreviousTrack = () => {
    const currentIndex = tracks.findIndex(t => t.id === selectedTrack.id);
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    const prevTrack = tracks[prevIndex];
    setSelectedTrack(prevTrack);
    showToast(`Switched to: ${prevTrack.id} - ${prevTrack.title} [ [ ]`, 'info');
  };

  // Global Keyboard Shortcuts Manager Hook
  const {
    isCheatSheetOpen,
    setIsCheatSheetOpen,
    openCheatSheet,
    closeCheatSheet,
    toggleCheatSheet
  } = useGlobalKeyboardShortcuts({
    onNavigateToTab: (tab) => {
      setActiveTab(tab as any);
      showToast(`Switched to ${tab.replace('_', ' ').toUpperCase()}`, 'info');
    },
    onTogglePlayPauseAudio: handleTogglePlayPauseAudio,
    onToggleMuteAudio: handleToggleMuteAudio,
    onResetAudioEngine: handleResetAudioEngine,
    onPreviousTrack: handlePreviousTrack,
    onNextTrack: handleNextTrack,
    onOpenCreateProject: () => setIsCreateModalOpen(true),
    onOpenSunoBridge: () => setIsSunoBridgeOpen(true),
    onOpenSectionGuide: () => handleOpenSectionGuide(activeTab as StudioSectionId),
    onToggleTheme: handleToggleTheme,
    onToggleSideNav: () => {
      setIsSideNavOpen(prev => !prev);
      showToast('Toggled side navigation [Alt+B]', 'info');
    },
    onCloseModals: () => {
      setIsCreateModalOpen(false);
      setIsSunoBridgeOpen(false);
      setIsSectionGuideOpen(false);
    }
  });

  // NightCafe prompts
  const [nightCafePrompts, setNightCafePrompts] = useState(NIGHTCAFE_DEFAULT_PROMPTS);

  // Prompt Vault & Storyboard Engine State
  const [promptSongFilter, setPromptSongFilter] = useState('All');
  const [promptTypeFilter, setPromptTypeFilter] = useState<'all' | 'image' | 'video'>('all');
  const [promptSearchQuery, setPromptSearchQuery] = useState('');
  const [expandedPromptIdx, setExpandedPromptIdx] = useState<number | null>(null);

  // Visual & Veo State
  const [imagePrompt, setImagePrompt] = useState('Cinematic album cover for sovereign faith album, weathered cedar wood, cracked gold Kintsugi seams, warm dramatic chiaroscuro lighting, photorealistic 8k');
  const [imageAspectRatio, setImageAspectRatio] = useState('1:1');
  const [imageMode, setImageMode] = useState<'create' | 'edit'>('create');
  const [imageModel, setImageModel] = useState('gemini-3.1-flash-image-preview');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('brickos_studio_images');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'img-1',
        name: "The Master's Hand (Nashville Studio)",
        url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
        prompt: 'Weathered cedar woodshop with golden rays of morning light and sawdust motes, Nashville studio aesthetic',
        aspectRatio: '1:1',
        timestamp: '2026-09-06',
        mode: 'create',
        trackTitle: 'The Master\'s Hand',
        trackId: 'SOV-001',
        category: 'Cover Art',
        tags: ['Woodwork', 'Golden Hour', 'Nashville', 'Kintsugi']
      },
      {
        id: 'img-2',
        name: 'Meet Me Here (Blue-Collar Dawn)',
        url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
        prompt: 'Dark blue-collar truck cab at 5 AM in freezing rain, glowing amber dashboard dials',
        aspectRatio: '9:16',
        timestamp: '2026-09-06',
        mode: 'create',
        trackTitle: 'Meet Me Here',
        trackId: 'SOV-002',
        category: 'Social Reel Plate',
        tags: ['Truck', 'Freezing Rain', 'Amber Glow', 'Blue-Collar']
      }
    ];
  });

  const handleUpdateImage = (updated: GeneratedImage) => {
    setGeneratedImages(prev => {
      const next = prev.map(img => (img.id === updated.id ? updated : img));
      try {
        localStorage.setItem('brickos_studio_images', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    showToast(`Updated image asset "${updated.name || updated.trackTitle || 'Visual'}"`, 'success');
  };

  const handleDeleteImage = (id: string) => {
    setGeneratedImages(prev => {
      const next = prev.filter(img => img.id !== id);
      try {
        localStorage.setItem('brickos_studio_images', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    showToast('Image asset deleted successfully', 'info');
  };

  const handleAddImage = (newImg: GeneratedImage) => {
    setGeneratedImages(prev => {
      const next = [newImg, ...prev];
      try {
        localStorage.setItem('brickos_studio_images', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    showToast(`Added new asset "${newImg.name || 'Visual'}"`, 'success');
  };

  const [selectedImageForEdit, setSelectedImageForEdit] = useState<string | null>(null);
  const [imageAnalysisPrompt, setImageAnalysisPrompt] = useState('Analyze this visual for theological depth, album cover hierarchy, and viral 3-second hook retention.');
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [imageAnalysisResult, setImageAnalysisResult] = useState<string | null>(null);

  // Veo Video & Google Flow State
  const [videoPrompt, setVideoPrompt] = useState('Slow cinematic tracking shot gliding through an overgrown mossy stone archway opening into a sun-drenched cedar glade, morning mist rising, 8k photorealistic');
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoOperationName, setVideoOperationName] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<string>('idle');
  const [mediaGalleryFilter, setMediaGalleryFilter] = useState<'all' | 'images' | 'videos' | 'flow'>('all');

  const INITIAL_SEED_VIDEOS: GeneratedVideo[] = [
    {
      id: 'flow-sample-mmh-1',
      name: 'Meet Me Here - Hook Teaser (Google Flow Allotment #12)',
      operationName: 'google-flow-linked-asset',
      prompt: 'Cinematic 9:16 portrait of craftsman in Nashville timber workshop with floating cedar dust, dramatic sunlight rays, golden hour, slow motion 24fps',
      aspectRatio: '9:16',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
      status: 'ready',
      timestamp: new Date().toISOString(),
      modelUsed: 'Google Flow (Veo / Labs Allotment)',
      trackTitle: 'Meet Me Here',
      trackId: 'mmh',
      linkedTrackIds: ['mmh', 'calvary-grit'],
      tags: ['google-flow', 'allotted-generation', '9:16', 'cinematic'],
      notes: 'Generated using monthly Google Flow allotment (Shot 3 from MMH Storyboard). Linked across Meet Me Here and Calvary Grit.',
      category: 'Google Flow Reel',
      source: 'google_flow',
      flowAssetUrl: 'https://labs.google/flow',
      resolution: '1080x1920 Vertical HD',
      durationSec: 15
    }
  ];

  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('brickos_studio_videos');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return INITIAL_SEED_VIDEOS;
  });

  const handleUpdateVideo = (updated: GeneratedVideo) => {
    setGeneratedVideos(prev => {
      const next = prev.map(v => (v.id === updated.id ? updated : v));
      try {
        localStorage.setItem('brickos_studio_videos', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    showToast(`Updated video asset "${updated.name || 'Veo Reel'}"`, 'success');
  };

  const handleDeleteVideo = (id: string) => {
    setGeneratedVideos(prev => {
      const next = prev.filter(v => v.id !== id);
      try {
        localStorage.setItem('brickos_studio_videos', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    showToast('Video asset deleted', 'info');
  };

  const handleAddVideo = (newVid: GeneratedVideo) => {
    setGeneratedVideos(prev => {
      const next = [newVid, ...prev];
      try {
        localStorage.setItem('brickos_studio_videos', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    showToast(`Added new video "${newVid.name || 'Video Reel'}"`, 'success');
  };

  // Workspace Universal Asset Modal State
  const [workspaceAssetModalOpen, setWorkspaceAssetModalOpen] = useState(false);
  const [workspaceEditingAsset, setWorkspaceEditingAsset] = useState<UniversalAssetItem | null>(null);
  const [workspaceAssetModalMode, setWorkspaceAssetModalMode] = useState<'edit' | 'add' | 'gemini'>('edit');

  const handleOpenEditImageModal = (img: GeneratedImage, mode: 'edit' | 'gemini' = 'edit') => {
    const item: UniversalAssetItem = {
      id: img.id,
      type: 'image',
      name: img.name || img.trackTitle || selectedTrack.title,
      url: img.url,
      prompt: img.prompt,
      notes: img.notes || '',
      trackId: img.trackId || selectedTrack.id,
      trackTitle: img.trackTitle || selectedTrack.title,
      linkedTrackIds: img.linkedTrackIds || [],
      category: img.category || 'Cover Art',
      aspectRatio: img.aspectRatio || '1:1',
      tags: img.tags || ['Visual', 'Cover Art'],
      timestamp: img.timestamp || new Date().toISOString().split('T')[0],
      originalRef: img
    };
    setWorkspaceEditingAsset(item);
    setWorkspaceAssetModalMode(mode);
    setWorkspaceAssetModalOpen(true);
  };

  const handleOpenEditVideoModal = (vid: GeneratedVideo, mode: 'edit' | 'gemini' = 'edit') => {
    const isFlow = vid.source === 'google_flow' || vid.category?.toLowerCase().includes('flow');
    const item: UniversalAssetItem = {
      id: vid.id,
      type: 'video',
      name: vid.name || (isFlow ? `Flow Reel: ${vid.prompt.slice(0, 24)}...` : `Veo: ${vid.prompt.slice(0, 24)}...`),
      url: vid.videoUrl || '',
      prompt: vid.prompt,
      notes: vid.notes || '',
      trackId: vid.trackId || selectedTrack.id,
      trackTitle: vid.trackTitle || selectedTrack.title,
      linkedTrackIds: vid.linkedTrackIds || [],
      category: vid.category || (isFlow ? 'Google Flow Reel' : 'Veo Reel'),
      aspectRatio: vid.aspectRatio || '16:9',
      tags: vid.tags || (isFlow ? ['Google Flow', 'Video Reel'] : ['Veo', 'Video Reel']),
      timestamp: vid.timestamp || new Date().toISOString().split('T')[0],
      originalRef: vid,
      source: vid.source || (isFlow ? 'google_flow' : 'veo'),
      flowAssetUrl: vid.flowAssetUrl
    };
    setWorkspaceEditingAsset(item);
    setWorkspaceAssetModalMode(mode);
    setWorkspaceAssetModalOpen(true);
  };

  const handleOpenAddWorkspaceAsset = (type: 'image' | 'video' = 'image') => {
    const item: UniversalAssetItem = {
      id: `asset-${type}-${Date.now()}`,
      type,
      name: type === 'image' ? 'New Studio Artwork' : 'New Veo Reel',
      url: '',
      prompt: 'Cinematic album artwork for sovereign faith catalog, warm dramatic lighting, 8k photorealistic',
      notes: '',
      trackId: selectedTrack.id,
      trackTitle: selectedTrack.title,
      linkedTrackIds: [],
      category: type === 'image' ? 'Cover Art' : 'Veo Reel',
      aspectRatio: type === 'image' ? '1:1' : '16:9',
      tags: [type.toUpperCase(), 'Studio'],
      timestamp: new Date().toISOString().split('T')[0]
    };
    setWorkspaceEditingAsset(item);
    setWorkspaceAssetModalMode('add');
    setWorkspaceAssetModalOpen(true);
  };

  const handleSaveWorkspaceAsset = (updated: UniversalAssetItem) => {
    if (updated.type === 'image') {
      const imgObj: GeneratedImage = {
        id: updated.id,
        name: updated.name,
        url: updated.url || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
        prompt: updated.prompt || '',
        aspectRatio: updated.aspectRatio || '1:1',
        timestamp: updated.timestamp,
        mode: 'create',
        trackTitle: updated.trackTitle || selectedTrack.title,
        trackId: updated.trackId,
        linkedTrackIds: updated.linkedTrackIds,
        tags: updated.tags,
        notes: updated.notes,
        category: updated.category
      };
      if (generatedImages.some(img => img.id === updated.id)) {
        handleUpdateImage(imgObj);
      } else {
        handleAddImage(imgObj);
      }
    } else if (updated.type === 'video') {
      const isFlow = updated.source === 'google_flow' || updated.category?.toLowerCase().includes('flow');
      const vidObj: GeneratedVideo = {
        id: updated.id,
        name: updated.name,
        operationName: updated.originalRef?.operationName || `op-${updated.id}`,
        prompt: updated.prompt || '',
        aspectRatio: (updated.aspectRatio === '9:16' ? '9:16' : '16:9'),
        videoUrl: updated.url,
        status: 'ready',
        timestamp: updated.timestamp,
        modelUsed: updated.originalRef?.modelUsed || (isFlow ? 'Google Flow (Veo / Labs Allotment)' : 'veo-3.1-generate-preview'),
        trackTitle: updated.trackTitle || selectedTrack.title,
        trackId: updated.trackId,
        linkedTrackIds: updated.linkedTrackIds,
        tags: updated.tags,
        notes: updated.notes,
        category: updated.category,
        source: updated.source || (isFlow ? 'google_flow' : 'veo'),
        flowAssetUrl: updated.flowAssetUrl || updated.originalRef?.flowAssetUrl,
        resolution: updated.originalRef?.resolution,
        durationSec: updated.originalRef?.durationSec
      };
      if (generatedVideos.some(v => v.id === updated.id)) {
        handleUpdateVideo(vidObj);
      } else {
        handleAddVideo(vidObj);
      }
    }
  };
  const [videoAnalysisPrompt, setVideoAnalysisPrompt] = useState('Audit this video clip for 3-second hook velocity, lighting chiaroscuro, and 70% retention completion likelihood.');
  const [isVideoAnalyzing, setIsVideoAnalyzing] = useState(false);
  const [videoAnalysisResult, setVideoAnalysisResult] = useState<string | null>(null);

  // Gemini Search Grounding
  const [searchQuery, setSearchQuery] = useState('Billboard Christian and Gospel top chart trends 2026 tempo instrumentation');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{ answer: string; sources: Array<{ title: string; url: string }>; searchQueries: string[] } | null>(null);

  // Gemini Chatbot State
  const [chatRole, setChatRole] = useState<'lyric_assistant' | 'mastering_engineer' | 'omnipost_strategist'>('lyric_assistant');
  const [chatModel, setChatModel] = useState('gemini-3.5-flash');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      role: 'assistant',
      content: "Welcome to brickOS Master Studio. I am your Lead Theological & Lyrical Assistant. Let's ensure every track passes the OBI Funnel, strips all tired 'Christianese' clichés, and drives home the Throne Room Pivot by the bridge.",
      timestamp: '01:00 AM',
      model: 'gemini-3.5-flash'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Canvas visualizer ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Commit Song Changes & Updates and persist to Firestore
  const handleTrackUpdate = async (field: keyof Track | 'version_commit' | 'batch_update', value: any) => {
    let modifiedTrackToPersist: Track | null = null;
    const updated = tracks.map(t => {
      if (t.id === selectedTrack.id) {
        if (field === 'version_commit') {
          const versionLabel = value?.version || getNextVersionString(t.versions);
          const versionLyrics = value?.lyrics !== undefined ? value.lyrics : t.lyrics;
          const newVersion: TrackVersion = {
            version: versionLabel,
            timestamp: value?.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19),
            reason: value?.reason || 'Manual snapshot checkpoint',
            lyrics: versionLyrics,
            bpm: value?.bpm || t.bpm,
            genre: value?.genre || t.genre,
            vocal: value?.vocal || t.vocal
          };
          const newVersions = [...t.versions, newVersion];
          const modified = { 
            ...t, 
            versions: newVersions,
            ...(value?.lyrics !== undefined ? { lyrics: value.lyrics } : {}),
            ...(value?.auditHistory !== undefined ? { auditHistory: value.auditHistory } : {})
          };
          setSelectedTrack(modified);
          modifiedTrackToPersist = modified;
          return modified;
        }
        if (field === 'batch_update') {
          const modified = { ...t, ...value };
          setSelectedTrack(modified);
          modifiedTrackToPersist = modified;
          return modified;
        }
        const modified = { ...t, [field]: value };
        setSelectedTrack(modified);
        modifiedTrackToPersist = modified;
        return modified;
      }
      return t;
    });
    setTracks(updated);

    if (modifiedTrackToPersist) {
      try {
        await saveTrackToFirestore(modifiedTrackToPersist);
        setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } catch (err) {
        console.warn('Failed to persist track modification to Firestore:', err);
      }
    }
  };

  // Playback toggle
  const handleTogglePlayback = () => {
    if (isPlaying) {
      audioMiniDaw.stopPlayback();
      setIsPlaying(false);
    } else {
      audioMiniDaw.startPlayback(trackStates, selectedTrack.bpm);
      setIsPlaying(true);
    }
  };

  // Audio Canvas visualizer loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const analyser = audioMiniDaw.getAnalyser();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background subtle grid
      ctx.fillStyle = '#0a0f1d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 45) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      if (analyser && isPlaying) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        const barWidth = (canvas.width / bufferLength) * 2.4;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height * 0.85;

          const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
          gradient.addColorStop(0, '#4f46e5');
          gradient.addColorStop(0.5, '#06b6d4');
          gradient.addColorStop(1, '#10b981');

          ctx.fillStyle = gradient;
          ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

          x += barWidth;
        }

        const timeData = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(timeData);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#38bdf8';
        ctx.beginPath();
        const sliceWidth = canvas.width / bufferLength;
        let lineX = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = timeData[i] / 128.0;
          const y = (v * canvas.height) / 2;
          if (i === 0) ctx.moveTo(lineX, y);
          else ctx.lineTo(lineX, y);
          lineX += sliceWidth;
        }
        ctx.stroke();
      } else {
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#334155';
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('24-BIT / 48kHz PCM LOSSLESS SUMMING BUS • READY', canvas.width / 2, canvas.height / 2 - 10);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying]);

  // Image Generation Handler
  const handleGenerateImage = async () => {
    if (!imagePrompt) return;
    setIsGeneratingImage(true);
    try {
      const res = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt,
          aspectRatio: imageAspectRatio,
          mode: imageMode,
          base64Image: selectedImageForEdit,
          model: imageModel,
        }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        const newImg: GeneratedImage = {
          id: `img-${Date.now()}`,
          url: data.imageUrl,
          prompt: imagePrompt,
          aspectRatio: imageAspectRatio,
          timestamp: new Date().toISOString().split('T')[0],
          mode: imageMode,
          trackTitle: selectedTrack.title
        };
        setGeneratedImages([newImg, ...generatedImages]);
        showToast('Visual asset generated successfully!', 'success');
      } else if (data.error) {
        showToast(`Image Generation Failed: ${data.error}`, 'error');
      }
    } catch (e: any) {
      showToast(`Image Generation Error: ${e.message}`, 'error');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Image Analysis Handler
  const handleAnalyzeImage = async (imgUrl: string) => {
    setIsAnalyzingImage(true);
    setImageAnalysisResult(null);
    try {
      const res = await fetch('/api/gemini/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Image: imgUrl,
          prompt: imageAnalysisPrompt,
        }),
      });
      const data = await res.json();
      if (data.analysis) {
        setImageAnalysisResult(data.analysis);
      } else if (data.error) {
        setImageAnalysisResult(`Analysis error: ${data.error}`);
      }
    } catch (e: any) {
      setImageAnalysisResult(`Connection error: ${e.message}`);
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  // Veo Video Generation Handler
  const handleGenerateVeoVideo = async () => {
    if (!videoPrompt) return;
    setIsGeneratingVideo(true);
    setVideoStatus('Initiating Veo 3 render with veo-3.1-fast-generate-preview...');
    try {
      const res = await fetch('/api/gemini/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: videoPrompt,
          aspectRatio: videoAspectRatio,
          base64Image: selectedImageForEdit,
          resolution: '720p',
        }),
      });
      const data = await res.json();
      if (data.operationName) {
        setVideoOperationName(data.operationName);
        setVideoStatus(`Rendering video job: ${data.operationName}. Polling status...`);

        // Add pending video
        const newVid: GeneratedVideo = {
          id: `vid-${Date.now()}`,
          operationName: data.operationName,
          prompt: videoPrompt,
          aspectRatio: videoAspectRatio,
          status: 'pending',
          timestamp: new Date().toISOString().split('T')[0],
          modelUsed: data.modelUsed || 'veo-3.1-fast-generate-preview',
          trackTitle: selectedTrack.title
        };
        setGeneratedVideos([newVid, ...generatedVideos]);

        // Start polling loop
        pollVideoOperation(data.operationName, newVid.id);
      } else if (data.error) {
        setVideoStatus(`Veo Generation Error: ${data.error}`);
        setIsGeneratingVideo(false);
      }
    } catch (err: any) {
      setVideoStatus(`Veo Request Failed: ${err.message}`);
      setIsGeneratingVideo(false);
    }
  };

  // Poll video operation
  const pollVideoOperation = async (opName: string, vidId: string) => {
    let attempts = 0;
    const maxAttempts = 30;

    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch('/api/gemini/video-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operationName: opName }),
        });
        const data = await res.json();

        if (data.done) {
          clearInterval(interval);
          setIsGeneratingVideo(false);
          if (data.hasVideo) {
            setVideoStatus('Veo 3 Video ready!');
            // Download proxy URL
            const downloadUrl = `/api/gemini/video-download`;
            setGeneratedVideos(prev => prev.map(v => v.id === vidId ? { ...v, status: 'ready', videoUrl: downloadUrl } : v));
          } else if (data.error) {
            setVideoStatus(`Veo Error: ${data.error?.message || 'Generation failed'}`);
            setGeneratedVideos(prev => prev.map(v => v.id === vidId ? { ...v, status: 'failed' } : v));
          }
        } else {
          setVideoStatus(`Rendering frame pass ${attempts * 4}s (${Math.min(attempts * 5, 95)}%)...`);
        }

        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setIsGeneratingVideo(false);
          setVideoStatus('Video generation timed out. You may check operation later.');
        }
      } catch (e: any) {
        console.warn('Poll error:', e);
      }
    }, 5000);
  };

  // Search Grounding Handler
  const handleSearchGrounding = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    setSearchResult(null);
    try {
      const res = await fetch('/api/gemini/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await res.json();
      if (data.answer) {
        setSearchResult({
          answer: data.answer,
          sources: data.sources || [],
          searchQueries: data.searchQueries || [],
        });
      } else if (data.error) {
        showToast(`Search Grounding Error: ${data.error}`, 'error');
      }
    } catch (e: any) {
      showToast(`Search error: ${e.message}`, 'error');
    } finally {
      setIsSearching(false);
    }
  };

  // Chatbot send message
  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      model: chatModel
    };
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setChatInput('');
    setIsChatLoading(true);

    let systemInstruction = '';
    if (chatRole === 'lyric_assistant') {
      systemInstruction = `You are the Lead Theological & Lyrical Assistant for brickOS Master Records.
Enforce the OBI Funnel, eliminate Christianese cliches, demand the Throne Room Pivot by the bridge, and protect the 3:1 Sonic Scar rule. Currently working on: ${selectedTrack.title} (${selectedTrack.genre}, ${selectedTrack.bpm} BPM). Thesis: ${selectedTrack.thesis}`;
    } else if (chatRole === 'mastering_engineer') {
      systemInstruction = `You are the Senior Mastering Engineer for brickOS Studio.
Enforce -12.0 LUFS integrated loudness, -1.0 dBTP true peak ceiling, phase correlation checks for mono-collapse on mobile phones, 80Hz subtractive high-pass filters, and 5-10% parallel Vox Smash busses. Current track: ${selectedTrack.title}.`;
    } else {
      systemInstruction = `You are the Omnipost Social Media & 60-Second Hook Strategist for BRICK Records.
You specialize in 6:00 AM - 9:00 AM morning devotional algorithmic rollouts on TikTok/Reels, component storytelling around flutes/riffs, and gamified challenges. Current track: ${selectedTrack.title}.`;
    }

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          systemInstruction,
          model: chatModel,
        }),
      });
      const data = await res.json();
      if (data.reply) {
        setChatMessages(prev => [
          ...prev,
          {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            model: chatModel
          }
        ]);
      }
    } catch (err: any) {
      setChatMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `Error connecting to Gemini: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          model: chatModel
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Filtered tracks
  const filteredCatalogTracks = tracks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      t.genre.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      t.vocalCast.toLowerCase().includes(catalogSearch.toLowerCase());
    const matchesEp = selectedEpFilter === 'ALL' || t.ep.includes(selectedEpFilter);
    return matchesSearch && matchesEp;
  });

  return (
    <div className={`min-h-screen flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white transition-colors duration-200 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* GLOBAL NOTIFICATION TOAST */}
      {copiedNotification && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-bold border transition-all ${
            notificationType === 'error'
              ? 'bg-rose-600 text-white border-rose-400 shadow-rose-950/50'
              : notificationType === 'info'
              ? 'bg-indigo-600 text-white border-indigo-400 shadow-indigo-950/50'
              : 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-950/50'
          }`}
        >
          {notificationType === 'error' ? (
            <AlertCircle className="w-4 h-4 text-white shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 text-white shrink-0" />
          )}
          <span className="flex-1">{copiedNotification}</span>
          <button
            onClick={() => setCopiedNotification('')}
            className="ml-1.5 p-0.5 text-white/80 hover:text-white hover:scale-110 transition cursor-pointer"
            title="Dismiss notification"
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      {/* TOP NAVIGATION HEADER */}
      <header
        className={`px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-40 backdrop-blur-md flex-shrink-0 transition-colors duration-200 ${
          isDarkMode
            ? 'bg-slate-900/95 border-b border-slate-800 text-white'
            : 'bg-white/95 border-b border-slate-200 text-slate-900 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('kanban')}
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-indigo-500/25 ring-1 ring-white/20 hover:scale-105 active:scale-95 transition cursor-pointer"
            title="Return to Master Kanban Dashboard"
          >
            b
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 
                onClick={() => setActiveTab('kanban')}
                className={`text-base font-black tracking-wider transition cursor-pointer ${
                  isDarkMode ? 'text-white hover:text-indigo-300' : 'text-slate-900 hover:text-indigo-600'
                }`}
                title="Return to Master Kanban Dashboard"
              >
                brickOS MASTER STUDIO
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-mono text-[10px] font-bold border border-indigo-500/30">
                {CURRENT_STUDIO_VERSION}
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('nextcloud_sync')}
                className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-mono text-[10px] font-semibold border border-emerald-500/30 hover:bg-emerald-500/20 transition cursor-pointer"
                title="Nextcloud Live WebDAV & Folder 207332 Matcher"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>WebDAV / 207332</span>
              </button>
              <button
                type="button"
                onClick={handleManualSyncDatabase}
                className={`hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold border transition cursor-pointer ${
                  isDbConnected
                    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                }`}
                title={`Firestore Cloud Database: ${isDbConnected ? 'Connected & Auto-Saving' : 'Connecting...'} • Click to trigger cloud re-sync`}
              >
                <Database className={`w-3 h-3 ${isDbSyncing ? 'animate-spin text-amber-400' : 'text-cyan-400'}`} />
                <span>{isDbSyncing ? 'Syncing...' : isDbConnected ? 'Firestore Online' : 'Connecting...'}</span>
                {lastSyncedAt && <span className="text-[9px] opacity-70">({lastSyncedAt})</span>}
              </button>
            </div>
            <p className={`text-[11px] flex items-center gap-2 flex-wrap ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              <span>Ted Moyer (Primary Artist / OAC)</span>
              <span>•</span>
              <span className="text-indigo-500 font-medium">BRICK Records</span>
              <span>•</span>
              {activeTab === 'kanban' ? (
                <span className="text-amber-500 font-medium bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  {selectedEpFilter === 'ALL' ? 'All 4 EPs (26 Master Tracks)' : selectedEpFilter}
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <span className="text-indigo-500 font-bold">{selectedTrack.id}: {selectedTrack.title}</span>
                  <span>•</span>
                  <span className="text-amber-500 font-medium">{selectedTrack.ep}</span>
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Global Nav Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          <button
            onClick={() => setActiveTab('kanban')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition shadow-sm cursor-pointer ${
              activeTab === 'kanban'
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : isDarkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
            title="Master Kanban Pipeline Dashboard"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Dashboard</span>
          </button>

          {/* NEXTCLOUD WEBDAV MATCHER & SYNC (FOLDER 207332) */}
          <button
            onClick={() => setActiveTab('nextcloud_sync')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition shadow-sm cursor-pointer ${
              activeTab === 'nextcloud_sync'
                ? 'bg-emerald-600 border-emerald-500 text-white shadow-emerald-950/60 shadow-md'
                : isDarkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-emerald-700 border-slate-300'
            }`}
            title="Open Nextcloud /Music-Production Folder & Stem Matcher"
          >
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">/Music-Production (207332)</span>
            <span className="sm:hidden">/Music-Production</span>
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition shadow-sm cursor-pointer ${
              isDarkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline">Grounding</span>
          </button>

          <button
            onClick={() => setActiveTab('coproducer')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition shadow-sm cursor-pointer ${
              isDarkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">Co-Producer</span>
          </button>

          {/* Side Navigation Panel Toggle: Projects */}
          <button
            onClick={() => {
              if (isSideNavOpen && sideNavTab === 'projects') {
                setIsSideNavOpen(false);
              } else {
                setSideNavTab('projects');
                setIsSideNavOpen(true);
                setIsSideNavCollapsed(false);
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition shadow-sm cursor-pointer ${
              isSideNavOpen && sideNavTab === 'projects'
                ? 'bg-indigo-600 border-indigo-400 text-white shadow-indigo-950/60 shadow-md'
                : isDarkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
            title="Open Projects & Catalog Navigation Panel"
          >
            <Disc className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Projects ({tracks.length})</span>
            <span className="sm:hidden">Projects</span>
          </button>

          {/* Side Navigation Panel Toggle: Sessions */}
          <button
            onClick={() => {
              if (isSideNavOpen && sideNavTab === 'sessions') {
                setIsSideNavOpen(false);
              } else {
                setSideNavTab('sessions');
                setIsSideNavOpen(true);
                setIsSideNavCollapsed(false);
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition shadow-sm cursor-pointer ${
              isSideNavOpen && sideNavTab === 'sessions'
                ? 'bg-purple-600 border-purple-400 text-white shadow-purple-950/60 shadow-md'
                : isDarkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-white border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
            title="Open Project Composition Sessions Manager"
          >
            <FolderKanban className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Sessions ({sessions.length})</span>
            <span className="sm:hidden">Sessions</span>
          </button>

          {/* Side Navigation Panel Toggle: Assets */}
          <button
            onClick={() => {
              if (isSideNavOpen && sideNavTab === 'assets') {
                setIsSideNavOpen(false);
              } else {
                setSideNavTab('assets');
                setIsSideNavOpen(true);
                setIsSideNavCollapsed(false);
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition shadow-sm cursor-pointer ${
              isSideNavOpen && sideNavTab === 'assets'
                ? 'bg-cyan-600 border-cyan-400 text-white shadow-cyan-950/60 shadow-md'
                : isDarkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
            title="Manage Studio Stems, Checkpoints & Media Assets"
          >
            <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline">Assets</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition border border-emerald-400/30 cursor-pointer"
            title="Create New Project"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>+ New Project</span>
          </button>

          <button
            onClick={() => setIsSunoBridgeOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-950/50 transition border border-indigo-400/30 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span className="hidden sm:inline">⚡ Suno Bridge</span>
          </button>

          {/* SECTION GUIDE & SOP BUTTON */}
          <button
            onClick={() => handleOpenSectionGuide(activeTab as StudioSectionId)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition shadow-sm cursor-pointer ${
              isDarkMode
                ? 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border-amber-700/50 shadow-amber-950/40'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
            }`}
            title="Open Interactive Section Guide & Nashville SOP Rules"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Guide & SOP</span>
            <span className="sm:hidden">Guide</span>
          </button>

          {/* KEYBOARD SHORTCUTS CHEAT SHEET BUTTON */}
          <button
            onClick={toggleCheatSheet}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition shadow-sm cursor-pointer ${
              isCheatSheetOpen
                ? 'bg-purple-600 border-purple-500 text-white shadow-purple-950/60 shadow-md'
                : isDarkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-purple-300 border-slate-700 hover:text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-purple-700 border-slate-300'
            }`}
            title="Open Interactive Keyboard Shortcuts Cheat Sheet (? or Shift+/)"
            aria-label="Toggle Keyboard Shortcuts Cheat Sheet"
          >
            <Keyboard className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Shortcuts</span>
            <kbd className="hidden md:inline px-1.5 py-0.2 rounded text-[10px] font-mono bg-purple-950/70 border border-purple-800/60 text-purple-300 font-bold">
              ?
            </kbd>
          </button>

          {/* LIGHT / DARK MODE TOGGLE SWITCH */}
          <button
            onClick={handleToggleTheme}
            className={`p-2 rounded-xl border flex items-center gap-1.5 transition cursor-pointer ${
              isDarkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Light and Dark Mode"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            <span className="text-xs font-bold hidden xl:inline">
              {isDarkMode ? 'Light' : 'Dark'}
            </span>
          </button>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* COLLAPSIBLE / PINNABLE SIDE NAVIGATION PANEL */}
        {isSideNavOpen && (
          <>
            {/* Backdrop on mobile screens */}
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 lg:hidden"
              onClick={() => setIsSideNavOpen(false)}
            />
            <div className="fixed lg:static inset-y-0 left-0 z-40 lg:z-auto h-full flex-shrink-0 animate-in slide-in-from-left duration-200">
              <SideNavigationPanel
                tracks={tracks}
                selectedTrack={selectedTrack}
                onSelectTrack={(trk) => {
                  setSelectedTrack(trk);
                  setActiveTab('lyrics');
                  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                    setIsSideNavOpen(false);
                  }
                }}
                onAddNewTrack={() => setIsCreateModalOpen(true)}
                sessions={sessions}
                activeSessionId={activeSessionId}
                onSelectSession={handleSelectSession}
                onSaveCurrentSession={handleSaveCurrentSession}
                onUpdateSessionSnapshot={handleUpdateSessionSnapshot}
                onDuplicateSession={handleDuplicateSession}
                onDeleteSession={handleDeleteSession}
                onTogglePinSession={handleTogglePinSession}
                generatedImages={generatedImages}
                generatedVideos={generatedVideos}
                onUpdateImage={handleUpdateImage}
                onDeleteImage={handleDeleteImage}
                onAddImage={handleAddImage}
                onUpdateVideo={handleUpdateVideo}
                onDeleteVideo={handleDeleteVideo}
                onAddVideo={handleAddVideo}
                isDbSyncing={isDbSyncing}
                activeTab={activeTab}
                onNavigateToTab={setActiveTab}
                activePanelTab={sideNavTab}
                onSetActivePanelTab={setSideNavTab}
                isCollapsed={isSideNavCollapsed}
                onToggleCollapse={() => setIsSideNavCollapsed(!isSideNavCollapsed)}
                onClose={() => setIsSideNavOpen(false)}
                isDarkMode={isDarkMode}
              />
            </div>
          </>
        )}

        {/* CENTER / RIGHT: ACTIVE WORKBENCH */}
        <main className={`flex-1 flex flex-col min-w-0 transition-colors duration-200 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100/70 text-slate-900'} ${activeTab === 'kanban' ? 'h-[calc(100vh-65px)] overflow-hidden p-2.5' : 'p-4 sm:p-6 space-y-6 overflow-y-auto'}`}>
          
          {/* TRACK HEADER BANNER (Shown only on single-track workbench views) */}
          {activeTab !== 'kanban' && (
            <div
              className={`bento-card p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 transition-all duration-200 ${
                isDarkMode
                  ? 'bg-slate-900 border border-slate-800 text-white shadow-xl'
                  : 'bg-white border border-slate-200 text-slate-900 shadow-sm ring-1 ring-slate-900/5'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-indigo-900 text-indigo-300 font-mono text-xs font-bold">
                    {selectedTrack.id}
                  </span>

                  {/* Quick Track Switcher Dropdown */}
                  <select
                    value={selectedTrack.id}
                    onChange={(e) => {
                      const found = tracks.find(t => t.id === e.target.value);
                      if (found) {
                        setSelectedTrack(found);
                        setActiveTab('lyrics');
                      }
                    }}
                    className={`border hover:border-indigo-500 rounded-xl px-2.5 py-1 text-xs font-bold focus:outline-none focus:border-indigo-500 max-w-[220px] truncate cursor-pointer shadow-xs transition ${
                      isDarkMode
                        ? 'bg-slate-950 border-slate-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                    title="Quick Switch Track"
                  >
                    {tracks.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.id}: {t.title}
                      </option>
                    ))}
                  </select>

                  {/* Side Navigation Panel Toggle: Projects */}
                  <button
                    onClick={() => {
                      if (isSideNavOpen && sideNavTab === 'projects') {
                        setIsSideNavOpen(false);
                      } else {
                        setSideNavTab('projects');
                        setIsSideNavOpen(true);
                        setIsSideNavCollapsed(false);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                      isSideNavOpen && sideNavTab === 'projects'
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : isDarkMode
                        ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-indigo-300 hover:text-white'
                        : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-indigo-700'
                    }`}
                    title="Toggle Projects & Catalog Panel"
                  >
                    <Disc className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Projects ({tracks.length})</span>
                  </button>

                  {/* Side Navigation Panel Toggle: Sessions */}
                  <button
                    onClick={() => {
                      if (isSideNavOpen && sideNavTab === 'sessions') {
                        setIsSideNavOpen(false);
                      } else {
                        setSideNavTab('sessions');
                        setIsSideNavOpen(true);
                        setIsSideNavCollapsed(false);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                      isSideNavOpen && sideNavTab === 'sessions'
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-400 text-white shadow-md shadow-purple-950/60'
                        : isDarkMode
                        ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-purple-300 hover:text-white'
                        : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-purple-700'
                    }`}
                    title="Manage Composition Sessions"
                  >
                    <FolderKanban className="w-3.5 h-3.5 text-purple-400" />
                    <span>Sessions ({sessions.filter(s => s.trackId === selectedTrack.id).length})</span>
                  </button>

                  {/* Side Navigation Panel Toggle: Assets */}
                  <button
                    onClick={() => {
                      if (isSideNavOpen && sideNavTab === 'assets') {
                        setIsSideNavOpen(false);
                      } else {
                        setSideNavTab('assets');
                        setIsSideNavOpen(true);
                        setIsSideNavCollapsed(false);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                      isSideNavOpen && sideNavTab === 'assets'
                        ? 'bg-cyan-600 border-cyan-500 text-white'
                        : isDarkMode
                        ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-cyan-300 hover:text-white'
                        : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-cyan-700'
                    }`}
                    title="Manage Stems, Checkpoints & Visuals"
                  >
                    <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Assets</span>
                  </button>

                  {/* + New Song Button */}
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 border border-emerald-400/30 transition cursor-pointer shadow-sm"
                    title="Create New Project Track"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ New Song</span>
                  </button>

                  {/* Return to Kanban */}
                  <button
                    onClick={() => setActiveTab('kanban')}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition flex items-center gap-1 cursor-pointer ${
                      isDarkMode
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    }`}
                    title="Return to Master Kanban Dashboard"
                  >
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Kanban</span>
                  </button>
                </div>

                <div>
                  <h2 className={`text-xl sm:text-2xl font-black flex items-center gap-2 flex-wrap ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    <span>{selectedTrack.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-normal font-mono ${isDarkMode ? 'text-slate-400 bg-slate-800' : 'text-slate-600 bg-slate-100'}`}>
                      {selectedTrack.bpm} BPM • {selectedTrack.key}
                    </span>
                    <span className="text-xs text-indigo-500 font-semibold font-mono">
                      {selectedTrack.ep}
                    </span>
                  </h2>
                  <p className={`text-xs italic max-w-2xl mt-0.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>"{selectedTrack.thesis}"</p>
                </div>
              </div>

              {/* Status & Vocal Cast Selector */}
              <div className="flex items-center gap-3 flex-wrap">
                <div>
                  <label className={`block text-[10px] uppercase font-bold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Production Status</label>
                  <select
                    value={selectedTrack.status}
                    onChange={(e) => handleTrackUpdate('status', e.target.value as any)}
                    className={`border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-indigo-500 cursor-pointer ${
                      isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="Idea / Concept">Idea / Concept</option>
                    <option value="Lyrics Finalized">Lyrics Finalized</option>
                    <option value="In Progress">In Progress</option>
                    <option value="UVR5 Stem Prep">UVR5 Stem Prep</option>
                    <option value="Audio Master">Audio Master</option>
                    <option value="Sent for Distribution">Sent for Distribution</option>
                    <option value="Released">Released</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-[10px] uppercase font-bold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Vocal Formant Cast</label>
                  <input
                    type="text"
                    value={selectedTrack.vocalCast}
                    onChange={(e) => handleTrackUpdate('vocalCast', e.target.value)}
                    className={`border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 ${
                      isDarkMode ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                    placeholder="e.g. Silas Thorne (Aged Oak)"
                  />
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => handleTrackUpdate('selahPrayed', !selectedTrack.selahPrayed)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                      selectedTrack.selahPrayed
                        ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                        : isDarkMode
                        ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                        : 'bg-slate-100 border-slate-300 text-slate-600 hover:text-slate-900'
                    }`}
                    title="Mandatory 24h prayer & stationkeeping before master release"
                  >
                    <Heart className={`w-3.5 h-3.5 ${selectedTrack.selahPrayed ? 'fill-emerald-400 text-emerald-400' : ''}`} />
                    <span>{selectedTrack.selahPrayed ? 'Selah Done' : 'Selah Prayer'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ENHANCED WORKBENCH TWO-ROW NAVIGATION (COLLAPSIBLE DOWN TO ICONS WITH HOVER DESCRIPTIONS) */}
          <StudioTwoRowNavigation
            activeTab={activeTab}
            setActiveTab={(tab: string) => setActiveTab(tab as any)}
            isDarkMode={isDarkMode}
            onOpenSectionGuide={handleOpenSectionGuide}
            onOpenShortcutsCheatSheet={openCheatSheet}
          />

          {/* ACTIVE SECTION CONTEXT BANNER & "HOW TO USE THIS SECTION" BUTTON */}
          <div className={`${activeTab === 'kanban' ? 'px-3 py-1.5' : 'px-4 py-2.5'} rounded-xl border flex items-center justify-between flex-wrap gap-2 transition flex-shrink-0 ${
            isDarkMode
              ? 'bg-slate-900/90 border-slate-800 text-slate-200'
              : 'bg-white border-slate-200 text-slate-800 shadow-2xs'
          }`}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-300">
                Active Section: <strong className="text-white font-mono uppercase">{activeTab.replace('_', ' ')}</strong>
              </span>
              <span className="text-slate-500 hidden sm:inline">•</span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                {selectedTrack ? `${selectedTrack.id}: ${selectedTrack.title}` : 'Studio Master'}
              </span>
            </div>

            <button
              onClick={() => handleOpenSectionGuide(activeTab as StudioSectionId)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border shadow-xs ${
                isDarkMode
                  ? 'bg-gradient-to-r from-amber-500/20 to-indigo-500/20 hover:from-amber-500/30 hover:to-indigo-500/30 text-amber-300 border-amber-500/40'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
              }`}
              title={`Open detailed instructions & SOP rules for ${activeTab.replace('_', ' ')}`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>How To Use This Section & SOP</span>
            </button>
          </div>

          {/* TAB: KANBAN & PRODUCTION DASHBOARD */}
          {activeTab === 'kanban' && (
            <KanbanDashboardTab
              tracks={tracks}
              onSelectTrack={(t) => {
                setSelectedTrack(t);
                setActiveTab('lyrics');
              }}
              onUpdateTrackStatus={handleUpdateTrackStatus}
              onAddNewTrack={handleAddNewTrack}
              onNavigateToTab={(tab: string) => setActiveTab(tab as any)}
              epCollections={EP_COLLECTIONS}
              selectedEpFilter={selectedEpFilter}
              onSelectEpFilter={setSelectedEpFilter}
              onOpenCreateProject={() => setIsCreateModalOpen(true)}
              onOpenSectionGuide={handleOpenSectionGuide}
              isDarkMode={isDarkMode}
            />
          )}

          {/* TAB 1: LYRICS & SUNO 4-BLOCK ENGINE (WITH IMPORT, SAVED VAULT & NASHVILLE SOP) */}
          {activeTab === 'lyrics' && (
            <LyricsAndSunoTab
              track={selectedTrack}
              onUpdateTrack={handleTrackUpdate}
              onCopyText={copyToClipboard}
              onOpenSectionGuide={handleOpenSectionGuide}
              onNavigateToTab={(tab: string) => setActiveTab(tab as any)}
              isDarkMode={isDarkMode}
            />
          )}

          {/* TAB: SONG VERSION MATRIX (3-WAY STACKING) */}
          {activeTab === 'version-matrix' && (
            <SongVersionCompareTab
              activeTrack={selectedTrack}
              onUpdateTrackLyrics={(lyrics, versionTag) => {
                handleTrackUpdate('lyrics', lyrics);
                showToast(`Loaded ${versionTag || 'version'} into Lyric & Suno Studio!`, 'success');
                setActiveTab('lyrics');
              }}
              onNavigateToTab={(tab: string) => setActiveTab(tab as any)}
              isDarkMode={isDarkMode}
              showToast={showToast}
            />
          )}

          {/* TAB: BLOCKSUITE INFINITE WHITEBOARD & BRAINSTORMING */}
          {activeTab === 'brainstorming' && (
            <BlockSuiteBrainstormingTab
              tracks={tracks}
              selectedTrack={selectedTrack}
              onSelectTrack={setSelectedTrack}
              onUpdateTrackLyrics={(lyrics, versionTag) => {
                handleTrackUpdate('lyrics', lyrics);
                showToast(`Compiled Whiteboard into ${selectedTrack.title} Lyrics!`, 'success');
              }}
              onNavigateToTab={(tab: string) => setActiveTab(tab as any)}
              isDarkMode={isDarkMode}
            />
          )}

          {/* TAB 2: MINI-DAW MIXER & TRIMMER */}
          {activeTab === 'mixer' && (
            <MiniDawMixerTab
              track={selectedTrack}
              onOpenSectionGuide={handleOpenSectionGuide}
              isDarkMode={isDarkMode}
            />
          )}

          {/* TAB: YOUTUBE SEO LENS & WOODWORKING BAN */}
          {activeTab === 'youtube' && (
            <YouTubeSEOTab
              track={selectedTrack}
              onCopyText={copyToClipboard}
              onOpenSectionGuide={handleOpenSectionGuide}
              isDarkMode={isDarkMode}
            />
          )}

          {/* TAB: OMNIPOST SOCIAL DISPATCHER */}
          {activeTab === 'omnipost' && (
            <OmniPostTab
              track={selectedTrack}
              onCopyText={copyToClipboard}
              onOpenSectionGuide={handleOpenSectionGuide}
              isDarkMode={isDarkMode}
            />
          )}

          {/* TAB: LIVE MINISTRY CHARTS & STAGE STEMS */}
          {activeTab === 'ministry' && (
            <LiveMinistryChartsTab
              track={selectedTrack}
              onCopyText={copyToClipboard}
              onOpenSectionGuide={handleOpenSectionGuide}
              isDarkMode={isDarkMode}
            />
          )}

          {/* TAB: RELATIONAL DATABASE & INTERCHANGEABLE ASSET SIMILARITY MATRIX */}
          {activeTab === 'database' && (
            <RelationalDatabaseAndMatrixTab
              tracks={tracks}
              selectedTrack={selectedTrack}
              onSelectTrack={setSelectedTrack}
              onCopyText={copyToClipboard}
              isDbConnected={isDbConnected}
              isDbSyncing={isDbSyncing}
              onSyncDatabase={handleManualSyncDatabase}
              onOpenSectionGuide={handleOpenSectionGuide}
              isDarkMode={isDarkMode}
            />
          )}

          {/* TAB 3: SENIOR MASTERING & A/B BUS */}
          {activeTab === 'mastering' && (
            <div className="space-y-4">
              <MasteringLufsSuite
                track={selectedTrack}
                onOpenSectionGuide={handleOpenSectionGuide}
                isDarkMode={isDarkMode}
              />
            </div>
          )}

          {/* TAB 4: VISUALS & VEO 3 VIDEO STUDIO */}
          {activeTab === 'veo_visuals' && (
            <div className="space-y-4">
              <SectionQuickHelpBanner
                sectionId="veo_visuals"
                onOpenModalGuide={handleOpenSectionGuide}
                isDarkMode={isDarkMode}
              />
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
                <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Film className="w-5 h-5 text-rose-400" />
                      <span>Visual & Veo 3 Video Studio</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Create & edit album art with Gemini Flash, and generate or animate images into cinematic video using Google Veo 3.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleOpenSectionGuide('veo_visuals')}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 text-xs font-bold border border-amber-700/50 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                      title="Open Visuals & Veo 3 Operating Guide & SOP Rules"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>How To Use Veo Visuals</span>
                    </button>
                  </div>
                </div>

                {/* DEDICATED GOOGLE FLOW INTEGRATION & ASSET HUB */}
                <GoogleFlowIntegrationHub
                  catalogTracks={tracks}
                  onAddVideoAsset={handleAddVideo}
                  onOpenAssetEditor={(asset, mode) => {
                    setWorkspaceEditingAsset(asset);
                    setWorkspaceAssetModalMode(mode);
                    setWorkspaceAssetModalOpen(true);
                  }}
                  isDarkMode={isDarkMode}
                />

                {/* PROMPT VAULT & STORYBOARD ENGINE (MMH, VENOM, MASK, CYHL, ETC.) */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Master Visual & Video Prompt Vault ({nightCafePrompts.length} Prompts Loaded)
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {/* Type Filter */}
                      <div className="bg-slate-900 border border-slate-800 p-0.5 rounded-lg flex items-center gap-1 font-mono text-[11px]">
                        <button
                          type="button"
                          onClick={() => setPromptTypeFilter('all')}
                          className={`px-2 py-0.5 rounded ${promptTypeFilter === 'all' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                        >
                          All Types
                        </button>
                        <button
                          type="button"
                          onClick={() => setPromptTypeFilter('image')}
                          className={`px-2 py-0.5 rounded ${promptTypeFilter === 'image' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                        >
                          Images
                        </button>
                        <button
                          type="button"
                          onClick={() => setPromptTypeFilter('video')}
                          className={`px-2 py-0.5 rounded ${promptTypeFilter === 'video' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                        >
                          Videos
                        </button>
                      </div>

                      {/* Search */}
                      <input
                        type="text"
                        placeholder="Search prompts (e.g. hands, rain, clock)..."
                        value={promptSearchQuery}
                        onChange={(e) => setPromptSearchQuery(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono w-48"
                      />
                    </div>
                  </div>

                  {/* Song Filter Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-800/60">
                    <span className="text-[10px] text-slate-500 uppercase font-mono mr-1">Song:</span>
                    {['All', 'Meet Me Here', 'Venom Into Victory', 'Trading In The Mask', 'Check Your Heart Light', "The Work Ain't Done"].map((songName) => {
                      const count = songName === 'All' ? nightCafePrompts.length : nightCafePrompts.filter(p => p.song === songName).length;
                      return (
                        <button
                          key={songName}
                          type="button"
                          onClick={() => setPromptSongFilter(songName)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                            promptSongFilter === songName
                              ? 'bg-amber-600 text-white shadow-sm'
                              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                          }`}
                        >
                          <span>{songName === 'Meet Me Here' ? 'Meet Me Here (MMH)' : songName}</span>
                          <span className="px-1 rounded bg-black/40 text-[9px] font-mono">{count}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Filtered Prompts List */}
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {nightCafePrompts
                      .filter((p) => {
                        const matchesSong = promptSongFilter === 'All' || p.song === promptSongFilter;
                        const matchesType = promptTypeFilter === 'all' || (p.type || 'image') === promptTypeFilter;
                        const matchesQuery = !promptSearchQuery ||
                          p.title.toLowerCase().includes(promptSearchQuery.toLowerCase()) ||
                          p.prompt.toLowerCase().includes(promptSearchQuery.toLowerCase()) ||
                          (p.tags && p.tags.some(t => t.toLowerCase().includes(promptSearchQuery.toLowerCase())));
                        return matchesSong && matchesType && matchesQuery;
                      })
                      .map((p, idx) => (
                        <div key={idx} className="p-3 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl space-y-2 transition text-xs">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-white text-[12px]">{p.title}</span>
                              <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 font-mono text-[9px] border border-blue-800/40">
                                {p.song}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[9px]">
                                {p.aspectRatio || '9:16'}
                              </span>
                              {p.engine && (
                                <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 font-mono text-[9px] border border-purple-800/40">
                                  {p.engine}
                                </span>
                              )}
                              {p.type === 'video' && (
                                <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 font-mono text-[9px] border border-rose-800/40">
                                  Video Short
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setImagePrompt(p.prompt);
                                  if (p.aspectRatio) setImageAspectRatio(p.aspectRatio);
                                  copyToClipboard(p.prompt, "Prompt loaded to Image Studio");
                                }}
                                className="px-2 py-1 rounded bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/50 text-[10px] font-bold flex items-center gap-1 transition"
                                title="Load into Image Generator"
                              >
                                <Zap className="w-3 h-3 text-amber-300" />
                                <span>⚡ Image</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setVideoPrompt(p.initialPrompt || p.prompt);
                                  if (p.aspectRatio === '9:16' || p.aspectRatio === '16:9') {
                                    setVideoAspectRatio(p.aspectRatio);
                                  }
                                  copyToClipboard(p.initialPrompt || p.prompt, "Prompt loaded to Veo Studio");
                                }}
                                className="px-2 py-1 rounded bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-700/50 text-[10px] font-bold flex items-center gap-1 transition"
                                title="Load into Google Veo Video Generator"
                              >
                                <Film className="w-3 h-3 text-rose-400" />
                                <span>🎬 Video</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => copyToClipboard(p.prompt, `Prompt: ${p.title}`)}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 transition"
                                title="Copy prompt"
                              >
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </button>

                              {p.extensionPrompt && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedPromptIdx(expandedPromptIdx === idx ? null : idx)}
                                  className="px-1.5 py-1 rounded text-slate-400 hover:text-white text-[10px] font-mono"
                                  title="Toggle extension & audio cues"
                                >
                                  {expandedPromptIdx === idx ? '▲ Less' : '▼ Details'}
                                </button>
                              )}
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-300 font-mono leading-relaxed line-clamp-3">
                            {p.prompt}
                          </p>

                          {expandedPromptIdx === idx && (
                            <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-1.5 text-[11px] font-mono">
                              {p.initialPrompt && (
                                <div>
                                  <span className="text-amber-400 font-bold">Initial 10s: </span>
                                  <span className="text-slate-300">{p.initialPrompt}</span>
                                </div>
                              )}
                              {p.extensionPrompt && (
                                <div>
                                  <span className="text-emerald-400 font-bold">Extension: </span>
                                  <span className="text-slate-300">{p.extensionPrompt}</span>
                                </div>
                              )}
                              {p.audioCues && (
                                <div>
                                  <span className="text-indigo-400 font-bold">Audio Cues: </span>
                                  <span className="text-slate-300">{p.audioCues}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Sub-grid: 1. Image Creation & Editing, 2. Veo Video Generation */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* LEFT: IMAGE CREATOR & EDITOR */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-indigo-400" />
                        <span>Create & Edit Images (gemini-3.1-flash-image-preview)</span>
                      </h4>
                      <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800/40">
                        {imageMode === 'create' ? 'Text-to-Image' : 'Image-to-Image Edit'}
                      </span>
                    </div>

                    <textarea
                      rows={3}
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      placeholder="Describe the image or edit instructions..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                    />

                    {/* Aspect Ratio Selector */}
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                        Aspect Ratio Affordance
                      </label>
                      <div className="grid grid-cols-4 gap-1.5 text-xs font-mono">
                        {['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', '21:9'].map((ratio) => (
                          <button
                            key={ratio}
                            onClick={() => setImageAspectRatio(ratio)}
                            className={`py-1 rounded-lg border text-[11px] font-bold transition ${
                              imageAspectRatio === ratio
                                ? 'bg-indigo-600 border-indigo-400 text-white'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {ratio}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Upload / Edit Anchor */}
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <label className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold cursor-pointer transition flex items-center gap-1.5 text-xs">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Photo to Edit/Animate</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  setSelectedImageForEdit(reader.result as string);
                                  setImageMode('edit');
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        {selectedImageForEdit && (
                          <button
                            onClick={() => {
                              setSelectedImageForEdit(null);
                              setImageMode('create');
                            }}
                            className="text-rose-400 hover:text-rose-300 text-xs font-bold"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      <button
                        onClick={handleGenerateImage}
                        disabled={isGeneratingImage}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-950 disabled:opacity-50"
                      >
                        {isGeneratingImage ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                        <span>{isGeneratingImage ? 'Generating...' : imageMode === 'edit' ? 'Apply Edit' : 'Generate Image'}</span>
                      </button>
                    </div>

                    {selectedImageForEdit && (
                      <div className="p-2 bg-slate-900 rounded-xl border border-indigo-500/40 flex items-center gap-3">
                        <img src={selectedImageForEdit} alt="Anchor" className="w-12 h-12 object-cover rounded-lg" />
                        <span className="text-[11px] text-slate-300">Base image loaded for editing or Veo video animation.</span>
                      </div>
                    )}
                  </div>

                  {/* RIGHT: VEO 3 VIDEO GENERATOR */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Video className="w-4 h-4 text-rose-400" />
                        <span>Google Veo 3 Video Generator (veo-3.1-fast-generate-preview)</span>
                      </h4>
                      <span className="text-[10px] font-mono text-rose-300 bg-rose-950 px-2 py-0.5 rounded border border-rose-800/40">
                        {selectedImageForEdit ? 'Animate Photo' : 'Text-to-Video'}
                      </span>
                    </div>

                    <textarea
                      rows={3}
                      value={videoPrompt}
                      onChange={(e) => setVideoPrompt(e.target.value)}
                      placeholder="Prompt for cinematic Veo video..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
                    />

                    {/* Veo Aspect Ratio constraint (16:9 or 9:16) */}
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                        Veo 3 Aspect Ratio (16:9 Landscape or 9:16 Portrait)
                      </label>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <button
                          onClick={() => setVideoAspectRatio('16:9')}
                          className={`py-1.5 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                            videoAspectRatio === '16:9'
                              ? 'bg-rose-600 border-rose-400 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>16:9 Landscape (YouTube / Desktop)</span>
                        </button>
                        <button
                          onClick={() => setVideoAspectRatio('9:16')}
                          className={`py-1.5 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                            videoAspectRatio === '9:16'
                              ? 'bg-rose-600 border-rose-400 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>9:16 Portrait (TikTok / Shorts)</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-[11px] text-slate-400 font-mono">
                        {videoStatus}
                      </span>
                      <button
                        onClick={handleGenerateVeoVideo}
                        disabled={isGeneratingVideo}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-rose-950 disabled:opacity-50"
                      >
                        {isGeneratingVideo ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Film className="w-3.5 h-3.5 text-amber-200" />}
                        <span>{isGeneratingVideo ? 'Rendering Veo...' : selectedImageForEdit ? 'Animate Photo into Video' : 'Generate Veo Video'}</span>
                      </button>
                    </div>
                  </div>

                </div>

                {/* GALLERY OF GENERATED IMAGES & VIDEOS */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span>Visual Assets & Generated Renders ({generatedImages.length + generatedVideos.length})</span>
                      </h4>

                      {/* Filter Pills */}
                      <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
                        <button
                          type="button"
                          onClick={() => setMediaGalleryFilter('all')}
                          className={`px-2 py-0.5 rounded transition cursor-pointer ${
                            mediaGalleryFilter === 'all'
                              ? 'bg-indigo-600 text-white font-bold'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          All ({generatedImages.length + generatedVideos.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setMediaGalleryFilter('flow')}
                          className={`px-2 py-0.5 rounded transition cursor-pointer ${
                            mediaGalleryFilter === 'flow'
                              ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-bold'
                              : 'text-slate-400 hover:text-cyan-300'
                          }`}
                        >
                          Google Flow ({generatedVideos.filter(v => v.source === 'google_flow').length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setMediaGalleryFilter('videos')}
                          className={`px-2 py-0.5 rounded transition cursor-pointer ${
                            mediaGalleryFilter === 'videos'
                              ? 'bg-rose-600 text-white font-bold'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Veo 3 ({generatedVideos.filter(v => v.source !== 'google_flow').length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setMediaGalleryFilter('images')}
                          className={`px-2 py-0.5 rounded transition cursor-pointer ${
                            mediaGalleryFilter === 'images'
                              ? 'bg-purple-600 text-white font-bold'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Images ({generatedImages.length})
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenAddWorkspaceAsset('image')}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Add Image</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenAddWorkspaceAsset('video')}
                        className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Add Video</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Images */}
                    {(mediaGalleryFilter === 'all' || mediaGalleryFilter === 'images') &&
                      generatedImages.map((img) => (
                      <div key={img.id} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col group">
                        <div className="relative aspect-square bg-slate-900 overflow-hidden">
                          <img src={img.url} alt={img.prompt} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                          <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-sm px-2 py-0.5 rounded text-[9px] font-mono text-white font-bold">
                            {img.aspectRatio}
                          </div>
                          {img.linkedTrackIds && img.linkedTrackIds.length > 0 && (
                            <div className="absolute top-2 left-2 bg-emerald-600 text-white px-1.5 py-0.2 rounded text-[8px] font-bold">
                              +{img.linkedTrackIds.length} linked
                            </div>
                          )}
                        </div>
                        <div className="p-3 space-y-2 flex-1 flex flex-col justify-between text-xs">
                          <div>
                            <div className="font-bold text-white text-xs truncate">{img.name || img.trackTitle || 'Studio Art'}</div>
                            <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5">{img.prompt}</p>
                          </div>
                          <div className="space-y-1.5 pt-2 border-t border-slate-800">
                            <div className="flex items-center justify-between gap-1">
                              <button
                                onClick={() => {
                                  setSelectedImageForEdit(img.url);
                                  setImageMode('edit');
                                }}
                                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold"
                              >
                                Animate
                              </button>
                              <button
                                onClick={() => handleAnalyzeImage(img.url)}
                                className="text-[10px] text-purple-400 hover:text-purple-300 font-bold"
                              >
                                Analyze (Pro)
                              </button>
                            </div>
                            <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-800/60">
                              <button
                                onClick={() => handleOpenEditImageModal(img, 'gemini')}
                                className="px-2 py-0.5 rounded bg-purple-950/80 hover:bg-purple-900 text-amber-300 border border-purple-800/40 text-[9px] font-bold flex items-center gap-1"
                                title="Ask Gemini to change this image"
                              >
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>AI Edit</span>
                              </button>
                              <button
                                onClick={() => handleOpenEditImageModal(img, 'edit')}
                                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[9px] font-bold"
                                title="Edit all aspects / reassign / link"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteImage(img.id)}
                                className="p-1 rounded bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 text-[9px]"
                                title="Delete image"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Videos (Veo 3 & Google Flow) */}
                    {(mediaGalleryFilter === 'all'
                      ? generatedVideos
                      : mediaGalleryFilter === 'flow'
                      ? generatedVideos.filter(v => v.source === 'google_flow')
                      : mediaGalleryFilter === 'videos'
                      ? generatedVideos.filter(v => v.source !== 'google_flow')
                      : []
                    ).map((vid) => {
                      const isFlow = vid.source === 'google_flow' || vid.category?.toLowerCase().includes('flow');
                      return (
                        <div
                          key={vid.id}
                          className={`bg-slate-950 rounded-xl overflow-hidden flex flex-col group border transition ${
                            isFlow
                              ? 'border-cyan-500/40 hover:border-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.08)]'
                              : 'border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className={`relative ${vid.aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-video'} bg-slate-900 flex items-center justify-center`}>
                            {vid.videoUrl ? (
                              <video src={vid.videoUrl} controls className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-center p-4">
                                <RefreshCw className="w-6 h-6 text-rose-400 animate-spin mx-auto mb-2" />
                                <span className="text-[10px] text-slate-400 font-mono">Video Rendering...</span>
                              </div>
                            )}

                            {/* Top-Right Badge: Google Flow vs Veo */}
                            {isFlow ? (
                              <div className="absolute top-2 right-2 bg-gradient-to-r from-cyan-950 to-indigo-950/90 text-cyan-300 border border-cyan-700/60 backdrop-blur-sm px-2 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-1 shadow-md">
                                <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                                <span>Google Flow {vid.aspectRatio}</span>
                              </div>
                            ) : (
                              <div className="absolute top-2 right-2 bg-slate-900/80 px-2 py-0.5 rounded text-[9px] font-mono text-white font-bold">
                                Veo {vid.aspectRatio}
                              </div>
                            )}

                            {/* Top-Left: Linked tracks indicator & Resolution */}
                            <div className="absolute top-2 left-2 flex items-center gap-1">
                              {vid.resolution && (
                                <span className="bg-slate-900/85 backdrop-blur-sm text-slate-300 px-1.5 py-0.2 rounded text-[8px] font-mono border border-slate-700/60">
                                  {vid.resolution}
                                </span>
                              )}
                              {vid.linkedTrackIds && vid.linkedTrackIds.length > 1 && (
                                <span className="bg-emerald-600/90 text-white px-1.5 py-0.2 rounded text-[8px] font-bold shadow-xs">
                                  +{vid.linkedTrackIds.length} tracks
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="p-3 text-xs space-y-2 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between gap-1">
                                <div className="font-bold text-white text-xs truncate">
                                  {vid.name || (isFlow ? 'Google Flow Reel' : 'Veo Reel')}
                                </div>
                                {vid.flowAssetUrl && (
                                  <a
                                    href={vid.flowAssetUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[9px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 font-mono shrink-0 px-1.5 py-0.2 rounded bg-cyan-950/50 border border-cyan-800/40"
                                    title="Open video in Google Flow / Drive"
                                  >
                                    <ExternalLink className="w-2.5 h-2.5" />
                                    <span>Flow</span>
                                  </a>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5">{vid.prompt}</p>
                            </div>

                            <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-800">
                              <button
                                onClick={() => handleOpenEditVideoModal(vid, 'gemini')}
                                className="px-2 py-0.5 rounded bg-purple-950/80 hover:bg-purple-900 text-amber-300 border border-purple-800/40 text-[9px] font-bold flex items-center gap-1"
                                title="Ask Gemini to change this video prompt"
                              >
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>AI Edit</span>
                              </button>
                              <button
                                onClick={() => handleOpenEditVideoModal(vid, 'edit')}
                                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[9px] font-bold"
                                title="Edit all aspects / reassign / link across projects"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteVideo(vid.id)}
                                className="p-1 rounded bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 text-[9px]"
                                title="Delete video"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Gemini Image / Video Analysis Result Box */}
                  {imageAnalysisResult && (
                    <div className="p-4 bg-slate-950 border border-purple-500/40 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold text-purple-300 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-400" />
                          <span>Gemini Pro Image Understanding Audit</span>
                        </h5>
                        <button onClick={() => setImageAnalysisResult(null)} className="text-xs text-slate-400 hover:text-white">✕</button>
                      </div>
                      <p className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                        {imageAnalysisResult}
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 5: NIGHTCAFE QUEUE RUNNER */}
          {activeTab === 'nightcafe' && (
            <div className="space-y-4">
              <SectionQuickHelpBanner
                sectionId="nightcafe"
                onOpenModalGuide={handleOpenSectionGuide}
                isDarkMode={isDarkMode}
              />
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>NightCafe Studio Bulk Queue Runner</span>
                      <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 font-mono text-[10px] font-bold border border-blue-700/50">
                        {nightCafePrompts.length} Scenes Loaded
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">Batch prompt dispatching for Google Veo & Flux Dev models on NightCafe Studio.</p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleOpenSectionGuide('nightcafe')}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 text-xs font-bold border border-amber-700/50 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                      title="Open NightCafe Bulk Queue Operating Guide & SOP Rules"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>How To Use NightCafe</span>
                    </button>

                    <button
                      onClick={() => {
                        const payload = JSON.stringify(nightCafePrompts, null, 2);
                        copyToClipboard(payload, "NightCafe Queue JSON");
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 transition"
                    >
                      <Zap className="w-4 h-4 text-amber-300" />
                      <span>⚡ Copy JSON for NightCafe</span>
                    </button>
                  </div>
                </div>

                {/* Prompt Table */}
                <div className="border border-slate-800 rounded-xl bg-slate-950 overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-900 border-b border-slate-800 sticky top-0 text-slate-400">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        <th className="py-2.5 px-3 w-36">Song</th>
                        <th className="py-2.5 px-3 w-36">Scene Title</th>
                        <th className="py-2.5 px-3">Cinematic Prompt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {nightCafePrompts.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/60 transition">
                          <td className="py-2 px-3 text-center text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                          <td className="py-2 px-3 font-semibold text-blue-300">{item.song}</td>
                          <td className="py-2 px-3 font-medium text-slate-200">{item.title}</td>
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-300">{item.prompt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: VIDEOEXPRESS.AI TALKING AVATAR AGENT */}
          {activeTab === 'video_express' && (
            <VideoExpressAgentTab
              tracks={tracks}
              selectedTrack={selectedTrack}
              isDarkMode={isDarkMode}
              onSelectTrack={(track) => setSelectedTrack(track)}
              showToast={showToast}
              copyToClipboard={copyToClipboard}
              onOpenSectionGuide={handleOpenSectionGuide}
            />
          )}

          {/* TAB 6: TELEMETRY & SURVIVAL LOOP */}
          {activeTab === 'telemetry' && (
            <div className="space-y-4">
              <SectionQuickHelpBanner
                sectionId="telemetry"
                onOpenModalGuide={handleOpenSectionGuide}
                isDarkMode={isDarkMode}
              />
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>T+60m Inbound Telemetry & Brutal Metric Loop</span>
                      <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-mono text-[10px] font-bold border border-purple-700/50">
                        Active Audit
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">Automated retention scoring. Videos with ≥70% completion trigger 10s video extensions instantly.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenSectionGuide('telemetry')}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 text-xs font-bold border border-amber-700/50 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    title="Open Telemetry Operating Guide & SOP Rules"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>How To Use Telemetry</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 uppercase">Track: Meet Me Here (TRK-13)</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-mono font-bold">VIRAL WINNER</span>
                    </div>
                    <div className="text-xs text-slate-300 space-y-1 font-mono">
                      <div>3s Retention: <strong className="text-white">74.2%</strong> (&gt;65% Pass)</div>
                      <div>Completion Rate: <strong className="text-white">71.5%</strong> (&gt;70% Winner)</div>
                      <div>1h Views: <strong className="text-white">2,680</strong></div>
                    </div>
                    <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 font-mono">
                      <strong>Action Triggered:</strong> Generated 3 seamless 10-second video extensions (Scenes 4, 5, 6) via Gemini Flash.
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-400 uppercase">Track: Calvary Grit (TRK-09)</span>
                      <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 text-[10px] font-mono font-bold">KILL CONCEPT</span>
                    </div>
                    <div className="text-xs text-slate-300 space-y-1 font-mono">
                      <div>3s Retention: <strong className="text-white">58.2%</strong> (&lt;65% Kill)</div>
                      <div>Completion Rate: <strong className="text-white">44.1%</strong></div>
                      <div>1h Views: <strong className="text-white">640</strong></div>
                    </div>
                    <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-xs text-rose-200 font-mono">
                      <strong>Action Triggered:</strong> Campaign archived. Log weak visual hook in changelog.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: STUDIO CO-PRODUCER AI (GEMINI CHATBOT) */}
          {activeTab === 'coproducer' && (
            <div className="space-y-4">
              <SectionQuickHelpBanner
                sectionId="coproducer"
                onOpenModalGuide={handleOpenSectionGuide}
                isDarkMode={isDarkMode}
              />
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col h-[640px]">
                <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-teal-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white">Studio Co-Producer AI (Multi-Turn Chatbot)</h3>
                      <p className="text-[11px] text-slate-400">Contextually aware of {selectedTrack.title} ({selectedTrack.genre})</p>
                    </div>
                  </div>

                  {/* Role, Model Selectors and Guide button */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleOpenSectionGuide('coproducer')}
                      className="px-3 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 text-xs font-bold border border-amber-700/50 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                      title="Open Studio Co-Producer AI Operating Guide & SOP Rules"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>How To Use Co-Producer</span>
                    </button>

                    <select
                      value={chatRole}
                      onChange={(e) => setChatRole(e.target.value as any)}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-bold focus:outline-none"
                    >
                      <option value="lyric_assistant">Lyric & Theological Assistant</option>
                      <option value="mastering_engineer">Senior Mastering Engineer</option>
                      <option value="omnipost_strategist">Omnipost Social Strategist</option>
                    </select>

                    <select
                      value={chatModel}
                      onChange={(e) => setChatModel(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-indigo-300 font-mono focus:outline-none"
                    >
                      <option value="gemini-3.5-flash">gemini-3.5-flash</option>
                      <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview</option>
                      <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite</option>
                    </select>
                  </div>
                </div>

                {/* Message Thread */}
                <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-slate-950 rounded-xl border border-slate-800/80 custom-scrollbar">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-2 mb-1 text-[10px] text-slate-500 font-mono">
                        <span>{msg.role === 'user' ? 'You' : 'brickOS AI'}</span>
                        <span>•</span>
                        <span>{msg.timestamp}</span>
                        {msg.model && <span>({msg.model})</span>}
                      </div>
                      <div
                        className={`p-3.5 rounded-2xl max-w-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                          msg.role === 'user'
                            ? 'bg-indigo-600 text-white rounded-br-none'
                            : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-md font-mono'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono p-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-400" />
                      <span>Thinking with {chatModel}...</span>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={`Ask ${chatRole.replace('_', ' ')} anything about ${selectedTrack.title}...`}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isChatLoading || !chatInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: SEARCH GROUNDING */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              <SectionQuickHelpBanner
                sectionId="search"
                onOpenModalGuide={handleOpenSectionGuide}
                isDarkMode={isDarkMode}
              />
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Search className="w-4 h-4 text-cyan-400" />
                      <span>Google Search Grounding (gemini-3.5-flash with googleSearch tool)</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Retrieve up-to-date Billboard Christian/Gospel charts, BPM trends, Nashville mixing standards, and theological references.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenSectionGuide('search')}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 text-xs font-bold border border-amber-700/50 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    title="Open Google Search Grounding Operating Guide & SOP Rules"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>How To Use Search</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchGrounding()}
                    placeholder="e.g. Current top 10 Christian Hip Hop tracks tempo and 808 style 2026..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <button
                    onClick={handleSearchGrounding}
                    disabled={isSearching}
                    className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-cyan-950 disabled:opacity-50"
                  >
                    {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    <span>{isSearching ? 'Searching...' : 'Search Google Grounding'}</span>
                  </button>
                </div>

                {searchResult && (
                  <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                    <div className="text-xs text-slate-200 font-mono leading-relaxed whitespace-pre-wrap">
                      {searchResult.answer}
                    </div>

                    {searchResult.sources && searchResult.sources.length > 0 && (
                      <div className="pt-3 border-t border-slate-800 space-y-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                          Verified Web Sources:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {searchResult.sources.map((src, idx) => (
                            <a
                              key={idx}
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-cyan-400 hover:underline bg-slate-900 px-2.5 py-1 rounded border border-slate-800 flex items-center gap-1"
                            >
                              <span>{src.title || src.url}</span>
                              <ExternalLink className="w-2.5 h-2.5 inline" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: NEXTCLOUD BENTO LIVE WEBDAV & FOLDER 207332 ASSET MATCHER */}
          {activeTab === 'nextcloud_sync' && (
            <NextcloudBentoSyncTab
              tracks={tracks}
              selectedTrack={selectedTrack}
              onSelectTrack={(t) => {
                setSelectedTrack(t);
              }}
              onApplyAssetToTrack={handleApplyAssetToTrack}
              isDarkMode={isDarkMode}
              onNavigateToTab={(tab: string) => setActiveTab(tab as any)}
              onOpenSectionGuide={handleOpenSectionGuide}
            />
          )}

          {/* TAB: PROMPT ENGINEERING LIBRARY (IMAGE, VIDEO, AUDIO & MMH STORYBOARD) */}
          {activeTab === 'prompt_library' && (
            <PromptEngineeringLibraryTab
              tracks={tracks}
              selectedTrack={selectedTrack}
              onSelectTrack={(t) => {
                setSelectedTrack(t);
              }}
              onSendToImageStudio={(prompt, aspect) => {
                setImagePrompt(prompt);
                if (aspect) setImageAspectRatio(aspect);
                setActiveTab('veo_visuals');
                showToast("Loaded prompt into Image Studio", "success");
              }}
              onSendToVeoStudio={(prompt, aspect) => {
                setVideoPrompt(prompt);
                if (aspect === '9:16' || aspect === '16:9') setVideoAspectRatio(aspect);
                setActiveTab('veo_visuals');
                showToast("Loaded prompt into Google Veo Video Studio", "success");
              }}
              onSendToSuno={(trackId, prompt, negPrompt, sliders) => {
                const targetTrack = tracks.find(t => t.id === trackId) || selectedTrack;
                setSelectedTrack(targetTrack);
                handleTrackUpdate('batch_update', {
                  sunoPrompt: prompt,
                  ...(negPrompt ? { negativePrompt: negPrompt } : {}),
                  ...(sliders ? { engineSliders: sliders } : {})
                });
                setActiveTab('lyrics');
                showToast(`Loaded prompt into Suno 4-Block for ${targetTrack.title}`, "success");
              }}
              showToast={showToast}
              isDarkMode={isDarkMode}
              onOpenSectionGuide={handleOpenSectionGuide}
            />
          )}

        </main>
      </div>

      {/* NEXTCLOUD WEBDAV STORAGE MODAL */}
      {isStorageModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-950 border border-indigo-700/50">
                  <HardDrive className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <span>Nextcloud WebDAV Production Hub</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-mono text-[10px] border border-emerald-700/40">
                      Live Production
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Direct self-hosted storage layer for 24-bit/48kHz master WAV stems, visual assets, and project data.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsStorageModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 rounded-lg bg-slate-800"
              >
                ✕ Close
              </button>
            </div>

            {/* DIRECT LAUNCHER FOR BENTO ASSET MATCHER */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/80 via-purple-950/60 to-emerald-950/80 border border-indigo-700/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Nextcloud Asset Matcher & Live Sync Workspace</span>
                </div>
                <div className="text-[11px] text-slate-300">
                  Full Bento-style hub to match stems, lyrics, and art from Folder 207332 directly to catalog tracks.
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsStorageModalOpen(false);
                  setActiveTab('nextcloud_sync');
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-950/40 flex-shrink-0 cursor-pointer"
              >
                <span>Launch Matcher (207332) →</span>
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              {/* WebDAV Endpoint Info */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 font-mono uppercase">
                    /Music-Production WebDAV URL ({DEFAULT_WEBDAV_USER}):
                  </span>
                  <button
                    onClick={() => copyToClipboard(PRODUCTION_NEXTCLOUD_WEBDAV, '/Music-Production WebDAV URL')}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy WebDAV URL</span>
                  </button>
                </div>
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-indigo-300 text-[11px] select-all truncate">
                  {PRODUCTION_NEXTCLOUD_WEBDAV}
                </div>
              </div>

              {/* Active Track Folder */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 font-mono uppercase">
                    {selectedTrack.id} WebDAV Folder:
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `${PRODUCTION_NEXTCLOUD_WEBDAV}/${selectedTrack.id}/`,
                        `${selectedTrack.id} WebDAV Folder`
                      )
                    }
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Track Folder</span>
                  </button>
                </div>
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-emerald-300 text-[11px] select-all truncate">
                  {PRODUCTION_NEXTCLOUD_WEBDAV}/{selectedTrack.id}/
                </div>
              </div>

              {/* Live CLI Snippets */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <strong className="text-white text-xs block">
                    DAW & Network Integration Snippets (Cakewalk / Resolve / Windows / macOS):
                  </strong>
                </div>

                {/* cURL Stem Upload */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-pink-400 font-bold uppercase">
                      1. cURL Direct Stem Upload ({selectedTrack.id}):
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          generateCurlStemUploadCommand(
                            selectedTrack.id,
                            `${selectedTrack.id}_BS-Roformer_Vocal_24bit_48k.wav`
                          ),
                          'cURL Upload Command'
                        )
                      }
                      className="text-[10px] font-mono text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                  <pre className="text-[10px] font-mono text-pink-300 select-all overflow-x-auto whitespace-pre">
                    {generateCurlStemUploadCommand(
                      selectedTrack.id,
                      `${selectedTrack.id}_BS-Roformer_Vocal_24bit_48k.wav`
                    )}
                  </pre>
                </div>

                {/* rclone Sync */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase">
                      2. rclone Background Sync Block:
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `${generateRcloneConfigBlock()}\n\n${generateRcloneSyncCommand(selectedTrack.id)}`,
                          'rclone Sync Block'
                        )
                      }
                      className="text-[10px] font-mono text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                  <pre className="text-[10px] font-mono text-indigo-300 select-all overflow-x-auto max-h-24 leading-relaxed">
                    {generateRcloneSyncCommand(selectedTrack.id)}
                  </pre>
                </div>

                {/* Windows Net Use */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">
                      3. Mount WebDAV as Windows Z: Drive:
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(generateWindowsDriveMountCommand(), 'Windows net use Command')
                      }
                      className="text-[10px] font-mono text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                  <pre className="text-[10px] font-mono text-emerald-300 select-all overflow-x-auto whitespace-pre">
                    {generateWindowsDriveMountCommand()}
                  </pre>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  const json = generateCatalogJsonManifest(tracks);
                  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `brickos_catalog_backup_${new Date().toISOString().split('T')[0]}.json`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                  copyToClipboard('Downloaded brickos_catalog_backup.json', 'Catalog JSON Backup');
                }}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export Catalog JSON Backup (.json)</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => {
                    setIsStorageModalOpen(false);
                    setActiveTab('database');
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-950 cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-amber-300" />
                  <span>Open Catalog & Matrix Tab</span>
                </button>
                <button
                  onClick={() => setIsStorageModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUNO & NIGHTCAFE BRIDGE MODAL */}
      {isSunoBridgeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <span>⚡ Suno & NightCafe 1-Click Bridge</span>
              </h3>
              <button
                onClick={() => setIsSunoBridgeOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p>Instantly inject Title, Lyrics, Style, and Excluded Styles from brickOS into Suno.com and NightCafe without manual copy-pasting.</p>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <strong className="text-white block">Tampermonkey UserScript Integration:</strong>
                <p className="text-[11px] text-slate-400">
                  The companion UserScript running on Suno.com and NightCafe Studio detects packets on your clipboard and populates form fields automatically using native React prototype setters.
                </p>
                <button
                  onClick={() => {
                    const scriptCode = `// ==UserScript==\n// @name brickOS 1-Click Bridge\n// @match https://suno.com/*\n// @match https://creator.nightcafe.studio/*\n// ==/UserScript==\nconsole.log("[brickOS Bridge Active]");`;
                    copyToClipboard(scriptCode, "UserScript Code");
                  }}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <Code className="w-4 h-4" />
                  <span>Copy Full UserScript to Clipboard</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsSunoBridgeOpen(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE PROJECT MODAL */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateProject={(newTrack, openLyricEngine, prompts) => handleAddNewTrack(newTrack, openLyricEngine, prompts)}
        existingTracksCount={tracks.length}
        existingTracks={tracks}
        defaultEp={selectedTrack.ep}
      />

      {/* UNIVERSAL SECTION INSTRUCTION & SOP MODAL */}
      <SectionInstructionModal
        isOpen={isSectionGuideOpen}
        onClose={() => setIsSectionGuideOpen(false)}
        initialSection={sectionGuideTarget}
        onNavigateToSection={(targetSection) => {
          setActiveTab(targetSection as any);
        }}
        isDarkMode={isDarkMode}
      />

      {/* GLOBAL KEYBOARD SHORTCUTS INTERACTIVE OVERLAY CHEAT SHEET */}
      <KeyboardShortcutsOverlay
        isOpen={isCheatSheetOpen}
        onClose={closeCheatSheet}
        isDarkMode={isDarkMode}
        onNavigateToTab={(tab) => {
          setActiveTab(tab as any);
          showToast(`Switched to ${tab.replace('_', ' ').toUpperCase()}`, 'info');
        }}
        onTogglePlayPauseAudio={handleTogglePlayPauseAudio}
        isPlayingAudio={isPlaying}
        onToggleMuteAudio={handleToggleMuteAudio}
        isMutedAudio={isMutedAudio}
        onResetAudioEngine={handleResetAudioEngine}
        onPreviousTrack={handlePreviousTrack}
        onNextTrack={handleNextTrack}
        onOpenCreateProject={() => setIsCreateModalOpen(true)}
        onOpenSunoBridge={() => setIsSunoBridgeOpen(true)}
        onOpenSectionGuide={() => handleOpenSectionGuide(activeTab as StudioSectionId)}
        onToggleTheme={handleToggleTheme}
        onToggleSideNav={() => setIsSideNavOpen(prev => !prev)}
        currentTrackTitle={selectedTrack ? `${selectedTrack.id}: ${selectedTrack.title}` : undefined}
        activeTab={activeTab}
      />

      {/* PERSISTENT FLOATING AUDIO TRANSPORT */}
      <GlobalAudioTransport
        isPlaying={isPlaying}
        onTogglePlayPause={handleTogglePlayPauseAudio}
        isMuted={isMutedAudio}
        onToggleMute={handleToggleMuteAudio}
        masterVolume={masterVolume}
        onVolumeChange={(vol) => {
          setMasterVolume(vol);
          audioMiniDaw.setMasterVolume(vol);
        }}
        selectedTrack={selectedTrack}
        onPreviousTrack={handlePreviousTrack}
        onNextTrack={handleNextTrack}
        onOpenMiniDaw={() => setActiveTab('mixer')}
        onResetAudio={handleResetAudioEngine}
        isDarkMode={isDarkMode}
      />

      {/* WORKSPACE UNIVERSAL ASSET EDITOR MODAL: ADD, EDIT, ASK GEMINI, REASSIGN, LINK, DELETE */}
      <UniversalAssetEditorModal
        isOpen={workspaceAssetModalOpen}
        onClose={() => setWorkspaceAssetModalOpen(false)}
        asset={workspaceEditingAsset}
        mode={workspaceAssetModalMode}
        catalogTracks={tracks}
        onSaveAsset={(updated) => {
          handleSaveWorkspaceAsset(updated);
        }}
        onDeleteAsset={(id) => {
          if (workspaceEditingAsset?.type === 'video') {
            handleDeleteVideo(id);
          } else {
            handleDeleteImage(id);
          }
          setWorkspaceAssetModalOpen(false);
        }}
        onDuplicateAsset={(dup) => {
          handleSaveWorkspaceAsset(dup);
        }}
        isDarkMode={isDarkMode}
      />

    </div>
  );
}
