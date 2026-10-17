import React, { useState } from 'react';
import {
  HelpCircle,
  X,
  Grid,
  FileText,
  ZoomIn,
  Move,
  Columns,
  Layers,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Share2,
  MousePointer,
  RotateCcw,
  Maximize2,
  GitCompare,
  Sliders,
  Copy,
  Plus
} from 'lucide-react';

interface BlockSuiteGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenThreeSongCompare?: () => void;
  onFitScreen?: () => void;
}

export const BlockSuiteGuideModal: React.FC<BlockSuiteGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenThreeSongCompare,
  onFitScreen
}) => {
  const [activeTopic, setActiveTopic] = useState<'3songs' | 'navigation' | 'edgeless' | 'connectors' | 'export'>('3songs');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full p-6 sm:p-7 space-y-6 shadow-2xl relative text-slate-100 my-8">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-amber-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">
                  BlockSuite Whiteboard & Lyric Studio Guide
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  AFFiNE Isomorphic Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Infinite 2D spatial canvas, 3-song drag-and-drop lyric comparison, and multi-version assembly.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close Guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTopic('3songs')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition shrink-0 cursor-pointer ${
              activeTopic === '3songs'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-950'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>3-Song Lyric Comparison & Master Assembly</span>
          </button>
          
          <button
            onClick={() => setActiveTopic('navigation')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition shrink-0 cursor-pointer ${
              activeTopic === 'navigation'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <ZoomIn className="w-3.5 h-3.5" />
            <span>Zoom & Navigation Controls</span>
          </button>

          <button
            onClick={() => setActiveTopic('edgeless')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition shrink-0 cursor-pointer ${
              activeTopic === 'edgeless'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Edgeless vs Page Mode</span>
          </button>

          <button
            onClick={() => setActiveTopic('connectors')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition shrink-0 cursor-pointer ${
              activeTopic === 'connectors'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Cards & Connectors</span>
          </button>

          <button
            onClick={() => setActiveTopic('export')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition shrink-0 cursor-pointer ${
              activeTopic === 'export'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Compiling & Cloud Sync</span>
          </button>
        </div>

        {/* Content Section */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          
          {/* TOPIC 1: 3-SONG COMPARISON */}
          {activeTopic === '3songs' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-indigo-950/30 to-slate-900 border border-amber-500/40">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm mb-1">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>How to Compare 3 Songs & Craft the Best Version</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  You can load up to 3 distinct catalog songs (or custom drafts) simultaneously onto the infinite canvas.
                  Each song's sections (Intro, Verses, Choruses, Bridge, Outro) are rendered in dedicated parallel columns,
                  alongside a golden <strong>★ Master Best Version</strong> assembly lane.
                </p>
              </div>

              {/* 4-Step Diagram */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-indigo-900/60 flex flex-col justify-between space-y-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-indigo-400 px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800">
                      STEP 1
                    </span>
                    <h4 className="text-xs font-bold text-white mt-1.5">Pick 3 Songs</h4>
                    <p className="text-[11px] text-slate-400">
                      Click the amber <strong>"Compare 3 Songs"</strong> button in the top toolbar. Select Song A, Song B, and Song C.
                    </p>
                  </div>
                  <div className="text-[10px] font-mono text-indigo-300 bg-indigo-950/50 p-1.5 rounded">
                    Col 1 (Blue) • Col 2 (Teal) • Col 3 (Purple)
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-emerald-900/60 flex flex-col justify-between space-y-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800">
                      STEP 2
                    </span>
                    <h4 className="text-xs font-bold text-white mt-1.5">Load Parallel Board</h4>
                    <p className="text-[11px] text-slate-400">
                      Click <strong>"Load 3-Song Board"</strong>. The canvas automatically parses all lyric sections and arranges them in side-by-side columns.
                    </p>
                  </div>
                  <div className="text-[10px] font-mono text-emerald-300 bg-emerald-950/50 p-1.5 rounded">
                    Auto-formatted sections with line counts
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-amber-900/60 flex flex-col justify-between space-y-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-950 border border-amber-800">
                      STEP 3
                    </span>
                    <h4 className="text-xs font-bold text-white mt-1.5">Drag to Master</h4>
                    <p className="text-[11px] text-slate-400">
                      Drag any card from Song A, B, or C into the golden <strong>Master column</strong>, or click the <strong>★ Copy to Master</strong> button on the card header.
                    </p>
                  </div>
                  <div className="text-[10px] font-mono text-amber-300 bg-amber-950/50 p-1.5 rounded">
                    Reorder & edit lines freely
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-rose-900/60 flex flex-col justify-between space-y-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-rose-400 px-2 py-0.5 rounded bg-rose-950 border border-rose-800">
                      STEP 4
                    </span>
                    <h4 className="text-xs font-bold text-white mt-1.5">Compile Best Version</h4>
                    <p className="text-[11px] text-slate-400">
                      Click <strong>"Compile & Save to Active Song"</strong>. The assembled lyrics write directly to your active track with instant Firestore sync.
                    </p>
                  </div>
                  <div className="text-[10px] font-mono text-rose-300 bg-rose-950/50 p-1.5 rounded">
                    Nashville standard formatting applied
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                {onOpenThreeSongCompare && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenThreeSongCompare();
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-950/50 transition cursor-pointer"
                  >
                    <Columns className="w-4 h-4" />
                    <span>Open 3-Song Comparison Matrix Now</span>
                  </button>
                )}
                {onFitScreen && (
                  <button
                    onClick={() => {
                      onFitScreen();
                      onClose();
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer"
                  >
                    Fit Screen (100%)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TOPIC 2: ZOOM & NAVIGATION */}
          {activeTopic === 'navigation' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ZoomIn className="w-4 h-4 text-indigo-400" />
                  <span>Effortless Canvas Navigation & Zoom</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The BlockSuite canvas supports standard desktop DAW & creative suite navigation methods so you can move smoothly across hundreds of cards.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">Mouse Wheel Zoom</span>
                    <p className="text-xs text-white font-semibold">Scroll Wheel anywhere on canvas</p>
                    <p className="text-[11px] text-slate-400">
                      Scroll up to zoom in, scroll down to zoom out. The canvas automatically centers zoom around your mouse cursor.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase">Canvas Panning</span>
                    <p className="text-xs text-white font-semibold">Click & Drag Empty Space / Hold Spacebar</p>
                    <p className="text-[11px] text-slate-400">
                      Click any blank area and drag to pan. Or hold <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">Space</kbd> and drag from anywhere.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">Floating Zoom HUD</span>
                    <p className="text-xs text-white font-semibold">Bottom-Right Corner Widget</p>
                    <p className="text-[11px] text-slate-400">
                      Always visible at the bottom-right corner. Features quick <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">-</kbd> and <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">+</kbd> buttons, zoom %, and a 1-click <strong>"Fit Screen"</strong> button.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">Keyboard Shortcuts</span>
                    <p className="text-xs text-white font-semibold">Hotkeys for Speed</p>
                    <div className="text-[11px] text-slate-300 font-mono space-y-0.5 pt-0.5">
                      <div><kbd className="px-1 bg-slate-800 rounded">+</kbd> / <kbd className="px-1 bg-slate-800 rounded">=</kbd> : Zoom In</div>
                      <div><kbd className="px-1 bg-slate-800 rounded">-</kbd> : Zoom Out</div>
                      <div><kbd className="px-1 bg-slate-800 rounded">0</kbd> : Reset to 100%</div>
                      <div><kbd className="px-1 bg-slate-800 rounded">F</kbd> : Fit All Blocks to Screen</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TOPIC 3: EDGELESS VS PAGE */}
          {activeTopic === 'edgeless' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Grid className="w-4 h-4 text-indigo-400" />
                  <span>Edgeless Whiteboard vs Page Document Mode</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  BlockSuite features dual isomorphic views powered by the AFFiNE core architecture. Switch modes at any time in the top header.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/40 space-y-2">
                    <div className="flex items-center gap-2">
                      <Grid className="w-4 h-4 text-indigo-400" />
                      <h4 className="text-sm font-bold text-white">Edgeless Whiteboard (Default)</h4>
                    </div>
                    <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                      <li>Spatial 2D coordinate system without boundaries</li>
                      <li>Ideal for non-linear brainstorming, multi-song side-by-side comparison</li>
                      <li>Interactive relationship curves (arrows & links)</li>
                      <li>Draggable card positioning and custom layout grids</li>
                      <li>Storyboarding thumbnail asset cards</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700 space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-300" />
                      <h4 className="text-sm font-bold text-white">Page Document Mode</h4>
                    </div>
                    <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                      <li>Linear vertical reading and editing format</li>
                      <li>Focus on writing full lyrics from top to bottom</li>
                      <li>Clean printable presentation style</li>
                      <li>Synchronizes perfectly with all blocks on the whiteboard</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TOPIC 4: CARDS & CONNECTORS */}
          {activeTopic === 'connectors' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-indigo-400" />
                  <span>Block Types & Drawing Relationship Connectors</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Every card on the whiteboard is fully editable and can link dynamically to any other card.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-800/60 space-y-1">
                    <span className="text-[10px] font-mono text-indigo-300 font-bold uppercase">Song Section Cards</span>
                    <p className="text-xs text-slate-300">
                      Represent verses, choruses, bridges, hooks, drops. Each card includes Nashville tags, lyric lines, and order indices.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/60 space-y-1">
                    <span className="text-[10px] font-mono text-emerald-300 font-bold uppercase">Theology & SOP Cards</span>
                    <p className="text-xs text-slate-300">
                      Enforce Nashville production rules: Throne Room Pivot in the bridge, 3:1 sonic scar ratio, theological thesis audits.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-800/60 space-y-1">
                    <span className="text-[10px] font-mono text-purple-300 font-bold uppercase">Chords & Progressions</span>
                    <p className="text-xs text-slate-300">
                      Store Camelot keys, BPM notations, and section-by-section harmonic roman numeral progressions.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div className="text-xs text-slate-300">
                    <strong>How to Draw a Connector:</strong> Click the small link icon (<Share2 className="w-3 h-3 inline mx-0.5 text-indigo-400" />) on the header of any card, then click any other card to connect them with a dynamic bezier curve.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TOPIC 5: EXPORT & SYNC */}
          {activeTopic === 'export' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Real-time Cloud Sync & Nextcloud WebDAV Backups</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Your work is automatically protected with dual-layer persistence:
                </p>

                <div className="space-y-2 pt-1 text-xs text-slate-300">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Firestore Real-time Sync:</strong> Every block edit, coordinate drag, zoom change, and connector is debounced and synchronized across browser sessions in real-time.
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Nextcloud WebDAV Export:</strong> 1-click export of structured Markdown and BlockSuite JSON to your Nextcloud music catalog folder.
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">Nashville Lyric Compiler:</strong> 1-click synthesis of all whiteboard cards into Nashville standard bracketed text sent directly to the active track's lyrics and Suno AI engine.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <div className="text-[11px] font-mono text-slate-400">
            Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300">Esc</kbd> or click Close to return to canvas.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer"
          >
            Got it, Let's Work!
          </button>
        </div>

      </div>
    </div>
  );
};
