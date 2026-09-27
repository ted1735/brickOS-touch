import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Power,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Zap,
  Activity,
  ChevronRight,
  Info
} from 'lucide-react';
import { DawEffectsState, DawLimiter, LufsMeasurementData } from '../types';
import { audioMiniDaw } from '../utils/audioEngine';

interface MasteringRackProps {
  effects: DawEffectsState;
  onUpdateEffect: <K extends keyof DawEffectsState>(category: K, param: string, value: any) => void;
  lufsData?: LufsMeasurementData;
  isDarkMode?: boolean;
  className?: string;
}

export const MasteringRack: React.FC<MasteringRackProps> = ({
  effects,
  onUpdateEffect,
  lufsData,
  isDarkMode = true,
  className = ''
}) => {
  // Real-time gain reduction polling for Compressor & Limiter meters
  const [compGrDb, setCompGrDb] = useState<number>(0);
  const [limiterGrDb, setLimiterGrDb] = useState<number>(0);

  // Fallback limiter state if not defined in older snapshots
  const limiter: DawLimiter = effects.limiter || {
    ceiling: effects.truePeakCeilingDb ?? -1.0,
    threshold: -1.0,
    release: 0.05,
    lookahead: 5,
    enabled: true
  };

  useEffect(() => {
    let animId: number;
    const pollReduction = () => {
      const compGr = audioMiniDaw.getCompressorGainReduction();
      const limGr = audioMiniDaw.getLimiterGainReduction();
      setCompGrDb(compGr);
      setLimiterGrDb(limGr);
      animId = requestAnimationFrame(pollReduction);
    };
    animId = requestAnimationFrame(pollReduction);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Quick module toggle handlers
  const handleToggleEq = () => {
    onUpdateEffect('eq', 'enabled', !effects.eq.enabled);
  };

  const handleToggleCompressor = () => {
    onUpdateEffect('compressor', 'enabled', !effects.compressor.enabled);
  };

  const handleToggleLimiter = () => {
    const updatedLimiter: DawLimiter = {
      ...limiter,
      enabled: !limiter.enabled
    };
    onUpdateEffect('limiter' as any, '', updatedLimiter);
    // Also sync truePeakCeilingDb
    onUpdateEffect('truePeakCeilingDb' as any, '', updatedLimiter.ceiling);
  };

  const handleUpdateLimiterParam = (param: keyof DawLimiter, value: number | boolean) => {
    const updatedLimiter: DawLimiter = {
      ...limiter,
      [param]: value
    };
    onUpdateEffect('limiter' as any, '', updatedLimiter);
    if (param === 'ceiling') {
      onUpdateEffect('truePeakCeilingDb' as any, '', value);
      audioMiniDaw.setTargetLufs(effects.targetLufs || -14.0, value as number);
    }
  };

  // Master Rack presets
  const handleApplyRackPreset = (presetName: string) => {
    if (presetName === 'transparent_glue') {
      onUpdateEffect('eq', 'low', 1.0);
      onUpdateEffect('eq', 'mid', -0.5);
      onUpdateEffect('eq', 'high', 1.5);
      onUpdateEffect('eq', 'enabled', true);

      onUpdateEffect('compressor', 'threshold', -16);
      onUpdateEffect('compressor', 'ratio', 2.2);
      onUpdateEffect('compressor', 'attack', 0.025);
      onUpdateEffect('compressor', 'release', 0.22);
      onUpdateEffect('compressor', 'makeup', 1.8);
      onUpdateEffect('compressor', 'enabled', true);

      handleUpdateLimiterParam('ceiling', -1.0);
      handleUpdateLimiterParam('threshold', -1.0);
      handleUpdateLimiterParam('release', 0.05);
      handleUpdateLimiterParam('enabled', true);
    } else if (presetName === 'punchy_slam') {
      onUpdateEffect('eq', 'low', 2.2);
      onUpdateEffect('eq', 'mid', 0.5);
      onUpdateEffect('eq', 'high', 2.4);
      onUpdateEffect('eq', 'enabled', true);

      onUpdateEffect('compressor', 'threshold', -22);
      onUpdateEffect('compressor', 'ratio', 3.5);
      onUpdateEffect('compressor', 'attack', 0.015);
      onUpdateEffect('compressor', 'release', 0.15);
      onUpdateEffect('compressor', 'makeup', 3.2);
      onUpdateEffect('compressor', 'enabled', true);

      handleUpdateLimiterParam('ceiling', -0.3);
      handleUpdateLimiterParam('threshold', -3.0);
      handleUpdateLimiterParam('release', 0.04);
      handleUpdateLimiterParam('enabled', true);
    } else if (presetName === 'silky_sheen') {
      onUpdateEffect('eq', 'low', 1.5);
      onUpdateEffect('eq', 'mid', 1.2);
      onUpdateEffect('eq', 'high', 3.0);
      onUpdateEffect('eq', 'enabled', true);

      onUpdateEffect('compressor', 'threshold', -18);
      onUpdateEffect('compressor', 'ratio', 2.8);
      onUpdateEffect('compressor', 'attack', 0.02);
      onUpdateEffect('compressor', 'release', 0.25);
      onUpdateEffect('compressor', 'makeup', 2.2);
      onUpdateEffect('compressor', 'enabled', true);

      handleUpdateLimiterParam('ceiling', -0.8);
      handleUpdateLimiterParam('threshold', -1.5);
      handleUpdateLimiterParam('release', 0.05);
      handleUpdateLimiterParam('enabled', true);
    } else if (presetName === 'dynamic_audiophile') {
      onUpdateEffect('eq', 'low', 0.5);
      onUpdateEffect('eq', 'mid', 0.0);
      onUpdateEffect('eq', 'high', 0.8);
      onUpdateEffect('eq', 'enabled', true);

      onUpdateEffect('compressor', 'threshold', -12);
      onUpdateEffect('compressor', 'ratio', 1.6);
      onUpdateEffect('compressor', 'attack', 0.04);
      onUpdateEffect('compressor', 'release', 0.4);
      onUpdateEffect('compressor', 'makeup', 0.8);
      onUpdateEffect('compressor', 'enabled', true);

      handleUpdateLimiterParam('ceiling', -2.0);
      handleUpdateLimiterParam('threshold', 0.0);
      handleUpdateLimiterParam('release', 0.08);
      handleUpdateLimiterParam('enabled', true);
    }
  };

  // Reset all 3 modules to flat unity
  const handleResetRack = () => {
    onUpdateEffect('eq', 'low', 0);
    onUpdateEffect('eq', 'mid', 0);
    onUpdateEffect('eq', 'high', 0);
    onUpdateEffect('eq', 'enabled', true);

    onUpdateEffect('compressor', 'threshold', -18);
    onUpdateEffect('compressor', 'ratio', 2.0);
    onUpdateEffect('compressor', 'attack', 0.02);
    onUpdateEffect('compressor', 'release', 0.25);
    onUpdateEffect('compressor', 'makeup', 0);
    onUpdateEffect('compressor', 'enabled', true);

    handleUpdateLimiterParam('ceiling', -1.0);
    handleUpdateLimiterParam('threshold', 0.0);
    handleUpdateLimiterParam('release', 0.05);
    handleUpdateLimiterParam('lookahead', 5);
    handleUpdateLimiterParam('enabled', true);
  };

  // Compute SVG EQ response curve points based on low/mid/high gains
  const computeEqPath = () => {
    const low = effects.eq.enabled ? effects.eq.low : 0;
    const mid = effects.eq.enabled ? effects.eq.mid : 0;
    const high = effects.eq.enabled ? effects.eq.high : 0;

    // Canvas coordinate space: 240 width x 60 height. Center line is Y=30 (0 dB).
    // Sensitivity: 12 dB = 25px offset
    const scale = 25 / 12;
    const yLow = 30 - low * scale;
    const yMid = 30 - mid * scale;
    const yHigh = 30 - high * scale;

    return `M 0,${yLow.toFixed(1)} C 50,${yLow.toFixed(1)} 80,${yMid.toFixed(1)} 120,${yMid.toFixed(1)} C 160,${yMid.toFixed(1)} 190,${yHigh.toFixed(1)} 240,${yHigh.toFixed(1)}`;
  };

  const allBypassed = !effects.eq.enabled && !effects.compressor.enabled && !limiter.enabled;

  return (
    <div
      className={`rounded-2xl border border-slate-800/90 bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-slate-950 text-slate-100 shadow-2xl overflow-hidden backdrop-blur-md ${className}`}
    >
      {/* ========================================================================= */}
      {/* MASTER RACK HEADER & HARDWARE CHASSIS BAR */}
      {/* ========================================================================= */}
      <div className="relative px-4 py-3.5 bg-slate-950/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Studio Unit Title & Chassis Screws */}
        <div className="flex items-center gap-3">
          {/* Hardware screw left */}
          <div className="hidden sm:flex w-3.5 h-3.5 rounded-full bg-slate-800 border border-slate-700 items-center justify-center shadow-inner">
            <div className="w-2 h-0.5 bg-slate-600 rotate-45" />
          </div>

          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wider uppercase font-mono text-white">
                  Mastering Rack
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30">
                  PRECISION DSP
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                3-Stage Analog Mastering Chain: Equalizer ➔ VCA Bus Compressor ➔ True Peak Limiter
              </p>
            </div>
          </div>
        </div>

        {/* Right: Quick Rack Presets & Global Actions */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Quick Rack Preset Dropdown */}
          <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-lg px-2 py-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-mono text-slate-400 hidden md:inline">Preset:</span>
            <select
              onChange={(e) => handleApplyRackPreset(e.target.value)}
              defaultValue=""
              className="bg-transparent text-[10px] font-mono font-medium text-slate-200 outline-none cursor-pointer"
            >
              <option value="" disabled>Load Mastering Rack Preset...</option>
              <option value="transparent_glue" className="bg-slate-900 text-white">Transparent Streaming Glue (-14 LUFS / -1.0 dBTP)</option>
              <option value="punchy_slam" className="bg-slate-900 text-white">Modern Punch Slam (-9.0 LUFS / -0.3 dBTP)</option>
              <option value="silky_sheen" className="bg-slate-900 text-white">Nashville Silky Sheen (-12.0 LUFS / -0.8 dBTP)</option>
              <option value="dynamic_audiophile" className="bg-slate-900 text-white">Dynamic Audiophile (-18.0 LUFS / -2.0 dBTP)</option>
            </select>
          </div>

          {/* Reset All Modules to Flat */}
          <button
            onClick={handleResetRack}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[10px] font-mono transition border border-slate-700/50 cursor-pointer"
            title="Reset EQ, Compressor, and Limiter to default flat state"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Reset Rack</span>
          </button>

          {/* Master Rack Status Light */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <span
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                allBypassed
                  ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                  : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)] animate-pulse'
              }`}
            />
            <span className="text-[10px] font-mono font-bold text-slate-300 uppercase">
              {allBypassed ? 'ALL BYPASS' : 'ACTIVE'}
            </span>
          </div>

          {/* Hardware screw right */}
          <div className="hidden sm:flex w-3.5 h-3.5 rounded-full bg-slate-800 border border-slate-700 items-center justify-center shadow-inner ml-1">
            <div className="w-2 h-0.5 bg-slate-600 -rotate-45" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3-MODULE MASTERING RACK CHASSIS GRID */}
      {/* ========================================================================= */}
      <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ======================================================================= */}
        {/* MODULE 1: 3-BAND PARAMETRIC MASTER EQ */}
        {/* ======================================================================= */}
        <div
          className={`relative rounded-xl border p-4 transition-all duration-200 flex flex-col justify-between ${
            effects.eq.enabled
              ? 'bg-slate-950/90 border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.06)]'
              : 'bg-slate-950/40 border-slate-800/60 opacity-70'
          }`}
        >
          {/* Module Header & Bypass Toggle */}
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    effects.eq.enabled
                      ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                      : 'bg-slate-700'
                  }`}
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-cyan-400 font-bold">01</span>
                    <span className="text-xs font-black tracking-wide text-white font-mono uppercase">
                      Parametric EQ
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 block -mt-0.5">
                    Baxandall Shelves & Sheen
                  </span>
                </div>
              </div>

              {/* Module On/Off Switch */}
              <button
                type="button"
                onClick={handleToggleEq}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase transition border cursor-pointer ${
                  effects.eq.enabled
                    ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50 shadow-xs'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Power className="w-3 h-3" />
                <span>{effects.eq.enabled ? 'ACTIVE' : 'BYPASS'}</span>
              </button>
            </div>

            {/* Simulated Dynamic Frequency Response Curve */}
            <div className="my-3 p-2 bg-slate-900/90 rounded-lg border border-slate-800/80 relative overflow-hidden">
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mb-1">
                <span>SPECTRAL CURVE</span>
                <span className="text-cyan-400">
                  {effects.eq.enabled ? 'ACTIVE FILTER' : 'FLAT'}
                </span>
              </div>
              <div className="h-14 w-full relative flex items-center justify-center">
                {/* Reference Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between opacity-15 pointer-events-none">
                  <div className="border-b border-cyan-300 w-full" />
                  <div className="border-b border-cyan-300 w-full" />
                  <div className="border-b border-cyan-300 w-full" />
                </div>
                <div className="absolute inset-0 flex justify-between opacity-15 pointer-events-none">
                  <div className="border-r border-cyan-300 h-full" />
                  <div className="border-r border-cyan-300 h-full" />
                  <div className="border-r border-cyan-300 h-full" />
                </div>

                <svg viewBox="0 0 240 60" className="w-full h-full overflow-visible">
                  {/* Flat center zero-line */}
                  <line x1="0" y1="30" x2="240" y2="30" stroke="#334155" strokeWidth="1" strokeDasharray="2,2" />
                  {/* Dynamic Response path */}
                  <path
                    d={computeEqPath()}
                    fill="none"
                    stroke={effects.eq.enabled ? '#22d3ee' : '#64748b'}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="transition-all duration-150"
                  />
                  {/* Area glow under curve */}
                  <path
                    d={`${computeEqPath()} L 240,60 L 0,60 Z`}
                    fill={effects.eq.enabled ? 'rgba(34,211,238,0.08)' : 'transparent'}
                  />
                </svg>
              </div>
              <div className="flex justify-between text-[8px] font-mono text-slate-400 mt-1">
                <span>80Hz</span>
                <span>500Hz</span>
                <span>1kHz</span>
                <span>5kHz</span>
                <span>10kHz+</span>
              </div>
            </div>

            {/* EQ Sliders */}
            <div className="space-y-3">
              {/* Low Shelf (80 Hz) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-300 flex items-center gap-1 font-semibold">
                    LOW SHELF (80 Hz)
                  </span>
                  <span
                    className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                      effects.eq.low > 0
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/40'
                        : effects.eq.low < 0
                        ? 'bg-rose-950 text-rose-300 border border-rose-800/40'
                        : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {effects.eq.low > 0 ? `+${effects.eq.low.toFixed(1)}` : effects.eq.low.toFixed(1)} dB
                  </span>
                </div>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="0.5"
                  value={effects.eq.low}
                  onChange={(e) => onUpdateEffect('eq', 'low', parseFloat(e.target.value))}
                  disabled={!effects.eq.enabled}
                  className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-400">
                  <button
                    type="button"
                    onClick={() => onUpdateEffect('eq', 'low', -2)}
                    disabled={!effects.eq.enabled}
                    className="hover:text-cyan-300 cursor-pointer disabled:pointer-events-none"
                  >
                    -2dB Cut
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateEffect('eq', 'low', 0)}
                    disabled={!effects.eq.enabled}
                    className="hover:text-cyan-300 cursor-pointer disabled:pointer-events-none"
                  >
                    0dB Flat
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateEffect('eq', 'low', 2)}
                    disabled={!effects.eq.enabled}
                    className="hover:text-cyan-300 cursor-pointer disabled:pointer-events-none"
                  >
                    +2dB Boost
                  </button>
                </div>
              </div>

              {/* Mid Bell (1 kHz) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-300 flex items-center gap-1 font-semibold">
                    MID BELL (1 kHz, Q=1.0)
                  </span>
                  <span
                    className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                      effects.eq.mid > 0
                        ? 'bg-teal-950 text-teal-300 border border-teal-800/40'
                        : effects.eq.mid < 0
                        ? 'bg-rose-950 text-rose-300 border border-rose-800/40'
                        : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {effects.eq.mid > 0 ? `+${effects.eq.mid.toFixed(1)}` : effects.eq.mid.toFixed(1)} dB
                  </span>
                </div>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="0.5"
                  value={effects.eq.mid}
                  onChange={(e) => onUpdateEffect('eq', 'mid', parseFloat(e.target.value))}
                  disabled={!effects.eq.enabled}
                  className="w-full accent-teal-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-400">
                  <button
                    type="button"
                    onClick={() => onUpdateEffect('eq', 'mid', -1.5)}
                    disabled={!effects.eq.enabled}
                    className="hover:text-teal-300 cursor-pointer disabled:pointer-events-none"
                  >
                    -1.5dB Dip
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateEffect('eq', 'mid', 0)}
                    disabled={!effects.eq.enabled}
                    className="hover:text-teal-300 cursor-pointer disabled:pointer-events-none"
                  >
                    0dB Flat
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateEffect('eq', 'mid', 1.5)}
                    disabled={!effects.eq.enabled}
                    className="hover:text-teal-300 cursor-pointer disabled:pointer-events-none"
                  >
                    +1.5dB Presence
                  </button>
                </div>
              </div>

              {/* High Shelf (10 kHz) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-300 flex items-center gap-1 font-semibold">
                    HIGH SHELF (10 kHz Air)
                  </span>
                  <span
                    className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                      effects.eq.high > 0
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                        : effects.eq.high < 0
                        ? 'bg-rose-950 text-rose-300 border border-rose-800/40'
                        : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {effects.eq.high > 0 ? `+${effects.eq.high.toFixed(1)}` : effects.eq.high.toFixed(1)} dB
                  </span>
                </div>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="0.5"
                  value={effects.eq.high}
                  onChange={(e) => onUpdateEffect('eq', 'high', parseFloat(e.target.value))}
                  disabled={!effects.eq.enabled}
                  className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-400">
                  <button
                    type="button"
                    onClick={() => onUpdateEffect('eq', 'high', 0)}
                    disabled={!effects.eq.enabled}
                    className="hover:text-emerald-300 cursor-pointer disabled:pointer-events-none"
                  >
                    0dB Flat
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateEffect('eq', 'high', 2.0)}
                    disabled={!effects.eq.enabled}
                    className="hover:text-emerald-300 cursor-pointer disabled:pointer-events-none"
                  >
                    +2dB Air Sheen
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateEffect('eq', 'high', 3.5)}
                    disabled={!effects.eq.enabled}
                    className="hover:text-emerald-300 cursor-pointer disabled:pointer-events-none"
                  >
                    +3.5dB High Shimmer
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick zero out button */}
          <div className="pt-3 border-t border-slate-800/80 mt-3 flex items-center justify-between text-[10px] font-mono">
            <span className="text-slate-400">Response Mode: Linear-Phase</span>
            <button
              type="button"
              onClick={() => {
                onUpdateEffect('eq', 'low', 0);
                onUpdateEffect('eq', 'mid', 0);
                onUpdateEffect('eq', 'high', 0);
              }}
              disabled={!effects.eq.enabled}
              className="text-slate-400 hover:text-cyan-300 transition flex items-center gap-1 cursor-pointer disabled:pointer-events-none"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Zero EQ</span>
            </button>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* MODULE 2: VCA MASTER BUS DYNAMICS COMPRESSOR */}
        {/* ======================================================================= */}
        <div
          className={`relative rounded-xl border p-4 transition-all duration-200 flex flex-col justify-between ${
            effects.compressor.enabled
              ? 'bg-slate-950/90 border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.06)]'
              : 'bg-slate-950/40 border-slate-800/60 opacity-70'
          }`}
        >
          <div>
            {/* Module Header & Bypass Toggle */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    effects.compressor.enabled
                      ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]'
                      : 'bg-slate-700'
                  }`}
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-indigo-400 font-bold">02</span>
                    <span className="text-xs font-black tracking-wide text-white font-mono uppercase">
                      VCA Bus Compressor
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 block -mt-0.5">
                    Master Bus Glue & Transients
                  </span>
                </div>
              </div>

              {/* Module On/Off Switch */}
              <button
                type="button"
                onClick={handleToggleCompressor}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase transition border cursor-pointer ${
                  effects.compressor.enabled
                    ? 'bg-indigo-950/80 text-indigo-300 border-indigo-500/50 shadow-xs'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Power className="w-3 h-3" />
                <span>{effects.compressor.enabled ? 'ACTIVE' : 'BYPASS'}</span>
              </button>
            </div>

            {/* Real-Time Gain Reduction LED Meter */}
            <div className="my-3 p-2.5 bg-slate-900/90 rounded-lg border border-slate-800/80 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-400">GAIN REDUCTION (GR):</span>
                <span
                  className={`font-bold font-mono px-1.5 py-0.2 rounded text-[10px] ${
                    compGrDb > 0.2
                      ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/40'
                      : 'text-slate-500'
                  }`}
                >
                  {compGrDb > 0 ? `-${compGrDb.toFixed(1)} dB` : '0.0 dB'}
                </span>
              </div>

              {/* Reduction bar display */}
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 transition-all duration-75"
                  style={{
                    width: `${Math.min(100, (compGrDb / 12) * 100)}%`
                  }}
                />
              </div>

              <div className="flex justify-between text-[8px] font-mono text-slate-400">
                <span>0dB</span>
                <span>-2dB</span>
                <span>-4dB</span>
                <span>-8dB</span>
                <span>-12dB+</span>
              </div>
            </div>

            {/* Compressor Parameter Sliders */}
            <div className="space-y-3">
              {/* Threshold */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-300 font-semibold">THRESHOLD</span>
                  <span className="text-indigo-300 font-bold px-1.5 py-0.2 rounded bg-indigo-950/70 border border-indigo-900/40">
                    {effects.compressor.threshold} dB
                  </span>
                </div>
                <input
                  type="range"
                  min="-40"
                  max="0"
                  step="1"
                  value={effects.compressor.threshold}
                  onChange={(e) => onUpdateEffect('compressor', 'threshold', parseFloat(e.target.value))}
                  disabled={!effects.compressor.enabled}
                  className="w-full accent-indigo-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
                />
              </div>

              {/* Ratio */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-300 font-semibold">RATIO</span>
                  <span className="text-indigo-300 font-bold px-1.5 py-0.2 rounded bg-indigo-950/70 border border-indigo-900/40">
                    {effects.compressor.ratio.toFixed(1)}:1
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={effects.compressor.ratio}
                  onChange={(e) => onUpdateEffect('compressor', 'ratio', parseFloat(e.target.value))}
                  disabled={!effects.compressor.enabled}
                  className="w-full accent-indigo-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
                />
                <div className="flex gap-1 pt-0.5">
                  {[2.0, 2.5, 4.0, 8.0].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => onUpdateEffect('compressor', 'ratio', r)}
                      disabled={!effects.compressor.enabled}
                      className={`flex-1 py-0.5 text-[9px] font-mono rounded border transition cursor-pointer disabled:pointer-events-none ${
                        effects.compressor.ratio === r
                          ? 'bg-indigo-900 text-indigo-200 border-indigo-600'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {r}:1
                    </button>
                  ))}
                </div>
              </div>

              {/* Attack & Release grid */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {/* Attack */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-slate-400">ATTACK:</span>
                    <span className="text-indigo-300 font-bold">
                      {Math.round(effects.compressor.attack * 1000)}ms
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.001"
                    max="0.08"
                    step="0.002"
                    value={effects.compressor.attack}
                    onChange={(e) => onUpdateEffect('compressor', 'attack', parseFloat(e.target.value))}
                    disabled={!effects.compressor.enabled}
                    className="w-full accent-indigo-400 h-1 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
                  />
                </div>

                {/* Release */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-slate-400">RELEASE:</span>
                    <span className="text-indigo-300 font-bold">
                      {Math.round(effects.compressor.release * 1000)}ms
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.8"
                    step="0.02"
                    value={effects.compressor.release}
                    onChange={(e) => onUpdateEffect('compressor', 'release', parseFloat(e.target.value))}
                    disabled={!effects.compressor.enabled}
                    className="w-full accent-indigo-400 h-1 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
                  />
                </div>
              </div>

              {/* Makeup Gain */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-300 font-semibold">MAKEUP GAIN</span>
                  <span className="text-indigo-300 font-bold px-1.5 py-0.2 rounded bg-indigo-950/70 border border-indigo-900/40">
                    +{effects.compressor.makeup.toFixed(1)} dB
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="8"
                  step="0.5"
                  value={effects.compressor.makeup}
                  onChange={(e) => onUpdateEffect('compressor', 'makeup', parseFloat(e.target.value))}
                  disabled={!effects.compressor.enabled}
                  className="w-full accent-indigo-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 mt-3 flex items-center justify-between text-[10px] font-mono">
            <span className="text-slate-400">Knee: 6dB Soft Analog</span>
            <span className="text-indigo-400">Stereo Linked</span>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* MODULE 3: BRICKWALL MASTER LIMITER & TRUE PEAK CEILING GUARD */}
        {/* ======================================================================= */}
        <div
          className={`relative rounded-xl border p-4 transition-all duration-200 flex flex-col justify-between ${
            limiter.enabled
              ? 'bg-slate-950/90 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.06)]'
              : 'bg-slate-950/40 border-slate-800/60 opacity-70'
          }`}
        >
          <div>
            {/* Module Header & Bypass Toggle */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    limiter.enabled
                      ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                      : 'bg-slate-700'
                  }`}
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-amber-400 font-bold">03</span>
                    <span className="text-xs font-black tracking-wide text-white font-mono uppercase">
                      Brickwall Limiter
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 block -mt-0.5">
                    True Peak Guard & Lookahead
                  </span>
                </div>
              </div>

              {/* Module On/Off Switch */}
              <button
                type="button"
                onClick={handleToggleLimiter}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase transition border cursor-pointer ${
                  limiter.enabled
                    ? 'bg-amber-950/80 text-amber-300 border-amber-500/50 shadow-xs'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Power className="w-3 h-3" />
                <span>{limiter.enabled ? 'ACTIVE' : 'BYPASS'}</span>
              </button>
            </div>

            {/* Live Limiter Peak & Guard status readout */}
            <div className="my-3 p-2.5 bg-slate-900/90 rounded-lg border border-slate-800/80 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-400">LIMITER REDUCTION:</span>
                <span
                  className={`font-bold font-mono px-1.5 py-0.2 rounded text-[10px] ${
                    limiterGrDb > 0.1
                      ? 'bg-amber-950 text-amber-300 border border-amber-800/40'
                      : 'text-slate-500'
                  }`}
                >
                  {limiterGrDb > 0 ? `-${limiterGrDb.toFixed(1)} dB` : '0.0 dB'}
                </span>
              </div>

              {/* Limiter meter bar */}
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 via-rose-400 to-rose-600 transition-all duration-75"
                  style={{
                    width: `${Math.min(100, (limiterGrDb / 8) * 100)}%`
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-[9px] font-mono">
                <div className="flex items-center gap-1 text-slate-400">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Inter-Sample Guard:</span>
                  <span className={limiter.enabled ? 'text-emerald-300 font-bold' : 'text-slate-500'}>
                    {limiter.enabled ? 'ENGAGED' : 'OFF'}
                  </span>
                </div>
                {lufsData && (
                  <span className={`font-bold ${lufsData.truePeakDb > limiter.ceiling ? 'text-rose-400' : 'text-slate-300'}`}>
                    TP: {lufsData.truePeakDb > -60 ? `${lufsData.truePeakDb.toFixed(1)} dBTP` : '-inf'}
                  </span>
                )}
              </div>
            </div>

            {/* Limiter Parameter Sliders */}
            <div className="space-y-3">
              {/* Ceiling (dBTP) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-300 font-semibold">TRUE PEAK CEILING</span>
                  <span className="text-amber-300 font-bold px-1.5 py-0.2 rounded bg-amber-950/70 border border-amber-900/40">
                    {limiter.ceiling.toFixed(1)} dBTP
                  </span>
                </div>
                <input
                  type="range"
                  min="-3.0"
                  max="0.0"
                  step="0.1"
                  value={limiter.ceiling}
                  onChange={(e) => handleUpdateLimiterParam('ceiling', parseFloat(e.target.value))}
                  disabled={!limiter.enabled}
                  className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
                />

                {/* Standard Platform Ceiling Presets */}
                <div className="grid grid-cols-4 gap-1 pt-1">
                  {[
                    { label: '-1.0', title: 'Universal Streaming Standard', val: -1.0 },
                    { label: '-0.8', title: 'Radio / Commercial Hot 100', val: -0.8 },
                    { label: '-0.3', title: 'EDM / Club Loud', val: -0.3 },
                    { label: '-2.0', title: 'Audiophile / Classical', val: -2.0 }
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => handleUpdateLimiterParam('ceiling', preset.val)}
                      disabled={!limiter.enabled}
                      title={preset.title}
                      className={`py-1 text-[9px] font-mono rounded border transition cursor-pointer disabled:pointer-events-none ${
                        limiter.ceiling === preset.val
                          ? 'bg-amber-900 text-amber-200 border-amber-600 font-bold'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {preset.label} dB
                    </button>
                  ))}
                </div>
              </div>

              {/* Threshold / Drive */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-300 font-semibold">THRESHOLD / DRIVE</span>
                  <span className="text-amber-300 font-bold px-1.5 py-0.2 rounded bg-amber-950/70 border border-amber-900/40">
                    {limiter.threshold.toFixed(1)} dB
                  </span>
                </div>
                <input
                  type="range"
                  min="-12.0"
                  max="0.0"
                  step="0.5"
                  value={limiter.threshold}
                  onChange={(e) => handleUpdateLimiterParam('threshold', parseFloat(e.target.value))}
                  disabled={!limiter.enabled}
                  className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
                />
              </div>

              {/* Release & Lookahead */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {/* Release */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-slate-400">RELEASE:</span>
                    <span className="text-amber-300 font-bold">
                      {Math.round(limiter.release * 1000)}ms
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.30"
                    step="0.01"
                    value={limiter.release}
                    onChange={(e) => handleUpdateLimiterParam('release', parseFloat(e.target.value))}
                    disabled={!limiter.enabled}
                    className="w-full accent-amber-400 h-1 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
                  />
                </div>

                {/* Lookahead */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-slate-400">LOOKAHEAD:</span>
                    <span className="text-amber-300 font-bold">
                      {limiter.lookahead ?? 5}ms
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={limiter.lookahead ?? 5}
                    onChange={(e) => handleUpdateLimiterParam('lookahead', parseInt(e.target.value))}
                    disabled={!limiter.enabled}
                    className="w-full accent-amber-400 h-1 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 mt-3 flex items-center justify-between text-[10px] font-mono">
            <span className="text-slate-400">Ratio: 20:1 Brickwall</span>
            <span className="text-amber-400">ISP Protection: On</span>
          </div>
        </div>
      </div>
    </div>
  );
};
