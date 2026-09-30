import React from 'react';
import { Sun, Moon, Sparkles, Check } from 'lucide-react';
import { StudioTheme } from '../types';

export interface StudioThemeDefinition {
  id: StudioTheme;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  activeBg: string;
  activeText: string;
  activeBorder: string;
  badge: string;
}

export const STUDIO_THEMES: StudioThemeDefinition[] = [
  {
    id: 'sun',
    name: 'Sun (Daylight)',
    shortName: 'Sun',
    tagline: 'Daylight Nashville Mode',
    description: 'Crisp, high-clarity light theme with pure white cards and sharp contrast for bright daytime studio writing sessions.',
    icon: Sun,
    accentColor: 'text-amber-500',
    activeBg: 'bg-amber-500',
    activeText: 'text-slate-950 font-black',
    activeBorder: 'border-amber-400',
    badge: '☀️ Day'
  },
  {
    id: 'moon',
    name: 'Moon (Dark Studio)',
    shortName: 'Moon',
    tagline: 'Pro-DAW Obsidian Dark',
    description: 'Classic high-contrast dark studio aesthetic with pitch-black obsidian backgrounds and vibrant neon VU level meters.',
    icon: Moon,
    accentColor: 'text-indigo-400',
    activeBg: 'bg-indigo-600',
    activeText: 'text-white font-black',
    activeBorder: 'border-indigo-400',
    badge: '🌙 Dark'
  },
  {
    id: 'stars',
    name: 'Stars (Twilight)',
    shortName: 'Stars',
    tagline: 'Muted Low-Fatigue Twilight',
    description: 'Soft-contrast midnight slate and lavender aesthetic designed for marathon late-night critical listening and zero eye strain.',
    icon: Sparkles,
    accentColor: 'text-purple-300',
    activeBg: 'bg-gradient-to-r from-purple-900 to-indigo-950',
    activeText: 'text-purple-200 font-black',
    activeBorder: 'border-purple-500/60',
    badge: '✨ Twilight'
  }
];

interface StudioThemeSelectorProps {
  currentTheme: StudioTheme;
  onSelectTheme: (theme: StudioTheme) => void;
  variant?: 'header' | 'workflow' | 'sidebar' | 'inline';
  showLabels?: boolean;
  className?: string;
}

export const StudioThemeSelector: React.FC<StudioThemeSelectorProps> = ({
  currentTheme,
  onSelectTheme,
  variant = 'header',
  showLabels = true,
  className = ''
}) => {
  if (variant === 'sidebar') {
    return (
      <div className={`p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 ${className}`}>
        <div className="flex items-center justify-between mb-1.5 px-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            Studio Theme
          </span>
          <span className="text-[10px] font-mono text-indigo-400 font-semibold">
            {STUDIO_THEMES.find(t => t.id === currentTheme)?.shortName}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1" role="radiogroup" aria-label="Studio Theme Selector">
          {STUDIO_THEMES.map((theme) => {
            const isActive = currentTheme === theme.id;
            const Icon = theme.icon;
            return (
              <button
                key={theme.id}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => onSelectTheme(theme.id)}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold flex flex-col items-center justify-center gap-1 transition cursor-pointer border ${
                  isActive
                    ? `${theme.activeBg} ${theme.activeText} ${theme.activeBorder} shadow-sm`
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
                }`}
                title={`${theme.name} — ${theme.description}`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? '' : theme.accentColor}`} />
                <span className="text-[10px]">{theme.shortName}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center bg-slate-950/90 p-0.5 rounded-xl border border-slate-800 shadow-xs flex-shrink-0 ${className}`}
      role="radiogroup"
      aria-label="Studio Theme Selector"
    >
      {STUDIO_THEMES.map((theme) => {
        const isActive = currentTheme === theme.id;
        const Icon = theme.icon;
        return (
          <button
            key={theme.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onSelectTheme(theme.id)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer border ${
              isActive
                ? `${theme.activeBg} ${theme.activeText} ${theme.activeBorder} shadow-sm ring-1 ring-white/10`
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border-transparent'
            }`}
            title={`${theme.name}: ${theme.tagline} — ${theme.description}`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? '' : theme.accentColor}`} />
            {showLabels && (
              <span className="text-[11px] font-semibold">{theme.shortName}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};
