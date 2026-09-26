import React, { useState } from 'react';
import {
  Youtube,
  Copy,
  Check,
  Sparkles,
  AlertTriangle,
  Calendar,
  Tag,
  Share2,
  FileText,
  Download,
  ExternalLink,
  ShieldCheck,
  Clock,
  Video
} from 'lucide-react';
import { Track } from '../types';
import { HelpCircle } from 'lucide-react';
import { SectionQuickHelpBanner } from './SectionQuickHelpBanner';

interface YouTubeSEOTabProps {
  track: Track;
  onCopyText: (text: string, label: string) => void;
  onOpenSectionGuide?: (sectionId?: any) => void;
  isDarkMode?: boolean;
}

export const YouTubeSEOTab: React.FC<YouTubeSEOTabProps> = ({
  track,
  onCopyText,
  onOpenSectionGuide,
  isDarkMode = true
}) => {
  const [formatMode, setFormatMode] = useState<'shorts' | 'longform'>('shorts');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Woodworking ban blacklist keywords
  const WOODWORKING_BLACKLIST = [
    'lathe', 'woodshop', 'carpentry', 'woodturning', 'sawdust', 
    'chisel', 'lumber', 'timber', 'sanding', 'router', 'bandsaw', 
    'woodcraft', 'joinery', 'spindle'
  ];

  // Dynamic tags calculation strictly complying with 2026 SOP (10-15 tags total)
  const sop2026Tags = [
    track.title,
    `${track.title} Lyrics`,
    `Ted Moyer`,
    'Christian Hip Hop 2026',
    'Kingdom Music',
    'Spiritual Warfare Anthem',
    track.vocalCast?.split('(')[0]?.trim() || track.vocal,
    `${track.bpm} BPM Worship`,
    'Kingdom Faith Music',
    'Men of God Anthem',
    'BRICK Records',
    'Blue Collar Prayer'
  ].slice(0, 14);

  // 2026 SOP Front-Loaded Title (<60 chars, primary keyword in first 40 chars)
  const sop2026ShortsTitle = `${track.title} | Who Helps The Man?`;
  const sop2026LongformTitle = `${track.title} – Ted Moyer (Official Audio) [${track.bpm} BPM]`;
  const activeTitle = formatMode === 'shorts' ? sop2026ShortsTitle : sop2026LongformTitle;

  // Official Artist Signature Block
  const signatureBlock = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OFFICIAL ARTIST LINKS & STEREO MASTERS:
🎵 Hyperfollow Release Hub: https://distrokid.com/hyperfollow/tedmoyer/${track.id.toLowerCase()}
🎧 Spotify Official: https://open.spotify.com/artist/tedmoyer
📺 YouTube Music Official: https://music.youtube.com/channel/tedmoyer
🍎 Apple Music: https://music.apple.com/us/artist/ted-moyer
📦 Master Stems & Nextcloud WebDAV: https://nextcloud.moyercloud.com/remote.php/dav/files/ncted/Music-Production/

PRODUCED & MASTERED BY BRICK RECORDS:
All rights reserved © 2026 BRICK Records / Ted Moyer. Faith & Family Production.
Strictly recorded & mastered in 24-Bit / 48kHz Lossless Linear PCM.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  // 2026 SOP 300-500 Word Comprehensive Description with Hook, Timestamps, and Signature
  const sop2026Description = `Listen to "${track.title}" by Ted Moyer. ${track.thesis} Official audio release produced by BRICK Records.

"${track.title}" explores the spiritual tension between self-reliance and divine surrender. In a culture driven by relentless output, superficial metrics, and digital distraction, this release calls believers back to the cornerstone: Brokenness Redeemed in Christ's Kingdom.

Produced in full 24-Bit / 48kHz lossless linear PCM, "${track.title}" features authentic acoustic textures, tectonic bass design, and uncompromising lyricism crafted for men and families standing in the gap.

TIMESTAMPS:
0:00 - Introduction & Verse 1
0:45 - The 60-Second Viral Hook (Chorus)
1:45 - Verse 2 & Narrative Progression
2:30 - The Throne Room Pivot (Bridge Climax)
3:15 - Outro & Resolution

${signatureBlock}

KEYWORDS & CATEGORY:
Christian Hip Hop, Kingdom Faith Music, Ted Moyer, BRICK Records, ${track.title}, Worship Rap 2026.`;

  // Check woodworking violations
  const allTextToCheck = `${activeTitle} ${track.thesis} ${track.sunoPrompt}`.toLowerCase();
  const violations = WOODWORKING_BLACKLIST.filter(w => allTextToCheck.includes(w));

  // Lifestyle Scheduling Matrix
  const schedulingWindows = [
    { title: "Weekday Commute Window", time: "6:00 AM – 8:00 AM Local", bestFor: "Shorts & Driving Anthems", active: track.bpm >= 90 },
    { title: "Lunch Decompression", time: "12:00 PM – 1:30 PM Local", bestFor: "Acoustic & Reflective", active: track.bpm < 90 && track.bpm >= 75 },
    { title: "Post-Bedtime Sanctuary", time: "9:00 PM – 11:00 PM Local", bestFor: "Atmospheric & Deep Worship", active: track.bpm < 75 },
    { title: "Saturday Morning Grind", time: "7:00 AM – 10:00 AM Saturday", bestFor: "Workout & Heavy Drops", active: track.bpm >= 120 }
  ];

  // Long-form description (2026 SOP Standard)
  const longformDescription = sop2026Description;

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    onCopyText(text, label);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Export full markdown audit report
  const handleExportMarkdownReport = () => {
    const report = `# YouTube SEO & Channel Lens (2026 SOP Standard) Audit Report
Track: ${track.id} - ${track.title}
Format Mode: ${formatMode.toUpperCase()}
Generated: ${new Date().toISOString()}

## 2026 SOP Metadata Rules
- Title (${activeTitle.length} chars): ${activeTitle}
- Title Compliance: ${activeTitle.length <= 60 ? 'PASS (<60 chars, primary keyword front-loaded)' : 'WARNING (Exceeds 60 chars)'}
- First 40 Chars of Title: "${activeTitle.slice(0, 40)}"
- Description Words: ~${longformDescription.split(/\s+/).filter(Boolean).length} words (Target: 300-500 words)
- Timestamps: Starts at 0:00, structured progression
- Woodworking Ban Status: ${violations.length === 0 ? 'CLEAN (PASS)' : `VIOLATIONS FOUND: ${violations.join(', ')}`}

## 2026 SOP Tags (${sop2026Tags.length} tags):
${sop2026Tags.map((t, idx) => `${idx + 1}. ${t}`).join('\n')}

## Recommended Release Schedule
${schedulingWindows.filter(w => w.active).map(w => `- ${w.title}: ${w.time} (${w.bestFor})`).join('\n')}

## Official Artist Signature Block
\`\`\`
${signatureBlock}
\`\`\`
`;
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${track.id}_YouTube_SEO_2026_Report.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* SECTION QUICK HELP BANNER & SOP GUIDE */}
      <SectionQuickHelpBanner
        sectionId="youtube"
        onOpenModalGuide={(sec) => onOpenSectionGuide?.(sec || 'youtube')}
        isDarkMode={isDarkMode}
      />
      
      {/* HEADER BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 font-mono text-[10px] font-bold border border-rose-700/50">
              YOUTUBE CHANNEL LENS v10.0
            </span>
            <span className="text-xs text-slate-400">SEO & Distribution Optimizer</span>
          </div>
          <h2 className="text-lg font-black text-white mt-1 flex items-center gap-2">
            <Youtube className="w-5 h-5 text-rose-500" />
            <span>{track.title} ({track.id})</span>
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onOpenSectionGuide && (
            <button
              type="button"
              onClick={() => onOpenSectionGuide('youtube')}
              className="px-3.5 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 text-xs font-bold border border-amber-700/50 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Open YouTube SEO Lens Operating Guide & SOP Rules"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>How To Use YouTube SEO</span>
            </button>
          )}

          {/* Format Mode Toggle */}
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
            <button
              onClick={() => setFormatMode('shorts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                formatMode === 'shorts' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Shorts Mode (&lt;50c)</span>
            </button>
            <button
              onClick={() => setFormatMode('longform')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                formatMode === 'longform' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Long-Form Mode (&lt;70c)</span>
            </button>
          </div>

          <button
            onClick={handleExportMarkdownReport}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export MD Audit</span>
          </button>
        </div>
      </div>

      {/* WOODWORKING BAN STATUS CALLOUT */}
      <div className={`p-4 rounded-xl border flex items-center justify-between flex-wrap gap-3 ${
        violations.length === 0
          ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300'
          : 'bg-rose-950/60 border-rose-600 text-rose-200'
      }`}>
        <div className="flex items-center gap-2.5">
          <ShieldCheck className={`w-5 h-5 ${violations.length === 0 ? 'text-emerald-400' : 'text-rose-400'}`} />
          <div>
            <div className="text-xs font-bold uppercase tracking-wider">
              Strict Woodworking Ban Audit: {violations.length === 0 ? '100% COMPLIANT' : 'VIOLATION DETECTED'}
            </div>
            <p className="text-[11px] text-slate-300">
              {violations.length === 0
                ? 'All carpentry, lathe, CNC, and hobbyist woodworking words stripped from public metadata.'
                : `Detected blacklisted terms: ${violations.join(', ')}. Strip these immediately to prevent YouTube algorithm miscategorization.`}
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono font-bold px-2 py-1 rounded bg-slate-900 border border-slate-700">
          Zero-Woodcraft Protocol
        </span>
      </div>

      {/* MAIN TWO-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: TITLE, DESCRIPTION & TIMELINE */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Active Title */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-rose-500" />
                <span>Optimized YouTube Title ({activeTitle.length} characters)</span>
              </span>
              <button
                onClick={() => handleCopy(activeTitle, 'Title')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 transition"
              >
                {copiedField === 'Title' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Copy Title</span>
              </button>
            </div>
            <input
              type="text"
              readOnly
              value={activeTitle}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-bold text-white font-mono"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>{formatMode === 'shorts' ? 'Target: <50 characters for mobile thumb visibility' : 'Target: <70 characters with front-loaded hook'}</span>
              <span className={activeTitle.length <= (formatMode === 'shorts' ? 50 : 70) ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {activeTitle.length <= (formatMode === 'shorts' ? 50 : 70) ? '✓ Character Count Ideal' : '⚠️ Exceeds Recommended Length'}
              </span>
            </div>
          </div>

          {/* Description Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white uppercase tracking-wider">
                {formatMode === 'shorts' ? 'Shorts Pinned Comment & Description' : 'Full YouTube Description & Chapters'}
              </span>
              <button
                onClick={() => handleCopy(longformDescription, 'Description')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 transition"
              >
                {copiedField === 'Description' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Copy Full Description</span>
              </button>
            </div>
            <textarea
              rows={12}
              readOnly
              value={longformDescription}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 leading-relaxed custom-scrollbar"
            />
          </div>

          {/* Official Artist Signature Block */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-indigo-400" />
                <span>Official Artist Signature Block</span>
              </span>
              <button
                onClick={() => handleCopy(signatureBlock, 'Signature Block')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 transition"
              >
                {copiedField === 'Signature Block' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Copy Signature</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[10px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap">
              {signatureBlock}
            </pre>
          </div>

        </div>

        {/* RIGHT COLUMN: 40/60 KEYWORD MATRIX & SCHEDULING */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* 2026 SOP 10-15 Tags Matrix */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-amber-400" />
                <span>2026 SOP Tag Matrix ({sop2026Tags.length}/15 Max)</span>
              </h3>
              <button
                onClick={() => handleCopy(sop2026Tags.join(', '), 'Tags')}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold"
              >
                Copy Tags
              </button>
            </div>

            {/* 2026 SOP Tags */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-bold">Compliant Keyword Tags:</span>
                <span className="text-[10px] text-emerald-400 font-mono">10-15 Target Passed</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sop2026Tags.map((t, i) => (
                  <span key={i} className="px-2 py-1 bg-slate-950 border border-slate-800 text-indigo-300 rounded-lg text-[11px] font-mono">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Lifestyle Scheduling Matrix */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Lifestyle Scheduling Matrix</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">{track.bpm} BPM Track</span>
            </div>

            <div className="space-y-2.5">
              {schedulingWindows.map((win, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border transition ${
                    win.active
                      ? 'bg-emerald-950/40 border-emerald-600/60 shadow-sm'
                      : 'bg-slate-950 border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{win.title}</span>
                    {win.active && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-700/50">
                        RECOMMENDED
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-indigo-300 font-mono mt-0.5">{win.time}</div>
                  <p className="text-[10px] text-slate-400 mt-1">{win.bestFor}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Thumbnail Prompts Generator */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Split-Screen High-CTR Thumbnail Concept</span>
            </h3>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
              <span className="text-[11px] font-bold text-slate-300">Psychological Contrast Prompt:</span>
              <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
                Split-screen thumbnail: Left half shows tired father in dark cold pickup cab gripping steering wheel at 5 AM. Right half shows glorious morning sunlight piercing ancient limestone archway with glowing gold dust motes. Bold high-contrast text overlay: 'WHO HELPS THE MAN?'
              </p>
              <button
                onClick={() => handleCopy("Split-screen thumbnail: Left half shows tired father in dark cold pickup cab gripping steering wheel at 5 AM. Right half shows glorious morning sunlight piercing ancient limestone archway with glowing gold dust motes. Bold high-contrast text overlay: 'WHO HELPS THE MAN?'", 'Thumbnail Prompt')}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold"
              >
                Copy Thumbnail Prompt
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
