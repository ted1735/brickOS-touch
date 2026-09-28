import React from 'react';
import { Activity, HelpCircle, CheckCircle, AlertTriangle, ArrowUpRight, Clock } from 'lucide-react';
import { SectionQuickHelpBanner } from './SectionQuickHelpBanner';

interface TelemetryTabProps {
  onOpenSectionGuide?: (sectionId: string) => void;
  isDarkMode?: boolean;
}

export const TelemetryTab: React.FC<TelemetryTabProps> = ({
  onOpenSectionGuide,
  isDarkMode = true
}) => {
  return (
    <div className="space-y-4">
      {onOpenSectionGuide && (
        <SectionQuickHelpBanner
          sectionId="telemetry"
          onOpenModalGuide={onOpenSectionGuide}
          isDarkMode={isDarkMode}
        />
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" />
              <span>T+60m Inbound Telemetry & Brutal Metric Loop</span>
              <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-mono text-[10px] font-bold border border-purple-700/50">
                Active Audit
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Automated retention scoring. Videos with ≥70% completion trigger 10s video extensions instantly.
            </p>
          </div>

          {onOpenSectionGuide && (
            <button
              type="button"
              onClick={() => onOpenSectionGuide('telemetry')}
              className="px-3.5 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 text-xs font-bold border border-amber-700/50 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Open Telemetry Operating Guide & SOP Rules"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>How To Use Telemetry</span>
            </button>
          )}
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase">Track: Meet Me Here (TRK-13)</span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-mono font-bold">VIRAL WINNER</span>
            </div>
            <div className="text-xs text-slate-300 space-y-1 font-mono">
              <div>3s Retention: <strong className="text-white">74.2%</strong> (&gt;65% Pass)</div>
              <div>Completion Rate: <strong className="text-white">71.5%</strong> (&gt;70% Winner)</div>
              <div>1h Views: <strong className="text-white">2,680</strong></div>
            </div>
            <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 font-mono">
              <strong>Action Triggered:</strong> Generated 3 seamless 10-second video extensions (Scenes 4, 5, 6) via Gemini Flash.
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-400 uppercase">Track: Calvary Grit (TRK-09)</span>
              <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 text-[10px] font-mono font-bold">KILL CONCEPT</span>
            </div>
            <div className="text-xs text-slate-300 space-y-1 font-mono">
              <div>3s Retention: <strong className="text-white">58.2%</strong> (&lt;65% Kill)</div>
              <div>Completion Rate: <strong className="text-white">44.1%</strong></div>
              <div>1h Views: <strong className="text-white">640</strong></div>
            </div>
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-xs text-rose-200 font-mono">
              <strong>Action Triggered:</strong> Campaign archived. Log weak visual hook in changelog.
            </div>
          </div>
        </div>

        {/* Studio Pipeline Latency Counters */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4">
          <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Audio & Stem Pipeline Latency (Buffer Headroom)</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-[10px] font-mono text-slate-500">Audio Buffer Latency</div>
              <div className="text-sm font-bold text-emerald-400 font-mono mt-1">8.2 ms</div>
              <div className="text-[9px] text-slate-500 mt-0.5">&lt; 15ms target</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-[10px] font-mono text-slate-500">Stem Separation (UVR5)</div>
              <div className="text-sm font-bold text-indigo-400 font-mono mt-1">42 sec</div>
              <div className="text-[9px] text-slate-500 mt-0.5">Roformer GPU</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-[10px] font-mono text-slate-500">Nextcloud WebDAV Sync</div>
              <div className="text-sm font-bold text-cyan-400 font-mono mt-1">1.2 sec</div>
              <div className="text-[9px] text-slate-500 mt-0.5">Bento 207332</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-[10px] font-mono text-slate-500">Firestore Realtime Ping</div>
              <div className="text-sm font-bold text-amber-400 font-mono mt-1">24 ms</div>
              <div className="text-[9px] text-slate-500 mt-0.5">Cloud WebSocket</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
