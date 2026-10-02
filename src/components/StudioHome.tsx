import React from 'react';
import { ArrowRight, CheckCircle2, Clock3, FileText, Headphones, Layers3, Music2, Sparkles } from 'lucide-react';
import { CompositionSession, Track } from '../types';

export type StudioWorkspace = 'write' | 'produce' | 'release' | 'all';

interface StudioHomeProps {
  track: Track;
  sessions: CompositionSession[];
  isDarkMode: boolean;
  onContinue: () => void;
  onOpenWorkspace: (workspace: StudioWorkspace, tab: string) => void;
  onOpenSession: (session: CompositionSession) => void;
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
    case 'Lyrics Finalized': return { label: 'Start production', tab: 'mixer', workspace: 'produce' as const };
    case 'In Progress':
    case 'UVR5 Stem Prep': return { label: 'Continue mixing', tab: 'mixer', workspace: 'produce' as const };
    case 'Audio Master': return { label: 'Review the master', tab: 'mastering', workspace: 'release' as const };
    case 'Sent for Distribution': return { label: 'Finish release details', tab: 'youtube', workspace: 'release' as const };
    case 'Released': return { label: 'Open the production pipeline', tab: 'kanban', workspace: 'all' as const };
    default: return { label: 'Continue this song', tab: 'lyrics', workspace: 'write' as const };
  }
};

export const StudioHome: React.FC<StudioHomeProps> = ({ track, sessions, isDarkMode, onContinue, onOpenWorkspace, onOpenSession }) => {
  const nextStep = getSuggestedTrackStep(track);
  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    .slice(0, 4);
  const cardClass = isDarkMode
    ? 'border-slate-800 bg-slate-900/80 text-slate-100'
    : 'border-slate-200 bg-white text-slate-900 shadow-sm';
  const mutedClass = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 py-2">
      <div className="space-y-1">
        <p className={`text-xs font-bold uppercase tracking-[0.2em] ${mutedClass}`}>Your studio</p>
        <h2 className="text-3xl font-black">Pick up where you left off.</h2>
        <p className={mutedClass}>Your songs and production tools, organized around the next step.</p>
      </div>

      <section className={`rounded-2xl border p-5 sm:p-7 ${cardClass}`}>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400"><Music2 className="h-4 w-4" /> CONTINUE THIS SONG</div>
            <div>
              <h3 className="text-2xl font-black">{track.title}</h3>
              <p className={`mt-1 text-sm ${mutedClass}`}>{track.id} · {track.ep} · {track.status}</p>
            </div>
            <p className={`max-w-2xl text-sm ${mutedClass}`}>{nextStep.label} is the suggested next step for this track.</p>
          </div>
          <button onClick={onContinue} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-500">
            Continue song <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className={`rounded-lg px-3 py-2 text-xs ${isDarkMode ? 'bg-slate-950 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>{track.bpm} BPM · {track.key}</span>
          <span className={`rounded-lg px-3 py-2 text-xs ${isDarkMode ? 'bg-slate-950 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>{track.versions?.length || 1} saved version{(track.versions?.length || 1) === 1 ? '' : 's'}</span>
          {track.selahPrayed && <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-500"><CheckCircle2 className="h-3.5 w-3.5" /> Selah complete</span>}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div><h3 className="text-lg font-bold">Choose a workspace</h3><p className={`text-sm ${mutedClass}`}>Show only the tools for the work you’re doing.</p></div>
          <button onClick={() => onOpenWorkspace('all', 'kanban')} className={`hidden items-center gap-1 text-sm font-semibold sm:inline-flex ${mutedClass} hover:text-indigo-400`}>All tools <ArrowRight className="h-4 w-4" /></button>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {workspaceCards.map(({ id, title, description, tab, action, icon: Icon, accent }) => (
            <button key={id} onClick={() => onOpenWorkspace(id, tab)} className={`rounded-2xl border p-5 text-left transition hover:-translate-y-0.5 hover:border-indigo-500 ${cardClass}`}>
              <Icon className={`mb-4 h-5 w-5 ${accent}`} />
              <h4 className="font-bold">{title}</h4>
              <p className={`mt-1 min-h-10 text-sm ${mutedClass}`}>{description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-indigo-400">{action}<ArrowRight className="h-3.5 w-3.5" /></span>
            </button>
          ))}
        </div>
      </section>

      <section className={`rounded-2xl border p-5 ${cardClass}`}>
        <div className="mb-4 flex items-center gap-2"><Clock3 className="h-4 w-4 text-purple-400" /><h3 className="font-bold">Recent sessions</h3></div>
        {recentSessions.length ? <div className="grid gap-2 sm:grid-cols-2">
          {recentSessions.map(session => (
            <button key={session.id} onClick={() => onOpenSession(session)} className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition hover:border-purple-500 ${isDarkMode ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50'}`}>
              <span className="min-w-0"><span className="block truncate text-sm font-semibold">{session.name}</span><span className={`mt-1 block truncate text-xs ${mutedClass}`}>{session.trackTitle} · {new Date(session.updatedAt || session.createdAt).toLocaleDateString()}</span></span>
              <ArrowRight className="h-4 w-4 shrink-0 text-purple-400" />
            </button>
          ))}
        </div> : <p className={`text-sm ${mutedClass}`}>No saved sessions yet. Save a session from the Sessions panel to see it here.</p>}
      </section>
    </div>
  );
};
