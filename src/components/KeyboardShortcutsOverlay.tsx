import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  Keyboard,
  Layers,
  FileText,
  Database,
  HardDrive,
  Scissors,
  Activity,
  Music,
  Clapperboard,
  Film,
  Share2,
  Sparkles,
  Zap,
  Video,
  MessageSquare,
  Play,
  Pause,
  Sun,
  Moon,
  Plus,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Volume2,
  VolumeX,
  RotateCcw,
  SlidersHorizontal,
  Command
} from 'lucide-react';

export interface ShortcutDefinition {
  id: string;
  category: 'navigation' | 'audio' | 'projects' | 'system';
  categoryLabel: string;
  title: string;
  description: string;
  keys: string[];
  action: () => void;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badge?: string;
}

interface KeyboardShortcutsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
  onNavigateToTab: (tab: string) => void;
  onTogglePlayPauseAudio: () => void;
  isPlayingAudio: boolean;
  onToggleMuteAudio: () => void;
  isMutedAudio?: boolean;
  onResetAudioEngine: () => void;
  onPreviousTrack: () => void;
  onNextTrack: () => void;
  onOpenCreateProject: () => void;
  onOpenSunoBridge: () => void;
  onOpenSectionGuide: () => void;
  onToggleTheme: () => void;
  onToggleSideNav: () => void;
  currentTrackTitle?: string;
  activeTab?: string;
}

export const KeyboardShortcutsOverlay: React.FC<KeyboardShortcutsOverlayProps> = ({
  isOpen,
  onClose,
  isDarkMode = true,
  onNavigateToTab,
  onTogglePlayPauseAudio,
  isPlayingAudio,
  onToggleMuteAudio,
  isMutedAudio = false,
  onResetAudioEngine,
  onPreviousTrack,
  onNextTrack,
  onOpenCreateProject,
  onOpenSunoBridge,
  onOpenSectionGuide,
  onToggleTheme,
  onToggleSideNav,
  currentTrackTitle,
  activeTab
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'navigation' | 'audio' | 'projects' | 'system'>('all');
  const [activeKeyChord, setActiveKeyChord] = useState<string[]>([]);
  const [executedToast, setExecutedToast] = useState<string | null>(null);

  // Detect currently pressed keys for live feedback
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in the search bar itself
      if (document.activeElement?.tagName === 'INPUT') return;

      const keys: string[] = [];
      if (e.metaKey || e.ctrlKey) keys.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl');
      if (e.altKey) keys.push('Alt');
      if (e.shiftKey) keys.push('Shift');

      let keyName = e.key;
      if (keyName === ' ') keyName = 'Space';
      else if (keyName === 'Escape') keyName = 'Esc';
      else if (keyName.length === 1) keyName = keyName.toUpperCase();

      if (!['Control', 'Meta', 'Alt', 'Shift'].includes(e.key)) {
        keys.push(keyName);
      }

      setActiveKeyChord(keys);
    };

    const handleKeyUp = () => {
      setActiveKeyChord([]);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isOpen]);

  // Master catalog of all shortcuts
  const shortcuts: ShortcutDefinition[] = useMemo(
    () => [
      // Navigation: Tier 1
      {
        id: 'nav-kanban',
        category: 'navigation',
        categoryLabel: 'Workspace Navigation',
        title: 'Kanban Dashboard',
        description: 'Master pipeline across all 26 tracks, stages, and EP roadmaps',
        keys: ['Alt', '1'],
        action: () => onNavigateToTab('kanban'),
        icon: Layers,
        accentColor: 'text-indigo-400',
        badge: 'Tier 1'
      },
      {
        id: 'nav-lyrics',
        category: 'navigation',
        categoryLabel: 'Workspace Navigation',
        title: 'Lyrics & Suno 4-Block',
        description: 'Theological lyrics, Suno v5.5 generator, and sound presets',
        keys: ['Alt', '2'],
        action: () => onNavigateToTab('lyrics'),
        icon: FileText,
        accentColor: 'text-blue-400',
        badge: 'Tier 1'
      },
      {
        id: 'nav-database',
        category: 'navigation',
        categoryLabel: 'Workspace Navigation',
        title: 'Catalog Matrix & Harmonics',
        description: 'Camelot key locks, BPM matching, and similarity scores',
        keys: ['Alt', '3'],
        action: () => onNavigateToTab('database'),
        icon: Database,
        accentColor: 'text-cyan-400',
        badge: 'Tier 1'
      },
      {
        id: 'nav-nextcloud',
        category: 'navigation',
        categoryLabel: 'Workspace Navigation',
        title: 'Nextcloud WebDAV (207332)',
        description: 'Stem matcher and cloud storage synchronization bridge',
        keys: ['Alt', '4'],
        action: () => onNavigateToTab('nextcloud_sync'),
        icon: HardDrive,
        accentColor: 'text-emerald-400',
        badge: 'Tier 1'
      },
      {
        id: 'nav-mixer',
        category: 'navigation',
        categoryLabel: 'Workspace Navigation',
        title: '4-Track Mini-DAW',
        description: 'Stem faders, stereo pan, and Recharts frequency spectrum',
        keys: ['Alt', '5'],
        action: () => onNavigateToTab('mixer'),
        icon: Scissors,
        accentColor: 'text-amber-400',
        badge: 'Tier 1'
      },
      {
        id: 'nav-mastering',
        category: 'navigation',
        categoryLabel: 'Workspace Navigation',
        title: 'Mastering Engineer & A/B',
        description: '-12.0 LUFS integrated loudness targeting & high-pass filtering',
        keys: ['Alt', '6'],
        action: () => onNavigateToTab('mastering'),
        icon: Activity,
        accentColor: 'text-emerald-400',
        badge: 'Tier 1'
      },
      {
        id: 'nav-ministry',
        category: 'navigation',
        categoryLabel: 'Workspace Navigation',
        title: 'Live Ministry Charts',
        description: 'Worship transposition, Nashville Number System, and Selah prayer',
        keys: ['Alt', '7'],
        action: () => onNavigateToTab('ministry'),
        icon: Music,
        accentColor: 'text-cyan-400',
        badge: 'Tier 1'
      },

      // Navigation: Tier 2
      {
        id: 'nav-veo',
        category: 'navigation',
        categoryLabel: 'Workspace Navigation',
        title: 'Visuals & Veo 3 Video',
        description: 'Cinematic video generation and AI theological cover art',
        keys: ['Alt', '8'],
        action: () => onNavigateToTab('veo_visuals'),
        icon: Clapperboard,
        accentColor: 'text-amber-400',
        badge: 'Tier 2'
      },
      {
        id: 'nav-youtube',
        category: 'navigation',
        categoryLabel: 'Workspace Navigation',
        title: 'YouTube SEO Lens',
        description: 'Metadata optimization, high-CTR titles, and search tags',
        keys: ['Alt', '9'],
        action: () => onNavigateToTab('youtube'),
        icon: Film,
        accentColor: 'text-rose-500',
        badge: 'Tier 2'
      },
      {
        id: 'nav-omnipost',
        category: 'navigation',
        categoryLabel: 'Workspace Navigation',
        title: 'OmniPost Social',
        description: 'Multi-platform social distribution scheduler and hook copy',
        keys: ['Alt', '0'],
        action: () => onNavigateToTab('omnipost'),
        icon: Share2,
        accentColor: 'text-purple-400',
        badge: 'Tier 2'
      },
      {
        id: 'nav-prompts',
        category: 'navigation',
        categoryLabel: 'Workspace Navigation',
        title: 'Universal Prompt Library',
        description: '4-Phase storyboards across image, video, and audio prompts',
        keys: ['Alt', 'P'],
        action: () => onNavigateToTab('prompt_library'),
        icon: Sparkles,
        accentColor: 'text-amber-400',
        badge: 'Tier 2'
      },
      {
        id: 'nav-nightcafe',
        category: 'navigation',
        categoryLabel: 'Workspace Navigation',
        title: 'NightCafe Studio Queue',
        description: 'Batch artwork queue and prompt template clipboard buffer',
        keys: ['Alt', 'N'],
        action: () => onNavigateToTab('nightcafe'),
        icon: Zap,
        accentColor: 'text-blue-400',
        badge: 'Tier 2'
      },
      {
        id: 'nav-videoexpress',
        category: 'navigation',
        categoryLabel: 'Workspace Navigation',
        title: 'VideoExpress Talking Avatar',
        description: 'Consistent character talking avatar copilot (<100 Chars rule)',
        keys: ['Alt', 'V'],
        action: () => onNavigateToTab('video_express'),
        icon: Video,
        accentColor: 'text-rose-400',
        badge: 'Tier 2'
      },
      {
        id: 'nav-telemetry',
        category: 'navigation',
        categoryLabel: 'Workspace Navigation',
        title: '1h Studio Telemetry',
        description: 'Live performance metrics, stem throughput, and buffer latency',
        keys: ['Alt', 'T'],
        action: () => onNavigateToTab('telemetry'),
        icon: Sparkles,
        accentColor: 'text-purple-400',
        badge: 'Tier 2'
      },
      {
        id: 'nav-coproducer',
        category: 'navigation',
        categoryLabel: 'Workspace Navigation',
        title: 'Studio Co-Producer AI',
        description: 'Interactive Gemini assistant for lyrical and production advice',
        keys: ['Alt', 'C'],
        action: () => onNavigateToTab('coproducer'),
        icon: MessageSquare,
        accentColor: 'text-teal-400',
        badge: 'Tier 2'
      },
      {
        id: 'nav-search',
        category: 'navigation',
        categoryLabel: 'Workspace Navigation',
        title: 'Google Search Grounding',
        description: 'Web grounding engine for gospel themes and citations',
        keys: ['Alt', 'S'],
        action: () => onNavigateToTab('search'),
        icon: Search,
        accentColor: 'text-cyan-400',
        badge: 'Tier 2'
      },

      // Audio Engine & Playback Controls
      {
        id: 'audio-playpause',
        category: 'audio',
        categoryLabel: 'Audio & DAW Playback',
        title: isPlayingAudio ? 'Pause Audio Preview' : 'Start Audio Preview',
        description: 'Trigger 4-track Web Audio API stem synthesis or master audio playback',
        keys: ['Space'],
        action: onTogglePlayPauseAudio,
        icon: isPlayingAudio ? Pause : Play,
        accentColor: isPlayingAudio ? 'text-amber-400' : 'text-emerald-400',
        badge: isPlayingAudio ? 'Playing' : 'Stopped'
      },
      {
        id: 'audio-mute',
        category: 'audio',
        categoryLabel: 'Audio & DAW Playback',
        title: isMutedAudio ? 'Unmute Master Output' : 'Mute Master Output',
        description: 'Instant master output mute toggle across all synth buses',
        keys: ['M'],
        action: onToggleMuteAudio,
        icon: isMutedAudio ? VolumeX : Volume2,
        accentColor: isMutedAudio ? 'text-rose-400' : 'text-indigo-400',
        badge: isMutedAudio ? 'Muted' : 'Unmuted'
      },
      {
        id: 'audio-reset',
        category: 'audio',
        categoryLabel: 'Audio & DAW Playback',
        title: 'Reset Audio Synthesizers',
        description: 'Stop all oscillators, re-initialize Web Audio context, and clear buffers',
        keys: ['R'],
        action: onResetAudioEngine,
        icon: RotateCcw,
        accentColor: 'text-amber-400'
      },

      // Projects & Catalog
      {
        id: 'proj-prev',
        category: 'projects',
        categoryLabel: 'Project & Track Management',
        title: 'Previous Track in Catalog',
        description: 'Step backward through the 26 canonical tracks in the active EP',
        keys: ['['],
        action: onPreviousTrack,
        icon: ChevronLeft,
        accentColor: 'text-indigo-400'
      },
      {
        id: 'proj-next',
        category: 'projects',
        categoryLabel: 'Project & Track Management',
        title: 'Next Track in Catalog',
        description: 'Step forward through the 26 canonical tracks in the active EP',
        keys: [']'],
        action: onNextTrack,
        icon: ChevronRight,
        accentColor: 'text-indigo-400'
      },
      {
        id: 'proj-new',
        category: 'projects',
        categoryLabel: 'Project & Track Management',
        title: 'Create New Project Track',
        description: 'Open the Standard Schema v1.0 track creator with storyboard generation',
        keys: ['Alt', 'Shift', 'N'],
        action: onOpenCreateProject,
        icon: Plus,
        accentColor: 'text-emerald-400',
        badge: 'Schema v1.0'
      },
      {
        id: 'proj-suno',
        category: 'projects',
        categoryLabel: 'Project & Track Management',
        title: '1-Click Suno & NightCafe Bridge',
        description: 'Quick-copy formatted Suno v5.5 tags and batch visual prompts',
        keys: ['Alt', 'Z'],
        action: onOpenSunoBridge,
        icon: Zap,
        accentColor: 'text-amber-400',
        badge: 'Bridge'
      },

      // Interface & Global Toggles
      {
        id: 'sys-cheatsheet',
        category: 'system',
        categoryLabel: 'Interface & Workflow Toggles',
        title: 'Keyboard Shortcuts Cheat Sheet',
        description: 'Open or close this interactive keymap reference overlay',
        keys: ['?'],
        action: onClose,
        icon: Keyboard,
        accentColor: 'text-purple-400',
        badge: 'Overlay'
      },
      {
        id: 'sys-guide',
        category: 'system',
        categoryLabel: 'Interface & Workflow Toggles',
        title: 'Section Guide & Nashville SOP',
        description: 'Open context-aware instructional guide for the active workspace tab',
        keys: ['F1'],
        action: onOpenSectionGuide,
        icon: HelpCircle,
        accentColor: 'text-amber-400',
        badge: 'SOP Rules'
      },
      {
        id: 'sys-theme',
        category: 'system',
        categoryLabel: 'Interface & Workflow Toggles',
        title: 'Cycle Studio Theme',
        description: 'Cycle through Daylight, Obsidian, Twilight, Graphite, Warm Console, and Clean Studio palettes',
        keys: ['Shift', 'T'],
        action: onToggleTheme,
        icon: isDarkMode ? Sun : Moon,
        accentColor: isDarkMode ? 'text-amber-400' : 'text-indigo-400'
      },
      {
        id: 'sys-sidebar',
        category: 'system',
        categoryLabel: 'Interface & Workflow Toggles',
        title: 'Toggle Studio Side Navigation',
        description: 'Expand or collapse the Projects, Sessions, and Assets sidebar drawer',
        keys: ['Alt', 'B'],
        action: onToggleSideNav,
        icon: SlidersHorizontal,
        accentColor: 'text-indigo-400'
      },
      {
        id: 'sys-collapse-empty',
        category: 'system',
        categoryLabel: 'Interface & Workflow Toggles',
        title: 'Toggle Collapse Empty Kanban Columns',
        description: 'Collapse or expand all 0-track empty columns in the release pipeline',
        keys: ['Alt', 'E'],
        action: () => {
          onNavigateToTab('kanban');
          window.dispatchEvent(new CustomEvent('brickos:toggle-collapse-empty'));
        },
        icon: SlidersHorizontal,
        accentColor: 'text-amber-400',
        badge: 'Kanban'
      },
      {
        id: 'sys-collapse-contents',
        category: 'system',
        categoryLabel: 'Interface & Workflow Toggles',
        title: 'Toggle Collapse Columns With Contents',
        description: 'Collapse or expand columns with active master tracks',
        keys: ['Alt', 'W'],
        action: () => {
          onNavigateToTab('kanban');
          window.dispatchEvent(new CustomEvent('brickos:toggle-collapse-contents'));
        },
        icon: Layers,
        accentColor: 'text-indigo-400',
        badge: 'Kanban'
      },
      {
        id: 'sys-collapse-all',
        category: 'system',
        categoryLabel: 'Interface & Workflow Toggles',
        title: 'Toggle Collapse All Kanban Columns',
        description: 'Collapse all 7 pipeline stage boards down into compact status bars',
        keys: ['Alt', 'A'],
        action: () => {
          onNavigateToTab('kanban');
          window.dispatchEvent(new CustomEvent('brickos:toggle-collapse-all'));
        },
        icon: Layers,
        accentColor: 'text-purple-400',
        badge: 'Kanban'
      },
      {
        id: 'sys-escape',
        category: 'system',
        categoryLabel: 'Interface & Workflow Toggles',
        title: 'Close Active Modal / Overlay',
        description: 'Dismiss cheat sheet, dialogs, drawers, or floating tooltips',
        keys: ['Esc'],
        action: onClose,
        icon: X,
        accentColor: 'text-rose-400'
      }
    ],
    [
      onNavigateToTab,
      onTogglePlayPauseAudio,
      isPlayingAudio,
      onToggleMuteAudio,
      isMutedAudio,
      onResetAudioEngine,
      onPreviousTrack,
      onNextTrack,
      onOpenCreateProject,
      onOpenSunoBridge,
      onOpenSectionGuide,
      onToggleTheme,
      onToggleSideNav,
      onClose,
      isDarkMode
    ]
  );

  // Filtered shortcuts based on search query and category
  const filteredShortcuts = useMemo(() => {
    return shortcuts.filter((sc) => {
      const matchesCategory = selectedCategory === 'all' || sc.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const inTitle = sc.title.toLowerCase().includes(q);
      const inDesc = sc.description.toLowerCase().includes(q);
      const inCat = sc.categoryLabel.toLowerCase().includes(q);
      const inKeys = sc.keys.some((k) => k.toLowerCase().includes(q));

      return inTitle || inDesc || inCat || inKeys;
    });
  }, [shortcuts, selectedCategory, searchQuery]);

  // Handle clicking a shortcut row to execute it directly
  const handleExecuteShortcut = (shortcut: ShortcutDefinition) => {
    shortcut.action();
    setExecutedToast(`Executed: ${shortcut.title}`);
    setTimeout(() => {
      setExecutedToast(null);
      onClose();
    }, 450);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* BACKDROP BLUR */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-200 animate-in fade-in"
        onClick={onClose}
      />

      {/* MODAL CARD */}
      <div
        className={`relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all duration-200 animate-in zoom-in-95 ${
          isDarkMode
            ? 'bg-slate-900 border-slate-700/80 text-white shadow-indigo-950/80 ring-1 ring-white/10'
            : 'bg-white border-slate-300 text-slate-900 shadow-2xl ring-1 ring-slate-900/10'
        }`}
      >
        {/* HEADER BAR */}
        <div
          className={`p-4 sm:p-6 border-b flex items-start justify-between gap-4 flex-shrink-0 ${
            isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/80 border-slate-200'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 flex items-center justify-center text-white shadow-md">
                <Keyboard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-wide flex items-center gap-2">
                  <span>Workspace Keyboard Shortcuts</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                    Interactive Overlay
                  </span>
                </h3>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Press any shortcut on your physical keyboard, or click any control row below to trigger it instantly.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Keypress Tester Badge */}
            {activeKeyChord.length > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold animate-pulse">
                <span className="text-[10px] text-amber-400/80 uppercase">Key:</span>
                {activeKeyChord.map((k, idx) => (
                  <kbd
                    key={idx}
                    className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-white shadow-xs text-[11px]"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            )}

            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition cursor-pointer border ${
                isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-slate-300'
              }`}
              title="Close Cheat Sheet (Esc)"
              aria-label="Close Cheat Sheet"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SEARCH AND CATEGORY FILTER TOOLBAR */}
        <div
          className={`px-4 sm:px-6 py-3 border-b flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0 ${
            isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search
              className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shortcuts or actions (e.g. daw, stem, theme)..."
              autoFocus
              className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                isDarkMode
                  ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Interactive Category Segmented Tabs */}
          <div
            className={`flex items-center gap-1 p-1 rounded-xl border text-xs font-bold overflow-x-auto w-full sm:w-auto custom-scrollbar ${
              isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}
          >
            {[
              { id: 'all', label: 'All Controls' },
              { id: 'navigation', label: 'Workspaces' },
              { id: 'audio', label: 'Audio Engine' },
              { id: 'projects', label: 'Projects' },
              { id: 'system', label: 'Interface' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`px-2.5 py-1.2 rounded-lg transition whitespace-nowrap cursor-pointer text-[11px] ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : isDarkMode
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* EXECUTION FEEDBACK TOAST */}
        {executedToast && (
          <div className="mx-4 sm:mx-6 mt-3 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-between shadow-lg animate-in slide-in-from-top">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{executedToast}</span>
            </span>
            <span className="text-[10px] font-mono opacity-80">Switching...</span>
          </div>
        )}

        {/* SHORTCUTS LIST GRID */}
        <div
          className={`flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-2.5 ${
            isDarkMode ? 'bg-slate-950/40' : 'bg-slate-50/50'
          }`}
        >
          {filteredShortcuts.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Keyboard className="w-10 h-10 text-slate-500 mx-auto opacity-40" />
              <p className="text-sm font-bold text-slate-400">No matching shortcuts found</p>
              <p className="text-xs text-slate-500">
                Try searching for a different keyword like "mixer", "lyrics", "play", or "theme".
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {filteredShortcuts.map((sc) => {
                const Icon = sc.icon;
                const isNavMatch = sc.category === 'navigation' && activeTab === sc.id.replace('nav-', '');

                return (
                  <div
                    key={sc.id}
                    onClick={() => handleExecuteShortcut(sc)}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all duration-150 cursor-pointer group hover:scale-[1.01] ${
                      isNavMatch
                        ? isDarkMode
                          ? 'bg-indigo-950/50 border-indigo-500/60 shadow-md shadow-indigo-950/50 ring-1 ring-indigo-500/30'
                          : 'bg-indigo-50 border-indigo-300 shadow-sm'
                        : isDarkMode
                        ? 'bg-slate-900/90 hover:bg-slate-850 border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white'
                        : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800 shadow-2xs'
                    }`}
                    title={`Click to execute: ${sc.title}`}
                  >
                    {/* Left: Icon, Title & Description */}
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-150 group-hover:scale-110 ${
                          isNavMatch
                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                            : isDarkMode
                            ? 'bg-slate-800 border-slate-700/80 text-slate-300 group-hover:text-white'
                            : 'bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isNavMatch ? 'text-white' : sc.accentColor}`} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold tracking-tight truncate group-hover:text-indigo-400 transition-colors">
                            {sc.title}
                          </span>
                          {sc.badge && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                              {sc.badge}
                            </span>
                          )}
                          {isNavMatch && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                              Active
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-[11px] leading-tight line-clamp-1 mt-0.5 ${
                            isDarkMode ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          {sc.description}
                        </p>
                      </div>
                    </div>

                    {/* Right: Tactile Keycaps */}
                    <div className="flex items-center gap-1 shrink-0">
                      {sc.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className={`px-2 py-1 rounded-lg text-xs font-mono font-bold border-b-2 shadow-xs transition-all group-hover:border-indigo-500 ${
                            isDarkMode
                              ? 'bg-slate-800 border-slate-700 text-slate-100 shadow-slate-950/80'
                              : 'bg-slate-100 border-slate-300 text-slate-800 shadow-slate-400/30'
                          }`}
                        >
                          {k}
                        </kbd>
                      ))}
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1 hidden sm:inline" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER BAR: QUICK TIP & CLOSE BUTTON */}
        <div
          className={`p-3.5 sm:p-4 border-t flex items-center justify-between gap-3 text-xs flex-shrink-0 ${
            isDarkMode ? 'bg-slate-950/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[11px]">
              Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-white font-bold text-[10px]">?</kbd> anywhere in the studio to toggle this cheat sheet.
            </span>
            {currentTrackTitle && (
              <>
                <span>•</span>
                <span className="text-indigo-400 font-semibold truncate max-w-[200px]">
                  Track: {currentTrackTitle}
                </span>
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer shadow-md shadow-indigo-950/40"
          >
            Done (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
