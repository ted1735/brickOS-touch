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
  Keyboard
} from 'lucide-react';

interface StudioTwoRowNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDarkMode?: boolean;
  onOpenSectionGuide?: (sectionId?: any) => void;
  onOpenShortcutsCheatSheet?: () => void;
}

export const StudioTwoRowNavigation: React.FC<StudioTwoRowNavigationProps> = ({
  activeTab,
  setActiveTab,
  isDarkMode = true,
  onOpenSectionGuide,
  onOpenShortcutsCheatSheet
}) => {
  // Collapsed to icons mode: default to true so user gets the requested icon-only dual row experience, with easy toggle
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('brickos_dualrow_collapsed');
      if (saved !== null) {
        return saved === 'true';
      }
    }
    return true; // default to collapsed down into icons as requested
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
    
    // Calculate horizontal center aligned with hovered button
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    
    // Keep within window bounds
    if (typeof window !== 'undefined') {
      if (left < 16) left = 16;
      if (left + tooltipWidth > window.innerWidth - 16) {
        left = window.innerWidth - tooltipWidth - 16;
      }
    }

    // Arrow offset relative to tooltip
    const arrowLeft = rect.left + rect.width / 2 - left;

    // Place below button if space allows, otherwise above
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

  return (
    <div
      className={`border-b pb-2.5 pt-1 space-y-2 flex flex-col relative transition-all duration-200 ${
        isDarkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50/50'
      }`}
    >
      {/* TOP CONTROLS BAR: ROW INDICATOR & COLLAPSE / EXPAND TOGGLE */}
      <div className="flex items-center justify-between px-1 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className={`text-[11px] font-black uppercase tracking-wider font-mono ${
              isDarkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Studio Navigation Deck
            </span>
          </div>

          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold border ${
            isCollapsed
              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
              : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}>
            {isCollapsed ? 'Compact Icon Mode' : 'Expanded Labels Mode'}
          </span>

          <span className="text-[10px] text-slate-500 hidden md:inline">
            (Hover any icon for instant tool description & SOP rules)
          </span>
        </div>

        {/* COLLAPSE / EXPAND TOGGLE BUTTON */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleCollapse}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
              isDarkMode
                ? 'bg-slate-900 hover:bg-slate-800 text-indigo-300 border-slate-700 hover:border-indigo-500/50'
                : 'bg-white hover:bg-slate-100 text-indigo-700 border-slate-300 hover:border-indigo-400'
            }`}
            title={isCollapsed ? 'Expand navigation to show full text labels' : 'Collapse navigation down to compact icons'}
          >
            {isCollapsed ? (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Expand Labels</span>
                <span className="sm:hidden">Expand</span>
              </>
            ) : (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Collapse to Icons</span>
                <span className="sm:hidden">Icons Only</span>
              </>
            )}
          </button>

          {onOpenShortcutsCheatSheet && (
            <button
              onClick={onOpenShortcutsCheatSheet}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                isDarkMode
                  ? 'bg-slate-900 hover:bg-slate-800 text-purple-300 border-slate-700 hover:border-purple-500/50'
                  : 'bg-white hover:bg-slate-100 text-purple-700 border-slate-300 hover:border-purple-400'
              }`}
              title="Open Global Keyboard Shortcuts Cheat Sheet (?)"
              aria-label="Open Global Keyboard Shortcuts Cheat Sheet"
            >
              <Keyboard className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Keymap</span>
              <kbd className="px-1 py-0.2 rounded text-[9px] font-mono bg-purple-950/60 border border-purple-800/60 text-purple-300 font-bold">
                ?
              </kbd>
            </button>
          )}
        </div>
      </div>

      {/* ROW 1: TIER 1 - CORE MUSIC & AUDIO PRODUCTION PIPELINE */}
      <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar px-1 py-0.5">
        {/* Tier Label Badge */}
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

        {/* Tier 1 Navigation Items */}
        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
          {TIER_1_NAV_ITEMS.map((item) => {
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

                {/* Active Indicator Glow Pip (Shown on icons in collapsed mode) */}
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-slate-950 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ROW 2: TIER 2 - MEDIA, SEO, TELEMETRY & AI COPILOTS */}
      <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar px-1 py-0.5">
        {/* Tier Label Badge */}
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

        {/* Tier 2 Navigation Items */}
        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
          {TIER_2_NAV_ITEMS.map((item) => {
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

                {/* Active Indicator Glow Pip */}
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-slate-950 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FLOATING HOVER DESCRIPTION CARD (POPUP WITH ZERO-CLIPPING GUARANTEE)     */}
      {/* ========================================================================= */}
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
            {/* Pointer Arrow */}
            <div
              style={{ left: tooltipPos.arrowLeft }}
              className={`absolute w-3 h-3 rotate-45 border transition-all ${
                tooltipPos.placeAbove
                  ? 'bottom-[-6px] border-b border-r'
                  : 'top-[-6px] border-t border-l'
              } ${
                isDarkMode
                  ? 'bg-slate-900 border-slate-700/80'
                  : 'bg-white border-slate-300'
              }`}
            />

            {/* Header: Icon, Tool Name & Category */}
            <div className="flex items-start gap-2.5 mb-2 relative z-10">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                  activeTab === hoveredItem.item.id
                    ? `${hoveredItem.item.activeBg} text-white`
                    : isDarkMode
                    ? 'bg-slate-800 text-indigo-400 border border-slate-700'
                    : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                }`}
              >
                {React.createElement(hoveredItem.item.icon, { className: 'w-4 h-4' })}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-black tracking-wide truncate">
                    {hoveredItem.item.name}
                  </h4>
                  {hoveredItem.item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      {hoveredItem.item.badge}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-semibold ${hoveredItem.item.tierBadgeColor}`}>
                    {hoveredItem.item.tierLabel}
                  </span>
                  {activeTab === hoveredItem.item.id && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/30 font-mono">
                      <CheckCircle2 className="w-3 h-3 text-amber-400" />
                      ACTIVE
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Tool Description */}
            <p className={`text-[11.5px] leading-relaxed mb-2 relative z-10 ${
              isDarkMode ? 'text-slate-300' : 'text-slate-600'
            }`}>
              {hoveredItem.item.description}
            </p>

            {/* SOP Rule Callout if available */}
            {hoveredItem.item.sopRule && (
              <div className={`p-2 rounded-xl border text-[10.5px] leading-tight flex items-start gap-1.5 mb-2 relative z-10 ${
                isDarkMode
                  ? 'bg-amber-950/40 border-amber-800/40 text-amber-300'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Nashville SOP:</strong> {hoveredItem.item.sopRule}
                </span>
              </div>
            )}

            {/* Card Footer: Action Prompt & Keyboard Shortcut */}
            <div className={`pt-2 border-t flex items-center justify-between text-[10px] font-mono relative z-10 ${
              isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
            }`}>
              <span className="flex items-center gap-1 text-indigo-400 font-bold">
                <ArrowRight className="w-3 h-3" />
                <span>Click icon to switch workspace</span>
              </span>
              {hoveredItem.item.shortcut && (
                <span className="px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-slate-300 font-bold">
                  {hoveredItem.item.shortcut}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
