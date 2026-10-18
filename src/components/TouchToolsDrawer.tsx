import React from 'react';
import {
  X,
  Sparkles,
  Film,
  Video,
  Share2,
  HardDrive,
  ShieldCheck,
  Palette,
  Cloud,
  FileCode,
  Music,
  Compass,
  Radio,
  Sliders,
  Flame,
  CheckCircle2
} from 'lucide-react';

interface TouchToolsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab: (tab: string) => void;
  onOpenSelahModal: () => void;
  onOpenVpnModal: () => void;
  onOpenThemeModal: () => void;
  isDarkMode?: boolean;
}

export const TouchToolsDrawer: React.FC<TouchToolsDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
  onOpenSelahModal,
  onOpenVpnModal,
  onOpenThemeModal,
  isDarkMode = true
}) => {
  if (!isOpen) return null;

  const tools = [
    {
      id: 'selah',
      title: 'Selah Prayer Gate',
      desc: 'Theological guardrails & release validation',
      icon: ShieldCheck,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      action: () => {
        onOpenSelahModal();
        onClose();
      }
    },
    {
      id: 'nextcloud',
      title: 'Nextcloud WebDAV Bento',
      desc: 'Browse /Music-Production/ & sync stems',
      icon: HardDrive,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      action: () => {
        onNavigateToTab('nextcloud_sync');
        onClose();
      }
    },
    {
      id: 'nightcafe',
      title: 'NightCafe AI Visuals',
      desc: 'Album art generation & character locks',
      icon: Sparkles,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      action: () => {
        onNavigateToTab('nightcafe');
        onClose();
      }
    },
    {
      id: 'veo',
      title: 'Veo Cinematic Visuals',
      desc: 'Generative video scenes & storyboard reels',
      icon: Film,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      action: () => {
        onNavigateToTab('veo');
        onClose();
      }
    },
    {
      id: 'youtube_seo',
      title: 'YouTube SEO & Tags',
      desc: 'Metadata, tags, chapters & description builder',
      icon: Radio,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      action: () => {
        onNavigateToTab('youtube_seo');
        onClose();
      }
    },
    {
      id: 'omnipost',
      title: 'OmniPost Syndication',
      desc: 'Social snippets & multi-platform releases',
      icon: Share2,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
      action: () => {
        onNavigateToTab('omnipost');
        onClose();
      }
    },
    {
      id: 'vpn',
      title: 'Tailscale VPN Mesh',
      desc: 'Direct wire connection to Proxmox Nextcloud',
      icon: Cloud,
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
      action: () => {
        onOpenVpnModal();
        onClose();
      }
    },
    {
      id: 'theme',
      title: 'Studio Theme Switcher',
      desc: 'Sun, Moon, Stars, Graphite & Console',
      icon: Palette,
      color: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30',
      action: () => {
        onOpenThemeModal();
        onClose();
      }
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Sheet Surface */}
      <div
        className={`relative z-10 w-full max-h-[80vh] rounded-t-3xl border-t flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-250 ${
          isDarkMode
            ? 'bg-slate-950 border-slate-800 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Grab Handle & Title */}
        <div className="p-4 pb-3 flex items-center justify-between border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">Studio Tools & Integrations</h2>
              <p className="text-xs text-slate-400">Extended production utilities</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="touch-target w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition active:scale-95 cursor-pointer"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tools Grid (2-column on tablet/foldable, 1-column on narrow screen) */}
        <div className="p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5 pb-24 touch-pan-y">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={tool.action}
                className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all active:scale-[0.98] cursor-pointer text-left ${
                  isDarkMode
                    ? 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 text-white'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-900'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${tool.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm truncate">{tool.title}</h3>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{tool.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
