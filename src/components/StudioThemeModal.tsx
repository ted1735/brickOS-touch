import React from 'react';
import { Check, X, Palette, Keyboard, ShieldCheck } from 'lucide-react';
import { StudioTheme } from '../types';
import { STUDIO_THEMES, StudioThemeDefinition } from './StudioThemeSelector';

interface StudioThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: StudioTheme;
  onSelectTheme: (theme: StudioTheme) => void;
}

export const StudioThemeModal: React.FC<StudioThemeModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="theme-modal-title"
    >
      <div
        className="w-full max-w-3xl rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="theme-modal-title" className="text-lg font-black text-white tracking-tight">
                  Studio Theme Architecture
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                  Six Studio Palettes
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Choose your studio visual environment tailored for writing, mixing, or late-night listening.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close Theme Customizer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY: THEME CARDS */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STUDIO_THEMES.map((theme: StudioThemeDefinition) => {
              const isActive = currentTheme === theme.id;
              const Icon = theme.icon;

              return (
                <div
                  key={theme.id}
                  onClick={() => onSelectTheme(theme.id)}
                  className={`rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
                    isActive
                      ? 'bg-slate-800/90 border-indigo-500 shadow-xl shadow-indigo-950/40 ring-2 ring-indigo-500/20'
                      : 'bg-slate-950/60 hover:bg-slate-800/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Active Ribbon */}
                  {isActive && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-indigo-600 text-white shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>ACTIVE</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    {/* Visual Swatch Preview Box */}
                    <div
                      className="h-24 rounded-xl border flex flex-col justify-between p-2.5 transition-all shadow-inner"
                      style={{ backgroundColor: theme.preview.surface, borderColor: theme.preview.accent, color: theme.preview.text }}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: `${theme.preview.accent}22`, color: theme.preview.accent }}
                        >
                          {theme.badge}
                        </span>
                        <div className="flex items-center gap-1">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: theme.preview.accent }}
                          />
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: theme.preview.text }}
                          />
                        </div>
                      </div>

                      {/* Mini Mock UI representation */}
                      <div className="space-y-1">
                        <div className="h-2 rounded w-3/4" style={{ backgroundColor: theme.preview.panel }} />
                        <div className="h-2 rounded w-1/2" style={{ backgroundColor: theme.preview.accent, opacity: 0.65 }} />
                      </div>
                    </div>

                    {/* Title & Tagline */}
                    <div>
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${theme.accentColor}`} />
                        <h3 className="text-sm font-bold text-white tracking-tight">
                          {theme.name}
                        </h3>
                      </div>
                      <p className="text-[11px] font-semibold text-indigo-400 mt-0.5 font-mono">
                        {theme.tagline}
                      </p>
                    </div>

                    {/* Detailed Description */}
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {theme.description}
                    </p>
                  </div>

                  {/* Action / Select Button */}
                  <div className="pt-4 mt-4 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTheme(theme.id);
                      }}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition cursor-pointer border ${
                        isActive
                          ? `${theme.activeBg} ${theme.activeText} ${theme.activeBorder} shadow-md`
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{isActive ? 'Current Theme' : `Switch to ${theme.shortName}`}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* THEME SHORTCUTS & ERGONOMICS TIP */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2.5">
              <Keyboard className="w-4 h-4 text-purple-400 shrink-0" />
              <span>
                Quick Theme Cycle Hotkey:{' '}
                <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-purple-300 font-mono font-bold">
                  Shift+T
                </kbd>{' '}
                or{' '}
                <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-purple-300 font-mono font-bold">
                  Alt+T
                </kbd>
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Persists automatically in browser storage</span>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Current Active Mode: <strong className="text-white uppercase font-mono">{currentTheme}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
