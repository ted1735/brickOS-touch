import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  HardDrive,
  FileText,
  Music,
  Film,
  Package,
  Sparkles,
  ExternalLink,
  X
} from 'lucide-react';
import { Track } from '../types';

interface MasterDeliverablesExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track;
  onCopySuccess?: (msg: string) => void;
  isDarkMode?: boolean;
}

export const MasterDeliverablesExportModal: React.FC<MasterDeliverablesExportModalProps> = ({
  isOpen,
  onClose,
  track,
  onCopySuccess,
  isDarkMode = true
}) => {
  const [copiedRclone, setCopiedRclone] = useState(false);
  const [copiedManifest, setCopiedManifest] = useState(false);

  if (!isOpen) return null;

  // Construct deliverables manifest
  const manifest = {
    releaseId: `REL-${track.id}-${new Date().getFullYear()}`,
    trackId: track.id,
    title: track.title,
    epCollection: track.epCollection,
    bpm: track.bpm,
    key: track.key,
    camelotKey: track.camelotKey,
    vocalCast: track.vocalCast || track.vocal,
    masteringSpecs: {
      format: 'Linear PCM WAV 24-bit / 48.0 kHz',
      integratedLoudnessTarget: '-12.0 LUFS',
      truePeakCeiling: '-1.0 dBTP',
      subtractiveFilter: '80Hz 18dB/oct High-Pass',
      monoCorrelationCheck: 'Verified (>+0.7)'
    },
    stems: [
      { name: `${track.id}_01_Vocal_Lead_2448.wav`, type: 'Vocal Lead', status: 'Export Ready' },
      { name: `${track.id}_02_Drums_Transient_2448.wav`, type: 'Drums', status: 'Export Ready' },
      { name: `${track.id}_03_Bass_808_2448.wav`, type: 'Bass / Sub', status: 'Export Ready' },
      { name: `${track.id}_04_Instruments_Acoustic_2448.wav`, type: 'Guitars / Keys', status: 'Export Ready' }
    ],
    metadataFiles: [
      { filename: `${track.title.replace(/\s+/g, '_')}_Lyrics_Nashville_SOP.md`, description: 'Full verified lyrics with Throne Room Pivot audit' },
      { filename: `${track.title.replace(/\s+/g, '_')}_YouTube_SEO_Tags.txt`, description: 'High-CTR title variants and tags' },
      { filename: 'Cover_Art_3000x3000.png', description: '3000x3000px 300DPI digital streaming cover' },
      { filename: `${track.title.replace(/\s+/g, '_')}_VideoExpress_Reel_9x16.mp4`, description: '1080x1920 talking avatar visual' }
    ],
    nextcloudDestination: `/Music-Production/${track.epCollection || 'EP-Masters'}/${track.id}_${track.title.replace(/\s+/g, '_')}/`
  };

  const rcloneCommand = `rclone copy ./dist/masters/${track.id}/ Nextcloud:Music-Production/masters/${track.id}_${track.title.replace(/\s+/g, '_')} -P --transfers=4`;

  const handleDownloadManifest = () => {
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${track.id}_Deliverables_Manifest.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (onCopySuccess) onCopySuccess('Downloaded Deliverables Manifest JSON');
  };

  const handleCopyRclone = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(rcloneCommand);
      setCopiedRclone(true);
      setTimeout(() => setCopiedRclone(false), 3000);
      if (onCopySuccess) onCopySuccess('Copied Nextcloud Rclone sync command');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-slate-900 border border-emerald-600/40 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5 text-slate-100 max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-600/50 text-emerald-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>One-Click Master Deliverables Exporter</span>
                <span className="px-2 py-0.2 rounded bg-emerald-950 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-800">
                  {track.id}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Package master WAVs, 4-track stems, lyrics sheet, and YouTube SEO for {track.title}.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-sm cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Deliverables Body */}
        <div className="overflow-y-auto space-y-4 pr-1 flex-1 custom-scrollbar">
          {/* Master Specs Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-400 uppercase font-mono">Audio Specifications</span>
              <span className="text-[10px] font-mono text-slate-400">Nashville Standard</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-500">Format</div>
                <div className="text-white font-bold">24-bit / 48kHz WAV</div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-500">Integrated LUFS</div>
                <div className="text-emerald-400 font-bold">-12.0 LUFS</div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-500">True Peak Ceiling</div>
                <div className="text-indigo-400 font-bold">-1.0 dBTP</div>
              </div>
            </div>
          </div>

          {/* Stems & Metadata Files Checklist */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
              Package Files ({manifest.stems.length + manifest.metadataFiles.length} Total Assets)
            </h4>
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 divide-y divide-slate-800/80 text-xs">
              {manifest.stems.map((stem, i) => (
                <div key={i} className="p-2.5 flex items-center justify-between font-mono">
                  <div className="flex items-center gap-2">
                    <Music className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="text-slate-200">{stem.name}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                    {stem.type}
                  </span>
                </div>
              ))}
              {manifest.metadataFiles.map((meta, i) => (
                <div key={i} className="p-2.5 flex items-center justify-between font-mono">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-slate-200">{meta.filename}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 truncate max-w-[180px]">
                    {meta.description}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Nextcloud WebDAV destination */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-900/40 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-indigo-300 font-mono font-bold flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
                <span>Nextcloud WebDAV Sync Target (Folder 207332)</span>
              </span>
              <button
                type="button"
                onClick={handleCopyRclone}
                className="text-[10px] px-2 py-1 rounded bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/60 font-mono transition cursor-pointer flex items-center gap-1"
              >
                {copiedRclone ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                <span>{copiedRclone ? 'Copied' : 'Copy Rclone CLI'}</span>
              </button>
            </div>
            <code className="block p-2 rounded-lg bg-black/60 font-mono text-[11px] text-slate-300 overflow-x-auto">
              {rcloneCommand}
            </code>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 shrink-0">
          <div className="text-[10px] font-mono text-slate-500">
            Destination: <code className="text-slate-400">{manifest.nextcloudDestination}</code>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleDownloadManifest}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-950"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Deliverables Package (JSON)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
