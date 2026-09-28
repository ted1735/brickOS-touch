import React from 'react';
import {
  FileText,
  Scissors,
  Activity,
  Film,
  Clock,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Lock
} from 'lucide-react';
import { Track } from '../types';

interface TrackLifecycleStepperProps {
  selectedTrack: Track;
  onNavigateToTab: (tab: string) => void;
  onOpenSelahGate?: () => void;
  isDarkMode?: boolean;
}

interface StepNode {
  id: string;
  label: string;
  tab: string;
  icon: React.ComponentType<{ className?: string }>;
  isCompleted: boolean;
  isCurrent: boolean;
  badge?: string;
}

export const TrackLifecycleStepper: React.FC<TrackLifecycleStepperProps> = ({
  selectedTrack,
  onNavigateToTab,
  onOpenSelahGate,
  isDarkMode = true
}) => {
  // Determine completion based on track status
  const status = selectedTrack.status || 'Idea';

  const statusOrder = ['Idea', 'Drafting', 'Arranging', 'Mixing', 'Mastered', 'In Review', 'Released'];
  const currentIndex = statusOrder.indexOf(status) !== -1 ? statusOrder.indexOf(status) : 0;

  const steps: StepNode[] = [
    {
      id: 'pre-pro',
      label: 'Idea & Chords',
      tab: 'brainstorming',
      icon: FileText,
      isCompleted: currentIndex >= 1,
      isCurrent: currentIndex === 0
    },
    {
      id: 'lyrics-suno',
      label: 'Lyrics (Suno)',
      tab: 'lyrics',
      icon: Sparkles,
      isCompleted: currentIndex >= 2,
      isCurrent: currentIndex === 1
    },
    {
      id: 'stems-mix',
      label: 'Stems (DAW)',
      tab: 'mixer',
      icon: Scissors,
      isCompleted: currentIndex >= 3,
      isCurrent: currentIndex === 2
    },
    {
      id: 'master-lufs',
      label: 'Master (-12 LUFS)',
      tab: 'mastering',
      icon: Activity,
      isCompleted: currentIndex >= 4,
      isCurrent: currentIndex === 3 || currentIndex === 4
    },
    {
      id: 'visuals-avatar',
      label: 'Visuals & Video',
      tab: 'video_express',
      icon: Film,
      isCompleted: currentIndex >= 5,
      isCurrent: currentIndex === 5
    },
    {
      id: 'selah-gate',
      label: 'Selah 24h Gate',
      tab: 'kanban',
      icon: Lock,
      isCompleted: currentIndex >= 6,
      isCurrent: currentIndex === 5 && status === 'In Review',
      badge: 'SOP 1'
    },
    {
      id: 'distribution',
      label: 'Distributed',
      tab: 'youtube',
      icon: CheckCircle2,
      isCompleted: currentIndex >= 6,
      isCurrent: currentIndex >= 6
    }
  ];

  return (
    <div
      className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 overflow-x-auto no-scrollbar shadow-xs transition-colors ${
        isDarkMode
          ? 'bg-slate-950/80 border-slate-800 text-slate-300'
          : 'bg-white border-slate-200 text-slate-700'
      }`}
    >
      <div className="flex items-center gap-1.5 shrink-0 pr-1.5 border-r border-slate-800/80 mr-1">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Lifecycle:</span>
        <span className="text-[11px] font-bold text-white font-mono">{selectedTrack.id}</span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {steps.map((step, idx) => {
          const StepIcon = step.icon;
          const isLast = idx === steps.length - 1;

          let badgeStyle = isDarkMode
            ? 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
            : 'bg-slate-100 text-slate-400 border-slate-200 hover:text-slate-600';

          if (step.isCompleted) {
            badgeStyle = 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50 hover:bg-emerald-900/60';
          } else if (step.isCurrent) {
            badgeStyle = 'bg-indigo-600 text-white border-indigo-400 font-bold shadow-xs';
          }

          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                onClick={() => {
                  if (step.id === 'selah-gate' && onOpenSelahGate) {
                    onOpenSelahGate();
                  } else {
                    onNavigateToTab(step.tab);
                  }
                }}
                className={`px-2 py-0.5 rounded-lg text-[10px] border flex items-center gap-1 transition cursor-pointer shrink-0 font-medium ${badgeStyle}`}
                title={`Jump to ${step.label} (${step.tab})`}
              >
                <StepIcon className="w-3 h-3" />
                <span>{step.label}</span>
                {step.badge && (
                  <span className="text-[8px] px-1 rounded bg-black/40 font-mono text-amber-300">
                    {step.badge}
                  </span>
                )}
              </button>

              {!isLast && (
                <ChevronRight className="w-2.5 h-2.5 text-slate-600 shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
