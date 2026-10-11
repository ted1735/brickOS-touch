import React from 'react';
import {
  X,
  Search,
  MessageSquare,
  Zap,
  Keyboard,
  Shield,
  Database,
  Eye,
  Sliders,
  ExternalLink,
  HardDrive,
  RefreshCw,
  Folder,
  Layers,
  Sparkles,
  Wifi
} from 'lucide-react';
import { Track } from '../types';

export interface StudioQuickToolsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTrack: Track;
  onNavigateToTab: (tab: any) => void;
  onOpenSunoBridge: () => void;
  onToggleCheatSheet: () => void;
  onOpenTailscaleModal: () => void;
  onOpenCoproducer: () => void;
  onOpenGroundingSearch: () => void;
  onSyncDatabase: () => void;
  isDbConnected: boolean;
  isDbSyncing: boolean;
  lastSyncedAt?: string;
  focusMode: boolean;
  onToggleFocusMode: () => void;
  isDarkMode?: boolean;
}

export const StudioQuickToolsDrawer: React.FC<StudioQuickToolsDrawerProps> = ({
  isOpen,
  onClose,
  selectedTrack,
  onNavigateToTab,
  onOpenSunoBridge,
  onToggleCheatSheet,
  onOpenTailscaleModal,
  onOpenCoproducer,
  onOpenGroundingSearch,
  onSyncDatabase,
  isDbConnected,
  isDbSyncing,
  lastSyncedAt,
  focusMode,
  onToggleFocusMode,
  isDarkMode = true
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div 
          className={`w-screen max-w-md shadow-2xl flex flex-col border-l animate-in slide-in-from-right duration-200 ${
            isDarkMode 
              ? 'bg-slate-900 border-slate-800 text-white shadow-indigo-950/80' 
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {/* Header */}
          <div className={`px-5 py-4 border-b flex items-center justify-between ${
            isDarkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-sm">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-tight">Studio Tools Drawer</h3>
                <p className="text-[11px] text-slate-400 font-mono">Quick Access & Cloud Integration</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                isDarkMode 
                  ? 'hover:bg-slate-800 border-slate-700 text-slate-400 hover:text-white' 
                  : 'hover:bg-slate-100 border-slate-200 text-slate-600'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
            
            {/* 1. Intelligence & Collaboration */}
            <div className="space-y-2.5">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-indigo-400">
                AI & Intelligence Tools
              </span>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onOpenCoproducer();
                    onClose();
                  }}
                  className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between group cursor-pointer ${
                    isDarkMode 
                      ? 'bg-slate-800/70 hover:bg-slate-800 border-slate-700 hover:border-purple-500/60 text-white' 
                      : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold group-hover:text-purple-400 transition">AI Co-Producer</div>
                      <div className="text-[10px] text-slate-400">Session co-pilot, feedback & creative direction</div>
                    </div>
                  </div>
                  <span className="text-xs text-purple-400 opacity-60 group-hover:opacity-100">Launch →</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onOpenGroundingSearch();
                    onClose();
                  }}
                  className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between group cursor-pointer ${
                    isDarkMode 
                      ? 'bg-slate-800/70 hover:bg-slate-800 border-slate-700 hover:border-blue-500/60 text-white' 
                      : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
                      <Search className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold group-hover:text-blue-400 transition">Theological & Style Grounding</div>
                      <div className="text-[10px] text-slate-400">Google Grounding for scriptures, lyrics & references</div>
                    </div>
                  </div>
                  <span className="text-xs text-blue-400 opacity-60 group-hover:opacity-100">Search →</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onOpenSunoBridge();
                    onClose();
                  }}
                  className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between group cursor-pointer ${
                    isDarkMode 
                      ? 'bg-slate-800/70 hover:bg-slate-800 border-slate-700 hover:border-amber-500/60 text-white' 
                      : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold group-hover:text-amber-400 transition">⚡ Suno Bridge Generator</div>
                      <div className="text-[10px] text-slate-400">Direct 4-Block Suno.com payload compiler</div>
                    </div>
                  </div>
                  <span className="text-xs text-amber-400 opacity-60 group-hover:opacity-100">Open →</span>
                </button>
              </div>
            </div>

            {/* 2. Cloud, Network & Database */}
            <div className="space-y-2.5">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-emerald-400">
                Cloud & Storage Infrastructure
              </span>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onNavigateToTab('nextcloud_sync');
                    onClose();
                  }}
                  className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between group cursor-pointer ${
                    isDarkMode 
                      ? 'bg-slate-800/70 hover:bg-slate-800 border-slate-700 hover:border-emerald-500/60 text-white' 
                      : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                      <HardDrive className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold group-hover:text-emerald-400 transition">Nextcloud /Music-Production</div>
                      <div className="text-[10px] text-slate-400">WebDAV folder 207332 live asset sync & match</div>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-400 opacity-60 group-hover:opacity-100">Sync →</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSyncDatabase();
                  }}
                  className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between group cursor-pointer ${
                    isDarkMode 
                      ? 'bg-slate-800/70 hover:bg-slate-800 border-slate-700 hover:border-cyan-500/60 text-white' 
                      : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
                      <Database className={`w-4 h-4 ${isDbSyncing ? 'animate-spin text-amber-400' : ''}`} />
                    </div>
                    <div>
                      <div className="text-xs font-bold group-hover:text-cyan-400 transition">Firestore Cloud Database</div>
                      <div className="text-[10px] text-slate-400">
                        {isDbSyncing ? 'Syncing now...' : isDbConnected ? `Connected${lastSyncedAt ? ` (${lastSyncedAt})` : ''}` : 'Local Browser Cache'}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-cyan-400 opacity-60 group-hover:opacity-100">Save →</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onOpenTailscaleModal();
                    onClose();
                  }}
                  className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between group cursor-pointer ${
                    isDarkMode 
                      ? 'bg-slate-800/70 hover:bg-slate-800 border-slate-700 hover:border-indigo-500/60 text-white' 
                      : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                      <Wifi className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold group-hover:text-indigo-400 transition">Tailscale Mesh VPN</div>
                      <div className="text-[10px] text-slate-400">Secure NAS & private subnet tunneling</div>
                    </div>
                  </div>
                  <span className="text-xs text-indigo-400 opacity-60 group-hover:opacity-100">Setup →</span>
                </button>
              </div>
            </div>

            {/* 3. Studio Environment & Utilities */}
            <div className="space-y-2.5">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-purple-400">
                Workspace Controls
              </span>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onToggleCheatSheet();
                    onClose();
                  }}
                  className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between group cursor-pointer ${
                    isDarkMode 
                      ? 'bg-slate-800/70 hover:bg-slate-800 border-slate-700 hover:border-purple-500/60 text-white' 
                      : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                      <Keyboard className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold group-hover:text-purple-400 transition">Keyboard Shortcuts (? or Shift+/)</div>
                      <div className="text-[10px] text-slate-400">Interactive cheat sheet for rapid editing</div>
                    </div>
                  </div>
                  <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-950/70 border border-purple-800/60 text-purple-300 font-bold">
                    ?
                  </kbd>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onToggleFocusMode();
                    onClose();
                  }}
                  className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between group cursor-pointer ${
                    focusMode
                      ? 'bg-purple-950/60 border-purple-500/60 text-white'
                      : isDarkMode 
                      ? 'bg-slate-800/70 hover:bg-slate-800 border-slate-700 hover:border-purple-500/60 text-white' 
                      : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
                      <Eye className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold group-hover:text-purple-400 transition">
                        {focusMode ? 'Exit Focus Mode' : 'Enter Focus Mode'}
                      </div>
                      <div className="text-[10px] text-slate-400">Minimize all sidebars & concentrate on audio</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-purple-400">{focusMode ? 'Active' : 'Off'}</span>
                </button>
              </div>
            </div>

          </div>

          {/* Footer info */}
          <div className={`p-4 border-t text-center text-xs font-mono text-slate-500 ${
            isDarkMode ? 'border-slate-800 bg-slate-950/80' : 'border-slate-200 bg-slate-50'
          }`}>
            <span>Active Project: </span>
            <span className="font-bold text-indigo-400">{selectedTrack.id} - {selectedTrack.title}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
