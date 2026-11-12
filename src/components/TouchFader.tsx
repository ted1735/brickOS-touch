import React, { useRef, useState } from 'react';

export interface TouchFaderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  onChange: (value: number) => void;
  color?: string;
  label?: string;
  unit?: string;
  isDarkMode?: boolean;
  disabled?: boolean;
  className?: string;
  showDbScale?: boolean;
}

/**
 * Tactile, high-precision pointer-capture touch fader built for Galaxy Fold & mobile DAW control.
 * Uses setPointerCapture + touch-action: none so horizontal finger drags never fight page scrolling.
 */
export const TouchFader: React.FC<TouchFaderProps> = ({
  value,
  min = 0,
  max = 100,
  step = 1,
  defaultValue = 85,
  onChange,
  color = '#10b981',
  label,
  unit = '%',
  isDarkMode = true,
  disabled = false,
  className = '',
  showDbScale = false
}) => {
  const railRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const clampedValue = Math.max(min, Math.min(max, value));
  const percent = ((clampedValue - min) / (max - min || 1)) * 100;

  const computeValueFromClientX = (clientX: number) => {
    const rail = railRef.current;
    if (!rail) return clampedValue;
    const rect = rail.getBoundingClientRect();
    const usableWidth = Math.max(1, rect.width);
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / usableWidth));
    const rawVal = min + ratio * (max - min);
    const stepped = Math.round(rawVal / step) * step;
    return Math.max(min, Math.min(max, Number(stepped.toFixed(2))));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    onChange(computeValueFromClientX(e.clientX));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || disabled) return;
    e.preventDefault();
    onChange(computeValueFromClientX(e.clientX));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {}
    }
  };

  const handleDoubleClick = () => {
    if (!disabled) {
      onChange(defaultValue);
    }
  };

  const dbDisplay =
    clampedValue <= 0
      ? '-∞ dB'
      : `${(20 * Math.log10(clampedValue / 100)).toFixed(1)} dB`;

  return (
    <div className={`flex flex-col gap-1 select-none ${className}`}>
      {(label || showDbScale) && (
        <div className="flex items-center justify-between text-[10px] font-mono tabular-nums">
          {label && (
            <span className={isDarkMode ? 'text-slate-400 font-semibold' : 'text-slate-600 font-semibold'}>
              {label}
            </span>
          )}
          <span className={`font-bold ${isDragging ? 'text-cyan-400' : isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
            {showDbScale ? dbDisplay : `${Math.round(clampedValue)}${unit}`}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2.5">
        <div
          ref={railRef}
          role="slider"
          aria-label={label || 'Fader'}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={clampedValue}
          tabIndex={disabled ? -1 : 0}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onDoubleClick={handleDoubleClick}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
              e.preventDefault();
              onChange(Math.min(max, clampedValue + step * 2));
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
              e.preventDefault();
              onChange(Math.max(min, clampedValue - step * 2));
            }
          }}
          style={{ touchAction: 'none' }}
          className={`relative flex-1 min-w-[120px] min-h-[44px] flex items-center cursor-pointer rounded-xl px-2 border transition-colors ${
            isDarkMode
              ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              : 'bg-slate-100 border-slate-300 hover:border-slate-400'
          } ${isDragging ? 'ring-2 ring-cyan-500/40 border-cyan-500/60' : ''} ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title="Drag with finger or mouse · Double-tap to reset"
        >
          {/* Background Track Groove */}
          <div className={`w-full h-2.5 rounded-full overflow-hidden relative ${isDarkMode ? 'bg-slate-950' : 'bg-slate-200'}`}>
            {/* Active Fill */}
            <div
              className="h-full rounded-full transition-[width] duration-75"
              style={{
                width: `${percent}%`,
                backgroundColor: color
              }}
            />
          </div>

          {/* 44px Tactile Fader Cap */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-lg border shadow-lg flex items-center justify-center pointer-events-none transition-transform duration-75 ${
              isDarkMode
                ? 'bg-slate-800 border-slate-500 text-slate-200'
                : 'bg-white border-slate-400 text-slate-700'
            } ${isDragging ? 'scale-110 ring-2 ring-cyan-400/50' : ''}`}
            style={{ left: `calc(${Math.max(8, Math.min(92, percent))}%)` }}
          >
            <span className="w-0.5 h-3.5 rounded-full bg-current opacity-70" />
          </div>
        </div>

        <span className={`text-xs font-mono font-bold tabular-nums w-11 text-right shrink-0 ${
          isDarkMode ? 'text-slate-200' : 'text-slate-800'
        }`}>
          {Math.round(clampedValue)}{unit}
        </span>
      </div>
    </div>
  );
};
