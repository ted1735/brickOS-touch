import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  Download,
  Sliders,
  Sparkles,
  Music,
  Share2,
  HardDrive,
  RefreshCw,
  Layers,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { Track } from '../types';
import { CURRENT_STUDIO_VERSION } from '../utils/versioning';
import { SectionQuickHelpBanner } from './SectionQuickHelpBanner';

interface LiveMinistryChartsTabProps {
  track: Track;
  onCopyText: (text: string, label: string) => void;
  onOpenSectionGuide?: (sectionId?: any) => void;
  isDarkMode?: boolean;
}

const KEYS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

export const LiveMinistryChartsTab: React.FC<LiveMinistryChartsTabProps> = ({ track, onCopyText }) => {
  const [targetKey, setTargetKey] = useState<string>(track.key.split(' ')[0] || 'D');
  const [viewFormat, setViewFormat] = useState<'chordpro' | 'nashville' | 'onsong'>('chordpro');
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  // Generate ChordPro text
  const chordProOutput = `{title: ${track.title}}
{artist: Ted Moyer}
{key: ${targetKey}m}
{tempo: ${track.bpm}}
{time: 4/4}
{c: BRICK Records Ministry Chart - Planning Center Ready}

{comment: Verse 1}
[${targetKey}m]They see ruins, [Bb]I see the blueprint
[C]B-R-I-C-K, [Am]yeah, let’s build
[${targetKey}m]Streets hum a hymn, but the [Bb]chords ring hollow
[C]Carrying cement where the [Am]broken souls follow

{comment: Chorus - High Energy}
[${targetKey}m]Kingdom Come, [Bb]Kingdom Come!
[C]Where the shattered [Am]hearts run!
[${targetKey}m]Building the hope from the [Bb]corner to the crown
[C]Brick by brick, [Am]tearing old walls down!

{comment: Bridge - The Throne Room Pivot}
[Bb]Lord, take the mortar from my [C]trembling hands
[${targetKey}m]I was just a builder on [Am]sinking sands
[Bb]Now the cornerstone is set, now the [C]temple stands
[${targetKey}m]Holy, Holy, Holy is Your [Am]true design!`;

  // Generate Nashville Number System (NNS)
  const nashvilleOutput = `CHART: ${track.title.toUpperCase()} (Ted Moyer)
BPM: ${track.bpm} | KEY: ${targetKey}m | TIME: 4/4

VERSE 1:
1m   | b6   | b7   | 5m
1m   | b6   | b7   | 5m

CHORUS:
1m   | b6   | b7   | 5m
1m   | b6   | b7   | 5m (Diamond Hold)

BRIDGE (Throne Room Pivot):
b6   | b7   | 1m   | 5m
b6   | b7   | 1m   | 5m (Build 16ths)

OUTRO:
1m   | 1m   | 1m   | 1m (Ring Out)`;

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    onCopyText(text, label);
    setCopiedLabel(label);
    setTimeout(() => setCopiedLabel(null), 2000);
  };

  // Download ChordPro file
  const handleDownloadChordPro = () => {
    const blob = new Blob([chordProOutput], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${track.title.replace(/\s+/g, '_')}_${targetKey}m_PlanningCenter.pro`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download Live Stage Stems Manifest
  const handleDownloadStemsManifest = () => {
    const manifest = {
      bundle: "brickOS Stage Stems Package",
      version: CURRENT_STUDIO_VERSION,
      trackId: track.id,
      title: track.title,
      tempoBpm: track.bpm,
      performanceKey: `${targetKey}m`,
      clickTrack: `https://nextcloud.moyercloud.com/remote.php/dav/files/ncted/Music-Production/${track.id}/stems/track4_click.wav`,
      guideVocal: `https://nextcloud.moyercloud.com/remote.php/dav/files/ncted/Music-Production/${track.id}/stems/track2_vocal.wav`,
      instrumentalPad: `https://nextcloud.moyercloud.com/remote.php/dav/files/ncted/Music-Production/${track.id}/stems/track1_instrumental.wav`,
      harmonies: `https://nextcloud.moyercloud.com/remote.php/dav/files/ncted/Music-Production/${track.id}/stems/track3_harmonies.wav`,
      ccliLicense: "BRICK Records Ministry Non-Profit Exemption"
    };
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${track.id}_Stage_Stems_Manifest.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* SECTION QUICK HELP BANNER & SOP GUIDE */}
      <SectionQuickHelpBanner
        sectionId="ministry"
        onOpenModalGuide={(sec) => onOpenSectionGuide?.(sec || 'ministry')}
        isDarkMode={isDarkMode}
      />
      
      {/* HEADER */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 font-mono text-[10px] font-bold border border-blue-700/50">
              CONGREGATIONAL STEMS & CHARTS
            </span>
            <span className="text-xs text-slate-400">Live Ministry & Worship Transposer</span>
          </div>
          <h2 className="text-lg font-black text-white mt-1 flex items-center gap-2">
            <Music className="w-5 h-5 text-blue-400" />
            <span>{track.title} Worship Charts (PCO & OnSong)</span>
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenSectionGuide && (
            <button
              type="button"
              onClick={() => onOpenSectionGuide('ministry')}
              className="px-3.5 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 text-xs font-bold border border-amber-700/50 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Open Live Ministry Charts Operating Guide & SOP Rules"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>How To Use Ministry Charts</span>
            </button>
          )}

          {/* Key Transposer */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-bold">Key:</span>
            <select
              value={targetKey}
              onChange={(e) => setTargetKey(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none"
            >
              {KEYS.map(k => (
                <option key={k} value={k} className="bg-slate-900 text-white">
                  {k} Minor ({k}m)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleDownloadChordPro}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .PRO Chart</span>
          </button>

          <button
            onClick={handleDownloadStemsManifest}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition"
          >
            <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
            <span>Stage Stems Manifest</span>
          </button>
        </div>
      </div>

      {/* FORMAT SELECTOR & OUTPUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT: CHART DISPLAY */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
              {/* Format buttons */}
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'chordpro', label: 'ChordPro / Planning Center (PCO)' },
                  { id: 'nashville', label: 'Nashville Number System (NNS)' }
                ].map(fmt => (
                  <button
                    key={fmt.id}
                    onClick={() => setViewFormat(fmt.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      viewFormat === fmt.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleCopy(viewFormat === 'chordpro' ? chordProOutput : nashvilleOutput, 'Chart Text')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
              >
                {copiedLabel === 'Chart Text' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Chart</span>
              </button>
            </div>

            {/* Code / Text Output */}
            <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-[500px] custom-scrollbar">
              {viewFormat === 'chordpro' ? chordProOutput : nashvilleOutput}
            </pre>
          </div>
        </div>

        {/* RIGHT: STAGE STEMS PACKAGE SPECIFICATIONS */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Live Worship Stage Package (4 Stems)</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="font-bold text-indigo-400">1. Click & Guide Vocal Bus</div>
                <p className="text-[11px] text-slate-400 font-mono">Count-in 1-2-3-4 + Section cues (Verse, Chorus, Pivot)</p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="font-bold text-emerald-400">2. True Instrumental / Sub Bass</div>
                <p className="text-[11px] text-slate-400 font-mono">808 & Bass guitar routed directly to stage subwoofers</p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="font-bold text-amber-400">3. Ambient Pad & Choir Reverb</div>
                <p className="text-[11px] text-slate-400 font-mono">Continuous drone in key of {targetKey}m for seamless transitions</p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="font-bold text-purple-400">4. Lead Formant Stem (UVR5)</div>
                <p className="text-[11px] text-slate-400 font-mono">Vocal backing for solo acoustic leaders</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <p className="text-[10px] text-slate-500 italic">
                Directly streamable via Nextcloud WebDAV on iPad or Stage Laptop using OnSong or Ableton Live.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
