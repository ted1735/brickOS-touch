import React, { useRef, useState, useCallback } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface TactileFaderProps {
  label: string;
  value: number; // 0 to 100
  onChange: (val: number) => void;
  defaultValue?: number;
  min?: number;
  max?: number;
  unit?: string;
  isMuted?: boolean;
  color?: string; // hex or tailwind class
  isDarkMode?: boolean;
}

export const TactileFader: React.FC<TactileFaderProps> = ({
  label,
  value,
  onChange,
  defaultValue = 80,
  min = 0,
  max = 100,
  unit = '%',
  isMuted = false,
  color = '#6366F1',
  isDarkMode = true
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastTapRef = useRef<number>(0);

  const calculateValueFromPointer = useCallback(
    (clientY: number) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const height = rect.height;
      const offsetY = clientY - rect.top;
      // Invert: top is max, bottom is min
      const clampedY = Math.max(0, Math.min(height, offsetY));
      const percentage = 1 - clampedY / height;
      const calculated = Math.round(min + percentage * (max - min));
      onChange(calculated);
    },
    [min, max, onChange]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    // Check for double-tap to reset
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      onChange(defaultValue);
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;

    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    calculateValueFromPointer(e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      calculateValueFromPointer(e.clientY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture already released
    }
  };

  const fillPercent = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col items-center gap-1.5 select-none touch-manipulation">
      {/* Value Label */}
      <div className="flex items-center gap-1">
        <span
          className={`font-mono text-xs font-black ${
            isMuted ? 'text-rose-400 line-through' : isDarkMode ? 'text-slate-200' : 'text-slate-800'
          }`}
        >
          {isMuted ? 'MUTE' : `${value}${unit}`}
        </span>
      </div>

      {/* Tactile Vertical Track (48px wide touch zone) */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`w-12 h-36 sm:h-40 rounded-2xl relative cursor-pointer touch-none flex flex-col justify-end p-1 transition-all ${
          isDragging ? 'ring-2 ring-indigo-500/70 shadow-lg' : ''
        } ${
          isDarkMode
            ? 'bg-slate-950 border border-slate-800 shadow-inner'
            : 'bg-slate-200/90 border border-slate-300 shadow-inner'
        }`}
        title={`${label}: ${value}${unit} (Drag up/down, Double-tap to reset)`}
      >
        {/* LED Ladder Tick Marks Background */}
        <div className="absolute inset-x-2 inset-y-3 flex flex-col justify-between pointer-events-none opacity-30">
          {[...Array(11)].map((_, i) => (
            <div
              key={i}
              className={`h-0.5 rounded-full ${
                i < 2 ? 'bg-rose-500' : i < 4 ? 'bg-amber-400' : 'bg-slate-500'
              }`}
            />
          ))}
        </div>

        {/* LED Fill Level */}
        <div
          style={{ height: `${fillPercent}%` }}
          className={`w-full rounded-xl transition-all duration-75 relative overflow-hidden ${
            isMuted
              ? 'bg-slate-700/50'
              : 'bg-gradient-to-t from-indigo-600 via-indigo-500 to-emerald-400 opacity-90'
          }`}
        />

        {/* Tactile Grab Knob */}
        <div
          style={{ bottom: `calc(${fillPercent}% - 14px)` }}
          className={`absolute inset-x-0.5 h-7 rounded-xl border-2 flex items-center justify-center shadow-md transition-all pointer-events-none ${
            isDragging
              ? 'scale-105 border-white bg-slate-900 shadow-indigo-500/50'
              : 'border-slate-400/80 bg-slate-900/95 shadow-black/60'
          }`}
        >
          {/* Grip Lines */}
          <div className="flex gap-1 items-center">
            <span className="w-0.5 h-3 bg-slate-400 rounded-full" />
            <span className="w-0.5 h-3 bg-slate-400 rounded-full" />
            <span className="w-0.5 h-3 bg-slate-400 rounded-full" />
          </div>
        </div>
      </div>

      {/* Channel Strip Title */}
      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 truncate max-w-[56px] text-center">
        {label}
      </span>
    </div>
  );
};
