import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, BookOpen, CheckCircle2, ShieldCheck, ExternalLink } from 'lucide-react';
import { StudioSectionId, SECTION_GUIDES } from './SectionInstructionModal';

interface SectionQuickHelpBannerProps {
  sectionId: StudioSectionId;
  onOpenModalGuide: (sectionId: StudioSectionId) => void;
  isDarkMode?: boolean;
  compact?: boolean;
  titleOverride?: string;
  className?: string;
}

export const SectionQuickHelpBanner: React.FC<SectionQuickHelpBannerProps> = ({
  sectionId,
  onOpenModalGuide,
  isDarkMode = true,
  compact = false,
  titleOverride,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const guide = SECTION_GUIDES[sectionId] || SECTION_GUIDES.kanban;
  const IconComponent = guide.icon;

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => onOpenModalGuide(sectionId)}
        className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 ${
          isDarkMode
            ? 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border-amber-700/50 hover:border-amber-500'
            : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 hover:border-amber-400'
        } ${className}`}
        title={`Click for detailed instructions and SOP rules for ${guide.title}`}
      >
        <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>{titleOverride || 'How To Use This Section'}</span>
      </button>
    );
  }

  return (
    <div
      className={`border rounded-2xl p-3 sm:p-4 transition-all duration-200 shadow-xs ${
        isDarkMode
          ? 'bg-slate-900/90 border-slate-800 text-slate-200'
          : 'bg-white border-slate-200 text-slate-800'
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${
              isDarkMode
                ? 'bg-amber-950/50 text-amber-400 border-amber-700/50'
                : 'bg-amber-100 text-amber-800 border-amber-300'
            }`}
          >
            <IconComponent className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-black tracking-wide uppercase ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {guide.title}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                  isDarkMode
                    ? 'bg-indigo-950 text-indigo-300 border-indigo-800/60'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}
              >
                {guide.badge}
              </span>
            </div>
            <p className={`text-[11px] truncate max-w-xl ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {guide.summary}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              isDarkMode
                ? 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
            }`}
            title="Expand/collapse in-page quick steps"
          >
            <span>Quick Steps</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => onOpenModalGuide(sectionId)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
              isDarkMode
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white border-amber-400/50 shadow-amber-950/40'
                : 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500 shadow-amber-900/20'
            }`}
            title="Open comprehensive step-by-step instructions, best practices, and Nashville SOP rules"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-200" />
            <span>📖 Detailed Instructions & SOP</span>
          </button>
        </div>
      </div>

      {/* Expandable Quick Steps Drawer */}
      {isExpanded && (
        <div className={`mt-3 pt-3 border-t grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in duration-150 ${
          isDarkMode ? 'border-slate-800' : 'border-slate-200'
        }`}>
          {/* Key Steps */}
          <div className="space-y-1.5">
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${
              isDarkMode ? 'text-amber-400' : 'text-amber-700'
            }`}>
              Core Workflow Steps
            </span>
            <ul className="space-y-1">
              {guide.keySteps.map((step, idx) => (
                <li key={idx} className="text-[11px] flex items-start gap-1.5">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mt-0.5 ${
                    isDarkMode ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* SOP & Best Practices */}
          <div className="space-y-1.5">
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${
              isDarkMode ? 'text-indigo-400' : 'text-indigo-700'
            }`}>
              Nashville SOP Rules & Standards
            </span>
            <ul className="space-y-1">
              {guide.sopRules.map((rule, idx) => (
                <li key={idx} className="text-[11px] flex items-start gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>{rule}</span>
                </li>
              ))}
              {guide.bestPractices.slice(0, 1).map((bp, idx) => (
                <li key={`bp-${idx}`} className="text-[11px] flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}><strong>Tip:</strong> {bp}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
