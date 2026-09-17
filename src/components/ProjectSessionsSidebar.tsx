import React, { useState } from 'react';
import {
  FolderPlus,
  Save,
  Clock,
  Pin,
  PinOff,
  Trash2,
  Copy,
  GitFork,
  Search,
  CheckCircle,
  Sliders,
  Music,
  Disc,
  X,
  RefreshCw,
  Database,
  Sparkles,
  Tag,
  Eye,
  Calendar,
  Layers,
  ChevronRight,
  ArrowRight,
  FileText
} from 'lucide-react';
import { Track, CompositionSession, CompositionSessionSnapshot } from '../types';

interface ProjectSessionsSidebarProps {
  sessions: CompositionSession[];
  activeSessionId: string | null;
  selectedTrack: Track;
  activeTab: string;
  isDbSyncing?: boolean;
  onSelectSession: (session: CompositionSession) => void;
  onSaveCurrentSession: (name: string, description: string, tags: string[], isPinned: boolean) => Promise<void>;
  onUpdateSessionSnapshot: (sessionId: string) => Promise<void>;
  onDuplicateSession: (session: CompositionSession) => Promise<void>;
  onDeleteSession: (sessionId: string) => Promise<void>;
  onTogglePinSession: (session: CompositionSession) => Promise<void>;
  onClose?: () => void;
  onSwitchToCatalogTab?: () => void;
  catalogTracksCount: number;
}

const COMMON_TAGS = [
  'Lyrics Polish',
  'Suno v5.5 Pass',
  'Theology Audit',
  'Vocal Casting',
  'Acoustic Alternate',
  'War Room',
  'Stem Prep',
  'Selah Prayed'
];

export const ProjectSessionsSidebar: React.FC<ProjectSessionsSidebarProps> = ({
  sessions,
  activeSessionId,
  selectedTrack,
  activeTab,
  isDbSyncing = false,
  onSelectSession,
  onSaveCurrentSession,
  onUpdateSessionSnapshot,
  onDuplicateSession,
  onDeleteSession,
  onTogglePinSession,
  onClose,
  onSwitchToCatalogTab,
  catalogTracksCount
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'pinned' | 'current_track'>('all');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // New session form fields
  const [newSessionName, setNewSessionName] = useState('');
  const [newSessionDesc, setNewSessionDesc] = useState('');
  const [newSessionTags, setNewSessionTags] = useState<string[]>(['Lyrics Polish']);
  const [newSessionPinned, setNewSessionPinned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Inspection preview modal/drawer
  const [inspectingSession, setInspectingSession] = useState<CompositionSession | null>(null);

  // Active session object
  const currentActiveSession = sessions.find((s) => s.id === activeSessionId);

  // Open save dialog pre-filled with track title
  const handleOpenCreateForm = () => {
    const defaultName = `${selectedTrack.title} — Session #${sessions.filter(s => s.trackId === selectedTrack.id).length + 1}`;
    setNewSessionName(defaultName);
    setNewSessionDesc(`Composition session for ${selectedTrack.title} (${selectedTrack.id}) in ${selectedTrack.ep}.`);
    setNewSessionTags([selectedTrack.genre.split('/')[0]?.trim() || 'Worship', 'Suno v5.5 Pass']);
    setNewSessionPinned(false);
    setIsCreatingNew(true);
  };

  const handleToggleTag = (tag: string) => {
    if (newSessionTags.includes(tag)) {
      setNewSessionTags(prev => prev.filter(t => t !== tag));
    } else {
      setNewSessionTags(prev => [...prev, tag]);
    }
  };

  const handleSubmitNewSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;
    try {
      setIsSaving(true);
      await onSaveCurrentSession(
        newSessionName.trim(),
        newSessionDesc.trim(),
        newSessionTags,
        newSessionPinned
      );
      setIsCreatingNew(false);
    } catch (err) {
      console.error('Failed to save session:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter sessions
  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.trackTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.trackId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ep.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.tags && s.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

    if (!matchesSearch) return false;

    if (filterMode === 'pinned') return !!s.isPinned;
    if (filterMode === 'current_track') return s.trackId === selectedTrack.id;

    return true;
  });

  return (
    <aside className="w-88 sm:w-96 bg-slate-900 border-r border-slate-800 flex flex-col h-full overflow-hidden flex-shrink-0 z-30 shadow-2xl">
      
      {/* SIDEBAR HEADER */}
      <div className="p-4 pb-3 border-b border-slate-800 space-y-3 bg-slate-900/95 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-950">
              <Layers className="w-4 h-4 text-indigo-200" />
            </div>
            <div>
              <span className="text-xs font-black text-white uppercase tracking-wider block">
                Project Manager
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {sessions.length} Composition Sessions
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onSwitchToCatalogTab && (
              <button
                type="button"
                onClick={onSwitchToCatalogTab}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-[11px] font-bold border border-slate-700 flex items-center gap-1 transition cursor-pointer"
                title="Switch to Track Catalog Roster"
              >
                <Disc className="w-3 h-3 text-indigo-400" />
                <span>Roster ({catalogTracksCount})</span>
              </button>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Close Project Sessions Sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ACTIVE SESSION STATUS BANNER */}
        {currentActiveSession ? (
          <div className="bg-indigo-950/60 border border-indigo-500/40 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-inner">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[10px] uppercase font-bold text-indigo-300 font-mono tracking-wider">
                  Active Session
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-900/80 text-indigo-200 font-mono font-bold">
                  {currentActiveSession.trackId}
                </span>
              </div>
              <p className="text-xs font-bold text-white truncate mt-0.5" title={currentActiveSession.name}>
                {currentActiveSession.name}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onUpdateSessionSnapshot(currentActiveSession.id)}
              disabled={isDbSyncing}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1 transition shadow-sm cursor-pointer disabled:opacity-50 whitespace-nowrap"
              title="Overwrite snapshot with current lyrics & slider state"
            >
              <RefreshCw className={`w-3 h-3 ${isDbSyncing ? 'animate-spin' : ''}`} />
              <span>Update</span>
            </button>
          </div>
        ) : (
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Working on: <strong className="text-slate-200 font-bold">{selectedTrack.id}: {selectedTrack.title}</strong></span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">Unsaved Session</span>
          </div>
        )}

        {/* SAVE CURRENT SESSION BUTTON */}
        {!isCreatingNew ? (
          <button
            type="button"
            onClick={handleOpenCreateForm}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition border border-emerald-400/30 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>+ Save Current Track Session</span>
          </button>
        ) : (
          <div className="bg-slate-950 border border-emerald-500/50 rounded-xl p-3.5 space-y-3 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <FolderPlus className="w-3.5 h-3.5" />
                Snapshot Composition Session
              </span>
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewSession} className="space-y-2.5">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Session Name / Intent
                </label>
                <input
                  type="text"
                  required
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="e.g. Late Night Acoustic Rewrite..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Notes & Production Intent
                </label>
                <textarea
                  rows={2}
                  value={newSessionDesc}
                  onChange={(e) => setNewSessionDesc(e.target.value)}
                  placeholder="Summary of vocal changes, slider values, or theological fixes..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Workflow Tags
                </label>
                <div className="flex flex-wrap gap-1">
                  {COMMON_TAGS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleToggleTag(t)}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition ${
                        newSessionTags.includes(t)
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newSessionPinned}
                    onChange={(e) => setNewSessionPinned(e.target.checked)}
                    className="rounded border-slate-700 text-emerald-600 focus:ring-0"
                  />
                  <Pin className="w-3 h-3 text-amber-400" />
                  <span className="text-[11px]">Pin to Top</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingNew(false)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-3.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-950 transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
                  >
                    {isSaving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    <span>Save Session</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* SEARCH & FILTERS */}
        <div className="space-y-2 pt-1">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search sessions by name, track, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-bold overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                filterMode === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({sessions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('pinned')}
              className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
                filterMode === 'pinned'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Pin className="w-2.5 h-2.5" />
              <span>Pinned ({sessions.filter(s => s.isPinned).length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('current_track')}
              className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
                filterMode === 'current_track'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{selectedTrack.id} Only</span>
            </button>
          </div>
        </div>
      </div>

      {/* SESSIONS LIST */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
        {filteredSessions.map((session) => {
          const isActive = session.id === activeSessionId;
          const isCurrentTrack = session.trackId === selectedTrack.id;

          return (
            <div
              key={session.id}
              className={`p-3.5 rounded-xl border transition flex flex-col gap-2 relative group text-left ${
                isActive
                  ? 'bg-indigo-950/60 border-indigo-500 ring-1 ring-indigo-500/40 shadow-xl shadow-indigo-950/60'
                  : 'bg-slate-900/90 border-slate-800/90 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              {/* Card Top Row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono font-black text-xs text-indigo-400">
                    {session.trackId}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[120px]" title={session.trackTitle}>
                    {session.trackTitle}
                  </span>
                  {isActive && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono text-[9px] font-bold border border-emerald-800/50 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      ACTIVE
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePinSession(session);
                    }}
                    className={`p-1 rounded transition ${
                      session.isPinned
                        ? 'text-amber-400 hover:text-amber-300'
                        : 'text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100'
                    }`}
                    title={session.isPinned ? 'Unpin Session' : 'Pin Session to Top'}
                  >
                    {session.isPinned ? <Pin className="w-3.5 h-3.5 fill-amber-400/30" /> : <PinOff className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateSession(session);
                    }}
                    className="p-1 rounded text-slate-500 hover:text-purple-300 opacity-0 group-hover:opacity-100 transition"
                    title="Fork / Duplicate Session"
                  >
                    <GitFork className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete composition session "${session.name}"?`)) {
                        onDeleteSession(session.id);
                      }
                    }}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition"
                    title="Delete Session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Session Name & Description */}
              <div 
                onClick={() => onSelectSession(session)}
                className="cursor-pointer space-y-1"
              >
                <h4 className="text-sm font-bold text-white group-hover:text-indigo-200 transition line-clamp-2 leading-snug">
                  {session.name}
                </h4>
                {session.description && (
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {session.description}
                  </p>
                )}
              </div>

              {/* Sonic Snapshot Specs */}
              <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px] font-mono text-slate-300">
                <div className="bg-slate-950/70 px-2 py-1 rounded border border-slate-800/80">
                  <span className="text-slate-500 block text-[8px] uppercase">Tempo & Key</span>
                  <span className="font-semibold text-indigo-300">{session.snapshot.bpm} BPM • {session.snapshot.key}</span>
                </div>
                <div className="bg-slate-950/70 px-2 py-1 rounded border border-slate-800/80">
                  <span className="text-slate-500 block text-[8px] uppercase">Sliders</span>
                  <span className="font-semibold text-amber-300">W:{session.snapshot.engineSliders.weirdness} S:{session.snapshot.engineSliders.styleInfluence}</span>
                </div>
                <div className="bg-slate-950/70 px-2 py-1 rounded border border-slate-800/80">
                  <span className="text-slate-500 block text-[8px] uppercase">Status</span>
                  <span className="font-semibold text-emerald-300 truncate block">{session.snapshot.status}</span>
                </div>
              </div>

              {/* Tags & Action Bar */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
                <div className="flex items-center gap-1 flex-wrap overflow-hidden max-w-[200px]">
                  {session.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 font-semibold"
                    >
                      {tag}
                    </span>
                  ))}
                  {session.tags.length > 3 && (
                    <span className="text-slate-500">+{session.tags.length - 3}</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setInspectingSession(session);
                    }}
                    className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition"
                    title="Inspect Lyrics & Prompts"
                  >
                    <Eye className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectSession(session)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300'
                    }`}
                  >
                    <span>{isActive ? 'Current' : 'Switch'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredSessions.length === 0 && (
          <div className="p-8 text-center space-y-2 text-slate-500">
            <Layers className="w-8 h-8 mx-auto text-slate-600 opacity-50" />
            <p className="text-xs font-semibold">No composition sessions found.</p>
            <p className="text-[11px] text-slate-600">
              Click "+ Save Current Track Session" above to snapshot your active lyrics, prompts, and slider setup.
            </p>
          </div>
        )}
      </div>

      {/* SIDEBAR FOOTER WITH CLOUD STATS */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/80 text-[11px] flex items-center justify-between text-slate-400">
        <div className="flex items-center gap-1.5">
          <Database className={`w-3.5 h-3.5 ${isDbSyncing ? 'text-amber-400 animate-spin' : 'text-cyan-400'}`} />
          <span className="font-mono text-[10px]">Firestore Synced</span>
        </div>
        <span className="font-mono text-[10px] text-slate-500">
          {sessions.length} sessions stored
        </span>
      </div>

      {/* INSPECT SESSION MODAL / OVERLAY */}
      {inspectingSession && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-900 text-indigo-300 font-mono text-xs font-bold">
                    {inspectingSession.trackId}
                  </span>
                  <h3 className="text-base font-bold text-white">{inspectingSession.name}</h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{inspectingSession.trackTitle} • {inspectingSession.ep}</p>
              </div>
              <button
                type="button"
                onClick={() => setInspectingSession(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {inspectingSession.description && (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300">
                  <strong className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Session Intent:</strong>
                  {inspectingSession.description}
                </div>
              )}

              <div>
                <strong className="text-slate-400 block text-[10px] uppercase font-bold mb-1.5">Suno v5.5 Style Prompt:</strong>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-indigo-300">
                  {inspectingSession.snapshot.sunoPrompt || 'No prompt specified'}
                </div>
              </div>

              <div>
                <strong className="text-slate-400 block text-[10px] uppercase font-bold mb-1.5">Lyrics Snapshot:</strong>
                <pre className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 max-h-60 overflow-y-auto whitespace-pre-wrap">
                  {inspectingSession.snapshot.lyrics}
                </pre>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[9px] block">TEMPO</span>
                  <span className="font-bold text-white">{inspectingSession.snapshot.bpm} BPM</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[9px] block">KEY</span>
                  <span className="font-bold text-white">{inspectingSession.snapshot.key}</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[9px] block">WEIRDNESS</span>
                  <span className="font-bold text-amber-400">{inspectingSession.snapshot.engineSliders.weirdness}%</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-500 text-[9px] block">STYLE INFLUENCE</span>
                  <span className="font-bold text-amber-400">{inspectingSession.snapshot.engineSliders.styleInfluence}%</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between">
              <span className="text-slate-500 font-mono text-[10px]">
                Created: {new Date(inspectingSession.createdAt).toLocaleDateString()}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInspectingSession(null)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectSession(inspectingSession);
                    setInspectingSession(null);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-950 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Load This Session</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </aside>
  );
};
