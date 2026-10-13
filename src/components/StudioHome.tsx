import React from 'react';
import { ArrowRight, CheckCircle2, Clock3, FileText, Headphones, Music2, Sparkles, ChevronDown } from 'lucide-react';
import { CompositionSession, Track } from '../types';

export type StudioWorkspace = 'write' | 'produce' | 'release' | 'all';

interface StudioHomeProps {
  track: Track;
  sessions: CompositionSession[];
  isDarkMode: boolean;
  onContinue: () => void;
  onOpenWorkspace: (workspace: StudioWorkspace, tab: string) => void;
  onOpenSession: (session: CompositionSession) => void;
  allTracks?: Track[];
  onSelectTrack?: (track: Track) => void;
}

const workspaceCards: Array<{
  id: Exclude<StudioWorkspace, 'all'>;
  title: string;
  description: string;
  tab: string;
  action: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}> = [
  { id: 'write', title: 'Write', description: 'Shape the idea, draft lyrics, and compare versions.', tab: 'lyrics', action: 'Open lyrics', icon: FileText, accent: 'text-blue-400' },
  { id: 'produce', title: 'Produce', description: 'Organize stems, mix the song, and prepare the master.', tab: 'mixer', action: 'Open mixer', icon: Headphones, accent: 'text-emerald-400' },
  { id: 'release', title: 'Release', description: 'Finish release checks, artwork, and distribution details.', tab: 'youtube', action: 'Prepare release', icon: Sparkles, accent: 'text-amber-400' }
];

export const getSuggestedTrackStep = (track: Track) => {
  switch (track.status) {
    case 'Idea / Concept': return { label: 'Develop the song idea', tab: 'brainstorming', workspace: 'write' as const };
    case 'Lyrics Finalized': return { label: 'Work on lyrics & Suno prompt', tab: 'lyrics', workspace: 'write' as const };
    case 'In Progress': return { label: 'Continue lyrics & songwriting', tab: 'lyrics', workspace: 'write' as const };
    case 'UVR5 Stem Prep': return { label: 'Continue stem mixing', tab: 'mixer', workspace: 'produce' as const };
    case 'Audio Master': return { label: 'Review the master', tab: 'mastering', workspace: 'release' as const };
    case 'Sent for Distribution': return { label: 'Finish release details', tab: 'youtube', workspace: 'release' as const };
    case 'Released': return { label: 'Open the production pipeline', tab: 'kanban', workspace: 'all' as const };
    default: return { label: 'Continue this song', tab: 'lyrics', workspace: 'write' as const };
  }
};

export const StudioHome: React.FC<StudioHomeProps> = ({
  track,
  sessions,
  isDarkMode,
  onContinue,
  onOpenWorkspace,
  onOpenSession,
  allTracks,
  onSelectTrack,
}) => {
  const nextStep = getSuggestedTrackStep(track);
  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    .slice(0, 4);
  const cardClass = isDarkMode
    ? 'border-slate-800 bg-slate-900/80 text-slate-100'
    : 'border-slate-200 bg-white text-slate-900 shadow-sm';
  const mutedClass = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="mx-auto w-full max-w-6xl space-y-3.5 py-1">
      {/* Header with reduced typography */}
      <div className="space-y-0.5">
        <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${mutedClass}`}>Your studio</p>
        <h2 className="text-base sm:text-lg font-bold">Pick up where you left off.</h2>
        <p className={`text-xs ${mutedClass}`}>Your songs and production tools, organized around the next step.</p>
      </div>

      {/* Reduced by 60% Hero Track Section */}
      <section className={`rounded-xl border p-3 sm:p-3.5 ${cardClass}`}>
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-wide text-indigo-400">
              <Music2 className="h-3.5 w-3.5" />
              <span>CONTINUE THIS SONG</span>
              {track.selahPrayed && (
                <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" /> Selah
                </span>
              )}
            </div>
            
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-black truncate">{track.title}</h3>
              <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-slate-800 text-indigo-300' : 'bg-slate-100 text-indigo-700'}`}>
                {track.id}
              </span>
              <span className={`text-xs ${mutedClass}`}>· {track.ep} · {track.status}</span>
            </div>

            <p className={`mt-0.5 text-xs ${mutedClass}`}>
              {nextStep.label} is the suggested next step for this track.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {allTracks && allTracks.length > 0 && onSelectTrack && (
              <div className="relative">
                <select
                  value={track.id}
                  onChange={(e) => {
                    const chosen = allTracks.find(t => t.id === e.target.value);
                    if (chosen) onSelectTrack(chosen);
                  }}
                  className={`text-xs rounded-lg px-2.5 py-1.5 pr-7 border font-medium appearance-none cursor-pointer ${
                    isDarkMode
                      ? 'bg-slate-950 border-slate-700 text-slate-200'
                      : 'bg-white border-slate-300 text-slate-800'
                  }`}
                  title="Switch active track"
                >
                  {allTracks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.id}: {t.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-2.5 pointer-events-none text-slate-400" />
              </div>
            )}
            <button
              onClick={onContinue}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-indigo-500 shadow-sm cursor-pointer"
            >
              Continue song <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Compact stats pill bar */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-700/30">
          <span className={`rounded px-2 py-0.5 text-[11px] ${isDarkMode ? 'bg-slate-950 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
            {track.bpm} BPM · {track.key}
          </span>
          <span className={`rounded px-2 py-0.5 text-[11px] ${isDarkMode ? 'bg-slate-950 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
            {track.versions?.length || 1} saved version{(track.versions?.length || 1) === 1 ? '' : 's'}
          </span>
          {track.genre && (
            <span className={`rounded px-2 py-0.5 text-[11px] ${isDarkMode ? 'bg-slate-950 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
              {track.genre}
            </span>
          )}
        </div>
      </section>

      {/* Choose a workspace (Buttons reduced by half) */}
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-xs sm:text-sm font-bold">Choose a workspace</h3>
            <p className={`text-[11px] ${mutedClass}`}>Show only the tools for the work you’re doing.</p>
          </div>
          <button
            onClick={() => onOpenWorkspace('all', 'kanban')}
            className={`hidden items-center gap-1 text-[11px] font-semibold sm:inline-flex ${mutedClass} hover:text-indigo-400`}
          >
            All tools <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <div className="grid gap-2 md:grid-cols-3">
          {workspaceCards.map(({ id, title, description, tab, action, icon: Icon, accent }) => (
            <button
              key={id}
              onClick={() => onOpenWorkspace(id, tab)}
              className={`rounded-xl border p-2.5 sm:p-3 text-left transition hover:-translate-y-0.5 hover:border-indigo-500 cursor-pointer ${cardClass}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Icon className={`h-4 w-4 ${accent}`} />
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-400">
                  {action} <ArrowRight className="h-2.5 w-2.5" />
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-bold">{title}</h4>
              <p className={`mt-0.5 text-[11px] leading-snug line-clamp-2 ${mutedClass}`}>{description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Compact Recent sessions */}
      <section className={`rounded-xl border p-3 sm:p-3.5 ${cardClass}`}>
        <div className="mb-2.5 flex items-center gap-2">
          <Clock3 className="h-3.5 w-3.5 text-purple-400" />
          <h3 className="text-xs sm:text-sm font-bold">Recent sessions</h3>
        </div>
        {recentSessions.length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {recentSessions.map(session => (
              <button
                key={session.id}
                onClick={() => onOpenSession(session)}
                className={`flex items-center justify-between gap-2 rounded-lg border p-2 text-left transition hover:border-purple-500 cursor-pointer ${
                  isDarkMode ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50'
                }`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold">{session.name}</span>
                  <span className={`block truncate text-[10px] ${mutedClass}`}>
                    {session.trackTitle} · {new Date(session.updatedAt || session.createdAt).toLocaleDateString()}
                  </span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-purple-400" />
              </button>
            ))}
          </div>
        ) : (
          <p className={`text-xs ${mutedClass}`}>No saved sessions yet. Save a session from the Sessions panel to see it here.</p>
        )}
      </section>
    </div>
  );
};
