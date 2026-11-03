import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Filter,
  Download,
  Share2,
  Sparkles,
  Layers,
  Music,
  Disc,
  Sliders,
  Scissors,
  Eye,
  Edit2,
  Plus,
  RefreshCw,
  Search,
  Check,
  X,
  ExternalLink,
  Target,
  Flag,
  CalendarDays,
  Flame,
  ArrowRight
} from 'lucide-react';
import { Track, TrackStatus, EPCollection, TrackMilestone, TrackTimelineData } from '../types';

interface ProductionTimelineTabProps {
  tracks: Track[];
  selectedTrack: Track;
  onSelectTrack: (track: Track) => void;
  onUpdateTrackStatus: (trackId: string, newStatus: TrackStatus) => void;
  onNavigateToTab: (tab: any) => void;
  epCollections?: EPCollection[];
  isDarkMode?: boolean;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

// 5-Phase Nashville SOP Phase Schema
interface SopPhase {
  id: string;
  name: string;
  shortLabel: string;
  color: string;
  bgRgba: string;
  borderClass: string;
  statusMatch: TrackStatus[];
}

const SOP_PHASES: SopPhase[] = [
  {
    id: 'lyrics',
    name: 'Phase 1: Lyric & Theology Audit',
    shortLabel: 'P1: Lyrics',
    color: '#f59e0b',
    bgRgba: 'rgba(245, 158, 11, 0.2)',
    borderClass: 'border-amber-500/50',
    statusMatch: ['Idea / Concept', 'Lyrics Finalized']
  },
  {
    id: 'suno',
    name: 'Phase 2: Suno v5.5 Generation',
    shortLabel: 'P2: Synthesis',
    color: '#6366f1',
    bgRgba: 'rgba(99, 102, 241, 0.2)',
    borderClass: 'border-indigo-500/50',
    statusMatch: ['In Progress']
  },
  {
    id: 'stems',
    name: 'Phase 3: UVR5 BS-Roformer Stems',
    shortLabel: 'P3: UVR5 Stems',
    color: '#a855f7',
    bgRgba: 'rgba(168, 85, 247, 0.2)',
    borderClass: 'border-purple-500/50',
    statusMatch: ['UVR5 Stem Prep']
  },
  {
    id: 'mastering',
    name: 'Phase 4: Senior Master (-12 LUFS)',
    shortLabel: 'P4: Mastering',
    color: '#06b6d4',
    bgRgba: 'rgba(6, 182, 212, 0.2)',
    borderClass: 'border-cyan-500/50',
    statusMatch: ['Audio Master']
  },
  {
    id: 'release',
    name: 'Phase 5: Distribution & Release',
    shortLabel: 'P5: Release',
    color: '#10b981',
    bgRgba: 'rgba(16, 185, 129, 0.2)',
    borderClass: 'border-emerald-500/50',
    statusMatch: ['Sent for Distribution', 'Released']
  }
];

// Helper to calculate milestone dates deterministically from canonical start and target dates
function generateDefaultTimelineData(track: Track, index: number): TrackTimelineData {
  // Stagger start dates across late 2026 through early 2027
  const baseEpoch = new Date('2026-10-01').getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  
  // Stagger based on EP:
  let epOffsetDays = 0;
  if (track.ep?.includes('Restoration') || track.ep?.includes('EP 1')) epOffsetDays = 0;
  else if (track.ep?.includes('Wilderness') || track.ep?.includes('EP 2')) epOffsetDays = 28;
  else if (track.ep?.includes('Redemptive') || track.ep?.includes('EP 3')) epOffsetDays = 56;
  else if (track.ep?.includes('Mountaintop') || track.ep?.includes('EP 4')) epOffsetDays = 84;
  else epOffsetDays = 14;

  const trackOffsetDays = (index % 7) * 4;
  const startEpoch = baseEpoch + (epOffsetDays + trackOffsetDays) * dayMs;
  const targetReleaseEpoch = startEpoch + 42 * dayMs; // 6-week target production window

  const toYmd = (ms: number) => new Date(ms).toISOString().split('T')[0];

  const milestones: TrackMilestone[] = [
    {
      id: `${track.id}-m1`,
      name: 'Scripture & Lyric Draft Signed',
      phase: 'lyrics',
      targetDate: toYmd(startEpoch + 7 * dayMs),
      completed: track.status !== 'Idea / Concept',
      notes: 'Nashville Christian music theology verification'
    },
    {
      id: `${track.id}-m2`,
      name: 'Suno v5.5 Master Take Selected',
      phase: 'suno',
      targetDate: toYmd(startEpoch + 14 * dayMs),
      completed: !['Idea / Concept', 'Lyrics Finalized'].includes(track.status),
      notes: `${track.genre} style with ${track.vocal || 'Brandon'} vocal cast`
    },
    {
      id: `${track.id}-m3`,
      name: 'BS-Roformer 4-Stem Isolation',
      phase: 'stems',
      targetDate: toYmd(startEpoch + 23 * dayMs),
      completed: ['Audio Master', 'Sent for Distribution', 'Released'].includes(track.status),
      notes: 'Clean vocal, rhythm drums, sub bass, melodic bed'
    },
    {
      id: `${track.id}-m4`,
      name: 'Senior Mastering at -12 LUFS',
      phase: 'mastering',
      targetDate: toYmd(startEpoch + 32 * dayMs),
      completed: ['Sent for Distribution', 'Released'].includes(track.status),
      notes: 'True Peak <= -1.0 dBTP, warm SSL bus saturation'
    },
    {
      id: `${track.id}-m5`,
      name: 'Nextcloud WebDAV Archive Drop',
      phase: 'release',
      targetDate: toYmd(targetReleaseEpoch),
      completed: track.status === 'Released',
      notes: 'Full multi-track archive bundled and published'
    }
  ];

  return {
    trackId: track.id,
    startDate: toYmd(startEpoch),
    targetReleaseDate: toYmd(targetReleaseEpoch),
    milestones,
    criticalPath: track.id === 'TRK-29' || track.status === 'In Progress' || track.status === 'UVR5 Stem Prep'
  };
}

const TIMELINE_STORAGE_KEY = 'brickos_production_timeline_v1';

export const ProductionTimelineTab: React.FC<ProductionTimelineTabProps> = ({
  tracks,
  selectedTrack,
  onSelectTrack,
  onUpdateTrackStatus,
  onNavigateToTab,
  epCollections = [],
  isDarkMode = true,
  showToast = () => {}
}) => {
  // Timeline storage state
  const [timelineMap, setTimelineMap] = useState<Record<string, TrackTimelineData>>(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(TIMELINE_STORAGE_KEY) : null;
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (_) {}
    // Seed defaults
    const map: Record<string, TrackTimelineData> = {};
    tracks.forEach((t, idx) => {
      map[t.id] = generateDefaultTimelineData(t, idx);
    });
    return map;
  });

  // Persist timeline map
  useEffect(() => {
    try {
      localStorage.setItem(TIMELINE_STORAGE_KEY, JSON.stringify(timelineMap));
    } catch (_) {}
  }, [timelineMap]);

  // View Controls
  const [viewMode, setViewMode] = useState<'weeks' | 'phases' | 'drops'>('weeks');
  const [selectedEpFilter, setSelectedEpFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedVocalFilter, setSelectedVocalFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCriticalPathOnly, setShowCriticalPathOnly] = useState(false);
  const [editingTrackTimeline, setEditingTrackTimeline] = useState<TrackTimelineData | null>(null);

  // Time boundaries (12-week span centered around today)
  const today = new Date().toISOString().split('T')[0];

  const timelineWeeks = useMemo(() => {
    const weeks: Array<{ weekLabel: string; startDate: string; endDate: string; isCurrent: boolean }> = [];
    const baseDate = new Date('2026-10-05T00:00:00Z'); // Monday anchor
    for (let i = 0; i < 16; i++) {
      const startMs = baseDate.getTime() + i * 7 * 24 * 60 * 60 * 1000;
      const endMs = startMs + 6 * 24 * 60 * 60 * 1000;
      const startStr = new Date(startMs).toISOString().split('T')[0];
      const endStr = new Date(endMs).toISOString().split('T')[0];
      const isCurrent = today >= startStr && today <= endStr;
      
      const monthName = new Date(startMs).toLocaleDateString('en-US', { month: 'short' });
      const dayNum = new Date(startMs).getUTCDate();

      weeks.push({
        weekLabel: `W${i + 1} (${monthName} ${dayNum})`,
        startDate: startStr,
        endDate: endStr,
        isCurrent
      });
    }
    return weeks;
  }, [today]);

  // Filtered tracks
  const filteredTracks = useMemo(() => {
    return tracks.filter(t => {
      if (selectedEpFilter !== 'ALL' && t.ep !== selectedEpFilter) return false;
      if (selectedStatusFilter !== 'ALL' && t.status !== selectedStatusFilter) return false;
      if (selectedVocalFilter !== 'ALL' && !(t.vocal || '').toLowerCase().includes(selectedVocalFilter.toLowerCase())) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchId = t.id.toLowerCase().includes(q);
        const matchEp = (t.ep || '').toLowerCase().includes(q);
        if (!matchTitle && !matchId && !matchEp) return false;
      }
      if (showCriticalPathOnly) {
        const data = timelineMap[t.id];
        if (!data?.criticalPath) return false;
      }
      return true;
    });
  }, [tracks, selectedEpFilter, selectedStatusFilter, selectedVocalFilter, searchQuery, showCriticalPathOnly, timelineMap]);

  // Track status phase completion percentage
  const getTrackProgress = (status: TrackStatus): number => {
    switch (status) {
      case 'Idea / Concept': return 15;
      case 'Lyrics Finalized': return 35;
      case 'In Progress': return 50;
      case 'UVR5 Stem Prep': return 70;
      case 'Audio Master': return 88;
      case 'Sent for Distribution': return 95;
      case 'Released': return 100;
      default: return 20;
    }
  };

  // Calculate position on timeline bar
  const minDateEpoch = new Date('2026-10-05T00:00:00Z').getTime();
  const maxDateEpoch = new Date('2027-01-26T00:00:00Z').getTime();
  const totalDuration = maxDateEpoch - minDateEpoch;

  const getPercentOffset = (dateStr: string): number => {
    const epoch = new Date(`${dateStr}T00:00:00Z`).getTime();
    if (isNaN(epoch)) return 0;
    const clamped = Math.max(minDateEpoch, Math.min(maxDateEpoch, epoch));
    return ((clamped - minDateEpoch) / totalDuration) * 100;
  };

  // Milestone checkpoint toggle
  const handleToggleMilestone = (trackId: string, milestoneId: string) => {
    setTimelineMap(prev => {
      const current = prev[trackId] || generateDefaultTimelineData(tracks.find(t => t.id === trackId)!, 0);
      const updatedMilestones = current.milestones.map(m =>
        m.id === milestoneId ? { ...m, completed: !m.completed } : m
      );
      showToast(`Milestone status updated for ${trackId}`, 'success');
      return {
        ...prev,
        [trackId]: {
          ...current,
          milestones: updatedMilestones
        }
      };
    });
  };

  // Save edited timeline dates
  const handleSaveTimelineEdit = (updated: TrackTimelineData) => {
    setTimelineMap(prev => ({
      ...prev,
      [updated.trackId]: updated
    }));
    setEditingTrackTimeline(null);
    showToast(`Updated timeline & deadlines for ${updated.trackId}`, 'success');
  };

  // Export full Gantt Roadmap manifest
  const handleExportTimelineRoadmap = () => {
    const manifest = {
      exportVersion: 'brickos-gantt-timeline-v1.0',
      exportedAt: new Date().toISOString(),
      today,
      totalTracks: tracks.length,
      tracks: tracks.map(t => ({
        id: t.id,
        title: t.title,
        ep: t.ep,
        status: t.status,
        bpm: t.bpm,
        key: t.key,
        vocal: t.vocal,
        timeline: timelineMap[t.id] || generateDefaultTimelineData(t, 0)
      }))
    };

    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brickOS_Production_Timeline_Roadmap_${today}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Exported complete Production Timeline Roadmap JSON', 'success');
  };

  // Statistics
  const stats = useMemo(() => {
    let completed = 0;
    let inProgress = 0;
    let mastering = 0;
    let criticalCount = 0;

    tracks.forEach(t => {
      if (t.status === 'Released') completed++;
      else if (t.status === 'Audio Master' || t.status === 'Sent for Distribution') mastering++;
      else inProgress++;

      if (timelineMap[t.id]?.criticalPath) criticalCount++;
    });

    return { completed, inProgress, mastering, criticalCount, total: tracks.length };
  }, [tracks, timelineMap]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. TOP HEADER & HUD SUMMARY */}
      <div className={`p-5 rounded-2xl border transition-all ${
        isDarkMode
          ? 'bg-slate-900/90 border-slate-800 text-white shadow-xl'
          : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                <CalendarDays className="w-5 h-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-wider flex items-center gap-2">
                <span>Production Timeline & Milestone Gantt</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  v4.7
                </span>
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl font-sans">
              Chronological 5-Phase Nashville SOP roadmap visualizing lyric conception, Suno audio synthesis, BS-Roformer stem prep, -12 LUFS mastering, and Nextcloud releases.
            </p>
          </div>

          {/* Quick HUD Metrics (Zero-Pill Typography) */}
          <div className="flex items-center gap-4 flex-wrap text-xs font-mono">
            <div className="flex flex-col border-l border-slate-700/60 pl-3">
              <span className="text-[10px] uppercase text-slate-400">In Production</span>
              <span className="text-sm font-black text-amber-400">{stats.inProgress} Tracks</span>
            </div>
            <div className="flex flex-col border-l border-slate-700/60 pl-3">
              <span className="text-[10px] uppercase text-slate-400">Mastering/Ready</span>
              <span className="text-sm font-black text-cyan-400">{stats.mastering} Tracks</span>
            </div>
            <div className="flex flex-col border-l border-slate-700/60 pl-3">
              <span className="text-[10px] uppercase text-slate-400">Released</span>
              <span className="text-sm font-black text-emerald-400">{stats.completed} Tracks</span>
            </div>
            <div className="flex flex-col border-l border-slate-700/60 pl-3">
              <span className="text-[10px] uppercase text-slate-400">Critical Path</span>
              <span className="text-sm font-black text-purple-400">{stats.criticalCount} Priority</span>
            </div>
            
            <button
              onClick={handleExportTimelineRoadmap}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold font-mono text-slate-200 hover:text-white flex items-center gap-1.5 transition cursor-pointer shadow-xs ml-auto"
              title="Download Full Production Gantt Roadmap JSON"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export Roadmap</span>
            </button>
          </div>
        </div>

        {/* 2. FILTER & VIEW SELECTOR TOOLBAR */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left: View Mode Segmented Controls */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('weeks')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'weeks'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Weekly Gantt</span>
            </button>
            <button
              onClick={() => setViewMode('phases')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'phases'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>5-Phase SOP</span>
            </button>
            <button
              onClick={() => setViewMode('drops')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'drops'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>EP Drop Radar</span>
            </button>
          </div>

          {/* Right: Dropdowns & Search */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tracks or EPs..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44 sm:w-56"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* EP Filter */}
            <select
              value={selectedEpFilter}
              onChange={(e) => setSelectedEpFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">All EP Collections</option>
              <option value="EP 1: Restoration">EP 1: Restoration</option>
              <option value="EP 2: Wilderness">EP 2: Wilderness</option>
              <option value="EP 3: Redemptive Fire">EP 3: Redemptive Fire</option>
              <option value="EP 4: Mountaintop">EP 4: Mountaintop</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="Idea / Concept">Idea / Concept</option>
              <option value="Lyrics Finalized">Lyrics Finalized</option>
              <option value="In Progress">In Progress</option>
              <option value="UVR5 Stem Prep">UVR5 Stem Prep</option>
              <option value="Audio Master">Audio Master</option>
              <option value="Sent for Distribution">Distribution Ready</option>
              <option value="Released">Released</option>
            </select>

            {/* Critical Path Toggle */}
            <button
              onClick={() => setShowCriticalPathOnly(prev => !prev)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition cursor-pointer ${
                showCriticalPathOnly
                  ? 'bg-purple-900/60 border-purple-500 text-purple-200 shadow-xs'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Show Critical Path Tracks (On Active Release Horizon)"
            >
              <Flame className="w-3.5 h-3.5 text-purple-400" />
              <span>Critical Path</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. MAIN GANTT CHART VIEW */}
      <div className={`rounded-2xl border overflow-hidden transition-all ${
        isDarkMode
          ? 'bg-slate-900/95 border-slate-800 text-white shadow-2xl'
          : 'bg-white border-slate-200 text-slate-900 shadow-md'
      }`}>
        {/* Phase Legend Header */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between flex-wrap gap-3 text-xs font-mono">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nashville 5-Phase SOP:</span>
            {SOP_PHASES.map(phase => (
              <div key={phase.id} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: phase.color }} />
                <span className="text-[11px] text-slate-300">{phase.shortLabel}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>Red Line: Today ({today})</span>
          </div>
        </div>

        {/* Scrollable Gantt Grid */}
        <div className="overflow-x-auto relative">
          <div className="min-w-[1050px]">
            {/* Timeline Header Row (Weeks) */}
            <div className="grid grid-cols-[280px_1fr] border-b border-slate-800 bg-slate-950 sticky top-0 z-20">
              <div className="px-4 py-3 text-xs font-mono font-bold text-slate-400 uppercase tracking-wider border-r border-slate-800 flex items-center justify-between">
                <span>Track & EP / Artist</span>
                <span className="text-[10px] text-slate-500">({filteredTracks.length})</span>
              </div>

              {/* Weeks Header Columns */}
              <div className="grid grid-cols-16 divide-x divide-slate-800/80 text-[10px] font-mono font-semibold">
                {timelineWeeks.map((wk, i) => (
                  <div
                    key={i}
                    className={`px-1 py-2.5 text-center flex flex-col justify-center transition-colors ${
                      wk.isCurrent
                        ? 'bg-indigo-950/50 text-indigo-300 font-bold border-b-2 border-indigo-500'
                        : 'text-slate-400 hover:bg-slate-900/60'
                    }`}
                  >
                    <span>{wk.weekLabel.split(' ')[0]}</span>
                    <span className="text-[9px] opacity-70">{wk.weekLabel.split(' ')[1] || ''}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Track Rows */}
            <div className="divide-y divide-slate-800/60">
              {filteredTracks.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-80" />
                  <p className="text-sm font-semibold">No tracks match current filters.</p>
                  <p className="text-xs text-slate-500 mt-1">Try resetting the EP collection, status, or search query.</p>
                </div>
              ) : (
                filteredTracks.map((trk, rowIdx) => {
                  const data = timelineMap[trk.id] || generateDefaultTimelineData(trk, rowIdx);
                  const progressPct = getTrackProgress(trk.status);
                  const isSelected = selectedTrack.id === trk.id;

                  const startPct = getPercentOffset(data.startDate);
                  const endPct = getPercentOffset(data.targetReleaseDate);
                  const widthPct = Math.max(8, endPct - startPct);

                  return (
                    <div
                      key={trk.id}
                      className={`grid grid-cols-[280px_1fr] transition-colors group ${
                        isSelected
                          ? 'bg-indigo-950/20'
                          : rowIdx % 2 === 0
                          ? 'bg-transparent'
                          : 'bg-slate-950/30'
                      } hover:bg-slate-800/30`}
                    >
                      {/* Left: Track Information & Quick Jump */}
                      <div className="px-4 py-3.5 border-r border-slate-800 flex items-center justify-between gap-2 overflow-hidden">
                        <div
                          onClick={() => onSelectTrack(trk)}
                          className="min-w-0 cursor-pointer group-hover:text-indigo-300 transition"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black font-mono text-indigo-400">{trk.id}</span>
                            <span className="text-xs font-bold text-slate-200 truncate" title={trk.title}>
                              {trk.title}
                            </span>
                            {data.criticalPath && (
                              <span title="Critical Path Focus Track">
                                <Flame className="w-3 h-3 text-purple-400 shrink-0" />
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                            <span>{trk.ep || 'EP 1'}</span>
                            <span>·</span>
                            <span>{trk.bpm} BPM</span>
                            <span>·</span>
                            <span className="text-indigo-400">{trk.vocal || 'Brandon'}</span>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex items-center gap-1 shrink-0 opacity-70 group-hover:opacity-100 transition">
                          <button
                            onClick={() => {
                              onSelectTrack(trk);
                              onNavigateToTab('lyrics');
                            }}
                            className="p-1 rounded-md bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition cursor-pointer"
                            title="Open in Lyric Studio"
                          >
                            <Music className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => {
                              onSelectTrack(trk);
                              onNavigateToTab('mixer');
                            }}
                            className="p-1 rounded-md bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white transition cursor-pointer"
                            title="Open in Mini-DAW Console"
                          >
                            <Sliders className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setEditingTrackTimeline(data)}
                            className="p-1 rounded-md bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white transition cursor-pointer"
                            title="Edit Deadlines & Milestones"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Right: Gantt Phase Bar & Milestone Nodes */}
                      <div className="relative py-2.5 px-2 flex items-center min-h-[58px]">
                        {/* Vertical Grid Lines (16 weeks) */}
                        <div className="absolute inset-0 grid grid-cols-16 pointer-events-none divide-x divide-slate-800/30">
                          {Array.from({ length: 16 }).map((_, cIdx) => (
                            <div key={cIdx} className="h-full" />
                          ))}
                        </div>

                        {/* TODAY Vertical Marker Indicator */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-rose-500/80 z-10 pointer-events-none"
                          style={{ left: `${getPercentOffset(today)}%` }}
                        />

                        {/* Horizontal Multi-Phase Gantt Bar */}
                        <div
                          className="relative h-7 rounded-md overflow-hidden flex items-center shadow-md border border-slate-700/60 z-0 group/bar transition-all hover:ring-2 hover:ring-indigo-500/40"
                          style={{
                            left: `${startPct}%`,
                            width: `${widthPct}%`
                          }}
                        >
                          {/* Segmented Phase Fill: Lyrics, Suno, Stems, Mastering, Release */}
                          <div className="h-full flex w-full relative">
                            {/* Phase 1: Lyrics (20%) */}
                            <div
                              className="h-full bg-amber-500/80 flex items-center justify-center text-[9px] font-mono font-bold text-slate-950 px-1 border-r border-slate-900/40"
                              style={{ width: '20%' }}
                              title="P1: Lyric Conception & Theology"
                            >
                              <span className="truncate">Lyrics</span>
                            </div>

                            {/* Phase 2: Suno Audio Synthesis (25%) */}
                            <div
                              className="h-full bg-indigo-500/80 flex items-center justify-center text-[9px] font-mono font-bold text-white px-1 border-r border-slate-900/40"
                              style={{ width: '25%' }}
                              title="P2: Suno v5.5 Generation"
                            >
                              <span className="truncate">Suno</span>
                            </div>

                            {/* Phase 3: UVR5 Stems (20%) */}
                            <div
                              className="h-full bg-purple-500/80 flex items-center justify-center text-[9px] font-mono font-bold text-white px-1 border-r border-slate-900/40"
                              style={{ width: '20%' }}
                              title="P3: UVR5 Stem Prep"
                            >
                              <span className="truncate">Stems</span>
                            </div>

                            {/* Phase 4: Mastering (20%) */}
                            <div
                              className="h-full bg-cyan-500/80 flex items-center justify-center text-[9px] font-mono font-bold text-slate-950 px-1 border-r border-slate-900/40"
                              style={{ width: '20%' }}
                              title="P4: Master -12 LUFS"
                            >
                              <span className="truncate">Master</span>
                            </div>

                            {/* Phase 5: Release (15%) */}
                            <div
                              className="h-full bg-emerald-500/80 flex items-center justify-center text-[9px] font-mono font-bold text-slate-950 px-1"
                              style={{ width: '15%' }}
                              title="P5: Distribution Release"
                            >
                              <span className="truncate">Drop</span>
                            </div>

                            {/* Actual Track Completion Shading Overlay */}
                            <div
                              className="absolute top-0 bottom-0 left-0 bg-white/20 pointer-events-none border-r-2 border-white"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>

                          {/* Hover Overlay Label */}
                          <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover/bar:opacity-100 flex items-center justify-between px-2 text-[10px] font-mono font-bold text-white transition-opacity backdrop-blur-xs">
                            <span>{trk.status} ({progressPct}%)</span>
                            <span className="text-amber-400">Target: {data.targetReleaseDate}</span>
                          </div>
                        </div>

                        {/* Milestone Nodes Floating Along Timeline */}
                        {data.milestones.map((ms) => {
                          const msOffset = getPercentOffset(ms.targetDate);
                          return (
                            <button
                              key={ms.id}
                              type="button"
                              onClick={() => handleToggleMilestone(trk.id, ms.id)}
                              className={`absolute -top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center z-10 transition-transform hover:scale-125 cursor-pointer shadow-sm ${
                                ms.completed
                                  ? 'bg-emerald-500 border-white text-slate-950'
                                  : 'bg-slate-900 border-amber-400 text-amber-400'
                              }`}
                              style={{ left: `${msOffset}%` }}
                              title={`${ms.name} (${ms.targetDate}) - ${ms.completed ? 'Completed' : 'Pending (Click to toggle)'}`}
                            >
                              {ms.completed ? (
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. UPCOMING MILESTONES & CRITICAL DEADLINES RADAR */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Critical Path Deliverables */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-black uppercase font-mono tracking-wider text-purple-300">
                Critical Path Focus
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Tracks prioritized for immediate Nashville master packaging and Suno release sync.
            </p>
            <div className="space-y-2">
              {tracks.filter(t => timelineMap[t.id]?.criticalPath).slice(0, 3).map(t => (
                <div
                  key={t.id}
                  onClick={() => onSelectTrack(t)}
                  className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-purple-500/40 flex items-center justify-between cursor-pointer transition text-xs"
                >
                  <div className="truncate">
                    <span className="font-mono text-purple-400 font-bold mr-1.5">{t.id}</span>
                    <span className="font-semibold text-slate-200">{t.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 shrink-0 ml-2">
                    {timelineMap[t.id]?.targetReleaseDate || '2026-11-20'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              setSelectedStatusFilter('In Progress');
              setShowCriticalPathOnly(true);
            }}
            className="mt-4 text-xs font-bold font-mono text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
          >
            <span>View All Critical Tracks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 2: Nextcloud WebDAV Archive Status */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-black uppercase font-mono tracking-wider text-emerald-300">
                Primary Archive Sync
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Direct WebDAV persistence with automated read-after-write ETag verification.
            </p>
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1 text-xs font-mono">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Target Folder:</span>
                <span className="text-slate-200">/Music-Production</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Tailscale Latency:</span>
                <span className="text-emerald-400 font-bold">14ms Direct</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Write Verification:</span>
                <span className="text-emerald-400 font-bold">PROPFIND Depth 0</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab('nextcloud_sync')}
            className="mt-4 text-xs font-bold font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
          >
            <span>Open Nextcloud File Explorer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 3: Senior Mastering -12 LUFS Gateway */}
        <div className={`p-4 rounded-xl border flex flex-col justify-between ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-black uppercase font-mono tracking-wider text-cyan-300">
                Loudness & Compliance Gate
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Standard broadcast mastering specifications across Spotify, Apple Music & YouTube.
            </p>
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1 text-xs font-mono">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Integrated Target:</span>
                <span className="text-cyan-400 font-bold">-12.0 LUFS</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>True Peak Ceiling:</span>
                <span className="text-cyan-400 font-bold">-1.0 dBTP</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Sample Rate:</span>
                <span className="text-slate-200">24-bit / 48 kHz</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab('mastering')}
            className="mt-4 text-xs font-bold font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
          >
            <span>Open Mastering Suite</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 5. MODAL: EDIT TRACK TIMELINE & MILESTONES */}
      {editingTrackTimeline && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-black">
                  Edit Timeline: {editingTrackTimeline.trackId}
                </h3>
              </div>
              <button
                onClick={() => setEditingTrackTimeline(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    Production Start Date
                  </label>
                  <input
                    type="date"
                    value={editingTrackTimeline.startDate}
                    onChange={(e) => setEditingTrackTimeline({
                      ...editingTrackTimeline,
                      startDate: e.target.value
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                    Target Release Date
                  </label>
                  <input
                    type="date"
                    value={editingTrackTimeline.targetReleaseDate}
                    onChange={(e) => setEditingTrackTimeline({
                      ...editingTrackTimeline,
                      targetReleaseDate: e.target.value
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Critical Path Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/50">
                <input
                  type="checkbox"
                  checked={!!editingTrackTimeline.criticalPath}
                  onChange={(e) => setEditingTrackTimeline({
                    ...editingTrackTimeline,
                    criticalPath: e.target.checked
                  })}
                  className="rounded text-purple-600 focus:ring-0"
                />
                <span className="font-bold text-purple-300">Mark as Critical Path Focus Track</span>
              </label>

              {/* Milestones Checklist */}
              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase mb-2">
                  Nashville SOP Milestone Checkpoints
                </label>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {editingTrackTimeline.milestones.map((ms, idx) => (
                    <div
                      key={ms.id}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={ms.completed}
                          onChange={(e) => {
                            const updated = [...editingTrackTimeline.milestones];
                            updated[idx] = { ...ms, completed: e.target.checked };
                            setEditingTrackTimeline({
                              ...editingTrackTimeline,
                              milestones: updated
                            });
                          }}
                          className="rounded text-indigo-600"
                        />
                        <div className="truncate">
                          <span className="font-bold text-slate-200 block truncate">{ms.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{ms.notes || ms.phase}</span>
                        </div>
                      </div>

                      <input
                        type="date"
                        value={ms.targetDate}
                        onChange={(e) => {
                          const updated = [...editingTrackTimeline.milestones];
                          updated[idx] = { ...ms, targetDate: e.target.value };
                          setEditingTrackTimeline({
                            ...editingTrackTimeline,
                            milestones: updated
                          });
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[11px] font-mono text-slate-300 shrink-0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-800 flex justify-end gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setEditingTrackTimeline(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveTimelineEdit(editingTrackTimeline)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer"
              >
                Save Timeline Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
