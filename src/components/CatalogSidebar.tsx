import React, { useState } from 'react';
import { Plus, Search, Filter, Disc, ShieldCheck, Heart, Sparkles } from 'lucide-react';
import { Track } from '../types';
import { EP_COLLECTIONS } from '../data/canonicalCatalog';

interface CatalogSidebarProps {
  tracks: Track[];
  selectedTrack: Track;
  onSelectTrack: (track: Track) => void;
  onAddTrack: () => void;
}

export const CatalogSidebar: React.FC<CatalogSidebarProps> = ({
  tracks,
  selectedTrack,
  onSelectTrack,
  onAddTrack
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEpFilter, setSelectedEpFilter] = useState('ALL');

  const filteredTracks = tracks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.vocalCast.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesEp = selectedEpFilter === 'ALL' || t.ep.includes(selectedEpFilter);
    return matchesSearch && matchesEp;
  });

  return (
    <aside className="w-full lg:w-84 bg-slate-900/70 border-r border-slate-800 flex flex-col p-4 space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Disc className="w-4 h-4 text-indigo-400 animate-spin-slow" />
          <span className="text-xs font-black text-slate-300 uppercase tracking-wider">
            Catalog Roster ({filteredTracks.length}/{tracks.length})
          </span>
        </div>
        <button
          onClick={onAddTrack}
          className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-1 text-xs font-bold shadow-sm"
          title="Add New Track to Catalog"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Track</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Search track, genre, vocal..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* EP Suite Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-[10px] font-bold">
        <button
          onClick={() => setSelectedEpFilter('ALL')}
          className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
            selectedEpFilter === 'ALL'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          All EPs
        </button>
        {EP_COLLECTIONS.map((ep, idx) => (
          <button
            key={ep.id}
            onClick={() => setSelectedEpFilter(`EP ${idx + 1}`)}
            className={`px-2 py-1 rounded-lg transition whitespace-nowrap ${
              selectedEpFilter === `EP ${idx + 1}`
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            EP {idx + 1}
          </button>
        ))}
      </div>

      {/* Track List */}
      <div className="space-y-2 flex-1 overflow-y-auto max-h-[calc(100vh-250px)] custom-scrollbar pr-1">
        {filteredTracks.map((trk) => {
          const isSelected = selectedTrack.id === trk.id;
          return (
            <div
              key={trk.id}
              onClick={() => onSelectTrack(trk)}
              className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col gap-1.5 text-left relative group ${
                isSelected
                  ? 'bg-indigo-950/50 border-indigo-500/80 shadow-lg shadow-indigo-950/60 ring-1 ring-indigo-500/30'
                  : 'bg-slate-900/90 border-slate-800/90 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-indigo-400">{trk.id}</span>
                  {trk.selahPrayed && (
                    <span className="text-[10px] text-amber-400 flex items-center gap-0.5" title="Selah Prayer Block Completed">
                      <Heart className="w-3 h-3 fill-amber-400/40 text-amber-400 inline" />
                    </span>
                  )}
                </div>
                <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold ${
                  trk.status === 'Sent for Distribution' || trk.status === 'Released'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                    : trk.status === 'Audio Master'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800/40'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {trk.status}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white group-hover:text-indigo-200 transition line-clamp-1">
                {trk.title}
              </h3>

              <p className="text-[11px] text-slate-400 line-clamp-1">
                {trk.genre} • <span className="font-mono text-slate-300">{trk.bpm} BPM</span> • <span className="text-indigo-300">{trk.key}</span>
              </p>

              <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5 border-t border-slate-800/60">
                <span className="truncate max-w-[170px] text-slate-300 font-medium">
                  {trk.vocalCast}
                </span>
                <span className="text-slate-400 font-mono text-[9px]">
                  v{trk.versions[trk.versions.length - 1]?.version || '1.0'}
                </span>
              </div>
            </div>
          );
        })}

        {filteredTracks.length === 0 && (
          <div className="p-6 text-center text-xs text-slate-500 italic">
            No tracks found matching your query.
          </div>
        )}
      </div>
    </aside>
  );
};
