import React, { useState, useEffect } from 'react';
import { 
  X, 
  Edit3, 
  Check, 
  History, 
  Disc, 
  FolderEdit, 
  Layers, 
  Sparkles, 
  Music, 
  Film, 
  Image as ImageIcon,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { 
  Track, 
  CompositionSession, 
  GeneratedImage, 
  GeneratedVideo, 
  NightCafePrompt, 
  TrackTitleChangeHistoryRecord 
} from '../types';
import { EP_COLLECTIONS } from '../data/canonicalCatalog';

const COMMON_GENRE_PRESETS = [
  'Modern Roots Worship',
  'Christian Hip Hop / Boom-Bap',
  'Soul Piano Ballad',
  'Deep Southern Gospel',
  'Hard Rock / Aggressive CHH',
  'Indie Folk / Blue-Collar Psalm',
  'Synthwave / Neon Pop-Gospel',
  'Cinematic Orchestral Worship',
  'Contemporary Christian'
];

export interface SongTitleRenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track;
  sessions?: CompositionSession[];
  generatedImages?: GeneratedImage[];
  generatedVideos?: GeneratedVideo[];
  nightCafePrompts?: NightCafePrompt[];
  onSaveRename: (payload: {
    trackId: string;
    newTitle: string;
    newGenre?: string;
    newEp?: string;
    newBpm?: number;
    newKey?: string;
    newThesis?: string;
    newVocalCast?: string;
    reason?: string;
  }) => Promise<void> | void;
  isDarkMode?: boolean;
}

export const SongTitleRenameModal: React.FC<SongTitleRenameModalProps> = ({
  isOpen,
  onClose,
  track,
  sessions = [],
  generatedImages = [],
  generatedVideos = [],
  nightCafePrompts = [],
  onSaveRename,
  isDarkMode = true
}) => {
  const [titleInput, setTitleInput] = useState(track.title);
  const [genreInput, setGenreInput] = useState(track.genre || '');
  const [epInput, setEpInput] = useState(track.ep || '');
  const [thesisInput, setThesisInput] = useState(track.thesis || '');
  const [bpmInput, setBpmInput] = useState<number>(track.bpm || 80);
  const [keyInput, setKeyInput] = useState(track.key || 'C Major');
  const [reasonInput, setReasonInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync inputs whenever active track changes
  useEffect(() => {
    setTitleInput(track.title);
    setGenreInput(track.genre || '');
    setEpInput(track.ep || '');
    setThesisInput(track.thesis || '');
    setBpmInput(track.bpm || 80);
    setKeyInput(track.key || 'C Major');
    setReasonInput('');
    setErrorMsg(null);
    setShowHistory(false);
  }, [track.id, track.title, track.genre, track.ep, track.thesis, track.bpm, track.key]);

  if (!isOpen) return null;

  // Calculate linked asset counts
  const linkedSessions = sessions.filter(
    s => s.trackId === track.id || s.trackTitle === track.title || s.name.includes(track.title)
  );
  const linkedImages = generatedImages.filter(
    img => img.trackId === track.id || img.trackTitle === track.title || (img.name && img.name.includes(track.title))
  );
  const linkedVideos = generatedVideos.filter(
    v => v.trackId === track.id || v.trackTitle === track.title || (v.name && v.name.includes(track.title))
  );
  const linkedPrompts = nightCafePrompts.filter(
    p => p.song === track.title || p.song === track.id || p.title.includes(track.title)
  );

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanTitle = titleInput.trim();
    if (!cleanTitle) {
      setErrorMsg('Song title cannot be empty.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await onSaveRename({
        trackId: track.id,
        newTitle: cleanTitle,
        newGenre: genreInput.trim(),
        newEp: epInput.trim(),
        newBpm: Number(bpmInput) || track.bpm,
        newKey: keyInput.trim(),
        newThesis: thesisInput.trim(),
        reason: reasonInput.trim()
      });
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err?.message || 'Failed to rename song and sync assets.');
    }
  };

  const handleRevert = async (hist: TrackTitleChangeHistoryRecord) => {
    try {
      setIsSubmitting(true);
      await onSaveRename({
        trackId: track.id,
        newTitle: hist.previousTitle,
        newEp: hist.previousEp,
        reason: `Reverted to earlier title checkpoint: "${hist.previousTitle}"`
      });
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err?.message || 'Failed to revert title.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className={`w-full max-w-2xl rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[90vh] ${
          isDarkMode 
            ? 'bg-slate-900 border-slate-700 text-slate-100 shadow-indigo-950/50' 
            : 'bg-white border-slate-200 text-slate-900 shadow-xl'
        }`}
      >
        {/* Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between flex-shrink-0 ${
          isDarkMode ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-md">
              <Edit3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                  {track.id}
                </span>
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  Rename Song & Sync Linked Assets
                </h3>
              </div>
              <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                As your song evolves across edits and genres, all linked stems, sessions, artwork, and prompts update automatically.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              isDarkMode 
                ? 'hover:bg-slate-800 border-slate-700 text-slate-400 hover:text-white' 
                : 'hover:bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-900'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Current vs New Title */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Disc className="w-3.5 h-3.5" />
                <span>Song Title</span>
              </label>
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                autoFocus
                placeholder="Enter new song title..."
                className={`w-full px-4 py-3 rounded-xl text-base sm:text-lg font-bold border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-inner ${
                  isDarkMode
                    ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-600'
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
              {track.title !== titleInput.trim() && titleInput.trim().length > 0 && (
                <div className="mt-1.5 flex items-center gap-2 text-xs text-amber-400 font-mono">
                  <span className="line-through opacity-70">{track.title}</span>
                  <ArrowRight className="w-3 h-3" />
                  <span className="font-bold text-emerald-400">{titleInput.trim()}</span>
                </div>
              )}
            </div>

            {/* Genre Transition Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Genre / Style (Nashville Soundscape)</span>
                </span>
                <span className="text-[10px] lowercase font-normal text-slate-500">click preset or customize</span>
              </label>
              <input
                type="text"
                value={genreInput}
                onChange={(e) => setGenreInput(e.target.value)}
                placeholder="e.g. Modern Roots Worship, Christian Hip Hop..."
                className={`w-full px-3 py-2 rounded-xl text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition ${
                  isDarkMode
                    ? 'bg-slate-950 border-slate-700 text-slate-200'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
              {/* Genre Presets Pills */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {COMMON_GENRE_PRESETS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGenreInput(g)}
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                      genreInput === g
                        ? 'bg-indigo-600 border-indigo-500 text-white font-bold'
                        : isDarkMode
                        ? 'bg-slate-800/80 border-slate-700 hover:border-indigo-400 text-slate-300'
                        : 'bg-slate-100 border-slate-300 hover:border-indigo-400 text-slate-700'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* EP Collection & Key / BPM */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <FolderEdit className="w-3 h-3 text-purple-400" />
                  <span>EP / Project</span>
                </label>
                <select
                  value={epInput}
                  onChange={(e) => setEpInput(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                    isDarkMode
                      ? 'bg-slate-950 border-slate-700 text-slate-200'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  {EP_COLLECTIONS.map(ep => (
                    <option key={ep.id} value={ep.id}>
                      {ep.title}
                    </option>
                  ))}
                  <option value="Single / Standalone">Single / Standalone Release</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Tempo (BPM)
                </label>
                <input
                  type="number"
                  min="40"
                  max="220"
                  value={bpmInput}
                  onChange={(e) => setBpmInput(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isDarkMode
                      ? 'bg-slate-950 border-slate-700 text-slate-200'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Musical Key
                </label>
                <input
                  type="text"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="e.g. D Minor, G Major"
                  className={`w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isDarkMode
                      ? 'bg-slate-950 border-slate-700 text-slate-200'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            {/* Core Theological Thesis */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Core Theological Thesis / Theme
              </label>
              <input
                type="text"
                value={thesisInput}
                onChange={(e) => setThesisInput(e.target.value)}
                placeholder="e.g. Brokenness redeemed in Christ's kingdom..."
                className={`w-full px-3 py-2 rounded-xl text-xs italic border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isDarkMode
                    ? 'bg-slate-950 border-slate-700 text-slate-200'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            {/* Revision Reason / Audit Note */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Reason for Rename / Evolution (Optional Checkpoint Note)
              </label>
              <input
                type="text"
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                placeholder="e.g. Switched to acoustic worship arrangement, refocused hook..."
                className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isDarkMode
                    ? 'bg-slate-950 border-slate-700 text-slate-200'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>

          {/* Linked Assets Live Sync Indicator */}
          <div className={`p-4 rounded-xl border space-y-2.5 ${
            isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-indigo-50/50 border-indigo-100'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5 text-indigo-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Linked Assets Auto-Sync Cascade</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/40">
                Synchronous
              </span>
            </div>

            <p className={`text-[11px] leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Saving will immediately propagate <span className="font-bold text-indigo-400">"{titleInput.trim() || track.title}"</span> across all associated project items:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px] font-mono">
              <div className={`p-2 rounded-lg border flex items-center gap-2 ${
                isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
              }`}>
                <Layers className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                <span className="truncate">{linkedSessions.length} Session{linkedSessions.length === 1 ? '' : 's'}</span>
              </div>

              <div className={`p-2 rounded-lg border flex items-center gap-2 ${
                isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
              }`}>
                <ImageIcon className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="truncate">{linkedImages.length} Artwork Item{linkedImages.length === 1 ? '' : 's'}</span>
              </div>

              <div className={`p-2 rounded-lg border flex items-center gap-2 ${
                isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
              }`}>
                <Film className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                <span className="truncate">{linkedVideos.length} Video Reel{linkedVideos.length === 1 ? '' : 's'}</span>
              </div>

              <div className={`p-2 rounded-lg border flex items-center gap-2 ${
                isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
              }`}>
                <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span className="truncate">{linkedPrompts.length} Suno Prompt{linkedPrompts.length === 1 ? '' : 's'}</span>
              </div>

              <div className={`p-2 rounded-lg border flex items-center gap-2 ${
                isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
              }`}>
                <Disc className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <span className="truncate">Nextcloud Stems</span>
              </div>

              <div className={`p-2 rounded-lg border flex items-center gap-2 ${
                isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
              }`}>
                <Music className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                <span className="truncate">Version Matrix</span>
              </div>
            </div>
          </div>

          {/* Title Revision History Accordion */}
          {track.titleHistory && track.titleHistory.length > 0 && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className={`text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  isDarkMode ? 'text-amber-400 hover:text-amber-300' : 'text-amber-700 hover:text-amber-800'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>View Previous Title Checkpoints ({track.titleHistory.length})</span>
              </button>

              {showHistory && (
                <div className={`mt-2 p-3 rounded-xl border space-y-2 max-h-40 overflow-y-auto ${
                  isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  {track.titleHistory.map((hist) => (
                    <div 
                      key={hist.id} 
                      className={`p-2 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                        isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-bold flex items-center gap-1.5">
                          <span>"{hist.previousTitle}"</span>
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          <span className="text-indigo-400">"{hist.newTitle}"</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {hist.timestamp} • {hist.reason || 'Manual revision'}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRevert(hist)}
                        className={`px-2 py-1 rounded text-[10px] font-bold border transition flex items-center gap-1 flex-shrink-0 cursor-pointer ${
                          isDarkMode 
                            ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-amber-300 hover:text-white' 
                            : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800'
                        }`}
                        title={`Revert title back to "${hist.previousTitle}"`}
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restore</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className={`p-4 sm:p-5 border-t flex items-center justify-end gap-3 flex-shrink-0 ${
          isDarkMode ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50'
        }`}>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
              isDarkMode 
                ? 'border-slate-700 text-slate-300 hover:bg-slate-800' 
                : 'border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isSubmitting || !titleInput.trim()}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-950/50 transition cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Disc className="w-4 h-4 animate-spin" />
                <span>Syncing All Assets...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save & Sync Linked Assets</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
