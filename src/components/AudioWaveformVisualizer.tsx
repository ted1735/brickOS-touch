import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Volume2, Sparkles, Activity } from 'lucide-react';

interface AudioWaveformVisualizerProps {
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  trackTitle?: string;
  durationSeconds?: number;
  height?: number;
  accentColor?: string;
  targetLufs?: number;
  truePeakCeiling?: number;
  isDarkMode?: boolean;
}

export const AudioWaveformVisualizer: React.FC<AudioWaveformVisualizerProps> = ({
  isPlaying = false,
  onTogglePlay,
  trackTitle = 'Master Stem Mix',
  durationSeconds = 214,
  height = 96,
  accentColor = '#6366f1',
  targetLufs = -12.0,
  truePeakCeiling = -1.0,
  isDarkMode = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [playheadProgress, setPlayheadProgress] = useState(0.24); // 0 to 1
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Generate deterministic audio peak data based on track title for consistent rendering
  const peakData = React.useMemo(() => {
    const bars = 180;
    const data: number[] = [];
    let seed = 42;
    for (let i = 0; i < trackTitle.length; i++) {
      seed += trackTitle.charCodeAt(i);
    }

    for (let i = 0; i < bars; i++) {
      // Create musical dynamics: intro low, verse moderate, build up, chorus loud, bridge drop, final chorus peak
      const phase = i / bars;
      let envelope = 0.5;
      if (phase < 0.15) envelope = 0.35 + 0.2 * Math.sin(phase * Math.PI); // Intro
      else if (phase < 0.35) envelope = 0.6 + 0.2 * Math.sin((phase - 0.15) * 5); // Verse 1
      else if (phase < 0.55) envelope = 0.85 + 0.15 * Math.sin((phase - 0.35) * 8); // Chorus 1
      else if (phase < 0.70) envelope = 0.45 + 0.3 * Math.sin((phase - 0.55) * 4); // Bridge drop
      else envelope = 0.92 + 0.08 * Math.sin((phase - 0.70) * 10); // Final Master Chorus

      // Pseudo-random jitter
      const pseudoRand = Math.abs(Math.sin(seed * (i + 1) * 997)) * 0.35;
      const val = Math.min(1.0, Math.max(0.12, envelope * 0.7 + pseudoRand));
      data.push(val);
    }
    return data;
  }, [trackTitle]);

  // Handle seeking when clicking/dragging on the canvas
  const handleSeek = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const newProgress = x / rect.width;
    setPlayheadProgress(newProgress);
  };

  // Playhead auto-advance when isPlaying
  useEffect(() => {
    let animId: number;
    if (isPlaying) {
      let lastTime = performance.now();
      const update = (now: number) => {
        const delta = (now - lastTime) / 1000;
        lastTime = now;
        setPlayheadProgress(prev => {
          const next = prev + delta / durationSeconds;
          return next >= 1 ? 0 : next;
        });
        animId = requestAnimationFrame(update);
      };
      animId = requestAnimationFrame(update);
    }
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, durationSeconds]);

  // Canvas Waveform Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, width, h);

    const barCount = peakData.length;
    const barWidth = width / barCount;
    const gap = 1.5;
    const midY = h / 2;

    // Background horizontal center rule & dB grid lines
    ctx.strokeStyle = isDarkMode ? 'rgba(51, 65, 85, 0.4)' : 'rgba(203, 213, 225, 0.6)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);

    // -1 dBTP ceiling line (top & bottom)
    const ceilingYTop = h * 0.08;
    const ceilingYBottom = h * 0.92;
    ctx.beginPath();
    ctx.moveTo(0, ceilingYTop);
    ctx.lineTo(width, ceilingYTop);
    ctx.moveTo(0, ceilingYBottom);
    ctx.lineTo(width, ceilingYBottom);
    ctx.stroke();

    // Center 0V line
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(width, midY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw waveform bars
    for (let i = 0; i < barCount; i++) {
      const x = i * barWidth;
      const barProgress = i / barCount;
      const isPast = barProgress <= playheadProgress;
      const barH = peakData[i] * (midY - 8);

      // Color gradient
      if (isPast) {
        ctx.fillStyle = peakData[i] > 0.95 ? '#f43f5e' : accentColor;
      } else {
        ctx.fillStyle = isDarkMode ? 'rgba(71, 85, 105, 0.6)' : 'rgba(148, 163, 184, 0.7)';
      }

      // Draw top and bottom symmetrical bar
      ctx.beginPath();
      ctx.roundRect(x, midY - barH, barWidth - gap, barH * 2, [1]);
      ctx.fill();

      // Transient peak dot
      if (peakData[i] > 0.85) {
        ctx.fillStyle = peakData[i] > 0.95 ? '#fb7185' : '#a5b4fc';
        ctx.fillRect(x, midY - barH - 2, barWidth - gap, 1.5);
      }
    }

    // Playhead line
    const playheadX = playheadProgress * width;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#6366f1';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, h);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Playhead handle
    ctx.fillStyle = '#6366f1';
    ctx.beginPath();
    ctx.arc(playheadX, 6, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [peakData, playheadProgress, accentColor, isDarkMode]);

  // Format current position time
  const currentSecs = Math.floor(playheadProgress * durationSeconds);
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      className={`rounded-2xl border p-4 space-y-3 transition-colors ${
        isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200'
      }`}
    >
      {/* Header controls */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2">
          {onTogglePlay && (
            <button
              type="button"
              onClick={onTogglePlay}
              className={`p-2 rounded-xl text-white font-bold transition flex items-center justify-center cursor-pointer shadow-md ${
                isPlaying ? 'bg-amber-600 hover:bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-500'
              }`}
              title={isPlaying ? 'Pause' : 'Play Interactive Waveform'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white font-mono">{trackTitle}</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 font-mono text-[9px] border border-emerald-800/60 font-bold">
                {targetLufs.toFixed(1)} LUFS
              </span>
              <span className="px-1.5 py-0.2 rounded bg-slate-900 text-slate-300 font-mono text-[9px] border border-slate-800">
                Peak: {truePeakCeiling.toFixed(1)} dBTP
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono">
              Click or drag playhead to scrub • 24-bit / 48kHz Linear PCM Waveform
            </p>
          </div>
        </div>

        {/* Timestamp */}
        <div className="font-mono text-xs text-slate-400">
          <strong className="text-white">{formatTime(currentSecs)}</strong>
          <span> / {formatTime(durationSeconds)}</span>
        </div>
      </div>

      {/* Interactive Waveform Canvas */}
      <div className="relative rounded-xl overflow-hidden bg-slate-900/90 border border-slate-800/80">
        <canvas
          ref={canvasRef}
          width={720}
          height={height}
          onClick={handleSeek}
          onMouseDown={() => setIsScrubbing(true)}
          onMouseUp={() => setIsScrubbing(false)}
          onMouseMove={(e) => {
            if (isScrubbing) handleSeek(e);
          }}
          className="w-full cursor-crosshair block"
        />

        {/* Legend overlays */}
        <div className="absolute top-1 left-2 text-[8px] font-mono text-slate-500 pointer-events-none">
          -1.0 dBTP Ceiling
        </div>
        <div className="absolute bottom-1 right-2 text-[8px] font-mono text-slate-500 pointer-events-none">
          Integrated -12 LUFS Target
        </div>
      </div>
    </div>
  );
};
