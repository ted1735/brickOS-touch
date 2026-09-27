import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Save,
  Trash2,
  Copy,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  ExternalLink,
  Tag,
  Sliders,
  Eye,
  Folder,
  Disc,
  Upload,
  ArrowRight,
  HelpCircle,
  Wand2
} from 'lucide-react';
import { Track, GeneratedImage, GeneratedVideo, NextcloudFolderAsset, UniversalAssetItem } from '../types';

interface UniversalAssetEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: UniversalAssetItem | null;
  mode: 'edit' | 'add' | 'gemini';
  catalogTracks: Track[];
  onSaveAsset: (updatedAsset: UniversalAssetItem) => void;
  onDeleteAsset?: (assetId: string) => void;
  onDuplicateAsset?: (asset: UniversalAssetItem) => void;
  isDarkMode?: boolean;
}

export const UniversalAssetEditorModal: React.FC<UniversalAssetEditorModalProps> = ({
  isOpen,
  onClose,
  asset,
  mode: initialMode,
  catalogTracks,
  onSaveAsset,
  onDeleteAsset,
  onDuplicateAsset,
  isDarkMode = true
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'gemini' | 'linking'>('details');

  // Form State
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [notes, setNotes] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<'image' | 'video' | 'stem' | 'nextcloud' | 'lyric_checkpoint'>('image');
  const [category, setCategory] = useState('Cover Art');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [primaryTrackId, setPrimaryTrackId] = useState('SOV-001');
  const [linkedTrackIds, setLinkedTrackIds] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [bpm, setBpm] = useState<number | undefined>(undefined);
  const [key, setKey] = useState<string | undefined>(undefined);

  // Gemini Edit State
  const [geminiInstruction, setGeminiInstruction] = useState('');
  const [isGeminiProcessing, setIsGeminiProcessing] = useState(false);
  const [geminiResult, setGeminiResult] = useState<{
    newUrl?: string | null;
    title?: string;
    prompt?: string;
    notes?: string;
    tags?: string[];
    explanation?: string;
  } | null>(null);
  const [geminiError, setGeminiError] = useState<string | null>(null);

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sync state when asset changes or modal opens
  React.useEffect(() => {
    if (asset) {
      setName(asset.name || '');
      setPrompt(asset.prompt || '');
      setNotes(asset.notes || '');
      setUrl(asset.url || '');
      setType(asset.type || 'image');
      setCategory(asset.category || (asset.type === 'video' ? 'Veo Reel' : asset.type === 'stem' ? 'UVR5 Stem' : 'Cover Art'));
      setAspectRatio(asset.aspectRatio || (asset.type === 'video' ? '16:9' : '1:1'));
      setPrimaryTrackId(asset.trackId || (catalogTracks[0]?.id || 'SOV-001'));
      setLinkedTrackIds(asset.linkedTrackIds || []);
      setTags(asset.tags || []);
      setBpm(asset.bpm);
      setKey(asset.key);
    } else {
      // New Asset default values
      setName('New Studio Visual Asset');
      setPrompt('Cinematic album cover aesthetic, weathered cedar wood, warm dramatic lighting, 8k');
      setNotes('');
      setUrl('');
      setType('image');
      setCategory('Cover Art');
      setAspectRatio('1:1');
      setPrimaryTrackId(catalogTracks[0]?.id || 'SOV-001');
      setLinkedTrackIds([]);
      setTags(['Visual', 'Master']);
      setBpm(undefined);
      setKey(undefined);
    }
    setActiveTab(initialMode === 'gemini' ? 'gemini' : 'details');
    setGeminiResult(null);
    setGeminiError(null);
    setShowDeleteConfirm(false);
  }, [asset, initialMode, catalogTracks, isOpen]);

  if (!isOpen) return null;

  const currentPrimaryTrack = catalogTracks.find(t => t.id === primaryTrackId) || catalogTracks[0];

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const toggleLinkedTrack = (trkId: string) => {
    if (trkId === primaryTrackId) return; // Cannot link to primary (it is already primary)
    if (linkedTrackIds.includes(trkId)) {
      setLinkedTrackIds(linkedTrackIds.filter(id => id !== trkId));
    } else {
      setLinkedTrackIds([...linkedTrackIds, trkId]);
    }
  };

  // Ask Gemini to Change Something
  const handleAskGemini = async (action: 'modify_image' | 'refine_prompt' = 'modify_image') => {
    if (!geminiInstruction.trim()) {
      setGeminiError('Please enter what you want Gemini to change about this asset.');
      return;
    }
    setIsGeminiProcessing(true);
    setGeminiError(null);

    try {
      const response = await fetch('/api/gemini/modify-asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: asset?.id || 'new-asset',
          assetType: type,
          currentName: name,
          currentPrompt: prompt,
          currentUrl: url,
          userInstruction: geminiInstruction,
          aspectRatio,
          action,
          targetTrackTitle: currentPrimaryTrack ? `${currentPrimaryTrack.id}: ${currentPrimaryTrack.title}` : 'Studio Catalog Master'
        })
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to modify asset with Gemini');
      }

      setGeminiResult(data);
    } catch (err: any) {
      console.error('Gemini asset modify error:', err);
      setGeminiError(err.message || 'Gemini processing failed. Please check connection.');
    } finally {
      setIsGeminiProcessing(false);
    }
  };

  // Apply Gemini result directly to form
  const handleApplyGeminiResult = (replaceImage = true) => {
    if (!geminiResult) return;
    if (replaceImage && geminiResult.newUrl) {
      setUrl(geminiResult.newUrl);
    }
    if (geminiResult.title) {
      setName(geminiResult.title);
    }
    if (geminiResult.prompt) {
      setPrompt(geminiResult.prompt);
    }
    if (geminiResult.notes) {
      setNotes((notes ? notes + '\n' : '') + `[Gemini Update]: ${geminiResult.notes}`);
    }
    if (geminiResult.tags && geminiResult.tags.length > 0) {
      const merged = Array.from(new Set([...tags, ...geminiResult.tags]));
      setTags(merged);
    }
    setActiveTab('details');
  };

  // Submit and save
  const handleSave = () => {
    const updated: UniversalAssetItem = {
      id: asset?.id || `asset-${Date.now()}`,
      type,
      name: name.trim() || 'Untitled Asset',
      url: url.trim(),
      prompt: prompt.trim(),
      notes: notes.trim(),
      trackId: primaryTrackId,
      trackTitle: currentPrimaryTrack?.title || 'Unknown',
      linkedTrackIds,
      category,
      aspectRatio,
      bpm,
      key,
      tags,
      timestamp: asset?.timestamp || new Date().toISOString().split('T')[0],
      originalRef: asset?.originalRef,
      source: asset?.source || (category.toLowerCase().includes('flow') ? 'google_flow' : undefined),
      flowAssetUrl: asset?.flowAssetUrl,
      driveUrl: asset?.driveUrl
    };

    onSaveAsset(updated);
    onClose();
  };

  // Quick Preset Prompts for Gemini
  const quickGeminiPrompts = [
    'Add warm golden-hour rim lighting with Nashville woodshop dust motes',
    'Change color grading to high-contrast blue-collar monochrome with amber dials',
    'Infuse subtle Throne Room Kintsugi gold seams along the broken edges',
    'Reframe composition for 9:16 vertical social video plate with room for hook lyrics',
    'Increase photorealism, fine-tune textures to aged Tennessee white oak',
    'Remove distractions and sharpen the central theological focal point'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`w-full max-w-4xl max-h-[92vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden transition-all ${
          isDarkMode ? 'bg-slate-900 border-slate-700 text-white shadow-indigo-950/40' : 'bg-white border-slate-300 text-slate-900 shadow-xl'
        }`}
      >
        {/* HEADER BAR */}
        <div className={`px-6 py-4 border-b flex items-center justify-between gap-4 flex-shrink-0 ${
          isDarkMode ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 flex items-center justify-center text-white shadow-md">
              {type === 'image' && <ImageIcon className="w-5 h-5" />}
              {type === 'video' && <Video className="w-5 h-5" />}
              {type === 'stem' && <Music className="w-5 h-5" />}
              {type === 'nextcloud' && <Folder className="w-5 h-5" />}
              {type === 'lyric_checkpoint' && <FileText className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold">
                  {initialMode === 'add' ? 'Add New Studio Asset' : `Edit Asset: ${name || 'Untitled'}`}
                </h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${
                  isDarkMode ? 'bg-indigo-950 text-indigo-300 border-indigo-700/50' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}>
                  {type.toUpperCase()}
                </span>
                {asset?.source === 'google_flow' && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold bg-cyan-950 text-cyan-300 border-cyan-700/60 flex items-center gap-1 shadow-xs">
                    <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                    <span>Google Flow</span>
                  </span>
                )}
                <span className="text-xs text-amber-500 font-mono font-bold">
                  {currentPrimaryTrack?.id} ({currentPrimaryTrack?.title})
                </span>
              </div>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Full control over metadata, cross-project links, and AI image modification with Gemini.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition ${
                isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
              }`}
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className={`px-6 py-2 border-b flex items-center justify-between gap-2 overflow-x-auto ${
          isDarkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-100/50'
        }`}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'details'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : isDarkMode
                  ? 'text-slate-300 hover:bg-slate-800'
                  : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Asset Details & Metadata</span>
            </button>

            <button
              onClick={() => setActiveTab('gemini')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'gemini'
                  ? 'bg-gradient-to-r from-purple-600 to-amber-600 text-white shadow-md'
                  : isDarkMode
                  ? 'text-purple-300 hover:bg-purple-950/50 border border-purple-800/40'
                  : 'text-purple-700 hover:bg-purple-50 border border-purple-200'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Ask Gemini to Change Asset</span>
            </button>

            <button
              onClick={() => setActiveTab('linking')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'linking'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : isDarkMode
                  ? 'text-emerald-300 hover:bg-emerald-950/50 border border-emerald-800/40'
                  : 'text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
              }`}
            >
              <LinkIcon className="w-4 h-4" />
              <span>Cross-Project Links ({linkedTrackIds.length})</span>
            </button>
          </div>

          <div className="text-xs font-mono text-slate-400">
            {linkedTrackIds.length > 0 ? (
              <span className="text-emerald-400 font-bold">Shared across {linkedTrackIds.length + 1} projects</span>
            ) : (
              <span>Single project bound</span>
            )}
          </div>
        </div>

        {/* BODY CONTENT SCROLLER */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ======================================================== */}
          {/* TAB 1: ASSET DETAILS & METADATA                         */}
          {/* ======================================================== */}
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left preview column */}
              <div className="lg:col-span-5 space-y-4">
                <div className={`p-4 rounded-2xl border space-y-3 ${
                  isDarkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>Asset Media Preview</span>
                    <span className="font-mono text-[10px] text-indigo-400">{aspectRatio}</span>
                  </label>

                  {/* Preview container */}
                  <div className={`relative rounded-xl overflow-hidden border flex items-center justify-center min-h-[220px] ${
                    isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-200 border-slate-300'
                  }`}>
                    {url ? (
                      type === 'video' ? (
                        <video src={url} controls className="w-full max-h-[280px] object-cover" />
                      ) : (
                        <img src={url} alt={name} className="w-full max-h-[280px] object-cover" />
                      )
                    ) : (
                      <div className="p-8 text-center space-y-2">
                        <ImageIcon className="w-12 h-12 text-slate-600 mx-auto" />
                        <p className="text-xs text-slate-400">No media URL specified</p>
                      </div>
                    )}

                    <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setActiveTab('gemini')}
                        className="px-2.5 py-1 rounded-lg bg-black/75 hover:bg-black text-white text-[11px] font-bold backdrop-blur-xs flex items-center gap-1 transition cursor-pointer"
                        title="Edit image with Gemini AI"
                      >
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>Edit with Gemini</span>
                      </button>
                    </div>
                  </div>

                  {/* Media URL Input */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Direct Media URL / Base64</label>
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://... or data:image/png;base64,..."
                      className={`w-full p-2.5 rounded-xl border text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                        isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  {/* Quick File Upload helper */}
                  <div className="pt-1">
                    <label className={`w-full py-2 px-3 rounded-xl border border-dashed text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition ${
                      isDarkMode ? 'border-slate-700 hover:border-indigo-500 text-slate-400 hover:text-white bg-slate-900/50' : 'border-slate-300 hover:border-indigo-500 text-slate-600 bg-white'
                    }`}>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Local File (Image / Audio)</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,audio/*,video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === 'string') {
                                setUrl(reader.result);
                                if (!name || name === 'New Studio Visual Asset') {
                                  setName(file.name.replace(/\.[^/.]+$/, ''));
                                }
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Right metadata editor column */}
              <div className="lg:col-span-7 space-y-4">
                {/* Asset Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Asset Name / Title</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Master's Hand Kintsugi Cover Art"
                    className={`w-full p-2.5 rounded-xl border text-sm font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                      isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                {/* Primary Project Reassignment */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
                      Primary Assigned Project
                    </label>
                    <select
                      value={primaryTrackId}
                      onChange={(e) => setPrimaryTrackId(e.target.value)}
                      className={`w-full p-2.5 rounded-xl border text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer ${
                        isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    >
                      {catalogTracks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.id}: {t.title} ({t.ep})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-0.5">Reassigns this asset to a new master catalog track.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
                      Asset Category & Type
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value as any)}
                        className={`w-1/2 p-2.5 rounded-xl border text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer ${
                          isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      >
                        <option value="image">Image / Art</option>
                        <option value="video">Veo Video</option>
                        <option value="stem">Audio Stem</option>
                        <option value="nextcloud">Nextcloud File</option>
                        <option value="lyric_checkpoint">Lyric Checkpoint</option>
                      </select>

                      <input
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="Category (e.g. Cover Art)"
                        className={`w-1/2 p-2.5 rounded-xl border text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                          isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Aspect Ratio & Musical Keys */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Aspect Ratio</label>
                    <select
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value)}
                      className={`w-full p-2.5 rounded-xl border text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer ${
                        isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    >
                      <option value="1:1">1:1 Square (Album Cover)</option>
                      <option value="9:16">9:16 Portrait (Shorts/TikTok)</option>
                      <option value="16:9">16:9 Landscape (YouTube)</option>
                      <option value="4:3">4:3 Standard</option>
                      <option value="3:4">3:4 Portrait</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">BPM (if audio)</label>
                    <input
                      type="number"
                      value={bpm || ''}
                      onChange={(e) => setBpm(e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="e.g. 96"
                      className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                        isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Key (if audio)</label>
                    <input
                      type="text"
                      value={key || ''}
                      onChange={(e) => setKey(e.target.value)}
                      placeholder="e.g. D Major"
                      className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                        isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                {/* Prompt / Description */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Generation Prompt / Creative Thesis
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveTab('gemini')}
                      className="text-[11px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>Ask Gemini to rewrite prompt</span>
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter the full artistic prompt, camera motion, or production instructions..."
                    className={`w-full p-2.5 rounded-xl border text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                      isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
                    Tags & Theological Keywords
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="Add tag and press Enter..."
                      className={`flex-1 p-2 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                        isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition"
                    >
                      Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                          isDarkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-200 text-slate-800 border-slate-300'
                        }`}
                      >
                        <Tag className="w-3 h-3 text-indigo-400" />
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 text-slate-400 hover:text-rose-400"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">
                    Production Notes & History
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Audit notes, Nextcloud file links, or mastering details..."
                    className={`w-full p-2.5 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                      isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: ASK GEMINI TO CHANGE ASSET (AI CREATIVE ASSIST)    */}
          {/* ======================================================== */}
          {activeTab === 'gemini' && (
            <div className="space-y-6">
              <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                isDarkMode ? 'bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-amber-950/30 border-purple-800/40' : 'bg-purple-50 border-purple-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-600 text-white">
                    <Sparkles className="w-6 h-6 text-amber-300" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">Ask Gemini AI to Modify This Asset</h4>
                    <p className={`text-xs ${isDarkMode ? 'text-purple-200/80' : 'text-purple-800'}`}>
                      Describe what you want Gemini to change about this image or prompt (lighting, symbolism, colors, framing, or theological depth).
                    </p>
                  </div>
                </div>
              </div>

              {/* Current Asset Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Target Asset</span>
                  <div className="font-bold text-xs truncate mt-1">{name}</div>
                  <div className="text-[11px] text-indigo-400 font-mono">{primaryTrackId} ({currentPrimaryTrack?.title})</div>
                </div>

                <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Target Aspect Ratio</span>
                  <div className="font-bold text-xs mt-1">{aspectRatio}</div>
                  <div className="text-[11px] text-slate-400 font-mono">Format: {type.toUpperCase()}</div>
                </div>

                <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Gemini Model</span>
                  <div className="font-bold text-xs mt-1 text-emerald-400">gemini-3.1-flash-image</div>
                  <div className="text-[11px] text-slate-400 font-mono">Multimodal Image-to-Image</div>
                </div>
              </div>

              {/* Instruction Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  What do you want Gemini to change about this asset?
                </label>
                <textarea
                  rows={3}
                  value={geminiInstruction}
                  onChange={(e) => setGeminiInstruction(e.target.value)}
                  placeholder="e.g. Change the background to a sunrise over misty Tennessee mountains, enhance the golden light on the workbench, and add subtle gold Kintsugi seams to the broken woodwork..."
                  className={`w-full p-3 rounded-2xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    isDarkMode ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              {/* Quick suggestion pills */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400">Quick Creative Directives:</span>
                <div className="flex flex-wrap gap-1.5">
                  {quickGeminiPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setGeminiInstruction(p)}
                      className={`text-[11px] px-2.5 py-1 rounded-xl border text-left transition cursor-pointer ${
                        isDarkMode
                          ? 'bg-slate-900/80 hover:bg-purple-950/60 text-slate-300 hover:text-white border-slate-800 hover:border-purple-600'
                          : 'bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-900 border-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleAskGemini('modify_image')}
                  disabled={isGeminiProcessing || !geminiInstruction.trim()}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-950/60 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isGeminiProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                      <span>Gemini is creating modified image...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Modify Image with Gemini</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleAskGemini('refine_prompt')}
                  disabled={isGeminiProcessing || !geminiInstruction.trim()}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                    isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-purple-300 border-purple-800/40' : 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-200'
                  }`}
                >
                  <Wand2 className="w-4 h-4 text-purple-400" />
                  <span>Refine Concept & Prompt Only</span>
                </button>
              </div>

              {/* Error Message */}
              {geminiError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{geminiError}</span>
                </div>
              )}

              {/* Gemini Result Comparison */}
              {geminiResult && (
                <div className={`p-5 rounded-3xl border space-y-4 animate-in fade-in duration-200 ${
                  isDarkMode ? 'bg-slate-950/90 border-purple-600/50' : 'bg-purple-50/70 border-purple-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span>Gemini Generated New Modification!</span>
                    </span>
                    <span className="text-[11px] text-slate-400">{geminiResult.explanation}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Before */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Original Asset</span>
                      <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900 aspect-square flex items-center justify-center">
                        {url ? (
                          <img src={url} alt="Original" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs text-slate-500">No original image</span>
                        )}
                      </div>
                    </div>

                    {/* After */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-amber-400 uppercase flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Gemini's Modified Version</span>
                      </span>
                      <div className="rounded-xl overflow-hidden border border-purple-500 bg-slate-900 aspect-square flex items-center justify-center relative">
                        {geminiResult.newUrl ? (
                          <img src={geminiResult.newUrl} alt="Modified" className="w-full h-full object-cover" />
                        ) : (
                          <div className="p-4 text-center text-xs text-slate-400">
                            Metadata & prompt refined successfully
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {geminiResult.prompt && (
                    <div className={`p-3 rounded-xl border text-xs font-mono ${
                      isDarkMode ? 'bg-slate-900 border-slate-800 text-purple-200' : 'bg-white border-purple-200 text-purple-900'
                    }`}>
                      <span className="font-bold text-amber-400 block mb-1">Generated Prompt:</span>
                      {geminiResult.prompt}
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleApplyGeminiResult(true)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Apply Changes to This Asset</span>
                    </button>

                    {onDuplicateAsset && geminiResult.newUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          const newAsset: UniversalAssetItem = {
                            id: `asset-gemini-${Date.now()}`,
                            type: 'image',
                            name: geminiResult.title || `${name} (Gemini Refinement)`,
                            url: geminiResult.newUrl,
                            prompt: geminiResult.prompt || prompt,
                            notes: `Created via Gemini: "${geminiInstruction}"`,
                            trackId: primaryTrackId,
                            trackTitle: currentPrimaryTrack?.title || 'Studio Master',
                            linkedTrackIds,
                            category,
                            aspectRatio,
                            tags: geminiResult.tags || tags,
                            timestamp: new Date().toISOString().split('T')[0]
                          };
                          onDuplicateAsset(newAsset);
                          onClose();
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-2 cursor-pointer ${
                          isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                        }`}
                      >
                        <Copy className="w-4 h-4" />
                        <span>Save as New Asset Variation</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: CROSS-PROJECT LINKING & REASSIGNMENT               */}
          {/* ======================================================== */}
          {activeTab === 'linking' && (
            <div className="space-y-6">
              <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                isDarkMode ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-600 text-white">
                    <LinkIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">Link the Same Asset to Multiple Projects</h4>
                    <p className="text-xs opacity-80">
                      Check any additional tracks to link this asset to. When viewing those tracks, this asset will automatically appear in their repository!
                    </p>
                  </div>
                </div>
              </div>

              {/* Current Status Banner */}
              <div className="flex items-center justify-between text-xs px-1">
                <span>
                  Primary Project: <strong className="text-indigo-400 font-bold">{primaryTrackId} ({currentPrimaryTrack?.title})</strong>
                </span>
                <span className="font-mono text-emerald-400 font-bold">
                  {linkedTrackIds.length} Additional Projects Linked
                </span>
              </div>

              {/* Track Selection Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {catalogTracks.map((trk) => {
                  const isPrimary = trk.id === primaryTrackId;
                  const isLinked = linkedTrackIds.includes(trk.id);

                  return (
                    <div
                      key={trk.id}
                      onClick={() => !isPrimary && toggleLinkedTrack(trk.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between gap-2 ${
                        isPrimary
                          ? isDarkMode
                            ? 'bg-indigo-950/60 border-indigo-600 text-white shadow-xs'
                            : 'bg-indigo-50 border-indigo-400 text-indigo-900'
                          : isLinked
                          ? isDarkMode
                            ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-xs'
                            : 'bg-emerald-50 border-emerald-400 text-emerald-900'
                          : isDarkMode
                          ? 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                      }`}
                    >
                      <div className="min-w-0 pr-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold text-slate-400">{trk.id}</span>
                          <span className="font-bold text-xs truncate max-w-[130px]">{trk.title}</span>
                        </div>
                        <span className="text-[10px] opacity-70 truncate block">{trk.ep}</span>
                      </div>

                      <div>
                        {isPrimary ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-600 text-white">
                            Primary
                          </span>
                        ) : isLinked ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-600 text-white flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            <span>Linked</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded-md border border-slate-700">
                            + Link
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bulk Link Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const allOtherIds = catalogTracks.filter(t => t.id !== primaryTrackId).map(t => t.id);
                    setLinkedTrackIds(allOtherIds);
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }`}
                >
                  Link to All 26 Catalog Songs
                </button>
                <button
                  type="button"
                  onClick={() => setLinkedTrackIds([])}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                    isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  Clear All Links
                </button>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className={`px-6 py-4 border-t flex items-center justify-between gap-4 flex-shrink-0 ${
          isDarkMode ? 'border-slate-800 bg-slate-950/80' : 'border-slate-200 bg-slate-50'
        }`}>
          <div>
            {asset && onDeleteAsset && (
              showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-rose-400 font-bold">Delete permanently?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteAsset(asset.id);
                      onClose();
                    }}
                    className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
                  >
                    Yes, Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/50 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Asset</span>
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-950/50 flex items-center gap-2 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{initialMode === 'add' ? 'Save & Add Asset' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
