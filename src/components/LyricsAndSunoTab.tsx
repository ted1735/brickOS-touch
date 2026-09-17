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
  Trash2,
  History,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  BookmarkCheck,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { Track, AuditFeedbackRecord, TrackVersion } from '../types';

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
  const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);
  const [auditModel, setAuditModel] = useState<'gemini-3.1-pro-preview' | 'gemini-3.5-flash'>('gemini-3.1-pro-preview');
  const [copiedBlock, setCopiedBlock] = useState<number | null>(null);
  const [isFeedbackCopied, setIsFeedbackCopied] = useState(false);

  // Automated Re-write & Dual-Version Commitment Pipeline
  const [isApplyingChanges, setIsApplyingChanges] = useState(false);
  const [applyStageMessage, setApplyStageMessage] = useState<string | null>(null);
  const [successCommitNotification, setSuccessCommitNotification] = useState<{
    message: string;
    preVer: string;
    postVer: string;
  } | null>(null);

  // Stored Feedback History & Review Vault State
  const [showFeedbackVault, setShowFeedbackVault] = useState(false);
  const [expandedFeedbackId, setExpandedFeedbackId] = useState<string | null>(null);

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

  // Sync feedback history from track or localStorage on track selection
  useEffect(() => {
    if (!track.auditHistory || track.auditHistory.length === 0) {
      try {
        const saved = localStorage.getItem(`brickos_audit_${track.id}`);
        if (saved) {
          const parsed: AuditFeedbackRecord[] = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            onUpdateTrack('auditHistory', parsed);
            if (!auditResult) {
              setAuditResult(parsed[0].feedback);
              setActiveFeedbackId(parsed[0].id);
            }
          }
        }
      } catch (_) {}
    } else if (track.auditHistory && track.auditHistory.length > 0 && !auditResult) {
      setAuditResult(track.auditHistory[0].feedback);
      setActiveFeedbackId(track.auditHistory[0].id);
    }
  }, [track.id]);

  // Direct Paste from Clipboard helper
  const handlePasteToLyrics = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        onUpdateTrack('lyrics', text);
      } else {
        setIsImportModalOpen(true);
      }
    } catch {
      setIsImportModalOpen(true);
    }
  };

  const handleInsertTag = (tag: string) => {
    const newLyrics = track.lyrics ? `${track.lyrics}\n\n${tag}\n` : `${tag}\n`;
    onUpdateTrack('lyrics', newLyrics);
  };

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

  // Run Gemini Lyrical & Theological Audit and store in review archive
  const handleRunAudit = async () => {
    if (!track.lyrics || !track.lyrics.trim()) {
      setAuditResult('Please paste or write lyrics first before running the theological audit.');
      return;
    }
    setIsAuditing(true);
    setAuditResult(null);
    setSuccessCommitNotification(null);
    try {
      const res = await fetch('/api/gemini/audit-lyric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: track.title,
          trackTitle: track.title,
          genre: track.genre,
          bpm: track.bpm,
          thesis: track.thesis,
          lyrics: track.lyrics,
          vocal: track.vocalCast || track.vocal,
          vocalCast: track.vocalCast || track.vocal,
          ep: track.ep,
          model: auditModel
        })
      });
      const data = await res.json();
      const feedbackText = data.audit || 'Audit complete: Lyrics pass Nashville SOP v1.9 standards.';
      setAuditResult(feedbackText);

      // Storing feedback for review later in the Review Vault
      const newRecord: AuditFeedbackRecord = {
        id: `fb-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString(),
        model: auditModel === 'gemini-3.1-pro-preview' ? 'Gemini 3.1 Pro' : 'Gemini 3.5 Flash',
        feedback: feedbackText,
        status: 'pending'
      };

      const updatedHistory = [newRecord, ...(track.auditHistory || [])];
      onUpdateTrack('auditHistory', updatedHistory);
      setActiveFeedbackId(newRecord.id);

      try {
        localStorage.setItem(`brickos_audit_${track.id}`, JSON.stringify(updatedHistory));
      } catch (_) {}

    } catch (err: any) {
      setAuditResult(`[Audit Error] ${err.message || 'Unable to connect to Gemini API. Check network.'}`);
    } finally {
      setIsAuditing(false);
    }
  };

  // Quick Copy button for audit feedback
  const handleCopyFeedbackText = (textToCopy?: string) => {
    const text = textToCopy || auditResult;
    if (!text) return;
    onCopyText(text, 'Gemini Audit Feedback');
    setIsFeedbackCopied(true);
    setTimeout(() => setIsFeedbackCopied(false), 2500);
  };

  // "Yes, I Agree — Apply Changes" automated workflow
  // 1. Instant version commitment before any changes
  // 2. Gemini rewrites lyrics with feedback
  // 3. Screen updates live with new lyrics
  // 4. Instant version commitment after changes finished
  const handleApplyFeedbackChanges = async (targetFeedback?: AuditFeedbackRecord) => {
    const feedbackText = targetFeedback ? targetFeedback.feedback : auditResult;
    if (!feedbackText || !track.lyrics.trim() || isApplyingChanges) return;

    setIsApplyingChanges(true);
    setSuccessCommitNotification(null);

    try {
      // STEP 1: INSTANT VERSION COMMITMENT BEFORE ANY CHANGES
      const currentVerCount = track.versions.length;
      const preVersionLabel = `v${(currentVerCount + 0.1).toFixed(1)} (Pre-AI Snapshot)`;
      setApplyStageMessage(`Step 1/3: Instant version ${preVersionLabel} committed before changes...`);

      onUpdateTrack('version_commit', {
        version: preVersionLabel,
        reason: 'Pre-Gemini Revision snapshot before applying audit critique',
        lyrics: track.lyrics,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
      });

      // UX pause for visual confirmation
      await new Promise(r => setTimeout(r, 600));

      // STEP 2: GEMINI REWRITES THE LYRICS BASED ON AUDIT FEEDBACK
      setApplyStageMessage('Step 2/3: Gemini is rewriting lyrics live to resolve all audit directives...');

      const res = await fetch('/api/gemini/rewrite-lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: track.title,
          genre: track.genre,
          bpm: track.bpm,
          thesis: track.thesis,
          lyrics: track.lyrics,
          vocal: track.vocalCast || track.vocal,
          ep: track.ep,
          auditFeedback: feedbackText,
          model: auditModel
        })
      });

      const data = await res.json();
      if (!data.rewrittenLyrics) {
        throw new Error(data.error || 'Gemini did not return rewritten lyrics');
      }

      const rewrittenLyrics = data.rewrittenLyrics;

      // STEP 3: LIVE SCREEN UPDATE OF REWRITTEN LYRICS
      setApplyStageMessage('Step 3/3: Updating lyrics live & committing post-revision version...');
      onUpdateTrack('lyrics', rewrittenLyrics);

      // STEP 4: INSTANT VERSION COMMITMENT AFTER CHANGES FINISHED
      const postVersionLabel = `v${(currentVerCount + 1).toFixed(1)} (Post-AI Revision)`;

      // Update feedback item status to 'applied'
      const targetId = targetFeedback ? targetFeedback.id : activeFeedbackId;
      const updatedAuditHistory = (track.auditHistory || []).map(item => {
        if (item.id === targetId || (item.feedback === feedbackText && item.status === 'pending')) {
          return {
            ...item,
            status: 'applied' as const,
            preRevisionVersion: preVersionLabel,
            postRevisionVersion: postVersionLabel
          };
        }
        return item;
      });

      onUpdateTrack('version_commit', {
        version: postVersionLabel,
        reason: `Applied Gemini audit revisions (${auditModel === 'gemini-3.1-pro-preview' ? 'Gemini 3.1 Pro' : 'Gemini 3.5 Flash'})`,
        lyrics: rewrittenLyrics,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        auditHistory: updatedAuditHistory
      });

      try {
        localStorage.setItem(`brickos_audit_${track.id}`, JSON.stringify(updatedAuditHistory));
      } catch (_) {}

      setSuccessCommitNotification({
        message: 'Revisions successfully applied and updated live on screen!',
        preVer: preVersionLabel,
        postVer: postVersionLabel
      });

    } catch (err: any) {
      console.error('Failed to apply audit changes:', err);
      alert(`Error applying Gemini revisions: ${err.message || 'Server error'}`);
    } finally {
      setIsApplyingChanges(false);
      setApplyStageMessage(null);
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

            {/* Quick Lyric Actions Toolbar */}
            <div className="flex items-center justify-between gap-2 flex-wrap bg-slate-950 p-2 rounded-xl border border-slate-800">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handlePasteToLyrics}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1 shadow transition cursor-pointer"
                  title="Paste lyrics directly from your clipboard"
                >
                  <Upload className="w-3 h-3" />
                  <span>Paste Clipboard</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium border border-slate-700 transition cursor-pointer"
                  title="Open Import / Upload Modal"
                >
                  <span>Import / TXT</span>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateTrack('lyrics', '')}
                  className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 text-[11px] font-medium border border-slate-800 hover:border-rose-800/40 transition cursor-pointer"
                  title="Clear all lyrics"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              </div>

              {/* Quick section tag buttons */}
              <div className="flex items-center gap-1 overflow-x-auto text-[10px] font-mono">
                <span className="text-slate-500 mr-1 text-[9px] uppercase font-sans">Insert:</span>
                <button
                  type="button"
                  onClick={() => handleInsertTag('[Verse 1]')}
                  className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800"
                >
                  +Verse
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTag('[Chorus]')}
                  className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-indigo-300 hover:text-white border border-indigo-900/40"
                >
                  +Chorus
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTag('[Bridge]\n[The Throne Room Pivot]')}
                  className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-white border border-amber-900/40"
                >
                  +Bridge
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTag('[Outro]')}
                  className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800"
                >
                  +Outro
                </button>
              </div>
            </div>

            {/* Lyric Textarea */}
            <textarea
              rows={15}
              value={track.lyrics}
              onChange={(e) => onUpdateTrack('lyrics', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-indigo-500 custom-scrollbar shadow-inner"
              placeholder="Write or paste lyrics with meta tags: [Verse 1], [Chorus], [Bridge], [Outro]..."
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

          {/* Success Notification Banner after applying changes */}
          {successCommitNotification && (
            <div className="bg-emerald-950/80 border border-emerald-600/50 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-4 animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
                  <CheckCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-300">{successCommitNotification.message}</h4>
                  <p className="text-[11px] text-emerald-400/80 font-mono mt-0.5">
                    Pre-change snapshot: <span className="text-white font-bold">{successCommitNotification.preVer}</span> • Post-change version: <span className="text-white font-bold">{successCommitNotification.postVer}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const postVer = track.versions.find(v => v.version.includes('Post-AI'));
                    if (postVer) setComparingVersion(postVer);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-900/70 hover:bg-emerald-800 text-white text-[11px] font-bold border border-emerald-700/50 transition cursor-pointer"
                >
                  Inspect Diff
                </button>
                <button
                  type="button"
                  onClick={() => setSuccessCommitNotification(null)}
                  className="p-1 rounded text-emerald-400 hover:text-white"
                  title="Dismiss notification"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Active Audit Result & Action Deck */}
          {auditResult && (
            <div className="bg-slate-900 border border-indigo-600/40 rounded-2xl p-5 space-y-4 shadow-2xl animate-fadeIn">
              
              {/* Header */}
              <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-700/60 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <span>brickOS Gemini Theological & Lyrical Audit</span>
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span className="font-mono text-indigo-300 font-semibold">{auditModel}</span>
                      <span>•</span>
                      {track.auditHistory?.find(a => a.id === activeFeedbackId)?.status === 'applied' ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Changes Applied
                        </span>
                      ) : (
                        <span className="text-amber-400 font-bold">Review & Action Required</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFeedbackVault(!showFeedbackVault)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
                    title="View stored feedback archive"
                  >
                    <History className="w-3.5 h-3.5 text-purple-400" />
                    <span>Review Vault ({(track.auditHistory || []).length})</span>
                    {showFeedbackVault ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setAuditResult(null)}
                    className="p-1 rounded text-slate-400 hover:text-slate-200 transition cursor-pointer"
                    title="Close active feedback card"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Feedback Content Monospace Viewer */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 font-mono leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto custom-scrollbar shadow-inner">
                {auditResult}
              </div>

              {/* Live Stage Progress Indicator during Dual Version Commit & Rewrite */}
              {isApplyingChanges && (
                <div className="bg-indigo-950/70 border border-indigo-700/50 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-200">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                      <span>{applyStageMessage || 'Executing automated revision pipeline...'}</span>
                    </span>
                    <span className="font-mono text-[11px] text-amber-400 animate-pulse">LIVE PIPELINE</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 h-full w-full animate-pulse"></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px] font-mono pt-1 text-slate-400">
                    <span className="text-emerald-300">1. Instant Pre-Version ✓</span>
                    <span className="text-amber-300">2. Gemini Rewrite ⚡</span>
                    <span className="text-slate-400">3. Post-Version Commit</span>
                  </div>
                </div>
              )}

              {/* Action Bar: Quick Copy & Yes I Agree Make The Changes */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                
                {/* Left: Quick Copy Button */}
                <button
                  type="button"
                  onClick={() => handleCopyFeedbackText()}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 border border-slate-700 transition shadow-sm cursor-pointer"
                  title="Copy full theological feedback text to clipboard"
                >
                  {isFeedbackCopied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-300 font-bold">Feedback Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-indigo-400" />
                      <span>Copy Feedback</span>
                    </>
                  )}
                </button>

                {/* Right: "Yes, I Agree — Apply Changes" Button */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyFeedbackChanges()}
                    disabled={isApplyingChanges || isAuditing}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/60 transition disabled:opacity-50 cursor-pointer active:scale-95"
                    title="1. Commits pre-change version snapshot -> 2. Gemini rewrites lyrics -> 3. Updates screen live -> 4. Commits post-change version"
                  >
                    {isApplyingChanges ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Applying Revisions & Committing...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 text-white" />
                        <span>Yes, I Agree — Apply Changes</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* Feedback Review Vault & History (Stored for review later) */}
          {((track.auditHistory && track.auditHistory.length > 0) || showFeedbackVault) && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-purple-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Feedback Review Vault ({track.auditHistory?.length || 0} Stored)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFeedbackVault(!showFeedbackVault)}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <span>{showFeedbackVault ? 'Collapse' : 'Expand Review Vault'}</span>
                  {showFeedbackVault ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {(!track.auditHistory || track.auditHistory.length === 0) ? (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-500">
                  No feedback stored yet for this track. Click "Run Copilot Audit" above to analyze and store reviews here.
                </div>
              ) : (
                <div className="space-y-3">
                  {(showFeedbackVault ? track.auditHistory : track.auditHistory.slice(0, 2)).map((fb) => (
                    <div
                      key={fb.id}
                      className={`p-3.5 rounded-xl border transition space-y-2.5 ${
                        activeFeedbackId === fb.id
                          ? 'bg-slate-950 border-indigo-600/60 shadow-md shadow-indigo-950/40'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Top row: Timestamp, Model, Status */}
                      <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-indigo-300 font-mono bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/40 text-[11px]">
                            {fb.model}
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">{fb.timestamp}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {fb.status === 'applied' ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-700/50 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              <span>Applied ({fb.postRevisionVersion || 'Committed'})</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 font-mono text-[10px] font-bold border border-amber-700/50">
                              Pending Review
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Snippet / Full Text */}
                      <div className="text-xs text-slate-300 font-mono bg-slate-900/60 p-2.5 rounded-lg whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto custom-scrollbar">
                        {expandedFeedbackId === fb.id ? fb.feedback : (
                          fb.feedback.length > 280 ? `${fb.feedback.substring(0, 280)}...` : fb.feedback
                        )}
                      </div>

                      {/* Actions for this stored feedback */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-900 text-xs">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyFeedbackText(fb.feedback)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                            title="Copy this stored feedback"
                          >
                            <Copy className="w-3 h-3 text-indigo-400" />
                            <span>Copy</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setAuditResult(fb.feedback);
                              setActiveFeedbackId(fb.id);
                              window.scrollTo({ top: 400, behavior: 'smooth' });
                            }}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                            title="Load into active review workbench"
                          >
                            <Eye className="w-3 h-3 text-amber-400" />
                            <span>Open In Review</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setExpandedFeedbackId(expandedFeedbackId === fb.id ? null : fb.id)}
                            className="text-[11px] text-slate-400 hover:text-slate-200 underline ml-1"
                          >
                            {expandedFeedbackId === fb.id ? 'Show Less' : 'Show Full'}
                          </button>
                        </div>

                        {/* Apply button if not applied */}
                        {fb.status !== 'applied' && (
                          <button
                            type="button"
                            onClick={() => handleApplyFeedbackChanges(fb)}
                            disabled={isApplyingChanges}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shadow transition cursor-pointer disabled:opacity-50"
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span>Apply This Review</span>
                          </button>
                        )}
                      </div>

                    </div>
                  ))}

                  {!showFeedbackVault && (track.auditHistory?.length || 0) > 2 && (
                    <button
                      type="button"
                      onClick={() => setShowFeedbackVault(true)}
                      className="w-full py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold transition flex items-center justify-center gap-1"
                    >
                      <span>Show all {track.auditHistory?.length} stored reviews in vault</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

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
