import React, { useState } from 'react';
import {
  MessageSquare,
  Search,
  Activity,
  X,
  ChevronRight,
  Sparkles,
  Bot,
  ExternalLink,
  Send,
  RefreshCw,
  Clock,
  Maximize2,
  Minimize2,
  FileCode,
  Square,
} from 'lucide-react';
import { Track, ChatMessage } from '../types';

interface SearchSource {
  title?: string;
  url: string;
}

interface SearchGroundingResult {
  answer: string;
  sources?: SearchSource[];
}

interface StudioCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTrack: Track;
  chatMessages: ChatMessage[];
  chatInput: string;
  setChatInput: (val: string) => void;
  onSendMessage: () => void;
  isChatLoading: boolean;
  chatRole: 'lyric_assistant' | 'mastering_engineer' | 'omnipost_strategist';
  setChatRole: (role: 'lyric_assistant' | 'mastering_engineer' | 'omnipost_strategist') => void;
  chatModel: string;
  setChatModel: (model: string) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  onSearchGrounding: () => void;
  isSearching: boolean;
  searchResult: SearchGroundingResult | null;
  onOpenPromptEditor?: () => void;
  chatElapsedTime?: number;
  onAbortChat?: () => void;
  isDarkMode?: boolean;
}

export const StudioCopilotDrawer: React.FC<StudioCopilotDrawerProps> = ({
  isOpen,
  onClose,
  selectedTrack,
  chatMessages,
  chatInput,
  setChatInput,
  onSendMessage,
  isChatLoading,
  chatRole,
  setChatRole,
  chatModel,
  setChatModel,
  searchQuery,
  setSearchQuery,
  onSearchGrounding,
  isSearching,
  searchResult,
  onOpenPromptEditor,
  chatElapsedTime = 0,
  onAbortChat,
  isDarkMode = true
}) => {
  const [drawerTab, setDrawerTab] = useState<'copilot' | 'search' | 'telemetry'>('copilot');
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-[9990] flex animate-slide-left">
      {/* Backdrop for mobile / tablet */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs lg:hidden"
        onClick={onClose}
      />

      {/* Main Drawer Panel */}
      <aside
        className={`relative z-10 flex flex-col h-full bg-slate-900 border-l border-slate-750 shadow-2xl transition-all duration-300 ${
          isExpanded ? 'w-[750px]' : 'w-[480px]'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-950 border border-teal-800 text-teal-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <span>Studio Copilot Drawer</span>
                <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 font-mono text-[9px] border border-indigo-800">
                  Ctrl+J
                </span>
              </h3>
              <p className="text-[10px] text-slate-400 truncate max-w-[240px]">
                {selectedTrack.title} ({selectedTrack.genre})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsExpanded(prev => !prev)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title={isExpanded ? 'Collapse width' : 'Expand width'}
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Close Drawer (Ctrl+J or ESC)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950 px-2 py-1.5 gap-1">
          <button
            type="button"
            onClick={() => setDrawerTab('copilot')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              drawerTab === 'copilot'
                ? 'bg-teal-600/20 text-teal-300 border border-teal-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
            <span>Co-Producer</span>
          </button>

          <button
            type="button"
            onClick={() => setDrawerTab('search')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              drawerTab === 'search'
                ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span>Search Grounding</span>
          </button>

          <button
            type="button"
            onClick={() => setDrawerTab('telemetry')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              drawerTab === 'telemetry'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-purple-400" />
            <span>Telemetry</span>
          </button>
        </div>

        {/* Tab 1: Co-Producer AI */}
        {drawerTab === 'copilot' && (
          <div className="flex-1 flex flex-col min-h-0 p-3 space-y-2">
            {/* Role & Model Controls */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <select
                value={chatRole}
                onChange={(e) => setChatRole(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-200 font-bold focus:outline-none flex-1"
              >
                <option value="lyric_assistant">Elite Nashville Producer (BrickOS v10)</option>
                <option value="mastering_engineer">Senior Mastering Engineer</option>
                <option value="omnipost_strategist">Social Strategist</option>
              </select>

              <select
                value={chatModel}
                onChange={(e) => setChatModel(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-purple-300 font-mono focus:outline-none"
              >
                <option value="gemini-3.1-pro-preview">gemini-3.1-pro</option>
                <option value="gemini-3.8-flash">gemini-3.8-flash</option>
                <option value="gemini-3.1-flash-lite">flash-lite</option>
              </select>

              {onOpenPromptEditor && (
                <button
                  type="button"
                  onClick={onOpenPromptEditor}
                  className="px-2 py-1 rounded-lg bg-purple-950 hover:bg-purple-900 text-purple-300 text-[10px] font-bold border border-purple-800 flex items-center gap-1 transition cursor-pointer"
                  title="Edit custom Gem / BrickOS v10 SOP instructions"
                >
                  <FileCode className="w-3 h-3 text-purple-400" />
                  <span>SOP</span>
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-2.5 p-2.5 bg-slate-950 rounded-xl border border-slate-800 custom-scrollbar">
              {chatMessages.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Ask anything about <strong className="text-slate-300">{selectedTrack.title}</strong> — 4-block Suno architecture, conversational lyric coaching, or Nashville truth checks.
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="text-[9px] text-slate-500 font-mono mb-0.5">
                      {msg.role === 'user' ? 'You' : 'brickOS Co-Producer'} • {msg.timestamp}
                    </div>
                    <div
                      className={`p-2.5 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-purple-600 text-white rounded-br-none'
                          : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none font-mono text-[11px]'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              {isChatLoading && (
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center gap-2 text-slate-300">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                    <div>
                      <span className="font-semibold text-white">Reasoning with {chatModel}...</span>
                      <span className="text-[10px] text-purple-400 ml-1.5 font-bold">({chatElapsedTime}s)</span>
                    </div>
                  </div>
                  {onAbortChat && (
                    <button
                      type="button"
                      onClick={onAbortChat}
                      className="px-2 py-0.5 rounded bg-rose-950 hover:bg-rose-900 text-rose-300 text-[10px] font-bold border border-rose-800 flex items-center gap-1 cursor-pointer"
                      title="Cancel"
                    >
                      <Square className="w-2.5 h-2.5 fill-rose-300" />
                      <span>Cancel</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSendMessage()}
                placeholder={`Ask Co-Producer about ${selectedTrack.title}...`}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
                disabled={isChatLoading}
              />
              {isChatLoading && onAbortChat ? (
                <button
                  type="button"
                  onClick={onAbortChat}
                  className="p-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold transition cursor-pointer"
                  title="Cancel generation"
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onSendMessage}
                  disabled={isChatLoading || !chatInput.trim()}
                  className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition disabled:opacity-50 cursor-pointer shadow-md shadow-purple-950"
                  title="Send message"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Search Grounding */}
        {drawerTab === 'search' && (
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearchGrounding()}
                placeholder="Search Christian charts, scripture, or mixing..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <button
                type="button"
                onClick={onSearchGrounding}
                disabled={isSearching}
                className="p-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white transition disabled:opacity-50 cursor-pointer"
              >
                {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              </button>
            </div>

            {searchResult && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="text-xs text-slate-200 font-mono leading-relaxed whitespace-pre-wrap">
                  {searchResult.answer}
                </div>

                {searchResult.sources && searchResult.sources.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 space-y-1">
                    <span className="text-[9px] uppercase font-bold text-slate-500 font-mono block">Sources:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {searchResult.sources.map((src, idx) => (
                        <a
                          key={idx}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-cyan-400 hover:underline bg-slate-900 px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1"
                        >
                          <span className="truncate max-w-[150px]">{src.title || src.url}</span>
                          <ExternalLink className="w-2.5 h-2.5 inline shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Telemetry */}
        {drawerTab === 'telemetry' && (
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase">Meet Me Here (TRK-13)</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[9px] font-mono font-bold">VIRAL</span>
              </div>
              <div className="text-xs text-slate-300 space-y-1 font-mono text-[11px]">
                <div>3s Retention: <strong className="text-white">74.2%</strong> (&gt;65% Pass)</div>
                <div>Completion: <strong className="text-white">71.5%</strong> (&gt;70% Winner)</div>
                <div>1h Views: <strong className="text-white">2,680</strong></div>
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <h4 className="text-[11px] font-bold text-slate-300 font-mono">Live Latency Headers</h4>
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <div className="text-[9px] text-slate-500 font-mono">Buffer Latency</div>
                  <div className="font-bold text-emerald-400 font-mono">8.2 ms</div>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <div className="text-[9px] text-slate-500 font-mono">WebDAV Sync</div>
                  <div className="font-bold text-cyan-400 font-mono">1.2 sec</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};
