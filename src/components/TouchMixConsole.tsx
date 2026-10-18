import React, { useState } from 'react';
import {
  Play,
  Square,
  Volume2,
  VolumeX,
  Activity,
  Layers,
  Sparkles,
  Download,
  RotateCcw,
  Zap,
  Radio,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { Track, MixerTrack } from '../types';
import { TactileFader } from './TactileFader';
import { MasteringLufsSuite } from './MasteringLufsSuite';
import { audioMiniDaw } from '../utils/audioEngine';
import { getTrackStems } from '../data/nextcloudAssetIndex';

interface TouchMixConsoleProps {
  track: Track;
  isPlaying: boolean;
  onTogglePlay: () => void;
  masterVolume: number;
  onMasterVolumeChange: (vol: number) => void;
  onOpenExportModal: () => void;
  isDarkMode?: boolean;
}

export const TouchMixConsole: React.FC<TouchMixConsoleProps> = ({
  track,
  isPlaying,
  onTogglePlay,
  masterVolume,
  onMasterVolumeChange,
  onOpenExportModal,
  isDarkMode = true
}) => {
  const [stems, setStems] = useState<MixerTrack[]>(() => getTrackStems(track));
  const [showLufsSuite, setShowLufsSuite] = useState(false);

  const handleUpdateStem = (stemId: string, field: 'vol' | 'pan' | 'mute' | 'solo', value: any) => {
    setStems((prev) =>
      prev.map((s) => {
        if (s.id === stemId) {
          const updated = { ...s, [field]: value };
          // Sync with audioMiniDaw
          if (field === 'vol') audioMiniDaw.setTrackVolume(stemId, value);
          if (field === 'pan') audioMiniDaw.setTrackPan(stemId, value);
          if (field === 'mute') audioMiniDaw.setTrackMute(stemId, value);
          if (field === 'solo') audioMiniDaw.setTrackSolo(stemId, value);
          return updated;
        }
        return s;
      })
    );
  };

  const handleResetMixer = () => {
    setStems((prev) =>
      prev.map((s) => {
        audioMiniDaw.setTrackVolume(s.id, 80);
        audioMiniDaw.setTrackPan(s.id, 0);
        audioMiniDaw.setTrackMute(s.id, false);
        audioMiniDaw.setTrackSolo(s.id, false);
        return { ...s, vol: 80, pan: 0, mute: false, solo: false };
      })
    );
    onMasterVolumeChange(80);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-28 pt-2 animate-in fade-in duration-200">
      {/* CONSOLE HEADER & CONTROLS */}
      <div
        className={`p-4 sm:p-6 rounded-3xl border transition-all duration-200 shadow-xl ${
          isDarkMode
            ? 'bg-slate-900/90 border-slate-800 text-white shadow-indigo-950/20'
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-200/50'
        }`}
      >
        <div className="flex items-center justify-between gap-3 flex-wrap pb-4 border-b border-slate-800/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-xs font-black border border-indigo-500/40">
                4-Track PCM
              </span>
              <h2 className="text-xl font-black tracking-tight">{track.title}</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Lossless Stems • Web Audio Multi-Channel API • Nextcloud Direct Stream
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowLufsSuite(!showLufsSuite)}
              className={`touch-target h-10 px-3.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
                showLufsSuite
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Toggle LUFS Metering Suite"
            >
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>LUFS Suite</span>
            </button>

            <button
              type="button"
              onClick={handleResetMixer}
              className="touch-target h-10 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 font-bold text-xs transition active:scale-95 cursor-pointer"
              title="Reset All Faders & Pans to Default"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onOpenExportModal}
              className="touch-target h-10 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/50 border border-emerald-400/40 transition active:scale-95 cursor-pointer"
              title="Export Master Deliverables Package"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export Package</span>
            </button>
          </div>
        </div>

        {/* 4-TRACK TACTILE FADER STRIPS + MASTER BUS */}
        <div className="pt-6 pb-2 overflow-x-auto touch-pan-x">
          <div className="flex items-center justify-around gap-2 sm:gap-4 min-w-[360px]">
            {stems.map((stem) => (
              <div
                key={stem.id}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-2 flex-1 max-w-[100px] transition-all ${
                  isDarkMode
                    ? 'bg-slate-950/80 border-slate-800/80'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                {/* Tactile Vertical Fader Strip */}
                <TactileFader
                  label={stem.name || stem.stemType || 'Stem'}
                  value={stem.vol}
                  onChange={(val) => handleUpdateStem(stem.id, 'vol', val)}
                  defaultValue={80}
                  isMuted={stem.mute}
                  isDarkMode={isDarkMode}
                />

                {/* Tactile Mute & Solo Buttons (44px target) */}
                <div className="flex items-center gap-1 w-full pt-1">
                  <button
                    type="button"
                    onClick={() => handleUpdateStem(stem.id, 'mute', !stem.mute)}
                    className={`flex-1 h-9 rounded-xl font-mono text-xs font-black transition active:scale-90 cursor-pointer ${
                      stem.mute
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-950/60'
                        : isDarkMode
                        ? 'bg-slate-800 text-slate-400 hover:text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                    title="Mute Channel"
                  >
                    M
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStem(stem.id, 'solo', !stem.solo)}
                    className={`flex-1 h-9 rounded-xl font-mono text-xs font-black transition active:scale-90 cursor-pointer ${
                      stem.solo
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-950/60'
                        : isDarkMode
                        ? 'bg-slate-800 text-slate-400 hover:text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                    title="Solo Channel"
                  >
                    S
                  </button>
                </div>
              </div>
            ))}

            {/* MASTER BUS FADER */}
            <div
              className={`p-3 rounded-2xl border flex flex-col items-center gap-2 flex-1 max-w-[110px] transition-all ring-1 ring-indigo-500/40 ${
                isDarkMode
                  ? 'bg-indigo-950/20 border-indigo-500/40'
                  : 'bg-indigo-50/60 border-indigo-300'
              }`}
            >
              <TactileFader
                label="MASTER"
                value={masterVolume}
                onChange={onMasterVolumeChange}
                defaultValue={80}
                color="#818CF8"
                isDarkMode={isDarkMode}
              />

              <div className="w-full text-center pt-2">
                <span className="text-[10px] font-mono text-indigo-400 font-bold block">
                  MAIN BUS
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EXPANDABLE MASTERING LUFS SUITE */}
      {showLufsSuite && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          <MasteringLufsSuite
            track={track}
            isDarkMode={isDarkMode}
          />
        </div>
      )}
    </div>
  );
};
