import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ShieldCheck,
  Music,
  Activity,
  Sparkles,
  Sliders,
  Volume2,
  VolumeX,
  CheckCircle2,
  Clock,
  ChevronRight,
  Flame,
  FileText,
  Share2,
  Copy,
  Check
} from 'lucide-react';
import { Track } from '../types';
import { AudioWaveformVisualizer } from './AudioWaveformVisualizer';

interface TouchListenLoungeProps {
  track: Track;
  isPlaying: boolean;
  isLoadingAudio?: boolean;
  onTogglePlayPause: () => void;
  onPreviousTrack: () => void;
  onNextTrack: () => void;
  auditionBus: 'A' | 'B';
  onToggleAuditionBus: () => void;
  onOpenSelahModal: () => void;
  onNavigateToWrite: () => void;
  onNavigateToMix: () => void;
  isDarkMode?: boolean;
}

export const TouchListenLounge: React.FC<TouchListenLoungeProps> = ({
  track,
  isPlaying,
  isLoadingAudio = false,
  onTogglePlayPause,
  onPreviousTrack,
  onNextTrack,
  auditionBus,
  onToggleAuditionBus,
  onOpenSelahModal,
  onNavigateToWrite,
  onNavigateToMix,
  isDarkMode = true
}) => {
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const handleCopyTrackInfo = () => {
    const text = `[brickOS Master] ${track.id}: ${track.title}\nGenre: ${track.genre}\nBPM: ${track.bpm} | Key: ${track.key}\nEP: ${track.ep}\nVocal Cast: ${track.vocalCast}`;
    navigator.clipboard.writeText(text);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-28 pt-2 animate-in fade-in duration-200">
      {/* HERO TRACK CARD */}
      <div
        className={`p-5 sm:p-7 rounded-3xl border transition-all duration-200 shadow-xl relative overflow-hidden ${
          isDarkMode
            ? 'bg-slate-900/90 border-slate-800 text-white shadow-indigo-950/20'
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
        }`}
      >
        {/* Ambient Gradient Glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 font-mono text-xs font-black border border-indigo-500/40">
                {track.id}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-300 font-mono text-xs font-semibold border border-amber-500/30">
                {track.ep.split(':')[0]}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-400 font-mono text-xs font-semibold border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>24-bit Lossless Stream</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight truncate pt-1">
              {track.title}
            </h1>

            <p className="text-sm text-slate-400 font-medium">
              {track.genre} • Vocal: <span className="text-slate-200 font-semibold">{track.vocalCast}</span>
            </p>
          </div>

          {/* Quick Actions (Copy Info, Selah Gate) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyTrackInfo}
              className={`touch-target h-10 px-3.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
                isDarkMode
                  ? 'bg-slate-800/90 border-slate-700 text-slate-300 hover:text-white'
                  : 'bg-slate-100 border-slate-300 text-slate-700'
              }`}
              title="Copy Track Info"
            >
              {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPrompt ? 'Copied!' : 'Share Info'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenSelahModal}
              className="touch-target h-10 px-3.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              title="Selah Prayer Gate Approval"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Selah Gate</span>
            </button>
          </div>
        </div>

        {/* HERO LOSSLESS WAVEFORM VISUALIZER */}
        <div className="mt-6 pt-5 border-t border-slate-800/70">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              <span>Realtime PCM Output</span>
            </span>
            <span>
              {track.bpm} BPM • Key of {track.key}
            </span>
          </div>

          <div className="rounded-2xl bg-slate-950 p-3 border border-slate-800/80">
            <AudioWaveformVisualizer
              trackId={track.id}
              isPlaying={isPlaying}
              isLoadingAudio={isLoadingAudio}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>

        {/* A/B AUDITIONING TOGGLE ROW */}
        <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              Audition Bus:
            </span>
            <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={onToggleAuditionBus}
                className={`touch-target h-10 px-4 rounded-xl font-mono text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-2 ${
                  auditionBus === 'A'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <span>Bus A: Master Mix</span>
              </button>
              <button
                type="button"
                onClick={onToggleAuditionBus}
                className={`touch-target h-10 px-4 rounded-xl font-mono text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-2 ${
                  auditionBus === 'B'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Bus B: UVR5 Stems</span>
              </button>
            </div>
          </div>

          {/* Quick Jump to Mode 2 or 3 */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onNavigateToWrite}
              className="touch-target h-10 px-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Edit Lyrics</span>
            </button>
            <button
              type="button"
              onClick={onNavigateToMix}
              className="touch-target h-10 px-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>Open 4-Track DAW</span>
            </button>
          </div>
        </div>
      </div>

      {/* QUICK LYRICS TELEPROMPTER CARD */}
      <div
        className={`p-5 rounded-3xl border transition-all duration-200 ${
          isDarkMode
            ? 'bg-slate-900/70 border-slate-800/80 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-sm">Lyrics & Verse Teleprompter</h3>
          </div>
          <button
            type="button"
            onClick={onNavigateToWrite}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <span>Full Lyric Editor</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="max-h-60 overflow-y-auto font-mono text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap select-text p-2 bg-slate-950/60 rounded-2xl border border-slate-800/50 touch-pan-y">
          {track.lyrics || '(No lyrics provided yet. Tap "Full Lyric Editor" to add verses, choruses, and rhymes.)'}
        </div>
      </div>
    </div>
  );
};
