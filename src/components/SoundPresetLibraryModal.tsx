import React, { useState, useMemo } from 'react';
import {
  Sliders,
  Sparkles,
  Zap,
  Bookmark,
  Star,
  Search,
  Check,
  Copy,
  Plus,
  Trash2,
  Edit3,
  X,
  RefreshCw,
  FolderSync,
  Layers,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Download,
  Upload,
  Info,
  ShieldCheck,
  Tag,
  Mic,
  Music,
  Save
} from 'lucide-react';
import { Track, SoundPreset, SoundPresetCategory, EngineSliders } from '../types';
import { savePresetToFirestore, deletePresetFromFirestore } from '../lib/firebase';

interface SoundPresetLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTrack: Track;
  presets: SoundPreset[];
  onApplyPreset: (preset: SoundPreset, options?: { applyVocalCast?: boolean; applyBpm?: boolean; applyKey?: boolean }) => void;
  onCopyText: (text: string, label: string) => void;
  isFirestoreConnected?: boolean;
  isDarkMode?: boolean;
}

const CATEGORIES: { id: SoundPresetCategory | 'ALL' | 'FAVORITES'; label: string; color: string }[] = [
  { id: 'ALL', label: 'All Presets', color: 'from-slate-700 to-slate-800' },
  { id: 'FAVORITES', label: '★ Favorites', color: 'from-amber-600 to-amber-700' },
  { id: 'Blue Collar Rock', label: 'Blue Collar Rock', color: 'from-orange-600 to-rose-700' },
  { id: 'Trap Worship', label: 'Trap Worship', color: 'from-cyan-600 to-blue-700' },
  { id: 'Modern Country', label: 'Modern Country', color: 'from-amber-600 to-yellow-700' },
  { id: 'Acoustic Folk', label: 'Acoustic Folk', color: 'from-emerald-600 to-teal-700' },
  { id: 'Gospel Soul', label: 'Gospel Soul', color: 'from-purple-600 to-indigo-700' },
  { id: 'Ambient Drone', label: 'Ambient Drone', color: 'from-indigo-600 to-violet-800' },
  { id: 'Custom', label: 'Custom User', color: 'from-pink-600 to-rose-700' }
];

export const SoundPresetLibraryModal: React.FC<SoundPresetLibraryModalProps> = ({
  isOpen,
  onClose,
  activeTrack,
  presets,
  onApplyPreset,
  onCopyText,
  isFirestoreConnected = true,
  isDarkMode = true
}) => {
  // Navigation & Filtering
  const [selectedCategory, setSelectedCategory] = useState<SoundPresetCategory | 'ALL' | 'FAVORITES'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPresetId, setExpandedPresetId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'browse' | 'create' | 'import_export'>('browse');

  // Create Custom Preset Form State
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetCategory, setNewPresetCategory] = useState<SoundPresetCategory>('Custom');
  const [newPresetDescription, setNewPresetDescription] = useState('');
  const [newPresetVocalCast, setNewPresetVocalCast] = useState(activeTrack.vocalCast || activeTrack.vocal || '');
  const [newPresetStylePrompt, setNewPresetStylePrompt] = useState(activeTrack.sunoPrompt || '');
  const [newPresetNegativePrompt, setNewPresetNegativePrompt] = useState(activeTrack.negativePrompt || '');
  const [newPresetSliders, setNewPresetSliders] = useState<EngineSliders>(
    activeTrack.engineSliders || { weirdness: 12, styleInfluence: 65, voiceAudio: 100 }
  );
  const [newPresetBpm, setNewPresetBpm] = useState<number>(activeTrack.bpm || 80);
  const [newPresetKey, setNewPresetKey] = useState<string>(activeTrack.key || 'D Minor');
  const [newPresetTags, setNewPresetTags] = useState<string>('#Custom, #UserPreset');
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Apply Options Modal / Drawer
  const [presetToApply, setPresetToApply] = useState<SoundPreset | null>(null);
  const [applyVocalCast, setApplyVocalCast] = useState(true);
  const [applyBpm, setApplyBpm] = useState(false);
  const [applyKey, setApplyKey] = useState(false);
  const [copiedPresetId, setCopiedPresetId] = useState<string | null>(null);

  // Filtered Presets
  const filteredPresets = useMemo(() => {
    return presets.filter(preset => {
      // Category filter
      if (selectedCategory === 'FAVORITES') {
        if (!preset.isFavorite) return false;
      } else if (selectedCategory !== 'ALL') {
        if (preset.category !== selectedCategory) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = preset.name.toLowerCase().includes(q);
        const matchesDesc = preset.description.toLowerCase().includes(q);
        const matchesCategory = preset.category.toLowerCase().includes(q);
        const matchesStyle = preset.sunoPrompt.toLowerCase().includes(q);
        const matchesVocal = (preset.vocalCast || '').toLowerCase().includes(q);
        const matchesTags = preset.tags.some(t => t.toLowerCase().includes(q));
        return matchesName || matchesDesc || matchesCategory || matchesStyle || matchesVocal || matchesTags;
      }

      return true;
    });
  }, [presets, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  // Toggle Favorite
  const handleToggleFavorite = async (preset: SoundPreset, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated: SoundPreset = {
        ...preset,
        isFavorite: !preset.isFavorite,
        updatedAt: new Date().toISOString()
      };
      await savePresetToFirestore(updated);
      onCopyText(`Updated favorite status for "${preset.name}"`, 'Favorite Updated');
    } catch (err) {
      console.error('Failed to toggle preset favorite:', err);
    }
  };

  // Delete Custom Preset
  const handleDeletePreset = async (presetId: string, presetName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete preset "${presetName}"?`)) return;
    try {
      await deletePresetFromFirestore(presetId);
      onCopyText(`Deleted sound preset "${presetName}"`, 'Preset Deleted');
    } catch (err) {
      console.error('Failed to delete preset:', err);
    }
  };

  // Duplicate as custom preset
  const handleDuplicatePreset = (preset: SoundPreset, e: React.MouseEvent) => {
    e.stopPropagation();
    setNewPresetName(`${preset.name} (Custom Copy)`);
    setNewPresetCategory('Custom');
    setNewPresetDescription(`Forked from ${preset.name}: ${preset.description}`);
    setNewPresetVocalCast(preset.vocalCast || '');
    setNewPresetStylePrompt(preset.sunoPrompt);
    setNewPresetNegativePrompt(preset.negativePrompt);
    setNewPresetSliders({ ...preset.engineSliders });
    setNewPresetBpm(preset.targetBpm || 80);
    setNewPresetKey(preset.targetKey || 'D Minor');
    setNewPresetTags(preset.tags.join(', '));
    setActiveTab('create');
  };

  // Save New Custom Preset Form
  const handleSaveNewPreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) {
      alert('Please enter a preset name');
      return;
    }

    setIsSavingPreset(true);
    try {
      const parsedTags = newPresetTags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)
        .map(t => (t.startsWith('#') ? t : `#${t}`));

      const presetId = `PRESET-${Date.now().toString().slice(-6)}-${newPresetName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20)}`;

      const newPreset: SoundPreset = {
        id: presetId,
        name: newPresetName.trim(),
        category: newPresetCategory,
        description: newPresetDescription.trim() || 'Custom sound preset for 4-block engine',
        vocalCast: newPresetVocalCast.trim() || undefined,
        sunoPrompt: newPresetStylePrompt.trim(),
        negativePrompt: newPresetNegativePrompt.trim(),
        engineSliders: newPresetSliders,
        targetBpm: newPresetBpm,
        targetKey: newPresetKey,
        tags: parsedTags.length > 0 ? parsedTags : ['#Custom', '#UserPreset'],
        isFavorite: false,
        isFactory: false,
        author: 'User Engineer',
        createdAt: new Date().toISOString()
      };

      await savePresetToFirestore(newPreset);
      setSaveSuccessMessage(`Sound preset "${newPreset.name}" saved to Firestore & local cache!`);
      setTimeout(() => {
        setSaveSuccessMessage(null);
        setActiveTab('browse');
      }, 1500);
    } catch (err: any) {
      alert(`Failed to save preset: ${err.message || err}`);
    } finally {
      setIsSavingPreset(false);
    }
  };

  // Load from current track
  const handleSyncFromCurrentTrack = () => {
    setNewPresetName(`${activeTrack.title} Sound Formula`);
    setNewPresetVocalCast(activeTrack.vocalCast || activeTrack.vocal || '');
    setNewPresetStylePrompt(activeTrack.sunoPrompt || '');
    setNewPresetNegativePrompt(activeTrack.negativePrompt || '');
    setNewPresetSliders(activeTrack.engineSliders || { weirdness: 12, styleInfluence: 65, voiceAudio: 100 });
    setNewPresetBpm(activeTrack.bpm || 80);
    setNewPresetKey(activeTrack.key || 'D Minor');
    setNewPresetDescription(`Captured from track ${activeTrack.id}: ${activeTrack.title} (${activeTrack.genre}). Thesis: ${activeTrack.thesis}`);
    setNewPresetTags(`#${activeTrack.genre.replace(/\s+/g, '')}, #${activeTrack.id}, #Suno4Block`);
  };

  // Confirm and apply preset
  const handleConfirmApply = () => {
    if (!presetToApply) return;
    onApplyPreset(presetToApply, {
      applyVocalCast,
      applyBpm,
      applyKey
    });
    onCopyText(`Applied "${presetToApply.name}" to 4-Block Engine!`, 'Sound Preset Applied');
    setPresetToApply(null);
    onClose();
  };

  // Copy raw JSON of preset
  const handleCopyPresetJson = (preset: SoundPreset, e: React.MouseEvent) => {
    e.stopPropagation();
    const payload = JSON.stringify(preset, null, 2);
    onCopyText(payload, `${preset.name} JSON Bundle`);
    setCopiedPresetId(preset.id);
    setTimeout(() => setCopiedPresetId(null), 2000);
  };

  // Export all presets
  const handleExportAllPresets = () => {
    const payload = JSON.stringify(presets, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brickos_sound_presets_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onCopyText('Exported all sound presets as JSON', 'Export Complete');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-fadeIn">
        
        {/* HEADER BAR */}
        <div className="p-5 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 p-0.5 shadow-md shadow-amber-950/40">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Sliders className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-white tracking-wide">
                  Sound Preset Library
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 font-mono text-[10px] font-bold border border-amber-700/50 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  Suno v5.5 4-Block Engine
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-700/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {isFirestoreConnected ? 'Firestore Synced' : 'Offline Cache'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Save, load, and audition complete sonic formulas: Style of Music, Artifact Exclusions, Engine Sliders & Vocal Casting.
              </p>
            </div>
          </div>

          {/* Action Tabs & Close */}
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('browse')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  activeTab === 'browse'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Browse Presets ({presets.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSyncFromCurrentTrack();
                  setActiveTab('create');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                  activeTab === 'create'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save New Preset</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* VIEW 1: BROWSE PRESETS */}
        {/* ===================================================================== */}
        {activeTab === 'browse' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Filter & Search Toolbar */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Search & Export Buttons */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 md:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search presets, prompts, tags..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  onClick={handleExportAllPresets}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                  title="Export All Presets as JSON"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                </button>
              </div>
            </div>

            {/* Active Track Target Hint */}
            <div className="px-5 py-2.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 uppercase font-bold text-[10px]">Active Track Target:</span>
                <span className="font-bold text-indigo-300">{activeTrack.id}: {activeTrack.title}</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                  {activeTrack.genre} • {activeTrack.bpm} BPM
                </span>
              </div>
              <span>Showing {filteredPresets.length} of {presets.length} presets</span>
            </div>

            {/* Presets Grid */}
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-4">
              {filteredPresets.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 mx-auto flex items-center justify-center text-slate-500">
                    <Sliders className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">No Sound Presets Match Your Filter</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Try clearing your search query, or click "Save New Preset" to save your track's current 4-block configuration.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCategory('ALL');
                      setSearchQuery('');
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredPresets.map(preset => {
                    const isExpanded = expandedPresetId === preset.id;
                    const isCopied = copiedPresetId === preset.id;

                    return (
                      <div
                        key={preset.id}
                        className="bg-slate-950/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 space-y-3 shadow-md transition flex flex-col justify-between"
                      >
                        {/* Preset Card Top Bar */}
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase tracking-wider ${
                                  preset.category === 'Blue Collar Rock'
                                    ? 'bg-orange-950 text-orange-400 border border-orange-800/40'
                                    : preset.category === 'Trap Worship'
                                    ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/40'
                                    : preset.category === 'Gospel Soul'
                                    ? 'bg-purple-950 text-purple-400 border border-purple-800/40'
                                    : preset.category === 'Acoustic Folk'
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                                    : preset.category === 'Modern Country'
                                    ? 'bg-amber-950 text-amber-400 border border-amber-800/40'
                                    : 'bg-indigo-950 text-indigo-400 border border-indigo-800/40'
                                }`}>
                                  {preset.category}
                                </span>

                                {preset.isFactory ? (
                                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[9px] font-bold">
                                    Factory Formula
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-pink-950 text-pink-300 font-mono text-[9px] font-bold border border-pink-700/40">
                                    Custom Preset
                                  </span>
                                )}

                                {preset.targetBpm && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 font-mono text-[9px]">
                                    {preset.targetBpm} BPM
                                  </span>
                                )}

                                {preset.targetKey && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 font-mono text-[9px]">
                                    {preset.targetKey}
                                  </span>
                                )}
                              </div>

                              <h4 className="text-sm font-black text-white mt-1.5 tracking-wide">
                                {preset.name}
                              </h4>
                            </div>

                            {/* Bookmark / Favorite Button */}
                            <button
                              type="button"
                              onClick={e => handleToggleFavorite(preset, e)}
                              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                preset.isFavorite
                                  ? 'bg-amber-950 text-amber-400 border-amber-700/60'
                                  : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-amber-400'
                              }`}
                              title={preset.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                            >
                              <Star className={`w-3.5 h-3.5 ${preset.isFavorite ? 'fill-amber-400' : ''}`} />
                            </button>
                          </div>

                          <p className="text-xs text-slate-300 leading-relaxed">
                            {preset.description}
                          </p>

                          {preset.vocalCast && (
                            <div className="flex items-center gap-1.5 text-[11px] text-indigo-300 font-mono bg-indigo-950/40 p-2 rounded-xl border border-indigo-900/40">
                              <Mic className="w-3.5 h-3.5 flex-shrink-0 text-indigo-400" />
                              <span className="truncate">Casting: <strong>{preset.vocalCast}</strong></span>
                            </div>
                          )}

                          {/* 4-Block Engine Slider Weights Display */}
                          <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[10px]">
                            <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                              <div className="flex justify-between text-slate-400 mb-1">
                                <span>Weirdness</span>
                                <span className="font-bold text-indigo-400">{preset.engineSliders.weirdness}%</span>
                              </div>
                              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                                <div
                                  className="bg-indigo-500 h-full rounded-full"
                                  style={{ width: `${preset.engineSliders.weirdness}%` }}
                                />
                              </div>
                            </div>

                            <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                              <div className="flex justify-between text-slate-400 mb-1">
                                <span>Style</span>
                                <span className="font-bold text-amber-400">{preset.engineSliders.styleInfluence}%</span>
                              </div>
                              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                                <div
                                  className="bg-amber-500 h-full rounded-full"
                                  style={{ width: `${preset.engineSliders.styleInfluence}%` }}
                                />
                              </div>
                            </div>

                            <div className="bg-slate-900/90 p-2 rounded-xl border border-slate-800">
                              <div className="flex justify-between text-slate-400 mb-1">
                                <span>Voice Clarity</span>
                                <span className="font-bold text-emerald-400">{preset.engineSliders.voiceAudio}%</span>
                              </div>
                              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                                <div
                                  className="bg-emerald-500 h-full rounded-full"
                                  style={{ width: `${preset.engineSliders.voiceAudio}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Expandable Prompt Inspection */}
                          {isExpanded && (
                            <div className="space-y-2 pt-2 border-t border-slate-800 animate-fadeIn text-xs">
                              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                                <span className="text-[10px] uppercase font-bold text-amber-400 font-mono block">
                                  Block 2: Style of Music
                                </span>
                                <p className="text-[11px] text-slate-300 font-mono leading-relaxed select-all">
                                  {preset.sunoPrompt}
                                </p>
                              </div>

                              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                                <span className="text-[10px] uppercase font-bold text-rose-400 font-mono block">
                                  Block 3: Excluded Styles (Artifact Killer)
                                </span>
                                <p className="text-[11px] text-slate-300 font-mono leading-relaxed select-all">
                                  {preset.negativePrompt}
                                </p>
                              </div>

                              {preset.tags && preset.tags.length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap pt-1">
                                  {preset.tags.map((t, idx) => (
                                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 font-mono text-[9px]">
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Bottom Actions Bar */}
                        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setExpandedPresetId(isExpanded ? null : preset.id)}
                            className="text-[11px] text-slate-400 hover:text-slate-200 font-mono flex items-center gap-1 cursor-pointer"
                          >
                            <span>{isExpanded ? 'Hide Prompts' : 'Inspect Prompts'}</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={e => handleCopyPresetJson(preset, e)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                              title="Copy Preset JSON"
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                            </button>

                            <button
                              type="button"
                              onClick={e => handleDuplicatePreset(preset, e)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                              title="Fork / Duplicate as Custom Preset"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                            </button>

                            {!preset.isFactory && (
                              <button
                                type="button"
                                onClick={e => handleDeletePreset(preset.id, preset.name, e)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-rose-400 text-xs font-bold transition cursor-pointer"
                                title="Delete Custom Preset"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setPresetToApply(preset)}
                              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-950 transition cursor-pointer"
                            >
                              <Zap className="w-3.5 h-3.5 fill-current" />
                              <span>Apply to 4-Block</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* VIEW 2: SAVE CURRENT TRACK AS PRESET                                  */}
        {/* ===================================================================== */}
        {activeTab === 'create' && (
          <form onSubmit={handleSaveNewPreset} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Formula Capturer</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Save active 4-block parameters from <strong className="text-indigo-300">{activeTrack.title}</strong> directly into your cloud preset library.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSyncFromCurrentTrack}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Re-Pull from Track</span>
              </button>
            </div>

            {saveSuccessMessage && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-600 text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{saveSuccessMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Preset Title *</label>
                <input
                  type="text"
                  required
                  value={newPresetName}
                  onChange={e => setNewPresetName(e.target.value)}
                  placeholder="e.g. Nashville Electric Anthem"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Category Tag *</label>
                <select
                  value={newPresetCategory}
                  onChange={e => setNewPresetCategory(e.target.value as SoundPresetCategory)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                >
                  <option value="Blue Collar Rock">Blue Collar Rock</option>
                  <option value="Trap Worship">Trap Worship</option>
                  <option value="Modern Country">Modern Country</option>
                  <option value="Acoustic Folk">Acoustic Folk</option>
                  <option value="Gospel Soul">Gospel Soul</option>
                  <option value="Ambient Drone">Ambient Drone</option>
                  <option value="Custom">Custom User</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Description & Production Intent</label>
              <textarea
                rows={2}
                value={newPresetDescription}
                onChange={e => setNewPresetDescription(e.target.value)}
                placeholder="Explain the instrumentation, mood, and theological resonance of this sound formula..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Vocal Cast Archetype</label>
                <input
                  type="text"
                  value={newPresetVocalCast}
                  onChange={e => setNewPresetVocalCast(e.target.value)}
                  placeholder="e.g. Silas Thorne (Gravelly Nashville Voice)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Recommended BPM</label>
                <input
                  type="number"
                  value={newPresetBpm}
                  onChange={e => setNewPresetBpm(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Recommended Key</label>
                <input
                  type="text"
                  value={newPresetKey}
                  onChange={e => setNewPresetKey(e.target.value)}
                  placeholder="e.g. D Minor"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>

            {/* Block 2: Style Prompt */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-amber-400 flex items-center justify-between">
                <span>Block 2: Style of Music Prompt *</span>
                <span className="text-[10px] text-slate-500 font-mono">Suno Style Input</span>
              </label>
              <textarea
                rows={3}
                required
                value={newPresetStylePrompt}
                onChange={e => setNewPresetStylePrompt(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Block 3: Excluded Styles */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-rose-400 flex items-center justify-between">
                <span>Block 3: Excluded Styles (Artifact Killer) *</span>
                <span className="text-[10px] text-slate-500 font-mono">Negative Prompt</span>
              </label>
              <textarea
                rows={2}
                required
                value={newPresetNegativePrompt}
                onChange={e => setNewPresetNegativePrompt(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-rose-400"
              />
            </div>

            {/* Block 4: Engine Sliders */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-4">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                Block 4: Suno Engine Slider Weights
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-300">Weirdness</span>
                    <span className="font-mono text-indigo-400">{newPresetSliders.weirdness}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={newPresetSliders.weirdness}
                    onChange={e => setNewPresetSliders({ ...newPresetSliders, weirdness: Number(e.target.value) })}
                    className="w-full accent-indigo-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-300">Style Influence</span>
                    <span className="font-mono text-amber-400">{newPresetSliders.styleInfluence}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={newPresetSliders.styleInfluence}
                    onChange={e => setNewPresetSliders({ ...newPresetSliders, styleInfluence: Number(e.target.value) })}
                    className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-300">Voice Audio Clarity</span>
                    <span className="font-mono text-emerald-400">{newPresetSliders.voiceAudio}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={newPresetSliders.voiceAudio}
                    onChange={e => setNewPresetSliders({ ...newPresetSliders, voiceAudio: Number(e.target.value) })}
                    className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Tags (Comma-separated)</label>
              <input
                type="text"
                value={newPresetTags}
                onChange={e => setNewPresetTags(e.target.value)}
                placeholder="#Nashville, #Grit, #CustomFormula"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 font-mono"
              />
            </div>

            {/* Form Actions */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('browse')}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSavingPreset}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-950 transition cursor-pointer disabled:opacity-50"
              >
                {isSavingPreset ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{isSavingPreset ? 'Saving to Firestore...' : 'Save Preset to Firestore'}</span>
              </button>
            </div>
          </form>
        )}

        {/* ===================================================================== */}
        {/* APPLY PRESET CONFIRMATION MODAL                                       */}
        {/* ===================================================================== */}
        {presetToApply && (
          <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-amber-500/50 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-bold text-white">Apply Preset to 4-Block Engine</h4>
                </div>
                <button
                  onClick={() => setPresetToApply(null)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                <div className="font-bold text-amber-300 text-sm">{presetToApply.name}</div>
                <p className="text-slate-300 text-[11px]">{presetToApply.description}</p>
                <div className="text-[10px] text-slate-500 font-mono pt-1">
                  Target Track: <strong className="text-white">{activeTrack.id}: {activeTrack.title}</strong>
                </div>
              </div>

              {/* Options Checkboxes */}
              <div className="space-y-2.5 text-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase font-mono block">
                  Application Parameters:
                </span>

                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-2">
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1.5 font-bold">
                    <Check className="w-3.5 h-3.5" />
                    <span>Always Applies: Style of Music (Block 2), Excluded Styles (Block 3), Sliders (Block 4)</span>
                  </div>

                  {presetToApply.vocalCast && (
                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={applyVocalCast}
                        onChange={e => setApplyVocalCast(e.target.checked)}
                        className="rounded accent-amber-500"
                      />
                      <span>Apply Recommended Vocal Cast: <strong>{presetToApply.vocalCast}</strong></span>
                    </label>
                  )}

                  {presetToApply.targetBpm && (
                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={applyBpm}
                        onChange={e => setApplyBpm(e.target.checked)}
                        className="rounded accent-amber-500"
                      />
                      <span>Update Track Tempo to {presetToApply.targetBpm} BPM (Currently: {activeTrack.bpm} BPM)</span>
                    </label>
                  )}

                  {presetToApply.targetKey && (
                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={applyKey}
                        onChange={e => setApplyKey(e.target.checked)}
                        className="rounded accent-amber-500"
                      />
                      <span>Update Track Key to {presetToApply.targetKey} (Currently: {activeTrack.key})</span>
                    </label>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPresetToApply(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApply}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-950 transition cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Confirm & Load into 4-Block</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
