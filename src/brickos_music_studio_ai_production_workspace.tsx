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
  Palette,
  HelpCircle,
  Keyboard,
  Edit3,
  Trash2
} from 'lucide-react';
import { Track, TrackStatus, TrackVersion, MixerTrack, GeneratedImage, GeneratedVideo, ChatMessage, CompositionSession, NextcloudFolderAsset, PromptItem, UniversalAssetItem, StudioTheme } from './types';
import { StudioWorkflowGuide } from './components/StudioWorkflowGuide';
import { StudioThemeSelector } from './components/StudioThemeSelector';
import { StudioThemeModal } from './components/StudioThemeModal';
import { UniversalAssetEditorModal } from './components/UniversalAssetEditorModal';
import { CANONICAL_TRACKS, NIGHTCAFE_DEFAULT_PROMPTS, VOCAL_ROSTER, EP_COLLECTIONS } from './data/canonicalCatalog';
import { INITIAL_COMPOSITION_SESSIONS } from './data/canonicalSessions';
import { audioMiniDaw } from './utils/audioEngine';
import { getTrackStems } from './data/nextcloudAssetIndex';
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
import { VeoVisualsTab } from './components/VeoVisualsTab';
import { NightCafeTab } from './components/NightCafeTab';
import { TelemetryTab } from './components/TelemetryTab';
import { StudioCopilotTab } from './components/StudioCopilotTab';
import { SearchGroundingTab } from './components/SearchGroundingTab';
import { StudioCommandPalette } from './components/StudioCommandPalette';
import { StudioCopilotDrawer } from './components/StudioCopilotDrawer';
import { TrackLifecycleStepper } from './components/TrackLifecycleStepper';
import { SelahPrayerGateModal } from './components/SelahPrayerGateModal';
import { StudioHome, getSuggestedTrackStep } from './components/StudioHome';
import type { StudioWorkspace } from './components/StudioHome';
import { TailscaleVpnModal } from './components/TailscaleVpnModal';
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
import { ECV_CANONICAL_ASSETS } from './data/nextcloudAssetIndex';

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
    'home' | 'kanban' | 'lyrics' | 'mixer' | 'mastering' | 'youtube' | 'omnipost' | 'ministry' | 'veo_visuals' | 'nightcafe' | 'video_express' | 'telemetry' | 'coproducer' | 'search' | 'database' | 'nextcloud_sync' | 'prompt_library' | 'version-matrix' | 'brainstorming'
  >('home');
  const [workspaceMode, setWorkspaceMode] = useState<StudioWorkspace>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('brickos_workspace_mode') : null;
    return saved === 'write' || saved === 'produce' || saved === 'release' || saved === 'all' ? saved : 'all';
  });
  const handleSetWorkspaceMode = (mode: StudioWorkspace) => {
    setWorkspaceMode(mode);
    localStorage.setItem('brickos_workspace_mode', mode);
  };
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
  // Unified Command Palette & Studio Copilot Drawer State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isCopilotDrawerOpen, setIsCopilotDrawerOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isTailscaleModalOpen, setIsTailscaleModalOpen] = useState(false);
  const [isSelahGateOpen, setIsSelahGateOpen] = useState(false);

  const [studioTheme, setStudioTheme] = useState<StudioTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('brickos_studio_theme') as StudioTheme;
      if (saved && ['sun', 'moon', 'stars', 'graphite', 'console', 'clean'].includes(saved)) return saved;
      const legacy = localStorage.getItem('brickos_theme');
      if (legacy === 'light') return 'sun';
      return 'moon'; // Default pro-DAW dark studio aesthetic
    }
    return 'moon';
  });

  const isDarkMode = studioTheme !== 'sun' && studioTheme !== 'clean';
  const [focusMode, setFocusMode] = useState<boolean>(false);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.classList.remove('sun', 'moon', 'stars', 'graphite', 'console', 'clean', 'light', 'dark');
      root.removeAttribute('data-theme');

      if (studioTheme === 'sun' || studioTheme === 'clean') {
        root.classList.add('light', 'sun');
        root.classList.add(studioTheme);
        root.setAttribute('data-theme', studioTheme);
      } else if (studioTheme === 'stars') {
        root.classList.add('dark', 'stars');
        root.setAttribute('data-theme', 'stars');
      } else {
        root.classList.add('dark', studioTheme);
        if (studioTheme === 'moon') root.classList.add('moon');
        root.setAttribute('data-theme', studioTheme);
      }
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('brickos_studio_theme', studioTheme);
      localStorage.setItem('brickos_theme', studioTheme === 'sun' || studioTheme === 'clean' ? 'light' : 'dark');
    }
  }, [studioTheme]);

  const handleSelectTheme = (theme: StudioTheme) => {
    setStudioTheme(theme);
    if (theme === 'sun') {
      showToast('☀️ Switched to Sun (Daylight Nashville) Mode — High Clarity', 'info');
    } else if (theme === 'stars') {
      showToast('✨ Switched to Stars (Muted Twilight) Mode — Low Fatigue', 'info');
    } else if (theme === 'graphite') {
      showToast('Graphite Studio theme enabled', 'info');
    } else if (theme === 'console') {
      showToast('Warm Console theme enabled', 'info');
    } else if (theme === 'clean') {
      showToast('Clean Studio theme enabled', 'info');
    } else {
      showToast('🌙 Switched to Moon (Pro-DAW Obsidian Dark) Mode', 'info');
    }
  };

  const handleToggleTheme = () => {
    const themeOrder: StudioTheme[] = ['sun', 'moon', 'stars', 'graphite', 'console', 'clean'];
    const next = themeOrder[(themeOrder.indexOf(studioTheme) + 1) % themeOrder.length];
    handleSelectTheme(next);
  };

  // Global Keyboard Shortcuts for Command Palette (Ctrl+K), Copilot Drawer (Ctrl+J), Theme (Shift+T), and Focus Mode (Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement || (activeEl as HTMLElement)?.isContentEditable;

      // Ctrl+K or Cmd+K: Open Command Palette
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      // Ctrl+J or Cmd+J: Toggle Copilot Drawer
      else if ((e.ctrlKey || e.metaKey) && (e.key === 'j' || e.key === 'J')) {
        e.preventDefault();
        setIsCopilotDrawerOpen(prev => !prev);
      }
      // Shift+T or Alt+T: Cycle through available studio themes
      else if (!isInput && ((e.shiftKey && (e.key === 'T' || e.key === 't')) || (e.altKey && (e.key === 't' || e.key === 'T')))) {
        e.preventDefault();
        handleToggleTheme();
      }
      // Z / z (only when not typing in input/textarea): Toggle Focus Mode
      else if (!isInput && (e.key === 'z' || e.key === 'Z') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleToggleFocusMode();
      }
      // ESC: Close overlays if open
      else if (e.key === 'Escape') {
        if (isCommandPaletteOpen) setIsCommandPaletteOpen(false);
        if (isCopilotDrawerOpen) setIsCopilotDrawerOpen(false);
        if (isThemeModalOpen) setIsThemeModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, isCopilotDrawerOpen, isThemeModalOpen, studioTheme, focusMode]);

  // Firestore persistent cloud database synchronization state
  const [isDbConnected, setIsDbConnected] = useState<boolean>(false);
  const [isDbSyncing, setIsDbSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>('');
  const [cloudSyncError, setCloudSyncError] = useState('');
  const recordCloudSave = () => {
    setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setIsDbConnected(isFirebaseConfigured());
    setCloudSyncError('');
  };
  const recordCloudSaveFailure = (message: string) => setCloudSyncError(`${message} Changes remain saved on this device.`);

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
  const sideNavWasOpenBeforeFocus = useRef(false);
  const isSideNavOpenRef = useRef(isSideNavOpen);
  isSideNavOpenRef.current = isSideNavOpen;

  function handleToggleFocusMode() {
    if (focusMode) {
      setFocusMode(false);
      setIsSideNavOpen(sideNavWasOpenBeforeFocus.current);
      return;
    }

    sideNavWasOpenBeforeFocus.current = isSideNavOpenRef.current;
    setFocusMode(true);
    setIsSideNavOpen(false);
  }

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
              setCloudSyncError('');
              setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
              setSelectedTrack(prev => {
                const found = realtimeTracks.find(t => t.id === prev?.id);
                return found || prev;
              });
            }
          },
          (err) => {
            if (isMounted) {
              setIsDbConnected(false);
              setCloudSyncError('Cloud connection lost. Changes remain saved on this device.');
            }
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
            if (isMounted) {
              setIsDbConnected(false);
              setCloudSyncError('Cloud connection lost. Changes remain saved on this device.');
            }
            console.warn('Firestore sessions subscription error:', err);
          }
        );
      } catch (err) {
        if (isMounted) setCloudSyncError('Cloud connection failed. Changes remain saved on this device.');
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
    } else if (activeTab === 'kanban' || activeTab === 'home') {
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
      recordCloudSave();
      setCopiedNotification(isFirebaseConfigured() ? `Saved composition session "${newSession.name}" to Cloud!` : `Saved composition session "${newSession.name}" on this device.`);
      setTimeout(() => setCopiedNotification(''), 4000);
    } catch (err) {
      recordCloudSaveFailure('Cloud sync failed.');
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
        recordCloudSave();
        setCopiedNotification(`Updated session snapshot for "${(updatedSession as CompositionSession).name}"!`);
        setTimeout(() => setCopiedNotification(''), 3500);
      } catch (err) {
        recordCloudSaveFailure('Cloud sync failed.');
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
      recordCloudSave();
      setCopiedNotification(`Forked session: "${forkedSession.name}"`);
      setTimeout(() => setCopiedNotification(''), 3500);
    } catch (err) {
      recordCloudSaveFailure('Cloud sync failed.');
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
      recordCloudSave();
      setCopiedNotification('Session removed from cloud.');
      setTimeout(() => setCopiedNotification(''), 3000);
    } catch (err) {
      recordCloudSaveFailure('Cloud sync failed.');
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
      recordCloudSave();
    } catch (err) {
      recordCloudSaveFailure('Cloud sync failed.');
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
        setIsDbConnected(isFirebaseConfigured());
        setCloudSyncError('');
      } catch (err) {
        setCloudSyncError('Cloud sync failed. Changes remain saved locally.');
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
      setIsDbConnected(isFirebaseConfigured());
      setCloudSyncError('');
      setCopiedNotification(`Created & saved "${newTrack.title}" (${newTrack.id}) with 4-Phase Storyboard Prompts to Cloud Firestore!`);
      setTimeout(() => setCopiedNotification(''), 4500);
    } catch (err) {
      setCloudSyncError('Cloud sync failed. Your new song is saved locally.');
      console.error('Failed to save new track to cloud Firestore:', err);
    } finally {
      setIsDbSyncing(false);
    }
  };

  // Manual Re-sync / Backup catalog to Firestore
  const handleManualSyncDatabase = async () => {
    try {
      setIsDbSyncing(true);
      setCloudSyncError('');
      await seedInitialCatalog(tracks);
      if (isFirebaseConfigured()) {
        setIsDbConnected(true);
        setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        showToast(`Successfully synced all ${tracks.length} tracks to Cloud Firestore!`, 'success');
      } else {
        showToast('Cloud is not configured. Your work is saved in this browser only.', 'info');
      }
    } catch (err: any) {
      setCloudSyncError('Cloud sync failed. Your work is saved locally.');
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
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [masterVolume, setMasterVolume] = useState(85);
  const [trackStates, setTrackStates] = useState<MixerTrack[]>(() => getTrackStems(selectedTrack));

  // Listen for audio loading/buffering states from the audio engine
  useEffect(() => {
    return audioMiniDaw.addLoadingListener(setIsLoadingAudio);
  }, []);

  useEffect(() => {
    const stems = getTrackStems(selectedTrack);
    setTrackStates(stems);
    if (isPlaying) {
      // Re-synchronize playback with the newly selected track's stems immediately
      audioMiniDaw.startPlayback(stems, selectedTrack.bpm, selectedTrack.key, selectedTrack.id, selectedTrack.title);
    }
  }, [selectedTrack.id, selectedTrack.title]);

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
      const currentStems = getTrackStems(selectedTrack);
      audioMiniDaw.startPlayback(currentStems, selectedTrack.bpm, selectedTrack.key, selectedTrack.id, selectedTrack.title);
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
        trackTitle: "The Master's Hand",
        trackId: 'SOV-001',
        category: 'Cover Art',
        tags: ['Woodwork', 'Golden Hour', 'Nashville', 'Kintsugi']
      },
      {
        id: 'img-ecv-1',
        name: "Every Candle's Victory (4K Sanctuary Cover)",
        url: ECV_CANONICAL_ASSETS[7].previewImageUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
        prompt: 'Flickering golden beeswax candle on ancient cathedral altar stone, cross light illuminating limestone, 4K album master',
        aspectRatio: '1:1',
        timestamp: '2026-09-24',
        mode: 'create',
        trackTitle: "Every Candle's Victory",
        trackId: 'TRK-03',
        linkedTrackIds: ['TRK-03', 'ECV'],
        category: 'Cover Art',
        tags: ['ECV', 'Every Candles Victory', 'Nextcloud', 'Candle', 'Sanctuary', 'Restoration']
      },
      {
        id: 'img-ecv-2',
        name: "Every Candle's Victory (Open Skies Storyboard Plate)",
        url: ECV_CANONICAL_ASSETS[8].previewImageUrl || 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800',
        prompt: 'Deep purple twilight sky breaking into golden horizon underneath the open skies, cancer survival testimony visual plate',
        aspectRatio: '16:9',
        timestamp: '2026-09-24',
        mode: 'create',
        trackTitle: "Every Candle's Victory",
        trackId: 'TRK-03',
        linkedTrackIds: ['TRK-03', 'ECV'],
        category: 'Storyboard Scene Plate',
        tags: ['ECV', 'Every Candles Victory', 'Nextcloud', 'Open Skies', 'Scene 2', 'Survivor Tribute']
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
    },
    {
      id: 'video-ecv-1',
      name: "Every Candle's Victory - 9:16 Devotional Cinematic Reel",
      operationName: 'nextcloud-fiber-asset',
      prompt: 'Flickering beeswax candle in stone cathedral dissolving into mother underneath open skies, 9:16 cinematic morning devotional',
      aspectRatio: '9:16',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      status: 'ready',
      timestamp: '2026-09-24',
      modelUsed: 'Nextcloud Fiber WebDAV / Veo 2',
      trackTitle: "Every Candle's Victory",
      trackId: 'TRK-03',
      linkedTrackIds: ['TRK-03', 'ECV'],
      tags: ['ECV', 'Every Candles Victory', 'Nextcloud', '9:16', 'TikTok', 'Devotional', 'Gospel Shout'],
      notes: 'Nextcloud WebDAV: /remote.php/dav/files/ncted/Music-Production/ECV/video/ECV_Studio_Cinematic_Reel_1080p_9x16.mp4',
      category: 'Social Reel Plate',
      source: 'nextcloud_fiber',
      resolution: '1080x1920 Vertical HD',
      durationSec: 30
    },
    {
      id: 'video-ecv-2',
      name: "Every Candle's Victory - 4K Candle Flame Visualizer Loop",
      operationName: 'nextcloud-fiber-asset',
      prompt: '4K ambient candle flame visualizer loop with synced audio spectrum waves and sanctuary stone reflections',
      aspectRatio: '16:9',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      status: 'ready',
      timestamp: '2026-09-24',
      modelUsed: 'Nextcloud Fiber WebDAV / Veo 2',
      trackTitle: "Every Candle's Victory",
      trackId: 'TRK-03',
      linkedTrackIds: ['TRK-03', 'ECV'],
      tags: ['ECV', 'Every Candles Victory', 'Nextcloud', '16:9', 'YouTube', 'Visualizer Loop', '4K'],
      notes: 'Nextcloud WebDAV: /remote.php/dav/files/ncted/Music-Production/ECV/video/ECV_Candle_Flame_Visualizer_Loop_4k_16x9.mp4',
      category: 'YouTube 16:9 Video',
      source: 'nextcloud_fiber',
      resolution: '3840x2160 4K UHD',
      durationSec: 45
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
  const [chatModel, setChatModel] = useState('gemini-3.8-flash');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      role: 'assistant',
      content: "Welcome to brickOS Master Studio. I am your Lead Theological & Lyrical Assistant powered by Gemini 3.8 Flash. Let's ensure every track passes the OBI Funnel, strips all tired 'Christianese' clichés, and drives home the Throne Room Pivot by the bridge.",
      timestamp: '01:00 AM',
      model: 'gemini-3.8-flash'
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
        setIsDbSyncing(true);
        await saveTrackToFirestore(modifiedTrackToPersist);
        setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setCloudSyncError('');
        setIsDbConnected(isFirebaseConfigured());
      } catch (err) {
        setCloudSyncError('Cloud sync failed. The latest change is saved locally.');
        console.warn('Failed to persist track modification to Firestore:', err);
      } finally {
        setIsDbSyncing(false);
      }
    }
  };

  // Playback toggle
  const handleTogglePlayback = () => {
    if (isPlaying) {
      audioMiniDaw.stopPlayback();
      setIsPlaying(false);
    } else {
      const stems = trackStates.length > 0 && trackStates[0].audioUrl ? trackStates : getTrackStems(selectedTrack);
      audioMiniDaw.startPlayback(stems, selectedTrack.bpm, selectedTrack.key, selectedTrack.id, selectedTrack.title);
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
      if (!res.ok || data.error) {
        throw new Error(data.error || `Failed to receive response from Gemini (${res.status})`);
      }
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
          content: `⚠️ Gemini Response Notice: ${err.message}`,
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
    <div className={`min-h-screen flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white transition-colors duration-200 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} ${focusMode ? 'focus-mode' : ''}`}>
      
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
            onClick={() => setActiveTab('home')}
            className="w-10 h-10 rounded-xl bg-slate-900/90 border border-slate-700/60 p-1 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20 hover:scale-105 active:scale-95 transition cursor-pointer overflow-hidden group"
            title="Return to Studio Home"
          >
            <img 
              src="/brick-logo.webp" 
              alt="brickOS Studio Logo" 
              className="w-full h-full object-contain drop-shadow group-hover:brightness-110 transition" 
            />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 
              onClick={() => setActiveTab('home')}
                className={`text-base font-black tracking-wider transition cursor-pointer ${
                  isDarkMode ? 'text-white hover:text-indigo-300' : 'text-slate-900 hover:text-indigo-600'
                }`}
              title="Return to Studio Home"
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
                  cloudSyncError
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                    : isDbSyncing
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : isDbConnected
                    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20'
                    : 'bg-slate-500/10 text-slate-400 border-slate-500/30 hover:bg-slate-500/20'
                }`}
                title={`${cloudSyncError || (isDbConnected ? `Cloud synced${lastSyncedAt ? ` at ${lastSyncedAt}` : ''}` : isFirebaseConfigured() ? 'Connecting to cloud' : 'Saved locally in this browser')}. Click to sync now.`}
              >
                <Database className={`w-3 h-3 ${isDbSyncing ? 'animate-spin text-amber-400' : cloudSyncError ? 'text-rose-400' : isDbConnected ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{isDbSyncing ? 'Saving...' : cloudSyncError ? 'Local copy • sync issue' : isDbConnected ? 'Cloud synced' : isFirebaseConfigured() ? 'Connecting...' : 'Saved locally'}</span>
                {lastSyncedAt && isDbConnected && <span className="text-[9px] opacity-70">({lastSyncedAt})</span>}
              </button>
            </div>
            <p className={`text-[11px] flex items-center gap-2 flex-wrap ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              <span>Ted Moyer (Primary Artist / OAC)</span>
              <span>•</span>
              <span className="text-indigo-500 font-medium">BRICK Records</span>
              <span>•</span>
              {activeTab === 'home' ? (
                <span className="text-amber-500 font-medium bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">Studio Home</span>
              ) : activeTab === 'kanban' ? (
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
        <div className="workspace-header-actions flex items-center gap-2 sm:gap-2.5 flex-wrap">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition shadow-sm cursor-pointer ${
              activeTab === 'home'
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : isDarkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
            title="Studio Home"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Home</span>
          </button>

          <button
            onClick={() => setActiveTab('kanban')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition shadow-sm cursor-pointer ${activeTab === 'kanban' ? 'bg-indigo-600 border-indigo-500 text-white' : isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'}`}
            title="Open the Kanban production pipeline"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Pipeline</span>
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

          {/* Global Studio Theme Selector */}
          <div className="flex items-center gap-1 bg-slate-950/90 p-1 rounded-xl border border-slate-800 shadow-xs flex-shrink-0">
            <StudioThemeSelector
              currentTheme={studioTheme}
              onSelectTheme={handleSelectTheme}
              variant="header"
              showLabels={false}
            />
            <button
              type="button"
              onClick={() => setIsThemeModalOpen(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition cursor-pointer"
              title="Studio Theme Architecture: Six palettes (Shift+T to cycle)"
              aria-label="Studio Theme Customizer"
            >
              <Palette className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </div>

          {/* FOCUS MODE TOGGLE */}
          <button
            type="button"
            onClick={handleToggleFocusMode}
            className={`focus-mode-toggle p-2 rounded-xl border flex items-center gap-1 transition cursor-pointer ${
              focusMode
                ? 'bg-purple-900/60 text-purple-200 border-purple-500/50 shadow-xs'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title={focusMode ? 'Exit Focus Mode and restore the previous sidebar state' : 'Focus Mode hides secondary navigation and utility controls'}
            aria-label={focusMode ? 'Exit Focus Mode' : 'Enter Focus Mode'}
          >
            <Eye className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-bold font-mono hidden xl:inline">
              {focusMode ? 'Exit Focus' : 'Focus'}
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
                workspaceMode={workspaceMode}
              />
            </div>
          </>
        )}

        {/* CENTER / RIGHT: ACTIVE WORKBENCH */}
        <main className={`flex-1 flex flex-col min-w-0 transition-colors duration-200 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100/70 text-slate-900'} ${activeTab === 'kanban' ? 'h-[calc(100vh-65px)] overflow-hidden p-2.5' : 'p-4 sm:p-6 space-y-6 overflow-y-auto'}`}>
          
          {/* STUDIO WORKFLOW GUIDE & 5-STAGE PIPELINE NAVIGATOR */}
          {activeTab !== 'home' && <div className="flex-shrink-0">
            <StudioWorkflowGuide
              activeTab={activeTab}
              onSelectTab={(tabKey) => setActiveTab(tabKey as any)}
              isDarkMode={isDarkMode}
            />
          </div>}

          {/* TRACK HEADER BANNER (Shown only on single-track workbench views) */}
          {activeTab !== 'kanban' && activeTab !== 'home' && (
            <div
              className={`bento-card p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 transition-all duration-200 ${
                isDarkMode
                  ? 'bg-slate-900 border border-slate-800 text-white shadow-xl'
                  : 'bg-white border border-slate-200 text-slate-900 shadow-sm ring-1 ring-slate-900/5'
              }`}
            >
              <div className="space-y-2">
                <div className="track-header-actions flex items-center gap-2 flex-wrap">
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
                    onClick={() => setIsSelahGateOpen(true)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                      selectedTrack.selahPrayed
                        ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                        : isDarkMode
                        ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                        : 'bg-slate-100 border-slate-300 text-slate-600 hover:text-slate-900'
                    }`}
                    title="Mandatory 24h prayer & stationkeeping before master release (Nashville SOP Rule 1)"
                  >
                    <Heart className={`w-3.5 h-3.5 ${selectedTrack.selahPrayed ? 'fill-emerald-400 text-emerald-400' : ''}`} />
                    <span>{selectedTrack.selahPrayed ? 'Selah Done' : 'Selah Prayer'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SOP TRACK LIFECYCLE STEPPER (NASHVILLE WORKFLOW PIPELINE) */}
          {activeTab !== 'kanban' && activeTab !== 'home' && !focusMode && (
            <TrackLifecycleStepper
              selectedTrack={selectedTrack}
              onNavigateToTab={(tab: string) => setActiveTab(tab as any)}
              onOpenSelahGate={() => setIsSelahGateOpen(true)}
              isDarkMode={isDarkMode}
            />
          )}

          {/* ACTIVE SECTION CONTEXT BANNER & ESSENTIAL UTILITY ACTIONS (Icons moved to collapsible side navigation bar) */}
          {activeTab !== 'home' && <>
          <div className={`flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 ${isDarkMode ? 'border-slate-800 bg-slate-900/70' : 'border-slate-200 bg-white'}`} aria-label="Choose workspace">
            <span className={`mr-1 text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Workspace</span>
            {([
              ['write', 'Write'], ['produce', 'Produce'], ['release', 'Release'], ['all', 'All tools']
            ] as Array<[StudioWorkspace, string]>).map(([mode, label]) => (
              <button key={mode} type="button" onClick={() => handleSetWorkspaceMode(mode)} aria-pressed={workspaceMode === mode}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${workspaceMode === mode ? 'bg-indigo-600 text-white' : isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}>
                {label}
              </button>
            ))}
          </div>
          <div className={`${activeTab === 'kanban' ? 'px-3 py-1.5' : 'px-4 py-2.5'} rounded-xl border flex items-center justify-between flex-wrap gap-2 transition flex-shrink-0 ${
            isDarkMode
              ? 'bg-slate-900/90 border-slate-800 text-slate-200'
              : 'bg-white border-slate-200 text-slate-800 shadow-2xs'
          }`}>
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Collapsible Sidebar / Navigation Quick Toggle */}
              <button
                type="button"
                onClick={() => {
                  if (!isSideNavOpen) {
                    setIsSideNavOpen(true);
                    setIsSideNavCollapsed(false);
                  } else {
                    setIsSideNavCollapsed(prev => !prev);
                  }
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer border shadow-xs ${
                  isSideNavOpen && !isSideNavCollapsed
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400'
                    : isDarkMode
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
                title={isSideNavOpen && !isSideNavCollapsed ? 'Collapse Studio Side Navigation Panel' : 'Expand Studio Side Navigation Panel'}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{isSideNavOpen && !isSideNavCollapsed ? 'Side Nav: Open' : 'Side Nav: Mini'}</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-300">
                  Active: <strong className="text-white font-mono uppercase">{activeTab.replace('_', ' ')}</strong>
                </span>
                <span className="text-slate-500 hidden sm:inline">•</span>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  {selectedTrack ? `${selectedTrack.id}: ${selectedTrack.title}` : 'Studio Master'}
                </span>
              </div>
            </div>

            <div className="section-utility-actions flex items-center gap-2 flex-wrap">
              {/* Command Palette Button */}
              <button
                type="button"
                onClick={() => setIsCommandPaletteOpen(true)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition flex items-center gap-1.5 cursor-pointer border ${
                  isDarkMode
                    ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
                title="Open Command Palette (Cmd+K)"
              >
                <Terminal className="w-3 h-3 text-indigo-400" />
                <span>Cmd+K</span>
              </button>

              {/* How To Use This Section & SOP */}
              <button
                type="button"
                onClick={() => handleOpenSectionGuide(activeTab as StudioSectionId)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border shadow-xs ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-amber-500/20 to-indigo-500/20 hover:from-amber-500/30 hover:to-indigo-500/30 text-amber-300 border-amber-500/40'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                }`}
                title={`Open detailed instructions & SOP rules for ${activeTab.replace('_', ' ')}`}
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>How To Use & SOP</span>
              </button>
            </div>
          </div>
          </>}

          {activeTab === 'home' && (
            <StudioHome
              track={selectedTrack}
              sessions={sessions}
              isDarkMode={isDarkMode}
              onContinue={() => {
                const step = getSuggestedTrackStep(selectedTrack);
                handleSetWorkspaceMode(step.workspace);
                setActiveTab(step.tab as any);
              }}
              onOpenWorkspace={(workspace, tab) => {
                handleSetWorkspaceMode(workspace);
                setActiveTab(tab as any);
              }}
              onOpenSession={handleSelectSession}
            />
          )}

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
              onSelectTrack={(t) => setSelectedTrack(t)}
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
              onSendToVideoExpress={(prompt) => {
                setActiveTab('video_express');
                showToast('Loaded Whiteboard scene into VideoExpress.ai!', 'info');
              }}
              isDarkMode={isDarkMode}
            />
          )}

          {/* TAB 2: MINI-DAW MIXER & TRIMMER */}
          {activeTab === 'mixer' && (
            <MiniDawMixerTab
              track={selectedTrack}
              onOpenSectionGuide={handleOpenSectionGuide}
              isDarkMode={isDarkMode}
              onSelectTrack={(t) => setSelectedTrack(t)}
              allTracks={tracks}
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
            <VeoVisualsTab
              tracks={tracks}
              selectedTrack={selectedTrack}
              onAddVideoAsset={handleAddVideo}
              onOpenAssetEditor={(asset, mode) => {
                setWorkspaceEditingAsset(asset);
                setWorkspaceAssetModalMode(mode === 'view' ? 'edit' : (mode || 'edit'));
                setWorkspaceAssetModalOpen(true);
              }}
              onOpenSectionGuide={handleOpenSectionGuide}
              isDarkMode={isDarkMode}
              onCopySuccess={(msg) => showToast(msg, 'success')}
            />
          )}

          {/* TAB 5: NIGHTCAFE QUEUE RUNNER */}
          {activeTab === 'nightcafe' && (
            <NightCafeTab
              prompts={NIGHTCAFE_DEFAULT_PROMPTS}
              onOpenSectionGuide={handleOpenSectionGuide}
              isDarkMode={isDarkMode}
              onCopySuccess={(msg) => showToast(msg, 'success')}
            />
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
            <TelemetryTab
              onOpenSectionGuide={handleOpenSectionGuide}
              isDarkMode={isDarkMode}
            />
          )}

          {/* TAB 7: STUDIO CO-PRODUCER AI (GEMINI CHATBOT) */}
          {activeTab === 'coproducer' && (
            <StudioCopilotTab
              selectedTrack={selectedTrack}
              chatMessages={chatMessages}
              chatInput={chatInput}
              setChatInput={setChatInput}
              onSendMessage={handleSendMessage}
              isChatLoading={isChatLoading}
              chatRole={chatRole}
              setChatRole={setChatRole}
              chatModel={chatModel}
              setChatModel={setChatModel}
              onOpenSectionGuide={handleOpenSectionGuide}
              isDarkMode={isDarkMode}
              studioTheme={studioTheme}
            />
          )}

          {/* TAB 8: SEARCH GROUNDING */}
          {activeTab === 'search' && (
            <SearchGroundingTab
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onSearchGrounding={handleSearchGrounding}
              isSearching={isSearching}
              searchResult={searchResult}
              onOpenSectionGuide={handleOpenSectionGuide}
              isDarkMode={isDarkMode}
            />
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
        isLoadingAudio={isLoadingAudio}
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

      {/* SPOTLIGHT STUDIO COMMAND PALETTE (Ctrl+K / Cmd+K) */}
      <StudioCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        tracks={tracks}
        selectedTrack={selectedTrack}
        onSelectTrack={(track) => {
          setSelectedTrack(track);
          showToast(`Switched track to: ${track.id} - ${track.title}`, 'info');
        }}
        onNavigateToTab={(tab) => {
          setActiveTab(tab as any);
          showToast(`Navigated to ${tab.replace('_', ' ').toUpperCase()}`, 'info');
        }}
        activeTab={activeTab}
        onToggleTheme={handleToggleTheme}
        onToggleFocusMode={handleToggleFocusMode}
        onOpenSectionGuide={(sec) => sec && handleOpenSectionGuide(sec as any)}
        onOpenCopilotDrawer={() => setIsCopilotDrawerOpen(true)}
        onOpenTailscaleModal={() => setIsTailscaleModalOpen(true)}
        isDarkMode={isDarkMode}
      />

      {/* SLIDE-OVER STUDIO COPILOT DRAWER (Ctrl+J / Cmd+J) */}
      <StudioCopilotDrawer
        isOpen={isCopilotDrawerOpen}
        onClose={() => setIsCopilotDrawerOpen(false)}
        selectedTrack={selectedTrack}
        chatMessages={chatMessages}
        chatInput={chatInput}
        setChatInput={setChatInput}
        onSendMessage={handleSendMessage}
        isChatLoading={isChatLoading}
        chatRole={chatRole}
        setChatRole={setChatRole}
        chatModel={chatModel}
        setChatModel={setChatModel}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSearchGrounding={handleSearchGrounding}
        isSearching={isSearching}
        searchResult={searchResult}
        isDarkMode={isDarkMode}
      />

      {/* 24-HOUR SELAH PRAYER GATE MODAL (NASHVILLE SOP RULE 1) */}
      <SelahPrayerGateModal
        isOpen={isSelahGateOpen}
        onClose={() => setIsSelahGateOpen(false)}
        track={selectedTrack}
        onReleaseGateApproved={(trackId, notes) => {
          handleTrackUpdate('selahPrayed', true);
          setIsSelahGateOpen(false);
          showToast(`Selah Prayer Gate Unlocked for ${selectedTrack.title}!`, 'success');
        }}
        isDarkMode={isDarkMode}
      />

      {/* UNIVERSAL STUDIO THEME SHOWCASE & CUSTOMIZER MODAL */}
      <StudioThemeModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentTheme={studioTheme}
        onSelectTheme={handleSelectTheme}
      />

      {/* TAILSCALE MESH VPN MODAL */}
      <TailscaleVpnModal
        isOpen={isTailscaleModalOpen}
        onClose={() => setIsTailscaleModalOpen(false)}
        isDarkMode={isDarkMode}
      />

    </div>
  );
}
