import React, { useState, useMemo } from 'react';
import {
  Columns,
  X,
  Music,
  Check,
  Sparkles,
  ArrowRight,
  GitCompare,
  Copy,
  Layers,
  CheckCircle2,
  ListFilter,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  RefreshCw,
  Award
} from 'lucide-react';
import { Track } from '../types';

interface BlockSuiteThreeSongComparatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  selectedTrack: Track;
  onLoadThreeSongsToCanvas: (
    trackA: Track,
    trackB: Track,
    trackC: Track,
    options?: { styleA?: number; styleB?: number; styleC?: number }
  ) => void;
  onApplyDirectMasterLyrics?: (compiledLyrics: string) => void;
}

export const BlockSuiteThreeSongComparatorModal: React.FC<BlockSuiteThreeSongComparatorModalProps> = ({
  isOpen,
  onClose,
  tracks,
  selectedTrack,
  onLoadThreeSongsToCanvas,
  onApplyDirectMasterLyrics
}) => {
  // Track selection state (defaulting to selectedTrack + adjacent tracks)
  const defaultIdx = tracks.findIndex(t => t.id === selectedTrack.id);
  const initialTrackAId = selectedTrack.id;
  const initialTrackBId = tracks[(defaultIdx + 1) % tracks.length]?.id || tracks[0].id;
  const initialTrackCId = tracks[(defaultIdx + 2) % tracks.length]?.id || tracks[0].id;

  const [trackAId, setTrackAId] = useState<string>(initialTrackAId);
  const [trackBId, setTrackBId] = useState<string>(initialTrackBId);
  const [trackCId, setTrackCId] = useState<string>(initialTrackCId);

  const [styleAIndex, setStyleAIndex] = useState<number>(0);
  const [styleBIndex, setStyleBIndex] = useState<number>(0);
  const [styleCIndex, setStyleCIndex] = useState<number>(0);

  // Tab between "Setup & Canvas Layout" and "Interactive Section Diff Matrix"
  const [activeView, setActiveView] = useState<'setup' | 'sectionDiff'>('setup');
  const [selectedSectionTag, setSelectedSectionTag] = useState<string>('all');

  // Resolved tracks
  const trackA = useMemo(() => tracks.find(t => t.id === trackAId) || selectedTrack, [tracks, trackAId, selectedTrack]);
  const trackB = useMemo(() => tracks.find(t => t.id === trackBId) || tracks[0], [tracks, trackBId]);
  const trackC = useMemo(() => tracks.find(t => t.id === trackCId) || tracks[1] || tracks[0], [tracks, trackCId]);

  // Helper to extract lyrics for a track given style index
  const getLyricsForTrack = (trk: Track, styleIdx: number): string => {
    if (trk.versions && trk.versions[styleIdx]?.lyrics) {
      return trk.versions[styleIdx].lyrics;
    }
    return trk.lyrics || '';
  };

  const lyricsA = useMemo(() => getLyricsForTrack(trackA, styleAIndex), [trackA, styleAIndex]);
  const lyricsB = useMemo(() => getLyricsForTrack(trackB, styleBIndex), [trackB, styleBIndex]);
  const lyricsC = useMemo(() => getLyricsForTrack(trackC, styleCIndex), [trackC, styleCIndex]);

  // Parse sections
  const parseSections = (rawText: string): Array<{ tag: string; cleanTag: string; content: string; lineCount: number }> => {
    if (!rawText.trim()) return [];
    const bracketRegex = /\[([^\]]+)\]/g;
    const list: Array<{ tag: string; cleanTag: string; content: string; lineCount: number }> = [];
    const matches: Array<{ tag: string; cleanTag: string; index: number; fullTag: string }> = [];

    let match: RegExpExecArray | null;
    while ((match = bracketRegex.exec(rawText)) !== null) {
      matches.push({
        tag: `[${match[1]}]`,
        cleanTag: match[1].trim(),
        index: match.index,
        fullTag: match[0]
      });
    }

    if (matches.length > 0) {
      for (let i = 0; i < matches.length; i++) {
        const start = matches[i].index + matches[i].fullTag.length;
        const end = i + 1 < matches.length ? matches[i + 1].index : rawText.length;
        const body = rawText.slice(start, end).trim();
        const lineCount = body.split('\n').filter(l => l.trim().length > 0).length;
        list.push({
          tag: matches[i].tag,
          cleanTag: matches[i].cleanTag,
          content: body,
          lineCount
        });
      }
    } else {
      const chunks = rawText.split(/\n\n+/).filter(c => c.trim().length > 0);
      chunks.forEach((chunk, i) => {
        list.push({
          tag: `[Section ${i + 1}]`,
          cleanTag: `Section ${i + 1}`,
          content: chunk.trim(),
          lineCount: chunk.trim().split('\n').length
        });
      });
    }
    return list;
  };

  const sectionsA = useMemo(() => parseSections(lyricsA), [lyricsA]);
  const sectionsB = useMemo(() => parseSections(lyricsB), [lyricsB]);
  const sectionsC = useMemo(() => parseSections(lyricsC), [lyricsC]);

  // Combined unique section tags across all 3 songs
  const allUniqueTags = useMemo(() => {
    const set = new Set<string>();
    sectionsA.forEach(s => set.add(s.tag));
    sectionsB.forEach(s => set.add(s.tag));
    sectionsC.forEach(s => set.add(s.tag));
    return Array.from(set);
  }, [sectionsA, sectionsB, sectionsC]);

  // Winner selection state for direct section compilation
  const [sectionWinners, setSectionWinners] = useState<Record<string, { source: 'A' | 'B' | 'C'; content: string }>>({});

  const handlePickWinner = (tag: string, source: 'A' | 'B' | 'C', content: string) => {
    setSectionWinners(prev => ({
      ...prev,
      [tag]: { source, content }
    }));
  };

  const handleApplyDirectComposite = () => {
    if (Object.keys(sectionWinners).length === 0) {
      alert('Please pick at least one winning section from the comparison columns.');
      return;
    }

    const compiled = allUniqueTags
      .filter(tag => sectionWinners[tag])
      .map(tag => `${tag}\n${sectionWinners[tag].content.trim()}`)
      .join('\n\n');

    if (onApplyDirectMasterLyrics) {
      onApplyDirectMasterLyrics(compiled);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-5xl w-full p-6 sm:p-7 space-y-6 shadow-2xl relative text-slate-100 my-8">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <Columns className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-wide">
                  3-Song Multi-Comparison & Staging Matrix
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  DRAG & DROP MASTER ASSEMBLY
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Load 3 songs onto parallel whiteboard columns to drag sections, compare verses side-by-side, and develop the best definitive version.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Switcher: Setup & Column Layout vs Section Diff Matrix */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveView('setup')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeView === 'setup'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>1. Whiteboard 4-Column Board Setup</span>
            </button>
            <button
              onClick={() => setActiveView('sectionDiff')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeView === 'sectionDiff'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>2. Side-by-Side Section Diff Matrix</span>
            </button>
          </div>

          <div className="text-xs font-mono text-slate-400">
            Target Active Song: <strong className="text-indigo-300">{selectedTrack.id}: {selectedTrack.title}</strong>
          </div>
        </div>

        {/* Song Selectors Bar (Always visible) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
          
          {/* SONG A */}
          <div className="space-y-2 p-3 rounded-lg bg-indigo-950/20 border border-indigo-500/40">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-indigo-400 px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800">
                SONG A (Primary Column)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{sectionsA.length} sections</span>
            </div>
            <select
              value={trackAId}
              onChange={(e) => setTrackAId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white outline-none cursor-pointer"
            >
              {tracks.map(t => (
                <option key={t.id} value={t.id}>
                  {t.id}: {t.title} ({t.ep})
                </option>
              ))}
            </select>
            {trackA.versions && trackA.versions.length > 1 && (
              <select
                value={styleAIndex}
                onChange={(e) => setStyleAIndex(Number(e.target.value))}
                className="w-full bg-slate-900/80 border border-slate-800 rounded px-2 py-1 text-[11px] text-indigo-300 outline-none"
              >
                {trackA.versions.map((v, i) => (
                  <option key={i} value={i}>
                    Style {i + 1}: {v.version} ({v.genre})
                  </option>
                ))}
              </select>
            )}
            <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between pt-0.5">
              <span>{trackA.bpm} BPM • {trackA.key}</span>
              <span className="text-indigo-400 truncate max-w-[140px]">{trackA.genre}</span>
            </div>
          </div>

          {/* SONG B */}
          <div className="space-y-2 p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/40">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800">
                SONG B (Comparison Take)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{sectionsB.length} sections</span>
            </div>
            <select
              value={trackBId}
              onChange={(e) => setTrackBId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white outline-none cursor-pointer"
            >
              {tracks.map(t => (
                <option key={t.id} value={t.id}>
                  {t.id}: {t.title} ({t.ep})
                </option>
              ))}
            </select>
            {trackB.versions && trackB.versions.length > 1 && (
              <select
                value={styleBIndex}
                onChange={(e) => setStyleBIndex(Number(e.target.value))}
                className="w-full bg-slate-900/80 border border-slate-800 rounded px-2 py-1 text-[11px] text-emerald-300 outline-none"
              >
                {trackB.versions.map((v, i) => (
                  <option key={i} value={i}>
                    Style {i + 1}: {v.version} ({v.genre})
                  </option>
                ))}
              </select>
            )}
            <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between pt-0.5">
              <span>{trackB.bpm} BPM • {trackB.key}</span>
              <span className="text-emerald-400 truncate max-w-[140px]">{trackB.genre}</span>
            </div>
          </div>

          {/* SONG C */}
          <div className="space-y-2 p-3 rounded-lg bg-purple-950/20 border border-purple-500/40">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-purple-400 px-2 py-0.5 rounded bg-purple-950 border border-purple-800">
                SONG C (Alternative Draft)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{sectionsC.length} sections</span>
            </div>
            <select
              value={trackCId}
              onChange={(e) => setTrackCId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white outline-none cursor-pointer"
            >
              {tracks.map(t => (
                <option key={t.id} value={t.id}>
                  {t.id}: {t.title} ({t.ep})
                </option>
              ))}
            </select>
            {trackC.versions && trackC.versions.length > 1 && (
              <select
                value={styleCIndex}
                onChange={(e) => setStyleCIndex(Number(e.target.value))}
                className="w-full bg-slate-900/80 border border-slate-800 rounded px-2 py-1 text-[11px] text-purple-300 outline-none"
              >
                {trackC.versions.map((v, i) => (
                  <option key={i} value={i}>
                    Style {i + 1}: {v.version} ({v.genre})
                  </option>
                ))}
              </select>
            )}
            <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between pt-0.5">
              <span>{trackC.bpm} BPM • {trackC.key}</span>
              <span className="text-purple-400 truncate max-w-[140px]">{trackC.genre}</span>
            </div>
          </div>

        </div>

        {/* VIEW 1: SETUP & CANVAS BOARD ACTIONS */}
        {activeView === 'setup' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">
                    Load Parallel 4-Column Canvas on BlockSuite Whiteboard
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  Ready to deploy: {sectionsA.length + sectionsB.length + sectionsC.length} lyric cards
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Clicking the button below will arrange the 3 selected songs into side-by-side columns on your infinite whiteboard canvas:
              </p>

              {/* Visual preview of columns */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/50 space-y-1">
                  <div className="text-indigo-300 font-bold">Column 1: Song A</div>
                  <div className="text-[10px] text-slate-400 truncate">{trackA.title}</div>
                  <div className="text-[10px] text-indigo-400">{sectionsA.length} draggable cards</div>
                </div>

                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/50 space-y-1">
                  <div className="text-emerald-300 font-bold">Column 2: Song B</div>
                  <div className="text-[10px] text-slate-400 truncate">{trackB.title}</div>
                  <div className="text-[10px] text-emerald-400">{sectionsB.length} draggable cards</div>
                </div>

                <div className="p-2.5 rounded-lg bg-purple-950/40 border border-purple-500/50 space-y-1">
                  <div className="text-purple-300 font-bold">Column 3: Song C</div>
                  <div className="text-[10px] text-slate-400 truncate">{trackC.title}</div>
                  <div className="text-[10px] text-purple-400">{sectionsC.length} draggable cards</div>
                </div>

                <div className="p-2.5 rounded-lg bg-amber-950/50 border-2 border-amber-500/70 shadow-lg shadow-amber-950/50 space-y-1">
                  <div className="text-amber-300 font-black flex items-center gap-1">
                    <span>★ Master Lane</span>
                  </div>
                  <div className="text-[10px] text-slate-300">Drop Zone Target</div>
                  <div className="text-[10px] text-amber-400 font-bold">Assembles Best Version</div>
                </div>
              </div>

              {/* Big CTA */}
              <div className="pt-3 flex items-center justify-between flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onLoadThreeSongsToCanvas(trackA, trackB, trackC, {
                      styleA: styleAIndex,
                      styleB: styleBIndex,
                      styleC: styleCIndex
                    });
                    onClose();
                  }}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-indigo-500 hover:from-amber-400 hover:to-indigo-400 text-slate-950 font-black text-sm flex items-center gap-2 shadow-xl shadow-amber-950/60 transition cursor-pointer"
                >
                  <Columns className="w-4 h-4 text-slate-950" />
                  <span>Deploy 3-Song Comparison Board to Canvas</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </button>

                <div className="text-[11px] font-mono text-slate-400">
                  Tip: Cards have <span className="text-amber-300">★ Copy to Master</span> buttons for instant 1-click migration.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: SIDE-BY-SIDE SECTION DIFF MATRIX */}
        {activeView === 'sectionDiff' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300">Filter Section:</span>
                <select
                  value={selectedSectionTag}
                  onChange={(e) => setSelectedSectionTag(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-white outline-none cursor-pointer"
                >
                  <option value="all">All Sections ({allUniqueTags.length})</option>
                  {allUniqueTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-amber-400 font-bold">
                  {Object.keys(sectionWinners).length} of {allUniqueTags.length} Winner Sections Chosen
                </span>
                {Object.keys(sectionWinners).length > 0 && onApplyDirectMasterLyrics && (
                  <button
                    onClick={handleApplyDirectComposite}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Compile Winners to Active Song Lyrics</span>
                  </button>
                )}
              </div>
            </div>

            {/* Matrix comparison cards list */}
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {allUniqueTags
                .filter(tag => selectedSectionTag === 'all' || selectedSectionTag === tag)
                .map((tag) => {
                  const secA = sectionsA.find(s => s.tag.toLowerCase() === tag.toLowerCase());
                  const secB = sectionsB.find(s => s.tag.toLowerCase() === tag.toLowerCase());
                  const secC = sectionsC.find(s => s.tag.toLowerCase() === tag.toLowerCase());
                  const currentWinner = sectionWinners[tag];

                  return (
                    <div
                      key={tag}
                      className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold border border-indigo-500/30">
                            {tag}
                          </span>
                          <span className="text-xs text-slate-400">
                            Compare line flow and lyrical impact
                          </span>
                        </div>

                        {currentWinner && (
                          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-600/40">
                            <Award className="w-3.5 h-3.5" />
                            <span>Winner: Song {currentWinner.source}</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        
                        {/* Song A Section */}
                        <div className={`p-3 rounded-lg border flex flex-col justify-between space-y-2.5 ${
                          currentWinner?.source === 'A'
                            ? 'bg-amber-950/20 border-amber-500 ring-1 ring-amber-500/50'
                            : 'bg-indigo-950/20 border-indigo-800/40'
                        }`}>
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-mono text-indigo-300 font-bold">
                              <span>Song A • {trackA.title}</span>
                              <span className="text-slate-500">{secA ? `${secA.lineCount} lines` : 'Missing'}</span>
                            </div>
                            <pre className="text-xs text-slate-200 font-sans whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                              {secA?.content || <span className="text-slate-600 italic">No {tag} in this version</span>}
                            </pre>
                          </div>

                          {secA && (
                            <button
                              type="button"
                              onClick={() => handlePickWinner(tag, 'A', secA.content)}
                              className={`w-full py-1.5 rounded text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                                currentWinner?.source === 'A'
                                  ? 'bg-amber-500 text-slate-950 font-black'
                                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                              }`}
                            >
                              <Award className="w-3 h-3" />
                              <span>{currentWinner?.source === 'A' ? '✓ Selected Winner' : 'Pick Song A for Master'}</span>
                            </button>
                          )}
                        </div>

                        {/* Song B Section */}
                        <div className={`p-3 rounded-lg border flex flex-col justify-between space-y-2.5 ${
                          currentWinner?.source === 'B'
                            ? 'bg-amber-950/20 border-amber-500 ring-1 ring-amber-500/50'
                            : 'bg-emerald-950/20 border-emerald-800/40'
                        }`}>
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-mono text-emerald-300 font-bold">
                              <span>Song B • {trackB.title}</span>
                              <span className="text-slate-500">{secB ? `${secB.lineCount} lines` : 'Missing'}</span>
                            </div>
                            <pre className="text-xs text-slate-200 font-sans whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                              {secB?.content || <span className="text-slate-600 italic">No {tag} in this version</span>}
                            </pre>
                          </div>

                          {secB && (
                            <button
                              type="button"
                              onClick={() => handlePickWinner(tag, 'B', secB.content)}
                              className={`w-full py-1.5 rounded text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                                currentWinner?.source === 'B'
                                  ? 'bg-amber-500 text-slate-950 font-black'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              }`}
                            >
                              <Award className="w-3 h-3" />
                              <span>{currentWinner?.source === 'B' ? '✓ Selected Winner' : 'Pick Song B for Master'}</span>
                            </button>
                          )}
                        </div>

                        {/* Song C Section */}
                        <div className={`p-3 rounded-lg border flex flex-col justify-between space-y-2.5 ${
                          currentWinner?.source === 'C'
                            ? 'bg-amber-950/20 border-amber-500 ring-1 ring-amber-500/50'
                            : 'bg-purple-950/20 border-purple-800/40'
                        }`}>
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px] font-mono text-purple-300 font-bold">
                              <span>Song C • {trackC.title}</span>
                              <span className="text-slate-500">{secC ? `${secC.lineCount} lines` : 'Missing'}</span>
                            </div>
                            <pre className="text-xs text-slate-200 font-sans whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                              {secC?.content || <span className="text-slate-600 italic">No {tag} in this version</span>}
                            </pre>
                          </div>

                          {secC && (
                            <button
                              type="button"
                              onClick={() => handlePickWinner(tag, 'C', secC.content)}
                              className={`w-full py-1.5 rounded text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                                currentWinner?.source === 'C'
                                  ? 'bg-amber-500 text-slate-950 font-black'
                                  : 'bg-purple-600 hover:bg-purple-500 text-white'
                              }`}
                            >
                              <Award className="w-3 h-3" />
                              <span>{currentWinner?.source === 'C' ? '✓ Selected Winner' : 'Pick Song C for Master'}</span>
                            </button>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4 flex-wrap gap-2">
          <div className="text-[11px] font-mono text-slate-400">
            All section modifications persist to your infinite whiteboard with real-time cloud sync.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
          >
            Close Matrix
          </button>
        </div>

      </div>
    </div>
  );
};
