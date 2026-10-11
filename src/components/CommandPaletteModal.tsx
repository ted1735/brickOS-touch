import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Music,
  Layers,
  HardDrive,
  Scissors,
  Activity,
  Sliders,
  Sparkles,
  Command,
  ArrowRight,
  Zap,
  Play,
  RotateCcw,
  X,
  Clock,
  Compass,
  Check
} from 'lucide-react';
import { Track } from '../types';

export interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  selectedTrack: Track;
  onSelectTrack: (track: Track) => void;
  onNavigateToTab: (tab: any) => void;
  onTriggerQuickSync?: () => void;
  onToggleMiniTransportPlay?: () => void;
  isPlaying?: boolean;
  isDarkMode?: boolean;
}

interface CommandItem {
  id: string;
  category: 'Tracks' | 'Production Stages' | 'Quick Actions';
  title: string;
  subtitle?: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  tracks,
  selectedTrack,
  onSelectTrack,
  onNavigateToTab,
  onTriggerQuickSync,
  onToggleMiniTransportPlay,
  isPlaying = false,
  isDarkMode = true
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const items = useMemo<CommandItem[]>(() => {
    const list: CommandItem[] = [];

    // 1. Quick Actions
    list.push({
      id: 'action-transport',
      category: 'Quick Actions',
      title: isPlaying ? 'Pause Audio Playback' : `Play Lossless Audio Stream (${selectedTrack.title})`,
      subtitle: 'Spacebar or mini-transport',
      badge: isPlaying ? 'Playing' : 'Ready',
      icon: Play,
      action: () => {
        onToggleMiniTransportPlay?.();
        onClose();
      }
    });

    if (onTriggerQuickSync) {
      list.push({
        id: 'action-sync-webdav',
        category: 'Quick Actions',
        title: 'Sync Nextcloud WebDAV (/Music-Production)',
        subtitle: 'Folder 207332 live asset refresh',
        badge: 'WebDAV',
        icon: Zap,
        action: () => {
          onTriggerQuickSync();
          onClose();
        }
      });
    }

    // 2. Production Stages
    const stages: Array<{ id: string; name: string; subtitle: string; icon: any }> = [
      { id: 'home', name: 'Studio Home Hub', subtitle: 'Label overview, quick jump, and system health', icon: Layers },
      { id: 'kanban', name: 'Master Kanban Pipeline', subtitle: '4 EPs, 26 tracks, lifecycle progression', icon: Compass },
      { id: 'lyrics', name: 'Lyrics & Suno v5.5 Engine', subtitle: '4-block multi-model compilation and editing', icon: Sparkles },
      { id: 'mixer', name: 'Mini-DAW 4-Track Mixer', subtitle: '24-bit/48kHz stem balance & EQ/compression', icon: Scissors },
      { id: 'nextcloud_sync', name: 'Nextcloud WebDAV & Folder 207332', subtitle: 'Live UVR5 stems and cloud asset linking', icon: HardDrive },
      { id: 'mastering', name: 'Senior Mastering & A/B Bus', subtitle: '-12 LUFS calibration & True-Peak limiter', icon: Activity },
      { id: 'database', name: 'Relational Database & Matrix', subtitle: 'Camelot keys, harmonic pairings & metadata', icon: Sliders },
      { id: 'youtube', name: 'YouTube SEO & Distribution', subtitle: 'Title formulations, tags, and anti-woodworking filter', icon: Zap }
    ];

    stages.forEach(s => {
      list.push({
        id: `stage-${s.id}`,
        category: 'Production Stages',
        title: s.name,
        subtitle: s.subtitle,
        badge: 'Stage',
        icon: s.icon,
        action: () => {
          onNavigateToTab(s.id);
          onClose();
        }
      });
    });

    // 3. Tracks
    tracks.forEach(trk => {
      const isCurrent = trk.id === selectedTrack.id;
      list.push({
        id: `track-${trk.id}`,
        category: 'Tracks',
        title: `${trk.id}: ${trk.title}`,
        subtitle: `${trk.genre} • ${trk.bpm} BPM • ${trk.key} • ${trk.ep.split(':')[0]}`,
        badge: isCurrent ? 'Active' : trk.status,
        icon: Music,
        action: () => {
          onSelectTrack(trk);
          onClose();
        }
      });
    });

    return list;
  }, [tracks, selectedTrack, isPlaying, onToggleMiniTransportPlay, onTriggerQuickSync, onNavigateToTab, onSelectTrack, onClose]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase().trim();
    return items.filter(it => 
      it.title.toLowerCase().includes(q) || 
      (it.subtitle && it.subtitle.toLowerCase().includes(q)) ||
      it.category.toLowerCase().includes(q)
    );
  }, [items, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard Navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-start justify-center p-3 sm:p-6 pt-16 sm:pt-24 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[80vh] ${
          isDarkMode 
            ? 'bg-slate-900 border-slate-700 text-white shadow-indigo-950/80 ring-1 ring-white/10' 
            : 'bg-white border-slate-300 text-slate-900 shadow-xl'
        }`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Top Search Input Box */}
        <div className={`flex items-center gap-3 px-4 py-3.5 border-b ${
          isDarkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
        }`}>
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to any of the 26 tracks, studio stage, or quick action... (e.g. TRK-04, Mixer, Sync)"
            className="w-full bg-transparent text-sm sm:text-base font-bold focus:outline-none placeholder-slate-500"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 border border-slate-700 text-slate-400">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-1 flex-1 custom-scrollbar">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Command className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
              <p className="text-sm font-bold text-slate-400">No matching tracks, stages, or actions</p>
              <p className="text-xs text-slate-500 font-mono">Try typing "Restoration", "Mixer", "TRK-10", or "WebDAV"</p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition text-xs ${
                    isSelected
                      ? isDarkMode
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-indigo-50 border border-indigo-200 text-indigo-950 font-semibold'
                      : isDarkMode
                      ? 'hover:bg-slate-800 text-slate-300'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : isDarkMode
                        ? 'bg-slate-800 text-indigo-400'
                        : 'bg-slate-100 text-indigo-600'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold truncate text-[13px]">{item.title}</div>
                      {item.subtitle && (
                        <div className={`text-[11px] truncate ${
                          isSelected ? 'text-white/80' : isDarkMode ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : isDarkMode
                          ? 'bg-slate-800 text-slate-400 border border-slate-700'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                    {isSelected && (
                      <ArrowRight className="w-3.5 h-3.5 text-white/90" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className={`px-4 py-2 border-t flex items-center justify-between text-[11px] ${
          isDarkMode ? 'border-slate-800 bg-slate-950/80 text-slate-500' : 'border-slate-200 bg-slate-50 text-slate-500'
        }`}>
          <div className="flex items-center gap-3">
            <span>Use <kbd className="px-1.5 py-0.5 rounded font-mono bg-slate-800 text-slate-300">↑</kbd> <kbd className="px-1.5 py-0.5 rounded font-mono bg-slate-800 text-slate-300">↓</kbd> to navigate</span>
            <span>•</span>
            <span><kbd className="px-1.5 py-0.5 rounded font-mono bg-slate-800 text-slate-300">ENTER</kbd> to select</span>
          </div>
          <span className="font-mono text-[10px]">brickOS Fast Navigation</span>
        </div>
      </div>
    </div>
  );
};
