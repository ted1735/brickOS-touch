import React, { useState } from 'react';
import {
  HelpCircle,
  X,
  BookOpen,
  Layers,
  FileText,
  Sliders,
  Volume2,
  Film,
  Share2,
  Music,
  Clapperboard,
  Sparkles,
  Zap,
  Video,
  HardDrive,
  Database,
  Activity,
  Bot,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Search,
  Copy,
  Columns
} from 'lucide-react';

export type StudioSectionId =
  | 'kanban'
  | 'lyrics'
  | 'mixer'
  | 'mastering'
  | 'youtube'
  | 'omnipost'
  | 'ministry'
  | 'veo_visuals'
  | 'prompt_library'
  | 'nightcafe'
  | 'video_express'
  | 'nextcloud_sync'
  | 'database'
  | 'telemetry'
  | 'coproducer'
  | 'search'
  | 'version-matrix';

interface SectionInstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSection?: StudioSectionId;
  onNavigateToSection?: (sectionId: StudioSectionId) => void;
  isDarkMode?: boolean;
}

export interface SectionGuideItem {
  id: StudioSectionId;
  title: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  summary: string;
  purpose: string;
  keySteps: string[];
  bestPractices: string[];
  sopRules: string[];
  relatedTabs: StudioSectionId[];
}

export const SECTION_GUIDES: Record<StudioSectionId, SectionGuideItem> = {
  kanban: {
    id: 'kanban',
    title: 'Master Kanban Dashboard',
    badge: 'Production Pipeline',
    icon: Layers,
    summary: 'The central hub for tracking songs across all 7 stages of record production, from initial theological concept to final streaming release.',
    purpose: 'Visualize where every song in the catalog sits in the pipeline, advance or retrograde statuses, filter by EP, and initiate new projects with standard schemas.',
    keySteps: [
      'Select an EP filter (e.g. EP 1: Restoration, EP 2: Conflict Suite) or view ALL tracks.',
      'Click on any song card to make it the active studio track across all workspaces.',
      'Use the Left/Right arrow buttons on cards to advance tracks across the 7 stages: Idea -> Lyrics Finalized -> In Progress -> UVR5 Stem Prep -> Audio Master -> Distribution Ready -> Released.',
      'Click "+ New Project" to launch the standardized song creation wizard with pre-populated 4-phase storyboards and Suno v5.5 parameters.'
    ],
    bestPractices: [
      'Keep no more than 3 tracks in "Audio Master" simultaneously to prevent mastering bottlenecks.',
      'Verify that a track has linked UVR5 vocal stems before moving to "Audio Master".'
    ],
    sopRules: [
      'Every newly created track baseline starts at v1.0 standard schema.',
      'Statuses persist immediately to Firebase Firestore and local offline storage.'
    ],
    relatedTabs: ['lyrics', 'mixer', 'nextcloud_sync', 'database']
  },
  lyrics: {
    id: 'lyrics',
    title: 'Lyric Engine & Suno v5.5 Studio',
    badge: 'Songwriting & SOP',
    icon: FileText,
    summary: 'Craft theological lyrics with real-time cliché audits, throne room pivot validation, and Suno v5.5 prompt compilation.',
    purpose: 'Draft, revise, and audit song lyrics against Nashville Christian / Country SOP rules, increment versions (+0.1), and generate AI musical generation blocks.',
    keySteps: [
      'Edit lyrics in the primary editor. The engine audits banned clichés in real time.',
      'Click "Run Theological AI Audit" to evaluate Throne Room Pivots and Sonic Scar ratios.',
      'Click "Save Snapshot (+0.1)" to create an immutable checkpoint with reason notes.',
      'Configure Suno v5.5 4-Block parameters (Style, Voice Archetype, BPM, Key) and click "Copy Suno Prompt".',
      'Click "Nashville SOP Rules (.md)" to inspect or adjust banned phrases and required theological tags.'
    ],
    bestPractices: [
      'Ensure the Bridge contains a Throne Room Pivot transitioning from human weakness to divine sovereignty.',
      'Maintain the 3:1 Sonic Scar rule (3 parts raw human labor or fatigue to 1 part triumphant resolve).'
    ],
    sopRules: [
      'Never commit lyrics that contain banned Christianese clichés (e.g. "let go and let God", "seasons").',
      'Every AI audit or manual checkpoint increments track version by strictly +0.1.'
    ],
    relatedTabs: ['kanban', 'mixer', 'coproducer']
  },
  mixer: {
    id: 'mixer',
    title: 'Mini-DAW Multi-Stem Mixer',
    badge: 'Audio Engineering',
    icon: Sliders,
    summary: 'Interactive 4-stem mixing console for previewing linear PCM WAV files, UVR5 isolated vocals, harmonies, and click tracks.',
    purpose: 'Audition stems in real time, adjust levels, solo/mute tracks, test pan balance, and inspect waveform frequencies.',
    keySteps: [
      'Click the Master Play button to start the multi-stem audio synthesizer engine.',
      'Adjust track faders (Master Instrumental, Dry Vocal, Harmonies, Click/Atmosphere).',
      'Use Solo (S) and Mute (M) buttons to isolate individual stem channels.',
      'Tweak Pan sliders (-50 Left to +50 Right) to check stereo placement.',
      'Observe the real-time HTML5 Canvas waveform oscilloscope for clipping or DC offset.'
    ],
    bestPractices: [
      'Keep the Master Instrumental around -3dB below the vocal stem to ensure lyrical intelligibility.',
      'Always solo the Dry Vocal to listen for artifacting from AI stem isolation tools.'
    ],
    sopRules: [
      'Reference linear PCM 24-bit/48kHz stems stored on Nextcloud WebDAV folder 207332.',
      'Ensure mono-compatibility before exporting mixes.'
    ],
    relatedTabs: ['mastering', 'nextcloud_sync', 'lyrics']
  },
  mastering: {
    id: 'mastering',
    title: 'Mastering & A/B Phase Audit',
    badge: 'Quality Control',
    icon: Volume2,
    summary: 'Mastering compliance suite testing integrated loudness (-12 LUFS), true peak limits, and mobile phone mono-collapse.',
    purpose: 'Validate tracks against commercial streaming loudness targets and ensure phase coherence on smartphone speakers.',
    keySteps: [
      'Switch between Master, Suno Raw, Vocal, Instrumental, and Reference audio busses.',
      'Toggle "Mono Collapse" to test how the track sounds on phone speakers and small smart devices.',
      'Review the integrated LUFS loudness meter (Target: -12.0 LUFS, Ceiling: -1.0 dBTP).',
      'Check the Phase Correlation Meter (+1.0 is pure mono, 0.0 to +0.8 is healthy stereo, negative indicates phase cancellation).'
    ],
    bestPractices: [
      'If mono collapse loses the lead vocal, apply an 80Hz subtractive high-pass filter and narrow stereo widening.',
      'Use 5-10% parallel Vox Smash compression for vocal punch in modern worship mixes.'
    ],
    sopRules: [
      'Streaming masters must never exceed -1.0 dB True Peak to prevent lossy codec inter-sample clipping.'
    ],
    relatedTabs: ['mixer', 'telemetry', 'youtube']
  },
  youtube: {
    id: 'youtube',
    title: 'YouTube SEO Lens',
    badge: 'Distribution SEO',
    icon: Film,
    summary: '2026 YouTube SEO optimization engine generating high-intent titles, descriptions with timestamps, and algorithmic tags.',
    purpose: 'Maximize organic discoverability on YouTube and YouTube Music through metadata adhering to 2026 SEO guidelines.',
    keySteps: [
      'Verify title is under 60 characters with the primary keyword in the first 40 characters.',
      'Generate or edit the 300-500 word description including theological story and credits.',
      'Ensure chapter timestamps start strictly at 0:00 (e.g. 0:00 Intro, 0:45 Verse 1, etc.).',
      'Review the 10-15 high-intent tags and click "Copy All SEO Metadata" for one-click upload.'
    ],
    bestPractices: [
      'Place streaming and church licensing links (CCLI/SongSelect) in the first 3 lines of the description.',
      'Include the exact vocal cast name in tags to drive algorithmic artist associations.'
    ],
    sopRules: [
      'No keyword stuffing in descriptions. Use natural storytelling paragraphs.'
    ],
    relatedTabs: ['omnipost', 'prompt_library', 'video_express']
  },
  omnipost: {
    id: 'omnipost',
    title: 'OmniPost Social Engine',
    badge: 'Audience Rollout',
    icon: Share2,
    summary: 'Cross-platform short-form content scheduler optimized for TikTok, Instagram Reels, and YouTube Shorts.',
    purpose: 'Generate 60-second vertical social hooks, devotional captions, and schedule morning algorithmic rollouts.',
    keySteps: [
      'Select a platform target (TikTok, Reels, Shorts, X, Threads).',
      'Choose a rollout hook angle (Devotional, Studio Behind-The-Scenes, Lyric Breakdown, Vocal Solo).',
      'Click "Generate Algorithmic Post" to produce tailored copy with platform-specific hashtags.',
      'Schedule release during the peak devotional window: 6:00 AM - 9:00 AM local time.'
    ],
    bestPractices: [
      'Always start with a 3-second visual or auditory pattern interrupt.',
      'End social captions with a question that encourages theological commentary.'
    ],
    sopRules: [
      'All social video cuts must reference vertical 9:16 assets from the studio.'
    ],
    relatedTabs: ['youtube', 'video_express', 'veo_visuals']
  },
  ministry: {
    id: 'ministry',
    title: 'Live Ministry Charts & Worship',
    badge: 'Church & Ministry',
    icon: Music,
    summary: 'Church worship leading suite with chord transposition, Nashville Number System, scripture references, and prayer cues.',
    purpose: 'Equip church worship teams and prayer leaders with transposable charts and synchronized chord progressions.',
    keySteps: [
      'Transpose chords into any key (C, D, E, F, G, A, B) or switch to Nashville Numbers (1, 4, 5, 6m).',
      'Toggle metronome audio click with visual flashing downbeat indicator.',
      'Inspect scripture anchor texts and theology thesis notes for the worship leader.',
      'Click "Export Chord Chart" for PDF/print or ProPresenter copy.'
    ],
    bestPractices: [
      'Provide Nashville Numbers so multi-instrumentalists can shift keys spontaneously.',
      'Rehearse the bridge dynamic swell with the acoustic guitar and vocal lead.'
    ],
    sopRules: [
      'Ensure every song is tagged with CCLI/SongSelect licensing metadata.'
    ],
    relatedTabs: ['lyrics', 'kanban']
  },
  veo_visuals: {
    id: 'veo_visuals',
    title: 'Visuals & Veo 3 Video Studio',
    badge: 'AI Media & Google Flow Hub',
    icon: Clapperboard,
    summary: 'Generate high-fidelity album art (1:1) and vertical promotional videos (9:16) using Google Veo, Gemini image preview models, and link allotted Google Flow video generation workflows.',
    purpose: 'Create visual assets for single covers, lyric backdrops, and promotional motion teasers, with full Google Flow video asset import & cross-project linking.',
    keySteps: [
      'Google Flow Integration: Connect your Google Flow workspace (labs.google/flow) and track allotted monthly video generations.',
      'Prompt Transfer Bridge: Select project track and click "Copy & Launch Flow" to export camera motion and lighting tokens formatted for Google Flow.',
      'Generate & Export in Flow: Create cinematic 9:16 vertical reels using your allotted Flow credits and export to Google Drive or copy the MP4 link.',
      'Link Video Asset: Click "+ Link Flow Video Asset", paste the URL, assign primary and multi-track projects, and auto-mirror to Nextcloud /Music-Production/Videos/GoogleFlow/.',
      'Veo 3 In-App Engine: Or select Aspect Ratio (1:1 for Artwork, 9:16 for Shorts, 16:9 for YouTube) and generate directly with Veo 3.',
      'Audit with Gemini: Click "Analyze (Pro)" for a Gemini Pro Vision theological and lighting audit.'
    ],
    bestPractices: [
      'Format prompts with camera tokens (e.g. "slow cinematic tracking push-in", "chiaroscuro 3200K tungsten") to guide Google Flow video generators.',
      'Use 9:16 vertical video assets for TikTok, Instagram Reels, and YouTube Shorts promo cuts.',
      'Deduct video generation credits in the Allotment Tracker to maintain accurate monthly quota tracking.'
    ],
    sopRules: [
      'Images must be saved at full resolution and linked to Nextcloud Folder 207332.',
      'All Google Flow video generations must be tagged with their source prompt and linked to at least one active catalog track.',
      'Video assets linked from Google Flow should be auto-mirrored to /Music-Production/Videos/GoogleFlow/ for distribution.'
    ],
    relatedTabs: ['prompt_library', 'video_express', 'nightcafe', 'nextcloud_sync']
  },
  prompt_library: {
    id: 'prompt_library',
    title: 'Universal Prompt Engineering Library',
    badge: 'Tri-Modal Storyboard',
    icon: Sparkles,
    summary: 'Master prompt catalog managing Image, Video (Veo/Grok), and Audio (Suno v5.5) prompts across all songs, including the 30-shot MMH storyboard.',
    purpose: 'Standardize prompt design, explore the 4-phase cinematic storyboard pipeline, and copy production prompts across models.',
    keySteps: [
      'Filter prompts by Song (All, Meet Me Here, Calvary Grit, etc.) and Type (Image, Video, Audio).',
      'Search prompt tokens with full-text search (e.g. "Kintsugi", "sawdust", "chiaroscuro").',
      'Explore the 4 Storyboard Phases: 1. Curiosity Hook, 2. Grinding Striving, 3. Throne Room Pivot, 4. Surrender Victory.',
      'Click "Copy Prompt" on any card to use in Midjourney, Veo 3, Suno, or NightCafe.'
    ],
    bestPractices: [
      'Include camera motion tokens (e.g. "slow dramatic push-in 0.5% scale/sec") for video engines.',
      'Shield prompts with negative tokens against cartoon/CGI artifacts.'
    ],
    sopRules: [
      'All prompt updates should be tied to a specific song package and revision.'
    ],
    relatedTabs: ['veo_visuals', 'video_express', 'nightcafe']
  },
  nightcafe: {
    id: 'nightcafe',
    title: 'NightCafe Studio Bulk Queue',
    badge: 'Batch Rendering',
    icon: Zap,
    summary: 'Batch prompt dispatching engine for Google Veo and Flux Dev models on NightCafe Studio.',
    purpose: 'Queue up multi-scene prompt sets and export structured JSON for high-throughput batch generation.',
    keySteps: [
      'Review the pre-loaded 12 cinematic scenes for active songs.',
      'Click "⚡ Copy JSON for NightCafe" to copy the entire queue array in standard JSON format.',
      'Paste into NightCafe Studio bulk queue or automation runner.',
      'Save finished renders back into the Nextcloud asset repository.'
    ],
    bestPractices: [
      'Group scenes by visual aesthetic to maintain batch continuity.',
      'Use uniform aspect ratios across each batch.'
    ],
    sopRules: [
      'Maintain scene numbering matching the lyric timestamps.'
    ],
    relatedTabs: ['prompt_library', 'video_express', 'veo_visuals']
  },
  video_express: {
    id: 'video_express',
    title: 'VideoExpress.ai Talking Avatar Agent',
    badge: 'Consistent Avatar',
    icon: Video,
    summary: 'Full implementation of strontiumplatform/VideoExpress.ai: 60-second vertical talking-avatar reels with reference face locking and <100 chars rule.',
    purpose: 'Produce realistic talking avatar videos with guaranteed lip-sync stability, Workflow Factory styles, and deterministic Evidence Table verification.',
    keySteps: [
      'Open the "How To Create" tab for step-by-step walkthrough or click "▶ Run In-App Production" for automated generation.',
      'Choose a character preset (e.g. The Nashville Engineer) and ensure Reference Seed is locked (e.g. #428901).',
      'Under "Timeline", click "Generate Script from Track" to auto-split narrative into lines < 100 characters.',
      'Explore "Workflow Factory" to switch between 6 styles (Talking Avatar, 3D Pixar, UGC Devotional, Vox Documentary, etc.).',
      'Inspect "Automation DOM" for verified Playwright selectors or copy "SYSTEM_PROMPT.md" for autonomous agent driving.',
      'Verify the "Evidence Table" gate before syncing final MP4 to Nextcloud Folder 207332.'
    ],
    bestPractices: [
      'Never allow any spoken line to exceed 100 characters; this prevents neural lip-sync drifting.',
      'Apply 0.25s dead-air trimming to clip heads and tails for high-retention vertical pacing.'
    ],
    sopRules: [
      '100% of clips must be accounted for in the Evidence Table before marking complete.',
      'Character reference seed must be pinned.'
    ],
    relatedTabs: ['prompt_library', 'nextcloud_sync', 'omnipost']
  },
  nextcloud_sync: {
    id: 'nextcloud_sync',
    title: 'Nextcloud Matcher & WebDAV Sync',
    badge: 'Cloud Storage',
    icon: HardDrive,
    summary: 'Bento-grid file management and asset matching engine bound to nextcloud.brickmoyer.com / Folder 207332 (/Music-Production).',
    purpose: 'Bridge local audio stems, WAV files, and project documents with live Nextcloud WebDAV storage without needing external file transfer tools.',
    keySteps: [
      'Inspect connection telemetry and ping latency to nextcloud.brickmoyer.com.',
      'Browse detected files in Folder 207332 (/Music-Production).',
      'Use the Smart Matcher to automatically link stems (e.g. UVR5 vocals, masters) to their corresponding studio tracks.',
      'Copy curl, rclone, or Windows drive mount commands to sync multi-gigabyte audio folders directly into your local DAW.'
    ],
    bestPractices: [
      'Mount Nextcloud as a local drive using rclone for real-time drag-and-drop DAW editing.',
      'Organize stems into standardized subfolders (/WAV-Stems, /UVR5-Vocals, /Artwork).'
    ],
    sopRules: [
      'Nextcloud Folder 207332 is the canonical home for all master binary files.',
      'App passwords should be used for WebDAV authentication.'
    ],
    relatedTabs: ['kanban', 'mixer', 'database']
  },
  database: {
    id: 'database',
    title: 'Master Catalog & Asset Cross-Matching Matrix',
    badge: 'Harmonic & Asset Matrix',
    icon: Database,
    summary: 'Dynamic Camelot harmonic key analyzer, BPM compatibility matcher, vocal archetype pairing engine, and Nextcloud WebDAV stem resolution hub.',
    purpose: 'Identify compatible songs for seamless DJ transitions, mashups, stem sharing, and export full catalog JSON backups with instant document graph synchronization.',
    keySteps: [
      'Select any reference track to automatically rank all 25 other catalog songs by compatibility score.',
      'Inspect Harmonic Match (Camelot Wheel: 100% exact key lock, 95% relative major/minor, 90% adjacent 5th modulation).',
      'Inspect Tempo Match (Direct stem drop at ±3 BPM, pitch-shiftable at ±6 BPM, or half/double-time pocket).',
      'Audition matched stems together using the built-in Web Audio player.',
      'Click "Link Asset" to establish cross-catalog stem sharing relationships in the interchangeable asset pool.',
      'Click "Download .json Backup" to export the entire 26-song catalog graph and WebDAV manifest.'
    ],
    bestPractices: [
      'Use relative major/minor (e.g. 7A D minor with 7B F Major) to create emotionally resonant transitions between songs.',
      'Half-time/double-time matching allows blending 75 BPM boom-bap tracks with 150 BPM trap-worship tracks without tempo distortion.'
    ],
    sopRules: [
      'Never force stems into a mix with >6 BPM difference without time-stretching.',
      'All master audio stems and visual assets resolve to Nextcloud WebDAV root /Music-Production.'
    ],
    relatedTabs: ['kanban', 'nextcloud_sync', 'mixer']
  },
  telemetry: {
    id: 'telemetry',
    title: '1h Telemetry & Survival Loop',
    badge: 'Audience Metrics',
    icon: Activity,
    summary: 'Algorithmic performance auditor tracking early 1-hour view velocity, 3-second retention, and completion rates.',
    purpose: 'Determine whether to scale winning creative concepts or immediately archive underperforming assets.',
    keySteps: [
      'Review T+60m inbound telemetry cards for recently released tracks.',
      'Check 3-second retention rate (Threshold: >=65% to pass).',
      'Check 60-second completion rate (Threshold: >=70% triggers 10s video extensions).',
      'Trigger automated AI actions: winning concepts generate sequels; failing concepts log weak hooks.'
    ],
    bestPractices: [
      'Audit the first 3 seconds of any video that fails the 65% retention threshold.',
      'Double down on visual motifs that achieve >70% completion rates.'
    ],
    sopRules: [
      'Never run paid amplification on videos that fail the organic 3s retention audit.'
    ],
    relatedTabs: ['youtube', 'omnipost', 'video_express']
  },
  coproducer: {
    id: 'coproducer',
    title: 'Studio Co-Producer AI (Gemini)',
    badge: 'AI Assistant',
    icon: Bot,
    summary: 'Real-time studio AI songwriting mentor powered by Gemini 3.1 Pro, specialized in BrickOS v10 SOP, Conversational Poetics, 4-Block Suno prompts, and audio engineering.',
    purpose: 'Collaborate with your Co-Producer to develop lyrics, enforce the Christianese filter, structure 4-Block Suno generation prompts, and troubleshoot arrangement.',
    keySteps: [
      'Select a Co-Producer Role: 1. Elite Nashville Producer & Mentor (BrickOS v10), 2. Senior Mastering Engineer, 3. Social Media Strategist.',
      'Click "Gem Instructions & SOP" to inspect or edit your custom Gemini Gem prompt directives.',
      'Type your question or song coaching query regarding the currently selected track.',
      'Receive deep reasoning feedback referencing the active song’s BPM, key, and BrickOS v10 guidelines.',
      'Copy 4-Block Suno prompts or lyric revisions directly into the Lyric Studio.'
    ],
    bestPractices: [
      'Enforce Conversational Poetics: strictly replace tired Christianese religious tropes with authentic human vulnerability.',
      'Ask the Co-Producer to formulate standard 4-block Suno prompt architecture with character audit ceilings.'
    ],
    sopRules: [
      'Adhere to the BrickOS v10 Official SOP: OBI Funnel, Conversational Poetics, Throne Room Pivot, and 3:1 Sonic Scar rule.'
    ],
    relatedTabs: ['lyrics', 'mastering', 'kanban']
  },
  search: {
    id: 'search',
    title: 'Google Search Grounding',
    badge: 'Live Market Intel',
    icon: Search,
    summary: 'Real-time web research engine powered by gemini-3.8-flash with Google Search grounding tool.',
    purpose: 'Retrieve verified real-time Billboard Christian & Gospel chart trends, Nashville production techniques, BPM ranges, and scripture cross-references.',
    keySteps: [
      'Enter a search query (e.g. "Current top 10 Christian Hip Hop tracks tempo and 808 style 2026").',
      'Hit Enter or click "Search Google Grounding" to trigger live retrieval.',
      'Review the synthesized answer grounded with live web information.',
      'Inspect the verified source URLs and citations provided at the bottom of the answer.',
      'Copy findings directly into the Lyrics, Suno prompts, or SEO metadata tabs.'
    ],
    bestPractices: [
      'Use specific queries referencing year, genre, and technical parameters (e.g. "2026 Christian Rap vocal chain").',
      'Click through to source citations to verify primary Billboard and industry data.'
    ],
    sopRules: [
      'Ground theological assertions against standard scripture references.',
      'Verify commercial production claims against documented audio engineering standards.'
    ],
    relatedTabs: ['coproducer', 'lyrics', 'youtube']
  },
  'version-matrix': {
    id: 'version-matrix',
    title: 'Song Version Matrix (3-Way Stacking)',
    badge: 'Version Compare',
    icon: Columns,
    summary: 'Direct 3-way side-by-side song version comparison matrix with synchronized scrolling, raw markdown editing, and structured arrangement card views.',
    purpose: 'Compare drafts, revisions, and master takes across production stages, evaluate lyrical iterations, and copy structured markdown instantly.',
    keySteps: [
      'Select a song from the catalog dropdown or edit the 3 stacked versions directly.',
      'Toggle "Sync Scroll" to keep all 3 columns aligned during deep lyric comparison.',
      'Switch between "Raw Editor" and "Arrangement Cards" to inspect structured bracketed sections.',
      'Edit version tags and contents in real-time or copy any column directly to your clipboard.'
    ],
    bestPractices: [
      'Use bracket notation like [Verse 1], [Chorus], [Bridge] to generate arrangement cards.',
      'Keep column 1 for early drafts, column 2 for rewrites, and column 3 for master takes.'
    ],
    sopRules: [
      'Ensure lyrical edits preserve theological integrity across iterations.',
      'Verify vocal delivery cues and BPM notes are documented in the master column.'
    ],
    relatedTabs: ['lyrics', 'database', 'kanban']
  }
};

export const SectionInstructionModal: React.FC<SectionInstructionModalProps> = ({
  isOpen,
  onClose,
  initialSection = 'kanban',
  onNavigateToSection,
  isDarkMode = true
}) => {
  const [selectedSection, setSelectedSection] = useState<StudioSectionId>(initialSection);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Update selected section if initialSection changes when opening
  React.useEffect(() => {
    if (isOpen) {
      setSelectedSection(initialSection);
    }
  }, [isOpen, initialSection]);

  if (!isOpen) return null;

  const currentGuide = SECTION_GUIDES[selectedSection] || SECTION_GUIDES.kanban;
  const IconComponent = currentGuide.icon;

  // Filter sections by search query
  const filteredSections = Object.values(SECTION_GUIDES).filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.badge.toLowerCase().includes(q) ||
      item.summary.toLowerCase().includes(q) ||
      item.purpose.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-5xl max-h-[90vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          isDarkMode
            ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-indigo-950/40'
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/60'
        }`}
      >
        {/* MODAL HEADER */}
        <div className={`p-4 sm:px-6 sm:py-4 flex items-center justify-between border-b ${
          isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black tracking-wide">
                  brickOS Studio Guide & SOP Handbook
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  Interactive Help
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Detailed instructions, step-by-step workflows, and Nashville SOP rules for every studio section.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition cursor-pointer ${
              isDarkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-600'
            }`}
            title="Close Guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY (TWO COLUMN: SECTIONS LIST + DETAILED GUIDE) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* LEFT SIDEBAR: ALL SECTIONS */}
          <div className={`w-full md:w-72 border-b md:border-b-0 md:border-r flex flex-col shrink-0 ${
            isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/80 border-slate-200'
          }`}>
            {/* Search Box */}
            <div className="p-3 border-b border-slate-800/80">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter sections..."
                  className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-xs font-sans transition focus:outline-hidden ${
                    isDarkMode
                      ? 'bg-slate-900 border border-slate-800 text-white placeholder:text-slate-500'
                      : 'bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400'
                  }`}
                />
              </div>
            </div>

            {/* Sections Nav List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1 max-h-48 md:max-h-none">
              {filteredSections.map((item) => {
                const ItemIcon = item.icon;
                const isSelected = selectedSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedSection(item.id)}
                    className={`w-full p-2.5 rounded-xl text-left text-xs transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50 font-bold'
                        : isDarkMode
                        ? 'hover:bg-slate-900 text-slate-300 hover:text-white'
                        : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <ItemIcon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-indigo-400'}`} />
                      <span className="truncate">{item.title}</span>
                    </div>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${
                      isSelected
                        ? 'bg-indigo-700 border-indigo-400 text-indigo-100'
                        : isDarkMode
                        ? 'bg-slate-900 border-slate-800 text-slate-400'
                        : 'bg-slate-200 border-slate-300 text-slate-600'
                    }`}>
                      {item.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT CONTENT: SELECTED SECTION DETAILED INSTRUCTIONS */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-6">
            {/* Guide Header */}
            <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-800/80">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white flex items-center gap-2">
                      <span>{currentGuide.title}</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                        {currentGuide.badge}
                      </span>
                    </h4>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  {currentGuide.summary}
                </p>
              </div>

              {onNavigateToSection && (
                <button
                  onClick={() => {
                    onNavigateToSection(currentGuide.id);
                    onClose();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-indigo-950/40"
                >
                  <span>Go to This Section</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Purpose & Core Concept */}
            <div className={`p-4 rounded-xl border space-y-1.5 ${
              isDarkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Primary Purpose & Role</span>
              </h5>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {currentGuide.purpose}
              </p>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="space-y-2.5">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Step-by-Step Operating Workflow</span>
              </h5>
              <div className="space-y-2">
                {currentGuide.keySteps.map((step, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border flex items-start gap-3 transition ${
                      isDarkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Two Column Grid: Best Practices & Nashville SOP Rules */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Best Practices */}
              <div className={`p-4 rounded-xl border space-y-2 ${
                isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <h5 className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wide">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Studio Best Practices</span>
                </h5>
                <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside leading-relaxed">
                  {currentGuide.bestPractices.map((bp, i) => (
                    <li key={i}>{bp}</li>
                  ))}
                </ul>
              </div>

              {/* Nashville SOP Rules */}
              <div className={`p-4 rounded-xl border space-y-2 ${
                isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <h5 className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 uppercase tracking-wide">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Nashville SOP Rule Enforcement</span>
                </h5>
                <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside leading-relaxed">
                  {currentGuide.sopRules.map((sop, i) => (
                    <li key={i}>{sop}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Related Sections Navigation */}
            {currentGuide.relatedTabs.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-400">
                <span className="font-mono text-[11px]">Related Sections:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {currentGuide.relatedTabs.map((relId) => {
                    const relGuide = SECTION_GUIDES[relId];
                    if (!relGuide) return null;
                    return (
                      <button
                        key={relId}
                        onClick={() => setSelectedSection(relId)}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                          isDarkMode
                            ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                            : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900'
                        }`}
                      >
                        <span>{relGuide.title}</span>
                        <ChevronRight className="w-3 h-3 text-slate-500" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className={`px-6 py-3 flex items-center justify-between border-t text-xs ${
          isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-mono text-[11px]">Nashville BRICK Records Standard Operating Procedures (SOP v1.9)</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
