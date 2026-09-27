import React, { useState, useEffect } from 'react';
import {
  Film,
  ExternalLink,
  Sparkles,
  Link as LinkIcon,
  Plus,
  Copy,
  CheckCircle,
  HelpCircle,
  Clock,
  Layers,
  Sliders,
  Play,
  RotateCcw,
  Video,
  Share2,
  FolderSync,
  Info,
  ChevronDown,
  ChevronUp,
  Tag,
  Check
} from 'lucide-react';
import { Track, GeneratedVideo, GoogleFlowConfig, UniversalAssetItem } from '../types';

interface GoogleFlowIntegrationHubProps {
  catalogTracks: Track[];
  onAddVideoAsset: (video: GeneratedVideo) => void;
  onOpenAssetEditor?: (asset: UniversalAssetItem, mode: 'edit' | 'add' | 'gemini') => void;
  isDarkMode?: boolean;
}

const DEFAULT_FLOW_CONFIG: GoogleFlowConfig = {
  workspaceUrl: 'https://labs.google/flow',
  totalAllotment: 50,
  usedGenerations: 12,
  renewalPeriod: 'Monthly (Renews on 1st of month)',
  defaultAspectRatio: '9:16',
  connectedAccountEmail: 'Ted.Moyer@gmail.com',
  autoSyncToNextcloud: true
};

export const GoogleFlowIntegrationHub: React.FC<GoogleFlowIntegrationHubProps> = ({
  catalogTracks,
  onAddVideoAsset,
  onOpenAssetEditor,
  isDarkMode = true
}) => {
  // Config state persisted in localStorage
  const [config, setConfig] = useState<GoogleFlowConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('brickos_google_flow_config');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_FLOW_CONFIG;
  });

  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isGuideExpanded, setIsGuideExpanded] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Form states for linking new Google Flow video
  const [linkVideoUrl, setLinkVideoUrl] = useState('');
  const [linkVideoName, setLinkVideoName] = useState('');
  const [linkVideoPrompt, setLinkVideoPrompt] = useState('');
  const [linkTrackId, setLinkTrackId] = useState<string>(catalogTracks[0]?.id || 'mmh');
  const [linkMultiTrackIds, setLinkMultiTrackIds] = useState<string[]>([]);
  const [linkAspectRatio, setLinkAspectRatio] = useState<'9:16' | '16:9'>('9:16');
  const [linkResolution, setLinkResolution] = useState('1080p Vertical HD');
  const [linkDurationSec, setLinkDurationSec] = useState<number>(15);
  const [linkNotes, setLinkNotes] = useState('');
  const [deductAllotment, setDeductAllotment] = useState(true);
  const [mirrorToNextcloud, setMirrorToNextcloud] = useState(true);

  // Flow Prompt Bridge state
  const [selectedPromptTrackId, setSelectedPromptTrackId] = useState<string>(catalogTracks[0]?.id || 'mmh');
  const [promptCameraStyle, setPromptCameraStyle] = useState('Slow cinematic tracking push-in with subtle anamorphic lens flare');
  const [promptLighting, setPromptLighting] = useState('Chiaroscuro volumetric dust motes, 3200K warm tungsten key, deep slate shadow');
  const [promptPacing, setPromptPacing] = useState('Tempo-synced cut points, 24fps cinematic motion blur');

  // Save config
  const saveConfig = (newConfig: GoogleFlowConfig) => {
    setConfig(newConfig);
    try {
      localStorage.setItem('brickos_google_flow_config', JSON.stringify(newConfig));
    } catch (e) {}
  };

  const handleUpdateUsedGenerations = (delta: number) => {
    const updated = {
      ...config,
      usedGenerations: Math.max(0, Math.min(config.totalAllotment, config.usedGenerations + delta))
    };
    saveConfig(updated);
  };

  const handleResetCycle = () => {
    const updated = {
      ...config,
      usedGenerations: 0
    };
    saveConfig(updated);
  };

  // Selected track for prompt bridge
  const selectedTrack = catalogTracks.find(t => t.id === selectedPromptTrackId) || catalogTracks[0];

  // Construct Flow-optimized prompt
  const generatedFlowPrompt = `[GOOGLE FLOW / VEO 3 VIDEO SPEC]
TRACK: "${selectedTrack?.title || 'Studio Track'}" (BPM: ${selectedTrack?.bpm || 120}, Key: ${selectedTrack?.key || 'C#m'})
FORMAT: ${config.defaultAspectRatio === '9:16' ? 'Vertical 9:16 Social Reel / Shorts' : 'Widescreen 16:9 YouTube 4K'}
CAMERA MOVEMENT: ${promptCameraStyle}
LIGHTING & ATMOSPHERE: ${promptLighting}
PACING & CADENCE: ${promptPacing}
SCENE DESCRIPTION: A weathered craftsman with sawdust and cedar shavings on worn denim jacket, reflective contemplative mood standing before a cathedral of timber beams, sunlight breaking through timber rafters, morning haze, hyper-realistic cinematic photorealism, 8k resolution, cinematic grading.`;

  const handleCopyFlowPrompt = () => {
    navigator.clipboard.writeText(generatedFlowPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  const handleOpenGoogleFlow = () => {
    window.open(config.workspaceUrl || 'https://labs.google/flow', '_blank', 'noopener,noreferrer');
  };

  const handleCopyAndLaunchFlow = () => {
    handleCopyFlowPrompt();
    handleOpenGoogleFlow();
  };

  // Toggle multi-track linking
  const handleToggleMultiTrack = (tId: string) => {
    setLinkMultiTrackIds(prev => 
      prev.includes(tId) ? prev.filter(id => id !== tId) : [...prev, tId]
    );
  };

  // Handle saving linked Google Flow video asset
  const handleSaveLinkedVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkVideoUrl.trim() && !linkVideoName.trim()) return;

    const assignedTrack = catalogTracks.find(t => t.id === linkTrackId);
    const videoId = `flow-vid-${Date.now()}`;
    const cleanUrl = linkVideoUrl.trim() || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
    const cleanName = linkVideoName.trim() || `${assignedTrack?.title || 'Track'} - Google Flow Reel`;

    const newVideo: GeneratedVideo = {
      id: videoId,
      name: cleanName,
      operationName: 'google-flow-linked-asset',
      prompt: linkVideoPrompt.trim() || `Generated in Google Flow for "${assignedTrack?.title || 'Project'}"`,
      aspectRatio: linkAspectRatio,
      videoUrl: cleanUrl,
      status: 'ready',
      timestamp: new Date().toISOString(),
      modelUsed: 'Google Flow (Veo / Labs Allotment)',
      trackTitle: assignedTrack?.title || 'Catalog Project',
      trackId: linkTrackId,
      linkedTrackIds: linkMultiTrackIds.length > 0 ? linkMultiTrackIds : [linkTrackId],
      tags: ['google-flow', 'ai-video', 'allotted-generation', linkAspectRatio],
      notes: linkNotes.trim() || `Allotted video generation imported from Google Flow workflow (${linkResolution}).`,
      category: 'Google Flow Reel',
      source: 'google_flow',
      flowAssetUrl: linkVideoUrl.trim(),
      resolution: linkResolution,
      durationSec: linkDurationSec
    };

    // Deduct 1 from allotment if requested
    if (deductAllotment) {
      handleUpdateUsedGenerations(1);
    }

    // Mirror to Nextcloud if requested
    if (mirrorToNextcloud) {
      try {
        const nextcloudAssets = JSON.parse(localStorage.getItem('brickos_nextcloud_assets') || '[]');
        const nextcloudItem = {
          id: `nc-flow-${Date.now()}`,
          name: `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.mp4`,
          category: 'master' as const,
          path: `/Music-Production/Videos/GoogleFlow/${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.mp4`,
          fileSize: `${(linkDurationSec * 1.8).toFixed(1)} MB`,
          lastModified: 'Just now',
          webdavUrl: cleanUrl,
          etag: `"flow-${Date.now()}"`,
          matchedTrackId: linkTrackId,
          linkedTrackIds: linkMultiTrackIds.length > 0 ? linkMultiTrackIds : [linkTrackId],
          status: 'synced',
          source: 'google_flow',
          flowAssetUrl: linkVideoUrl.trim(),
          tags: ['google-flow', 'video-reel', linkAspectRatio]
        };
        localStorage.setItem('brickos_nextcloud_assets', JSON.stringify([nextcloudItem, ...nextcloudAssets]));
      } catch (err) {}
    }

    onAddVideoAsset(newVideo);

    // Reset modal
    setLinkVideoUrl('');
    setLinkVideoName('');
    setLinkVideoPrompt('');
    setLinkNotes('');
    setLinkMultiTrackIds([]);
    setIsLinkModalOpen(false);
  };

  // Seed sample Flow videos if none exist
  const handleSeedSampleFlowVideo = () => {
    const mmhTrack = catalogTracks.find(t => t.id === 'mmh') || catalogTracks[0];
    const sample: GeneratedVideo = {
      id: `flow-sample-${Date.now()}`,
      name: `${mmhTrack?.title || 'Meet Me Here'} - Hook Teaser (Google Flow Allotment #12)`,
      operationName: 'google-flow-linked-asset',
      prompt: 'Cinematic 9:16 portrait of craftsman in Nashville timber workshop with floating cedar dust, dramatic sunlight rays, golden hour, slow motion 24fps',
      aspectRatio: '9:16',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
      status: 'ready',
      timestamp: new Date().toISOString(),
      modelUsed: 'Google Flow (Veo / Labs Allotment)',
      trackTitle: mmhTrack?.title || 'Meet Me Here',
      trackId: mmhTrack?.id || 'mmh',
      linkedTrackIds: ['mmh', 'calvary-grit'],
      tags: ['google-flow', 'allotted-generation', '9:16', 'cinematic'],
      notes: 'Generated using monthly Google Flow allotment (Shot 3 from MMH Storyboard). Linked across Meet Me Here and Calvary Grit.',
      category: 'Google Flow Reel',
      source: 'google_flow',
      resolution: '1080x1920 Vertical HD',
      durationSec: 15
    };
    onAddVideoAsset(sample);
  };

  const remainingGenerations = Math.max(0, config.totalAllotment - config.usedGenerations);
  const percentUsed = Math.min(100, Math.round((config.usedGenerations / Math.max(1, config.totalAllotment)) * 100));

  return (
    <div className="bg-slate-900/95 border border-indigo-500/30 rounded-2xl p-5 space-y-5 shadow-xl relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-gradient-to-br from-indigo-500/10 via-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* HEADER BAR */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-800 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-950/60 border border-indigo-400/30">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Google Flow Video Integration & Asset Hub
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-gradient-to-r from-cyan-950 to-indigo-950 text-cyan-300 border border-cyan-800/50 flex items-center gap-1 shadow-xs">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Allotment Active</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Link your Google Flow workspace, use your allotted video generations, format production prompts, and link video assets to project catalog tracks.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsGuideExpanded(!isGuideExpanded)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700/60 flex items-center gap-1.5 transition cursor-pointer"
            title="Toggle Step-by-Step Google Flow Operating Instructions"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Workflow Guide</span>
            {isGuideExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          <button
            type="button"
            onClick={handleOpenGoogleFlow}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-950 cursor-pointer"
            title="Launch Google Flow in a new companion browser tab"
          >
            <span>Launch Google Flow</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsLinkModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-950 cursor-pointer"
            title="Link a video generated in Google Flow into BrickOS catalog projects"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Link Flow Video Asset</span>
          </button>
        </div>
      </div>

      {/* WORKFLOW GUIDE ACCORDION */}
      {isGuideExpanded && (
        <div className="p-4 bg-slate-950/90 rounded-xl border border-cyan-800/40 space-y-3 text-xs text-slate-300">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-bold text-cyan-300 uppercase tracking-wider font-mono text-[11px] flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>How To Maximize Your Allotted Google Flow Video Generations</span>
            </span>
            <button
              onClick={() => setIsGuideExpanded(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-cyan-400">STEP 1: PREPARE PROMPT</span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Use the Prompt Transfer Bridge below to select your project track. Click <strong>"Copy & Launch Flow"</strong> to copy the engineered camera motion and lighting tokens.
              </p>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-indigo-400">STEP 2: GENERATE IN FLOW</span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                In Google Flow (<code>labs.google/flow</code>), paste the prompt and generate your video using your allotted credits (9:16 vertical for Shorts or 16:9 for YouTube).
              </p>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-amber-400">STEP 3: EXPORT / COPY LINK</span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Click Export in Google Flow to save to Google Drive or copy the MP4 / WebM sharing link to your clipboard.
              </p>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5">
              <span className="text-[10px] font-mono font-bold text-emerald-400">STEP 4: LINK & AUTO-SYNC</span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Click <strong>"+ Link Flow Video Asset"</strong>. Paste the URL, choose the catalog tracks, and BrickOS auto-mirrors the file to Nextcloud <code>/Music-Production/Videos/GoogleFlow/</code>!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2-COLUMN BENTO: ALLOTMENT TRACKER & PROMPT BRIDGE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT: ALLOTMENT & WORKSPACE CONFIG (5 COLS) */}
        <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Google Flow Video Allotment
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingConfig(!isEditingConfig)}
                className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
              >
                {isEditingConfig ? 'Done' : 'Edit Quota'}
              </button>
            </div>

            {/* Quota Progress Bar */}
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono">Generations Remaining:</span>
                <span className="font-mono font-bold text-white text-sm">
                  <span className={remainingGenerations < 5 ? 'text-rose-400' : 'text-emerald-400'}>
                    {remainingGenerations}
                  </span>
                  <span className="text-slate-500 font-normal"> / {config.totalAllotment}</span>
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 flex">
                <div
                  className={`h-full transition-all duration-300 ${
                    percentUsed > 85
                      ? 'bg-rose-500'
                      : percentUsed > 60
                      ? 'bg-amber-500'
                      : 'bg-gradient-to-r from-cyan-500 to-indigo-500'
                  }`}
                  style={{ width: `${percentUsed}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Used: {config.usedGenerations}</span>
                <span>{config.renewalPeriod}</span>
              </div>
            </div>

            {/* Quick Allotment Buttons */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleUpdateUsedGenerations(-1)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs cursor-pointer"
                  title="Subtract 1 used generation (refund/restore 1 credit)"
                >
                  -1
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateUsedGenerations(1)}
                  className="px-2.5 py-1 rounded bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/40 font-mono text-xs font-bold cursor-pointer"
                  title="Add 1 used generation"
                >
                  +1 Used
                </button>
              </div>

              <button
                type="button"
                onClick={handleResetCycle}
                className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                title="Reset used count for new monthly quota cycle"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Reset Cycle</span>
              </button>
            </div>

            {/* Config inputs if editing */}
            {isEditingConfig && (
              <div className="p-3 bg-slate-900/90 rounded-xl border border-indigo-500/40 space-y-2 text-xs">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Total Allotment per Cycle</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={config.totalAllotment}
                    onChange={(e) => saveConfig({ ...config, totalAllotment: parseInt(e.target.value) || 50 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-white font-mono mt-0.5"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Google Flow Workspace URL</label>
                  <input
                    type="text"
                    value={config.workspaceUrl}
                    onChange={(e) => saveConfig({ ...config, workspaceUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-white font-mono mt-0.5"
                    placeholder="https://labs.google/flow"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="auto-sync-nc"
                    checked={config.autoSyncToNextcloud}
                    onChange={(e) => saveConfig({ ...config, autoSyncToNextcloud: e.target.checked })}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600"
                  />
                  <label htmlFor="auto-sync-nc" className="text-[11px] text-slate-300">
                    Auto-mirror linked videos to Nextcloud <code>/Music-Production/Videos/GoogleFlow/</code>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Quick link button or sample seed */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <FolderSync className="w-3 h-3 text-cyan-400" />
              <span>Nextcloud Mirror Active</span>
            </span>
            <button
              type="button"
              onClick={handleSeedSampleFlowVideo}
              className="text-[10px] font-mono text-slate-400 hover:text-cyan-300 underline cursor-pointer"
              title="Add a sample verified Google Flow video asset linked to Meet Me Here"
            >
              + Seed Demo Flow Asset
            </button>
          </div>
        </div>

        {/* RIGHT: PROMPT TRANSFER BRIDGE (7 COLS) */}
        <div className="lg:col-span-7 bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Google Flow Prompt Transfer Bridge
              </h4>
            </div>

            {/* Target Track Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-slate-400">Track:</span>
              <select
                value={selectedPromptTrackId}
                onChange={(e) => setSelectedPromptTrackId(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              >
                {catalogTracks.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Direction Token Configs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-0.5">Camera Movement Token</label>
              <select
                value={promptCameraStyle}
                onChange={(e) => setPromptCameraStyle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-[11px] text-slate-200 font-mono"
              >
                <option value="Slow cinematic tracking push-in with subtle anamorphic lens flare">Slow Tracking Push-in (Intimate)</option>
                <option value="Orbiting 360 camera arc around subject at golden hour">Orbiting 360 Arc (Epic)</option>
                <option value="High-angle dramatic crane descent revealing timber cathedral">High-Angle Crane Descent</option>
                <option value="Handheld 50mm documentary-style subtle breathing motion">Handheld 50mm Documentary</option>
                <option value="Whip-pan transition synced to heavy drum downbeat">Whip-Pan Rhythm Transition</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-0.5">Lighting & Atmosphere Token</label>
              <select
                value={promptLighting}
                onChange={(e) => setPromptLighting(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-[11px] text-slate-200 font-mono"
              >
                <option value="Chiaroscuro volumetric dust motes, 3200K warm tungsten key, deep slate shadow">Chiaroscuro 3200K Warm Tungsten</option>
                <option value="Moody overcast morning haze, diffused Nordic soft light, blue hour">Moody Overcast Diffused Soft Light</option>
                <option value="Neon amber rim-light cutting through heavy studio haze">Neon Amber Rim-light & Studio Haze</option>
                <option value="Golden hour backlight bleeding through pine needles">Golden Hour Pine Backlight</option>
              </select>
            </div>
          </div>

          {/* Generated Prompt Preview */}
          <div className="relative">
            <textarea
              readOnly
              rows={4}
              value={generatedFlowPrompt}
              className="w-full bg-slate-900/90 border border-slate-800/80 rounded-xl p-3 text-[11px] font-mono text-slate-300 focus:outline-none resize-none leading-relaxed select-all"
            />
            {copiedPrompt && (
              <div className="absolute top-3 right-3 bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 shadow-md">
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Copied to Clipboard!</span>
              </div>
            )}
          </div>

          {/* Prompt Action Buttons */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            <span className="text-[10px] font-mono text-slate-400">
              Formatted for Google Flow / Veo 3 video engine
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyFlowPrompt}
                className="px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700/60 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Prompt</span>
              </button>

              <button
                type="button"
                onClick={handleCopyAndLaunchFlow}
                className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-indigo-950 cursor-pointer"
                title="Copies this prompt to your clipboard and opens Google Flow"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                <span>Copy & Launch Flow</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: LINK / IMPORT GOOGLE FLOW VIDEO ASSET */}
      {/* ========================================================================= */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-600 to-indigo-600 text-white">
                  <Film className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Link Google Flow Video Asset</h3>
                  <p className="text-xs text-slate-400">
                    Register a video generated in Google Flow and link it across your BrickOS tracks.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLinkedVideo} className="space-y-4 text-xs">
              {/* Video URL or Google Drive Link */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Google Flow Video URL / Google Drive Share Link / MP4 WebDAV Link *
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://drive.google.com/... or https://labs.google/flow/... or direct MP4 link"
                  value={linkVideoUrl}
                  onChange={(e) => setLinkVideoUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Paste the Google Drive export link from Google Flow, or direct MP4 URL. If empty, a high-definition sample stream is linked.
                </span>
              </div>

              {/* Title / Name */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Video Reel Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MMH - Hook Teaser (Google Flow #1)"
                  value={linkVideoName}
                  onChange={(e) => setLinkVideoName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Primary Track Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Primary Project Track
                  </label>
                  <select
                    value={linkTrackId}
                    onChange={(e) => setLinkTrackId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  >
                    {catalogTracks.map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Aspect Ratio
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setLinkAspectRatio('9:16')}
                      className={`p-2 rounded-xl border text-xs font-mono font-bold transition ${
                        linkAspectRatio === '9:16'
                          ? 'bg-indigo-600 border-indigo-400 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      9:16 Vertical
                    </button>
                    <button
                      type="button"
                      onClick={() => setLinkAspectRatio('16:9')}
                      className={`p-2 rounded-xl border text-xs font-mono font-bold transition ${
                        linkAspectRatio === '16:9'
                          ? 'bg-indigo-600 border-indigo-400 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      16:9 Widescreen
                    </button>
                  </div>
                </div>
              </div>

              {/* Multi-Track Project Reassignment */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Multi-Project Linking (Select all songs sharing this video asset):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800 max-h-32 overflow-y-auto font-mono text-[11px]">
                  {catalogTracks.map(t => {
                    const isLinked = linkMultiTrackIds.includes(t.id) || linkTrackId === t.id;
                    return (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => handleToggleMultiTrack(t.id)}
                        className={`p-1.5 rounded-lg border text-left flex items-center justify-between transition ${
                          isLinked
                            ? 'bg-indigo-950/80 border-indigo-500/60 text-indigo-300 font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="truncate">{t.title}</span>
                        {isLinked && <Check className="w-3 h-3 text-indigo-400 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Prompt used in Google Flow */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Google Flow Prompt Used (Optional, for reference & AI remixing)
                </label>
                <textarea
                  rows={2}
                  placeholder="Paste the prompt you used in Google Flow..."
                  value={linkVideoPrompt}
                  onChange={(e) => setLinkVideoPrompt(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Checkboxes: Deduct Quota & Mirror to Nextcloud */}
              <div className="space-y-2 p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deductAllotment}
                    onChange={(e) => setDeductAllotment(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600"
                  />
                  <span className="text-slate-300">
                    Deduct 1 generation from Google Flow monthly allotment ({remainingGenerations} remaining)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mirrorToNextcloud}
                    onChange={(e) => setMirrorToNextcloud(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600"
                  />
                  <span className="text-slate-300">
                    Auto-mirror to Nextcloud WebDAV (<code>/Music-Production/Videos/GoogleFlow/</code>)
                  </span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold transition shadow-lg shadow-emerald-950 cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register & Link Video Asset</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
