import React, { useState } from 'react';
import { X, RotateCcw, Save, Copy, Check, FileCode, ShieldAlert, Sparkles } from 'lucide-react';
import { DEFAULT_BRICKOS_V10_SOP, getActiveSOP, saveActiveSOP, resetActiveSOP } from '../data/canonicalCoProducerSOP';

interface CoProducerPromptEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePrompt?: (newPrompt: string) => void;
  isDarkMode?: boolean;
}

export const CoProducerPromptEditorModal: React.FC<CoProducerPromptEditorModalProps> = ({
  isOpen,
  onClose,
  onSavePrompt,
  isDarkMode = true,
}) => {
  const [promptText, setPromptText] = useState<string>(() => getActiveSOP());
  const [hasCopied, setHasCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    saveActiveSOP(promptText);
    onSavePrompt?.(promptText);
    setStatusMessage('Custom Gem SOP saved successfully to your studio!');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleResetDefault = () => {
    resetActiveSOP();
    setPromptText(DEFAULT_BRICKOS_V10_SOP);
    onSavePrompt?.(DEFAULT_BRICKOS_V10_SOP);
    setStatusMessage('Reset to BrickOS v10: Official Music Production SOP.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(promptText);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const isCustomized = promptText.trim() !== DEFAULT_BRICKOS_V10_SOP.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className={`w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col shadow-2xl border transition-colors ${
          isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-5 border-b ${
            isDarkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-950/80 border border-purple-800/60 text-purple-400">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">Studio Co-Producer AI Gem Instructions & SOP</h2>
                {isCustomized ? (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-800/60 font-semibold">
                    Customized SOP Active
                  </span>
                ) : (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-teal-950/70 text-teal-300 border border-teal-800/60 font-semibold">
                    BrickOS v10 Official Canonical
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Inspect, tweak, or paste your custom Gemini Gem prompt. Governs songwriting coaching, the Christianese Filter, and Suno prompt architecture.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close editor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-medium flex items-center justify-between">
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage(null)} className="text-emerald-400 hover:text-emerald-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Warning / Context Banner */}
        <div
          className={`mx-5 mt-4 p-3.5 rounded-xl border text-xs flex items-start gap-3 ${
            isDarkMode
              ? 'bg-slate-950/80 border-slate-800 text-slate-300'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-purple-300">
              The 'Christianese' Filter & Nashville Truth Rules
            </p>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              The Co-Producer strictly bans church buzzwords and generic religious clichés. It enforces Conversational Poetics, the OBI Funnel, Throne Room Pivot by the bridge, and the 3:1 Sonic Scar rule. You can customize these directives below or paste your personal Gemini Gem.
            </p>
          </div>
        </div>

        {/* Textarea Editor */}
        <div className="p-5 flex-1 flex flex-col min-h-0 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Prompt Markdown ({promptText.length.toLocaleString()} characters)</span>
            <span>Automatically merged with Active Track Title, Genre, Key, BPM, and Lyrics</span>
          </div>
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            className={`w-full flex-1 min-h-[350px] p-4 font-mono text-xs leading-relaxed rounded-xl border resize-none focus:outline-none focus:ring-1 focus:ring-purple-500 custom-scrollbar ${
              isDarkMode
                ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-600'
                : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
            }`}
            placeholder="Paste your custom Gemini Gem or SOP instructions here..."
            spellCheck={false}
          />
        </div>

        {/* Footer Actions */}
        <div
          className={`p-4 border-t flex items-center justify-between flex-wrap gap-3 ${
            isDarkMode ? 'border-slate-800 bg-slate-950/80' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefault}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
              title="Reset to official BrickOS v10 SOP"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to BrickOS v10 Default</span>
            </button>
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
              title="Copy prompt text to clipboard"
            >
              {hasCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{hasCopied ? 'Copied!' : 'Copy SOP'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition flex items-center gap-1.5 shadow-lg shadow-purple-900/30 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save & Apply SOP</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
