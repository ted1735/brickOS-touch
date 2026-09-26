import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  Sparkles,
  Smartphone,
  Download,
  Calendar,
  Layers,
  Heart,
  Flame,
  Zap,
  HardDrive,
  MessageSquare,
  Play
} from 'lucide-react';
import { Track } from '../types';
import { HelpCircle } from 'lucide-react';
import { SectionQuickHelpBanner } from './SectionQuickHelpBanner';

interface OmniPostTabProps {
  track: Track;
  onCopyText: (text: string, label: string) => void;
  onOpenSectionGuide?: (sectionId?: any) => void;
  isDarkMode?: boolean;
}

export const OmniPostTab: React.FC<OmniPostTabProps> = ({
  track,
  onCopyText,
  onOpenSectionGuide,
  isDarkMode = true
}) => {
  const [platform, setPlatform] = useState<'tiktok' | 'reels' | 'shorts'>('tiktok');
  const [template, setTemplate] = useState<'viral_hook' | 'selah_bts' | 'anthem_drop' | 'fitness_15k'>('viral_hook');
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Default captions based on templates
  const [captions, setCaptions] = useState({
    viral_hook: {
      tiktok: `Who helps the man when the man is the help? 💔 Drop a 🔨 if you're carrying the family today. God sees your silent 5 AM shift. #ChristianHipHop #MenOfGod #BlueCollarFaith #BRICKRecords #${track.title.replace(/\s+/g, '')}`,
      reels: `When the truck cab is quiet and the burden feels too heavy to name... Christ meets you right in the dust. "${track.title}" out now on BRICK Records. 🔗 Link in bio for full 24-bit lossless master. #FaithInTheTrenches #ChristianRap #KingdomMusic #FamilyFirst`,
      shorts: `5 AM Diesel cab confession. Who helps the man? Watch full audio on channel. #Shorts #ChristianHipHop #Faith #TedMoyer`
    },
    selah_bts: {
      tiktok: `Studio BTS: Why we pause for 24 hours of prayer (Selah) before releasing any master WAV. Kingdom over numbers every time. 🙏 #StudioVlog #MusicProducer #ChristianArtist #SelahPrayer`,
      reels: `Behind the console at BRICK Records. Every stem is consecrated before it hits Spotify. No rushing the Holy Spirit. #RecordingStudio #FaithBasedMusic #NashvilleMastering #TedMoyer`,
      shorts: `24-Hour Selah prayer stationkeeping rule before master release. #StudioBTS #MusicProduction #Faith`
    },
    anthem_drop: {
      tiktok: `🚨 "${track.title}" JUST DROPPED! Turn this up in the truck or the gym! 🔊 26 years in the ring and we're not tapping out! #NewMusic #CEDM #ChristianWorkout #Anthem`,
      reels: `Official Release Announcement: "${track.title}" is officially live across all major streaming hubs! Stream lossless 24-bit audio now. #ReleaseDay #BRICKRecords #KingdomAnthem`,
      shorts: `"${track.title}" OFFICIAL AUDIO IS LIVE! Turn your volume all the way up. #NewMusicFriday #ChristianEDM`
    },
    fitness_15k: {
      tiktok: `15,000 steps before noon! 👟 Lacing up for the calling, getting stronger for our kids, hotter for my spouse! 💥 Let's get it! #15kSteps #ChristianFitness #WorkoutMotivation #Consistent`,
      reels: `Pavement therapy & kingdom discipline. 15k on the clock. What are you fighting for today? Song: "${track.title}" by Ted Moyer. #FitnessMinistry #ChristianMotivation #Endurance`,
      shorts: `15k step workout soundtrack. Stay consistent for your calling! #FitnessShorts #ChristianEDM #Motivation`
    }
  });

  const activeCaption = captions[template][platform];

  // Helper copy
  const handleCopy = (text: string, label: string) => {
    onCopyText(text, label);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Generate with Gemini
  const handleGenerateAiCopy = async () => {
    setIsGeneratingCopy(true);
    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `You are the Omnipost Social Strategist for BRICK Records / Ted Moyer.
Write 3 platform-optimized social captions (TikTok, Instagram Reels, YouTube Shorts) for the track "${track.title}" (${track.genre}, ${track.bpm} BPM, Vocal: ${track.vocalCast}).
Lyrics snippet:
${track.lyrics.substring(0, 300)}
Template focus: ${template}
Ensure high 3-second hook velocity, blue-collar authenticity, zero religious clichés, and clear Call To Action.`
            }
          ],
          model: 'gemini-3.5-flash'
        })
      });
      const data = await res.json();
      if (data.reply) {
        // Update current platform caption with response
        setCaptions(prev => ({
          ...prev,
          [template]: {
            ...prev[template],
            [platform]: data.reply
          }
        }));
      }
    } catch (_) {
      // Keep existing caption
    } finally {
      setIsGeneratingCopy(false);
    }
  };

  // Export JSON Dispatcher
  const handleExportOmnipostJson = () => {
    const payload = {
      campaignId: `OMNI-${track.id}-${Date.now()}`,
      trackId: track.id,
      title: track.title,
      genre: track.genre,
      bpm: track.bpm,
      webdavStemFolder: `https://nextcloud.moyercloud.com/remote.php/dav/files/ncted/Music-Production/${track.id}/`,
      exportedAt: new Date().toISOString(),
      campaigns: captions
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnipost-module-export_${track.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* SECTION QUICK HELP BANNER & SOP GUIDE */}
      <SectionQuickHelpBanner
        sectionId="omnipost"
        onOpenModalGuide={(sec) => onOpenSectionGuide?.(sec || 'omnipost')}
        isDarkMode={isDarkMode}
      />
      
      {/* HEADER BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 font-mono text-[10px] font-bold border border-purple-700/50">
              OMNIPOST SOCIAL DISPATCHER
            </span>
            <span className="text-xs text-slate-400">Short-Form Social Engine</span>
          </div>
          <h2 className="text-lg font-black text-white mt-1 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-purple-400" />
            <span>Social Campaign Studio: {track.title}</span>
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenSectionGuide && (
            <button
              type="button"
              onClick={() => onOpenSectionGuide('omnipost')}
              className="px-3.5 py-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 font-bold text-xs border border-amber-700/50 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Open OmniPost Social Engine Guide & SOP Rules"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>How To Use OmniPost</span>
            </button>
          )}

          <button
            onClick={handleGenerateAiCopy}
            disabled={isGeneratingCopy}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{isGeneratingCopy ? 'Writing AI Hooks...' : '1-Click AI Copywriter'}</span>
          </button>

          <button
            onClick={handleExportOmnipostJson}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export omnipost.json</span>
          </button>
        </div>
      </div>

      {/* TEMPLATE PICKER */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { id: 'viral_hook', title: '60-Sec Viral Hook Push', desc: 'Emotional 3s punch & question' },
          { id: 'selah_bts', title: 'Selah Prayer & Studio BTS', desc: 'Vulnerable prayer sanctuary' },
          { id: 'anthem_drop', title: 'Anthem Drop Day', desc: 'High energy call-to-action' },
          { id: 'fitness_15k', title: 'Fitness Milestone (15k Steps)', desc: 'Daily discipline & energy' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTemplate(t.id as any)}
            className={`p-3 rounded-xl border text-left transition ${
              template === t.id
                ? 'bg-purple-950/50 border-purple-500 text-white shadow-lg shadow-purple-950/40'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="font-bold text-xs">{t.title}</div>
            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{t.desc}</p>
          </button>
        ))}
      </div>

      {/* WORKBENCH GRID: SIMULATOR & EDITOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT: 9:16 MOBILE SIMULATOR */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-[300px] h-[580px] bg-slate-950 border-4 border-slate-800 rounded-[36px] p-3 shadow-2xl relative flex flex-col justify-between overflow-hidden ring-1 ring-white/10">
            {/* Phone Notch */}
            <div className="w-32 h-4 bg-slate-800 rounded-b-xl mx-auto mb-2 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-slate-900 mr-2" />
              <div className="w-8 h-1 rounded-full bg-slate-900" />
            </div>

            {/* Background Visual representation */}
            <div className="absolute inset-0 z-0 bg-gradient-to-t from-black via-slate-900 to-indigo-950 flex flex-col items-center justify-center opacity-80">
              <div className="text-center p-6 space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center mx-auto text-indigo-300 shadow-xl">
                  <Play className="w-8 h-8 fill-current translate-x-0.5" />
                </div>
                <h4 className="text-sm font-black text-white">{track.title}</h4>
                <p className="text-[11px] text-slate-400 font-mono">{track.genre}</p>
                <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                  {platform.toUpperCase()} PREVIEW
                </span>
              </div>
            </div>

            {/* Overlay UI elements simulating TikTok / Reels / Shorts */}
            <div className="relative z-10 space-y-2 mb-4 p-2 bg-gradient-to-t from-black/90 to-transparent rounded-2xl">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-indigo-600 flex items-center justify-center text-[11px] font-black text-white">
                  TM
                </div>
                <span className="text-xs font-bold text-white">@tedmoyer.music</span>
              </div>
              <p className="text-[11px] text-slate-200 line-clamp-3 leading-snug">
                {activeCaption}
              </p>
              <div className="text-[10px] text-amber-300 font-mono flex items-center gap-1">
                <Zap className="w-3 h-3" />
                <span>Original Audio • Ted Moyer - {track.title}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: PLATFORM TABS & CAPTION EDITOR */}
        <div className="lg:col-span-7 space-y-5">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            {/* Platform Selector */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Social Channel:</span>
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'tiktok', label: 'TikTok (9:16)' },
                  { id: 'reels', label: 'Instagram Reels' },
                  { id: 'shorts', label: 'YouTube Shorts' }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      platform === p.id
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Caption Textarea */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white uppercase tracking-wider">
                  Platform Caption & Hashtags ({activeCaption.length} chars)
                </span>
                <button
                  onClick={() => handleCopy(activeCaption, `${platform.toUpperCase()} Caption`)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 transition"
                >
                  {copiedKey === `${platform.toUpperCase()} Caption` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Copy Caption</span>
                </button>
              </div>

              <textarea
                rows={8}
                value={activeCaption}
                onChange={(e) => {
                  const val = e.target.value;
                  setCaptions(prev => ({
                    ...prev,
                    [template]: {
                      ...prev[template],
                      [platform]: val
                    }
                  }));
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-200 leading-relaxed focus:outline-none focus:border-purple-500 custom-scrollbar"
              />
            </div>

            {/* Direct WebDAV Stem Asset Link */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs">
              <span className="font-bold text-indigo-400 flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5" />
                <span>Nextcloud WebDAV Stems Binding:</span>
              </span>
              <p className="text-[11px] text-slate-400 font-mono truncate select-all">
                https://nextcloud.moyercloud.com/remote.php/dav/files/ncted/Music-Production/{track.id}/social_cuts/
              </p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
