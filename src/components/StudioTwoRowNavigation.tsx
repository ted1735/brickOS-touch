import React, { useState, useRef, useEffect } from 'react';
import {
  TIER_1_NAV_ITEMS,
  TIER_2_NAV_ITEMS,
  StudioNavItem
} from '../data/studioNavigationData';
import {
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Maximize2,
  Minimize2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Keyboard,
  Command,
  MessageSquare,
  Compass,
  Feather,
  Sliders,
  Film,
  Rocket
} from 'lucide-react';

export type StudioPhase = 'all' | 'composition' | 'audio' | 'visuals' | 'release';

const PHASE_DEFINITIONS: Array<{
  id: StudioPhase;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  tabs: string[];
}> = [
  {
    id: 'all',
    label: 'All Views',
    icon: Compass,
    accentColor: 'text-slate-400',
    tabs: []
  },
  {
    id: 'composition',
    label: '1. Composition',
    icon: Feather,
    accentColor: 'text-indigo-400',
    tabs: ['brainstorming', 'lyrics', 'version-matrix', 'prompt_library']
  },
  {
    id: 'audio',
    label: '2. Sound & Mix',
    icon: Sliders,
    accentColor: 'text-emerald-400',
    tabs: ['mixer', 'mastering', 'nextcloud_sync', 'database']
  },
  {
    id: 'visuals',
    label: '3. Visuals & Avatar',
    icon: Film,
    accentColor: 'text-amber-400',
    tabs: ['video_express', 'veo_visuals', 'nightcafe']
  },
  {
    id: 'release',
    label: '4. Release & Outreach',
    icon: Rocket,
    accentColor: 'text-rose-400',
    tabs: ['kanban', 'youtube', 'omnipost', 'ministry']
  }
];

interface StudioTwoRowNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDarkMode?: boolean;
  onOpenSectionGuide?: (sectionId?: any) => void;
  onOpenShortcutsCheatSheet?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenCopilotDrawer?: () => void;
  isZenMode?: boolean;
  onToggleZenMode?: () => void;
}

export const StudioTwoRowNavigation: React.FC<StudioTwoRowNavigationProps> = ({
  activeTab,
  setActiveTab,
  isDarkMode = true,
  onOpenSectionGuide,
  onOpenShortcutsCheatSheet,
  onOpenCommandPalette,
  onOpenCopilotDrawer,
  isZenMode = false,
  onToggleZenMode
}) => {
  // Phase Workflow Lens State
  const [activePhase, setActivePhase] = useState<StudioPhase>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('brickos_studio_phase') as StudioPhase;
      if (saved) return saved;
    }
    return 'all';
  });

  const handleSelectPhase = (phase: StudioPhase) => {
    setActivePhase(phase);
    if (typeof window !== 'undefined') {
      localStorage.setItem('brickos_studio_phase', phase);
    }
    // If current tab is not in the newly selected phase (and phase !== 'all'), switch to first tab of that phase
    if (phase !== 'all') {
      const def = PHASE_DEFINITIONS.find(p => p.id === phase);
      if (def && !def.tabs.includes(activeTab)) {
        setActiveTab(def.tabs[0]);
      }
    }
  };

  // Collapsed to icons mode
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('brickos_dualrow_collapsed');
      if (saved !== null) {
        return saved === 'true';
      }
    }
    return true;
  });

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('brickos_dualrow_collapsed', String(next));
      }
      return next;
    });
  };

  // Hover state for the rich description card
  const [hoveredItem, setHoveredItem] = useState<{
    item: StudioNavItem;
    rect: DOMRect;
  } | null>(null);

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (item: StudioNavItem, e: React.MouseEvent<HTMLButtonElement>) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredItem({ item, rect });
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredItem(null);
    }, 120);
  };

  const handleFocus = (item: StudioNavItem, e: React.FocusEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredItem({ item, rect });
  };

  const handleBlur = () => {
    setHoveredItem(null);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Compute tooltip position
  const getTooltipStyle = () => {
    if (!hoveredItem) return {};
    const { rect } = hoveredItem;
    const tooltipWidth = 340;
    
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    
    if (typeof window !== 'undefined') {
      if (left < 16) left = 16;
      if (left + tooltipWidth > window.innerWidth - 16) {
        left = window.innerWidth - tooltipWidth - 16;
      }
    }

    const arrowLeft = rect.left + rect.width / 2 - left;
    const spaceBelow = typeof window !== 'undefined' ? window.innerHeight - rect.bottom : 500;
    const placeAbove = spaceBelow < 220;
    const top = placeAbove ? rect.top - 12 : rect.bottom + 10;

    return {
      left: `${left}px`,
      top: `${top}px`,
      arrowLeft: `${arrowLeft}px`,
      placeAbove
    };
  };

  const tooltipPos = getTooltipStyle() as any;

  // Filter items based on active phase
  const isPhaseFiltered = activePhase !== 'all';
  const activePhaseDef = PHASE_DEFINITIONS.find(p => p.id === activePhase);
  const allowedTabs = activePhaseDef?.tabs || [];

  const tier1Items = isPhaseFiltered
    ? TIER_1_NAV_ITEMS.filter(item => allowedTabs.includes(item.id))
    : TIER_1_NAV_ITEMS;

  const tier2Items = isPhaseFiltered
    ? TIER_2_NAV_ITEMS.filter(item => allowedTabs.includes(item.id))
    : TIER_2_NAV_ITEMS;

  return (
    <div
      className={`border-b pb-2 pt-1 space-y-2 flex flex-col relative transition-all duration-200 ${
        isDarkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50/50'
      }`}
    >
      {/* TOP CONTROLS BAR: PHASE WORKFLOW SWITCHER & QUICK ACTIONS */}
      <div className="flex items-center justify-between px-1 gap-2 flex-wrap">
        {/* Phase Workflow Switcher Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold mr-1 shrink-0">
            Phase:
          </span>
          {PHASE_DEFINITIONS.map(phase => {
            const PhaseIcon = phase.icon;
            const isSelected = activePhase === phase.id;

            return (
              <button
                key={phase.id}
                type="button"
                onClick={() => handleSelectPhase(phase.id)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                    : isDarkMode
                    ? 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border-slate-800'
                    : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200'
                }`}
                title={`Switch studio lens to ${phase.label}`}
              >
                <PhaseIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : phase.accentColor}`} />
                <span>{phase.label}</span>
              </button>
            );
          })}
        </div>

        {/* Action Controls: Command Palette, Copilot Dock, Zen Mode, Expand */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Command Palette Button (Ctrl+K) */}
          {onOpenCommandPalette && (
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                isDarkMode
                  ? 'bg-slate-900 hover:bg-slate-800 text-indigo-300 border-slate-700 hover:border-indigo-500/50'
                  : 'bg-white hover:bg-slate-100 text-indigo-700 border-slate-300 hover:border-indigo-400'
              }`}
              title="Open Command Palette (Ctrl+K)"
            >
              <Command className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="px-1 py-0.2 rounded text-[9px] font-mono bg-indigo-950/80 border border-indigo-800 text-indigo-300">
                Ctrl+K
              </kbd>
            </button>
          )}

          {/* Copilot Drawer Button (Ctrl+J) */}
          {onOpenCopilotDrawer && (
            <button
              type="button"
              onClick={onOpenCopilotDrawer}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                isDarkMode
                  ? 'bg-teal-950/80 hover:bg-teal-900 text-teal-300 border-teal-800/60 hover:border-teal-600'
                  : 'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-300 hover:border-teal-400'
              }`}
              title="Toggle Studio Copilot Assistant Drawer (Ctrl+J)"
            >
              <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">Copilot</span>
              <kbd className="px-1 py-0.2 rounded text-[9px] font-mono bg-teal-950 border border-teal-800 text-teal-300">
                Ctrl+J
              </kbd>
            </button>
          )}

          {/* Zen / Focus Mode Toggle */}
          {onToggleZenMode && (
            <button
              type="button"
              onClick={onToggleZenMode}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                isZenMode
                  ? 'bg-purple-600 text-white border-purple-400 shadow-purple-500/30'
                  : isDarkMode
                  ? 'bg-slate-900 hover:bg-slate-800 text-purple-300 border-slate-700'
                  : 'bg-white hover:bg-slate-100 text-purple-700 border-slate-300'
              }`}
              title="Toggle Zen / Fullscreen Creative Focus Mode (Z)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isZenMode ? 'Exit Zen' : 'Zen'}</span>
              <kbd className="px-1 py-0.2 rounded text-[9px] font-mono bg-purple-950/80 border border-purple-800 text-purple-300">
                Z
              </kbd>
            </button>
          )}

          {/* Compact / Expanded Toggle */}
          <button
            onClick={toggleCollapse}
            className={`px-2 py-1 rounded-xl text-xs font-bold border flex items-center gap-1 transition cursor-pointer shadow-xs ${
              isDarkMode
                ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
            }`}
            title={isCollapsed ? 'Show full labels' : 'Collapse to compact icons'}
          >
            {isCollapsed ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Keymap */}
          {onOpenShortcutsCheatSheet && (
            <button
              onClick={onOpenShortcutsCheatSheet}
              className={`px-2 py-1 rounded-xl text-xs font-bold border flex items-center gap-1 transition cursor-pointer ${
                isDarkMode
                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-700'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-300'
              }`}
              title="Keymap (?)"
            >
              <Keyboard className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ROW 1: TIER 1 - CORE MUSIC & AUDIO PRODUCTION PIPELINE */}
      {tier1Items.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar px-1 py-0.5">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border flex-shrink-0 font-mono text-[10px] font-bold ${
              isDarkMode
                ? 'bg-indigo-950/70 text-indigo-300 border-indigo-800/40 shadow-xs'
                : 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-xs'
            }`}
            title="Tier 1: Core Music & Audio Production Pipeline"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span>{isCollapsed ? 'T1: Audio' : 'Tier 1: Audio Engine'}</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
            {tier1Items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  onMouseEnter={(e) => handleMouseEnter(item, e)}
                  onMouseLeave={handleMouseLeave}
                  onFocus={(e) => handleFocus(item, e)}
                  onBlur={handleBlur}
                  title={`${item.name} — ${item.description}`}
                  className={`relative group transition-all duration-150 cursor-pointer flex items-center justify-center border font-bold text-xs ${
                    isCollapsed
                      ? 'p-2 sm:p-2.5 min-w-[38px] h-[38px] rounded-xl'
                      : 'px-3 py-1.5 rounded-xl gap-1.5 whitespace-nowrap'
                  } ${
                    isActive
                      ? `${item.activeBg} ${item.activeBorder} text-white shadow-md ${item.glowColor} scale-[1.02] ring-2 ring-white/20`
                      : isDarkMode
                      ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-700'
                      : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 shadow-2xs'
                  }`}
                  aria-label={item.name}
                >
                  <Icon
                    className={`transition-transform duration-150 group-hover:scale-110 ${
                      isCollapsed ? 'w-4 h-4' : 'w-3.5 h-3.5'
                    } ${isActive ? 'text-white' : item.accentColor}`}
                  />

                  {!isCollapsed && <span>{item.shortName}</span>}

                  {isActive && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-slate-950 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ROW 2: TIER 2 - MEDIA, SEO, TELEMETRY & AI COPILOTS */}
      {tier2Items.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar px-1 py-0.5">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border flex-shrink-0 font-mono text-[10px] font-bold ${
              isDarkMode
                ? 'bg-purple-950/70 text-purple-300 border-purple-800/40 shadow-xs'
                : 'bg-purple-50 text-purple-700 border-purple-200 shadow-xs'
            }`}
            title="Tier 2: Visuals, SEO & AI Studio Copilots"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            <span>{isCollapsed ? 'T2: Visuals' : 'Tier 2: Visuals & Copilots'}</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
            {tier2Items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  onMouseEnter={(e) => handleMouseEnter(item, e)}
                  onMouseLeave={handleMouseLeave}
                  onFocus={(e) => handleFocus(item, e)}
                  onBlur={handleBlur}
                  title={`${item.name} — ${item.description}`}
                  className={`relative group transition-all duration-150 cursor-pointer flex items-center justify-center border font-bold text-xs ${
                    isCollapsed
                      ? 'p-2 sm:p-2.5 min-w-[38px] h-[38px] rounded-xl'
                      : 'px-3 py-1.5 rounded-xl gap-1.5 whitespace-nowrap'
                  } ${
                    isActive
                      ? `${item.activeBg} ${item.activeBorder} text-white shadow-md ${item.glowColor} scale-[1.02] ring-2 ring-white/20`
                      : isDarkMode
                      ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-700'
                      : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 shadow-2xs'
                  }`}
                  aria-label={item.name}
                >
                  <Icon
                    className={`transition-transform duration-150 group-hover:scale-110 ${
                      isCollapsed ? 'w-4 h-4' : 'w-3.5 h-3.5'
                    } ${isActive ? 'text-white' : item.accentColor}`}
                  />

                  {!isCollapsed && <span>{item.shortName}</span>}

                  {isActive && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-slate-950 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* FLOATING HOVER DESCRIPTION CARD */}
      {hoveredItem && (
        <div
          style={{
            position: 'fixed',
            left: tooltipPos.left,
            top: tooltipPos.top,
            transform: tooltipPos.placeAbove ? 'translateY(-100%)' : 'none',
            zIndex: 9999
          }}
          className="w-[340px] pointer-events-none animate-in fade-in zoom-in-95 duration-150"
        >
          <div
            className={`p-3.5 rounded-2xl shadow-2xl border backdrop-blur-xl relative transition-all ${
              isDarkMode
                ? 'bg-slate-900/95 border-slate-700/80 text-white shadow-indigo-950/70 ring-1 ring-white/10'
                : 'bg-white/95 border-slate-300 text-slate-900 shadow-xl ring-1 ring-slate-900/10'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {React.createElement(hoveredItem.item.icon, {
                  className: `w-4 h-4 ${hoveredItem.item.accentColor}`
                })}
                <span className="text-xs font-bold text-white">
                  {hoveredItem.item.name}
                </span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-bold ${hoveredItem.item.tierBadgeColor}`}>
                {hoveredItem.item.badge || hoveredItem.item.tierLabel}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-2.5">
              {hoveredItem.item.description}
            </p>

            {hoveredItem.item.sopRule && (
              <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-amber-300/90 font-mono flex items-start gap-1.5">
                <span className="text-amber-400 font-bold shrink-0">SOP:</span>
                <span>{hoveredItem.item.sopRule}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
