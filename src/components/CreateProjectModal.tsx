import React, { useState } from 'react';
import { Plus, X, Music, Disc, Sparkles, FileText, CheckCircle, Sliders, Database } from 'lucide-react';
import { Track } from '../types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (newTrack: Track, openLyricEngine?: boolean) => void;
  existingTracksCount: number;
  existingTracks?: Track[];
  defaultEp?: string;
}

const GENRE_PRESETS = [
  'Christian Hip Hop / Worship',
  'Nashville Acoustic / Appalachian Flatpicking',
  'Dark Gospel / Southern Gothic',
  'Cinematic R&B / Modern Soul',
  'Contemporary Praise & Worship',
  'Folk Worship / Raw Stomp-Clap',
  'Orchestral Film Score / Throne Room Hymn'
];

const VOCAL_ARCHETYPES = [
  { name: 'The Architect', desc: 'Sub-Sonic Quarry, -14 Semi, resonant bass-baritone authority' },
  { name: 'Silas Thorne', desc: 'Aged Oak, -8 Semi, weathered Nashville rasp and conviction' },
  { name: 'Ted Moyer', desc: 'Primary Artist / OAC, authentic delivery & lead vocals' },
  { name: 'Ms. T', desc: 'Sovereign Praise, +6 Semi, soaring gospel contralto power' },
  { name: 'Monica', desc: 'Soulful Contralto, -2 Semi, warm intimate conviction' },
  { name: 'Kane', desc: 'Iron & Grit, -6 Semi, driving rhythmic street-level baritone' },
  { name: 'Eli Vance', desc: 'Clean Youthful Tenor, +2 Semi, crystalline clarity' },
  { name: 'Elder Hayes', desc: 'Grave Elder Baritone, -10 Semi, deep reverent gravity' }
];

const KEYS = ['D Minor', 'G Major', 'E Minor', 'C Major', 'A Minor', 'B Minor', 'F# Minor', 'Bb Major', 'D Major', 'Eb Major'];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
  existingTracksCount,
  existingTracks = [],
  defaultEp = 'EP 1: Restoration'
}) => {
  const highestNum = existingTracks.length > 0
    ? Math.max(
        existingTracksCount,
        ...existingTracks.map(t => {
          const match = t.id.match(/\d+/);
          return match ? parseInt(match[0], 10) : 0;
        })
      )
    : existingTracksCount;
  const nextTrackNum = highestNum + 1;
  const nextId = `TRK-${String(nextTrackNum).padStart(2, '0')}`;

  const [title, setTitle] = useState('');
  const [ep, setEp] = useState(defaultEp);
  const [genre, setGenre] = useState(GENRE_PRESETS[0]);
  const [customGenre, setCustomGenre] = useState('');
  const [bpm, setBpm] = useState(96);
  const [key, setKey] = useState('D Minor');
  const [vocalArchetype, setVocalArchetype] = useState(VOCAL_ARCHETYPES[0].name);
  const [thesis, setThesis] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [autoTag, setAutoTag] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || `New Song ${nextTrackNum}`;
    const finalGenre = customGenre.trim() || genre;
    const finalThesis = thesis.trim() || `Theological thesis statement for "${finalTitle}".`;

    let finalLyrics = lyrics.trim();
    if (!finalLyrics) {
      finalLyrics = `[Vocal Archetype: ${vocalArchetype}]\n[Verse 1]\nWrite or paste your first verse here...\n\n[Chorus]\nLift up a sovereign sound to the Throne Room...\n\n[Bridge]\n[The Throne Room Pivot]\nTransforming doubt into sovereign praise...\n\n[Outro]\nRest in His peace.`;
    } else if (autoTag && !finalLyrics.includes('[Verse') && !finalLyrics.includes('[Chorus]')) {
      const paragraphs = finalLyrics.split(/\n\s*\n/);
      if (paragraphs.length === 1) {
        finalLyrics = `[Vocal Archetype: ${vocalArchetype}]\n[Verse 1]\n${finalLyrics}`;
      } else {
        finalLyrics = paragraphs.map((p, idx) => {
          if (idx === 0) return `[Vocal Archetype: ${vocalArchetype}]\n[Verse 1]\n${p}`;
          if (idx === 1) return `[Chorus]\n${p}`;
          if (idx === paragraphs.length - 1) return `[Outro]\n${p}`;
          if (idx === paragraphs.length - 2) return `[Bridge]\n[The Throne Room Pivot]\n${p}`;
          return `[Verse ${idx + 1}]\n${p}`;
        }).join('\n\n');
      }
    }

    const newTrack: Track = {
      id: nextId,
      ep: ep,
      title: finalTitle,
      status: 'Idea / Concept',
      genre: finalGenre,
      bpm: Number(bpm) || 96,
      key: key,
      vocal: vocalArchetype.split(' (')[0],
      vocalCast: `${vocalArchetype} (${VOCAL_ARCHETYPES.find(v => v.name === vocalArchetype)?.desc.split(',')[0] || 'Vocal'})`,
      thesis: finalThesis,
      sunoPrompt: `High-fidelity studio recording, ${bpm} BPM, Key of ${key}, ${finalGenre}, raw authentic vocals, dynamic Nashville acoustic and organic instrumentation`,
      negativePrompt: 'sibilance, high-frequency hiss, piercing treble, digital artifacts, muddy bass, autotune, robotic artifacts, lo-fi, reverb wash',
      engineSliders: { weirdness: 12, styleInfluence: 65, voiceAudio: 100 },
      lyrics: finalLyrics,
      versions: [
        {
          version: 'v1.0',
          timestamp: new Date().toISOString().split('T')[0],
          reason: 'Initial creation & lyric draft',
          lyrics: finalLyrics
        }
      ],
      selahPrayed: false
    };

    onCreateProject(newTrack, true);
    onClose();
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setLyrics(text);
      }
    } catch {
      // Fallback if browser permission is not granted
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in duration-200">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Create New Project / Track</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-mono border border-indigo-800/50">
                  {nextId}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Configure your song details, assign EP suite, and open immediately in the Lyric Engine.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* PROJECT TITLE INPUT */}
          <div>
            <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
              Project / Song Name <span className="text-indigo-400">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Valley of Decision, Oil of Joy, The Midnight Oil..."
              className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none transition shadow-inner font-medium"
            />
          </div>

          {/* EP SUITE & VOCAL ARCHETYPE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                EP Collection / Suite
              </label>
              <select
                value={ep}
                onChange={(e) => setEp(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="EP 1: Restoration">EP 1: The Restoration Project (Healing & Grace)</option>
                <option value="EP 2: Conflict">EP 2: The Conflict Suite (Spiritual Warfare)</option>
                <option value="EP 3: War Room">EP 3: War Room Anthems (Intercession)</option>
                <option value="EP 4: Surrender">EP 4: The Surrender Sessions (Throne Room)</option>
                <option value="Standalone Single">Standalone Single / Special Release</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                Lead Vocal Archetype
              </label>
              <select
                value={vocalArchetype}
                onChange={(e) => setVocalArchetype(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {VOCAL_ARCHETYPES.map(v => (
                  <option key={v.name} value={v.name}>
                    {v.name} — {v.desc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* MUSICAL GENRE, TEMPO & KEY */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                Genre Style
              </label>
              <select
                value={genre}
                onChange={(e) => {
                  setGenre(e.target.value);
                  setCustomGenre('');
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {GENRE_PRESETS.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
                <option value="Custom">Custom Genre...</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                Tempo (BPM)
              </label>
              <input
                type="number"
                min={50}
                max={200}
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                Musical Key
              </label>
              <select
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
              >
                {KEYS.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
          </div>

          {genre === 'Custom' && (
            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1">
                Specify Custom Genre
              </label>
              <input
                type="text"
                value={customGenre}
                onChange={(e) => setCustomGenre(e.target.value)}
                placeholder="e.g. Memphis Soul Praise, 90s Boom Bap Gospel..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {/* THEOLOGICAL THESIS */}
          <div>
            <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
              Theological Thesis / Core Concept (Optional)
            </label>
            <input
              type="text"
              value={thesis}
              onChange={(e) => setThesis(e.target.value)}
              placeholder="e.g. God meets us at our lowest breaking point; grace is an unyielding sovereign hammer."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* INITIAL LYRICS (PASTE AREA) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>Paste Lyrics Now (Optional)</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-indigo-300 font-bold border border-slate-700 transition"
                  title="Paste directly from clipboard"
                >
                  Paste from Clipboard
                </button>
                <label className="flex items-center gap-1 text-[10px] text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoTag}
                    onChange={(e) => setAutoTag(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <span>Auto-tag sections</span>
                </label>
              </div>
            </div>
            <textarea
              rows={5}
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              placeholder="Paste verses, choruses, or raw song thoughts here... (You can also write or edit them inside the Lyric Engine)"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500 custom-scrollbar leading-relaxed"
            />
          </div>

          {/* ACTION BUTTONS & DATABASE PERSISTENCE NOTE */}
          <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-cyan-400 font-mono">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Auto-saved to Cloud Firestore</span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-950/60 transition flex items-center gap-1.5 border border-indigo-400/30 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Create Song & Save to Cloud</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
