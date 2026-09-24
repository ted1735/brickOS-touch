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
  Moon
} from 'lucide-react';
import { Track, TrackStatus, TrackVersion, MixerTrack, GeneratedImage, GeneratedVideo, ChatMessage, CompositionSession, NextcloudFolderAsset } from './types';
import { CANONICAL_TRACKS, NIGHTCAFE_DEFAULT_PROMPTS, VOCAL_ROSTER, EP_COLLECTIONS } from './data/canonicalCatalog';
import { INITIAL_COMPOSITION_SESSIONS } from './data/canonicalSessions';
import { audioMiniDaw } from './utils/audioEngine';
import { KanbanDashboardTab } from './components/KanbanDashboardTab';
import { LyricsAndSunoTab } from './components/LyricsAndSunoTab';
import { MiniDawMixerTab } from './components/MiniDawMixerTab';
import { YouTubeSEOTab } from './components/YouTubeSEOTab';
import { OmniPostTab } from './components/OmniPostTab';
import { LiveMinistryChartsTab } from './components/LiveMinistryChartsTab';
import { RelationalDatabaseAndMatrixTab } from './components/RelationalDatabaseAndMatrixTab';
import { CreateProjectModal } from './components/CreateProjectModal';
import { CatalogSidebar } from './components/CatalogSidebar';
import { ProjectSessionsSidebar } from './components/ProjectSessionsSidebar';
import { SideNavigationPanel } from './components/SideNavigationPanel';
import { NextcloudBentoSyncTab } from './components/NextcloudBentoSyncTab';
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
  generatePostgreSqlRelationalMigration
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
    'kanban' | 'lyrics' | 'mixer' | 'mastering' | 'youtube' | 'omnipost' | 'ministry' | 'veo_visuals' | 'nightcafe' | 'telemetry' | 'coproducer' | 'search' | 'database' | 'nextcloud_sync'
  >('kanban');
  const [copiedNotification, setCopiedNotification] = useState('');

  // Light / Dark Theme State with persistence and HTML class sync
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
  const handleAddNewTrack = async (newTrack: Track, openLyricEngine = true) => {
    setTracks(prev => [newTrack, ...prev]);
    setSelectedTrack(newTrack);
    if (openLyricEngine) {
      setActiveTab('lyrics');
    }
    try {
      setIsDbSyncing(true);
      await saveTrackToFirestore(newTrack);
      setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setCopiedNotification(`Created & saved "${newTrack.title}" (${newTrack.id}) to Cloud Firestore!`);
      setTimeout(() => setCopiedNotification(''), 4000);
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
      setCopiedNotification(`Successfully synced all ${tracks.length} tracks to Cloud Firestore!`);
      setTimeout(() => setCopiedNotification(''), 4000);
    } catch (err: any) {
      alert(`Cloud sync error: ${err.message || 'Check connection'}`);
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

  // NightCafe prompts
  const [nightCafePrompts, setNightCafePrompts] = useState(NIGHTCAFE_DEFAULT_PROMPTS);

  // Visual & Veo State
  const [imagePrompt, setImagePrompt] = useState('Cinematic album cover for sovereign faith album, weathered cedar wood, cracked gold Kintsugi seams, warm dramatic chiaroscuro lighting, photorealistic 8k');
  const [imageAspectRatio, setImageAspectRatio] = useState('1:1');
  const [imageMode, setImageMode] = useState<'create' | 'edit'>('create');
  const [imageModel, setImageModel] = useState('gemini-3.1-flash-image-preview');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([
    {
      id: 'img-1',
      url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
      prompt: 'Weathered cedar woodshop with golden rays of morning light and sawdust motes, Nashville studio aesthetic',
      aspectRatio: '1:1',
      timestamp: '2026-09-06',
      mode: 'create',
      trackTitle: 'The Master\'s Hand'
    },
    {
      id: 'img-2',
      url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
      prompt: 'Dark blue-collar truck cab at 5 AM in freezing rain, glowing amber dashboard dials',
      aspectRatio: '9:16',
      timestamp: '2026-09-06',
      mode: 'create',
      trackTitle: 'Meet Me Here'
    }
  ]);
  const [selectedImageForEdit, setSelectedImageForEdit] = useState<string | null>(null);
  const [imageAnalysisPrompt, setImageAnalysisPrompt] = useState('Analyze this visual for theological depth, album cover hierarchy, and viral 3-second hook retention.');
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [imageAnalysisResult, setImageAnalysisResult] = useState<string | null>(null);

  // Veo Video State
  const [videoPrompt, setVideoPrompt] = useState('Slow cinematic tracking shot gliding through an overgrown mossy stone archway opening into a sun-drenched cedar glade, morning mist rising, 8k photorealistic');
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoOperationName, setVideoOperationName] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<string>('idle');
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
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
      content: "Welcome to brickOS Sovereign Studio. I am your Lead Theological & Lyrical Assistant. Let's ensure every track passes the OBI Funnel, strips all tired 'Christianese' clichés, and drives home the Throne Room Pivot by the bridge.",
      timestamp: '01:00 AM',
      model: 'gemini-3.5-flash'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Canvas visualizer ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Helper for clipboard
  const copyToClipboard = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedNotification(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedNotification(''), 3000);
  };

  // Commit Song Changes & Updates and persist to Firestore
  const handleTrackUpdate = async (field: keyof Track | 'version_commit' | 'batch_update', value: any) => {
    let modifiedTrackToPersist: Track | null = null;
    const updated = tracks.map(t => {
      if (t.id === selectedTrack.id) {
        if (field === 'version_commit') {
          const nextVerNum = (t.versions.length + 1).toFixed(1);
          const versionLabel = value?.version || `v${nextVerNum}`;
          const versionLyrics = value?.lyrics !== undefined ? value.lyrics : t.lyrics;
          const newVersion: TrackVersion = {
            version: versionLabel,
            timestamp: value?.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19),
            reason: value?.reason || 'Manual snapshot checkpoint',
            lyrics: versionLyrics
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
        copyToClipboard('Image generated successfully', 'Generated Image');
      } else if (data.error) {
        alert(`Image Generation Failed: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Image Generation Error: ${e.message}`);
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
        alert(`Search Grounding Error: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Search error: ${e.message}`);
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
      systemInstruction = `You are the Lead Theological & Lyrical Assistant for brickOS Sovereign Records.
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
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-bold border border-emerald-500/40 animate-bounce">
          <CheckCircle className="w-4 h-4 text-white" />
          <span>{copiedNotification}</span>
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
                v5.5 SOVEREIGN
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
            title="Create New Sovereign Track"
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

          {/* WORKBENCH TABS - DOUBLE STACKED TO SAVE HORIZONTAL SPACE */}
          <div className={`border-b pb-2 space-y-1.5 flex flex-col ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
            {/* TIER 1: CORE MUSIC & AUDIO PRODUCTION PIPELINE */}
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
              <span className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded border hidden sm:inline-block flex-shrink-0 ${
                isDarkMode ? 'text-indigo-400 bg-indigo-950/80 border-indigo-800/40' : 'text-indigo-700 bg-indigo-50 border-indigo-200'
              }`}>
                Tier 1: Audio Engine
              </span>
              <button
                onClick={() => setActiveTab('kanban')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer border ${
                  activeTab === 'kanban'
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                    : isDarkMode
                    ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 shadow-2xs'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Kanban & Dashboard</span>
              </button>

              <button
                onClick={() => setActiveTab('lyrics')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer border ${
                  activeTab === 'lyrics'
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                    : isDarkMode
                    ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 shadow-2xs'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>Lyrics & Suno 4-Block</span>
              </button>

              <button
                onClick={() => setActiveTab('database')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer border ${
                  activeTab === 'database'
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                    : isDarkMode
                    ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 shadow-2xs'
                }`}
              >
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>Relational SQL & Matrix</span>
              </button>

              <button
                onClick={() => setActiveTab('nextcloud_sync')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer border ${
                  activeTab === 'nextcloud_sync'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm border-emerald-400'
                    : isDarkMode
                    ? 'bg-slate-900 border-slate-800 text-emerald-300 hover:text-white hover:bg-slate-800'
                    : 'bg-white border-slate-200 text-emerald-700 hover:bg-emerald-50 shadow-2xs'
                }`}
              >
                <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                <span>Nextcloud Bento Matcher (207332)</span>
              </button>

              <button
                onClick={() => setActiveTab('mixer')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer border ${
                  activeTab === 'mixer'
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                    : isDarkMode
                    ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 shadow-2xs'
                }`}
              >
                <Scissors className="w-3.5 h-3.5 text-amber-400" />
                <span>4-Track Mini-DAW</span>
              </button>

              <button
                onClick={() => setActiveTab('mastering')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer border ${
                  activeTab === 'mastering'
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                    : isDarkMode
                    ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 shadow-2xs'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mastering Engineer & A/B</span>
              </button>

              <button
                onClick={() => setActiveTab('ministry')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer border ${
                  activeTab === 'ministry'
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                    : isDarkMode
                    ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 shadow-2xs'
                }`}
              >
                <Music className="w-3.5 h-3.5 text-cyan-400" />
                <span>Live Ministry Charts</span>
              </button>
            </div>

            {/* TIER 2: MEDIA, SEO, TELEMETRY & AI COPILOTS */}
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
              <span className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded border hidden sm:inline-block flex-shrink-0 ${
                isDarkMode ? 'text-purple-400 bg-purple-950/80 border-purple-800/40' : 'text-purple-700 bg-purple-50 border-purple-200'
              }`}>
                Tier 2: Visuals & Copilots
              </span>
              <button
                onClick={() => setActiveTab('veo_visuals')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer border ${
                  activeTab === 'veo_visuals'
                    ? 'bg-purple-600 border-purple-500 text-white shadow-sm'
                    : isDarkMode
                    ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 shadow-2xs'
                }`}
              >
                <Clapperboard className="w-3.5 h-3.5 text-amber-400" />
                <span>Visuals & Veo 3 Video</span>
              </button>

              <button
                onClick={() => setActiveTab('youtube')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer border ${
                  activeTab === 'youtube'
                    ? 'bg-purple-600 border-purple-500 text-white shadow-sm'
                    : isDarkMode
                    ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 shadow-2xs'
                }`}
              >
                <Film className="w-3.5 h-3.5 text-rose-500" />
                <span>YouTube SEO Lens</span>
              </button>

              <button
                onClick={() => setActiveTab('omnipost')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer border ${
                  activeTab === 'omnipost'
                    ? 'bg-purple-600 border-purple-500 text-white shadow-sm'
                    : isDarkMode
                    ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 shadow-2xs'
                }`}
              >
                <Share2 className="w-3.5 h-3.5 text-purple-400" />
                <span>OmniPost Social</span>
              </button>

              <button
                onClick={() => setActiveTab('nightcafe')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer border ${
                  activeTab === 'nightcafe'
                    ? 'bg-purple-600 border-purple-500 text-white shadow-sm'
                    : isDarkMode
                    ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 shadow-2xs'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-blue-400" />
                <span>NightCafe Queue</span>
              </button>

              <button
                onClick={() => setActiveTab('telemetry')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer border ${
                  activeTab === 'telemetry'
                    ? 'bg-purple-600 border-purple-500 text-white shadow-sm'
                    : isDarkMode
                    ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 shadow-2xs'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>1h Telemetry</span>
              </button>

              <button
                onClick={() => setActiveTab('coproducer')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer border ${
                  activeTab === 'coproducer'
                    ? 'bg-purple-600 border-purple-500 text-white shadow-sm'
                    : isDarkMode
                    ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 shadow-2xs'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
                <span>Studio Co-Producer AI</span>
              </button>

              <button
                onClick={() => setActiveTab('search')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer border ${
                  activeTab === 'search'
                    ? 'bg-purple-600 border-purple-500 text-white shadow-sm'
                    : isDarkMode
                    ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 shadow-2xs'
                }`}
              >
                <Search className="w-3.5 h-3.5 text-cyan-400" />
                <span>Search Grounding</span>
              </button>
            </div>
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
              onNavigateToTab={setActiveTab}
              epCollections={EP_COLLECTIONS}
              selectedEpFilter={selectedEpFilter}
              onSelectEpFilter={setSelectedEpFilter}
              onOpenCreateProject={() => setIsCreateModalOpen(true)}
              isDarkMode={isDarkMode}
            />
          )}

          {/* TAB 1: LYRICS & SUNO 4-BLOCK ENGINE (WITH IMPORT, SAVED VAULT & NASHVILLE SOP) */}
          {activeTab === 'lyrics' && (
            <LyricsAndSunoTab
              track={selectedTrack}
              onUpdateTrack={handleTrackUpdate}
              onCopyText={copyToClipboard}
            />
          )}

          {/* TAB 2: MINI-DAW MIXER & TRIMMER */}
          {activeTab === 'mixer' && (
            <MiniDawMixerTab
              track={selectedTrack}
            />
          )}

          {/* TAB: YOUTUBE SEO LENS & WOODWORKING BAN */}
          {activeTab === 'youtube' && (
            <YouTubeSEOTab
              track={selectedTrack}
              onCopyText={copyToClipboard}
            />
          )}

          {/* TAB: OMNIPOST SOCIAL DISPATCHER */}
          {activeTab === 'omnipost' && (
            <OmniPostTab
              track={selectedTrack}
              onCopyText={copyToClipboard}
            />
          )}

          {/* TAB: LIVE MINISTRY CHARTS & STAGE STEMS */}
          {activeTab === 'ministry' && (
            <LiveMinistryChartsTab
              track={selectedTrack}
              onCopyText={copyToClipboard}
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
            />
          )}

          {/* TAB 3: SENIOR MASTERING & A/B BUS */}
          {activeTab === 'mastering' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Senior Mastering Engineer & Level-Matched A/B Bus</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-700/40">
                      Target: -12.0 LUFS | -1.0 dBTP
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Audition raw Suno gens against Billboard Top 100 reference tracks with instant LUFS gain compensation.</p>
                </div>

                <button
                  onClick={() => {
                    const next = !isMonoCollapse;
                    setIsMonoCollapse(next);
                    audioMiniDaw.setMonoCollapse(next);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                    isMonoCollapse ? 'bg-amber-600 text-white border-amber-500' : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                  title="Audit wide reverb returns for phase cancellation on mobile phones"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>{isMonoCollapse ? 'Mono Collapse ACTIVE' : 'Mono-Collapse Check'}</span>
                </button>
              </div>

              {/* A/B Bus Selector */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { id: 'suno', label: '[A] Raw Suno Gen' },
                  { id: 'vocal', label: '[B] Isolated Dry Vocal' },
                  { id: 'instrumental', label: '[C] True Instrumental' },
                  { id: 'master', label: '[D] Final Master WAV' },
                  { id: 'ref', label: '[REF] Billboard Ref' }
                ].map(bus => (
                  <button
                    key={bus.id}
                    onClick={() => {
                      setActiveBus(bus.id as any);
                      audioMiniDaw.updateBusRouting(bus.id, trackStates);
                    }}
                    className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                      activeBus === bus.id
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-950'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span>{bus.label}</span>
                  </button>
                ))}
              </div>

              {/* Mastering Meters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Integrated Loudness</span>
                  <div className="text-2xl font-black text-emerald-400 font-mono">-12.1 LUFS</div>
                  <span className="text-[10px] text-slate-500">Nashville Standard Compliant</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">True Peak Ceiling</span>
                  <div className="text-2xl font-black text-indigo-400 font-mono">-1.05 dBTP</div>
                  <span className="text-[10px] text-slate-500">Zero Intersample Clipping</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Phase Correlation</span>
                  <div className="text-2xl font-black text-amber-400 font-mono">+0.92</div>
                  <span className="text-[10px] text-slate-500">Mono Compatible Safe</span>
                </div>
              </div>

              {/* Processing Chain Checklist */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                  DAW Surgery & Master Chain Audit (Nashville Benchmark)
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-300 font-mono text-[11px]">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Subtractive HPF @ 80-100Hz on Vocals</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Dynamic EQ Notch @ 300-500Hz mud reduction</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Dual-Stage Compression (Peak Catcher + Color Slam)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Parallel Vox Smash Bus blended @ 5-10%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: VISUALS & VEO 3 VIDEO STUDIO */}
          {activeTab === 'veo_visuals' && (
            <div className="space-y-6">
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
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>Visual Assets & Generated Renders ({generatedImages.length + generatedVideos.length})</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Images */}
                    {generatedImages.map((img) => (
                      <div key={img.id} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col group">
                        <div className="relative aspect-square bg-slate-900 overflow-hidden">
                          <img src={img.url} alt={img.prompt} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                          <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-sm px-2 py-0.5 rounded text-[9px] font-mono text-white font-bold">
                            {img.aspectRatio}
                          </div>
                        </div>
                        <div className="p-3 space-y-2 flex-1 flex flex-col justify-between text-xs">
                          <p className="text-[11px] text-slate-300 line-clamp-2">{img.prompt}</p>
                          <div className="flex items-center justify-between gap-1 pt-2 border-t border-slate-800">
                            <button
                              onClick={() => {
                                setSelectedImageForEdit(img.url);
                                setImageMode('edit');
                              }}
                              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold"
                            >
                              Edit / Animate
                            </button>
                            <button
                              onClick={() => handleAnalyzeImage(img.url)}
                              className="text-[10px] text-purple-400 hover:text-purple-300 font-bold"
                            >
                              Analyze (Pro)
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Videos */}
                    {generatedVideos.map((vid) => (
                      <div key={vid.id} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col group">
                        <div className={`relative ${vid.aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-video'} bg-slate-900 flex items-center justify-center`}>
                          {vid.videoUrl ? (
                            <video src={vid.videoUrl} controls className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-center p-4">
                              <RefreshCw className="w-6 h-6 text-rose-400 animate-spin mx-auto mb-2" />
                              <span className="text-[10px] text-slate-400 font-mono">Veo Rendering...</span>
                            </div>
                          )}
                          <div className="absolute top-2 right-2 bg-slate-900/80 px-2 py-0.5 rounded text-[9px] font-mono text-white font-bold">
                            Veo {vid.aspectRatio}
                          </div>
                        </div>
                        <div className="p-3 text-xs space-y-1">
                          <p className="text-[11px] text-slate-300 line-clamp-2">{vid.prompt}</p>
                          <span className="text-[9px] font-mono text-slate-500">{vid.status.toUpperCase()}</span>
                        </div>
                      </div>
                    ))}
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
          )}

          {/* TAB 6: TELEMETRY & SURVIVAL LOOP */}
          {activeTab === 'telemetry' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>T+60m Inbound Telemetry & Brutal Metric Loop</span>
                  <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-mono text-[10px] font-bold border border-purple-700/50">
                    Active Audit
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Automated retention scoring. Videos with ≥70% completion trigger 10s video extensions instantly.</p>
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
          )}

          {/* TAB 7: STUDIO CO-PRODUCER AI (GEMINI CHATBOT) */}
          {activeTab === 'coproducer' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col h-[640px]">
              <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-teal-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Studio Co-Producer AI (Multi-Turn Chatbot)</h3>
                    <p className="text-[11px] text-slate-400">Contextually aware of {selectedTrack.title} ({selectedTrack.genre})</p>
                  </div>
                </div>

                {/* Role and Model Selectors */}
                <div className="flex items-center gap-2">
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
          )}

          {/* TAB 8: SEARCH GROUNDING */}
          {activeTab === 'search' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Search className="w-4 h-4 text-cyan-400" />
                  <span>Google Search Grounding (gemini-3.5-flash with googleSearch tool)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Retrieve up-to-date Billboard Christian/Gospel charts, BPM trends, Nashville mixing standards, and theological references.
                </p>
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
              onNavigateToTab={setActiveTab}
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
                    <span>Nextcloud Sovereign WebDAV Hub</span>
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
                  const sql = generatePostgreSqlRelationalMigration(tracks);
                  const blob = new Blob([sql], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = 'brickos_relational_seed.sql';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                  copyToClipboard('Downloaded brickos_relational_seed.sql', 'PostgreSQL Schema');
                }}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center justify-center gap-2 transition"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export Relational SQL Seed (.sql)</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => {
                    setIsStorageModalOpen(false);
                    setActiveTab('database');
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-950"
                >
                  <Database className="w-3.5 h-3.5 text-amber-300" />
                  <span>Open Database & Matrix Tab</span>
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
        onCreateProject={(newTrack) => handleAddNewTrack(newTrack, true)}
        existingTracksCount={tracks.length}
        existingTracks={tracks}
        defaultEp={selectedTrack.ep}
      />

    </div>
  );
}
