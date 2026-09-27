import React from 'react';
import {
  Layers,
  FileText,
  Database,
  HardDrive,
  Sliders,
  Scissors,
  Activity,
  Music,
  Clapperboard,
  Film,
  Share2,
  Sparkles,
  Zap,
  Video,
  MessageSquare,
  Search,
  Columns
} from 'lucide-react';

export interface StudioNavItem {
  id: string;
  name: string;
  shortName: string;
  tier: 'tier1' | 'tier2';
  tierLabel: string;
  tierBadgeColor: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  activeBg: string;
  activeBorder: string;
  glowColor: string;
  description: string;
  sopRule?: string;
  badge?: string;
  shortcut?: string;
}

export const TIER_1_NAV_ITEMS: StudioNavItem[] = [
  {
    id: 'kanban',
    name: 'Kanban & Pipeline Dashboard',
    shortName: 'Kanban',
    tier: 'tier1',
    tierLabel: 'Tier 1 • Audio Engine',
    tierBadgeColor: 'bg-indigo-950/80 text-indigo-400 border-indigo-800/40',
    icon: Layers,
    accentColor: 'text-indigo-400',
    activeBg: 'bg-indigo-600',
    activeBorder: 'border-indigo-400',
    glowColor: 'shadow-indigo-500/30',
    description: 'Master 4-EP pipeline dashboard across all 26 tracks with drag-and-drop status stages, Nashville SOP compliance, and cloud sync.',
    sopRule: 'Rule 1: Mandatory Selah 24h prayer gate before final distribution.',
    badge: 'Master',
    shortcut: 'Alt+1'
  },
  {
    id: 'lyrics',
    name: 'Lyrics & Suno 4-Block Engine',
    shortName: 'Lyrics',
    tier: 'tier1',
    tierLabel: 'Tier 1 • Audio Engine',
    tierBadgeColor: 'bg-blue-950/80 text-blue-400 border-blue-800/40',
    icon: FileText,
    accentColor: 'text-blue-400',
    activeBg: 'bg-blue-600',
    activeBorder: 'border-blue-400',
    glowColor: 'shadow-blue-500/30',
    description: 'Theological lyric craft with OBI Funnel, Suno AI v5.5 prompt generator, 4-block engine sliders, and sound preset library.',
    sopRule: 'Rule 2: Enforce the Throne Room Pivot by the bridge; zero Christianese.',
    badge: 'Suno v5.5',
    shortcut: 'Alt+2'
  },
  {
    id: 'version-matrix',
    name: 'Song Version Matrix (3-Way Stacking)',
    shortName: 'Version Matrix',
    tier: 'tier1',
    tierLabel: 'Tier 1 • Audio Engine',
    tierBadgeColor: 'bg-indigo-950/80 text-indigo-400 border-indigo-800/40',
    icon: Columns,
    accentColor: 'text-indigo-400',
    activeBg: 'bg-indigo-600',
    activeBorder: 'border-indigo-400',
    glowColor: 'shadow-indigo-500/30',
    description: 'Direct 3-way side-by-side song version comparison matrix with synchronized scrolling, raw markdown editing, and structured arrangement card views.',
    sopRule: 'Rule 2b: Multi-version matrix comparison required before locking final masters.',
    badge: '3-Way MD',
    shortcut: 'Alt+V'
  },
  {
    id: 'database',
    name: 'Catalog Matrix & Asset Linker',
    shortName: 'Catalog',
    tier: 'tier1',
    tierLabel: 'Tier 1 • Audio Engine',
    tierBadgeColor: 'bg-cyan-950/80 text-cyan-400 border-cyan-800/40',
    icon: Database,
    accentColor: 'text-cyan-400',
    activeBg: 'bg-cyan-600',
    activeBorder: 'border-cyan-400',
    glowColor: 'shadow-cyan-500/30',
    description: 'Real-time Camelot harmonic key compatibility, BPM tempo matching, vocal archetype pairing, and master catalog export.',
    sopRule: 'Rule 3: Harmonic transitions must lock to adjacent 5ths or exact Camelot.',
    badge: 'Matrix',
    shortcut: 'Alt+3'
  },
  {
    id: 'nextcloud_sync',
    name: 'Nextcloud /Music-Production (207332)',
    shortName: 'Nextcloud',
    tier: 'tier1',
    tierLabel: 'Tier 1 • Audio Engine',
    tierBadgeColor: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/40',
    icon: HardDrive,
    accentColor: 'text-emerald-400',
    activeBg: 'bg-emerald-600',
    activeBorder: 'border-emerald-400',
    glowColor: 'shadow-emerald-500/30',
    description: 'Live WebDAV bridge to folder 207332, automated stem matching, audio fingerprinting, and remote cloud ingestion.',
    sopRule: 'Rule 4: Ingest stems only as 24-bit/48kHz broadcast WAV format.',
    badge: 'WebDAV',
    shortcut: 'Alt+4'
  },
  {
    id: 'mixer',
    name: '4-Track Mini-DAW Console',
    shortName: 'Mini-DAW',
    tier: 'tier1',
    tierLabel: 'Tier 1 • Audio Engine',
    tierBadgeColor: 'bg-amber-950/80 text-amber-400 border-amber-800/40',
    icon: Scissors,
    accentColor: 'text-amber-400',
    activeBg: 'bg-amber-600',
    activeBorder: 'border-amber-400',
    glowColor: 'shadow-amber-500/30',
    description: 'Stem mixing console with faders, stereo pan, mute/solo, Web Audio API synthesis, and real-time Recharts acoustic spectrum.',
    sopRule: 'Rule 5: Keep drum fader at 85% and vocal at 95% for vocal primacy.',
    badge: 'Mixer',
    shortcut: 'Alt+5'
  },
  {
    id: 'mastering',
    name: 'Mastering Engineer & A/B',
    shortName: 'Mastering',
    tier: 'tier1',
    tierLabel: 'Tier 1 • Audio Engine',
    tierBadgeColor: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/40',
    icon: Activity,
    accentColor: 'text-emerald-400',
    activeBg: 'bg-emerald-600',
    activeBorder: 'border-emerald-400',
    glowColor: 'shadow-emerald-500/30',
    description: '-12.0 LUFS integrated loudness targeting, -1.0 dBTP true peak ceiling, 80Hz subtractive high-pass filter, and A/B comparison.',
    sopRule: 'Rule 6: Mandatory mobile phone mono-collapse correlation verification.',
    badge: '-12 LUFS',
    shortcut: 'Alt+6'
  },
  {
    id: 'ministry',
    name: 'Live Ministry Charts & Worship',
    shortName: 'Ministry',
    tier: 'tier1',
    tierLabel: 'Tier 1 • Audio Engine',
    tierBadgeColor: 'bg-cyan-950/80 text-cyan-400 border-cyan-800/40',
    icon: Music,
    accentColor: 'text-cyan-400',
    activeBg: 'bg-cyan-600',
    activeBorder: 'border-cyan-400',
    glowColor: 'shadow-cyan-500/30',
    description: 'Live worship charts, chord transposition, Nashville Number System, and Selah prayer stationkeeping logs.',
    sopRule: 'Rule 7: Chart keys must match lead vocalist comfort tessitura.',
    badge: 'Charts',
    shortcut: 'Alt+7'
  }
];

export const TIER_2_NAV_ITEMS: StudioNavItem[] = [
  {
    id: 'veo_visuals',
    name: 'Visuals & Veo 3 Video Studio',
    shortName: 'Veo 3',
    tier: 'tier2',
    tierLabel: 'Tier 2 • Visuals & Copilots',
    tierBadgeColor: 'bg-amber-950/80 text-amber-400 border-amber-800/40',
    icon: Clapperboard,
    accentColor: 'text-amber-400',
    activeBg: 'bg-purple-600',
    activeBorder: 'border-purple-400',
    glowColor: 'shadow-purple-500/30',
    description: 'Google Veo 3 cinematic video rendering, 9:16 vertical reels, and AI-generated theological cover artwork.',
    sopRule: 'Rule 8: Cover artwork must express the theological thesis visually.',
    badge: 'Veo 3.1',
    shortcut: 'Alt+8'
  },
  {
    id: 'youtube',
    name: 'YouTube SEO Lens & Packaging',
    shortName: 'YouTube',
    tier: 'tier2',
    tierLabel: 'Tier 2 • Visuals & Copilots',
    tierBadgeColor: 'bg-rose-950/80 text-rose-400 border-rose-800/40',
    icon: Film,
    accentColor: 'text-rose-500',
    activeBg: 'bg-rose-600',
    activeBorder: 'border-rose-400',
    glowColor: 'shadow-rose-500/30',
    description: 'Optimized video metadata, high-CTR thumbnail titles, search tag generation, and audience engagement copy.',
    sopRule: 'Rule 9: Keep titles <60 chars with emotional curiosity gap + artist branding.',
    badge: 'SEO Lens',
    shortcut: 'Alt+9'
  },
  {
    id: 'omnipost',
    name: 'OmniPost Multi-Channel Social',
    shortName: 'OmniPost',
    tier: 'tier2',
    tierLabel: 'Tier 2 • Visuals & Copilots',
    tierBadgeColor: 'bg-purple-950/80 text-purple-400 border-purple-800/40',
    icon: Share2,
    accentColor: 'text-purple-400',
    activeBg: 'bg-purple-600',
    activeBorder: 'border-purple-400',
    glowColor: 'shadow-purple-500/30',
    description: 'Multi-platform rollout scheduler for TikTok, Instagram Reels, and YouTube Shorts with morning devotional hooks.',
    sopRule: 'Rule 10: Schedule morning hooks between 6:00 AM - 8:30 AM local time.',
    badge: 'Rollout',
    shortcut: 'Alt+0'
  },
  {
    id: 'prompt_library',
    name: 'Universal Prompt Library & Storyboard',
    shortName: 'Prompts',
    tier: 'tier2',
    tierLabel: 'Tier 2 • Visuals & Copilots',
    tierBadgeColor: 'bg-indigo-950/80 text-indigo-400 border-indigo-800/40',
    icon: Sparkles,
    accentColor: 'text-amber-400',
    activeBg: 'bg-gradient-to-r from-purple-600 to-indigo-600',
    activeBorder: 'border-purple-400',
    glowColor: 'shadow-purple-500/30',
    description: 'Universal 4-Phase storyboard prompt engineering library across image, video, and audio modalities.',
    sopRule: 'Rule 11: Maintain visual continuity across all 4 storyboard acts.',
    badge: '4-Phase'
  },
  {
    id: 'nightcafe',
    name: 'NightCafe Queue & Prompt Lab',
    shortName: 'NightCafe',
    tier: 'tier2',
    tierLabel: 'Tier 2 • Visuals & Copilots',
    tierBadgeColor: 'bg-blue-950/80 text-blue-400 border-blue-800/40',
    icon: Zap,
    accentColor: 'text-blue-400',
    activeBg: 'bg-blue-600',
    activeBorder: 'border-blue-400',
    glowColor: 'shadow-blue-500/30',
    description: 'NightCafe Studio batch generation queue, negative prompt templates, and fast prompt clipboard copying.',
    sopRule: 'Rule 12: Always include negative prompt presets to prevent anatomy errors.',
    badge: 'Batch'
  },
  {
    id: 'video_express',
    name: 'VideoExpress Agent (Avatar Copilot)',
    shortName: 'VideoExpress',
    tier: 'tier2',
    tierLabel: 'Tier 2 • Visuals & Copilots',
    tierBadgeColor: 'bg-rose-950/80 text-rose-400 border-rose-800/40',
    icon: Video,
    accentColor: 'text-rose-400',
    activeBg: 'bg-gradient-to-r from-rose-600 to-purple-600',
    activeBorder: 'border-rose-400',
    glowColor: 'shadow-rose-500/30',
    description: 'Consistent character talking avatar agent adhering to the <100 Chars rule and empirical evidence validation.',
    sopRule: 'Rule 13: Enforce <100 chars per speech subtitle chunk for retention.',
    badge: '<100 Chars'
  },
  {
    id: 'telemetry',
    name: '1-Hour Studio Telemetry',
    shortName: 'Telemetry',
    tier: 'tier2',
    tierLabel: 'Tier 2 • Visuals & Copilots',
    tierBadgeColor: 'bg-purple-950/80 text-purple-400 border-purple-800/40',
    icon: Sparkles,
    accentColor: 'text-purple-400',
    activeBg: 'bg-purple-600',
    activeBorder: 'border-purple-400',
    glowColor: 'shadow-purple-500/30',
    description: '1-hour real-time performance telemetry, render pipeline latency monitoring, and stem throughput counters.',
    sopRule: 'Rule 14: Keep audio render latency below 15ms buffer headroom.',
    badge: 'Live'
  },
  {
    id: 'coproducer',
    name: 'Studio Co-Producer Gemini Copilot',
    shortName: 'Co-Producer',
    tier: 'tier2',
    tierLabel: 'Tier 2 • Visuals & Copilots',
    tierBadgeColor: 'bg-teal-950/80 text-teal-400 border-teal-800/40',
    icon: MessageSquare,
    accentColor: 'text-teal-400',
    activeBg: 'bg-teal-600',
    activeBorder: 'border-teal-400',
    glowColor: 'shadow-teal-500/30',
    description: 'Interactive Gemini studio co-producer chatbot for lyric polishing, mixing advice, and viral marketing hooks.',
    sopRule: 'Rule 15: Ground co-producer advice in the 3:1 Sonic Scar framework.',
    badge: 'Gemini'
  },
  {
    id: 'search',
    name: 'Google Search Grounding',
    shortName: 'Search',
    tier: 'tier2',
    tierLabel: 'Tier 2 • Visuals & Copilots',
    tierBadgeColor: 'bg-cyan-950/80 text-cyan-400 border-cyan-800/40',
    icon: Search,
    accentColor: 'text-cyan-400',
    activeBg: 'bg-cyan-600',
    activeBorder: 'border-cyan-400',
    glowColor: 'shadow-cyan-500/30',
    description: 'Real-time Google Search grounding with live web citations, gospel trends, and theological reference validation.',
    sopRule: 'Rule 16: Verify biblical scripture references against standard translations.',
    badge: 'Live Web'
  }
];

export const ALL_STUDIO_NAV_ITEMS = [...TIER_1_NAV_ITEMS, ...TIER_2_NAV_ITEMS];
