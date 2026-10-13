import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Activity,
  Sliders,
  Volume2,
  Disc,
  Play,
  RotateCcw,
  Plus,
  Trash2,
  Sparkles,
  ChevronDown,
  Info,
  Check,
  X
} from 'lucide-react';
import { AutomationNode, TrackAutomationState, MixerTrack } from '../types';

export interface AutomationLaneEditorProps {
  track: MixerTrack;
  automationState: TrackAutomationState;
  onChangeAutomation: (newState: TrackAutomationState) => void;
  playbackProgressPercent?: number; // 0 to 100%
  currentLiveVol?: number;
  currentLivePan?: number;
  isDarkMode?: boolean;
}

// Preset curves definitions
export const VOLUME_PRESETS: { name: string; description: string; nodes: AutomationNode[] }[] = [
  {
    name: 'Flat Unity (80%)',
    description: 'Constant 80% (0 dB unity gain) baseline',
    nodes: [
      { id: 'v-0', timePercent: 0, value: 80 },
      { id: 'v-1', timePercent: 100, value: 80 }
    ]
  },
  {
    name: 'Linear Fade-In',
    description: 'Smooth fade-in from silence across the first 30 seconds',
    nodes: [
      { id: 'v-0', timePercent: 0, value: 0 },
      { id: 'v-1', timePercent: 30, value: 80 },
      { id: 'v-2', timePercent: 100, value: 80 }
    ]
  },
  {
    name: 'Fast Fade-Out',
    description: 'Maintains unity until smooth outro tail fade',
    nodes: [
      { id: 'v-0', timePercent: 0, value: 80 },
      { id: 'v-1', timePercent: 75, value: 80 },
      { id: 'v-2', timePercent: 100, value: 0 }
    ]
  },
  {
    name: 'Bridge Swell (+3dB)',
    description: 'Lyrical build & emotional swell into the climactic bridge',
    nodes: [
      { id: 'v-0', timePercent: 0, value: 70 },
      { id: 'v-1', timePercent: 40, value: 70 },
      { id: 'v-2', timePercent: 60, value: 98 },
      { id: 'v-3', timePercent: 80, value: 85 },
      { id: 'v-4', timePercent: 100, value: 75 }
    ]
  },
  {
    name: '4-Bar Sidechain Ducking',
    description: 'Rhythmic ducking curve simulating heavy kick pump',
    nodes: [
      { id: 'v-0', timePercent: 0, value: 80 },
      { id: 'v-1', timePercent: 12.5, value: 35 },
      { id: 'v-2', timePercent: 25, value: 80 },
      { id: 'v-3', timePercent: 37.5, value: 35 },
      { id: 'v-4', timePercent: 50, value: 80 },
      { id: 'v-5', timePercent: 62.5, value: 35 },
      { id: 'v-6', timePercent: 75, value: 80 },
      { id: 'v-7', timePercent: 87.5, value: 35 },
      { id: 'v-8', timePercent: 100, value: 80 }
    ]
  },
  {
    name: 'Vocal Breakdown Dip',
    description: 'Dips instruments by -8dB during vocal intimacy section',
    nodes: [
      { id: 'v-0', timePercent: 0, value: 80 },
      { id: 'v-1', timePercent: 30, value: 80 },
      { id: 'v-2', timePercent: 35, value: 38 },
      { id: 'v-3', timePercent: 65, value: 38 },
      { id: 'v-4', timePercent: 70, value: 80 },
      { id: 'v-5', timePercent: 100, value: 80 }
    ]
  }
];

export const PAN_PRESETS: { name: string; description: string; nodes: AutomationNode[] }[] = [
  {
    name: 'Dead Center (0)',
    description: 'Monophonic centered stereo alignment',
    nodes: [
      { id: 'p-0', timePercent: 0, value: 0 },
      { id: 'p-1', timePercent: 100, value: 0 }
    ]
  },
  {
    name: 'Left-to-Right Slow Sweep',
    description: 'Gradual cinematic sweep across the stereo soundstage',
    nodes: [
      { id: 'p-0', timePercent: 0, value: -75 },
      { id: 'p-1', timePercent: 50, value: 0 },
      { id: 'p-2', timePercent: 100, value: 75 }
    ]
  },
  {
    name: 'Ping-Pong AutoPan',
    description: 'Stereo rhythmic bounce between left and right channels',
    nodes: [
      { id: 'p-0', timePercent: 0, value: -65 },
      { id: 'p-1', timePercent: 25, value: 65 },
      { id: 'p-2', timePercent: 50, value: -65 },
      { id: 'p-3', timePercent: 75, value: 65 },
      { id: 'p-4', timePercent: 100, value: 0 }
    ]
  },
  {
    name: 'Subtle Stereo Drift',
    description: 'Natural +/-20 acoustic motion for organic instruments',
    nodes: [
      { id: 'p-0', timePercent: 0, value: -20 },
      { id: 'p-1', timePercent: 33, value: 20 },
      { id: 'p-2', timePercent: 66, value: -15 },
      { id: 'p-3', timePercent: 100, value: 0 }
    ]
  }
];

// Helper to linearly interpolate value along nodes at a specific time percent
export function interpolateAutomationValue(nodes: AutomationNode[], timePercent: number): number {
  if (!nodes || nodes.length === 0) return 0;
  if (nodes.length === 1) return nodes[0].value;

  const sorted = [...nodes].sort((a, b) => a.timePercent - b.timePercent);
  if (timePercent <= sorted[0].timePercent) return sorted[0].value;
  if (timePercent >= sorted[sorted.length - 1].timePercent) return sorted[sorted.length - 1].value;

  for (let i = 0; i < sorted.length - 1; i++) {
    const cur = sorted[i];
    const nxt = sorted[i + 1];
    if (timePercent >= cur.timePercent && timePercent <= nxt.timePercent) {
      const span = nxt.timePercent - cur.timePercent;
      if (span === 0) return cur.value;
      const progress = (timePercent - cur.timePercent) / span;
      return cur.value + (nxt.value - cur.value) * progress;
    }
  }

  return sorted[sorted.length - 1].value;
}

export const AutomationLaneEditor: React.FC<AutomationLaneEditorProps> = ({
  track,
  automationState,
  onChangeAutomation,
  playbackProgressPercent = 0,
  currentLiveVol,
  currentLivePan,
  isDarkMode = true
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);

  const activeParam = automationState.activeParam;
  const isBypassed = activeParam === 'vol' ? automationState.volumeBypass : automationState.panBypass;
  const currentNodes = activeParam === 'vol' ? automationState.volumeNodes : automationState.panNodes;

  // Sorted nodes for rendering path
  const sortedNodes = [...currentNodes].sort((a, b) => a.timePercent - b.timePercent);

  // Parameter boundary ranges
  const isVolume = activeParam === 'vol';
  const minValue = isVolume ? 0 : -100;
  const maxValue = isVolume ? 100 : 100;

  // Convert (timePercent, value) to SVG coordinates (viewBox 0 0 1000 200)
  const SVG_WIDTH = 1000;
  const SVG_HEIGHT = 200;
  const PADDING_Y = 24;

  const toSvgCoords = useCallback(
    (timePercent: number, value: number) => {
      const x = (timePercent / 100) * SVG_WIDTH;
      // In SVG y=0 is top, y=height is bottom.
      // For volume: value=100 is at top (PADDING_Y), value=0 is at bottom (SVG_HEIGHT - PADDING_Y)
      // For pan: value=+100 is at bottom (Right) or top (Right)? In standard DAW: Top = Left (+100 or -100).
      // Let's map +100 (Right) to bottom or top: standard DAW Pan: Top = L, Bottom = R or vice versa.
      // Standard: Top = +100 (Right), Bottom = -100 (Left), Center = 0 (SVG_HEIGHT / 2).
      const usableHeight = SVG_HEIGHT - PADDING_Y * 2;
      const normalized = (value - minValue) / (maxValue - minValue); // 0 (min) to 1 (max)
      const y = SVG_HEIGHT - PADDING_Y - normalized * usableHeight;
      return { x, y };
    },
    [minValue, maxValue]
  );

  const fromSvgCoords = useCallback(
    (svgX: number, svgY: number) => {
      const clampedX = Math.max(0, Math.min(SVG_WIDTH, svgX));
      const timePercent = Math.round((clampedX / SVG_WIDTH) * 1000) / 10; // 0.1% precision

      const usableHeight = SVG_HEIGHT - PADDING_Y * 2;
      const clampedY = Math.max(PADDING_Y, Math.min(SVG_HEIGHT - PADDING_Y, svgY));
      const normalized = (SVG_HEIGHT - PADDING_Y - clampedY) / usableHeight;
      const rawValue = minValue + normalized * (maxValue - minValue);
      const value = isVolume ? Math.round(rawValue) : Math.round(rawValue);
      return { timePercent, value };
    },
    [minValue, maxValue, isVolume]
  );

  // Pointer drag handling
  const handlePointerDownNode = (e: React.PointerEvent, nodeId: string) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    setDraggingNodeId(nodeId);
    setSelectedNodeId(nodeId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingNodeId || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const svgX = (clientX / rect.width) * SVG_WIDTH;
    const svgY = (clientY / rect.height) * SVG_HEIGHT;

    const { timePercent, value } = fromSvgCoords(svgX, svgY);

    const updatedNodes = currentNodes.map((node) => {
      if (node.id === draggingNodeId) {
        // Find if this is boundary node (time = 0 or 100)
        const isFirst = node.timePercent === 0;
        const isLast = node.timePercent === 100;
        return {
          ...node,
          timePercent: isFirst ? 0 : isLast ? 100 : Math.max(1, Math.min(99, timePercent)),
          value: Math.max(minValue, Math.min(maxValue, value))
        };
      }
      return node;
    });

    if (isVolume) {
      onChangeAutomation({ ...automationState, volumeNodes: updatedNodes });
    } else {
      onChangeAutomation({ ...automationState, panNodes: updatedNodes });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingNodeId) {
      try {
        (e.target as Element).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setDraggingNodeId(null);
    }
  };

  // Double click on canvas to add a new breakpoint node
  const handleSvgDoubleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const svgX = (clientX / rect.width) * SVG_WIDTH;
    const svgY = (clientY / rect.height) * SVG_HEIGHT;

    const { timePercent, value } = fromSvgCoords(svgX, svgY);

    // Don't add directly on 0 or 100 if boundary node exists
    const clampedTime = Math.max(2, Math.min(98, timePercent));
    const newNode: AutomationNode = {
      id: `${activeParam}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timePercent: clampedTime,
      value
    };

    const newNodes = [...currentNodes, newNode];
    setSelectedNodeId(newNode.id);

    if (isVolume) {
      onChangeAutomation({ ...automationState, volumeNodes: newNodes });
    } else {
      onChangeAutomation({ ...automationState, panNodes: newNodes });
    }
  };

  // Delete selected node
  const handleDeleteNode = (nodeId: string) => {
    if (currentNodes.length <= 2) return; // Keep at least start and end
    const filtered = currentNodes.filter((n) => n.id !== nodeId);
    setSelectedNodeId(null);
    if (isVolume) {
      onChangeAutomation({ ...automationState, volumeNodes: filtered });
    } else {
      onChangeAutomation({ ...automationState, panNodes: filtered });
    }
  };

  // Reset to flat
  const handleResetCurve = () => {
    if (isVolume) {
      onChangeAutomation({
        ...automationState,
        volumeNodes: [
          { id: 'v-start', timePercent: 0, value: track.vol },
          { id: 'v-end', timePercent: 100, value: track.vol }
        ]
      });
    } else {
      onChangeAutomation({
        ...automationState,
        panNodes: [
          { id: 'p-start', timePercent: 0, value: track.pan },
          { id: 'p-end', timePercent: 100, value: track.pan }
        ]
      });
    }
  };

  // Apply a preset
  const handleApplyPreset = (nodes: AutomationNode[]) => {
    setIsPresetsOpen(false);
    if (isVolume) {
      onChangeAutomation({ ...automationState, volumeNodes: nodes });
    } else {
      onChangeAutomation({ ...automationState, panNodes: nodes });
    }
  };

  // Generate SVG path string
  const points = sortedNodes.map((n) => toSvgCoords(n.timePercent, n.value));
  const linePathD = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  // Fill area under line
  const baseY = isVolume ? SVG_HEIGHT - PADDING_Y : SVG_HEIGHT / 2;
  const areaPathD =
    points.length > 0
      ? `${linePathD} L ${points[points.length - 1].x} ${baseY} L ${points[0].x} ${baseY} Z`
      : '';

  // Interpolate current dynamic value at current playback time
  const currentVal = interpolateAutomationValue(currentNodes, playbackProgressPercent);
  const playheadX = (playbackProgressPercent / 100) * SVG_WIDTH;

  return (
    <div
      className={`rounded-xl border p-3.5 space-y-3 transition-all duration-200 mt-2 ${
        isDarkMode
          ? 'bg-slate-950/90 border-indigo-900/40 text-slate-200 shadow-inner'
          : 'bg-slate-50 border-indigo-200 text-slate-800 shadow-xs'
      }`}
    >
      {/* LANE HEADER & TOOLBAR */}
      <div className="flex items-center justify-between flex-wrap gap-2.5">
        {/* Parameter Selector Tabs (Volume / Pan) */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-900/80 border border-slate-800">
          <button
            type="button"
            onClick={() => onChangeAutomation({ ...automationState, activeParam: 'vol' })}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold transition cursor-pointer ${
              activeParam === 'vol'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Volume (Gain)</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeAutomation({ ...automationState, activeParam: 'pan' })}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold transition cursor-pointer ${
              activeParam === 'pan'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Stereo Pan</span>
          </button>
        </div>

        {/* Live dynamic readout */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs">
            <span className="text-[10px] text-slate-400 uppercase">Live:</span>
            {isVolume ? (
              <span className="text-emerald-400 font-black">
                {currentLiveVol !== undefined ? currentLiveVol : Math.round(currentVal)}%
                <span className="text-slate-500 text-[10px] ml-1">
                  ({(20 * Math.log10(Math.max(0.01, (currentLiveVol ?? currentVal) / 80))).toFixed(1)} dB)
                </span>
              </span>
            ) : (
              <span className="text-cyan-400 font-black">
                {(() => {
                  const p = currentLivePan !== undefined ? currentLivePan : Math.round(currentVal);
                  return p === 0 ? 'Center (0)' : p < 0 ? `L ${Math.abs(p)}` : `R ${p}`;
                })()}
              </span>
            )}
          </div>

          {/* Active / Bypass Toggle */}
          <button
            type="button"
            onClick={() => {
              if (isVolume) {
                onChangeAutomation({ ...automationState, volumeBypass: !automationState.volumeBypass });
              } else {
                onChangeAutomation({ ...automationState, panBypass: !automationState.panBypass });
              }
            }}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition cursor-pointer border flex items-center gap-1.5 ${
              isBypassed
                ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                : isVolume
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 ring-1 ring-emerald-500/30'
                : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300 ring-1 ring-cyan-500/30'
            }`}
            title={isBypassed ? 'Automation bypassed (static fader)' : 'Automation active in playback'}
          >
            <Activity className={`w-3.5 h-3.5 ${isBypassed ? 'text-slate-500' : 'animate-pulse'}`} />
            <span>{isBypassed ? 'BYPASSED' : 'ACTIVE'}</span>
          </button>
        </div>

        {/* Action Buttons: Presets Dropdown, + Add Node, Reset */}
        <div className="flex items-center gap-1.5 relative">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsPresetsOpen(!isPresetsOpen)}
              className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Presets</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isPresetsOpen && (
              <div
                className="absolute right-0 top-full mt-1.5 w-64 rounded-xl shadow-2xl border p-2 z-50 backdrop-blur-xl bg-slate-900/95 border-slate-700 text-slate-100 ring-1 ring-white/10 animate-in fade-in zoom-in-95"
              >
                <div className="text-[10px] font-mono text-slate-400 px-2 py-1 uppercase font-bold border-b border-slate-800 mb-1">
                  {isVolume ? 'Volume Envelope Presets' : 'Pan Envelope Presets'}
                </div>
                <div className="space-y-1">
                  {(isVolume ? VOLUME_PRESETS : PAN_PRESETS).map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handleApplyPreset(p.nodes)}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-800 transition cursor-pointer group"
                    >
                      <div className="text-xs font-bold text-slate-200 group-hover:text-indigo-400">
                        {p.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{p.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Reset Curve */}
          <button
            type="button"
            onClick={handleResetCurve}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent hover:border-slate-700 transition cursor-pointer"
            title="Reset to flat line"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Delete Selected Node */}
          {selectedNodeId && currentNodes.length > 2 && (
            <button
              type="button"
              onClick={() => handleDeleteNode(selectedNodeId)}
              className="p-1.5 rounded-md text-rose-400 hover:text-rose-200 hover:bg-rose-950/60 border border-rose-800/50 transition cursor-pointer"
              title="Delete selected breakpoint node"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* INTERACTIVE BREAKPOINT SVG ENVELOPE CANVAS */}
      <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner select-none">
        {/* Canvas Background Guide Grid */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 opacity-30 text-[9px] font-mono text-slate-400">
          <div className="flex justify-between border-b border-slate-800/80 pb-0.5">
            <span>{isVolume ? '+2.0 dB (100%)' : 'Hard Right (+100)'}</span>
            <span>0.0s</span>
            <span>15.0s</span>
            <span>30.0s</span>
            <span>45.0s</span>
            <span>60.0s (Outro)</span>
          </div>
          <div className="flex justify-between border-b border-dashed border-slate-800/60 pb-0.5">
            <span>{isVolume ? '0.0 dB Unity (80%)' : 'Center (0)'}</span>
          </div>
          <div className="flex justify-between border-t border-slate-800/80 pt-0.5">
            <span>{isVolume ? '-∞ Silence (0%)' : 'Hard Left (-100)'}</span>
          </div>
        </div>

        {/* SVG Drawing Canvas */}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full h-36 cursor-crosshair relative z-10 touch-none"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onDoubleClick={handleSvgDoubleClick}
        >
          <defs>
            {/* Gradient fill under curve */}
            <linearGradient id={`grad-${track.id}-${activeParam}`} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={isVolume ? '#10b981' : '#06b6d4'}
                stopOpacity={isBypassed ? '0.05' : '0.28'}
              />
              <stop
                offset="100%"
                stopColor={isVolume ? '#10b981' : '#06b6d4'}
                stopOpacity="0.0"
              />
            </linearGradient>

            {/* Glowing filter */}
            <filter id={`glow-${track.id}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Center reference guide line for Pan or 80% guide line for Volume */}
          <line
            x1="0"
            y1={toSvgCoords(0, isVolume ? 80 : 0).y}
            x2={SVG_WIDTH}
            y2={toSvgCoords(100, isVolume ? 80 : 0).y}
            stroke={isDarkMode ? '#334155' : '#cbd5e1'}
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />

          {/* Vertical Time Division Grid Lines (25%, 50%, 75%) */}
          {[25, 50, 75].map((t) => (
            <line
              key={`grid-${t}`}
              x1={(t / 100) * SVG_WIDTH}
              y1="0"
              x2={(t / 100) * SVG_WIDTH}
              y2={SVG_HEIGHT}
              stroke={isDarkMode ? '#1e293b' : '#e2e8f0'}
              strokeDasharray="2 4"
              strokeWidth="1"
            />
          ))}

          {/* Filled area under curve */}
          {areaPathD && (
            <path
              d={areaPathD}
              fill={`url(#grad-${track.id}-${activeParam})`}
              className="transition-opacity duration-150"
            />
          )}

          {/* Interpolated curve path */}
          {linePathD && (
            <path
              d={linePathD}
              fill="none"
              stroke={
                isBypassed
                  ? '#64748b'
                  : isVolume
                  ? '#10b981'
                  : '#06b6d4'
              }
              strokeWidth={isBypassed ? '2' : '3'}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={isBypassed ? undefined : `url(#glow-${track.id})`}
            />
          )}

          {/* Real-time Dynamic Playhead Cursor Line */}
          {playbackProgressPercent >= 0 && (
            <g>
              <line
                x1={playheadX}
                y1="0"
                x2={playheadX}
                y2={SVG_HEIGHT}
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="3 2"
                className="animate-pulse"
              />
              <circle
                cx={playheadX}
                cy={toSvgCoords(playbackProgressPercent, currentVal).y}
                r="5"
                fill="#f59e0b"
                stroke="#ffffff"
                strokeWidth="1.5"
                className="shadow-md"
              />
            </g>
          )}

          {/* Interactive Breakpoint Nodes */}
          {sortedNodes.map((node) => {
            const { x, y } = toSvgCoords(node.timePercent, node.value);
            const isSelected = selectedNodeId === node.id;
            const isDragging = draggingNodeId === node.id;

            return (
              <g
                key={node.id}
                onPointerDown={(e) => handlePointerDownNode(e, node.id)}
                className="cursor-grab active:cursor-grabbing group"
              >
                {/* Hit area */}
                <circle cx={x} cy={y} r="14" fill="transparent" />

                {/* Outer halo */}
                <circle
                  cx={x}
                  cy={y}
                  r={isDragging ? '9' : isSelected ? '8' : '6'}
                  fill={
                    isBypassed
                      ? '#475569'
                      : isVolume
                      ? '#059669'
                      : '#0891b2'
                  }
                  className="transition-all duration-100 group-hover:scale-125"
                  opacity={isDragging ? '0.8' : '0.4'}
                />

                {/* Core node dot */}
                <circle
                  cx={x}
                  cy={y}
                  r={isDragging ? '5.5' : '4.5'}
                  fill={isSelected ? '#ffffff' : isVolume ? '#34d399' : '#38bdf8'}
                  stroke="#0f172a"
                  strokeWidth="2"
                />

                {/* Hover value indicator bubble */}
                {(isDragging || isSelected) && (
                  <g pointerEvents="none">
                    <rect
                      x={Math.max(10, Math.min(SVG_WIDTH - 90, x - 40))}
                      y={Math.max(6, y - 28)}
                      width="80"
                      height="20"
                      rx="4"
                      fill="#0f172a"
                      stroke="#475569"
                      strokeWidth="1"
                    />
                    <text
                      x={Math.max(10, Math.min(SVG_WIDTH - 90, x - 40)) + 40}
                      y={Math.max(6, y - 28) + 14}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {isVolume ? `${Math.round(node.value)}%` : node.value === 0 ? 'C' : node.value < 0 ? `L${Math.abs(node.value)}` : `R${node.value}`} @ {node.timePercent.toFixed(0)}%
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hint banner */}
        <div className="p-2 border-t border-slate-800/80 bg-slate-900/40 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <Info className="w-3 h-3 text-indigo-400" />
            <span>
              Double-click anywhere to add a node • Drag nodes horizontally (time) and vertically (value) • Click Presets for instant envelope curves
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>{sortedNodes.length} Nodes</span>
          </div>
        </div>
      </div>
    </div>
  );
};
