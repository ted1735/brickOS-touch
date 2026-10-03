import React from 'react';
import { Sun, Moon, Sparkles, Layers3, SlidersHorizontal, PanelsTopLeft } from 'lucide-react';
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
  preview: { surface: string; panel: string; accent: string; text: string };
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
    badge: 'DAYLIGHT',
    preview: { surface: '#f8fafc', panel: '#ffffff', accent: '#d97706', text: '#0f172a' }
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
    badge: 'OBSIDIAN',
    preview: { surface: '#020617', panel: '#0f172a', accent: '#6366f1', text: '#f1f5f9' }
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
    badge: 'TWILIGHT',
    preview: { surface: '#0a0e1a', panel: '#141a2e', accent: '#a78bfa', text: '#cbd5e1' }
  },
  {
    id: 'graphite', name: 'Graphite Studio', shortName: 'Graphite', tagline: 'Neutral Control Room',
    description: 'A restrained charcoal interface with cool blue accents and clear separation between work surfaces.',
    icon: Layers3, accentColor: 'text-sky-400', activeBg: 'bg-sky-700', activeText: 'text-white font-black',
    activeBorder: 'border-sky-400', badge: 'GRAPHITE',
    preview: { surface: '#171b22', panel: '#222832', accent: '#38bdf8', text: '#e5e7eb' }
  },
  {
    id: 'console', name: 'Warm Console', shortName: 'Console', tagline: 'Warm Analog Desk',
    description: 'A deep neutral console palette with subtle brass highlights for a calmer, hardware-inspired studio.',
    icon: SlidersHorizontal, accentColor: 'text-amber-400', activeBg: 'bg-amber-600', activeText: 'text-white font-black',
    activeBorder: 'border-amber-400', badge: 'WARM CONSOLE',
    preview: { surface: '#191816', panel: '#28251f', accent: '#d6a75d', text: '#e7e2d8' }
  },
  {
    id: 'clean', name: 'Clean Studio', shortName: 'Clean', tagline: 'Warm Neutral Light',
    description: 'A professional light workspace with soft ivory surfaces, quiet borders, and crisp slate typography.',
    icon: PanelsTopLeft, accentColor: 'text-blue-700', activeBg: 'bg-blue-700', activeText: 'text-white font-black',
    activeBorder: 'border-blue-500', badge: 'CLEAN STUDIO',
    preview: { surface: '#f3f1ec', panel: '#fffefa', accent: '#2563eb', text: '#1f2937' }
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
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const activeThemeDef = STUDIO_THEMES.find(t => t.id === currentTheme) || STUDIO_THEMES[1];
  const ActiveIcon = activeThemeDef.icon;

  if (variant === 'sidebar') {
    return (
      <div className={`p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 ${className}`}>
        <div className="flex items-center justify-between mb-1.5 px-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            Studio Theme
          </span>
          <span className="text-[10px] font-mono text-indigo-400 font-semibold">
            {activeThemeDef.shortName}
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
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border-slate-700/60 hover:border-slate-600'
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

  // Header Dropdown Popover Variant (Sleek, low visual noise, single button with floating palette)
  if (variant === 'header') {
    return (
      <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 transition cursor-pointer shadow-sm ${
            isOpen
              ? 'bg-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-500/30'
              : 'bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border-slate-700 hover:border-slate-600'
          }`}
          title="Switch Studio Color Theme & Eye Fatigue Mode"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <ActiveIcon className={`w-3.5 h-3.5 ${isOpen ? 'text-white' : activeThemeDef.accentColor}`} />
          <span>{activeThemeDef.shortName}</span>
          <span className="text-[10px] opacity-60">▾</span>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2.5 py-1.5 border-b border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Studio Color Themes
              </span>
              <span className="text-[10px] font-mono text-indigo-400 font-bold px-1.5 py-0.5 rounded bg-indigo-950/60 border border-indigo-700/40">
                {activeThemeDef.badge}
              </span>
            </div>

            <div className="space-y-1 pt-1 max-h-80 overflow-y-auto">
              {STUDIO_THEMES.map((theme) => {
                const isActive = currentTheme === theme.id;
                const Icon = theme.icon;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => {
                      onSelectTheme(theme.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-xl transition cursor-pointer flex items-center justify-between gap-2 border ${
                      isActive
                        ? 'bg-slate-800 border-indigo-500/80 text-white shadow-xs'
                        : 'bg-transparent hover:bg-slate-800/60 border-transparent text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 shadow-xs border"
                        style={{
                          backgroundColor: theme.preview.panel,
                          borderColor: theme.preview.accent
                        }}
                      >
                        <Icon className={`w-3.5 h-3.5 ${theme.accentColor}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold font-mono flex items-center gap-1.5">
                          <span>{theme.name}</span>
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {theme.tagline}
                        </div>
                      </div>
                    </div>
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0 border border-slate-700"
                      style={{ backgroundColor: theme.preview.accent }}
                      title={theme.badge}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center bg-slate-900/80 p-0.5 rounded-xl border border-slate-800 shadow-xs flex-shrink-0 ${className}`}
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
