import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface RotaryPanKnobProps {
  /**
   * Pan value ranging from -100 (100% Left) to +100 (100% Right), 0 is Center.
   */
  value: number;
  /**
   * Callback invoked whenever the pan value changes via user interaction.
   */
  onChange: (newValue: number) => void;
  /**
   * Diameter of the rotary knob in pixels (default 42).
   */
  size?: number;
  /**
   * Accent color for the active arc and pointer (default: cyan/indigo tone).
   */
  trackColor?: string;
  /**
   * Channel label or strip identifier (e.g. 'Track 1').
   */
  label?: string;
  /**
   * If true, visually indicates that pan is currently being driven by automation envelopes.
   */
  isAutomated?: boolean;
  /**
   * Theme mode (dark mode default: true).
   */
  isDarkMode?: boolean;
  /**
   * Disable interaction.
   */
  disabled?: boolean;
  /**
   * Additional className for the wrapper container.
   */
  className?: string;
}

export const RotaryPanKnob: React.FC<RotaryPanKnobProps> = ({
  value,
  onChange,
  size = 40,
  trackColor = '#6366f1', // default indigo
  label = 'PAN',
  isAutomated = false,
  isDarkMode = true,
  disabled = false,
  className = ''
}) => {
  const knobRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startXRef = useRef(0);
  const startValRef = useRef(value);

  // Clamp value to -100 to 100
  const clampedValue = Math.max(-100, Math.min(100, Math.round(value)));

  // Angle geometry: 270 degrees total range (-135° to +135°), 0° is 12 o'clock (Center)
  const angle = (clampedValue / 100) * 135; // -135deg to +135deg

  // Drag interaction handler
  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;

    // Alt + Click or Middle Click resets to Center
    if (e.altKey || e.button === 1) {
      e.preventDefault();
      onChange(0);
      return;
    }

    if (e.button !== 0) return; // only left click

    e.preventDefault();
    isDraggingRef.current = true;
    startYRef.current = e.clientY;
    startXRef.current = e.clientX;
    startValRef.current = clampedValue;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const deltaY = startYRef.current - moveEvent.clientY; // upward drag increases
      const deltaX = moveEvent.clientX - startXRef.current; // rightward drag increases
      const sensitivity = moveEvent.shiftKey ? 0.25 : 0.85; // shift for fine adjustment

      // Combined directional drag (up/right increases, down/left decreases)
      const delta = (deltaY + deltaX) * sensitivity;
      const nextValue = Math.max(-100, Math.min(100, Math.round(startValRef.current + delta)));
      onChange(nextValue);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Touch interaction handler for mobile / trackpads
  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || e.touches.length === 0) return;
    isDraggingRef.current = true;
    startYRef.current = e.touches[0].clientY;
    startXRef.current = e.touches[0].clientX;
    startValRef.current = clampedValue;

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (!isDraggingRef.current || moveEvent.touches.length === 0) return;
      moveEvent.preventDefault();
      const deltaY = startYRef.current - moveEvent.touches[0].clientY;
      const deltaX = moveEvent.touches[0].clientX - startXRef.current;
      const delta = (deltaY + deltaX) * 0.85;
      const nextValue = Math.max(-100, Math.min(100, Math.round(startValRef.current + delta)));
      onChange(nextValue);
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
  };

  // Wheel interaction (fine or standard adjustment)
  const handleWheel = (e: React.WheelEvent) => {
    if (disabled) return;
    e.preventDefault();
    const step = e.shiftKey ? 1 : 4;
    const direction = e.deltaY > 0 ? -step : step;
    const nextValue = Math.max(-100, Math.min(100, clampedValue + direction));
    onChange(nextValue);
  };

  // Double click resets to Dead Center (0)
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onChange(0);
  };

  // SVG arc calculation
  // Center is (radius, radius)
  const radius = size / 2;
  const strokeWidth = 3;
  const arcRadius = radius - strokeWidth - 2;

  // Polar to Cartesian conversion where 0 deg is 12 o'clock
  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians)
    };
  };

  // Build SVG path for arc between two angles
  const describeArc = (x: number, y: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, r, endAngle);
    const end = polarToCartesian(x, y, r, startAngle);
    const largeArcFlag = Math.abs(endAngle - startAngle) <= 180 ? '0' : '1';
    const sweepFlag = endAngle >= startAngle ? '1' : '0';

    return ['M', start.x, start.y, 'A', r, r, 0, largeArcFlag, sweepFlag, end.x, end.y].join(' ');
  };

  // Background track arc from -135° to +135°
  const bgArcPath = describeArc(radius, radius, arcRadius, -135, 135);

  // Active pan arc radiating from center top (0°) towards current angle
  const activeArcPath =
    Math.abs(angle) > 1
      ? angle > 0
        ? describeArc(radius, radius, arcRadius, 0, angle)
        : describeArc(radius, radius, arcRadius, angle, 0)
      : '';

  // Formatted readout
  const formattedPan =
    clampedValue === 0 ? 'C' : clampedValue < 0 ? `L${Math.abs(clampedValue)}` : `R${clampedValue}`;

  return (
    <div
      className={`inline-flex items-center gap-1.5 select-none ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
      title={`Stereo Pan: ${formattedPan} (Double-click/Alt-click to center, Shift+drag for fine tuning)`}
    >
      {/* Pan Label */}
      <span className="text-[9px] font-mono font-bold uppercase text-slate-500 tracking-wider">
        {label}
      </span>

      {/* Snap Left Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(-100)}
        className="text-[9px] font-mono px-1 py-0.5 rounded text-slate-500 hover:text-cyan-400 hover:bg-slate-800/80 transition cursor-pointer"
        title="Snap 100% Left"
      >
        L
      </button>

      {/* Rotary Knob Dial */}
      <div
        ref={knobRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        style={{ width: size, height: size }}
        className="relative cursor-ns-resize group touch-none shrink-0"
      >
        <svg width={size} height={size} className="overflow-visible">
          {/* Subtle Outer Bezel / Glow */}
          <circle
            cx={radius}
            cy={radius}
            r={radius - 1}
            fill="none"
            stroke={isAutomated ? '#f59e0b' : '#334155'}
            strokeWidth="0.75"
            strokeDasharray={isAutomated ? '2,2' : undefined}
            className={`transition-colors ${isAutomated ? 'animate-pulse' : ''}`}
          />

          {/* Background Arc Track (-135° to +135°) */}
          <path
            d={bgArcPath}
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Center Detent Tick at 12 o'clock */}
          <line
            x1={radius}
            y1={radius - arcRadius - 2}
            x2={radius}
            y2={radius - arcRadius + 2}
            stroke={clampedValue === 0 ? '#38bdf8' : '#64748b'}
            strokeWidth={clampedValue === 0 ? '2' : '1'}
          />

          {/* Hard Left Tick (-135°) */}
          {(() => {
            const p = polarToCartesian(radius, radius, arcRadius, -135);
            return <circle cx={p.x} cy={p.y} r="1" fill="#64748b" />;
          })()}

          {/* Hard Right Tick (+135°) */}
          {(() => {
            const p = polarToCartesian(radius, radius, arcRadius, 135);
            return <circle cx={p.x} cy={p.y} r="1" fill="#64748b" />;
          })()}

          {/* Active Radiating Arc (Cyan/Indigo/Track Color) */}
          {activeArcPath && (
            <path
              d={activeArcPath}
              fill="none"
              stroke={clampedValue < 0 ? '#38bdf8' : trackColor}
              strokeWidth={strokeWidth + 0.5}
              strokeLinecap="round"
              className="filter drop-shadow-[0_0_3px_rgba(56,189,248,0.5)]"
            />
          )}

          {/* Rotary Knob Face Inner Cap */}
          <circle
            cx={radius}
            cy={radius}
            r={arcRadius - 3}
            className="fill-slate-900 group-hover:fill-slate-850 transition-colors"
            stroke="#334155"
            strokeWidth="1"
          />

          {/* Metallic Inner Gradient Layer */}
          <circle
            cx={radius}
            cy={radius}
            r={arcRadius - 5}
            fill="url(#panKnobGrad)"
            stroke="#1e293b"
            strokeWidth="0.5"
          />

          {/* SVG Linear Gradient for Realistic Hardware Knob Finish */}
          <defs>
            <radialGradient id="panKnobGrad" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="70%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>
          </defs>

          {/* Needle Pointer indicator */}
          {(() => {
            const needleLen = arcRadius - 4;
            const needleTip = polarToCartesian(radius, radius, needleLen, angle);
            const needleBase = polarToCartesian(radius, radius, 3, angle);
            return (
              <line
                x1={needleBase.x}
                y1={needleBase.y}
                x2={needleTip.x}
                y2={needleTip.y}
                stroke={clampedValue === 0 ? '#38bdf8' : '#ffffff'}
                strokeWidth="2"
                strokeLinecap="round"
                className="filter drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]"
              />
            );
          })()}

          {/* Central Pivot Dot */}
          <circle
            cx={radius}
            cy={radius}
            r="2"
            fill={clampedValue === 0 ? '#38bdf8' : '#94a3b8'}
          />
        </svg>

        {/* Automation Status Badge */}
        {isAutomated && (
          <span
            className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-slate-950 animate-ping"
            title="Pan parameter currently driven by automation lane"
          />
        )}
      </div>

      {/* Snap Right Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(100)}
        className="text-[9px] font-mono px-1 py-0.5 rounded text-slate-500 hover:text-indigo-400 hover:bg-slate-800/80 transition cursor-pointer"
        title="Snap 100% Right"
      >
        R
      </button>

      {/* Numerical readout display with center reset on click */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(0)}
        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-tight text-center min-w-[36px] transition border cursor-pointer ${
          clampedValue === 0
            ? 'bg-slate-900/90 text-sky-400 border-sky-500/30 hover:border-sky-400'
            : clampedValue < 0
            ? 'bg-slate-900/90 text-cyan-300 border-cyan-500/30 hover:border-cyan-400'
            : 'bg-slate-900/90 text-indigo-300 border-indigo-500/30 hover:border-indigo-400'
        }`}
        title="Current stereo position (Click to reset to Center)"
      >
        {formattedPan}
      </button>
    </div>
  );
};
