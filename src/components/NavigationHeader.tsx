import React from 'react';
import {
  HardDrive,
  Zap,
  Search,
  MessageSquare,
  Music,
  Film,
  Sparkles,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { Track } from '../types';

interface NavigationHeaderProps {
  selectedTrack: Track;
  onOpenStorage: () => void;
  onOpenSunoBridge: () => void;
  onOpenSearch: () => void;
  onOpenChat: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  selectedTrack,
  onOpenStorage,
  onOpenSunoBridge,
  onOpenSearch,
  onOpenChat,
  activeTab,
  setActiveTab
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 px-6 py-3.5 flex items-center justify-between gap-4 sticky top-0 z-40 backdrop-blur-md bg-opacity-95">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
          b
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-black tracking-wider text-white">brickOS MASTER STUDIO</h1>
            <span className="px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 font-mono text-[10px] font-bold border border-indigo-700/50">
              v5.5 SOVEREIGN
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 font-mono text-[10px] font-semibold border border-emerald-700/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              WebDAV Online
            </span>
          </div>
          <p className="text-[11px] text-slate-400 flex items-center gap-2">
            <span>Ted Moyer (Primary Artist / OAC)</span>
            <span>•</span>
            <span className="text-indigo-400 font-medium">BRICK Records</span>
            <span>•</span>
            <span className="text-amber-400 font-medium">{selectedTrack.ep}</span>
          </p>
        </div>
      </div>

      {/* Global Actions Bar */}
      <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
        <button
          onClick={onOpenSearch}
          className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition shadow-sm"
          title="Google Search Grounding (gemini-3.5-flash)"
        >
          <Search className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden md:inline">Google Search Grounding</span>
          <span className="md:hidden">Search</span>
        </button>

        <button
          onClick={onOpenChat}
          className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition shadow-sm"
          title="Studio Co-Producer Gemini Chatbot"
        >
          <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden md:inline">Studio Co-Producer AI</span>
          <span className="md:hidden">AI Chat</span>
        </button>

        <button
          onClick={onOpenStorage}
          className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition shadow-sm"
          title="Nextcloud Sovereign WebDAV Hub"
        >
          <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden lg:inline">Nextcloud Hub</span>
        </button>

        <button
          onClick={onOpenSunoBridge}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-950/50 transition border border-indigo-400/30"
          title="Suno & NightCafe 1-Click Bridge"
        >
          <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
          <span>⚡ Suno & NightCafe Bridge</span>
        </button>
      </div>
    </header>
  );
};
