import React from 'react';
import {
  Sparkles,
  Scissors,
  Activity,
  HardDrive,
  Copy,
  Layers,
  ArrowRight,
  Zap,
  Music,
  Check,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Compass
} from 'lucide-react';
import { Track } from '../types';

export interface SmartContextActionBarProps {
  activeTab: string;
  selectedTrack: Track;
  onNavigateToTab: (tab: any) => void;
  onQuickAction?: (actionId: string) => void;
  isDarkMode?: boolean;
}

export const SmartContextActionBar: React.FC<SmartContextActionBarProps> = ({
  activeTab,
  selectedTrack,
  onNavigateToTab,
  onQuickAction,
  isDarkMode = true
}) => {
  if (activeTab === 'home') return null;

  // Define smart dynamic contextual actions tailored to the active production stage
  let stageLabel = 'Active Stage';
  let primaryAction: { label: string; icon: any; action: () => void; color: string } | null = null;
  let secondaryShortcuts: Array<{ label: string; tabTarget: string; icon: any }> = [];

  switch (activeTab) {
    case 'lyrics':
      stageLabel = 'Stage 2: Lyrics & Suno v5.5 Engine';
      primaryAction = {
        label: 'Copy 4-Block Suno Prompt',
        icon: Copy,
        action: () => onQuickAction?.('copy_suno'),
        color: 'from-amber-600 to-indigo-600'
      };
      secondaryShortcuts = [
        { label: 'Version Matrix', tabTarget: 'version-matrix', icon: Layers },
        { label: 'Mixer Stems', tabTarget: 'mixer', icon: Scissors },
        { label: 'WebDAV Files', tabTarget: 'nextcloud_sync', icon: HardDrive }
      ];
      break;

    case 'mixer':
      stageLabel = 'Stage 3: 4-Track Waveform Mixer & Trimmer';
      primaryAction = {
        label: 'Load Nextcloud 4-Stems',
        icon: HardDrive,
        action: () => onQuickAction?.('load_stems'),
        color: 'from-cyan-600 to-indigo-600'
      };
      secondaryShortcuts = [
        { label: 'Mastering Rack', tabTarget: 'mastering', icon: Activity },
        { label: 'Suno Prompts', tabTarget: 'lyrics', icon: Sparkles },
        { label: 'WebDAV Folder', tabTarget: 'nextcloud_sync', icon: HardDrive }
      ];
      break;

    case 'mastering':
      stageLabel = 'Stage 4: Senior Mastering & A/B Bus';
      primaryAction = {
        label: 'Calibrate -12 LUFS Target',
        icon: Activity,
        action: () => onQuickAction?.('measure_lufs'),
        color: 'from-purple-600 to-indigo-600'
      };
      secondaryShortcuts = [
        { label: 'Mixer Faders', tabTarget: 'mixer', icon: Scissors },
        { label: 'YouTube SEO', tabTarget: 'youtube', icon: Zap },
        { label: 'WebDAV Export', tabTarget: 'nextcloud_sync', icon: HardDrive }
      ];
      break;

    case 'nextcloud_sync':
      stageLabel = 'Asset Hub: Nextcloud WebDAV /Music-Production';
      primaryAction = {
        label: '⚡ Refresh Folder 207332',
        icon: Zap,
        action: () => onQuickAction?.('sync_folder'),
        color: 'from-emerald-600 to-cyan-600'
      };
      secondaryShortcuts = [
        { label: 'Mini-DAW Mixer', tabTarget: 'mixer', icon: Scissors },
        { label: 'Lyrics Studio', tabTarget: 'lyrics', icon: Sparkles },
        { label: 'Mastering Bus', tabTarget: 'mastering', icon: Activity }
      ];
      break;

    case 'kanban':
      stageLabel = 'Pipeline: Master 4-EP Kanban Workboard';
      primaryAction = {
        label: `Open ${selectedTrack.id} in Studio`,
        icon: Music,
        action: () => onNavigateToTab('lyrics'),
        color: 'from-indigo-600 to-purple-600'
      };
      secondaryShortcuts = [
        { label: 'Lyrics Studio', tabTarget: 'lyrics', icon: Sparkles },
        { label: 'Mixer Console', tabTarget: 'mixer', icon: Scissors },
        { label: 'WebDAV Sync', tabTarget: 'nextcloud_sync', icon: HardDrive }
      ];
      break;

    default:
      stageLabel = `Workflow: ${activeTab.replace('_', ' ').toUpperCase()}`;
      primaryAction = {
        label: 'Jump to Next Stage',
        icon: ArrowRight,
        action: () => onNavigateToTab('mixer'),
        color: 'from-indigo-600 to-purple-600'
      };
      secondaryShortcuts = [
        { label: 'Lyrics', tabTarget: 'lyrics', icon: Sparkles },
        { label: 'Mixer', tabTarget: 'mixer', icon: Scissors },
        { label: 'Nextcloud', tabTarget: 'nextcloud_sync', icon: HardDrive }
      ];
      break;
  }

  return (
    <div className={`px-4 sm:px-6 py-2 border-b flex items-center justify-between gap-3 text-xs flex-wrap transition-colors ${
      isDarkMode 
        ? 'bg-slate-900/90 border-slate-800 text-slate-300' 
        : 'bg-slate-50/95 border-slate-200 text-slate-700'
    }`}>
      {/* Left: Active Stage Breadcrumb & Loaded Track */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-mono text-[10px] uppercase font-bold text-slate-400">Context:</span>
        <span className="font-bold text-white truncate max-w-[220px]">{stageLabel}</span>
        <span className="text-slate-500">•</span>
        <span className="text-indigo-400 font-mono font-bold truncate max-w-[180px]">
          {selectedTrack.id}: {selectedTrack.title}
        </span>
      </div>

      {/* Right: Primary Stage Action + 1-Click Fast Stage Leaps */}
      <div className="flex items-center gap-2 flex-wrap">
        {primaryAction && (
          <button
            type="button"
            onClick={primaryAction.action}
            className={`px-3 py-1 rounded-lg text-white font-bold text-xs bg-gradient-to-r ${primaryAction.color} hover:brightness-110 shadow-xs flex items-center gap-1.5 transition cursor-pointer`}
          >
            <primaryAction.icon className="w-3.5 h-3.5" />
            <span>{primaryAction.label}</span>
          </button>
        )}

        <div className="flex items-center gap-1">
          {secondaryShortcuts.map((sc, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onNavigateToTab(sc.tabTarget)}
              className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition flex items-center gap-1 cursor-pointer ${
                isDarkMode 
                  ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white' 
                  : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <sc.icon className="w-3 h-3 text-slate-400" />
              <span>{sc.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
