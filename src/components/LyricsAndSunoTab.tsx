import React, { useState } from 'react';
import {
  FileText,
  Copy,
  GitBranch,
  Sparkles,
  Zap,
  Sliders,
  AlertCircle,
  CheckCircle,
  SlidersHorizontal,
  RefreshCw,
  Heart,
  Flame,
  Check
} from 'lucide-react';
import { Track } from '../types';

interface LyricsAndSunoTabProps {
  track: Track;
  onUpdateTrack: (field: string, value: any) => void;
  onCopyText: (text: string, label: string) => void;
}

export const LyricsAndSunoTab: React.FC<LyricsAndSunoTabProps> = ({
  track,
  onUpdateTrack,
  onCopyText
}) => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<string | null>(null);
  const [auditModel, setAuditModel] = useState<'gemini-3.1-pro-preview' | 'gemini-3.5-flash'>('gemini-3.1-pro-preview');
  const [copiedBlock, setCopiedBlock] = useState<number | null>(null);

  // Generate Suno Block 1 (Lyrics & Meta-tags)
  const block1Lyrics = `[Vocal Archetype: ${track.vocalCast || track.vocal}]\n${track.lyrics}`;

  // Generate Suno Block 2 (Style)
  const block2Style = `${track.genre}, ${track.bpm} BPM, Key of ${track.key}, ${track.sunoPrompt}`;

  // Generate Suno Block 3 (Excluded Styles / Artifact Killer)
  const block3Excluded = track.negativePrompt || 'sibilance, high-frequency hiss, piercing treble, digital artifacts, muddy bass, muffled vocals, lo-fi, autotune, MIDI strings, electronic synths, heavy reverb, wash, stadium echo, screaming, shouting, long atmospheric gaps';

  // Generate Suno Block 4 (Engine Sliders)
  const block4Sliders = `Weirdness: ${track.engineSliders?.weirdness ?? 12} | Style Influence: ${track.engineSliders?.styleInfluence ?? 65} | Voice/Audio: ${track.engineSliders?.voiceAudio ?? 100}`;

  // Copy entire 4-block formatted bundle
  const handleCopyAllBlocks = () => {
    const bundle = `=== BLOCK 1: LYRICS & META-TAGS ===\n${block1Lyrics}\n\n=== BLOCK 2: STYLE ===\n${block2Style}\n\n=== BLOCK 3: EXCLUDED STYLES (ARTIFACT KILLER) ===\n${block3Excluded}\n\n=== BLOCK 4: ENGINE SLIDERS ===\n${block4Sliders}`;
    onCopyText(bundle, 'Suno v5.5 4-Block Generation Bundle');
  };

  // Run Gemini Lyrical & Theological Audit
  const handleRunAudit = async () => {
    setIsAuditing(true);
    setAuditResult(null);
    try {
      const res = await fetch('/api/gemini/audit-lyric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lyrics: track.lyrics,
          title: track.title,
          genre: track.genre,
          ep: track.ep,
          bpm: track.bpm,
          thesis: track.thesis,
          vocal: track.vocalCast || track.vocal,
          model: auditModel,
        }),
      });

      const data = await res.json();
      if (data.audit) {
        setAuditResult(data.audit);
      } else if (data.error) {
        setAuditResult(`Audit Error: ${data.error}`);
      }
    } catch (err: any) {
      setAuditResult(`Connection error: ${err.message}`);
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Lyrical Guardrails & Selah Stationkeeping */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              Theological & Lyrical Guardrails
            </h4>
            <p className="text-[11px] text-slate-400">
              Enforcing OBI Funnel • The 'Christianese' Filter • The Throne Room Pivot • 3:1 Sonic Scar Rule
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdateTrack('selahPrayed', !track.selahPrayed)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
              track.selahPrayed
                ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle mandatory 24-hour prayer stationkeeping block"
          >
            <Heart className={`w-3.5 h-3.5 ${track.selahPrayed ? 'fill-emerald-400 text-emerald-400' : ''}`} />
            <span>{track.selahPrayed ? 'Selah Block Complete' : 'Selah Prayer (24h Pending)'}</span>
          </button>

          <button
            onClick={handleRunAudit}
            disabled={isAuditing}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-purple-950 disabled:opacity-50"
          >
            {isAuditing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
            <span>{isAuditing ? 'Auditing with Gemini Pro...' : 'Gemini Lyrical Audit'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left = Lyrics Editor, Right = Suno v5.5 4-Block Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: LYRIC WORKBENCH & HISTORY */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Active Lyric Workbench
                </h3>
              </div>
              <span className="text-[11px] font-mono text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                Version: {track.versions[track.versions.length - 1]?.version || 'v1.0'}
              </span>
            </div>

            <textarea
              rows={16}
              value={track.lyrics}
              onChange={(e) => onUpdateTrack('lyrics', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs sm:text-sm text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-indigo-500 custom-scrollbar resize-y"
              placeholder="Paste or write lyrics here. Follow Suno meta-tags: [Verse 1], [Chorus], [Bridge], [Outro]..."
            />

            <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onCopyText(track.lyrics, `${track.title} Lyrics`)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center gap-1.5 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Lyrics</span>
                </button>
                <span className="text-[11px] text-slate-400 font-mono">
                  {track.lyrics.split('\n').filter(Boolean).length} lines • {track.lyrics.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono italic">
                Auto-saves and commits new revision
              </span>
            </div>
          </div>

          {/* Audit Result Display */}
          {auditResult && (
            <div className="bg-slate-900/95 border border-purple-500/40 rounded-2xl p-5 space-y-3 shadow-2xl animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    Gemini Lead Theological & Lyrical Audit
                  </h4>
                </div>
                <button
                  onClick={() => setAuditResult(null)}
                  className="text-slate-400 hover:text-white text-xs font-bold"
                >
                  ✕ Close
                </button>
              </div>
              <div className="text-xs text-slate-300 font-mono leading-relaxed max-h-96 overflow-y-auto custom-scrollbar whitespace-pre-wrap p-3 bg-slate-950 rounded-xl border border-slate-800">
                {auditResult}
              </div>
            </div>
          )}

          {/* Revision History */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-indigo-400" />
              <span>Revision History & Rollback ({track.versions.length})</span>
            </h3>

            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {track.versions.slice().reverse().map((ver, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-indigo-300 font-mono">
                      {ver.version} • <span className="text-slate-400 font-sans">{ver.timestamp}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-xs">{ver.reason}</div>
                  </div>
                  <button
                    onClick={() => onUpdateTrack('lyrics', ver.lyrics)}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-indigo-600 text-white font-bold transition text-[10px]"
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SUNO v5.5 4-BLOCK ENGINE */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    Suno v5.5 4-Block Engine
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400">Strict 4-code-block format for Suno.com</p>
              </div>

              <button
                onClick={handleCopyAllBlocks}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition shadow-md shadow-amber-950"
                title="Copy all 4 blocks formatted into clipboard"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy 4 Blocks</span>
              </button>
            </div>

            {/* BLOCK 1: LYRICS & META-TAGS */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black tracking-wider text-indigo-400 font-mono">
                  Block 1: Lyrics & Meta-Tags
                </span>
                <button
                  onClick={() => {
                    onCopyText(block1Lyrics, 'Block 1 (Lyrics)');
                    setCopiedBlock(1);
                    setTimeout(() => setCopiedBlock(null), 2000);
                  }}
                  className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 font-bold"
                >
                  {copiedBlock === 1 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedBlock === 1 ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="text-[11px] font-mono text-slate-300 max-h-32 overflow-y-auto custom-scrollbar p-2 bg-slate-900/60 rounded-lg whitespace-pre-wrap">
                {block1Lyrics}
              </pre>
            </div>

            {/* BLOCK 2: STYLE */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400 font-mono">
                  Block 2: Style
                </span>
                <button
                  onClick={() => {
                    onCopyText(block2Style, 'Block 2 (Style)');
                    setCopiedBlock(2);
                    setTimeout(() => setCopiedBlock(null), 2000);
                  }}
                  className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 font-bold"
                >
                  {copiedBlock === 2 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedBlock === 2 ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={track.sunoPrompt}
                onChange={(e) => onUpdateTrack('sunoPrompt', e.target.value)}
                className="w-full text-[11px] font-mono text-emerald-300 p-2 bg-slate-900/60 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* BLOCK 3: EXCLUDED STYLES (ARTIFACT KILLER) */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black tracking-wider text-rose-400 font-mono">
                  Block 3: Excluded Styles (Artifact Killer)
                </span>
                <button
                  onClick={() => {
                    onCopyText(block3Excluded, 'Block 3 (Excluded Styles)');
                    setCopiedBlock(3);
                    setTimeout(() => setCopiedBlock(null), 2000);
                  }}
                  className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 font-bold"
                >
                  {copiedBlock === 3 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedBlock === 3 ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={track.negativePrompt}
                onChange={(e) => onUpdateTrack('negativePrompt', e.target.value)}
                className="w-full text-[11px] font-mono text-rose-300 p-2 bg-slate-900/60 rounded-lg border border-slate-800 focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* BLOCK 4: ENGINE SLIDERS */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black tracking-wider text-amber-400 font-mono">
                  Block 4: Engine Sliders
                </span>
                <button
                  onClick={() => {
                    onCopyText(block4Sliders, 'Block 4 (Engine Sliders)');
                    setCopiedBlock(4);
                    setTimeout(() => setCopiedBlock(null), 2000);
                  }}
                  className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 font-bold"
                >
                  {copiedBlock === 4 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedBlock === 4 ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Weirdness Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-400">Weirdness (Target: 0-20)</span>
                  <span className="text-amber-400 font-bold">{track.engineSliders?.weirdness ?? 12}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={track.engineSliders?.weirdness ?? 12}
                  onChange={(e) =>
                    onUpdateTrack('engineSliders', {
                      ...(track.engineSliders || { weirdness: 12, styleInfluence: 65, voiceAudio: 100 }),
                      weirdness: parseInt(e.target.value),
                    })
                  }
                  className="w-full accent-amber-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Style Influence Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-400">Style Influence (Target: 40-75)</span>
                  <span className="text-indigo-400 font-bold">{track.engineSliders?.styleInfluence ?? 65}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={track.engineSliders?.styleInfluence ?? 65}
                  onChange={(e) =>
                    onUpdateTrack('engineSliders', {
                      ...(track.engineSliders || { weirdness: 12, styleInfluence: 65, voiceAudio: 100 }),
                      styleInfluence: parseInt(e.target.value),
                    })
                  }
                  className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              {/* Voice / Audio Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-400">Voice / Audio (Fixed: 100)</span>
                  <span className="text-emerald-400 font-bold">{track.engineSliders?.voiceAudio ?? 100}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={track.engineSliders?.voiceAudio ?? 100}
                  disabled
                  className="w-full accent-emerald-500 h-1 bg-slate-800 rounded-lg opacity-60"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
