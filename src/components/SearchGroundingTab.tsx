import React from 'react';
import { Search, RefreshCw, ExternalLink, HelpCircle, Globe, Sparkles } from 'lucide-react';
import { SectionQuickHelpBanner } from './SectionQuickHelpBanner';

interface SearchSource {
  title?: string;
  url: string;
}

interface SearchGroundingResult {
  answer: string;
  sources?: SearchSource[];
}

interface SearchGroundingTabProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  onSearchGrounding: () => void;
  isSearching: boolean;
  searchResult: SearchGroundingResult | null;
  onOpenSectionGuide?: (sectionId: string) => void;
  isDarkMode?: boolean;
}

export const SearchGroundingTab: React.FC<SearchGroundingTabProps> = ({
  searchQuery,
  setSearchQuery,
  onSearchGrounding,
  isSearching,
  searchResult,
  onOpenSectionGuide,
  isDarkMode = true
}) => {
  return (
    <div className="space-y-4">
      {onOpenSectionGuide && (
        <SectionQuickHelpBanner
          sectionId="search"
          onOpenModalGuide={onOpenSectionGuide}
          isDarkMode={isDarkMode}
        />
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-cyan-400" />
              <span>Google Search Grounding (gemini-3.5-flash with googleSearch tool)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Retrieve real-time Billboard Christian/Gospel charts, BPM trends, Nashville mixing standards, and verified biblical citations.
            </p>
          </div>

          {onOpenSectionGuide && (
            <button
              type="button"
              onClick={() => onOpenSectionGuide('search')}
              className="px-3.5 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 text-xs font-bold border border-amber-700/50 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Open Google Search Grounding Operating Guide & SOP Rules"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>How To Use Search</span>
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearchGrounding()}
            placeholder="e.g. Current top 10 Christian Hip Hop tracks tempo and 808 style 2026..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
          <button
            onClick={onSearchGrounding}
            disabled={isSearching}
            className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-cyan-950 disabled:opacity-50 cursor-pointer"
          >
            {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>{isSearching ? 'Searching...' : 'Search Google Grounding'}</span>
          </button>
        </div>

        {/* Search Results */}
        {searchResult && (
          <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
            <div className="text-xs text-slate-200 font-mono leading-relaxed whitespace-pre-wrap">
              {searchResult.answer}
            </div>

            {searchResult.sources && searchResult.sources.length > 0 && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                  Verified Web Sources:
                </span>
                <div className="flex flex-wrap gap-2">
                  {searchResult.sources.map((src, idx) => (
                    <a
                      key={idx}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-cyan-400 hover:underline bg-slate-900 px-2.5 py-1 rounded border border-slate-800 flex items-center gap-1"
                    >
                      <span>{src.title || src.url}</span>
                      <ExternalLink className="w-2.5 h-2.5 inline" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
