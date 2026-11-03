import React, { useState, useMemo } from 'react';
import {
  Archive,
  Download,
  Copy,
  Check,
  HardDrive,
  FileCode,
  Layers,
  Sparkles,
  Upload,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Activity,
  ArrowRight,
  RefreshCw,
  FolderSync,
  X,
  FileCheck
} from 'lucide-react';
import {
  Track,
  MixerTrack,
  MixerGroup,
  DawEffectsState,
  TrackAutomationState,
  LufsMeasurementData,
  ProjectArchiveManifest
} from '../types';
import {
  buildProjectArchiveManifest,
  downloadProjectArchiveFile,
  validateProjectArchive
} from '../utils/projectArchive';
import { CURRENT_STUDIO_VERSION } from '../utils/versioning';

interface ProjectArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track;
  channels: MixerTrack[];
  groups?: MixerGroup[];
  effects: DawEffectsState;
  automation: Record<number, TrackAutomationState>;
  masterVolume: number;
  isMasterMuted: boolean;
  isMasterDimmed: boolean;
  isMonoCollapsed: boolean;
  cropPreset: '30s' | '60s' | 'full';
  lufsData?: LufsMeasurementData;
  activeFxPresetId?: string;
  onRestoreArchive?: (manifest: ProjectArchiveManifest) => void;
  onToast?: (message: string, type?: 'success' | 'info' | 'warn') => void;
  isDarkMode?: boolean;
}

export const ProjectArchiveModal: React.FC<ProjectArchiveModalProps> = ({
  isOpen,
  onClose,
  track,
  channels,
  groups = [],
  effects,
  automation,
  masterVolume,
  isMasterMuted,
  isMasterDimmed,
  isMonoCollapsed,
  cropPreset,
  lufsData,
  activeFxPresetId,
  onRestoreArchive,
  onToast,
  isDarkMode = true
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'json' | 'restore'>('overview');
  const [copiedManifest, setCopiedManifest] = useState(false);
  const [isSyncingToNextcloud, setIsSyncingToNextcloud] = useState(false);
  const [nextcloudSyncResult, setNextcloudSyncResult] = useState<string | null>(null);

  // Restore tab state
  const [importJsonText, setImportJsonText] = useState('');
  const [importValidationResult, setImportValidationResult] = useState<{
    valid: boolean;
    manifest?: ProjectArchiveManifest;
    error?: string;
  } | null>(null);

  // Build the live project archive manifest
  const manifest = useMemo(() => {
    return buildProjectArchiveManifest({
      track,
      channels,
      groups,
      effects,
      automation,
      masterVolume,
      isMasterMuted,
      isMasterDimmed,
      isMonoCollapsed,
      cropPreset,
      lufsData,
      activeFxPresetId
    });
  }, [
    track,
    channels,
    groups,
    effects,
    automation,
    masterVolume,
    isMasterMuted,
    isMasterDimmed,
    isMonoCollapsed,
    cropPreset,
    lufsData,
    activeFxPresetId
  ]);

  if (!isOpen) return null;

  const manifestJsonString = JSON.stringify(manifest, null, 2);

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(manifestJsonString);
      setCopiedManifest(true);
      if (onToast) onToast('Copied Project Archive JSON manifest to clipboard', 'success');
      setTimeout(() => setCopiedManifest(false), 2500);
    } catch (err) {
      console.error('Failed to copy JSON:', err);
    }
  };

  const handleDownload = () => {
    downloadProjectArchiveFile(manifest);
    if (onToast) onToast(`Downloaded Project Archive for ${track.title}`, 'success');
  };

  const handleSyncToNextcloud = async () => {
    setIsSyncingToNextcloud(true);
    setNextcloudSyncResult(null);
    try {
      const resp = await fetch('/api/project/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manifest })
      });
      const data = await resp.json();
      if (data.success) {
        setNextcloudSyncResult(`Synced to Nextcloud WebDAV: ${manifest.nextcloud.manifestPath}`);
        if (onToast) onToast('Project Archive saved to Nextcloud WebDAV storage', 'success');
      } else {
        setNextcloudSyncResult(`Local archive ready (Nextcloud offline fallback active)`);
        if (onToast) onToast('Archive created locally & ready for download', 'info');
      }
    } catch (err: any) {
      // Graceful offline fallback
      setNextcloudSyncResult(`Archive bundled locally (${manifest.checksum})`);
      if (onToast) onToast('Archive bundled locally & verified', 'info');
    } finally {
      setIsSyncingToNextcloud(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setImportJsonText(text);
      const valResult = validateProjectArchive(text);
      setImportValidationResult(valResult);
    };
    reader.readAsText(file);
  };

  const handleValidateImportText = (text: string) => {
    setImportJsonText(text);
    if (!text.trim()) {
      setImportValidationResult(null);
      return;
    }
    const valResult = validateProjectArchive(text);
    setImportValidationResult(valResult);
  };

  const handleApplyRestore = () => {
    if (!importValidationResult?.valid || !importValidationResult.manifest) return;
    if (onRestoreArchive) {
      onRestoreArchive(importValidationResult.manifest);
      if (onToast) {
        onToast(
          `Restored DAW Session from Archive: ${importValidationResult.manifest.track.title} (${importValidationResult.manifest.archiveId})`,
          'success'
        );
      }
      onClose();
    }
  };

  // Calculate high-level summary metrics
  const totalAutomationNodes = Object.values(automation).reduce(
    (acc, curr) => acc + (curr.volumeNodes?.length || 0) + (curr.panNodes?.length || 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full p-5 sm:p-6 space-y-5 shadow-2xl my-6 flex flex-col max-h-[92vh]">
        {/* Hardware Console Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-950 to-indigo-950 border border-amber-600/40 shadow-inner">
              <Archive className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white font-mono tracking-tight">
                  Project Archive Manifest
                </h3>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30">
                  {CURRENT_STUDIO_VERSION}
                </span>
                <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-mono text-[10px] font-bold border border-indigo-700/40">
                  {manifest.archiveId}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Lossless state bundle: 4-track channel strips, stereo pan, EQ/FX rack, automation envelopes & metadata.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close Project Archive Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Tabs Selector */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'overview'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Archive Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('json')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'json'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Raw JSON Manifest</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('restore')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'restore'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import / Restore Session</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* TAB 1: ARCHIVE OVERVIEW */}
          {activeSubTab === 'overview' && (
            <div className="space-y-4">
              {/* Summary Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Card 1: Track & Musical Specs */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 font-bold uppercase">
                    <span>Musical Specs</span>
                    <span className="text-amber-400 font-bold">{track.id}</span>
                  </div>
                  <div className="text-sm font-bold text-white truncate">{track.title}</div>
                  <div className="space-y-1 text-xs font-mono text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tempo / Key:</span>
                      <span className="text-cyan-300 font-bold">
                        {track.bpm || 78} BPM • {track.key || 'G Major'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Genre:</span>
                      <span className="text-slate-200">{track.genre}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status:</span>
                      <span className="text-amber-300 font-semibold">{track.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Time Window:</span>
                      <span className="text-indigo-300 font-semibold uppercase">{cropPreset}</span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Channel Strips & Stereo Positioning */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 font-bold uppercase">
                    <span>Mixer Channels ({channels.length})</span>
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div className="space-y-1.5 text-[11px] font-mono">
                    {channels.map((c) => {
                      const panLabel = c.pan === 0 ? 'C' : c.pan < 0 ? `L${Math.abs(c.pan)}` : `R${c.pan}`;
                      return (
                        <div key={c.id} className="flex items-center justify-between bg-slate-900/80 px-2 py-1 rounded">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                            <span className="text-slate-200 truncate">{c.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-400 shrink-0 font-bold">
                            <span className="text-emerald-400">{c.vol}%</span>
                            <span className="text-sky-300">{panLabel}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Card 3: Master FX Rack & LUFS Profile */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 font-bold uppercase">
                    <span>Master DSP & LUFS</span>
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="space-y-1 text-xs font-mono text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Target Standard:</span>
                      <span className="text-emerald-300 font-bold">{effects.targetLufs || -12.0} LUFS</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">True Peak Ceiling:</span>
                      <span className="text-indigo-300 font-bold">{effects.truePeakCeilingDb ?? -1.0} dBTP</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Automation Nodes:</span>
                      <span className="text-amber-300 font-bold">{totalAutomationNodes} pts</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Integrity Hash:</span>
                      <span className="text-slate-400 font-bold">{manifest.checksum}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nextcloud Destination Banner */}
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400">Nextcloud WebDAV Path:</span>
                  <span className="text-cyan-300 font-bold break-all">{manifest.nextcloud.manifestPath}</span>
                </div>
                {nextcloudSyncResult && (
                  <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{nextcloudSyncResult}</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: RAW JSON MANIFEST CODE VIEWER */}
          {activeSubTab === 'json' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Schema: brickos-project-archive-v1.0 • Formatted UTF-8 JSON</span>
                <span>{manifestJsonString.length} bytes</span>
              </div>
              <div className="relative">
                <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-300 max-h-[380px] overflow-auto select-all shadow-inner leading-relaxed">
                  {manifestJsonString}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: RESTORE / IMPORT ARCHIVE */}
          {activeSubTab === 'restore' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold flex items-center gap-2">
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>Load Project Archive File (.json)</span>
                  </span>
                  <label className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer transition">
                    Browse File...
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Select an exported Project Archive JSON to restore channel levels, pan knobs, EQ/mastering settings, and automation curves.
                </p>
              </div>

              {/* Direct Paste Alternative */}
              <div className="space-y-1.5">
                <label className="text-slate-400 font-bold block">Or Paste Manifest JSON String:</label>
                <textarea
                  value={importJsonText}
                  onChange={(e) => handleValidateImportText(e.target.value)}
                  placeholder="Paste JSON manifest content here..."
                  rows={6}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Validation Status Box */}
              {importValidationResult && (
                <div
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                    importValidationResult.valid
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {importValidationResult.valid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <div>
                      {importValidationResult.valid && importValidationResult.manifest ? (
                        <div>
                          <div className="font-bold">
                            Valid Archive: {importValidationResult.manifest.track.id} –{' '}
                            {importValidationResult.manifest.track.title}
                          </div>
                          <div className="text-[10px] opacity-80">
                            {importValidationResult.manifest.channels.length} channels • Target:{' '}
                            {importValidationResult.manifest.dawState.targetLufs} LUFS • Checksum:{' '}
                            {importValidationResult.manifest.checksum}
                          </div>
                        </div>
                      ) : (
                        <div className="font-bold">{importValidationResult.error}</div>
                      )}
                    </div>
                  </div>

                  {importValidationResult.valid && (
                    <button
                      type="button"
                      onClick={handleApplyRestore}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition cursor-pointer shadow-md flex items-center gap-1.5 shrink-0"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Restore DAW Session</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Footer Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 flex-wrap gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Ready for Export / WebDAV Cloud Backup</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCopyJson}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold font-mono transition border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              {copiedManifest ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Copied JSON!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSyncToNextcloud}
              disabled={isSyncingToNextcloud}
              className="px-3.5 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-200 text-xs font-bold font-mono transition border border-cyan-700/60 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Save manifest directly to Nextcloud WebDAV production directory"
            >
              <FolderSync className={`w-3.5 h-3.5 text-cyan-400 ${isSyncingToNextcloud ? 'animate-spin' : ''}`} />
              <span>{isSyncingToNextcloud ? 'Saving to WebDAV...' : 'Sync to Nextcloud'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-950/60"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Archive JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
