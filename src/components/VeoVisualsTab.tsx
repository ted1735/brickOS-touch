import React, { useState } from 'react';
import {
  Film,
  Sparkles,
  HelpCircle,
  Copy,
  Zap,
  Image as ImageIcon,
  Check,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  Play,
  Download,
  AlertCircle
} from 'lucide-react';
import { Track, GeneratedImage, GeneratedVideo, UniversalAssetItem } from '../types';
import { GoogleFlowIntegrationHub } from './GoogleFlowIntegrationHub';
import { SectionQuickHelpBanner } from './SectionQuickHelpBanner';
import { NIGHTCAFE_DEFAULT_PROMPTS } from '../data/canonicalCatalog';

interface VeoVisualsTabProps {
  tracks: Track[];
  selectedTrack: Track;
  onAddVideoAsset?: (asset: GeneratedVideo) => void;
  onOpenAssetEditor?: (asset: UniversalAssetItem, mode: 'view' | 'edit' | 'add' | 'gemini') => void;
  onOpenSectionGuide?: (sectionId: string) => void;
  isDarkMode?: boolean;
  onCopySuccess?: (msg: string) => void;
}

export const VeoVisualsTab: React.FC<VeoVisualsTabProps> = ({
  tracks,
  selectedTrack,
  onAddVideoAsset,
  onOpenAssetEditor,
  onOpenSectionGuide,
  isDarkMode = true,
  onCopySuccess
}) => {
  // Image Generation States
  const [imagePrompt, setImagePrompt] = useState(
    `Cinematic 9:16 portrait of Ted Moyer, Christian hip-hop producer, moody directional key light, acoustic Nashville studio, 50mm lens, highly detailed textures.`
  );
  const [imageAspectRatio, setImageAspectRatio] = useState('9:16');
  const [imageMode, setImageMode] = useState<'create' | 'edit'>('create');
  const [selectedImageForEdit, setSelectedImageForEdit] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([
    {
      id: 'img-seed-1',
      url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1000&auto=format&fit=crop',
      prompt: 'Cinematic warm acoustic studio control room with analog mixing console and warm amber lamp glow.',
      aspectRatio: '16:9',
      timestamp: '2026-09-20',
      mode: 'create',
      trackTitle: 'Meet Me Here'
    },
    {
      id: 'img-seed-2',
      url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1000&auto=format&fit=crop',
      prompt: 'Vintage studio condenser microphone in dimly lit prayer sanctuary with cinematic rim lighting.',
      aspectRatio: '9:16',
      timestamp: '2026-09-22',
      mode: 'create',
      trackTitle: 'Venom Into Victory'
    }
  ]);

  // Video Generation States
  const [videoPrompt, setVideoPrompt] = useState(
    'Cinematic slow dolly push in toward the vintage microphone as atmospheric haze drifts across the warm studio lights, 4k 24fps.'
  );
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('9:16');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoStatus, setVideoStatus] = useState('');
  const [videoOperationName, setVideoOperationName] = useState('');
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([
    {
      id: 'vid-seed-1',
      operationName: 'operations/veo-seed-sample-01',
      prompt: 'Cinematic slow push in to acoustic guitar on stand in dusty sunlight beam.',
      aspectRatio: '9:16',
      status: 'ready',
      timestamp: '2026-09-24',
      modelUsed: 'veo-3.1-fast-generate-preview',
      trackTitle: 'Meet Me Here',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
    }
  ]);

  // Image Analysis States
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [imageAnalysisResult, setImageAnalysisResult] = useState<string | null>(null);

  // Prompt Vault States
  const [expandedPromptIdx, setExpandedPromptIdx] = useState<number | null>(null);
  const [promptTypeFilter, setPromptTypeFilter] = useState<'all' | 'image' | 'video'>('all');
  const [promptSongFilter, setPromptSongFilter] = useState('All');
  const [promptSearchQuery, setPromptSearchQuery] = useState('');

  const copyToClipboard = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (onCopySuccess) onCopySuccess(`Copied ${label}!`);
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;
    setIsGeneratingImage(true);
    try {
      const res = await fetch('/api/gemini/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt,
          aspectRatio: imageAspectRatio,
          mode: imageMode,
          base64Image: selectedImageForEdit,
          model: 'imagen-3.0-generate-002'
        })
      });
      const data = await res.json();
      if (data.imageUrl) {
        const newImg: GeneratedImage = {
          id: `img-${Date.now()}`,
          url: data.imageUrl,
          prompt: imagePrompt,
          aspectRatio: imageAspectRatio,
          timestamp: new Date().toISOString().split('T')[0],
          mode: imageMode,
          trackTitle: selectedTrack.title
        };
        setGeneratedImages([newImg, ...generatedImages]);
        if (onCopySuccess) onCopySuccess('Visual asset generated successfully!');
      } else {
        if (onCopySuccess) onCopySuccess(data.error || 'Image generation completed.');
      }
    } catch (e: any) {
      if (onCopySuccess) onCopySuccess(`Image Generation Error: ${e.message}`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleGenerateVeoVideo = async () => {
    if (!videoPrompt.trim()) return;
    setIsGeneratingVideo(true);
    setVideoStatus('Initiating Veo 3 render with veo-3.1-fast-generate-preview...');
    try {
      const res = await fetch('/api/gemini/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: videoPrompt,
          aspectRatio: videoAspectRatio,
          resolution: '720p'
        })
      });
      const data = await res.json();
      if (data.operationName) {
        setVideoOperationName(data.operationName);
        setVideoStatus(`Rendering video job: ${data.operationName}. Polling...`);

        const newVid: GeneratedVideo = {
          id: `vid-${Date.now()}`,
          operationName: data.operationName,
          prompt: videoPrompt,
          aspectRatio: videoAspectRatio,
          status: 'pending',
          timestamp: new Date().toISOString().split('T')[0],
          modelUsed: data.modelUsed || 'veo-3.1-fast-generate-preview',
          trackTitle: selectedTrack.title
        };
        setGeneratedVideos([newVid, ...generatedVideos]);
        if (onAddVideoAsset) onAddVideoAsset(newVid);
      } else {
        setVideoStatus(data.error || 'Video request initiated.');
      }
    } catch (err: any) {
      setVideoStatus(`Veo Request: ${err.message}`);
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  return (
    <div className="space-y-4">
      {onOpenSectionGuide && (
        <SectionQuickHelpBanner
          sectionId="veo_visuals"
          onOpenModalGuide={onOpenSectionGuide}
          isDarkMode={isDarkMode}
        />
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Film className="w-5 h-5 text-rose-400" />
              <span>Visual & Veo 3 Video Studio</span>
            </h3>
            <p className="text-xs text-slate-400">
              Create & edit album art with Imagen 3 / Gemini, and generate cinematic 9:16 video reels using Google Veo 3.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onOpenSectionGuide && (
              <button
                type="button"
                onClick={() => onOpenSectionGuide('veo_visuals')}
                className="px-3.5 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 text-xs font-bold border border-amber-700/50 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                title="Open Visuals & Veo 3 Operating Guide & SOP Rules"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>How To Use Veo Visuals</span>
              </button>
            )}
          </div>
        </div>

        {/* DEDICATED GOOGLE FLOW INTEGRATION & ASSET HUB */}
        <GoogleFlowIntegrationHub
          catalogTracks={tracks}
          onAddVideoAsset={onAddVideoAsset || (() => {})}
          onOpenAssetEditor={onOpenAssetEditor || (() => {})}
          isDarkMode={isDarkMode}
        />

        {/* PROMPT VAULT & STORYBOARD ENGINE */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Master Visual & Video Prompt Vault ({NIGHTCAFE_DEFAULT_PROMPTS.length} Prompts Loaded)
              </h4>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="bg-slate-900 border border-slate-800 p-0.5 rounded-lg flex items-center gap-1 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={() => setPromptTypeFilter('all')}
                  className={`px-2 py-0.5 rounded ${promptTypeFilter === 'all' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  All Types
                </button>
                <button
                  type="button"
                  onClick={() => setPromptTypeFilter('image')}
                  className={`px-2 py-0.5 rounded ${promptTypeFilter === 'image' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Images
                </button>
                <button
                  type="button"
                  onClick={() => setPromptTypeFilter('video')}
                  className={`px-2 py-0.5 rounded ${promptTypeFilter === 'video' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Videos
                </button>
              </div>

              <input
                type="text"
                placeholder="Search prompts (e.g. hands, rain)..."
                value={promptSearchQuery}
                onChange={(e) => setPromptSearchQuery(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono w-48"
              />
            </div>
          </div>

          {/* Filtered Prompts List */}
          <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {NIGHTCAFE_DEFAULT_PROMPTS
              .filter((p) => {
                const matchesSong = promptSongFilter === 'All' || p.song === promptSongFilter;
                const matchesType = promptTypeFilter === 'all' || (p.type || 'image') === promptTypeFilter;
                const matchesQuery = !promptSearchQuery ||
                  p.title.toLowerCase().includes(promptSearchQuery.toLowerCase()) ||
                  p.prompt.toLowerCase().includes(promptSearchQuery.toLowerCase());
                return matchesSong && matchesType && matchesQuery;
              })
              .map((p, idx) => (
                <div key={idx} className="p-3 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl space-y-2 transition text-xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-[12px]">{p.title}</span>
                      <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 font-mono text-[9px] border border-blue-800/40">
                        {p.song}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[9px]">
                        {p.aspectRatio || '9:16'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setImagePrompt(p.prompt);
                          if (p.aspectRatio) setImageAspectRatio(p.aspectRatio);
                          copyToClipboard(p.prompt, "Prompt loaded to Image Studio");
                        }}
                        className="px-2 py-1 rounded bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/50 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        <Zap className="w-3 h-3 text-amber-300" />
                        <span>⚡ Load Image</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setVideoPrompt(p.prompt);
                          if (p.aspectRatio === '9:16' || p.aspectRatio === '16:9') {
                            setVideoAspectRatio(p.aspectRatio);
                          }
                          copyToClipboard(p.prompt, "Prompt loaded to Veo Studio");
                        }}
                        className="px-2 py-1 rounded bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-700/50 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        <Film className="w-3 h-3 text-rose-400" />
                        <span>🎬 Load Video</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => copyToClipboard(p.prompt, `Prompt: ${p.title}`)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 font-mono leading-relaxed line-clamp-3">
                    {p.prompt}
                  </p>
                </div>
              ))}
          </div>
        </div>

        {/* Visual Generation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Creator */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                <span>Create & Edit Images (Imagen 3 / Gemini)</span>
              </h4>
            </div>

            <textarea
              rows={3}
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder="Describe the image or cover art..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            />

            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Aspect:</span>
                {['1:1', '9:16', '16:9'].map(ratio => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setImageAspectRatio(ratio)}
                    className={`px-2 py-1 rounded text-xs font-bold font-mono transition cursor-pointer ${
                      imageAspectRatio === ratio ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleGenerateImage}
                disabled={isGeneratingImage || !imagePrompt.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-md"
              >
                {isGeneratingImage ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{isGeneratingImage ? 'Generating Image...' : 'Generate Image'}</span>
              </button>
            </div>

            {/* Generated Image Previews */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
              {generatedImages.map(img => (
                <div key={img.id} className="relative rounded-xl overflow-hidden border border-slate-800 group">
                  <img src={img.url} alt={img.prompt} className="w-full h-32 object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition p-2 flex flex-col justify-end text-[10px] text-white">
                    <p className="line-clamp-2 font-mono">{img.prompt}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Veo 3 Video Creator */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Film className="w-4 h-4 text-rose-400" />
                <span>Google Veo 3 Video Studio</span>
              </h4>
              <span className="text-[10px] font-mono text-rose-300 bg-rose-950 px-2 py-0.5 rounded border border-rose-800/40">
                veo-3.1-preview
              </span>
            </div>

            <textarea
              rows={3}
              value={videoPrompt}
              onChange={(e) => setVideoPrompt(e.target.value)}
              placeholder="Describe cinematic motion, camera movement, and lighting..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
            />

            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Aspect:</span>
                {(['9:16', '16:9'] as const).map(ratio => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setVideoAspectRatio(ratio)}
                    className={`px-2 py-1 rounded text-xs font-bold font-mono transition cursor-pointer ${
                      videoAspectRatio === ratio ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleGenerateVeoVideo}
                disabled={isGeneratingVideo || !videoPrompt.trim()}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-md"
              >
                {isGeneratingVideo ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Film className="w-3.5 h-3.5" />}
                <span>{isGeneratingVideo ? 'Rendering Video...' : 'Render Veo 3 Reel'}</span>
              </button>
            </div>

            {videoStatus && (
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-mono">
                {videoStatus}
              </div>
            )}

            {/* Generated Video Previews */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
              {generatedVideos.map(vid => (
                <div key={vid.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>{vid.modelUsed}</span>
                    <span className="text-emerald-400 font-bold">{vid.status}</span>
                  </div>
                  <p className="text-[11px] text-slate-200 line-clamp-2">{vid.prompt}</p>
                  {vid.videoUrl && (
                    <video src={vid.videoUrl} controls className="w-full rounded-lg max-h-36 object-cover" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
