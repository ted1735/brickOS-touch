import React, { useState } from 'react';
import {
  Compass,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Headphones,
  Scissors,
  Activity,
  FileText,
  Layers,
  ChevronDown,
  ChevronUp,
  Eye,
  Info
} from 'lucide-react';
import { StudioTheme } from '../types';
import { StudioThemeSelector } from './StudioThemeSelector';

export interface WorkflowStage {
  step: number;
  id: string;
  tabKey: string;
  title: string;
  tagline: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badgeBg: string;
}

export const STUDIO_WORKFLOW_STAGES: WorkflowStage[] = [
  {
    step: 1,
    id: 'vision',
    tabKey: 'kanban',
    title: '1. Vision & Structure',
    tagline: 'Track Setup & Thesis',
    description: 'Select your song, set BPM, key, and theological thesis. Review SOP rules and storyboard milestones.',
    icon: Layers,
    accentColor: 'text-indigo-400',
    badgeBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
  },
  {
    step: 2,
    id: 'lyrics',
    tabKey: 'lyrics',
    title: '2. Lyrics & Suno v5.5',
    tagline: 'OBI Funnel & AI Generation',
    description: 'Craft lyrics with Throne Room pivot, dial Suno 4-block engine sliders, and generate prompt takes.',
    icon: FileText,
    accentColor: 'text-blue-400',
    badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30'
  },
  {
    step: 3,
    id: 'compare',
    tabKey: 'version-matrix',
    title: '3. A/B/C Audio Comparison',
    tagline: 'Critical 3-Way Listening',
    description: 'Import 3 audio takes side-by-side with synchronized waveforms, evaluate notes/pros/cons, and crown winner.',
    icon: Headphones,
    accentColor: 'text-amber-400',
    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
  },
  {
    step: 4,
    id: 'mixer',
    tabKey: 'mixer',
    title: '4. Mini-DAW 4-Track Mixing',
    tagline: 'Stem Balance & Master Fader',
    description: 'Balance discrete vocal/choir/organ/band stems, pan, EQ, and control overall gain with the global master fader.',
    icon: Scissors,
    accentColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
  },
  {
    step: 5,
    id: 'mastering',
    tabKey: 'mastering',
    title: '5. Mastering & Deliverables',
    tagline: 'LUFS & Cloud Release',
    description: 'Enforce -12.0/-14.0 LUFS target, -1.0 dBTP ceiling, generate Veo visuals, YouTube SEO, and Nextcloud export.',
    icon: Activity,
    accentColor: 'text-purple-400',
    badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30'
  }
];

interface StudioWorkflowGuideProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  theme?: StudioTheme;
  onSelectTheme?: (theme: StudioTheme) => void;
  isDarkMode?: boolean;
  focusMode: boolean;
  onToggleFocusMode: () => void;
}

export const StudioWorkflowGuide: React.FC<StudioWorkflowGuideProps> = ({
  activeTab,
  onSelectTab,
  theme = 'moon',
  onSelectTheme,
  isDarkMode = true,
  focusMode,
  onToggleFocusMode
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Map activeTab to closest workflow stage
  const getCurrentStage = (): WorkflowStage => {
    if (activeTab === 'lyrics') return STUDIO_WORKFLOW_STAGES[1];
    if (activeTab === 'version-matrix') return STUDIO_WORKFLOW_STAGES[2];
    if (activeTab === 'mixer') return STUDIO_WORKFLOW_STAGES[3];
    if (activeTab === 'mastering' || activeTab === 'veo_visuals' || activeTab === 'youtube' || activeTab === 'omnipost') {
      return STUDIO_WORKFLOW_STAGES[4];
    }
    return STUDIO_WORKFLOW_STAGES[0];
  };

  const currentStage = getCurrentStage();
  const nextStage = STUDIO_WORKFLOW_STAGES[Math.min(currentStage.step, STUDIO_WORKFLOW_STAGES.length - 1)];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-md transition-all">
      {/* COMPACT BREADCRUMB / STATUS HEADER BAR */}
      <div className="px-4 py-2.5 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-400" />
            <span className="font-bold uppercase tracking-wider text-slate-200 font-mono text-[11px]">
              Studio Production Workflow
            </span>
          </div>

          {/* Stepper Dots / Stage Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {STUDIO_WORKFLOW_STAGES.map((stg) => {
              const isActive = currentStage.step === stg.step;
              const isPast = currentStage.step > stg.step;
              return (
                <button
                  key={stg.id}
                  onClick={() => onSelectTab(stg.tabKey)}
                  className={`px-2 py-1 rounded-md text-[11px] font-mono transition flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : isPast
                      ? 'bg-slate-800/80 text-emerald-400 hover:bg-slate-800'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                  title={`${stg.title}: ${stg.tagline}`}
                >
                  {isPast ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full bg-slate-950/60 flex items-center justify-center text-[9px] font-bold">
                      {stg.step}
                    </span>
                  )}
                  <span className="hidden sm:inline">{stg.title.split('. ')[1]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Actions: Theme Selector, Next Step recommendation, Focus Mode, & Expand/Collapse */}
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {/* Universal 3-Theme Selector */}
          {onSelectTheme && (
            <StudioThemeSelector
              currentTheme={theme}
              onSelectTheme={onSelectTheme}
              variant="workflow"
              showLabels={true}
            />
          )}

          {/* Quick "Next Recommended Step" Button */}
          {currentStage.step < 5 && (
            <button
              onClick={() => onSelectTab(nextStage.tabKey)}
              className="px-2.5 py-1 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-700/50 hover:bg-emerald-900/60 text-[11px] font-mono font-medium flex items-center gap-1 transition cursor-pointer"
              title={`Advance to Stage ${nextStage.step}: ${nextStage.title}`}
            >
              <span>Next: {nextStage.title.split('. ')[1]}</span>
              <ArrowRight className="w-3 h-3 text-emerald-400" />
            </button>
          )}

          {/* Focus Mode Toggle */}
          <button
            onClick={onToggleFocusMode}
            className={`px-2 py-1 rounded-md text-[11px] font-mono transition flex items-center gap-1 cursor-pointer ${
              focusMode
                ? 'bg-purple-900/60 text-purple-200 border border-purple-600/50'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
            }`}
            title="Focus Mode hides extra secondary panels so you can work distraction-free"
          >
            <Eye className="w-3 h-3" />
            <span className="hidden md:inline">{focusMode ? 'Focus: ON' : 'Focus Mode'}</span>
          </button>

          {/* Expand/Collapse Toggle */}
          <button
            onClick={() => setIsExpanded(prev => !prev)}
            className="p-1 rounded text-slate-400 hover:text-white transition cursor-pointer"
            title={isExpanded ? 'Collapse Workflow Guide' : 'Expand 5-Step Workflow Guide'}
            aria-label="Toggle Workflow Guide Details"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* EXPANDABLE DETAILED 5-STEP ROADMAP */}
      {isExpanded && (
        <div className="px-4 pb-3 pt-1 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-5 gap-2.5 animate-in fade-in duration-150">
          {STUDIO_WORKFLOW_STAGES.map((stg) => {
            const isActive = currentStage.step === stg.step;
            const Icon = stg.icon;
            return (
              <div
                key={stg.id}
                onClick={() => onSelectTab(stg.tabKey)}
                className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? 'bg-slate-950 border-indigo-500 shadow-sm ring-1 ring-indigo-500/30'
                    : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      PHASE {stg.step}
                    </span>
                    <Icon className={`w-3.5 h-3.5 ${stg.accentColor}`} />
                  </div>
                  <h4 className="text-xs font-bold text-white leading-tight">
                    {stg.title.split('. ')[1]}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {stg.description}
                  </p>
                </div>
                <div className="mt-2 pt-1 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-indigo-400">
                  <span>{stg.tagline}</span>
                  <ArrowRight className="w-2.5 h-2.5 opacity-60" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
