import React from 'react';
import { MessageSquare, RefreshCw, Send, HelpCircle, Bot, User, Sparkles, Palette } from 'lucide-react';
import { Track, ChatMessage, StudioTheme } from '../types';
import { SectionQuickHelpBanner } from './SectionQuickHelpBanner';
import { StudioThemeSelector } from './StudioThemeSelector';

interface StudioCopilotTabProps {
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
  onOpenSectionGuide?: (sectionId: string) => void;
  isDarkMode?: boolean;
  studioTheme?: StudioTheme;
  onSelectTheme?: (theme: StudioTheme) => void;
  onOpenThemeModal?: () => void;
}

export const StudioCopilotTab: React.FC<StudioCopilotTabProps> = ({
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
  onOpenSectionGuide,
  isDarkMode = true,
  studioTheme = 'moon',
  onSelectTheme,
  onOpenThemeModal
}) => {
  return (
    <div className="space-y-4">
      {onOpenSectionGuide && (
        <SectionQuickHelpBanner
          sectionId="coproducer"
          onOpenModalGuide={onOpenSectionGuide}
          isDarkMode={isDarkMode}
        />
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col h-[650px] shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-950 border border-teal-800/60 text-teal-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Studio Co-Producer AI (Gemini Multi-Turn Copilot)</span>
                  <span className="px-2 py-0.5 rounded bg-teal-950 text-teal-300 font-mono text-[10px] font-bold border border-teal-800/50">
                    {selectedTrack.id}
                  </span>
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/50 font-bold hidden sm:inline">
                  {studioTheme.toUpperCase()} MODE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Contextually aware of <strong className="text-white">{selectedTrack.title}</strong> ({selectedTrack.genre} • {selectedTrack.key} • {selectedTrack.bpm} BPM)
              </p>
            </div>
          </div>

          {/* Role, Model Selectors, Theme Switcher, and Guide button */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Inline Theme Switcher inside Co-Producer */}
            {onSelectTheme && (
              <div className="flex items-center gap-1.5 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
                <StudioThemeSelector
                  currentTheme={studioTheme}
                  onSelectTheme={onSelectTheme}
                  variant="header"
                  showLabels={false}
                />
                {onOpenThemeModal && (
                  <button
                    type="button"
                    onClick={onOpenThemeModal}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                    title="Open Studio Theme Architecture Details & Swatches"
                  >
                    <Palette className="w-3.5 h-3.5 text-indigo-400" />
                  </button>
                )}
              </div>
            )}

            {onOpenSectionGuide && (
              <button
                type="button"
                onClick={() => onOpenSectionGuide('coproducer')}
                className="px-3 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 text-xs font-bold border border-amber-700/50 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                title="Open Studio Co-Producer AI Operating Guide & SOP Rules"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>How To Use Co-Producer</span>
              </button>
            )}

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
              <option value="gemini-3.8-flash">gemini-3.8-flash (Fast & Cost-Effective)</option>
              <option value="gemini-3.1-pro-preview">gemini-3.1-pro (Deep Reasoning)</option>
              <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Ultra Fast)</option>
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
            onKeyDown={(e) => e.key === 'Enter' && onSendMessage()}
            placeholder={`Ask ${chatRole.replace('_', ' ')} anything about ${selectedTrack.title}...`}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
          />
          <button
            onClick={onSendMessage}
            disabled={isChatLoading || !chatInput.trim()}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
