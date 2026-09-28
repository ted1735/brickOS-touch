import React, { useState } from 'react';
import {
  Zap,
  HelpCircle,
  Copy,
  Check,
  ExternalLink,
  Download,
  Code,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { SectionQuickHelpBanner } from './SectionQuickHelpBanner';
import { NIGHTCAFE_USERSCRIPT_CODE } from '../data/automationUserscripts';

interface NightCafePrompt {
  song: string;
  title: string;
  prompt: string;
  aspectRatio?: string;
  guidance?: number;
}

interface NightCafeTabProps {
  prompts: NightCafePrompt[];
  onOpenSectionGuide?: (sectionId: string) => void;
  isDarkMode?: boolean;
  onCopySuccess?: (message: string) => void;
}

export const NightCafeTab: React.FC<NightCafeTabProps> = ({
  prompts,
  onOpenSectionGuide,
  isDarkMode = true,
  onCopySuccess
}) => {
  const [copiedUserscript, setCopiedUserscript] = useState(false);
  const [showUserscriptModal, setShowUserscriptModal] = useState(false);
  const [songFilter, setSongFilter] = useState('All');

  const uniqueSongs = ['All', ...Array.from(new Set(prompts.map(p => p.song)))];
  const filteredPrompts = songFilter === 'All' ? prompts : prompts.filter(p => p.song === songFilter);

  const handleCopyUserscript = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(NIGHTCAFE_USERSCRIPT_CODE);
      setCopiedUserscript(true);
      setTimeout(() => setCopiedUserscript(false), 3000);
      if (onCopySuccess) {
        onCopySuccess('NightCafe 1-Click Userscript copied to clipboard!');
      }
    }
  };

  const handleDownloadUserscript = () => {
    const blob = new Blob([NIGHTCAFE_USERSCRIPT_CODE], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nightcafe_1_click_automation_userscript.user.js';
    a.click();
    URL.revokeObjectURL(url);
    if (onCopySuccess) {
      onCopySuccess('Downloaded nightcafe_1_click_automation_userscript.user.js');
    }
  };

  return (
    <div className="space-y-4">
      {onOpenSectionGuide && (
        <SectionQuickHelpBanner
          sectionId="nightcafe"
          onOpenModalGuide={onOpenSectionGuide}
          isDarkMode={isDarkMode}
        />
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span>NightCafe Studio Bulk Queue Runner & Automation Hub</span>
              <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 font-mono text-[10px] font-bold border border-blue-700/50">
                {prompts.length} Scenes Loaded
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Batch prompt dispatching for Google Veo & Flux Dev models on NightCafe Studio with brickOS 1-Click Automation Userscript.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Userscript Installer Button (from brickOS-Automations) */}
            <button
              type="button"
              onClick={() => setShowUserscriptModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-300 text-xs font-bold border border-purple-700/50 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Get brickOS 1-Click Auto-Queue Userscript for Violentmonkey/Tampermonkey"
            >
              <Code className="w-3.5 h-3.5 text-purple-400" />
              <span>1-Click Userscript HUD</span>
            </button>

            {onOpenSectionGuide && (
              <button
                type="button"
                onClick={() => onOpenSectionGuide('nightcafe')}
                className="px-3.5 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 text-xs font-bold border border-amber-700/50 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                title="Open NightCafe Bulk Queue Operating Guide & SOP Rules"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>How To Use NightCafe</span>
              </button>
            )}

            <button
              onClick={() => {
                const payload = JSON.stringify(prompts, null, 2);
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(payload);
                  if (onCopySuccess) onCopySuccess('NightCafe Queue JSON copied to clipboard!');
                }
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 transition"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>⚡ Copy JSON for NightCafe</span>
            </button>

            <a
              href="https://creator.nightcafe.studio/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <span>Open NightCafe Studio</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Song Filter Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-slate-500 font-mono uppercase">Filter by Song:</span>
          {uniqueSongs.map(song => (
            <button
              key={song}
              type="button"
              onClick={() => setSongFilter(song)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                songFilter === song
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {song}
            </button>
          ))}
        </div>

        {/* Prompt Table */}
        <div className="border border-slate-800 rounded-xl bg-slate-950 overflow-hidden max-h-[460px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-900 border-b border-slate-800 sticky top-0 text-slate-400">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3 w-36">Song</th>
                <th className="py-2.5 px-3 w-36">Scene Title</th>
                <th className="py-2.5 px-3">Cinematic Prompt</th>
                <th className="py-2.5 px-3 w-20 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredPrompts.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-900/60 transition">
                  <td className="py-2 px-3 text-center text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                  <td className="py-2 px-3 font-semibold text-blue-300">{item.song}</td>
                  <td className="py-2 px-3 font-medium text-slate-200">{item.title}</td>
                  <td className="py-2 px-3 font-mono text-[11px] text-slate-300">{item.prompt}</td>
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(item.prompt);
                          if (onCopySuccess) onCopySuccess(`Copied "${item.title}" prompt!`);
                        }
                      }}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition"
                      title="Copy prompt text"
                    >
                      Copy
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Userscript Modal */}
      {showUserscriptModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowUserscriptModal(false)}
        >
          <div
            className="w-full max-w-2xl bg-slate-900 border border-purple-500/40 rounded-2xl p-6 shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-purple-400" />
                <h4 className="text-sm font-bold text-white">
                  brickOS NightCafe 1-Click Automation Userscript
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowUserscriptModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This userscript runs directly inside <code className="text-blue-400">creator.nightcafe.studio</code> via Violentmonkey or Tampermonkey. It injects a floating HUD that automatically loads your brickOS prompt stack, executes batch prompts, and avoids manual copy-pasting.
            </p>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400 max-h-48 overflow-y-auto">
              {NIGHTCAFE_USERSCRIPT_CODE.slice(0, 500)}...
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownloadUserscript}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-2 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .user.js</span>
              </button>
              <button
                type="button"
                onClick={handleCopyUserscript}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-2 transition"
              >
                {copiedUserscript ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUserscript ? 'Copied Script!' : 'Copy Userscript to Clipboard'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
