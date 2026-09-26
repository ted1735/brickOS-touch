import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Search,
  Filter,
  Copy,
  Plus,
  Trash2,
  Edit2,
  Star,
  Film,
  Music,
  ImageIcon,
  Zap,
  Sliders,
  CheckCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Download,
  Upload,
  RefreshCw,
  FolderKanban,
  Eye,
  SlidersHorizontal,
  Layers,
  ArrowRight,
  Maximize2,
  Clock,
  Radio,
  Share2,
  X
} from 'lucide-react';
import { PromptItem, PromptModality, Track, EngineSliders } from '../types';
import { CANONICAL_PROMPT_LIBRARY } from '../data/promptLibraryCatalog';

interface PromptEngineeringLibraryTabProps {
  tracks: Track[];
  selectedTrack: Track;
  onSelectTrack: (track: Track) => void;
  onSendToImageStudio: (prompt: string, aspectRatio?: string) => void;
  onSendToVeoStudio: (prompt: string, aspectRatio?: '16:9' | '9:16') => void;
  onSendToSuno: (trackId: string, prompt: string, negativePrompt?: string, sliders?: EngineSliders) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  isDarkMode?: boolean;
}

export const PromptEngineeringLibraryTab: React.FC<PromptEngineeringLibraryTabProps> = ({
  tracks,
  selectedTrack,
  onSelectTrack,
  onSendToImageStudio,
  onSendToVeoStudio,
  onSendToSuno,
  showToast,
  isDarkMode = true
}) => {
  // Load prompts from localStorage or fallback to canonical library
  const [prompts, setPrompts] = useState<PromptItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('brickos_prompt_library');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.warn('Failed to load prompts from storage, using canonical library');
      }
    }
    return CANONICAL_PROMPT_LIBRARY;
  });

  // Save to localStorage whenever prompts change
  useEffect(() => {
    try {
      localStorage.setItem('brickos_prompt_library', JSON.stringify(prompts));
    } catch (e) {
      console.warn('Failed to persist prompts to storage:', e);
    }
  }, [prompts]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModality, setSelectedModality] = useState<'all' | PromptModality>('all');
  const [selectedSong, setSelectedSong] = useState<string>('all');
  const [selectedEngine, setSelectedEngine] = useState<string>('all');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table' | 'storyboard'>('grid');

  // Expanded items state
  const [expandedPromptIds, setExpandedPromptIds] = useState<Record<string, boolean>>({});

  // Prompt Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptItem | null>(null);

  // Playground / Enhancer Drawer State
  const [isPlaygroundOpen, setIsPlaygroundOpen] = useState(false);
  const [playgroundPrompt, setPlaygroundPrompt] = useState('');

  // Storyboard Phase filter for narrative sequence
  const [narrativePhaseFilter, setNarrativePhaseFilter] = useState<'all' | '1' | '2' | '3' | '4'>('all');

  // Helper to toggle expansion
  const toggleExpanded = (id: string) => {
    setExpandedPromptIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    showToast(`Copied ${label} to clipboard!`, 'success');
  };

  // Toggle favorite
  const handleToggleFavorite = (id: string) => {
    setPrompts(prev => prev.map(p => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p));
  };

  // Delete prompt
  const handleDeletePrompt = (id: string) => {
    if (confirm('Are you sure you want to remove this prompt from your library?')) {
      setPrompts(prev => prev.filter(p => p.id !== id));
      showToast('Prompt removed', 'info');
    }
  };

  // Duplicate prompt
  const handleDuplicatePrompt = (p: PromptItem) => {
    const duplicated: PromptItem = {
      ...p,
      id: `${p.id}-copy-${Date.now().toString().slice(-4)}`,
      title: `${p.title} (Remix)`,
      createdAt: new Date().toISOString().split('T')[0],
      isFavorite: false
    };
    setPrompts([duplicated, ...prompts]);
    showToast(`Duplicated "${p.title}"`, 'success');
  };

  // Reset to canonical library
  const handleResetToCanonical = () => {
    if (confirm('Reset entire prompt library back to canonical defaults? Any unsaved custom prompts will be lost.')) {
      setPrompts(CANONICAL_PROMPT_LIBRARY);
      showToast('Prompt library reset to canonical defaults', 'success');
    }
  };

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(prompts, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `brickos_prompt_library_${new Date().toISOString().split('T')[0]}.json`);
    dlAnchorElem.click();
    showToast('Exported library as JSON', 'success');
  };

  // Export Markdown Storyboard
  const handleExportMarkdown = () => {
    let md = `# brickOS Prompt Engineering Library & Storyboard Export\nGenerated: ${new Date().toISOString()}\nTotal Prompts: ${prompts.length}\n\n`;
    
    // Group by Song
    const grouped: Record<string, PromptItem[]> = {};
    prompts.forEach(p => {
      const s = p.song || 'Uncategorized';
      if (!grouped[s]) grouped[s] = [];
      grouped[s].push(p);
    });

    Object.entries(grouped).forEach(([songName, items]) => {
      md += `## Song: ${songName} (${items.length} Prompts)\n\n`;
      items.forEach((p, idx) => {
        md += `### ${idx + 1}. [${p.modality.toUpperCase()}] ${p.title}\n`;
        md += `- **Engine / Platform**: ${p.engine}\n`;
        if (p.aspectRatio) md += `- **Aspect Ratio**: ${p.aspectRatio}\n`;
        if (p.bpm) md += `- **BPM & Key**: ${p.bpm} BPM / ${p.key || 'N/A'}\n`;
        if (p.tags && p.tags.length > 0) md += `- **Tags**: ${p.tags.join(', ')}\n`;
        md += `\n**Prompt:**\n\`\`\`\n${p.prompt}\n\`\`\`\n\n`;
        if (p.initialPrompt) {
          md += `**Initial 10s Shot:**\n\`\`\`\n${p.initialPrompt}\n\`\`\`\n\n`;
        }
        if (p.extensionPrompt) {
          md += `**Extension 10s Shot:**\n\`\`\`\n${p.extensionPrompt}\n\`\`\`\n\n`;
        }
        if (p.audioCues) {
          md += `**Audio Cues / Sound Design:**\n${p.audioCues}\n\n`;
        }
        md += `---\n\n`;
      });
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brickos_prompt_storyboard_${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported Storyboard Markdown', 'success');
  };

  // Import JSON handler
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          setPrompts(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newItems = parsed.filter((item: any) => item && item.title && !existingIds.has(item.id));
            return [...newItems, ...prev];
          });
          showToast(`Successfully imported prompts`, 'success');
        } else {
          showToast('Invalid JSON structure: expected an array of prompts', 'error');
        }
      } catch (err: any) {
        showToast(`Failed to parse JSON file: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Counts
  const imageCount = useMemo(() => prompts.filter(p => p.modality === 'image').length, [prompts]);
  const videoCount = useMemo(() => prompts.filter(p => p.modality === 'video').length, [prompts]);
  const audioCount = useMemo(() => prompts.filter(p => p.modality === 'audio').length, [prompts]);
  const mmhCount = useMemo(() => prompts.filter(p => p.song === 'Meet Me Here').length, [prompts]);

  // Unique songs for filter
  const songOptions = useMemo(() => {
    const set = new Set<string>();
    prompts.forEach(p => {
      if (p.song) set.add(p.song);
    });
    return Array.from(set).sort();
  }, [prompts]);

  // Unique engines for filter
  const engineOptions = useMemo(() => {
    const set = new Set<string>();
    prompts.forEach(p => {
      if (p.engine) set.add(p.engine);
    });
    return Array.from(set).sort();
  }, [prompts]);

  // Filtered prompts list
  const filteredPrompts = useMemo(() => {
    return prompts.filter(p => {
      // Modality filter
      if (selectedModality !== 'all' && p.modality !== selectedModality) return false;

      // Song filter
      if (selectedSong !== 'all' && p.song !== selectedSong) return false;

      // Engine filter
      if (selectedEngine !== 'all' && p.engine !== selectedEngine) return false;

      // Aspect ratio filter
      if (selectedAspectRatio !== 'all' && p.aspectRatio !== selectedAspectRatio) return false;

      // Favorites only
      if (favoritesOnly && !p.isFavorite) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesPrompt = p.prompt.toLowerCase().includes(q);
        const matchesSong = p.song.toLowerCase().includes(q);
        const matchesEngine = p.engine.toLowerCase().includes(q);
        const matchesTags = p.tags && p.tags.some(t => t.toLowerCase().includes(q));
        const matchesAudioCues = p.audioCues && p.audioCues.toLowerCase().includes(q);
        if (!matchesTitle && !matchesPrompt && !matchesSong && !matchesEngine && !matchesTags && !matchesAudioCues) {
          return false;
        }
      }

      return true;
    });
  }, [prompts, selectedModality, selectedSong, selectedEngine, selectedAspectRatio, favoritesOnly, searchQuery]);

  // Universal Storyboard Narrative Items (dynamically sequences whichever song is selected, or active track)
  const activeStoryboardSong = selectedSong !== 'all' ? selectedSong : selectedTrack.title;
  const storyboardItems = useMemo(() => {
    const songPrompts = prompts.filter(p => p.song === activeStoryboardSong);
    const count = songPrompts.length;
    // Partition items chronologically into 4 standard production phases
    return songPrompts.map((p, idx) => {
      let phase = 1;
      let phaseName = "Phase 1: Foundation & Exposition (Intro / Verse 1)";
      if (count > 4) {
        const quarter = Math.ceil(count / 4);
        if (idx < quarter) {
          phase = 1;
          phaseName = "Phase 1: Foundation & Tension (Intro / Verse 1)";
        } else if (idx < quarter * 2) {
          phase = 2;
          phaseName = "Phase 2: Development & Resistance (Verse 2 / Pre-Chorus)";
        } else if (idx < quarter * 3) {
          phase = 3;
          phaseName = "Phase 3: Climax & The Throne Room Pivot (Bridge / Drop)";
        } else {
          phase = 4;
          phaseName = "Phase 4: Resolution & Kingdom Harvest (Outro / Epilogue)";
        }
      }
      return { ...p, phase, phaseName };
    }).filter(p => narrativePhaseFilter === 'all' || String(p.phase) === narrativePhaseFilter);
  }, [prompts, activeStoryboardSong, narrativePhaseFilter]);

  // Save new or edited prompt from Modal
  const handleSavePrompt = (p: PromptItem) => {
    setPrompts(prev => {
      const idx = prev.findIndex(item => item.id === p.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = p;
        return updated;
      }
      return [p, ...prev];
    });
    setIsEditorOpen(false);
    setEditingPrompt(null);
    showToast(`Saved prompt: "${p.title}"`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className={`p-5 rounded-2xl border transition-all ${
        isDarkMode 
          ? 'bg-slate-900 border-slate-800 text-white shadow-xl' 
          : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                  <span>Prompt Engineering Library</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-mono font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    Tri-Modal Engine
                  </span>
                </h2>
                <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Store, manage, retrieve, and sequence Image, Video, and Audio generation prompts for Midjourney, Veo 3, Grok, and Suno AI.
                </p>
              </div>
            </div>

            {/* Quick Metrics Badges */}
            <div className="flex items-center gap-2 mt-3 flex-wrap text-xs font-mono">
              <span className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5 ${
                isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}>
                <span>Total:</span>
                <span className="text-indigo-400 font-bold">{prompts.length}</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Images: {imageCount}</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 font-bold flex items-center gap-1">
                <Film className="w-3.5 h-3.5" />
                <span>Videos: {videoCount}</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 font-bold flex items-center gap-1">
                <Music className="w-3.5 h-3.5" />
                <span>Audio: {audioCount}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedSong(selectedTrack.title);
                  setViewMode('storyboard');
                }}
                className="px-2.5 py-1 rounded-lg border border-purple-500/40 bg-purple-500/15 text-purple-300 font-bold hover:bg-purple-500/25 transition flex items-center gap-1 cursor-pointer"
                title="View full chronological visual storyboard for active track"
              >
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Storyboard: {selectedTrack.title}</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setEditingPrompt({
                  id: `prompt-${Date.now()}`,
                  song: selectedTrack.title,
                  trackId: selectedTrack.id,
                  title: `New ${selectedTrack.title} Prompt`,
                  modality: 'image',
                  engine: 'Midjourney / Flux',
                  prompt: '',
                  negativePrompt: 'low quality, distorted, watermark',
                  aspectRatio: '9:16',
                  tags: [selectedTrack.title],
                  isFavorite: false,
                  createdAt: new Date().toISOString().split('T')[0]
                });
                setIsEditorOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-950/50 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Prompt</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPlaygroundOpen(!isPlaygroundOpen)}
              className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                isPlaygroundOpen
                  ? 'bg-amber-600 text-white border-amber-500'
                  : isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-amber-700 border-slate-300'
              }`}
              title="Toggle Prompt Engineering Modifier Playground"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Enhancer Toolkit</span>
            </button>

            {/* Export Menu */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleExportJSON}
                className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  isDarkMode
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
                title="Export Library as JSON"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleExportMarkdown}
                className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  isDarkMode
                    ? 'bg-slate-800 hover:bg-slate-700 text-purple-300 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-purple-700 border-slate-300'
                }`}
                title="Export Storyboard Markdown Report"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <label
                className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  isDarkMode
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
                title="Import JSON Prompts"
              >
                <Upload className="w-4 h-4" />
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleResetToCanonical}
                className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  isDarkMode
                    ? 'bg-slate-800 hover:bg-slate-700 text-rose-400 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-rose-600 border-slate-300'
                }`}
                title="Reset Library to Canonical Defaults"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* PROMPT ENHANCER PLAYGROUND (EXPANDABLE) */}
        {isPlaygroundOpen && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>Prompt Engineering Playground & Token Injector</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsPlaygroundOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              rows={2}
              value={playgroundPrompt}
              onChange={(e) => setPlaygroundPrompt(e.target.value)}
              placeholder="Paste or test a prompt here, then click modifiers below to append engineering tokens..."
              className={`w-full p-2.5 rounded-xl text-xs font-mono border focus:outline-none focus:border-amber-500 transition ${
                isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />

            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              <span className="text-[10px] text-slate-400 uppercase font-mono mr-1">Camera & Lighting:</span>
              {[
                "8k photorealistic chiaroscuro",
                "50mm anamorphic lens, shallow depth of field",
                "macro 120fps slow motion",
                "volumetric golden dawn light rays",
                "Kodak Portra 400 film grain",
                "dramatic Rembrandt lighting"
              ].map((mod, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    const next = playgroundPrompt ? `${playgroundPrompt}, ${mod}` : mod;
                    setPlaygroundPrompt(next);
                    handleCopy(next, `Modifier: ${mod}`);
                  }}
                  className={`px-2 py-0.5 rounded-lg border font-mono transition cursor-pointer ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-indigo-300 hover:bg-slate-800' : 'bg-slate-100 border-slate-200 text-indigo-700'
                  }`}
                >
                  + {mod}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              <span className="text-[10px] text-slate-400 uppercase font-mono mr-1">Audio / Suno Tokens:</span>
              {[
                "3-second vacuum silence",
                "distorted door slam reverb tail",
                "raw vocal fry, zero autotune",
                "heavy 808 sub-bass heartbeat",
                "Throne Room Pivot bridge",
                "explosive strained scream"
              ].map((mod, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    const next = playgroundPrompt ? `${playgroundPrompt}, ${mod}` : mod;
                    setPlaygroundPrompt(next);
                    handleCopy(next, `Audio Token: ${mod}`);
                  }}
                  className={`px-2 py-0.5 rounded-lg border font-mono transition cursor-pointer ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-amber-300 hover:bg-slate-800' : 'bg-slate-100 border-slate-200 text-amber-700'
                  }`}
                >
                  + {mod}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className={`p-4 rounded-2xl border space-y-3 ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        {/* Row 1: Search & Main Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Modality Selector */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setSelectedModality('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                selectedModality === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Types ({prompts.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedModality('image')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                selectedModality === 'image'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Images ({imageCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedModality('video')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                selectedModality === 'video'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-400 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Videos ({videoCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedModality('audio')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                selectedModality === 'audio'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-amber-400 hover:text-white'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Audio ({audioCount})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search prompts by title, keywords, audio cues, tags, engine..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs font-mono border focus:outline-none focus:border-indigo-500 transition ${
                isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition ${
                viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="Grid Cards View"
            >
              Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition ${
                viewMode === 'table' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="Compact Table View"
            >
              Table
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedSong('Meet Me Here');
                setViewMode('storyboard');
              }}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                viewMode === 'storyboard' ? 'bg-purple-600 text-white shadow-xs' : 'text-purple-400 hover:text-white'
              }`}
              title="Chronological Storyboard View (MMH)"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Storyboard</span>
            </button>
          </div>
        </div>

        {/* Row 2: Secondary Filters (Song, Engine, Aspect Ratio, Favorites) */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-800/60 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Song Dropdown */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Song:</span>
              <select
                value={selectedSong}
                onChange={(e) => setSelectedSong(e.target.value)}
                className={`px-2.5 py-1 rounded-xl border text-xs font-bold focus:outline-none focus:border-indigo-500 cursor-pointer ${
                  isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              >
                <option value="all">All Songs ({prompts.length})</option>
                <option value="Meet Me Here">⭐ Meet Me Here ({mmhCount})</option>
                {songOptions.filter(s => s !== 'Meet Me Here').map(s => (
                  <option key={s} value={s}>
                    {s} ({prompts.filter(p => p.song === s).length})
                  </option>
                ))}
              </select>
            </div>

            {/* Engine Dropdown */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Engine:</span>
              <select
                value={selectedEngine}
                onChange={(e) => setSelectedEngine(e.target.value)}
                className={`px-2.5 py-1 rounded-xl border text-xs font-bold focus:outline-none focus:border-indigo-500 cursor-pointer ${
                  isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              >
                <option value="all">All Engines</option>
                {engineOptions.map(eng => (
                  <option key={eng} value={eng}>{eng}</option>
                ))}
              </select>
            </div>

            {/* Aspect Ratio */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Aspect:</span>
              <select
                value={selectedAspectRatio}
                onChange={(e) => setSelectedAspectRatio(e.target.value)}
                className={`px-2.5 py-1 rounded-xl border text-xs font-bold focus:outline-none focus:border-indigo-500 cursor-pointer ${
                  isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}
              >
                <option value="all">All Aspects</option>
                <option value="9:16">9:16 (Vertical Shorts)</option>
                <option value="16:9">16:9 (Landscape Cinematic)</option>
                <option value="1:1">1:1 (Album Art / Square)</option>
              </select>
            </div>

            {/* Favorites Toggle */}
            <button
              type="button"
              onClick={() => setFavoritesOnly(!favoritesOnly)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition flex items-center gap-1 cursor-pointer ${
                favoritesOnly
                  ? 'bg-amber-600 border-amber-500 text-white'
                  : isDarkMode
                  ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-amber-400'
                  : 'bg-slate-50 border-slate-300 text-slate-600'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-white text-white' : 'text-amber-400'}`} />
              <span>Favorites Only</span>
            </button>
          </div>

          <div className="text-slate-400 font-mono text-[11px]">
            Showing <span className="text-white font-bold">{filteredPrompts.length}</span> of {prompts.length} prompts
          </div>
        </div>
      </div>

      {/* STORYBOARD MODE (CHRONOLOGICAL NARRATIVE PHASES FOR ACTIVE SONG) */}
      {viewMode === 'storyboard' && (
        <div className="space-y-4">
          <div className={`p-4 rounded-2xl border flex items-center justify-between flex-wrap gap-3 ${
            isDarkMode ? 'bg-slate-900 border-purple-800/40 text-white' : 'bg-white border-purple-200 text-slate-900'
          }`}>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span>Storyboard Sequence & Narrative Pipeline</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {activeStoryboardSong} ({storyboardItems.length} Prompts)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Standardized production storyboard pipeline for "{activeStoryboardSong}". Sequences visual beats from opening tension to the Throne Room Pivot climax.
              </p>
            </div>

            {/* Phase Pills */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <button
                type="button"
                onClick={() => setNarrativePhaseFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  narrativePhaseFilter === 'all' ? 'bg-purple-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}
              >
                All Phases
              </button>
              <button
                type="button"
                onClick={() => setNarrativePhaseFilter('1')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  narrativePhaseFilter === '1' ? 'bg-purple-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}
              >
                Phase 1: Tension
              </button>
              <button
                type="button"
                onClick={() => setNarrativePhaseFilter('2')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  narrativePhaseFilter === '2' ? 'bg-purple-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}
              >
                Phase 2: Development
              </button>
              <button
                type="button"
                onClick={() => setNarrativePhaseFilter('3')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  narrativePhaseFilter === '3' ? 'bg-purple-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}
              >
                Phase 3: Pivot / Climax
              </button>
              <button
                type="button"
                onClick={() => setNarrativePhaseFilter('4')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  narrativePhaseFilter === '4' ? 'bg-purple-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}
              >
                Phase 4: Resolution
              </button>
            </div>
          </div>

          {/* Storyboard Cards */}
          {storyboardItems.length === 0 ? (
            <div className={`p-8 rounded-2xl border text-center space-y-3 ${
              isDarkMode ? 'bg-slate-900/50 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <Layers className="w-8 h-8 mx-auto text-purple-400/50" />
              <div className="text-sm font-bold text-slate-300">No storyboard prompts found for "{activeStoryboardSong}"</div>
              <p className="text-xs max-w-md mx-auto">
                Add your first image or video shot prompt for this track using the <strong>+ New Prompt</strong> button above to populate this song's narrative pipeline.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {storyboardItems.map((item, idx) => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                  isDarkMode
                    ? 'bg-slate-900/90 border-slate-800 hover:border-purple-500/50 shadow-lg'
                    : 'bg-white border-slate-200 hover:border-purple-300 shadow-xs'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 font-bold">
                      Shot #{idx + 1} • {item.phaseName.split(':')[0]}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {item.aspectRatio || '9:16'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white tracking-tight">
                    {item.title}
                  </h4>

                  <p className="text-xs text-slate-300 font-mono leading-relaxed line-clamp-4">
                    {item.prompt}
                  </p>

                  {item.initialPrompt && (
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] font-mono space-y-1">
                      <div className="text-amber-400 font-bold">🎬 10s Motion Action:</div>
                      <div className="text-slate-300 line-clamp-2">{item.initialPrompt}</div>
                    </div>
                  )}

                  {item.audioCues && (
                    <div className="text-[11px] text-indigo-300 font-mono flex items-center gap-1">
                      <Music className="w-3 h-3 text-indigo-400" />
                      <span className="truncate">{item.audioCues}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800/70 flex items-center justify-between gap-1 flex-wrap">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onSendToImageStudio(item.prompt, item.aspectRatio)}
                      className="px-2 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/50 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                      title="Load into Image Studio"
                    >
                      <Zap className="w-3 h-3 text-amber-300" />
                      <span>⚡ Image</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSendToVeoStudio(item.initialPrompt || item.prompt, (item.aspectRatio as any) || '9:16')}
                      className="px-2 py-1 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-700/50 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                      title="Load into Veo 3 Video Generator"
                    >
                      <Film className="w-3 h-3 text-rose-400" />
                      <span>🎬 Video</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy(item.prompt, item.title)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      )}

      {/* GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrompts.map((item) => {
            const isExpanded = !!expandedPromptIds[item.id];
            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                  isDarkMode
                    ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-lg'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                {/* Card Top: Badges & Favorite */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Modality Badge */}
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                        item.modality === 'image'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : item.modality === 'video'
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}>
                        {item.modality === 'image' && <ImageIcon className="w-3 h-3" />}
                        {item.modality === 'video' && <Film className="w-3 h-3" />}
                        {item.modality === 'audio' && <Music className="w-3 h-3" />}
                        <span>{item.modality}</span>
                      </span>

                      {/* Song Tag */}
                      <span className="px-2 py-0.5 rounded-lg bg-blue-950 text-blue-300 font-mono text-[10px] border border-blue-800/40">
                        {item.song}
                      </span>

                      {/* Aspect Ratio */}
                      {item.aspectRatio && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[9px]">
                          {item.aspectRatio}
                        </span>
                      )}
                    </div>

                    {/* Star Favorite */}
                    <button
                      type="button"
                      onClick={() => handleToggleFavorite(item.id)}
                      className="text-slate-400 hover:text-amber-400 transition"
                      title={item.isFavorite ? 'Unfavorite' : 'Add to Favorites'}
                    >
                      <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                  </div>

                  {/* Title */}
                  <h4 className="text-sm font-bold text-white tracking-tight flex items-center justify-between">
                    <span>{item.title}</span>
                  </h4>

                  {/* Engine & Specs */}
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                    <span className="text-indigo-400 font-bold">{item.engine}</span>
                    {item.bpm && (
                      <span>• {item.bpm} BPM ({item.key || 'Key'})</span>
                    )}
                  </div>

                  {/* Prompt Text */}
                  <p className={`text-xs text-slate-300 font-mono leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
                    {item.prompt}
                  </p>

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {item.tags.slice(0, 4).map((tag, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 text-[9px] font-mono">
                          #{tag}
                        </span>
                      ))}
                      {item.tags.length > 4 && (
                        <span className="text-[9px] text-slate-500 font-mono">+{item.tags.length - 4}</span>
                      )}
                    </div>
                  )}

                  {/* EXPANDABLE DETAILS */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-slate-800/80 space-y-2 text-[11px] font-mono animate-in fade-in duration-150">
                      {item.initialPrompt && (
                        <div>
                          <span className="text-amber-400 font-bold">Initial 10s Shot: </span>
                          <span className="text-slate-300">{item.initialPrompt}</span>
                        </div>
                      )}
                      {item.extensionPrompt && (
                        <div>
                          <span className="text-emerald-400 font-bold">Extension 10s Shot: </span>
                          <span className="text-slate-300">{item.extensionPrompt}</span>
                        </div>
                      )}
                      {item.audioCues && (
                        <div>
                          <span className="text-indigo-400 font-bold">Audio Cues: </span>
                          <span className="text-slate-300">{item.audioCues}</span>
                        </div>
                      )}
                      {item.negativePrompt && (
                        <div>
                          <span className="text-rose-400 font-bold">Negative Prompt: </span>
                          <span className="text-slate-400">{item.negativePrompt}</span>
                        </div>
                      )}
                      {item.sliders && (
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-1">
                          <span>Weirdness: {item.sliders.weirdness}</span>
                          <span>• Style: {item.sliders.styleInfluence}</span>
                          <span>• Voice: {item.sliders.voiceAudio}</span>
                        </div>
                      )}
                      {item.notes && (
                        <p className="text-[10px] italic text-slate-400 pt-1">"{item.notes}"</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Bottom Actions */}
                <div className="pt-3 border-t border-slate-800/70 flex items-center justify-between gap-1 flex-wrap">
                  {/* Left Send-To Engines */}
                  <div className="flex items-center gap-1">
                    {item.modality === 'image' && (
                      <button
                        type="button"
                        onClick={() => onSendToImageStudio(item.prompt, item.aspectRatio)}
                        className="px-2 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/50 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                        title="Load into Image Generator"
                      >
                        <Zap className="w-3 h-3 text-amber-300" />
                        <span>⚡ Image</span>
                      </button>
                    )}

                    {item.modality === 'video' && (
                      <button
                        type="button"
                        onClick={() => onSendToVeoStudio(item.initialPrompt || item.prompt, (item.aspectRatio as any) || '9:16')}
                        className="px-2 py-1 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-700/50 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                        title="Load into Google Veo Video Studio"
                      >
                        <Film className="w-3 h-3 text-rose-400" />
                        <span>🎬 Video</span>
                      </button>
                    )}

                    {item.modality === 'audio' && (
                      <button
                        type="button"
                        onClick={() => onSendToSuno(item.trackId || selectedTrack.id, item.prompt, item.negativePrompt, item.sliders)}
                        className="px-2 py-1 rounded-lg bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-700/50 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                        title="Load into Suno Prompt & Lyrics Tab"
                      >
                        <Music className="w-3 h-3 text-amber-400" />
                        <span>🎵 Suno</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleCopy(item.prompt, item.title)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                      title="Copy full prompt text"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>

                  {/* Right Manage Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(item.id)}
                      className="px-1.5 py-1 rounded text-slate-400 hover:text-white text-[10px] font-mono"
                      title="Toggle details"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDuplicatePrompt(item)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                      title="Duplicate Prompt"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingPrompt(item);
                        setIsEditorOpen(true);
                      }}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                      title="Edit Prompt"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeletePrompt(item.id)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400"
                      title="Delete Prompt"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* COMPACT TABLE VIEW */}
      {viewMode === 'table' && (
        <div className={`rounded-2xl border overflow-hidden ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className={`border-b ${isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <tr>
                  <th className="p-3">Type</th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Song</th>
                  <th className="p-3">Engine</th>
                  <th className="p-3">Aspect / Specs</th>
                  <th className="p-3">Prompt Preview</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredPrompts.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition">
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.modality === 'image'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : item.modality === 'video'
                          ? 'bg-rose-500/15 text-rose-400'
                          : 'bg-amber-500/15 text-amber-400'
                      }`}>
                        {item.modality}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-white max-w-[200px] truncate">
                      {item.title}
                    </td>
                    <td className="p-3 text-blue-300">
                      {item.song}
                    </td>
                    <td className="p-3 text-indigo-300">
                      {item.engine}
                    </td>
                    <td className="p-3 text-slate-400">
                      {item.aspectRatio || (item.bpm ? `${item.bpm} BPM` : 'N/A')}
                    </td>
                    <td className="p-3 text-slate-300 max-w-[320px] truncate">
                      {item.prompt}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleCopy(item.prompt, item.title)}
                          className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
                          title="Copy Prompt"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {item.modality === 'image' && (
                          <button
                            type="button"
                            onClick={() => onSendToImageStudio(item.prompt, item.aspectRatio)}
                            className="p-1 rounded hover:bg-slate-800 text-emerald-400"
                            title="Send to Image Studio"
                          >
                            <Zap className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {item.modality === 'video' && (
                          <button
                            type="button"
                            onClick={() => onSendToVeoStudio(item.initialPrompt || item.prompt, (item.aspectRatio as any) || '9:16')}
                            className="p-1 rounded hover:bg-slate-800 text-rose-400"
                            title="Send to Veo Video Studio"
                          >
                            <Film className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {item.modality === 'audio' && (
                          <button
                            type="button"
                            onClick={() => onSendToSuno(item.trackId || selectedTrack.id, item.prompt, item.negativePrompt, item.sliders)}
                            className="p-1 rounded hover:bg-slate-800 text-amber-400"
                            title="Send to Suno Audio Tab"
                          >
                            <Music className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PROMPT EDITOR / CREATOR MODAL */}
      {isEditorOpen && editingPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border p-6 space-y-4 shadow-2xl ${
            isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>{editingPrompt.id.includes('prompt-') ? 'Create New Prompt' : 'Edit Prompt'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              {/* Title & Modality */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Title</label>
                  <input
                    type="text"
                    value={editingPrompt.title}
                    onChange={(e) => setEditingPrompt({ ...editingPrompt, title: e.target.value })}
                    className={`w-full p-2 rounded-xl border focus:outline-none focus:border-indigo-500 ${
                      isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Modality</label>
                  <select
                    value={editingPrompt.modality}
                    onChange={(e) => setEditingPrompt({ ...editingPrompt, modality: e.target.value as any })}
                    className={`w-full p-2 rounded-xl border focus:outline-none focus:border-indigo-500 ${
                      isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="audio">Audio</option>
                  </select>
                </div>
              </div>

              {/* Song & Engine */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Song Association</label>
                  <input
                    type="text"
                    value={editingPrompt.song}
                    onChange={(e) => setEditingPrompt({ ...editingPrompt, song: e.target.value })}
                    className={`w-full p-2 rounded-xl border focus:outline-none focus:border-indigo-500 ${
                      isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Target Engine / Platform</label>
                  <input
                    type="text"
                    value={editingPrompt.engine}
                    onChange={(e) => setEditingPrompt({ ...editingPrompt, engine: e.target.value })}
                    placeholder="e.g. Midjourney / Flux, Veo 3, Suno v5.5"
                    className={`w-full p-2 rounded-xl border focus:outline-none focus:border-indigo-500 ${
                      isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>
              </div>

              {/* Aspect Ratio (if Image or Video) */}
              {(editingPrompt.modality === 'image' || editingPrompt.modality === 'video') && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Aspect Ratio</label>
                  <select
                    value={editingPrompt.aspectRatio || '9:16'}
                    onChange={(e) => setEditingPrompt({ ...editingPrompt, aspectRatio: e.target.value })}
                    className={`w-full p-2 rounded-xl border focus:outline-none focus:border-indigo-500 ${
                      isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <option value="9:16">9:16 (Vertical Shorts / Reels)</option>
                    <option value="16:9">16:9 (Landscape Cinematic)</option>
                    <option value="1:1">1:1 (Square Album Art)</option>
                    <option value="4:3">4:3 (Classic Academy)</option>
                  </select>
                </div>
              )}

              {/* Main Prompt */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Primary Prompt</label>
                <textarea
                  rows={4}
                  value={editingPrompt.prompt}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, prompt: e.target.value })}
                  className={`w-full p-2.5 rounded-xl border focus:outline-none focus:border-indigo-500 ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              {/* Video Specific: Initial 10s & Extension */}
              {editingPrompt.modality === 'video' && (
                <div className="space-y-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-amber-400 font-bold">Video Shorts Multi-Pass Sequence:</div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Initial 10s Prompt</label>
                    <textarea
                      rows={2}
                      value={editingPrompt.initialPrompt || ''}
                      onChange={(e) => setEditingPrompt({ ...editingPrompt, initialPrompt: e.target.value })}
                      className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Extension 10s Prompt (Continuation)</label>
                    <textarea
                      rows={2}
                      value={editingPrompt.extensionPrompt || ''}
                      onChange={(e) => setEditingPrompt({ ...editingPrompt, extensionPrompt: e.target.value })}
                      className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Audio Cues & Sound FX</label>
                    <input
                      type="text"
                      value={editingPrompt.audioCues || ''}
                      onChange={(e) => setEditingPrompt({ ...editingPrompt, audioCues: e.target.value })}
                      className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Audio Specific: BPM, Key, Negative Prompt */}
              {editingPrompt.modality === 'audio' && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">BPM</label>
                    <input
                      type="number"
                      value={editingPrompt.bpm || 100}
                      onChange={(e) => setEditingPrompt({ ...editingPrompt, bpm: Number(e.target.value) })}
                      className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Key</label>
                    <input
                      type="text"
                      value={editingPrompt.key || 'D Minor'}
                      onChange={(e) => setEditingPrompt({ ...editingPrompt, key: e.target.value })}
                      className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] text-slate-400 mb-1">Negative Audio Prompt</label>
                    <input
                      type="text"
                      value={editingPrompt.negativePrompt || ''}
                      onChange={(e) => setEditingPrompt({ ...editingPrompt, negativePrompt: e.target.value })}
                      placeholder="sibilance, autotune, robotic pitch"
                      className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Tags */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={editingPrompt.tags?.join(', ') || ''}
                  onChange={(e) => setEditingPrompt({
                    ...editingPrompt,
                    tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  className={`w-full p-2 rounded-xl border focus:outline-none focus:border-indigo-500 ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSavePrompt(editingPrompt)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-950/60"
              >
                Save Prompt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
