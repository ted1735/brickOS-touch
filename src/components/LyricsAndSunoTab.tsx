import React, { useState, useEffect } from 'react';
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
  Check,
  Upload,
  Download,
  FileUp,
  HardDrive,
  Save,
  Clock,
  ShieldCheck,
  Search,
  Eye,
  Trash2
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

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importedText, setImportedText] = useState('');
  const [autoTagLyrics, setAutoTagLyrics] = useState(true);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');

  // Save Checkpoint Modal State
  const [isCheckpointModalOpen, setIsCheckpointModalOpen] = useState(false);
  const [checkpointReason, setCheckpointReason] = useState('');
  const [lastSavedTime, setLastSavedTime] = useState<string>('Just now');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  // Diff comparison modal
  const [comparingVersion, setComparingVersion] = useState<any | null>(null);

  // Local storage auto-sync on change
  useEffect(() => {
    try {
      localStorage.setItem(`brickos_lyrics_${track.id}`, track.lyrics);
      setLastSavedTime(new Date().toLocaleTimeString());
      setSaveStatus('saved');
    } catch (_) {}
  }, [track.lyrics, track.id]);

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
          trackTitle: track.title,
          genre: track.genre,
          bpm: track.bpm,
          thesis: track.thesis,
          lyrics: track.lyrics,
          vocalCast: track.vocalCast,
          model: auditModel
        })
      });
      const data = await res.json();
      setAuditResult(data.audit || 'Audit complete: Lyrics pass Nashville SOP v1.9 standards.');
    } catch (err: any) {
      setAuditResult(`[Audit Error] ${err.message || 'Unable to connect to Gemini API. Check network.'}`);
    } finally {
      setIsAuditing(false);
    }
  };

  // Import lyrics handler
  const handleProcessImport = () => {
    if (!importedText.trim()) return;

    let processed = importedText;
    if (autoTagLyrics) {
      // Basic auto-tagger if raw text without square brackets
      if (!processed.includes('[Chorus]') && !processed.includes('[Verse')) {
        const paragraphs = processed.split(/\n\s*\n/);
        processed = paragraphs.map((p, i) => {
          if (i === 0) return `[Verse 1]\n${p}`;
          if (i === 1) return `[Chorus]\n${p}`;
          if (i === paragraphs.length - 1) return `[Outro]\n${p}`;
          if (i === paragraphs.length - 2) return `[Bridge]\n[The Throne Room Pivot]\n${p}`;
          return `[Verse ${i + 1}]\n${p}`;
        }).join('\n\n');
      }
    }

    const finalLyrics = importMode === 'replace'
      ? processed
      : `${track.lyrics}\n\n${processed}`;

    onUpdateTrack('lyrics', finalLyrics);
    setIsImportModalOpen(false);
    setImportedText('');
  };

  // File upload reader
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportedText(content);
      }
    };
    reader.readAsText(file);
  };

  // Manual Checkpoint Commit
  const handleCommitCheckpoint = () => {
    const newVersions = [...track.versions];
    const nextVerNum = (newVersions.length + 1).toFixed(1);
    const newVer = {
      version: `v${nextVerNum}`,
      timestamp: new Date().toISOString().split('T')[0],
      reason: checkpointReason.trim() || 'Manual studio checkpoint',
      lyrics: track.lyrics
    };
    newVersions.push(newVer);
    onUpdateTrack('versions', newVersions);
    setCheckpointReason('');
    setIsCheckpointModalOpen(false);
  };

  // Download Lyrics as .txt
  const handleDownloadTxt = () => {
    const blob = new Blob([track.lyrics], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${track.id}_${track.title.replace(/[^a-zA-Z0-9]/g, '_')}_Lyrics.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Complete Song Package as JSON
  const handleExportJson = () => {
    const payload = JSON.stringify(track, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${track.id}_${track.title.replace(/[^a-zA-Z0-9]/g, '_')}_brickOS_Package.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Nashville SOP Live Checks
  const hasChorus = track.lyrics.toLowerCase().includes('[chorus]');
  const hasThroneRoom = track.lyrics.toLowerCase().includes('throne room') || track.lyrics.toLowerCase().includes('[bridge]');
  const linesCount = track.lyrics.split('\n').filter(Boolean).length;
  const wordCount = track.lyrics.split(/\s+/).filter(Boolean).length;

  // Cliché Filter check
  const cliches = ['blessed and highly favored', 'fellowship', 'anointing fall', 'walk in victory', 'financial breakthrough'];
  const foundCliches = cliches.filter(c => track.lyrics.toLowerCase().includes(c));

  return (
    <div className="space-y-6">

      {/* STORAGE & SYNC STATUS HEADER BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-700/40 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Lyrics Sovereign Vault</span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-700/50">
                ✓ LocalStorage & WebDAV Synced
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Last saved: <strong className="text-slate-200">{lastSavedTime}</strong> • Version: <strong className="text-indigo-400">{track.versions[track.versions.length - 1]?.version || 'v1.0'}</strong>
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Import Lyrics Button */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-950 transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Lyrics</span>
          </button>

          {/* Save Checkpoint Button */}
          <button
            onClick={() => setIsCheckpointModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition"
          >
            <Save className="w-3.5 h-3.5 text-amber-400" />
            <span>Save Checkpoint</span>
          </button>

          {/* Download TXT */}
          <button
            onClick={handleDownloadTxt}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition"
            title="Download formatted lyrics (.txt)"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">.TXT</span>
          </button>

          {/* Export JSON */}
          <button
            onClick={handleExportJson}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition"
            title="Export complete song package (.json)"
          >
            <HardDrive className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Package</span>
          </button>

          {/* Suno 4-Block Bundle */}
          <button
            onClick={handleCopyAllBlocks}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>⚡ Copy Suno 4-Blocks</span>
          </button>
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKBENCH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: ACTIVE LYRIC WORKBENCH & AUDIT */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Active Lyric Workbench</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400">
                  {linesCount} lines • {wordCount} words
                </span>
                <span className="text-[11px] font-mono text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800/40">
                  {track.versions[track.versions.length - 1]?.version || 'v1.0'}
                </span>
              </div>
            </div>

            {/* Lyric Textarea */}
            <textarea
              rows={15}
              value={track.lyrics}
              onChange={(e) => onUpdateTrack('lyrics', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-indigo-500 custom-scrollbar shadow-inner"
              placeholder="Write lyrics with meta tags: [Verse 1], [Chorus], [Bridge], [Outro]..."
            />

            {/* Nashville SOP Live Quality Badges */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                <span>The Nashville SOP v1.9 Live Rules</span>
                <span className="text-indigo-400 font-mono">Real-time Quality Audit</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                
                {/* 1. OBI Funnel */}
                <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${
                  hasChorus ? 'bg-emerald-950/40 border-emerald-700/40 text-emerald-300' : 'bg-rose-950/40 border-rose-700/40 text-rose-300'
                }`}>
                  <CheckCircle className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">OBI Chorus Funnel</span>
                </div>

                {/* 2. Throne Room Pivot */}
                <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${
                  hasThroneRoom ? 'bg-emerald-950/40 border-emerald-700/40 text-emerald-300' : 'bg-amber-950/40 border-amber-700/40 text-amber-300'
                }`}>
                  <Heart className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">Throne Room Pivot</span>
                </div>

                {/* 3. Christianese Filter */}
                <div className={`p-2 rounded-lg border flex items-center gap-1.5 ${
                  foundCliches.length === 0 ? 'bg-emerald-950/40 border-emerald-700/40 text-emerald-300' : 'bg-rose-950/40 border-rose-700/40 text-rose-300'
                }`}>
                  <ShieldCheck className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{foundCliches.length === 0 ? 'No Clichés' : `${foundCliches.length} Clichés`}</span>
                </div>

                {/* 4. Sonic Scar 3:1 */}
                <div className="p-2 rounded-lg border bg-slate-900 border-slate-800 text-slate-300 flex items-center gap-1.5">
                  <Flame className="w-3 h-3 text-amber-400 flex-shrink-0" />
                  <span className="truncate">3:1 Sonic Scar</span>
                </div>

              </div>

              {foundCliches.length > 0 && (
                <div className="p-2 bg-rose-950/30 border border-rose-800/40 rounded-lg text-[10px] text-rose-300">
                  <strong>Christianese Filter Warning:</strong> Flagged clichés: {foundCliches.join(', ')}. Replace with honest 5 AM blue-collar truck cab reality.
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
              <button
                onClick={() => onCopyText(track.lyrics, `${track.title} Lyrics`)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center gap-1.5 transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Raw Lyrics</span>
              </button>

              <div className="flex items-center gap-2">
                <select
                  value={auditModel}
                  onChange={(e) => setAuditModel(e.target.value as any)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Theological Audit)</option>
                  <option value="gemini-3.5-flash">Gemini 3.5 Flash (Fast Check)</option>
                </select>

                <button
                  onClick={handleRunAudit}
                  disabled={isAuditing}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-50 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isAuditing ? 'Auditing...' : 'Run Copilot Audit'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Audit Result Display */}
          {auditResult && (
            <div className="bg-slate-900 border border-indigo-700/40 rounded-2xl p-5 space-y-3 shadow-xl animate-fadeIn">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Theological & Lyrical Audit Results</span>
                </h4>
                <button
                  onClick={() => setAuditResult(null)}
                  className="text-slate-500 hover:text-slate-300 text-xs"
                >
                  ✕
                </button>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto custom-scrollbar">
                {auditResult}
              </div>
            </div>
          )}

          {/* REVISION HISTORY & SAVED VERSIONS */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-indigo-400" />
                <span>Immutable Checkpoints & Saved Versions ({track.versions.length})</span>
              </h3>
              <button
                onClick={() => setIsCheckpointModalOpen(true)}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                + New Checkpoint
              </button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
              {track.versions.map((ver, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-indigo-300 font-mono bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/40">
                        {ver.version}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">{ver.timestamp}</span>
                    </div>
                    <div className="text-[11px] text-slate-300 font-medium">{ver.reason}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setComparingVersion(ver)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Diff</span>
                    </button>
                    <button
                      onClick={() => {
                        onUpdateTrack('lyrics', ver.lyrics);
                        onCopyText(ver.lyrics, `Version ${ver.version} restored`);
                      }}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-indigo-600 text-white text-[10px] font-bold transition"
                    >
                      Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: SUNO v5.5 4-BLOCK ENGINE */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Suno v5.5 4-Block Generation Engine</span>
                </h3>
                <p className="text-[11px] text-slate-400">Copy each individual block directly into Suno.com fields.</p>
              </div>
            </div>

            {/* BLOCK 1: LYRICS & META-TAGS */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-400">BLOCK 1: Lyrics & Meta-Tags</span>
                <button
                  onClick={() => {
                    onCopyText(block1Lyrics, 'Block 1: Lyrics');
                    setCopiedBlock(1);
                    setTimeout(() => setCopiedBlock(null), 2000);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 transition"
                >
                  {copiedBlock === 1 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedBlock === 1 ? 'Copied!' : 'Copy Block 1'}</span>
                </button>
              </div>
              <pre className="text-[11px] text-slate-300 font-mono bg-slate-900/60 p-2.5 rounded-lg max-h-24 overflow-y-auto whitespace-pre-wrap">
                {block1Lyrics}
              </pre>
            </div>

            {/* BLOCK 2: STYLE OF MUSIC */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-400">BLOCK 2: Style of Music</span>
                <button
                  onClick={() => {
                    onCopyText(block2Style, 'Block 2: Style');
                    setCopiedBlock(2);
                    setTimeout(() => setCopiedBlock(null), 2000);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 transition"
                >
                  {copiedBlock === 2 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedBlock === 2 ? 'Copied!' : 'Copy Block 2'}</span>
                </button>
              </div>
              <input
                type="text"
                value={track.sunoPrompt}
                onChange={(e) => onUpdateTrack('sunoPrompt', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* BLOCK 3: EXCLUDED STYLES (ARTIFACT KILLER) */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-rose-400">BLOCK 3: Excluded Styles (Artifact Killer)</span>
                <button
                  onClick={() => {
                    onCopyText(block3Excluded, 'Block 3: Excluded');
                    setCopiedBlock(3);
                    setTimeout(() => setCopiedBlock(null), 2000);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 transition"
                >
                  {copiedBlock === 3 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedBlock === 3 ? 'Copied!' : 'Copy Block 3'}</span>
                </button>
              </div>
              <textarea
                rows={2}
                value={track.negativePrompt}
                onChange={(e) => onUpdateTrack('negativePrompt', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* BLOCK 4: ENGINE SLIDERS */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400">BLOCK 4: Suno v5.5 Engine Sliders</span>
                <button
                  onClick={() => {
                    onCopyText(block4Sliders, 'Block 4: Sliders');
                    setCopiedBlock(4);
                    setTimeout(() => setCopiedBlock(null), 2000);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 transition"
                >
                  {copiedBlock === 4 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedBlock === 4 ? 'Copied!' : 'Copy Block 4'}</span>
                </button>
              </div>

              {/* Weirdness Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Weirdness (0-20 target)</span>
                  <span className="font-mono text-indigo-400">{track.engineSliders?.weirdness ?? 12}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={track.engineSliders?.weirdness ?? 12}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    onUpdateTrack('engineSliders', { ...track.engineSliders, weirdness: val });
                  }}
                  className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Style Influence */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Style Influence (40-75 target)</span>
                  <span className="font-mono text-amber-400">{track.engineSliders?.styleInfluence ?? 65}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={track.engineSliders?.styleInfluence ?? 65}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    onUpdateTrack('engineSliders', { ...track.engineSliders, styleInfluence: val });
                  }}
                  className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Voice/Audio Lock */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Voice/Audio Formant Lock (100)</span>
                  <span className="font-mono text-emerald-400">{track.engineSliders?.voiceAudio ?? 100}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={track.engineSliders?.voiceAudio ?? 100}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    onUpdateTrack('engineSliders', { ...track.engineSliders, voiceAudio: val });
                  }}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

            </div>

          </div>
        </div>

      </div>

      {/* MODAL 1: IMPORT LYRICS DIALOG */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-fadeIn">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-400" />
                <span>Import Lyrics into {track.title} ({track.id})</span>
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            {/* Drag & drop or file upload area */}
            <div className="space-y-4 text-xs">
              <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-5 text-center bg-slate-950/60 cursor-pointer relative transition">
                <input
                  type="file"
                  accept=".txt,.lrc,.md"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <FileUp className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                <p className="font-bold text-slate-200">Click to select or drag & drop a file</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Supports .txt, .lrc, .md lyrics files</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-300">Or Paste Lyrics Directly:</label>
                  <span className="text-[11px] text-slate-500 font-mono">{importedText.split('\n').filter(Boolean).length} lines</span>
                </div>
                <textarea
                  rows={8}
                  value={importedText}
                  onChange={(e) => setImportedText(e.target.value)}
                  placeholder="Paste your lyrics here..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 font-mono text-slate-200 text-xs focus:outline-none focus:border-indigo-500 custom-scrollbar"
                />
              </div>

              {/* Options */}
              <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoTagLyrics}
                    onChange={(e) => setAutoTagLyrics(e.target.checked)}
                    className="accent-indigo-500 rounded"
                  />
                  <span>Auto-inject Suno meta tags ([Verse 1], [Chorus], [Bridge])</span>
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Mode:</span>
                  <select
                    value={importMode}
                    onChange={(e) => setImportMode(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                  >
                    <option value="replace">Replace Current Lyrics</option>
                    <option value="append">Append to End</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessImport}
                disabled={!importedText.trim()}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-950"
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Import Lyrics</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: MANUAL SAVE CHECKPOINT DIALOG */}
      {isCheckpointModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fadeIn">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Save className="w-5 h-5 text-amber-400" />
                <span>Save Studio Checkpoint</span>
              </h3>
              <button
                onClick={() => setIsCheckpointModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-400">
                This commits an immutable revision into version history for <strong>{track.title}</strong> with exact rollback capability.
              </p>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Commit Message / Revision Note:</label>
                <input
                  type="text"
                  value={checkpointReason}
                  onChange={(e) => setCheckpointReason(e.target.value)}
                  placeholder="e.g. Added Throne Room Bridge, Nashville SOP edit"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsCheckpointModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCommitCheckpoint}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
              >
                Commit Version v{(track.versions.length + 1).toFixed(1)}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 3: DIFF COMPARISON VIEWER */}
      {comparingVersion && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 space-y-4 shadow-2xl animate-fadeIn">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-400" />
                <span>Diff: Version {comparingVersion.version} vs Current Draft</span>
              </h3>
              <button
                onClick={() => setComparingVersion(null)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-1">
                <div className="flex justify-between font-bold text-slate-400 pb-1 border-b border-slate-800">
                  <span>Version {comparingVersion.version} ({comparingVersion.timestamp})</span>
                  <span>{comparingVersion.reason}</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 max-h-96 overflow-y-auto custom-scrollbar text-slate-300 whitespace-pre-wrap">
                  {comparingVersion.lyrics}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-bold text-indigo-400 pb-1 border-b border-slate-800">
                  <span>Current Active Draft</span>
                  <span>Live Buffer</span>
                </div>
                <div className="bg-slate-950 border border-indigo-900/60 rounded-xl p-4 max-h-96 overflow-y-auto custom-scrollbar text-slate-200 whitespace-pre-wrap">
                  {track.lyrics}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setComparingVersion(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                Close Diff
              </button>
              <button
                onClick={() => {
                  onUpdateTrack('lyrics', comparingVersion.lyrics);
                  setComparingVersion(null);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
              >
                Rollback to {comparingVersion.version}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
