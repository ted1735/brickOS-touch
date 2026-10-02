import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Music,
  FileText,
  Sliders,
  Activity,
  Layers,
  HardDrive,
  Film,
  Video,
  Sparkles,
  Command,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  Sun,
  Moon,
  Layers3,
  SlidersHorizontal,
  PanelsTopLeft,
  Maximize2,
  Grid,
  Columns,
  MessageSquare
} from 'lucide-react';
import { Track, StudioTheme } from '../types';
import { ALL_STUDIO_NAV_ITEMS } from '../data/studioNavigationData';

interface StudioCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  selectedTrack: Track;
  onSelectTrack: (track: Track) => void;
  activeTab: string;
  onNavigateToTab: (tab: string) => void;
  onToggleTheme: () => void;
  isDarkMode: boolean;
  studioTheme?: StudioTheme;
  onSelectTheme?: (theme: StudioTheme) => void;
  onToggleFocusMode?: () => void;
  onOpenCopilotDrawer?: () => void;
  onOpenSectionGuide?: (sectionId: string) => void;
}

interface PaletteAction {
  id: string;
  title: string;
  category: 'Tracks' | 'Studio Navigation' | 'SOP & Quick Actions';
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badge?: string;
  onSelect: () => void;
}

export const StudioCommandPalette: React.FC<StudioCommandPaletteProps> = ({
  isOpen,
  onClose,
  tracks,
  selectedTrack,
  onSelectTrack,
  activeTab,
  onNavigateToTab,
  onToggleTheme,
  isDarkMode,
  studioTheme = 'moon',
  onSelectTheme,
  onToggleFocusMode,
  onOpenCopilotDrawer,
  onOpenSectionGuide
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Construct actions list
  const actions: PaletteAction[] = [];

  // 1. Studio Navigation Items
  ALL_STUDIO_NAV_ITEMS.forEach(nav => {
    actions.push({
      id: `nav-${nav.id}`,
      title: nav.name,
      category: 'Studio Navigation',
      subtitle: nav.description,
      icon: nav.icon,
      accentColor: nav.accentColor,
      badge: nav.shortcut || nav.badge,
      onSelect: () => {
        onNavigateToTab(nav.id);
        onClose();
      }
    });
  });

  // 2. Track Quick Jump
  tracks.forEach(track => {
    actions.push({
      id: `track-${track.id}`,
      title: `${track.id} — ${track.title}`,
      category: 'Tracks',
      subtitle: `${track.epCollection} • Key: ${track.key} (${track.camelotKey}) • ${track.bpm} BPM • Status: ${track.status}`,
      icon: Music,
      accentColor: 'text-indigo-400',
      badge: track.camelotKey,
      onSelect: () => {
        onSelectTrack(track);
        onClose();
      }
    });
  });

  // 3. Quick Actions
  actions.push(
    {
      id: 'action-copilot',
      title: 'Open Studio Copilot Drawer (AI Assistant)',
      category: 'SOP & Quick Actions',
      subtitle: 'Slide over Gemini Copilot, Google Grounding, & Telemetry without leaving page',
      icon: MessageSquare,
      accentColor: 'text-teal-400',
      badge: 'Ctrl+J',
      onSelect: () => {
        if (onOpenCopilotDrawer) onOpenCopilotDrawer();
        onClose();
      }
    },
    {
      id: 'action-zen',
      title: 'Toggle Focus Mode',
      category: 'SOP & Quick Actions',
      subtitle: 'Hide secondary navigation and utility controls; press Z again to exit',
      icon: Maximize2,
      accentColor: 'text-purple-400',
      badge: 'Z',
      onSelect: () => {
        if (onToggleFocusMode) onToggleFocusMode();
        onClose();
      }
    },
    {
      id: 'action-theme-sun',
      title: 'Theme: Sun (Daylight Nashville Mode)',
      category: 'SOP & Quick Actions',
      subtitle: 'Crisp, high-contrast light theme engineered for daytime writing and chord review',
      icon: Sun,
      accentColor: 'text-amber-400',
      badge: studioTheme === 'sun' ? 'ACTIVE' : undefined,
      onSelect: () => {
        if (onSelectTheme) onSelectTheme('sun');
        else onToggleTheme();
        onClose();
      }
    },
    {
      id: 'action-theme-moon',
      title: 'Theme: Moon (Pro-DAW Dark Studio Mode)',
      category: 'SOP & Quick Actions',
      subtitle: 'Obsidian jet-black studio aesthetic with high-contrast neon VU meters',
      icon: Moon,
      accentColor: 'text-indigo-400',
      badge: studioTheme === 'moon' ? 'ACTIVE' : undefined,
      onSelect: () => {
        if (onSelectTheme) onSelectTheme('moon');
        else onToggleTheme();
        onClose();
      }
    },
    {
      id: 'action-theme-stars',
      title: 'Theme: Stars (Soft Twilight Muted Mode)',
      category: 'SOP & Quick Actions',
      subtitle: 'Soft-contrast muted midnight palette for marathon late-night mixing with zero ocular fatigue',
      icon: Sparkles,
      accentColor: 'text-purple-300',
      badge: studioTheme === 'stars' ? 'ACTIVE' : undefined,
      onSelect: () => {
        if (onSelectTheme) onSelectTheme('stars');
        else onToggleTheme();
        onClose();
      }
    },
    {
      id: 'action-theme-graphite', title: 'Theme: Graphite Studio', category: 'SOP & Quick Actions',
      subtitle: 'Neutral charcoal surfaces with restrained cool blue accents', icon: Layers3,
      accentColor: 'text-sky-400', badge: studioTheme === 'graphite' ? 'ACTIVE' : undefined,
      onSelect: () => { onSelectTheme?.('graphite'); onClose(); }
    },
    {
      id: 'action-theme-console', title: 'Theme: Warm Console', category: 'SOP & Quick Actions',
      subtitle: 'Warm, hardware-inspired surfaces with muted brass accents', icon: SlidersHorizontal,
      accentColor: 'text-amber-400', badge: studioTheme === 'console' ? 'ACTIVE' : undefined,
      onSelect: () => { onSelectTheme?.('console'); onClose(); }
    },
    {
      id: 'action-theme-clean', title: 'Theme: Clean Studio', category: 'SOP & Quick Actions',
      subtitle: 'Warm neutral light surfaces with crisp slate typography', icon: PanelsTopLeft,
      accentColor: 'text-blue-400', badge: studioTheme === 'clean' ? 'ACTIVE' : undefined,
      onSelect: () => { onSelectTheme?.('clean'); onClose(); }
    },
    {
      id: 'action-theme-cycle',
      title: 'Cycle Studio Theme',
      category: 'SOP & Quick Actions',
      subtitle: `Current theme: ${studioTheme.toUpperCase()} • Press Shift+T to cycle`,
      icon: studioTheme === 'sun' ? Sun : studioTheme === 'stars' ? Sparkles : Moon,
      accentColor: 'text-amber-400',
      badge: 'Shift+T',
      onSelect: () => {
        onToggleTheme();
        onClose();
      }
    },
    {
      id: 'action-whiteboard',
      title: 'Open BlockSuite Infinite Whiteboard',
      category: 'SOP & Quick Actions',
      subtitle: '2D infinite canvas for song sections, chords, and storyboards',
      icon: Grid,
      accentColor: 'text-indigo-400',
      badge: 'Alt+B',
      onSelect: () => {
        onNavigateToTab('brainstorming');
        onClose();
      }
    },
    {
      id: 'action-sop-lyric',
      title: 'Nashville SOP Rule 2: Throne Room Pivot Audit',
      category: 'SOP & Quick Actions',
      subtitle: 'Inspect cliché filter rules and theological audit criteria',
      icon: CheckCircle,
      accentColor: 'text-rose-400',
      onSelect: () => {
        if (onOpenSectionGuide) onOpenSectionGuide('lyrics');
        onClose();
      }
    },
    {
      id: 'action-sop-mastering',
      title: 'Nashville SOP Rule 6: -12.0 LUFS Integrated Loudness',
      category: 'SOP & Quick Actions',
      subtitle: 'Enforce -1.0 dBTP ceiling and mono-collapse phone correlation',
      icon: Activity,
      accentColor: 'text-emerald-400',
      onSelect: () => {
        onNavigateToTab('mastering');
        onClose();
      }
    }
  );

  // Filter actions based on search query
  const filteredActions = actions.filter(action => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      action.title.toLowerCase().includes(q) ||
      (action.subtitle && action.subtitle.toLowerCase().includes(q)) ||
      action.category.toLowerCase().includes(q)
    );
  });

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filteredActions.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredActions.length) % (filteredActions.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredActions[selectedIndex]) {
        filteredActions[selectedIndex].onSelect();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const items = listRef.current.querySelectorAll('[data-palette-item]');
      const activeEl = items[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 px-4 bg-black/75 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-950/80 gap-3">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, track name, tool, or SOP action (e.g. 'Restoration', 'Mixer', 'LUFS')..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none font-sans"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800/80 border border-slate-700 rounded-md">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="overflow-y-auto p-2 space-y-1 flex-1 custom-scrollbar">
          {filteredActions.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No matching commands or tracks found for "{query}".
            </div>
          ) : (
            filteredActions.map((action, idx) => {
              const isSelected = idx === selectedIndex;
              const IconComp = action.icon;
              return (
                <div
                  key={action.id}
                  data-palette-item
                  onClick={action.onSelect}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition ${
                    isSelected
                      ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                      : 'hover:bg-slate-800/50 border border-transparent text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className={`p-2 rounded-lg ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">{action.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {action.category}
                        </span>
                      </div>
                      {action.subtitle && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{action.subtitle}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {action.badge && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800/90 text-indigo-300 font-mono font-bold border border-slate-700/60">
                        {action.badge}
                      </span>
                    )}
                    {isSelected && <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-4 py-2 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <div className="flex items-center gap-2 text-indigo-400 font-bold">
            <Command className="w-3 h-3" />
            <span>brickOS Unified Command Hub</span>
          </div>
        </div>
      </div>
    </div>
  );
};
