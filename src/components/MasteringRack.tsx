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
  Info,
  ArrowRight,
  GripVertical,
  Check,
  Layers,
  Sliders,
  Waves
} from 'lucide-react';
import { DawEffectsState, DawLimiter, LufsMeasurementData, MasteringModuleId } from '../types';
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
  const [limiterPeakHoldDb, setLimiterPeakHoldDb] = useState<number>(0);
  const [simulatedPulseDb, setSimulatedPulseDb] = useState<number>(0);

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
    let peakHoldVal = 0;
    let peakHoldTimestamp = 0;
    let pulseVal = 0;

    const pollReduction = () => {
      const compGr = audioMiniDaw.getCompressorGainReduction();
      let limGr = audioMiniDaw.getLimiterGainReduction();

      // If simulated pulse is active, blend it in
      if (pulseVal > 0.05) {
        pulseVal *= 0.92; // smooth decay
        setSimulatedPulseDb(pulseVal);
        limGr = Math.max(limGr, pulseVal);
      } else if (pulseVal !== 0) {
        pulseVal = 0;
        setSimulatedPulseDb(0);
      }

      setCompGrDb(compGr);
      setLimiterGrDb(limGr);

      const now = Date.now();
      if (limGr >= peakHoldVal) {
        peakHoldVal = limGr;
        peakHoldTimestamp = now;
        setLimiterPeakHoldDb(peakHoldVal);
      } else if (now - peakHoldTimestamp > 1400) {
        peakHoldVal = Math.max(0, peakHoldVal - 0.12);
        setLimiterPeakHoldDb(peakHoldVal);
      }

      animId = requestAnimationFrame(pollReduction);
    };
    animId = requestAnimationFrame(pollReduction);
    return () => cancelAnimationFrame(animId);
  }, []);

  const triggerAuditionPulse = () => {
    // Generate a lively dynamic peak burst to test limiter ballistics
    const burst = 3.8 + Math.random() * 2.2;
    setSimulatedPulseDb(burst);
    setLimiterGrDb(burst);
  };

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

  // Module Signal Chain Order & Drag-and-Drop state
  const [moduleOrder, setModuleOrder] = useState<MasteringModuleId[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('brickos_mastering_module_order');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length === 3 && parsed.includes('eq') && parsed.includes('compressor') && parsed.includes('limiter')) {
            return parsed as MasteringModuleId[];
          }
        }
      } catch (_) {}
    }
    return ['eq', 'compressor', 'limiter'];
  });
  const [draggingModule, setDraggingModule] = useState<MasteringModuleId | null>(null);
  const [dragOverModule, setDragOverModule] = useState<MasteringModuleId | null>(null);

  const handleDragStart = (e: React.DragEvent, id: MasteringModuleId) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingModule(id);
  };

  const handleDragOver = (e: React.DragEvent, id: MasteringModuleId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverModule !== id) {
      setDragOverModule(id);
    }
  };

  const handleDragLeave = () => {
    setDragOverModule(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: MasteringModuleId) => {
    e.preventDefault();
    const sourceId = (e.dataTransfer.getData('text/plain') as MasteringModuleId) || draggingModule;
    setDraggingModule(null);
    setDragOverModule(null);

    if (!sourceId || sourceId === targetId) return;

    const newOrder = [...moduleOrder];
    const sourceIdx = newOrder.indexOf(sourceId);
    const targetIdx = newOrder.indexOf(targetId);
    if (sourceIdx !== -1 && targetIdx !== -1) {
      newOrder.splice(sourceIdx, 1);
      newOrder.splice(targetIdx, 0, sourceId);
      setModuleOrder(newOrder);
      try {
        localStorage.setItem('brickos_mastering_module_order', JSON.stringify(newOrder));
      } catch (_) {}
    }
  };

  const handleResetModuleOrder = () => {
    const defaultOrder: MasteringModuleId[] = ['eq', 'compressor', 'limiter'];
    setModuleOrder(defaultOrder);
    try {
      localStorage.setItem('brickos_mastering_module_order', JSON.stringify(defaultOrder));
    } catch (_) {}
  };

  const moveModuleIndex = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= moduleOrder.length) return;
    const newOrder = [...moduleOrder];
    const item = newOrder[index];
    newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, item);
    setModuleOrder(newOrder);
    try {
      localStorage.setItem('brickos_mastering_module_order', JSON.stringify(newOrder));
    } catch (_) {}
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
      {/* VISUAL SIGNAL CHAIN FLOW INDICATOR & DRAG-AND-DROP REORDER BAR */}
      {/* ========================================================================= */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* Left: Signal Chain Status & Explanation */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px]">
            <Waves className="w-3 h-3 text-teal-400" />
            <span className="text-slate-400 font-bold uppercase tracking-wider">Signal Path:</span>
            <span className="text-white font-semibold">Input</span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-teal-300 font-bold">DSP Modules</span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-white font-semibold">Master Out</span>
          </div>

          <span className="text-[10px] text-slate-400 hidden xl:inline">
            Drag badges or use arrows to reorder DSP sequence in real-time
          </span>
        </div>

        {/* Center: Draggable Module Flow Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {moduleOrder.map((modId, index) => {
            const isFirst = index === 0;
            const isLast = index === moduleOrder.length - 1;
            const isDragging = draggingModule === modId;
            const isDragOver = dragOverModule === modId;

            let modLabel = '';
            let modNum = '';
            let isEnabled = false;
            let activeColor = '';
            let borderHover = '';

            if (modId === 'eq') {
              modLabel = 'Parametric EQ';
              modNum = '01';
              isEnabled = effects.eq.enabled;
              activeColor = 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.15)]';
              borderHover = 'border-cyan-400';
            } else if (modId === 'compressor') {
              modLabel = 'VCA Compressor';
              modNum = '02';
              isEnabled = effects.compressor.enabled;
              activeColor = 'bg-indigo-950/80 text-indigo-300 border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.15)]';
              borderHover = 'border-indigo-400';
            } else {
              modLabel = 'Brickwall Limiter';
              modNum = '03';
              isEnabled = limiter.enabled;
              activeColor = 'bg-amber-950/80 text-amber-300 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.15)]';
              borderHover = 'border-amber-400';
            }

            return (
              <React.Fragment key={modId}>
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, modId)}
                  onDragOver={(e) => handleDragOver(e, modId)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, modId)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono select-none transition-all duration-150 cursor-grab active:cursor-grabbing ${
                    isDragging
                      ? 'opacity-40 scale-95 border-dashed border-teal-400'
                      : isDragOver
                      ? `scale-105 ${borderHover} ring-2 ring-teal-400 bg-slate-800`
                      : isEnabled
                      ? activeColor
                      : 'bg-slate-950/60 text-slate-500 border-slate-800 hover:border-slate-700'
                  }`}
                  title={`Stage ${index + 1}: ${modLabel} (${isEnabled ? 'Active' : 'Bypassed'}). Drag to reposition signal order.`}
                >
                  <GripVertical className="w-3 h-3 text-slate-500 shrink-0" />
                  
                  {/* Stage position index badge */}
                  <span className="w-4 h-4 rounded-full bg-slate-900 border border-slate-700 text-[9px] font-bold flex items-center justify-center text-slate-300">
                    {index + 1}
                  </span>

                  <span className="font-bold tracking-tight">{modLabel}</span>

                  {/* Status Indicator Dot */}
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isEnabled ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-slate-600'
                    }`}
                  />

                  {/* Quick Nudge Arrows */}
                  <div className="flex items-center gap-0.5 ml-1 border-l border-slate-700/50 pl-1">
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveModuleIndex(index, 'left');
                      }}
                      className="text-[9px] px-1 hover:text-white disabled:opacity-20 cursor-pointer disabled:pointer-events-none"
                      title="Move earlier in chain"
                    >
                      ◀
                    </button>
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveModuleIndex(index, 'right');
                      }}
                      className="text-[9px] px-1 hover:text-white disabled:opacity-20 cursor-pointer disabled:pointer-events-none"
                      title="Move later in chain"
                    >
                      ▶
                    </button>
                  </div>
                </div>

                {!isLast && (
                  <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Right: Reset Chain Order to Default */}
        <div className="flex items-center gap-2">
          {JSON.stringify(moduleOrder) !== JSON.stringify(['eq', 'compressor', 'limiter']) && (
            <button
              type="button"
              onClick={handleResetModuleOrder}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-mono border border-slate-700 transition cursor-pointer"
              title="Reset signal flow to canonical EQ ➔ Compressor ➔ Limiter"
            >
              Default Order (EQ ➔ Comp ➔ Lim)
            </button>
          )}
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
          style={{ order: moduleOrder.indexOf('eq') }}
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
          style={{ order: moduleOrder.indexOf('compressor') }}
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
          style={{ order: moduleOrder.indexOf('limiter') }}
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

            {/* Live Dynamic Limiter Peak & Gain Reduction LED Meter */}
            <div className="my-3 p-3 bg-slate-950/95 rounded-xl border border-amber-500/30 space-y-2.5 shadow-[0_0_15px_rgba(245,158,11,0.08)]">
              {/* Header: GR and Peak hold telemetry + Audition button */}
              <div className="flex items-center justify-between text-[10px] font-mono flex-wrap gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-semibold tracking-wider">LIMITER GR:</span>
                  <span
                    className={`font-bold font-mono px-1.5 py-0.5 rounded text-[11px] transition-colors ${
                      !limiter.enabled
                        ? 'bg-slate-900 text-slate-500 border border-slate-800'
                        : limiterGrDb > 4.0
                        ? 'bg-rose-950 text-rose-300 border border-rose-800/80 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                        : limiterGrDb > 1.5
                        ? 'bg-amber-950 text-amber-300 border border-amber-800/60 shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                        : limiterGrDb > 0.1
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                        : 'text-slate-500 bg-slate-900 border border-slate-800'
                    }`}
                  >
                    {limiter.enabled ? (limiterGrDb > 0 ? `-${limiterGrDb.toFixed(1)} dB` : '0.0 dB') : 'BYPASS'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-[9px] text-slate-400 font-mono">
                    <span>PEAK:</span>
                    <span className={`font-bold ${limiterPeakHoldDb > 0.1 ? 'text-amber-300' : 'text-slate-600'}`}>
                      {limiterPeakHoldDb > 0 ? `-${limiterPeakHoldDb.toFixed(1)} dB` : '0.0 dB'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={triggerAuditionPulse}
                    disabled={!limiter.enabled}
                    className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-amber-950/60 text-slate-300 hover:text-amber-300 border border-slate-800 hover:border-amber-600/40 text-[9px] font-mono flex items-center gap-1 transition cursor-pointer disabled:opacity-40"
                    title="Simulate a sudden audio peak transient to test real-time limiter meter ballistics and peak hold"
                  >
                    <Zap className="w-2.5 h-2.5 text-amber-400" />
                    <span>Pulse Test</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Hardware LED Meter Bar */}
              <div className="space-y-1">
                <div
                  className="p-1 bg-slate-950 rounded-lg border border-slate-800/90 shadow-inner flex items-center gap-[2.5px] h-6 overflow-hidden"
                  title={`Real-Time Limiter Gain Reduction: -${limiterGrDb.toFixed(1)} dB (Peak Hold: -${limiterPeakHoldDb.toFixed(1)} dB)`}
                >
                  {[
                    { th: 0.2, col: 'emerald', light: 'bg-emerald-400 shadow-[0_0_8px_#34d399]' },
                    { th: 0.4, col: 'emerald', light: 'bg-emerald-400 shadow-[0_0_8px_#34d399]' },
                    { th: 0.6, col: 'emerald', light: 'bg-emerald-400 shadow-[0_0_8px_#34d399]' },
                    { th: 0.8, col: 'emerald', light: 'bg-emerald-400 shadow-[0_0_8px_#34d399]' },
                    { th: 1.0, col: 'emerald', light: 'bg-emerald-400 shadow-[0_0_8px_#34d399]' },
                    { th: 1.3, col: 'lime', light: 'bg-lime-400 shadow-[0_0_8px_#a3e635]' },
                    { th: 1.6, col: 'lime', light: 'bg-lime-400 shadow-[0_0_8px_#a3e635]' },
                    { th: 2.0, col: 'lime', light: 'bg-lime-400 shadow-[0_0_8px_#a3e635]' },
                    { th: 2.4, col: 'lime', light: 'bg-lime-400 shadow-[0_0_8px_#a3e635]' },
                    { th: 2.8, col: 'amber', light: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' },
                    { th: 3.2, col: 'amber', light: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' },
                    { th: 3.6, col: 'amber', light: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' },
                    { th: 4.0, col: 'amber', light: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' },
                    { th: 4.5, col: 'amber', light: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' },
                    { th: 5.0, col: 'orange', light: 'bg-orange-500 shadow-[0_0_8px_#f97316]' },
                    { th: 5.6, col: 'orange', light: 'bg-orange-500 shadow-[0_0_8px_#f97316]' },
                    { th: 6.2, col: 'orange', light: 'bg-orange-500 shadow-[0_0_8px_#f97316]' },
                    { th: 7.0, col: 'rose', light: 'bg-rose-500 shadow-[0_0_9px_#f43f5e]' },
                    { th: 8.0, col: 'rose', light: 'bg-rose-500 shadow-[0_0_10px_#f43f5e]' },
                    { th: 9.0, col: 'rose', light: 'bg-rose-600 shadow-[0_0_11px_#e11d48]' },
                    { th: 10.0, col: 'rose', light: 'bg-rose-600 shadow-[0_0_12px_#e11d48]' },
                    { th: 12.0, col: 'rose', light: 'bg-rose-600 shadow-[0_0_14px_#e11d48]' }
                  ].map((seg, idx, arr) => {
                    const isLit = limiter.enabled && limiterGrDb >= seg.th;
                    const nextTh = arr[idx + 1]?.th ?? 999;
                    const isPeakHold = limiter.enabled && limiterPeakHoldDb >= seg.th && limiterPeakHoldDb < nextTh;

                    return (
                      <div
                        key={idx}
                        className={`h-full flex-1 rounded-[1.5px] transition-all duration-75 ${
                          !limiter.enabled
                            ? 'bg-slate-900/60 border border-slate-900 opacity-30'
                            : isPeakHold
                            ? 'bg-white border border-amber-200 shadow-[0_0_10px_#ffffff] z-10'
                            : isLit
                            ? `${seg.light} border border-white/20`
                            : 'bg-slate-900/90 border border-slate-800/80 opacity-40'
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Meter Decibel Calibration Scale */}
                <div className="flex justify-between text-[8px] font-mono text-slate-500 px-0.5">
                  <span className="text-slate-400">0 dB</span>
                  <span>-1</span>
                  <span>-2</span>
                  <span>-3</span>
                  <span>-4</span>
                  <span>-6</span>
                  <span>-8</span>
                  <span className="text-rose-400 font-bold">-12+</span>
                </div>
              </div>

              {/* Status footer: Guard status and reduction health badge */}
              <div className="flex items-center justify-between text-[9px] font-mono pt-0.5 border-t border-slate-900">
                <div className="flex items-center gap-1 text-slate-400">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>True Peak Guard:</span>
                  <span className={limiter.enabled ? 'text-emerald-300 font-bold' : 'text-slate-500'}>
                    {limiter.enabled ? 'ACTIVE' : 'BYPASS'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-1.5 py-0.2 rounded font-mono text-[8px] font-bold uppercase ${
                      !limiter.enabled
                        ? 'bg-slate-900 text-slate-500'
                        : limiterGrDb > 4.5
                        ? 'bg-rose-950/80 text-rose-300 border border-rose-800/50'
                        : limiterGrDb > 1.5
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-800/50'
                        : limiterGrDb > 0.1
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
                        : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {!limiter.enabled
                      ? 'BYPASS'
                      : limiterGrDb > 4.5
                      ? 'HEAVY LIMITING'
                      : limiterGrDb > 1.5
                      ? 'TARGET MASTER GR'
                      : limiterGrDb > 0.1
                      ? 'GENTLE PEAK TAME'
                      : 'TRANSPARENT'}
                  </span>

                  {lufsData && (
                    <span className={`font-bold ${lufsData.truePeakDb > limiter.ceiling ? 'text-rose-400' : 'text-slate-300'}`}>
                      TP: {lufsData.truePeakDb > -60 ? `${lufsData.truePeakDb.toFixed(1)} dBTP` : '-inf'}
                    </span>
                  )}
                </div>
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
