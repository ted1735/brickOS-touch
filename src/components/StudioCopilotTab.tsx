import React from 'react';
import { MessageSquare, RefreshCw, Send, HelpCircle, FileCode, Square, Sparkles } from 'lucide-react';
import { Track, ChatMessage, StudioTheme } from '../types';
import { SectionQuickHelpBanner } from './SectionQuickHelpBanner';

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
  onOpenPromptEditor?: () => void;
  chatElapsedTime?: number;
  onAbortChat?: () => void;
  isDarkMode?: boolean;
  studioTheme?: StudioTheme;
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
  onOpenPromptEditor,
  chatElapsedTime = 0,
  onAbortChat,
  isDarkMode = true,
  studioTheme = 'moon'
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

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col h-[680px] shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-950 border border-purple-800/60 text-purple-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Studio Co-Producer AI (Gemini Copilot)</span>
                  <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-mono text-[10px] font-bold border border-purple-800/50">
                    {selectedTrack.id}
                  </span>
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/50 font-bold hidden sm:inline">
                  {studioTheme.toUpperCase()} MODE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Contextually grounded in <strong className="text-white">{selectedTrack.title}</strong> ({selectedTrack.genre} • {selectedTrack.key} • {selectedTrack.bpm} BPM)
              </p>
            </div>
          </div>

          {/* Action buttons and model/role selectors */}
          <div className="flex items-center gap-2 flex-wrap">
            {onOpenPromptEditor && (
              <button
                type="button"
                onClick={onOpenPromptEditor}
                className="px-3 py-1.5 rounded-xl bg-purple-950/70 hover:bg-purple-900/80 text-purple-300 text-xs font-bold border border-purple-700/60 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                title="View and edit custom Gemini Gem / BrickOS v10 SOP Instructions"
              >
                <FileCode className="w-3.5 h-3.5 text-purple-400" />
                <span>Gem Instructions & SOP</span>
              </button>
            )}

            {onOpenSectionGuide && (
              <button
                type="button"
                onClick={() => onOpenSectionGuide('coproducer')}
                className="px-3 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 text-xs font-bold border border-amber-700/50 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                title="Open Studio Co-Producer AI Operating Guide & SOP Rules"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>How To Use</span>
              </button>
            )}

            <select
              value={chatRole}
              onChange={(e) => setChatRole(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-bold focus:outline-none"
            >
              <option value="lyric_assistant">Elite Nashville Producer & Mentor (BrickOS v10)</option>
              <option value="mastering_engineer">Senior Mastering Engineer</option>
              <option value="omnipost_strategist">Omnipost Social Strategist</option>
            </select>

            <select
              value={chatModel}
              onChange={(e) => setChatModel(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-indigo-300 font-mono focus:outline-none"
            >
              <option value="gemini-3.1-pro-preview">gemini-3.1-pro (Deep Reasoning & Production Craft)</option>
              <option value="gemini-3.8-flash">gemini-3.8-flash (Fast & Cost-Effective)</option>
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
                <span>{msg.role === 'user' ? 'You' : 'brickOS Co-Producer'}</span>
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
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2.5 text-slate-300">
                <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">Co-Producer reasoning with {chatModel}...</span>
                    <span className="text-[11px] text-purple-400 font-bold">({chatElapsedTime}s elapsed)</span>
                  </div>
                  {chatElapsedTime >= 25 && (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Complex songwriting and multi-block Suno prompt generation can take 45–75s to formulate.
                    </p>
                  )}
                </div>
              </div>
              {onAbortChat && (
                <button
                  type="button"
                  onClick={onAbortChat}
                  className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                  title="Cancel current generation request"
                >
                  <Square className="w-3 h-3 fill-rose-300" />
                  <span>Cancel</span>
                </button>
              )}
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
            placeholder={`Ask Co-Producer anything about ${selectedTrack.title} (Suno prompts, lyric coaching, chords)...`}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
            disabled={isChatLoading}
          />
          {isChatLoading && onAbortChat ? (
            <button
              onClick={onAbortChat}
              className="px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
              title="Cancel generation"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>Cancel</span>
            </button>
          ) : (
            <button
              onClick={onSendMessage}
              disabled={isChatLoading || !chatInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-md shadow-purple-950"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
