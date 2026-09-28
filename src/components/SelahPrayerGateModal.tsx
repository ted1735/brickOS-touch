import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  Clock,
  Heart,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Calendar,
  X
} from 'lucide-react';
import { Track } from '../types';

interface SelahPrayerGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track;
  onReleaseGateApproved: (trackId: string, prayerNotes: string) => void;
  isDarkMode?: boolean;
}

export const SelahPrayerGateModal: React.FC<SelahPrayerGateModalProps> = ({
  isOpen,
  onClose,
  track,
  onReleaseGateApproved,
  isDarkMode = true
}) => {
  const [prayerNotes, setPrayerNotes] = useState(
    'Lord, let this master bring peace and restoration. Guard against pride or commercial compromise. We release this song into Your hands.'
  );
  const [scriptureAnchor, setScriptureAnchor] = useState('Psalm 46:10 — Be still, and know that I am God.');
  const [hoursRemaining, setHoursRemaining] = useState(14);
  const [minutesRemaining, setMinutesRemaining] = useState(32);
  const [isOverrideActive, setIsOverrideActive] = useState(false);

  // Real-time tick down simulation
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setMinutesRemaining(prev => {
        if (prev <= 0) {
          setHoursRemaining(h => Math.max(0, h - 1));
          return 59;
        }
        return prev - 1;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const isGateReady = hoursRemaining === 0 && minutesRemaining === 0 || isOverrideActive;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-slate-900 border border-amber-600/40 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5 text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-950/80 border border-amber-600/50 text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Nashville SOP Rule 1: Selah 24-Hour Prayer Gate</span>
                <span className="px-2 py-0.2 rounded bg-amber-950 text-amber-300 font-mono text-[10px] font-bold border border-amber-800">
                  {track.id}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Mandatory 24-hour spiritual pause and stationkeeping before final public release.
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

        {/* Countdown Timer Display */}
        <div className="p-4 rounded-xl bg-slate-950 border border-amber-900/50 text-center space-y-2">
          <span className="text-[10px] font-mono uppercase text-amber-400 font-bold tracking-wider">
            Selah Gate Clock ({track.title})
          </span>
          <div className="text-3xl font-mono font-extrabold text-amber-300 tracking-wider">
            {hoursRemaining.toString().padStart(2, '0')}h : {minutesRemaining.toString().padStart(2, '0')}m
          </div>
          <p className="text-[11px] text-slate-400 max-w-md mx-auto">
            This gate guarantees that commercial rush never overtakes the holy anointing of the music. Take time to pray over the listeners.
          </p>
        </div>

        {/* Scripture Anchor */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Scripture Anchor for this Release</span>
          </label>
          <input
            type="text"
            value={scriptureAnchor}
            onChange={e => setScriptureAnchor(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Prayer Journal Notes */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span>Prayer Reflection Journal</span>
          </label>
          <textarea
            rows={3}
            value={prayerNotes}
            onChange={e => setPrayerNotes(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
          />
        </div>

        {/* Override Toggle (Emergency / Admin) */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400 text-[11px]">
              Studio Executive Override (24h period completed offline)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsOverrideActive(prev => !prev)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition cursor-pointer ${
              isOverrideActive
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {isOverrideActive ? 'Override Active' : 'Enable Override'}
          </button>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
          >
            Keep Gate Locked
          </button>
          <button
            type="button"
            onClick={() => {
              onReleaseGateApproved(track.id, prayerNotes);
              onClose();
            }}
            disabled={!isGateReady}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md ${
              isGateReady
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approve & Release Master</span>
          </button>
        </div>
      </div>
    </div>
  );
};
