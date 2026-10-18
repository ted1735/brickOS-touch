import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Copy,
  Check,
  Send,
  Zap,
  Grid,
  Bot,
  RefreshCw,
  Sliders,
  CheckCircle2,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { Track } from '../types';

interface TouchWriteStudioProps {
  track: Track;
  onUpdateTrackLyrics: (newLyrics: string) => void;
  onToggleWhiteboard: () => void;
  isWhiteboardActive: boolean;
  onOpenCoProducerModal: () => void;
  isDarkMode?: boolean;
}

export const TouchWriteStudio: React.FC<TouchWriteStudioProps> = ({
  track,
  onUpdateTrackLyrics,
  onToggleWhiteboard,
  isWhiteboardActive,
  onOpenCoProducerModal,
  isDarkMode = true
}) => {
  const [lyrics, setLyrics] = useState(track.lyrics || '');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [activePane, setActivePane] = useState<'both' | 'lyrics' | 'suno'>('both');

  const sunoPrompt = `[Genre: ${track.genre}]\n[Tempo: ${track.bpm} BPM | Key: ${track.key}]\n[Vocal: ${track.vocalCast}]\n[Structure: Nashville 4-Block Master]\n\n${lyrics || '(Enter lyrics on the left to populate Suno generation prompt)'}`;

  const handleCopySunoPrompt = () => {
    navigator.clipboard.writeText(sunoPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleLyricsChange = (val: string) => {
    setLyrics(val);
    onUpdateTrackLyrics(val);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-28 pt-2 animate-in fade-in duration-200">
      {/* STUDIO TOOLBAR ROW */}
      <div
        className={`p-3.5 px-4 rounded-3xl border flex items-center justify-between gap-3 flex-wrap ${
          isDarkMode
            ? 'bg-slate-900/90 border-slate-800 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-mono text-xs font-bold">
            {track.id}
          </span>
          <div>
            <h2 className="text-base font-black truncate">{track.title}</h2>
            <p className="text-[11px] font-mono text-slate-400">
              {track.bpm} BPM • {track.key} • {track.genre}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleWhiteboard}
            className={`touch-target h-10 px-3.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
              isWhiteboardActive
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-950/50'
                : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-slate-700'
            }`}
            title="Open BlockSuite Edgeless Whiteboard"
          >
            <Grid className="w-4 h-4" />
            <span>Whiteboard</span>
          </button>

          <button
            type="button"
            onClick={onOpenCoProducerModal}
            className="touch-target h-10 px-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-950/50 transition active:scale-95 cursor-pointer"
            title="Open Gemini Co-Producer Assistant"
          >
            <Bot className="w-4 h-4" />
            <span>Co-Producer</span>
          </button>
        </div>
      </div>

      {/* SPLIT PANE: LYRICS (LEFT) & SUNO PROMPT ENGINE (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT PANE: LYRICS DRAFTING */}
        <div
          className={`p-4 sm:p-5 rounded-3xl border flex flex-col gap-3 shadow-lg ${
            isDarkMode
              ? 'bg-slate-900/80 border-slate-800 text-white'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-sm">Lyric Sheet & Verses</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {lyrics.split(/\s+/).filter(Boolean).length} Words
            </span>
          </div>

          <textarea
            value={lyrics}
            onChange={(e) => handleLyricsChange(e.target.value)}
            placeholder="Type or paste song lyrics here...&#10;&#10;[Verse 1]&#10;In the quiet of the morning...&#10;&#10;[Chorus]&#10;We lift our hands and sing..."
            rows={15}
            className={`w-full flex-1 p-3.5 rounded-2xl border font-mono text-sm leading-relaxed resize-none focus:outline-hidden focus:ring-2 focus:ring-indigo-500 touch-pan-y ${
              isDarkMode
                ? 'bg-slate-950/80 border-slate-800 text-slate-200 placeholder-slate-600'
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>

        {/* RIGHT PANE: SUNO V5.5 4-BLOCK PROMPT BUILDER */}
        <div
          className={`p-4 sm:p-5 rounded-3xl border flex flex-col gap-3 shadow-lg ${
            isDarkMode
              ? 'bg-slate-900/80 border-slate-800 text-white'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm">Suno v5.5 4-Block Prompt</h3>
            </div>
            <button
              type="button"
              onClick={handleCopySunoPrompt}
              className={`touch-target h-9 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
                copiedPrompt
                  ? 'bg-emerald-600 text-white border-emerald-400'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              {copiedPrompt ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPrompt ? 'Copied!' : 'Copy Prompt'}</span>
            </button>
          </div>

          <div
            className={`w-full flex-1 p-3.5 rounded-2xl border font-mono text-xs sm:text-sm leading-relaxed overflow-y-auto whitespace-pre-wrap select-text touch-pan-y ${
              isDarkMode
                ? 'bg-slate-950/80 border-slate-800 text-slate-300'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            {sunoPrompt}
          </div>

          <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-slate-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              Formatted for Suno AI v5.5 Nashville SOP standards. Copy and paste directly into Suno Custom Mode.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
