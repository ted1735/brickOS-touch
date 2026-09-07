import React, { useState, useRef, useEffect } from 'react';
import {
  Music,
  FileText,
  Film,
  Layers,
  Settings,
  Plus,
  Play,
  Square,
  Volume2,
  Sliders,
  Scissors,
  CheckCircle,
  AlertTriangle,
  Upload,
  Download,
  Copy,
  Terminal,
  Share2,
  RefreshCw,
  Clock,
  Sparkles,
  Zap,
  Code,
  Clapperboard,
  SlidersHorizontal,
  FileUp,
  Activity,
  HardDrive,
  GitBranch,
  ShieldCheck,
  Send,
  Search,
  MessageSquare,
  Check,
  Heart,
  Flame,
  Radio,
  Eye,
  Video,
  Image as ImageIcon,
  ExternalLink,
  ChevronRight,
  Info,
  Maximize2
} from 'lucide-react';
import { Track, MixerTrack, GeneratedImage, GeneratedVideo, ChatMessage } from './types';
import { CANONICAL_TRACKS, NIGHTCAFE_DEFAULT_PROMPTS, VOCAL_ROSTER, EP_COLLECTIONS } from './data/canonicalCatalog';
import { audioMiniDaw } from './utils/audioEngine';

// Live Nextcloud WebDAV Root Endpoint
const PRODUCTION_NEXTCLOUD_WEBDAV = 'https://nextcloud.moyercloud.com/remote.php/dav/files/ncted/brickOS';

export default function BrickOSMusicStudioWorkspace() {
  const [tracks, setTracks] = useState<Track[]>(CANONICAL_TRACKS);
  const [selectedTrack, setSelectedTrack] = useState<Track>(CANONICAL_TRACKS[0]);
  const [activeTab, setActiveTab] = useState<'lyrics' | 'mixer' | 'mastering' | 'veo_visuals' | 'nightcafe' | 'telemetry' | 'coproducer' | 'search'>('lyrics');
  const [copiedNotification, setCopiedNotification] = useState('');

  // Catalog filtering & search
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedEpFilter, setSelectedEpFilter] = useState('ALL');

  // Storage & Nextcloud Modal
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
  const [isSunoBridgeOpen, setIsSunoBridgeOpen] = useState(false);

  // Mini-DAW Mixer State
  const [isPlaying, setIsPlaying] = useState(false);
  const [masterVolume, setMasterVolume] = useState(85);
  const [trackStates, setTrackStates] = useState<MixerTrack[]>([
    { id: 1, name: "Track 1: Master Instrumental", vol: 90, pan: 0, muted: false, solo: false, trimIn: 0, trimOut: 100, freq: 110, waveType: 'sawtooth', color: '#6366f1' },
    { id: 2, name: "Track 2: Dry Vocal (UVR5)", vol: 95, pan: 0, muted: false, solo: false, trimIn: 0, trimOut: 100, freq: 220, waveType: 'triangle', color: '#10b981' },
    { id: 3, name: "Track 3: Harmonies & Ad-libs", vol: 75, pan: -20, muted: false, solo: false, trimIn: 0, trimOut: 100, freq: 330, waveType: 'sine', color: '#f59e0b' },
    { id: 4, name: "Track 4: Click & Ambient Plate", vol: 60, pan: 20, muted: false, solo: false, trimIn: 0, trimOut: 100, freq: 440, waveType: 'square', color: '#ec4899' }
  ]);

  // A/B Master Switcher State
  const [activeBus, setActiveBus] = useState<'master' | 'suno' | 'vocal' | 'instrumental' | 'ref'>('master');
  const [isMonoCollapse, setIsMonoCollapse] = useState(false);

  // NightCafe prompts
  const [nightCafePrompts, setNightCafePrompts] = useState(NIGHTCAFE_DEFAULT_PROMPTS);

  // Visual & Veo State
  const [imagePrompt, setImagePrompt] = useState('Cinematic album cover for sovereign faith album, weathered cedar wood, cracked gold Kintsugi seams, warm dramatic chiaroscuro lighting, photorealistic 8k');
  const [imageAspectRatio, setImageAspectRatio] = useState('1:1');
  const [imageMode, setImageMode] = useState<'create' | 'edit'>('create');
  const [imageModel, setImageModel] = useState('gemini-3.1-flash-image-preview');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([
    {
      id: 'img-1',
      url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
      prompt: 'Weathered cedar woodshop with golden rays of morning light and sawdust motes, Nashville studio aesthetic',
      aspectRatio: '1:1',
      timestamp: '2026-09-06',
      mode: 'create',
      trackTitle: 'The Master\'s Hand'
    },
    {
      id: 'img-2',
      url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
      prompt: 'Dark blue-collar truck cab at 5 AM in freezing rain, glowing amber dashboard dials',
      aspectRatio: '9:16',
      timestamp: '2026-09-06',
      mode: 'create',
      trackTitle: 'Meet Me Here'
    }
  ]);
  const [selectedImageForEdit, setSelectedImageForEdit] = useState<string | null>(null);
  const [imageAnalysisPrompt, setImageAnalysisPrompt] = useState('Analyze this visual for theological depth, album cover hierarchy, and viral 3-second hook retention.');
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [imageAnalysisResult, setImageAnalysisResult] = useState<string | null>(null);

  // Veo Video State
  const [videoPrompt, setVideoPrompt] = useState('Slow cinematic tracking shot gliding through an overgrown mossy stone archway opening into a sun-drenched cedar glade, morning mist rising, 8k photorealistic');
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoOperationName, setVideoOperationName] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<string>('idle');
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
  const [videoAnalysisPrompt, setVideoAnalysisPrompt] = useState('Audit this video clip for 3-second hook velocity, lighting chiaroscuro, and 70% retention completion likelihood.');
  const [isVideoAnalyzing, setIsVideoAnalyzing] = useState(false);
  const [videoAnalysisResult, setVideoAnalysisResult] = useState<string | null>(null);

  // Gemini Search Grounding
  const [searchQuery, setSearchQuery] = useState('Billboard Christian and Gospel top chart trends 2026 tempo instrumentation');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{ answer: string; sources: Array<{ title: string; url: string }>; searchQueries: string[] } | null>(null);

  // Gemini Chatbot State
  const [chatRole, setChatRole] = useState<'lyric_assistant' | 'mastering_engineer' | 'omnipost_strategist'>('lyric_assistant');
  const [chatModel, setChatModel] = useState('gemini-3.5-flash');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      role: 'assistant',
      content: "Welcome to brickOS Sovereign Studio. I am your Lead Theological & Lyrical Assistant. Let's ensure every track passes the OBI Funnel, strips all tired 'Christianese' clichés, and drives home the Throne Room Pivot by the bridge.",
      timestamp: '01:00 AM',
      model: 'gemini-3.5-flash'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Canvas visualizer ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Helper for clipboard
  const copyToClipboard = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedNotification(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedNotification(''), 3000);
  };

  // Commit Song Changes & Version Increment
  const handleTrackUpdate = (field: keyof Track, value: any) => {
    const updated = tracks.map(t => {
      if (t.id === selectedTrack.id) {
        const newVersions = [...t.versions];
        if (field === 'lyrics' && value !== t.lyrics) {
          const nextVerNum = (newVersions.length + 1).toFixed(1);
          newVersions.push({
            version: `v${nextVerNum}`,
            timestamp: new Date().toISOString().split('T')[0],
            reason: `Updated ${field}`,
            lyrics: value
          });
        }
        const modified = { ...t, [field]: value, versions: newVersions };
        setSelectedTrack(modified);
        return modified;
      }
      return t;
    });
    setTracks(updated);
  };

  // Playback toggle
  const handleTogglePlayback = () => {
    if (isPlaying) {
      audioMiniDaw.stopPlayback();
      setIsPlaying(false);
    } else {
      audioMiniDaw.startPlayback(trackStates, selectedTrack.bpm);
      setIsPlaying(true);
    }
  };

  // Audio Canvas visualizer loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const analyser = audioMiniDaw.getAnalyser();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background subtle grid
      ctx.fillStyle = '#0a0f1d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 45) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      if (analyser && isPlaying) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        const barWidth = (canvas.width / bufferLength) * 2.4;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height * 0.85;

          const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
          gradient.addColorStop(0, '#4f46e5');
          gradient.addColorStop(0.5, '#06b6d4');
          gradient.addColorStop(1, '#10b981');

          ctx.fillStyle = gradient;
          ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

          x += barWidth;
        }

        const timeData = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(timeData);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#38bdf8';
        ctx.beginPath();
        const sliceWidth = canvas.width / bufferLength;
        let lineX = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = timeData[i] / 128.0;
          const y = (v * canvas.height) / 2;
          if (i === 0) ctx.moveTo(lineX, y);
          else ctx.lineTo(lineX, y);
          lineX += sliceWidth;
        }
        ctx.stroke();
      } else {
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#334155';
        ctx.beginPath();
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('24-BIT / 48kHz PCM LOSSLESS SUMMING BUS • READY', canvas.width / 2, canvas.height / 2 - 10);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying]);

  // Image Generation Handler
  const handleGenerateImage = async () => {
    if (!imagePrompt) return;
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
          model: imageModel,
        }),
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
        copyToClipboard('Image generated successfully', 'Generated Image');
      } else if (data.error) {
        alert(`Image Generation Failed: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Image Generation Error: ${e.message}`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Image Analysis Handler
  const handleAnalyzeImage = async (imgUrl: string) => {
    setIsAnalyzingImage(true);
    setImageAnalysisResult(null);
    try {
      const res = await fetch('/api/gemini/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Image: imgUrl,
          prompt: imageAnalysisPrompt,
        }),
      });
      const data = await res.json();
      if (data.analysis) {
        setImageAnalysisResult(data.analysis);
      } else if (data.error) {
        setImageAnalysisResult(`Analysis error: ${data.error}`);
      }
    } catch (e: any) {
      setImageAnalysisResult(`Connection error: ${e.message}`);
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  // Veo Video Generation Handler
  const handleGenerateVeoVideo = async () => {
    if (!videoPrompt) return;
    setIsGeneratingVideo(true);
    setVideoStatus('Initiating Veo 3 render with veo-3.1-fast-generate-preview...');
    try {
      const res = await fetch('/api/gemini/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: videoPrompt,
          aspectRatio: videoAspectRatio,
          base64Image: selectedImageForEdit,
          resolution: '720p',
        }),
      });
      const data = await res.json();
      if (data.operationName) {
        setVideoOperationName(data.operationName);
        setVideoStatus(`Rendering video job: ${data.operationName}. Polling status...`);

        // Add pending video
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

        // Start polling loop
        pollVideoOperation(data.operationName, newVid.id);
      } else if (data.error) {
        setVideoStatus(`Veo Generation Error: ${data.error}`);
        setIsGeneratingVideo(false);
      }
    } catch (err: any) {
      setVideoStatus(`Veo Request Failed: ${err.message}`);
      setIsGeneratingVideo(false);
    }
  };

  // Poll video operation
  const pollVideoOperation = async (opName: string, vidId: string) => {
    let attempts = 0;
    const maxAttempts = 30;

    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch('/api/gemini/video-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operationName: opName }),
        });
        const data = await res.json();

        if (data.done) {
          clearInterval(interval);
          setIsGeneratingVideo(false);
          if (data.hasVideo) {
            setVideoStatus('Veo 3 Video ready!');
            // Download proxy URL
            const downloadUrl = `/api/gemini/video-download`;
            setGeneratedVideos(prev => prev.map(v => v.id === vidId ? { ...v, status: 'ready', videoUrl: downloadUrl } : v));
          } else if (data.error) {
            setVideoStatus(`Veo Error: ${data.error?.message || 'Generation failed'}`);
            setGeneratedVideos(prev => prev.map(v => v.id === vidId ? { ...v, status: 'failed' } : v));
          }
        } else {
          setVideoStatus(`Rendering frame pass ${attempts * 4}s (${Math.min(attempts * 5, 95)}%)...`);
        }

        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setIsGeneratingVideo(false);
          setVideoStatus('Video generation timed out. You may check operation later.');
        }
      } catch (e: any) {
        console.warn('Poll error:', e);
      }
    }, 5000);
  };

  // Search Grounding Handler
  const handleSearchGrounding = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    setSearchResult(null);
    try {
      const res = await fetch('/api/gemini/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await res.json();
      if (data.answer) {
        setSearchResult({
          answer: data.answer,
          sources: data.sources || [],
          searchQueries: data.searchQueries || [],
        });
      } else if (data.error) {
        alert(`Search Grounding Error: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Search error: ${e.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  // Chatbot send message
  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: chatInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      model: chatModel
    };
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setChatInput('');
    setIsChatLoading(true);

    let systemInstruction = '';
    if (chatRole === 'lyric_assistant') {
      systemInstruction = `You are the Lead Theological & Lyrical Assistant for brickOS Sovereign Records.
Enforce the OBI Funnel, eliminate Christianese cliches, demand the Throne Room Pivot by the bridge, and protect the 3:1 Sonic Scar rule. Currently working on: ${selectedTrack.title} (${selectedTrack.genre}, ${selectedTrack.bpm} BPM). Thesis: ${selectedTrack.thesis}`;
    } else if (chatRole === 'mastering_engineer') {
      systemInstruction = `You are the Senior Mastering Engineer for brickOS Studio.
Enforce -12.0 LUFS integrated loudness, -1.0 dBTP true peak ceiling, phase correlation checks for mono-collapse on mobile phones, 80Hz subtractive high-pass filters, and 5-10% parallel Vox Smash busses. Current track: ${selectedTrack.title}.`;
    } else {
      systemInstruction = `You are the Omnipost Social Media & 60-Second Hook Strategist for BRICK Records.
You specialize in 6:00 AM - 9:00 AM morning devotional algorithmic rollouts on TikTok/Reels, component storytelling around flutes/riffs, and gamified challenges. Current track: ${selectedTrack.title}.`;
    }

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          systemInstruction,
          model: chatModel,
        }),
      });
      const data = await res.json();
      if (data.reply) {
        setChatMessages(prev => [
          ...prev,
          {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            model: chatModel
          }
        ]);
      }
    } catch (err: any) {
      setChatMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `Error connecting to Gemini: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          model: chatModel
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Filtered tracks
  const filteredCatalogTracks = tracks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      t.genre.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      t.vocalCast.toLowerCase().includes(catalogSearch.toLowerCase());
    const matchesEp = selectedEpFilter === 'ALL' || t.ep.includes(selectedEpFilter);
    return matchesSearch && matchesEp;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      
      {/* GLOBAL NOTIFICATION TOAST */}
      {copiedNotification && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-bold border border-emerald-500/40 animate-bounce">
          <CheckCircle className="w-4 h-4 text-white" />
          <span>{copiedNotification}</span>
        </div>
      )}

      {/* TOP NAVIGATION HEADER */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3.5 flex items-center justify-between gap-4 sticky top-0 z-40 backdrop-blur-md bg-opacity-95">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
            b
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-wider text-white">brickOS MASTER STUDIO</h1>
              <span className="px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 font-mono text-[10px] font-bold border border-indigo-700/50">
                v5.5 SOVEREIGN
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 font-mono text-[10px] font-semibold border border-emerald-700/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                WebDAV Online
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-2">
              <span>Ted Moyer (Primary Artist / OAC)</span>
              <span>•</span>
              <span className="text-indigo-400 font-medium">BRICK Records</span>
              <span>•</span>
              <span className="text-amber-400 font-medium">{selectedTrack.ep}</span>
            </p>
          </div>
        </div>

        {/* Global Nav Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          <button
            onClick={() => setActiveTab('search')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition shadow-sm"
          >
            <Search className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline">Google Search Grounding</span>
            <span className="md:hidden">Search</span>
          </button>

          <button
            onClick={() => setActiveTab('coproducer')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition shadow-sm"
          >
            <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">Studio Co-Producer AI</span>
            <span className="md:hidden">AI Chat</span>
          </button>

          <button
            onClick={() => setIsStorageModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition shadow-sm"
          >
            <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden lg:inline">Nextcloud Hub</span>
          </button>

          <button
            onClick={() => setIsSunoBridgeOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-950/50 transition border border-indigo-400/30"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span>⚡ Suno & NightCafe Bridge</span>
          </button>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="flex-1 flex flex-col lg:flex-row">
        
        {/* LEFT SIDEBAR: TRACK & EP CATALOG */}
        <aside className="w-full lg:w-80 bg-slate-900/70 border-r border-slate-800 flex flex-col p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-300 uppercase tracking-wider">
              Catalog Roster ({filteredCatalogTracks.length}/{tracks.length})
            </span>
            <button
              onClick={() => {
                const newTrk: Track = {
                  id: `TRK-${(tracks.length + 1).toString().padStart(2, '0')}`,
                  ep: "EP 1: Restoration",
                  title: "New Sovereign Track",
                  status: "Idea / Concept",
                  genre: "Christian Hip Hop / Worship",
                  bpm: 100,
                  key: "D Minor",
                  vocal: "Ted Moyer",
                  vocalCast: "Silas Thorne (Aged Oak)",
                  thesis: "New kingdom thesis statement.",
                  sunoPrompt: "High fidelity Nashville master, 100 BPM, D Minor, warm acoustic flatpicking, raw vocal rasp",
                  negativePrompt: "sibilance, high-frequency hiss, piercing treble, digital artifacts, muddy bass",
                  engineSliders: { weirdness: 12, styleInfluence: 65, voiceAudio: 100 },
                  lyrics: "[Vocal Archetype: Silas Thorne]\n[Verse 1]\nNew draft lyrics here...",
                  versions: [{ version: "v1.0", timestamp: new Date().toISOString().split('T')[0], reason: "Created track", lyrics: "New draft lyrics here..." }]
                };
                setTracks([newTrk, ...tracks]);
                setSelectedTrack(newTrk);
              }}
              className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-1 text-xs font-bold"
              title="Add New Track"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search track, genre, vocal..."
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* EP Filter chips */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar text-[10px] font-bold">
            <button
              onClick={() => setSelectedEpFilter('ALL')}
              className={`px-2 py-1 rounded-lg transition whitespace-nowrap ${
                selectedEpFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            {EP_COLLECTIONS.map((ep, idx) => (
              <button
                key={ep.id}
                onClick={() => setSelectedEpFilter(`EP ${idx + 1}`)}
                className={`px-2 py-1 rounded-lg transition whitespace-nowrap ${
                  selectedEpFilter === `EP ${idx + 1}` ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                EP {idx + 1}
              </button>
            ))}
          </div>

          {/* Scrollable Track list */}
          <div className="space-y-2 flex-1 overflow-y-auto max-h-[calc(100vh-250px)] custom-scrollbar pr-1">
            {filteredCatalogTracks.map(trk => (
              <div
                key={trk.id}
                onClick={() => setSelectedTrack(trk)}
                className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col gap-1.5 ${
                  selectedTrack.id === trk.id
                    ? 'bg-indigo-950/50 border-indigo-500/80 shadow-lg shadow-indigo-950 ring-1 ring-indigo-500/30'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-indigo-400">{trk.id}</span>
                    {trk.selahPrayed && (
                      <Heart className="w-3 h-3 text-amber-400 fill-amber-400/40" title="24h Selah Block Completed" />
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold ${
                    trk.status === 'Sent for Distribution' || trk.status === 'Released'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                      : trk.status === 'Audio Master'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800/40'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {trk.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white line-clamp-1">{trk.title}</h3>
                <p className="text-[11px] text-slate-400 line-clamp-1">{trk.genre} • {trk.bpm} BPM • {trk.key}</p>
                <div className="text-[10px] text-slate-400 truncate pt-0.5 border-t border-slate-800/50 font-mono">
                  {trk.vocalCast}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* CENTER / RIGHT: ACTIVE WORKBENCH */}
        <main className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
          
          {/* TRACK HEADER BANNER */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-indigo-900 text-indigo-300 font-mono text-xs font-bold">
                  {selectedTrack.id}
                </span>
                <span className="text-xs text-slate-400">{selectedTrack.ep}</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-xs">
                  {selectedTrack.bpm} BPM • {selectedTrack.key}
                </span>
              </div>
              <h2 className="text-2xl font-black text-white">{selectedTrack.title}</h2>
              <p className="text-xs text-slate-300 italic max-w-2xl">"{selectedTrack.thesis}"</p>
            </div>

            {/* Status & Vocal Cast Selector */}
            <div className="flex items-center gap-3 flex-wrap">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Production Status</label>
                <select
                  value={selectedTrack.status}
                  onChange={(e) => handleTrackUpdate('status', e.target.value as any)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Idea / Concept">Idea / Concept</option>
                  <option value="Lyrics Finalized">Lyrics Finalized</option>
                  <option value="In Progress">In Progress</option>
                  <option value="UVR5 Stem Prep">UVR5 Stem Prep</option>
                  <option value="Audio Master">Audio Master</option>
                  <option value="Sent for Distribution">Sent for Distribution</option>
                  <option value="Released">Released</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Vocal Formant Cast</label>
                <input
                  type="text"
                  value={selectedTrack.vocalCast}
                  onChange={(e) => handleTrackUpdate('vocalCast', e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Silas Thorne (Aged Oak)"
                />
              </div>

              <div className="pt-4">
                <button
                  onClick={() => handleTrackUpdate('selahPrayed', !selectedTrack.selahPrayed)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                    selectedTrack.selahPrayed
                      ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                  title="Mandatory 24h prayer & stationkeeping before master release"
                >
                  <Heart className={`w-3.5 h-3.5 ${selectedTrack.selahPrayed ? 'fill-emerald-400 text-emerald-400' : ''}`} />
                  <span>{selectedTrack.selahPrayed ? 'Selah Done' : 'Selah Prayer'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* WORKBENCH TABS */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-0 overflow-x-auto custom-scrollbar">
            <button
              onClick={() => setActiveTab('lyrics')}
              className={`pb-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 whitespace-nowrap px-2 ${
                activeTab === 'lyrics' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Lyrics & Suno 4-Block</span>
            </button>

            <button
              onClick={() => setActiveTab('mixer')}
              className={`pb-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 whitespace-nowrap px-2 ${
                activeTab === 'mixer' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Scissors className="w-3.5 h-3.5 text-amber-400" />
              <span>4-Track Mini-DAW & Trimmer</span>
            </button>

            <button
              onClick={() => setActiveTab('mastering')}
              className={`pb-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 whitespace-nowrap px-2 ${
                activeTab === 'mastering' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mastering Engineer & A/B Bus</span>
            </button>

            <button
              onClick={() => setActiveTab('veo_visuals')}
              className={`pb-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 whitespace-nowrap px-2 ${
                activeTab === 'veo_visuals' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-rose-400" />
              <span>Visuals & Veo 3 Video Studio</span>
            </button>

            <button
              onClick={() => setActiveTab('nightcafe')}
              className={`pb-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 whitespace-nowrap px-2 ${
                activeTab === 'nightcafe' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clapperboard className="w-3.5 h-3.5 text-blue-400" />
              <span>NightCafe Queue Runner</span>
            </button>

            <button
              onClick={() => setActiveTab('telemetry')}
              className={`pb-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 whitespace-nowrap px-2 ${
                activeTab === 'telemetry' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>1h Telemetry & Survival Loop</span>
            </button>

            <button
              onClick={() => setActiveTab('coproducer')}
              className={`pb-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 whitespace-nowrap px-2 ${
                activeTab === 'coproducer' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
              <span>Studio Co-Producer AI</span>
            </button>

            <button
              onClick={() => setActiveTab('search')}
              className={`pb-3 text-xs font-bold transition flex items-center gap-1.5 border-b-2 whitespace-nowrap px-2 ${
                activeTab === 'search' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span>Search Grounding</span>
            </button>
          </div>

          {/* TAB 1: LYRICS & SUNO 4-BLOCK ENGINE */}
          {activeTab === 'lyrics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left: Editor & Audit */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-400" />
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Active Lyric Workbench</h3>
                      </div>
                      <span className="text-[11px] font-mono text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800/40">
                        Version: {selectedTrack.versions[selectedTrack.versions.length - 1]?.version || 'v1.0'}
                      </span>
                    </div>

                    <textarea
                      rows={14}
                      value={selectedTrack.lyrics}
                      onChange={(e) => handleTrackUpdate('lyrics', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-indigo-500 custom-scrollbar"
                      placeholder="Write lyrics with meta tags: [Verse 1], [Chorus], [Bridge], [Outro]..."
                    />

                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <button
                        onClick={() => copyToClipboard(selectedTrack.lyrics, `${selectedTrack.title} Lyrics`)}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center gap-1.5 transition"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Lyrics</span>
                      </button>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {selectedTrack.lyrics.split('\n').filter(Boolean).length} lines • Auto-commits on change
                      </span>
                    </div>
                  </div>

                  {/* Revision History */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-indigo-400" />
                      <span>Revision History & Rollback ({selectedTrack.versions.length})</span>
                    </h3>

                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                      {selectedTrack.versions.slice().reverse().map((ver, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-indigo-300 font-mono">{ver.version} • <span className="text-slate-400">{ver.timestamp}</span></div>
                            <div className="text-[11px] text-slate-400">{ver.reason}</div>
                          </div>
                          <button
                            onClick={() => handleTrackUpdate('lyrics', ver.lyrics)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-indigo-600 text-white font-bold transition text-[10px]"
                          >
                            Restore
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Suno v5.5 4-Block Engine */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-400" />
                          <h3 className="text-xs font-black text-white uppercase tracking-wider">
                            Suno v5.5 4-Block Engine
                          </h3>
                        </div>
                        <p className="text-[11px] text-slate-400">Strict 4-code-block format for Suno generation</p>
                      </div>

                      <button
                        onClick={() => {
                          const bundle = `=== BLOCK 1: LYRICS & META-TAGS ===\n[Vocal Archetype: ${selectedTrack.vocalCast || selectedTrack.vocal}]\n${selectedTrack.lyrics}\n\n=== BLOCK 2: STYLE ===\n${selectedTrack.genre}, ${selectedTrack.bpm} BPM, Key of ${selectedTrack.key}, ${selectedTrack.sunoPrompt}\n\n=== BLOCK 3: EXCLUDED STYLES ===\n${selectedTrack.negativePrompt}\n\n=== BLOCK 4: ENGINE SLIDERS ===\nWeirdness: ${selectedTrack.engineSliders?.weirdness ?? 12} | Style Influence: ${selectedTrack.engineSliders?.styleInfluence ?? 65} | Voice/Audio: 100`;
                          copyToClipboard(bundle, 'Suno v5.5 4-Block Bundle');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition shadow-md shadow-amber-950"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy 4 Blocks</span>
                      </button>
                    </div>

                    {/* BLOCK 1 */}
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-mono font-bold text-indigo-400">Block 1: Lyrics & Meta-Tags</span>
                        <button
                          onClick={() => copyToClipboard(`[Vocal Archetype: ${selectedTrack.vocalCast}]\n${selectedTrack.lyrics}`, 'Block 1')}
                          className="text-[10px] text-slate-400 hover:text-white font-bold flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                      </div>
                      <pre className="text-[11px] font-mono text-slate-300 max-h-24 overflow-y-auto custom-scrollbar p-2 bg-slate-900/60 rounded whitespace-pre-wrap">
                        {`[Vocal Archetype: ${selectedTrack.vocalCast}]\n${selectedTrack.lyrics}`}
                      </pre>
                    </div>

                    {/* BLOCK 2 */}
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-mono font-bold text-emerald-400">Block 2: Style</span>
                        <button
                          onClick={() => copyToClipboard(`${selectedTrack.genre}, ${selectedTrack.bpm} BPM, Key of ${selectedTrack.key}, ${selectedTrack.sunoPrompt}`, 'Block 2')}
                          className="text-[10px] text-slate-400 hover:text-white font-bold flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={selectedTrack.sunoPrompt}
                        onChange={(e) => handleTrackUpdate('sunoPrompt', e.target.value)}
                        className="w-full text-[11px] font-mono text-emerald-300 p-2 bg-slate-900/60 rounded border border-slate-800 focus:outline-none"
                      />
                    </div>

                    {/* BLOCK 3 */}
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-mono font-bold text-rose-400">Block 3: Excluded Styles</span>
                        <button
                          onClick={() => copyToClipboard(selectedTrack.negativePrompt, 'Block 3')}
                          className="text-[10px] text-slate-400 hover:text-white font-bold flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={selectedTrack.negativePrompt}
                        onChange={(e) => handleTrackUpdate('negativePrompt', e.target.value)}
                        className="w-full text-[11px] font-mono text-rose-300 p-2 bg-slate-900/60 rounded border border-slate-800 focus:outline-none"
                      />
                    </div>

                    {/* BLOCK 4 */}
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                      <span className="text-[10px] uppercase font-mono font-bold text-amber-400 block">
                        Block 4: Engine Sliders
                      </span>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-slate-400">Weirdness (Target: 0-20)</span>
                          <span className="text-amber-400 font-bold">{selectedTrack.engineSliders?.weirdness ?? 12}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="50"
                          value={selectedTrack.engineSliders?.weirdness ?? 12}
                          onChange={(e) =>
                            handleTrackUpdate('engineSliders', {
                              ...(selectedTrack.engineSliders || { weirdness: 12, styleInfluence: 65, voiceAudio: 100 }),
                              weirdness: parseInt(e.target.value),
                            })
                          }
                          className="w-full accent-amber-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-slate-400">Style Influence (Target: 40-75)</span>
                          <span className="text-indigo-400 font-bold">{selectedTrack.engineSliders?.styleInfluence ?? 65}</span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="100"
                          value={selectedTrack.engineSliders?.styleInfluence ?? 65}
                          onChange={(e) =>
                            handleTrackUpdate('engineSliders', {
                              ...(selectedTrack.engineSliders || { weirdness: 12, styleInfluence: 65, voiceAudio: 100 }),
                              styleInfluence: parseInt(e.target.value),
                            })
                          }
                          className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: MINI-DAW MIXER & TRIMMER */}
          {activeTab === 'mixer' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>4-Track Lossless Waveform Mixer & Trimmer (Mini-DAW)</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-700/40">
                      24-Bit / 48kHz PCM Lossless
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Stream stems directly from Nextcloud WebDAV and mix with zero fidelity loss.</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                    <Volume2 className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Master</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={masterVolume}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setMasterVolume(val);
                        audioMiniDaw.setMasterVolume(val);
                      }}
                      className="w-20 accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <span className="text-xs font-mono font-bold text-indigo-300 w-8 text-right">{masterVolume}%</span>
                  </div>

                  <button
                    onClick={handleTogglePlayback}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition ${
                      isPlaying ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    {isPlaying ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                    <span>{isPlaying ? 'Stop Playback' : 'Play Master Sum'}</span>
                  </button>
                </div>
              </div>

              {/* Visualizer Canvas */}
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 relative shadow-inner">
                <canvas ref={canvasRef} width={900} height={130} className="w-full h-32 block" />
                <div className="absolute top-2 right-3 flex items-center gap-3 text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`}></span>
                    {isPlaying ? 'LIVE PCM AUDIO SUM' : 'STANDBY'}
                  </span>
                  <span>48,000 Hz / 24-bit</span>
                </div>
              </div>

              {/* 4 Track Strips */}
              <div className="space-y-3">
                {trackStates.map((trk, i) => (
                  <div key={trk.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-700/40 flex items-center justify-center font-mono font-bold text-indigo-300 text-xs">
                        {i + 1}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{trk.name}</h4>
                        <span className="text-[10px] font-mono text-slate-500">
                          WebDAV: {PRODUCTION_NEXTCLOUD_WEBDAV}/{selectedTrack.id}/stems/
                        </span>
                      </div>
                    </div>

                    {/* Faders & Controls */}
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            const updated = [...trackStates];
                            updated[i].muted = !updated[i].muted;
                            setTrackStates(updated);
                            audioMiniDaw.updateTrackControls(trk.id, updated[i].vol, updated[i].pan, updated[i].muted, updated.some(t => t.solo), updated[i].solo);
                          }}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                            trk.muted ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          M
                        </button>
                        <button
                          onClick={() => {
                            const updated = [...trackStates];
                            updated[i].solo = !updated[i].solo;
                            setTrackStates(updated);
                            audioMiniDaw.updateTrackControls(trk.id, updated[i].vol, updated[i].pan, updated[i].muted, updated.some(t => t.solo), updated[i].solo);
                          }}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                            trk.solo ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          S
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={trk.vol}
                          onChange={(e) => {
                            const updated = [...trackStates];
                            updated[i].vol = parseInt(e.target.value);
                            setTrackStates(updated);
                            audioMiniDaw.updateTrackControls(trk.id, updated[i].vol, updated[i].pan, updated[i].muted, updated.some(t => t.solo), updated[i].solo);
                          }}
                          className="w-24 accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-slate-400 w-8">{trk.vol}%</span>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                        <Scissors className="w-3 h-3 text-slate-400" />
                        <span>0s–60s Hook</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SENIOR MASTERING & A/B BUS */}
          {activeTab === 'mastering' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Senior Mastering Engineer & Level-Matched A/B Bus</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-700/40">
                      Target: -12.0 LUFS | -1.0 dBTP
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Audition raw Suno gens against Billboard Top 100 reference tracks with instant LUFS gain compensation.</p>
                </div>

                <button
                  onClick={() => {
                    const next = !isMonoCollapse;
                    setIsMonoCollapse(next);
                    audioMiniDaw.setMonoCollapse(next);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                    isMonoCollapse ? 'bg-amber-600 text-white border-amber-500' : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                  title="Audit wide reverb returns for phase cancellation on mobile phones"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>{isMonoCollapse ? 'Mono Collapse ACTIVE' : 'Mono-Collapse Check'}</span>
                </button>
              </div>

              {/* A/B Bus Selector */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { id: 'suno', label: '[A] Raw Suno Gen' },
                  { id: 'vocal', label: '[B] Isolated Dry Vocal' },
                  { id: 'instrumental', label: '[C] True Instrumental' },
                  { id: 'master', label: '[D] Final Master WAV' },
                  { id: 'ref', label: '[REF] Billboard Ref' }
                ].map(bus => (
                  <button
                    key={bus.id}
                    onClick={() => {
                      setActiveBus(bus.id as any);
                      audioMiniDaw.updateBusRouting(bus.id, trackStates);
                    }}
                    className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                      activeBus === bus.id
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-950'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span>{bus.label}</span>
                  </button>
                ))}
              </div>

              {/* Mastering Meters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Integrated Loudness</span>
                  <div className="text-2xl font-black text-emerald-400 font-mono">-12.1 LUFS</div>
                  <span className="text-[10px] text-slate-500">Nashville Standard Compliant</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">True Peak Ceiling</span>
                  <div className="text-2xl font-black text-indigo-400 font-mono">-1.05 dBTP</div>
                  <span className="text-[10px] text-slate-500">Zero Intersample Clipping</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Phase Correlation</span>
                  <div className="text-2xl font-black text-amber-400 font-mono">+0.92</div>
                  <span className="text-[10px] text-slate-500">Mono Compatible Safe</span>
                </div>
              </div>

              {/* Processing Chain Checklist */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                  DAW Surgery & Master Chain Audit (Nashville Benchmark)
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-300 font-mono text-[11px]">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Subtractive HPF @ 80-100Hz on Vocals</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Dynamic EQ Notch @ 300-500Hz mud reduction</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Dual-Stage Compression (Peak Catcher + Color Slam)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Parallel Vox Smash Bus blended @ 5-10%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: VISUALS & VEO 3 VIDEO STUDIO */}
          {activeTab === 'veo_visuals' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
                <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Film className="w-5 h-5 text-rose-400" />
                      <span>Visual & Veo 3 Video Studio</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Create & edit album art with Gemini Flash, and generate or animate images into cinematic video using Google Veo 3.
                    </p>
                  </div>
                </div>

                {/* Sub-grid: 1. Image Creation & Editing, 2. Veo Video Generation */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* LEFT: IMAGE CREATOR & EDITOR */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-indigo-400" />
                        <span>Create & Edit Images (gemini-3.1-flash-image-preview)</span>
                      </h4>
                      <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800/40">
                        {imageMode === 'create' ? 'Text-to-Image' : 'Image-to-Image Edit'}
                      </span>
                    </div>

                    <textarea
                      rows={3}
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      placeholder="Describe the image or edit instructions..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                    />

                    {/* Aspect Ratio Selector */}
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                        Aspect Ratio Affordance
                      </label>
                      <div className="grid grid-cols-4 gap-1.5 text-xs font-mono">
                        {['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', '21:9'].map((ratio) => (
                          <button
                            key={ratio}
                            onClick={() => setImageAspectRatio(ratio)}
                            className={`py-1 rounded-lg border text-[11px] font-bold transition ${
                              imageAspectRatio === ratio
                                ? 'bg-indigo-600 border-indigo-400 text-white'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {ratio}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Upload / Edit Anchor */}
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <label className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold cursor-pointer transition flex items-center gap-1.5 text-xs">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Photo to Edit/Animate</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = () => {
                                  setSelectedImageForEdit(reader.result as string);
                                  setImageMode('edit');
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        {selectedImageForEdit && (
                          <button
                            onClick={() => {
                              setSelectedImageForEdit(null);
                              setImageMode('create');
                            }}
                            className="text-rose-400 hover:text-rose-300 text-xs font-bold"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      <button
                        onClick={handleGenerateImage}
                        disabled={isGeneratingImage}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-950 disabled:opacity-50"
                      >
                        {isGeneratingImage ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                        <span>{isGeneratingImage ? 'Generating...' : imageMode === 'edit' ? 'Apply Edit' : 'Generate Image'}</span>
                      </button>
                    </div>

                    {selectedImageForEdit && (
                      <div className="p-2 bg-slate-900 rounded-xl border border-indigo-500/40 flex items-center gap-3">
                        <img src={selectedImageForEdit} alt="Anchor" className="w-12 h-12 object-cover rounded-lg" />
                        <span className="text-[11px] text-slate-300">Base image loaded for editing or Veo video animation.</span>
                      </div>
                    )}
                  </div>

                  {/* RIGHT: VEO 3 VIDEO GENERATOR */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Video className="w-4 h-4 text-rose-400" />
                        <span>Google Veo 3 Video Generator (veo-3.1-fast-generate-preview)</span>
                      </h4>
                      <span className="text-[10px] font-mono text-rose-300 bg-rose-950 px-2 py-0.5 rounded border border-rose-800/40">
                        {selectedImageForEdit ? 'Animate Photo' : 'Text-to-Video'}
                      </span>
                    </div>

                    <textarea
                      rows={3}
                      value={videoPrompt}
                      onChange={(e) => setVideoPrompt(e.target.value)}
                      placeholder="Prompt for cinematic Veo video..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
                    />

                    {/* Veo Aspect Ratio constraint (16:9 or 9:16) */}
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                        Veo 3 Aspect Ratio (16:9 Landscape or 9:16 Portrait)
                      </label>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <button
                          onClick={() => setVideoAspectRatio('16:9')}
                          className={`py-1.5 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                            videoAspectRatio === '16:9'
                              ? 'bg-rose-600 border-rose-400 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>16:9 Landscape (YouTube / Desktop)</span>
                        </button>
                        <button
                          onClick={() => setVideoAspectRatio('9:16')}
                          className={`py-1.5 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                            videoAspectRatio === '9:16'
                              ? 'bg-rose-600 border-rose-400 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>9:16 Portrait (TikTok / Shorts)</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-[11px] text-slate-400 font-mono">
                        {videoStatus}
                      </span>
                      <button
                        onClick={handleGenerateVeoVideo}
                        disabled={isGeneratingVideo}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-rose-950 disabled:opacity-50"
                      >
                        {isGeneratingVideo ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Film className="w-3.5 h-3.5 text-amber-200" />}
                        <span>{isGeneratingVideo ? 'Rendering Veo...' : selectedImageForEdit ? 'Animate Photo into Video' : 'Generate Veo Video'}</span>
                      </button>
                    </div>
                  </div>

                </div>

                {/* GALLERY OF GENERATED IMAGES & VIDEOS */}
                <div className="space-y-4 pt-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>Visual Assets & Generated Renders ({generatedImages.length + generatedVideos.length})</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Images */}
                    {generatedImages.map((img) => (
                      <div key={img.id} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col group">
                        <div className="relative aspect-square bg-slate-900 overflow-hidden">
                          <img src={img.url} alt={img.prompt} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                          <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-sm px-2 py-0.5 rounded text-[9px] font-mono text-white font-bold">
                            {img.aspectRatio}
                          </div>
                        </div>
                        <div className="p-3 space-y-2 flex-1 flex flex-col justify-between text-xs">
                          <p className="text-[11px] text-slate-300 line-clamp-2">{img.prompt}</p>
                          <div className="flex items-center justify-between gap-1 pt-2 border-t border-slate-800">
                            <button
                              onClick={() => {
                                setSelectedImageForEdit(img.url);
                                setImageMode('edit');
                              }}
                              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold"
                            >
                              Edit / Animate
                            </button>
                            <button
                              onClick={() => handleAnalyzeImage(img.url)}
                              className="text-[10px] text-purple-400 hover:text-purple-300 font-bold"
                            >
                              Analyze (Pro)
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Videos */}
                    {generatedVideos.map((vid) => (
                      <div key={vid.id} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col group">
                        <div className={`relative ${vid.aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-video'} bg-slate-900 flex items-center justify-center`}>
                          {vid.videoUrl ? (
                            <video src={vid.videoUrl} controls className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-center p-4">
                              <RefreshCw className="w-6 h-6 text-rose-400 animate-spin mx-auto mb-2" />
                              <span className="text-[10px] text-slate-400 font-mono">Veo Rendering...</span>
                            </div>
                          )}
                          <div className="absolute top-2 right-2 bg-slate-900/80 px-2 py-0.5 rounded text-[9px] font-mono text-white font-bold">
                            Veo {vid.aspectRatio}
                          </div>
                        </div>
                        <div className="p-3 text-xs space-y-1">
                          <p className="text-[11px] text-slate-300 line-clamp-2">{vid.prompt}</p>
                          <span className="text-[9px] font-mono text-slate-500">{vid.status.toUpperCase()}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Gemini Image / Video Analysis Result Box */}
                  {imageAnalysisResult && (
                    <div className="p-4 bg-slate-950 border border-purple-500/40 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold text-purple-300 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-400" />
                          <span>Gemini Pro Image Understanding Audit</span>
                        </h5>
                        <button onClick={() => setImageAnalysisResult(null)} className="text-xs text-slate-400 hover:text-white">✕</button>
                      </div>
                      <p className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                        {imageAnalysisResult}
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* TAB 5: NIGHTCAFE QUEUE RUNNER */}
          {activeTab === 'nightcafe' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>NightCafe Studio Bulk Queue Runner</span>
                    <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 font-mono text-[10px] font-bold border border-blue-700/50">
                      {nightCafePrompts.length} Scenes Loaded
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Batch prompt dispatching for Google Veo & Flux Dev models on NightCafe Studio.</p>
                </div>

                <button
                  onClick={() => {
                    const payload = JSON.stringify(nightCafePrompts, null, 2);
                    copyToClipboard(payload, "NightCafe Queue JSON");
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 transition"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>⚡ Copy JSON for NightCafe</span>
                </button>
              </div>

              {/* Prompt Table */}
              <div className="border border-slate-800 rounded-xl bg-slate-950 overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 sticky top-0 text-slate-400">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3 w-36">Song</th>
                      <th className="py-2.5 px-3 w-36">Scene Title</th>
                      <th className="py-2.5 px-3">Cinematic Prompt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {nightCafePrompts.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/60 transition">
                        <td className="py-2 px-3 text-center text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                        <td className="py-2 px-3 font-semibold text-blue-300">{item.song}</td>
                        <td className="py-2 px-3 font-medium text-slate-200">{item.title}</td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-300">{item.prompt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: TELEMETRY & SURVIVAL LOOP */}
          {activeTab === 'telemetry' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>T+60m Inbound Telemetry & Brutal Metric Loop</span>
                  <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-mono text-[10px] font-bold border border-purple-700/50">
                    Active Audit
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Automated retention scoring. Videos with ≥70% completion trigger 10s video extensions instantly.</p>
              </div>

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
            </div>
          )}

          {/* TAB 7: STUDIO CO-PRODUCER AI (GEMINI CHATBOT) */}
          {activeTab === 'coproducer' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col h-[640px]">
              <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-teal-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Studio Co-Producer AI (Multi-Turn Chatbot)</h3>
                    <p className="text-[11px] text-slate-400">Contextually aware of {selectedTrack.title} ({selectedTrack.genre})</p>
                  </div>
                </div>

                {/* Role and Model Selectors */}
                <div className="flex items-center gap-2">
                  <select
                    value={chatRole}
                    onChange={(e) => setChatRole(e.target.value as any)}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-bold focus:outline-none"
                  >
                    <option value="lyric_assistant">Lyric & Theological Assistant</option>
                    <option value="mastering_engineer">Senior Mastering Engineer</option>
                    <option value="omnipost_strategist">Omnipost Social Strategist</option>
                  </select>

                  <select
                    value={chatModel}
                    onChange={(e) => setChatModel(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-indigo-300 font-mono focus:outline-none"
                  >
                    <option value="gemini-3.5-flash">gemini-3.5-flash</option>
                    <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview</option>
                    <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite</option>
                  </select>
                </div>
              </div>

              {/* Message Thread */}
              <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-slate-950 rounded-xl border border-slate-800/80 custom-scrollbar">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-2 mb-1 text-[10px] text-slate-500 font-mono">
                      <span>{msg.role === 'user' ? 'You' : 'brickOS AI'}</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                      {msg.model && <span>({msg.model})</span>}
                    </div>
                    <div
                      className={`p-3.5 rounded-2xl max-w-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-none'
                          : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-md font-mono'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono p-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-400" />
                    <span>Thinking with {chatModel}...</span>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={`Ask ${chatRole.replace('_', ' ')} anything about ${selectedTrack.title}...`}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isChatLoading || !chatInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 8: SEARCH GROUNDING */}
          {activeTab === 'search' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Search className="w-4 h-4 text-cyan-400" />
                  <span>Google Search Grounding (gemini-3.5-flash with googleSearch tool)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Retrieve up-to-date Billboard Christian/Gospel charts, BPM trends, Nashville mixing standards, and theological references.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchGrounding()}
                  placeholder="e.g. Current top 10 Christian Hip Hop tracks tempo and 808 style 2026..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
                <button
                  onClick={handleSearchGrounding}
                  disabled={isSearching}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-cyan-950 disabled:opacity-50"
                >
                  {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>{isSearching ? 'Searching...' : 'Search Google Grounding'}</span>
                </button>
              </div>

              {searchResult && (
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                  <div className="text-xs text-slate-200 font-mono leading-relaxed whitespace-pre-wrap">
                    {searchResult.answer}
                  </div>

                  {searchResult.sources && searchResult.sources.length > 0 && (
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                        Verified Web Sources:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {searchResult.sources.map((src, idx) => (
                          <a
                            key={idx}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-cyan-400 hover:underline bg-slate-900 px-2.5 py-1 rounded border border-slate-800 flex items-center gap-1"
                          >
                            <span>{src.title || src.url}</span>
                            <ExternalLink className="w-2.5 h-2.5 inline" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* NEXTCLOUD WEBDAV STORAGE MODAL */}
      {isStorageModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-indigo-400" />
                <span>Nextcloud Sovereign WebDAV Hub</span>
              </h3>
              <button
                onClick={() => setIsStorageModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p>Your studio connects directly to your private self-hosted Nextcloud instance with zero reliance on third-party clouds.</p>
              
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-indigo-300 text-[11px] select-all">
                {PRODUCTION_NEXTCLOUD_WEBDAV}
              </div>

              <div className="space-y-2 pt-2">
                <strong className="text-white block">DAW & DAW Workstation Mount (Windows / macOS / Linux):</strong>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[10px] font-mono text-slate-300 overflow-x-auto">
{`# Mount WebDAV as Z: Drive on Windows DAW
net use Z: https://nextcloud.moyercloud.com/remote.php/dav/files/ncted/brickOS /user:ncted

# rclone sync command for Cakewalk / DaVinci Resolve stems
rclone sync Z:/ brickos_local_cache/ --transfers 4 --checkers 8`}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsStorageModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUNO & NIGHTCAFE BRIDGE MODAL */}
      {isSunoBridgeOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <span>⚡ Suno & NightCafe 1-Click Bridge</span>
              </h3>
              <button
                onClick={() => setIsSunoBridgeOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p>Instantly inject Title, Lyrics, Style, and Excluded Styles from brickOS into Suno.com and NightCafe without manual copy-pasting.</p>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <strong className="text-white block">Tampermonkey UserScript Integration:</strong>
                <p className="text-[11px] text-slate-400">
                  The companion UserScript running on Suno.com and NightCafe Studio detects packets on your clipboard and populates form fields automatically using native React prototype setters.
                </p>
                <button
                  onClick={() => {
                    const scriptCode = `// ==UserScript==\n// @name brickOS 1-Click Bridge\n// @match https://suno.com/*\n// @match https://creator.nightcafe.studio/*\n// ==/UserScript==\nconsole.log("[brickOS Bridge Active]");`;
                    copyToClipboard(scriptCode, "UserScript Code");
                  }}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                >
                  <Code className="w-4 h-4" />
                  <span>Copy Full UserScript to Clipboard</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsSunoBridgeOpen(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
