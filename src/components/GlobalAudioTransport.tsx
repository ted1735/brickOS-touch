import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Maximize2,
  Minimize2,
  X,
  Music,
  Activity,
  RotateCcw
} from 'lucide-react';
import { Track } from '../types';

interface GlobalAudioTransportProps {
  isPlaying: boolean;
  onTogglePlayPause: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  masterVolume: number;
  onVolumeChange: (vol: number) => void;
  selectedTrack: Track;
  onPreviousTrack: () => void;
  onNextTrack: () => void;
  onOpenMiniDaw: () => void;
  onResetAudio?: () => void;
  isDarkMode?: boolean;
}

export const GlobalAudioTransport: React.FC<GlobalAudioTransportProps> = ({
  isPlaying,
  onTogglePlayPause,
  isMuted,
  onToggleMute,
  masterVolume,
  onVolumeChange,
  selectedTrack,
  onPreviousTrack,
  onNextTrack,
  onOpenMiniDaw,
  onResetAudio,
  isDarkMode = true
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // If user hits play via Space or UI, automatically un-dismiss the transport
  useEffect(() => {
    if (isPlaying) {
      setIsDismissed(false);
    }
  }, [isPlaying]);

  if (isDismissed) return null;

  // MINIMIZED FLOATING PILL
  if (isMinimized) {
    return (
      <div
        className="fixed bottom-4 right-4 z-40 animate-in fade-in slide-in-from-bottom-2 duration-200"
      >
        <div
          className={`flex items-center gap-2 p-1.5 px-3 rounded-full border shadow-2xl backdrop-blur-md transition cursor-pointer select-none ${
            isDarkMode
              ? 'bg-slate-900/95 border-slate-700 text-white shadow-indigo-950/80 ring-1 ring-white/10'
              : 'bg-white/95 border-slate-300 text-slate-900 shadow-xl ring-1 ring-slate-900/10'
          }`}
          onClick={() => setIsMinimized(false)}
          title="Expand Master Audio Transport"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlayPause();
            }}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition ${
              isPlaying ? 'bg-amber-500 text-slate-950' : 'bg-indigo-600 text-white'
            }`}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
          </button>

          <div className="flex items-center gap-1.5 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="max-w-[140px] truncate">{selectedTrack.title}</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(false);
            }}
            className="text-slate-400 hover:text-white p-1"
            title="Expand controls"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  // EXPANDED FLOATING TRANSPORT CONSOLE
  return (
    <div
      className="fixed bottom-4 right-4 sm:right-6 z-40 animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      <div
        className={`w-[320px] sm:w-[380px] p-3.5 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all ${
          isDarkMode
            ? 'bg-slate-900/95 border-slate-700/80 text-white shadow-indigo-950/80 ring-1 ring-white/10'
            : 'bg-white/95 border-slate-300 text-slate-900 shadow-2xl ring-1 ring-slate-900/10'
        }`}
      >
        {/* Top: Header, Track Identity & Controls */}
        <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-700/50">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-amber-500 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Music className="w-3.5 h-3.5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  {selectedTrack.id}
                </span>
                <span className="text-xs font-bold tracking-tight truncate max-w-[160px] sm:max-w-[200px]">
                  {selectedTrack.title}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                <span>{selectedTrack.bpm} BPM</span>
                <span>•</span>
                <span>{selectedTrack.key}</span>
                <span>•</span>
                <span className="truncate">{selectedTrack.ep.split(':')[0]}</span>
              </div>
            </div>
          </div>

          {/* Right Header Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onOpenMiniDaw}
              className={`p-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition cursor-pointer ${
                isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-indigo-700 border-slate-300'
              }`}
              title="Open Mini-DAW Console (Alt+5)"
            >
              <Sliders className="w-3 h-3 text-indigo-400" />
              <span className="hidden sm:inline">DAW</span>
            </button>

            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
              title="Minimize Transport"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                if (isPlaying) onTogglePlayPause();
                setIsDismissed(true);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 transition cursor-pointer"
              title="Close Transport (Hides until played again)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Middle: Playback Transport Buttons & Waveform Pulse */}
        <div className="flex items-center justify-between gap-3">
          {/* Track Steppers & Play Button */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onPreviousTrack}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
              title="Previous Track in Catalog ( [ )"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={onTogglePlayPause}
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition cursor-pointer ${
                isPlaying
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25 ring-2 ring-amber-400/40'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
              }`}
              title="Play / Pause Stem Preview (Space)"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                  <span>Play</span>
                </>
              )}
            </button>

            <button
              onClick={onNextTrack}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
              title="Next Track in Catalog ( ] )"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Volume Slider & Mute Toggle */}
          <div className="flex items-center gap-2 flex-1 max-w-[140px]">
            <button
              onClick={onToggleMute}
              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                isMuted
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                  : isDarkMode
                  ? 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                  : 'bg-slate-100 text-slate-700 border-slate-300'
              }`}
              title="Toggle Mute (M)"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : masterVolume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              className="w-full accent-indigo-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              title={`Master Volume: ${isMuted ? 'Muted' : `${masterVolume}%`}`}
            />
          </div>
        </div>

        {/* Live Audio Visualizer Bar */}
        {isPlaying && (
          <div className="flex items-center justify-between gap-1 mt-2.5 pt-2 border-t border-slate-800/60">
            <span className="text-[9px] font-mono text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>4-TRACK STEM ENGINE LIVE</span>
            </span>

            {/* EQ Level Animation Bars */}
            <div className="flex items-end gap-0.5 h-3.5">
              {[60, 90, 45, 100, 75, 50, 85, 95].map((height, i) => (
                <span
                  key={i}
                  style={{ height: `${height}%`, animationDuration: `${0.4 + (i % 3) * 0.2}s` }}
                  className="w-1 bg-gradient-to-t from-indigo-500 to-emerald-400 rounded-full animate-pulse"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
