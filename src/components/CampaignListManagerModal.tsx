import React, { useState, useEffect } from 'react';
import { X, Search, RotateCcw, Save, CheckCircle2, AlertTriangle, Pin, Archive } from 'lucide-react';
import { Track } from '../types';
import {
  MatrixTrackPreference,
  MatrixActiveOverride,
  MatrixNeedsActionOverride
} from '../types/mcpStatus';

export interface MatrixRowSummary {
  track: Track;
  autoActive: boolean;
  autoHasIssue: boolean;
  effectiveActive: boolean;
  effectiveNeedsAction: boolean;
  pref?: MatrixTrackPreference;
}

interface CampaignListManagerModalProps {
  isOpen: boolean;
  rows: MatrixRowSummary[];
  isDarkMode: boolean;
  onClose: () => void;
  onSaved: (preferences: MatrixTrackPreference[]) => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const CampaignListManagerModal: React.FC<CampaignListManagerModalProps> = ({
  isOpen,
  rows,
  isDarkMode,
  onClose,
  onSaved,
  onNotify
}) => {
  const [search, setSearch] = useState('');
  const [drafts, setDrafts] = useState<
    Record<
      string,
      {
        activeOverride: MatrixActiveOverride;
        needsActionOverride: MatrixNeedsActionOverride;
        actionNote: string;
      }
    >
  >({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const next: Record<string, any> = {};
    for (const r of rows) {
      next[r.track.id] = {
        activeOverride: r.pref?.activeOverride || 'auto',
        needsActionOverride: r.pref?.needsActionOverride || 'auto',
        actionNote: r.pref?.actionNote || ''
      };
    }
    setDrafts(next);
    setSearch('');
  }, [isOpen, rows.length]);

  if (!isOpen) return null;

  const filtered = rows.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      String(r.track.title || '').toLowerCase().includes(q) ||
      String(r.track.id || '').toLowerCase().includes(q) ||
      String(r.track.ep || '').toLowerCase().includes(q)
    );
  });

  const handleSaveBulk = async (resetAll = false) => {
    setIsSaving(true);
    try {
      const updates = Object.entries(drafts).map(([trackId, val]) => ({
        trackId,
        activeOverride: val.activeOverride,
        needsActionOverride: val.needsActionOverride,
        actionNote: val.actionNote
      }));

      const res = await fetch('/api/studio/matrix/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resetAll ? { resetAllToAuto: true } : { updates })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || 'Failed saving campaign list assignments');
      }
      onSaved(data.matrixPreferences || []);
      onNotify(
        resetAll
          ? 'Reset all tracks back to automatic MCP detection.'
          : 'Saved Active Campaigns & Needs Action list overrides.',
        'success'
      );
      onClose();
    } catch (err: any) {
      onNotify(err?.message || 'Error updating lists', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const modalBg = isDarkMode
    ? 'bg-slate-900 border-slate-700 text-slate-100'
    : 'bg-white border-slate-200 text-slate-900';
  const inputBg = isDarkMode
    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400';
  const mutedText = isDarkMode ? 'text-slate-400' : 'text-slate-600';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="campaign-list-modal-title"
    >
      <div className={`w-full max-w-4xl rounded-2xl border shadow-2xl overflow-hidden my-auto ${modalBg}`}>
        <div className={`px-5 py-4 border-b flex items-center justify-between gap-4 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          <div>
            <h2 id="campaign-list-modal-title" className="text-base sm:text-lg font-bold">
              Manage Active Campaigns &amp; Needs Action Lists
            </h2>
            <p className={`text-xs mt-0.5 ${mutedText}`}>
              By default (&quot;Auto&quot;), songs with Ready Shorts, live YT uploads, Meta Muse reports, or non-empty outlets appear in Active Campaigns, and songs with &quot;Needs Correction&quot; or &quot;Vetoed&quot; appear in Needs Action. Pin, archive, or flag any song here.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className={`min-w-[38px] min-h-[38px] rounded-lg flex items-center justify-center cursor-pointer ${
              isDarkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-800/40 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${mutedText}`} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search catalog songs..."
              className={`w-full min-h-[40px] pl-9 pr-3 py-1.5 rounded-xl border text-xs ${inputBg}`}
            />
          </div>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSaveBulk(true)}
            className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
              isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All to Auto</span>
          </button>
        </div>

        <div className="max-h-[54vh] overflow-y-auto divide-y divide-slate-800/40">
          {filtered.map((row) => {
            const draft = drafts[row.track.id] || {
              activeOverride: 'auto',
              needsActionOverride: 'auto',
              actionNote: ''
            };

            return (
              <div key={row.track.id} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">{row.track.title}</div>
                  <div className={`text-[11px] font-mono ${mutedText}`}>
                    {row.track.id} · {row.track.ep} · Auto: {row.autoActive ? 'In Active' : 'Catalog'}
                    {row.autoHasIssue ? ' · Outlet Issue Detected' : ''}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <select
                    aria-label={`${row.track.title} Active Campaign rule`}
                    value={draft.activeOverride}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [row.track.id]: { ...draft, activeOverride: e.target.value as MatrixActiveOverride }
                      }))
                    }
                    className={`min-h-[36px] px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer ${
                      draft.activeOverride === 'pinned'
                        ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10'
                        : draft.activeOverride === 'archived'
                        ? 'border-slate-600 text-slate-400 bg-slate-800/60'
                        : inputBg
                    }`}
                  >
                    <option value="auto">Active: Auto ({row.autoActive ? 'Yes' : 'No'})</option>
                    <option value="pinned">Pin to Active Campaigns</option>
                    <option value="archived">Remove / Archive from Active</option>
                  </select>

                  <select
                    aria-label={`${row.track.title} Needs Action rule`}
                    value={draft.needsActionOverride}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [row.track.id]: { ...draft, needsActionOverride: e.target.value as MatrixNeedsActionOverride }
                      }))
                    }
                    className={`min-h-[36px] px-2.5 py-1 rounded-lg border text-xs font-medium cursor-pointer ${
                      draft.needsActionOverride === 'flagged'
                        ? 'border-rose-500/50 text-rose-400 bg-rose-500/10'
                        : draft.needsActionOverride === 'cleared'
                        ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                        : inputBg
                    }`}
                  >
                    <option value="auto">Action: Auto ({row.autoHasIssue ? 'Flagged' : 'Clear'})</option>
                    <option value="flagged">Flag as Needs Action</option>
                    <option value="cleared">Clear from Needs Action</option>
                  </select>

                  <input
                    type="text"
                    value={draft.actionNote}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [row.track.id]: { ...draft, actionNote: e.target.value }
                      }))
                    }
                    placeholder="Action note..."
                    className={`min-h-[36px] w-40 px-2.5 py-1 rounded-lg border text-xs ${inputBg}`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className={`px-5 py-4 border-t flex items-center justify-between gap-3 ${isDarkMode ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'}`}>
          <div className={`text-xs flex items-center gap-3 ${mutedText}`}>
            <span className="inline-flex items-center gap-1"><Pin className="w-3.5 h-3.5 text-emerald-400" /> Pinned stays in Active</span>
            <span className="inline-flex items-center gap-1"><Archive className="w-3.5 h-3.5 text-slate-400" /> Archived stays in All Catalog</span>
            <span className="inline-flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Flagged appears in Needs Action</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`min-h-[40px] px-4 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveBulk(false)}
              className="min-h-[40px] px-5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              {isSaving ? <CheckCircle2 className="w-3.5 h-3.5 animate-pulse" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSaving ? 'Saving...' : 'Save List Overrides'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
