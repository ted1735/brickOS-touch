import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Music,
  Plus,
  Trash2,
  Save,
  Check,
  Share2,
  Layers,
  ArrowRight,
  Eye,
  Type,
  FileText,
  Image as ImageIcon,
  Cloud,
  HardDrive,
  Copy,
  Download,
  Upload,
  Link as LinkIcon,
  Unlink,
  Move,
  Lock,
  Unlock,
  Sliders,
  CheckSquare,
  Square,
  Grid,
  Palette,
  Send,
  RefreshCw,
  Columns,
  BookOpen,
  HelpCircle,
  FolderSync,
  Video,
  Search,
  ChevronUp,
  ChevronDown,
  Database,
  Radio,
  ExternalLink,
  X,
  GitCompare
} from 'lucide-react';
import {
  Track,
  WhiteboardCanvasDoc,
  BlockSuiteBlock,
  BlockSuiteBlockType,
  BlockSuiteConnector,
  NextcloudSyncConfig,
  NextcloudFolderAsset
} from '../types';
import {
  loadWhiteboardFromFirestore,
  saveWhiteboardToFirestore,
  subscribeToFirestoreWhiteboard,
  isFirebaseConfigured
} from '../lib/firebase';
import { getSavedNextcloudConfig } from '../data/nextcloudFolderAssets';
import { getTrackNextcloudAssets } from '../data/nextcloudAssetIndex';
import { BlockSuiteGuideModal } from './BlockSuiteGuideModal';
import { BlockSuiteThreeSongComparatorModal } from './BlockSuiteThreeSongComparatorModal';
import { getSubstantiveLyrics, parseLyricSections, ParsedLyricSection } from '../utils/lyricParser';

interface BlockSuiteBrainstormingTabProps {
  tracks: Track[];
  selectedTrack: Track;
  onSelectTrack: (track: Track) => void;
  onUpdateTrackLyrics: (lyrics: string, versionTag: string) => void;
  onNavigateToTab?: (tab: string) => void;
  onSendToVideoExpress?: (sceneData: { title: string; prompt: string; shotNumber?: string; imageUrl?: string }) => void;
  isDarkMode?: boolean;
}

const COLOR_OPTIONS = [
  { id: 'indigo', name: 'Indigo / Verse', border: 'border-indigo-500/60', bg: 'bg-indigo-950/80', text: 'text-indigo-300', hex: '#6366f1' },
  { id: 'cyan', name: 'Cyan / Chorus', border: 'border-cyan-500/60', bg: 'bg-cyan-950/80', text: 'text-cyan-300', hex: '#06b6d4' },
  { id: 'amber', name: 'Amber / Bridge', border: 'border-amber-500/60', bg: 'bg-amber-950/80', text: 'text-amber-300', hex: '#f59e0b' },
  { id: 'rose', name: 'Rose / Hook', border: 'border-rose-500/60', bg: 'bg-rose-950/80', text: 'text-rose-300', hex: '#f43f5e' },
  { id: 'emerald', name: 'Emerald / SOP', border: 'border-emerald-500/60', bg: 'bg-emerald-950/80', text: 'text-emerald-300', hex: '#10b981' },
  { id: 'purple', name: 'Purple / Suno', border: 'border-purple-500/60', bg: 'bg-purple-950/80', text: 'text-purple-300', hex: '#a855f7' },
  { id: 'slate', name: 'Slate / Note', border: 'border-slate-700', bg: 'bg-slate-900/90', text: 'text-slate-300', hex: '#64748b' }
];

export const BlockSuiteBrainstormingTab: React.FC<BlockSuiteBrainstormingTabProps> = ({
  tracks,
  selectedTrack,
  onSelectTrack,
  onUpdateTrackLyrics,
  onNavigateToTab,
  onSendToVideoExpress,
  isDarkMode = true
}) => {
  // Isomorphic BlockSuite View Mode: 'edgeless' (infinite whiteboard) vs 'page' (linear document)
  const [viewMode, setViewMode] = useState<'edgeless' | 'page'>('edgeless');

  // Canvas Viewport Transformation
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [gridStyle, setGridStyle] = useState<'dots' | 'grid' | 'blueprint' | 'blank'>('dots');

  // Canvas Blocks & Connectors State
  const [blocks, setBlocks] = useState<BlockSuiteBlock[]>([]);
  const [connectors, setConnectors] = useState<BlockSuiteConnector[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  // Dragging single block
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Connector drawing state
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);

  // Firestore Sync & Status
  const [firestoreStatus, setFirestoreStatus] = useState<'saved' | 'saving' | 'offline' | 'error'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>('');

  // Nextcloud Export & Backup Status
  const [isExportingNextcloud, setIsExportingNextcloud] = useState<boolean>(false);
  const [nextcloudBackupNotice, setNextcloudBackupNotice] = useState<{
    success: boolean;
    message: string;
    path?: string;
  } | null>(null);

  // Toast / feedback message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Storyboard Thumbnail Image Asset Modal state
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [newImageTitle, setNewImageTitle] = useState<string>('');
  const [newImageShotNumber, setNewImageShotNumber] = useState<string>('Scene 1 / Shot A');
  const [newImageNotes, setNewImageNotes] = useState<string>('');

  // Whiteboard Canvas Lyrics & Word Search State
  const [searchQuery, setSearchQuery] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const q = localStorage.getItem('brickos_whiteboard_search_query');
      if (q) {
        localStorage.removeItem('brickos_whiteboard_search_query');
        return q;
      }
    }
    return '';
  });
  const [searchFilterType, setSearchFilterType] = useState<'all' | 'lyrics' | 'notes' | 'chords' | 'images'>('all');
  const [focusedMatchIndex, setFocusedMatchIndex] = useState<number>(0);
  const [showSearchResultsList, setShowSearchResultsList] = useState<boolean>(false);

  // 3-Song Multi-Comparison & Whiteboard Instructions Modals
  const [isThreeSongModalOpen, setIsThreeSongModalOpen] = useState<boolean>(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);
  const [showQuickGuideBanner, setShowQuickGuideBanner] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('brickos_whiteboard_quick_guide');
      return saved !== 'hidden';
    }
    return true;
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<any>(null);

  const showToast = (msg: string, _type?: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter matching blocks
  const matchingBlocks = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const term = searchQuery.toLowerCase().trim();

    return blocks.filter((b) => {
      if (searchFilterType === 'lyrics' && b.type !== 'song_section') return false;
      if (searchFilterType === 'notes' && b.type !== 'sticky_note') return false;
      if (searchFilterType === 'chords' && b.type !== 'chords_prog') return false;
      if (searchFilterType === 'images' && !b.imageUrl && b.type !== 'thumbnail_asset') return false;

      const inTitle = (b.title || '').toLowerCase().includes(term);
      const inSubtitle = (b.subtitle || '').toLowerCase().includes(term);
      const inContent = (b.content || '').toLowerCase().includes(term);
      const inSectionTag = (b.sectionTag || '').toLowerCase().includes(term);
      const inChords = (b.chords || '').toLowerCase().includes(term);
      const inShot = (b.shotNumber || '').toLowerCase().includes(term);
      const inTags = (b.tags || []).some(t => t.toLowerCase().includes(term));

      return inTitle || inSubtitle || inContent || inSectionTag || inChords || inShot || inTags;
    });
  }, [blocks, searchQuery, searchFilterType]);

  const matchingBlockIds = useMemo(() => {
    return matchingBlocks.map(b => b.id);
  }, [matchingBlocks]);

  // Pan canvas to center on block
  const panToBlock = (blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const blockW = block.width || 280;
    const targetX = (rect.width / 2) - (block.x + blockW / 2) * zoom;
    const targetY = (rect.height / 2) - (block.y + 100) * zoom;
    setPan({ x: targetX, y: targetY });
    setSelectedBlockId(block.id);
  };

  const handleNextSearchMatch = () => {
    if (!matchingBlocks.length) return;
    const nextIdx = (focusedMatchIndex + 1) % matchingBlocks.length;
    setFocusedMatchIndex(nextIdx);
    panToBlock(matchingBlocks[nextIdx].id);
  };

  const handlePrevSearchMatch = () => {
    if (!matchingBlocks.length) return;
    const prevIdx = (focusedMatchIndex - 1 + matchingBlocks.length) % matchingBlocks.length;
    setFocusedMatchIndex(prevIdx);
    panToBlock(matchingBlocks[prevIdx].id);
  };

  // Helper to generate default blocks from track lyrics (and specific style/version)
  const generateInitialBlocksFromTrack = (
    track: Track,
    customLyrics?: string,
    styleLabel?: string
  ): { blocks: BlockSuiteBlock[]; connectors: BlockSuiteConnector[] } => {
    const rawLyrics = customLyrics || getSubstantiveLyrics(track, activeStyleIndex);
    const parsedSections = parseLyricSections(rawLyrics);
    const newBlocks: BlockSuiteBlock[] = [];
    const newConnectors: BlockSuiteConnector[] = [];

    let currentX = 120;
    let currentY = 100;

    // Header / Song Meta block
    const metaBlock: BlockSuiteBlock = {
      id: `meta_${Date.now()}`,
      type: 'theology_sop',
      title: `${track.title} — Song Thesis & SOP`,
      subtitle: `${styleLabel ? `Style: ${styleLabel} • ` : ''}Key: ${track.key} • ${track.bpm} BPM • EP: ${track.ep}`,
      content: `Thesis: ${track.thesis || 'Christocentric sovereign theological anchor.'}\nVocal Cast: ${track.vocalCast || track.vocal || 'Lead'}\nNashville Rule: Enforce Throne Room Pivot before bridge. 3:1 Sonic Scar rule active.`,
      x: currentX,
      y: currentY,
      width: 380,
      color: 'emerald',
      tags: ['SOP', 'Thesis', track.key, `${track.bpm} BPM`],
      orderIndex: 0
    };
    newBlocks.push(metaBlock);

    currentX += 440;

    let previousSectionId: string | null = null;

    if (parsedSections.length > 0) {
      parsedSections.forEach((sec, index) => {
        const tag = sec.tag;
        const bodyContent = sec.content;
        const lowerTag = tag.toLowerCase();

        let color = 'indigo';
        if (lowerTag.includes('chorus')) color = 'cyan';
        else if (lowerTag.includes('bridge')) color = 'amber';
        else if (lowerTag.includes('hook') || lowerTag.includes('drop') || lowerTag.includes('explosive') || lowerTag.includes('shout')) color = 'rose';
        else if (lowerTag.includes('intro') || lowerTag.includes('outro') || lowerTag.includes('tag')) color = 'purple';
        else if (lowerTag.includes('stop') || lowerTag.includes('silence')) color = 'slate';

        const blockId = `block_${index + 1}_${Date.now()}`;
        const newBlock: BlockSuiteBlock = {
          id: blockId,
          type: 'song_section',
          title: tag,
          subtitle: `Arrangement Part #${index + 1}`,
          content: bodyContent || `[${tag} Instrumental arrangement bed]`,
          x: currentX,
          y: currentY + (index % 2 === 0 ? 0 : 40),
          width: 340,
          color,
          sectionTag: tag,
          tags: ['Lyrics', tag.replace(/[[\]]/g, '')],
          orderIndex: index + 1
        };
        newBlocks.push(newBlock);

        // Add visual arrangement connector from previous section
        if (previousSectionId) {
          newConnectors.push({
            id: `conn_${previousSectionId}_${blockId}`,
            sourceBlockId: previousSectionId,
            targetBlockId: blockId,
            label: 'flow',
            color: '#6366f1'
          });
        }
        previousSectionId = blockId;

        currentX += 380;
        if (currentX > 1700) {
          currentX = 120;
          currentY += 440;
        }
      });
    } else {
      // Default template arrangement blocks if completely empty
      const verse1: BlockSuiteBlock = {
        id: `blk_v1_${Date.now()}`,
        type: 'song_section',
        title: '[Verse 1]',
        content: "Standing in the quiet place\nShadows fall across my face\nWhisper through the broken stone\nTell me I am not alone",
        x: currentX,
        y: currentY,
        width: 320,
        color: 'indigo',
        sectionTag: '[Verse 1]',
        orderIndex: 1
      };
      const chorus: BlockSuiteBlock = {
        id: `blk_ch_${Date.now() + 1}`,
        type: 'song_section',
        title: '[Chorus]',
        content: "You are the rock that will not shake\nThe only promise that won't break\nThrough fire and the raging sea\nYour sovereign hand is holding me",
        x: currentX + 360,
        y: currentY,
        width: 320,
        color: 'cyan',
        sectionTag: '[Chorus]',
        orderIndex: 2
      };
      newBlocks.push(verse1, chorus);
      newConnectors.push({
        id: `conn_${verse1.id}_${chorus.id}`,
        sourceBlockId: verse1.id,
        targetBlockId: chorus.id,
        label: 'build',
        color: '#06b6d4'
      });
    }

    return { blocks: newBlocks, connectors: newConnectors };
  };

  // Active track style / version state
  const [activeStyleIndex, setActiveStyleIndex] = useState<number>(0);
  const [isNextcloudDrawerOpen, setIsNextcloudDrawerOpen] = useState<boolean>(false);
  const [isNextcloudSyncing, setIsNextcloudSyncing] = useState<boolean>(false);

  // Linked Ahead-of-Time (AOT) Nextcloud assets for the active track
  const linkedNextcloudAssets = useMemo(() => {
    return getTrackNextcloudAssets(selectedTrack.id, selectedTrack.title);
  }, [selectedTrack.id, selectedTrack.title]);

  // Load from Firestore or initialize when selectedTrack changes
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    setActiveStyleIndex(0);

    const loadWhiteboard = async () => {
      setFirestoreStatus('saving');
      try {
        const cloudCanvas = await loadWhiteboardFromFirestore(selectedTrack.id);
        const hasLyricSections = cloudCanvas?.blocks?.some(b => b.type === 'song_section');

        if (cloudCanvas && cloudCanvas.blocks && cloudCanvas.blocks.length > 0 && hasLyricSections) {
          setBlocks(cloudCanvas.blocks);
          setConnectors(cloudCanvas.connectors || []);
          setViewMode(cloudCanvas.activeMode || 'edgeless');
          if (cloudCanvas.viewport) {
            setZoom(cloudCanvas.viewport.zoom || 1);
            setPan({ x: cloudCanvas.viewport.panX || 0, y: cloudCanvas.viewport.panY || 0 });
          }
          if (cloudCanvas.gridType) {
            setGridStyle(cloudCanvas.gridType);
          }
          setLastSavedTime(cloudCanvas.updatedAt ? new Date(cloudCanvas.updatedAt).toLocaleTimeString() : 'Cloud Synced');
          setFirestoreStatus('saved');
        } else {
          // Initialize fresh template for this track from actual lyrics
          const initial = generateInitialBlocksFromTrack(selectedTrack);
          setBlocks(initial.blocks);
          setConnectors(initial.connectors);
          setFirestoreStatus('saved');
          setTimeout(() => handleFitToContent(), 120);
        }

        // Setup real-time listener for multi-device sync
        unsubscribe = subscribeToFirestoreWhiteboard(selectedTrack.id, (updatedCanvas) => {
          if (updatedCanvas && updatedCanvas.blocks && updatedCanvas.blocks.length > 0) {
            setBlocks(updatedCanvas.blocks);
            setConnectors(updatedCanvas.connectors || []);
            setLastSavedTime(new Date(updatedCanvas.updatedAt || Date.now()).toLocaleTimeString());
            setFirestoreStatus('saved');
          }
        });
      } catch (err) {
        console.warn('Error loading whiteboard from Firestore:', err);
        const initial = generateInitialBlocksFromTrack(selectedTrack);
        setBlocks(initial.blocks);
        setConnectors(initial.connectors);
        setFirestoreStatus('saved');
        setTimeout(() => handleFitToContent(), 120);
      }
    };

    loadWhiteboard();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [selectedTrack.id]);

  // Synchronize canvas to a specific song style / version
  const handleSyncStyleLyricsToWhiteboard = (styleIdx: number) => {
    const targetVer = selectedTrack.versions?.[styleIdx];
    const targetLyrics = getSubstantiveLyrics(selectedTrack, styleIdx);
    const initial = generateInitialBlocksFromTrack(selectedTrack, targetLyrics, targetVer?.version);
    setBlocks(initial.blocks);
    setConnectors(initial.connectors);
    setActiveStyleIndex(styleIdx);
    triggerAutoSave(initial.blocks, initial.connectors, viewMode);
    showToast(`Loaded ${targetVer?.version || `Style ${styleIdx + 1}`} lyrics onto whiteboard!`, 'success');
    setTimeout(() => handleFitToContent(), 120);
  };

  // Add linked Nextcloud asset card to the whiteboard
  const handleAddAssetToWhiteboard = (asset: NextcloudFolderAsset) => {
    const isImage = asset.category === 'VISUAL_ARTWORK';
    const isVideo = asset.category === 'VIDEO_REEL';
    const isAudio = asset.category === 'MASTER_AUDIO' || asset.category === 'UVR5_VOCAL_STEM' || asset.category === 'INSTRUMENTAL_STEM';

    const newBlock: BlockSuiteBlock = {
      id: `asset_${Date.now()}`,
      type: isImage ? 'thumbnail_asset' : isVideo ? 'thumbnail_asset' : 'suno_prompt',
      title: asset.filename,
      subtitle: `${asset.category} • ${asset.fileSizeFormatted}`,
      content: `${asset.notes || 'Nextcloud Fiber Asset'}\nWebDAV: ${asset.webdavPath}`,
      imageUrl: asset.previewImageUrl,
      x: -pan.x / zoom + 200,
      y: -pan.y / zoom + 200,
      width: 320,
      color: isImage ? 'purple' : isVideo ? 'rose' : isAudio ? 'indigo' : 'emerald',
      tags: ['Nextcloud', asset.category, selectedTrack.id],
      orderIndex: blocks.length + 1
    };

    const nextBlocks = [...blocks, newBlock];
    setBlocks(nextBlocks);
    triggerAutoSave(nextBlocks, connectors, viewMode);
    showToast(`Added ${asset.filename} card to whiteboard!`, 'success');
  };

  // Real-time Nextcloud discovery sync
  const handleRealtimeNextcloudSync = async () => {
    setIsNextcloudSyncing(true);
    try {
      const resp = await fetch('/api/nextcloud/index-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId: selectedTrack.id,
          folderName: selectedTrack.id === 'TRK-03' ? 'ECV' : selectedTrack.id,
          aliases: ['ECV', 'Every_Candles_Victory', 'Every Candles Victory', selectedTrack.id, 'Candle']
        })
      });
      const data = await resp.json();
      if (data.success) {
        showToast(`Nextcloud Fiber Synced: ${data.liveItemsFound || linkedNextcloudAssets.length} assets ready (${data.latencyMs}ms)`, 'success');
      } else {
        showToast(`Nextcloud Synced via AOT index (${linkedNextcloudAssets.length} assets)`, 'info');
      }
    } catch (e: any) {
      showToast(`Nextcloud AOT index verified (${linkedNextcloudAssets.length} assets)`, 'info');
    } finally {
      setIsNextcloudSyncing(false);
    }
  };

  // Debounced auto-save to Firestore whenever blocks, connectors, or viewMode changes
  const triggerAutoSave = (newBlocks: BlockSuiteBlock[], newConnectors: BlockSuiteConnector[], currentMode: 'edgeless' | 'page') => {
    setFirestoreStatus('saving');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const payload: WhiteboardCanvasDoc = {
          id: selectedTrack.id,
          title: `${selectedTrack.title} — Infinite Whiteboard`,
          trackId: selectedTrack.id,
          trackTitle: selectedTrack.title,
          ep: selectedTrack.ep,
          activeMode: currentMode,
          blocks: newBlocks,
          connectors: newConnectors,
          viewport: {
            panX: pan.x,
            panY: pan.y,
            zoom
          },
          gridType: gridStyle,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await saveWhiteboardToFirestore(payload);
        setFirestoreStatus('saved');
        setLastSavedTime(new Date().toLocaleTimeString());
      } catch (err) {
        console.error('Failed to auto-save to Firestore:', err);
        setFirestoreStatus('error');
      }
    }, 1200);
  };

  // Add new block to canvas
  const handleAddBlock = (type: BlockSuiteBlockType) => {
    // Determine spawn position centered in current viewport
    const spawnX = Math.round((-pan.x + 400) / zoom);
    const spawnY = Math.round((-pan.y + 250) / zoom);

    let title = 'New Block';
    let content = 'Content...';
    let color = 'indigo';
    let width = 320;
    let sectionTag: string | undefined = undefined;

    if (type === 'song_section') {
      const sectionCount = blocks.filter(b => b.type === 'song_section').length;
      title = sectionCount % 2 === 0 ? `[Verse ${Math.floor(sectionCount / 2) + 1}]` : '[Chorus]';
      content = 'Write lyrics and arrangement notes here...';
      color = sectionCount % 2 === 0 ? 'indigo' : 'cyan';
      sectionTag = title;
    } else if (type === 'sticky_note') {
      title = 'Idea / Sticky Note';
      content = 'Record fleeting melodic hooks, rhyme ideas, or transition notes.';
      color = 'amber';
      width = 240;
    } else if (type === 'chords_prog') {
      title = 'Chord Chart & Harmonic Flow';
      content = 'I - V - vi - IV Progression\nVerse: C - G - Am - F\nChorus: F - G - C - G/B';
      color = 'purple';
      width = 280;
    } else if (type === 'theology_sop') {
      title = 'Theology & Nashville Audit';
      content = 'Checklist:\n[x] Christocentric Anchor\n[ ] Throne Room Pivot in Bridge\n[x] Zero generic Christianese';
      color = 'emerald';
      width = 300;
    } else if (type === 'suno_prompt') {
      title = 'Suno AI Prompt Card';
      content = `[Style]: ${selectedTrack.genre || 'Contemporary Christian / Pop'}\n[Tempo]: ${selectedTrack.bpm} BPM\n[Vocal]: ${selectedTrack.vocal || 'Intimate Male Lead'}\n[Texture]: Acoustic guitar arpeggios, warm sub-bass`;
      color = 'rose';
      width = 320;
    } else if (type === 'checklist') {
      title = 'Production Milestones';
      content = 'Track stems exported\nUVR5 lead vocal clean\nNashville -14 LUFS verified\nSelah 24h prayer gate cleared';
      color = 'slate';
      width = 280;
    } else if (type === 'thumbnail_asset') {
      title = 'Storyboard Thumbnail';
      content = 'Shot description & camera prompt notes';
      color = 'indigo';
      width = 280;
    }

    const newBlock: BlockSuiteBlock = {
      id: `blk_${Date.now()}`,
      type,
      title,
      content,
      x: Math.max(40, spawnX),
      y: Math.max(40, spawnY),
      width,
      color,
      sectionTag,
      orderIndex: blocks.length
    };

    const updated = [...blocks, newBlock];
    setBlocks(updated);
    setSelectedBlockId(newBlock.id);
    triggerAutoSave(updated, connectors, viewMode);
    showToast(`Added ${title} to Whiteboard`);
  };

  // Add Thumbnail Image Asset Card directly onto Whiteboard
  const handleCreateThumbnailAsset = (url: string, titleStr: string, shotNum: string, notes: string) => {
    if (!url.trim()) {
      showToast('Please enter an image URL');
      return;
    }
    const containerWidth = containerRef.current?.clientWidth || 1000;
    const containerHeight = containerRef.current?.clientHeight || 600;
    const spawnX = Math.round((-pan.x + containerWidth / 2 - 140) / zoom);
    const spawnY = Math.round((-pan.y + containerHeight / 2 - 100) / zoom);

    const thumbnailBlock: BlockSuiteBlock = {
      id: `thumb_${Date.now()}`,
      type: 'thumbnail_asset',
      title: titleStr.trim() || 'Visual Storyboard Thumbnail',
      subtitle: shotNum.trim() || 'Shot Concept',
      content: notes.trim() || 'Visual prompt and staging details for this scene.',
      imageUrl: url.trim(),
      aspectRatio: '16:9',
      shotNumber: shotNum.trim(),
      x: Math.max(40, spawnX),
      y: Math.max(40, spawnY),
      width: 300,
      color: 'indigo',
      orderIndex: blocks.length
    };

    const updated = [...blocks, thumbnailBlock];
    setBlocks(updated);
    setSelectedBlockId(thumbnailBlock.id);
    triggerAutoSave(updated, connectors, viewMode);
    setIsImageModalOpen(false);
    setNewImageUrl('');
    setNewImageTitle('');
    setNewImageNotes('');
    showToast(`Added "${thumbnailBlock.title}" Image Card to Whiteboard!`);
  };

  // Delete a block
  const handleDeleteBlock = (blockId: string) => {
    const updatedBlocks = blocks.filter(b => b.id !== blockId);
    const updatedConnectors = connectors.filter(c => c.sourceBlockId !== blockId && c.targetBlockId !== blockId);
    setBlocks(updatedBlocks);
    setConnectors(updatedConnectors);
    if (selectedBlockId === blockId) setSelectedBlockId(null);
    triggerAutoSave(updatedBlocks, updatedConnectors, viewMode);
    showToast('Deleted block');
  };

  // Update block content / attributes
  const handleUpdateBlock = (blockId: string, updates: Partial<BlockSuiteBlock>) => {
    const updated = blocks.map(b => b.id === blockId ? { ...b, ...updates } : b);
    setBlocks(updated);
    triggerAutoSave(updated, connectors, viewMode);
  };

  // Connect two blocks together
  const handleStartConnector = (sourceId: string) => {
    setConnectingSourceId(sourceId);
    showToast('Click another card to link connector arrow');
  };

  const handleCompleteConnector = (targetId: string) => {
    if (!connectingSourceId || connectingSourceId === targetId) {
      setConnectingSourceId(null);
      return;
    }

    const existing = connectors.some(c => c.sourceBlockId === connectingSourceId && c.targetBlockId === targetId);
    if (!existing) {
      const newConn: BlockSuiteConnector = {
        id: `conn_${connectingSourceId}_${targetId}_${Date.now()}`,
        sourceBlockId: connectingSourceId,
        targetBlockId: targetId,
        label: 'then',
        color: '#6366f1'
      };
      const updated = [...connectors, newConn];
      setConnectors(updated);
      triggerAutoSave(blocks, updated, viewMode);
      showToast('Connected arrangement blocks');
    }
    setConnectingSourceId(null);
  };

  const handleDeleteConnector = (connId: string) => {
    const updated = connectors.filter(c => c.id !== connId);
    setConnectors(updated);
    triggerAutoSave(blocks, updated, viewMode);
    showToast('Removed connector');
  };

  // Compile whiteboard blocks into standard song lyrics
  const handleCompileToLyrics = () => {
    // If master column exists, compile from master column; otherwise compile all song_sections
    const masterSections = blocks
      .filter(b => (b.x >= 1150 || b.tags?.includes('Master')) && b.type === 'song_section')
      .sort((a, b) => a.y - b.y);

    const targetSections = masterSections.length > 0 
      ? masterSections 
      : blocks
          .filter(b => b.type === 'song_section')
          .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0) || a.x - b.x);

    if (targetSections.length === 0) {
      showToast('No song section blocks found to compile');
      return;
    }

    const compiledText = targetSections
      .map(b => `${b.sectionTag || b.title.replace('★ Master • ', '')}\n${b.content.trim()}`)
      .join('\n\n');

    onUpdateTrackLyrics(compiledText, masterSections.length > 0 ? `Master Synthesis (${new Date().toLocaleDateString()})` : `Whiteboard Draft (${new Date().toLocaleDateString()})`);
    showToast(`Compiled ${targetSections.length} whiteboard sections to active track lyrics!`);
  };

  // Load 3 songs side-by-side into 4 parallel columns: Song A, Song B, Song C, and Master Best Version
  const handleLoadThreeSongsToCanvas = (
    trackA: Track,
    trackB: Track,
    trackC: Track,
    options?: { styleA?: number; styleB?: number; styleC?: number }
  ) => {
    const rawA = getSubstantiveLyrics(trackA, options?.styleA);
    const rawB = getSubstantiveLyrics(trackB, options?.styleB);
    const rawC = getSubstantiveLyrics(trackC, options?.styleC);

    const secA = parseLyricSections(rawA);
    const secB = parseLyricSections(rawB);
    const secC = parseLyricSections(rawC);

    const newBlocks: BlockSuiteBlock[] = [];
    const newConnectors: BlockSuiteConnector[] = [];
    const timestamp = Date.now();

    // Helper to calculate card height so vertical stacks never collide or overlap
    const calcCardHeight = (content: string) => {
      const lineCount = content.split('\n').filter(l => l.trim().length > 0).length;
      return Math.max(260, 110 + (lineCount * 22));
    };

    // Helper to build column header
    const buildColHeader = (
      id: string,
      title: string,
      subtitle: string,
      x: number,
      color: string,
      tag: string,
      actionType: 'copyAll' | 'masterHeader'
    ): BlockSuiteBlock => ({
      id,
      type: 'theology_sop',
      title,
      subtitle,
      content: actionType === 'copyAll'
        ? `Drag any section across to Column 4 (Master Lane), or click ★ Copy to Master on any card.\nKey: ${tag} • BPM synced`
        : `DROP ZONE: Assemble your winning sections here.\nReorder cards vertically, edit lines, then click Compile to lock into ${selectedTrack.title}.`,
      x,
      y: 60,
      width: actionType === 'masterHeader' ? 380 : 340,
      color,
      tags: [tag, 'Header'],
      orderIndex: 0
    });

    // 1. Column 1: Song A (x = 80, Indigo)
    newBlocks.push(buildColHeader(
      `col_a_${timestamp}`,
      `SONG A • ${trackA.title}`,
      `${trackA.id} • ${trackA.bpm} BPM • ${trackA.key} • ${secA.length} sections (${secA.reduce((sum, s) => sum + s.lineCount, 0)} lines)`,
      80,
      'indigo',
      'Song A',
      'copyAll'
    ));

    let yA = 240;
    secA.forEach((sec, idx) => {
      newBlocks.push({
        id: `blk_a_${idx}_${timestamp}`,
        type: 'song_section',
        title: `Song A • ${sec.tag}`,
        subtitle: `Arrangement Part #${idx + 1} (${sec.lineCount} lines • ${sec.charCount} chars)`,
        content: sec.content,
        x: 80,
        y: yA,
        width: 340,
        color: 'indigo',
        sectionTag: sec.tag,
        tags: ['Song A', trackA.id, sec.cleanTag],
        orderIndex: idx + 1
      });
      yA += calcCardHeight(sec.content) + 24;
    });

    // 2. Column 2: Song B (x = 460, Emerald)
    newBlocks.push(buildColHeader(
      `col_b_${timestamp}`,
      `SONG B • ${trackB.title}`,
      `${trackB.id} • ${trackB.bpm} BPM • ${trackB.key} • ${secB.length} sections (${secB.reduce((sum, s) => sum + s.lineCount, 0)} lines)`,
      460,
      'emerald',
      'Song B',
      'copyAll'
    ));

    let yB = 240;
    secB.forEach((sec, idx) => {
      newBlocks.push({
        id: `blk_b_${idx}_${timestamp}`,
        type: 'song_section',
        title: `Song B • ${sec.tag}`,
        subtitle: `Arrangement Part #${idx + 1} (${sec.lineCount} lines • ${sec.charCount} chars)`,
        content: sec.content,
        x: 460,
        y: yB,
        width: 340,
        color: 'emerald',
        sectionTag: sec.tag,
        tags: ['Song B', trackB.id, sec.cleanTag],
        orderIndex: idx + 1
      });
      yB += calcCardHeight(sec.content) + 24;
    });

    // 3. Column 3: Song C (x = 840, Purple)
    newBlocks.push(buildColHeader(
      `col_c_${timestamp}`,
      `SONG C • ${trackC.title}`,
      `${trackC.id} • ${trackC.bpm} BPM • ${trackC.key} • ${secC.length} sections (${secC.reduce((sum, s) => sum + s.lineCount, 0)} lines)`,
      840,
      'purple',
      'Song C',
      'copyAll'
    ));

    let yC = 240;
    secC.forEach((sec, idx) => {
      newBlocks.push({
        id: `blk_c_${idx}_${timestamp}`,
        type: 'song_section',
        title: `Song C • ${sec.tag}`,
        subtitle: `Arrangement Part #${idx + 1} (${sec.lineCount} lines • ${sec.charCount} chars)`,
        content: sec.content,
        x: 840,
        y: yC,
        width: 340,
        color: 'purple',
        sectionTag: sec.tag,
        tags: ['Song C', trackC.id, sec.cleanTag],
        orderIndex: idx + 1
      });
      yC += calcCardHeight(sec.content) + 24;
    });

    // 4. Column 4: ★ Master Best Version (x = 1220, Amber)
    newBlocks.push(buildColHeader(
      `col_master_${timestamp}`,
      `★ MASTER BEST VERSION LANE`,
      `Synthesized for ${selectedTrack.title} (${selectedTrack.id})`,
      1220,
      'amber',
      'Master',
      'masterHeader'
    ));

    // Populate Master column initially with Song A's or selectedTrack's sections as baseline
    const baselineSections = secA.length > 0 ? secA : (parseLyricSections(getSubstantiveLyrics(selectedTrack)));
    let yM = 240;
    baselineSections.forEach((sec, idx) => {
      newBlocks.push({
        id: `blk_m_${idx}_${timestamp}`,
        type: 'song_section',
        title: `★ Master • ${sec.tag}`,
        subtitle: `Baseline Draft from ${trackA.title} (${sec.lineCount} lines)`,
        content: sec.content,
        x: 1220,
        y: yM,
        width: 380,
        color: 'amber',
        sectionTag: sec.tag,
        tags: ['Master', 'Active', sec.cleanTag],
        orderIndex: idx + 1
      });
      yM += calcCardHeight(sec.content) + 24;
    });

    setBlocks(newBlocks);
    setConnectors(newConnectors);
    setViewMode('edgeless');
    triggerAutoSave(newBlocks, newConnectors, 'edgeless');

    setTimeout(() => {
      handleFitToContent();
    }, 150);

    showToast(`Loaded 3 songs in full (${secA.length} sections for ${trackA.title}, ${secB.length} for ${trackB.title}, ${secC.length} for ${trackC.title})!`, 'success');
  };

  // 1-Click Copy any section into Master Column
  const handleCopySectionToMaster = (sourceBlock: BlockSuiteBlock) => {
    const masterBlocks = blocks.filter(b => b.x >= 1150 || b.tags?.includes('Master'));
    const maxY = masterBlocks.length > 0
      ? Math.max(...masterBlocks.map(b => b.y)) + 260
      : 240;

    const newBlock: BlockSuiteBlock = {
      id: `blk_master_${Date.now()}`,
      type: 'song_section',
      title: `★ Master • ${sourceBlock.sectionTag || sourceBlock.title.replace(/Song [ABC] • /, '')}`,
      subtitle: `Copied from ${sourceBlock.tags?.find(t => t.startsWith('Song')) || sourceBlock.title}`,
      content: sourceBlock.content,
      x: 1220,
      y: maxY,
      width: 380,
      color: 'amber',
      sectionTag: sourceBlock.sectionTag || sourceBlock.title.replace(/Song [ABC] • /, ''),
      tags: ['Master', 'Active', sourceBlock.sectionTag || 'Section'],
      orderIndex: masterBlocks.length + 1
    };

    const updated = [...blocks, newBlock];
    setBlocks(updated);
    triggerAutoSave(updated, connectors, viewMode);
    showToast(`Copied ${sourceBlock.title} into Master Best Version Lane!`);
  };

  // Compile Master Column into Active Track Lyrics
  const handleCompileMasterToActiveLyrics = () => {
    const masterSections = blocks
      .filter(b => (b.x >= 1150 || b.tags?.includes('Master')) && b.type === 'song_section')
      .sort((a, b) => a.y - b.y);

    if (masterSections.length === 0) {
      showToast('No section cards found in the Master column (right side of canvas).', 'error');
      return;
    }

    const compiledText = masterSections
      .map(b => `${b.sectionTag || b.title.replace('★ Master • ', '')}\n${b.content.trim()}`)
      .join('\n\n');

    onUpdateTrackLyrics(compiledText, `Master Synthesis (${new Date().toLocaleDateString()})`);
    showToast(`Compiled ${masterSections.length} master sections to ${selectedTrack.title} lyrics!`, 'success');
  };

  // Export as Markdown File Download
  const handleDownloadMarkdown = () => {
    const mdLines: string[] = [
      `# ${selectedTrack.title} — Brainstorming Whiteboard`,
      `**Track ID**: ${selectedTrack.id} | **EP**: ${selectedTrack.ep} | **BPM**: ${selectedTrack.bpm} | **Key**: ${selectedTrack.key}`,
      `**Thesis**: ${selectedTrack.thesis || 'Christocentric Sovereign Anchor'}`,
      `**Exported**: ${new Date().toISOString()}`,
      `\n---\n`
    ];

    blocks.forEach((blk, idx) => {
      mdLines.push(`## ${blk.title} (${blk.type})`);
      if (blk.subtitle) mdLines.push(`*${blk.subtitle}*`);
      mdLines.push(`\n${blk.content}\n`);
      if (blk.tags && blk.tags.length > 0) {
        mdLines.push(`*Tags*: \`${blk.tags.join('`, `')}\`\n`);
      }
      mdLines.push(`---\n`);
    });

    const blob = new Blob([mdLines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTrack.id}_${selectedTrack.title.replace(/\s+/g, '_')}_Whiteboard.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded Markdown file');
  };

  // Export as BlockSuite JSON
  const handleDownloadJson = () => {
    const docData: WhiteboardCanvasDoc = {
      id: selectedTrack.id,
      title: `${selectedTrack.title} — Whiteboard`,
      trackId: selectedTrack.id,
      trackTitle: selectedTrack.title,
      ep: selectedTrack.ep,
      activeMode: viewMode,
      blocks,
      connectors,
      viewport: { panX: pan.x, panY: pan.y, zoom },
      gridType: gridStyle,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(docData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTrack.id}_${selectedTrack.title.replace(/\s+/g, '_')}_BlockSuite.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded BlockSuite JSON document');
  };

  // 1-Click Backup to Nextcloud WebDAV
  const handleBackupToNextcloud = async () => {
    setIsExportingNextcloud(true);
    setNextcloudBackupNotice(null);

    const ncConfig = getSavedNextcloudConfig();
    const filenameMd = `${selectedTrack.id}_Whiteboard_Brainstorming.md`;
    const remotePath = `/remote.php/dav/files/${ncConfig.username}/Music-Production/brainstorming/${filenameMd}`;

    const mdLines: string[] = [
      `# ${selectedTrack.title} — BlockSuite Infinite Whiteboard Backup`,
      `**Track**: ${selectedTrack.id} | **EP**: ${selectedTrack.ep} | **BPM**: ${selectedTrack.bpm} | **Key**: ${selectedTrack.key}`,
      `**Thesis**: ${selectedTrack.thesis || 'Christocentric Sovereign Anchor'}`,
      `**Backup Timestamp**: ${new Date().toISOString()}`,
      `\n---\n`
    ];

    blocks.forEach((blk) => {
      mdLines.push(`## ${blk.title} [${blk.type}]`);
      if (blk.subtitle) mdLines.push(`*${blk.subtitle}*`);
      mdLines.push(`\n${blk.content}\n`);
      mdLines.push(`---\n`);
    });

    const markdownPayload = mdLines.join('\n');

    try {
      const response = await fetch('/api/nextcloud/upload-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverUrl: ncConfig.serverUrl,
          username: ncConfig.username,
          password: ncConfig.appPassword || '',
          filePath: remotePath,
          content: markdownPayload,
          contentType: 'text/markdown; charset=utf-8'
        })
      });

      const data = await response.json();
      if (data.success) {
        setNextcloudBackupNotice({
          success: true,
          message: `Saved to Nextcloud WebDAV: ${filenameMd}`,
          path: remotePath
        });
        showToast('Successfully backed up Whiteboard to Nextcloud!');
      } else {
        // Fallback: save locally and notify
        setNextcloudBackupNotice({
          success: false,
          message: data.message || 'Nextcloud authentication required. Downloaded copy to browser.'
        });
        handleDownloadMarkdown();
      }
    } catch (err: any) {
      console.warn('Nextcloud backup error:', err);
      setNextcloudBackupNotice({
        success: false,
        message: 'Could not connect to Nextcloud WebDAV. Downloaded copy locally.'
      });
      handleDownloadMarkdown();
    } finally {
      setIsExportingNextcloud(false);
    }
  };

  // Canvas Mouse Down: Pan canvas or deselect
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      setSelectedBlockId(null);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    } else if (draggingBlockId) {
      const newX = Math.round((e.clientX - pan.x) / zoom - dragOffset.x);
      const newY = Math.round((e.clientY - pan.y) / zoom - dragOffset.y);
      setBlocks(prev => prev.map(b => b.id === draggingBlockId ? { ...b, x: Math.max(10, newX), y: Math.max(10, newY) } : b));
    }
  };

  const handleCanvasMouseUp = () => {
    if (isPanning) setIsPanning(false);
    if (draggingBlockId) {
      setDraggingBlockId(null);
      triggerAutoSave(blocks, connectors, viewMode);
    }
  };

  // Zoom handlers
  const handleZoom = (delta: number) => {
    setZoom(prev => Math.min(2.0, Math.max(0.25, Math.round((prev + delta) * 100) / 100)));
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Fit all cards into screen
  const handleFitToContent = () => {
    if (blocks.length === 0) return;
    const minX = Math.min(...blocks.map(b => b.x));
    const maxX = Math.max(...blocks.map(b => b.x + b.width));
    const minY = Math.min(...blocks.map(b => b.y));
    const maxY = Math.max(...blocks.map(b => b.y + 250));

    const contentWidth = maxX - minX + 200;
    const contentHeight = maxY - minY + 200;

    const containerWidth = containerRef.current?.clientWidth || 1000;
    const containerHeight = containerRef.current?.clientHeight || 600;

    const newZoom = Math.min(1.2, Math.max(0.4, Math.min(containerWidth / contentWidth, containerHeight / contentHeight)));
    setZoom(newZoom);
    setPan({
      x: (containerWidth - contentWidth * newZoom) / 2 - minX * newZoom + 50,
      y: (containerHeight - contentHeight * newZoom) / 2 - minY * newZoom + 50
    });
  };

  // Native non-passive mouse wheel zoom centered on cursor
  useEffect(() => {
    const container = containerRef.current;
    if (!container || viewMode !== 'edgeless') return;

    const onNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.08 : -0.08;
      
      setZoom(prevZoom => {
        const newZoom = Math.min(2.5, Math.max(0.25, Math.round((prevZoom + delta) * 100) / 100));
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const zoomRatio = newZoom / prevZoom;

        setPan(prevPan => ({
          x: mouseX - (mouseX - prevPan.x) * zoomRatio,
          y: mouseY - (mouseY - prevPan.y) * zoomRatio
        }));

        return newZoom;
      });
    };

    container.addEventListener('wheel', onNativeWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', onNativeWheel);
    };
  }, [viewMode]);

  // Global Keyboard shortcuts for canvas manipulation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable)
      ) {
        return;
      }

      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        handleZoom(0.15);
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoom(-0.15);
      } else if (e.key === '0') {
        e.preventDefault();
        handleResetZoom();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        handleFitToContent();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [blocks]);

  // Grid styling background
  const getGridBgClass = () => {
    if (gridStyle === 'dots') {
      return 'bg-[radial-gradient(#334155_1.5px,transparent_1.5px)] [background-size:24px_24px]';
    } else if (gridStyle === 'grid') {
      return 'bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] [background-size:40px_40px]';
    } else if (gridStyle === 'blueprint') {
      return 'bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-slate-950 [background-size:20px_20px]';
    }
    return 'bg-slate-950';
  };

  return (
    <div className="flex flex-col h-full min-h-[550px] bg-slate-950 text-slate-100 rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden relative">
      {/* ========================================================================= */}
      {/* STUDIO HEADER: BLOCKSUITE ISOMORPHIC CONTROLS & STATUS BAR */}
      {/* ========================================================================= */}
      <div className="px-4 py-3 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Left: Studio Branding & Track Selector */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black tracking-wide text-white uppercase font-mono">
                BlockSuite Brainstorming Canvas
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                AFFiNE CORE
              </span>
            </div>
            <div className="flex items-center flex-wrap gap-2 text-xs text-slate-400 font-mono">
              <span>Track:</span>
              <select
                value={selectedTrack.id}
                onChange={(e) => {
                  const t = tracks.find(trk => trk.id === e.target.value);
                  if (t) onSelectTrack(t);
                }}
                className="bg-slate-850 border border-slate-750 text-indigo-300 font-semibold rounded px-2 py-0.5 text-xs outline-none cursor-pointer"
              >
                {tracks.map(t => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                    {t.id}: {t.title} ({t.ep})
                  </option>
                ))}
              </select>

              {/* Style / Version Selector for Dual-Style Songs like Every Candle's Victory */}
              {selectedTrack.versions && selectedTrack.versions.length > 1 && (
                <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
                  <span className="text-amber-400 font-bold">Style:</span>
                  <select
                    value={activeStyleIndex}
                    onChange={(e) => handleSyncStyleLyricsToWhiteboard(Number(e.target.value))}
                    className="bg-amber-950/60 border border-amber-600/50 text-amber-200 font-semibold rounded px-2 py-0.5 text-xs outline-none cursor-pointer"
                  >
                    {selectedTrack.versions.map((ver, idx) => (
                      <option key={idx} value={idx} className="bg-slate-900 text-white">
                        Style {idx + 1}: {ver.version} ({ver.genre || selectedTrack.genre})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleSyncStyleLyricsToWhiteboard(activeStyleIndex)}
                    title="Populate or reload this style's lyrics into whiteboard arrangement cards"
                    className="px-2 py-0.5 rounded bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/40 text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer transition"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Sync Style Lyrics</span>
                  </button>
                </div>
              )}

              <span className="text-slate-600">•</span>
              <span>{blocks.length} Blocks</span>
              <span>•</span>
              <span>{connectors.length} Connectors</span>

              {/* Nextcloud Fiber Assets Badge Button */}
              <button
                type="button"
                onClick={() => setIsNextcloudDrawerOpen(prev => !prev)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold border transition cursor-pointer ${
                  isNextcloudDrawerOpen
                    ? 'bg-sky-600 text-white border-sky-400'
                    : 'bg-sky-950/70 hover:bg-sky-900/80 text-sky-300 border-sky-700/50'
                }`}
                title="View linked audio, video, image, and stem assets from Nextcloud fiber server"
              >
                <Radio className="w-3 h-3 text-sky-400 animate-pulse" />
                <span>Nextcloud Assets ({linkedNextcloudAssets.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Center: Isomorphic Mode Switcher (Edgeless Infinite Whiteboard vs Page Document) */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-700 shadow-inner">
          <button
            type="button"
            onClick={() => {
              setViewMode('edgeless');
              triggerAutoSave(blocks, connectors, 'edgeless');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
              viewMode === 'edgeless'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-950 ring-1 ring-indigo-400/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Edgeless Infinite 2D Spatial Whiteboard (Default)"
          >
            <Grid className="w-4 h-4 text-indigo-300" />
            <span>✦ EDGELESS WHITEBOARD</span>
            {viewMode === 'edgeless' && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode('page');
              triggerAutoSave(blocks, connectors, 'page');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
              viewMode === 'page'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-950 ring-1 ring-indigo-400/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Linear Document Flow"
          >
            <FileText className="w-4 h-4 text-indigo-300" />
            <span>PAGE DOCUMENT</span>
          </button>
        </div>

        {/* Right: Actions, Sync Badges & Nextcloud Backups */}
        <div className="flex items-center flex-wrap gap-2">
          {/* 3-Song Multi-Comparison Matrix Button */}
          <button
            type="button"
            onClick={() => setIsThreeSongModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-mono font-black transition shadow-lg shadow-amber-950/50 border border-amber-400/40 cursor-pointer"
            title="Load 3 songs side-by-side with drag & drop comparison into Master version"
          >
            <Columns className="w-3.5 h-3.5 text-slate-950" />
            <span>Compare 3 Songs</span>
            <span className="px-1.5 py-0.2 rounded bg-slate-950 text-amber-300 text-[9px]">
              MATRIX
            </span>
          </button>

          {/* Whiteboard Guide / Instructions Button */}
          <button
            type="button"
            onClick={() => setIsGuideModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold transition border border-slate-700 cursor-pointer"
            title="Whiteboard instructions, zoom shortcuts, and 3-song comparison guide"
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Instructions</span>
          </button>

          {/* Firestore Sync Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                firestoreStatus === 'saved'
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]'
                  : firestoreStatus === 'saving'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-rose-500'
              }`}
            />
            <span className="text-slate-300">
              {firestoreStatus === 'saved' ? `Firestore: Synced` : firestoreStatus === 'saving' ? 'Saving...' : 'Offline'}
            </span>
          </div>

          {/* Compile to Lyrics Button */}
          <button
            type="button"
            onClick={handleCompileToLyrics}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition shadow-xs cursor-pointer"
            title="Compile whiteboard arrangement cards into active song lyrics"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Compile to Lyrics</span>
          </button>

          {/* Backup to Nextcloud Button */}
          <button
            type="button"
            onClick={handleBackupToNextcloud}
            disabled={isExportingNextcloud}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
            title="Backup Markdown and BlockSuite JSON directly to Nextcloud WebDAV"
          >
            <FolderSync className={`w-3.5 h-3.5 ${isExportingNextcloud ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Backup Nextcloud</span>
          </button>

          {/* Export Dropdown */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleDownloadMarkdown}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              title="Download Markdown (.md)"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleDownloadJson}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              title="Download BlockSuite JSON (.json)"
            >
              <FileText className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* QUICK START INSTRUCTIONS BANNER */}
      {showQuickGuideBanner && (
        <div className="px-4 py-2 bg-gradient-to-r from-indigo-950/90 via-slate-900 to-amber-950/40 border-b border-indigo-500/30 flex items-center justify-between gap-3 text-xs shrink-0 animate-in slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-2 flex-wrap text-slate-300">
            <span className="px-2 py-0.5 rounded bg-indigo-600 text-white font-mono text-[10px] font-bold">
              QUICK START
            </span>
            <span>
              <strong>1.</strong> Click <span className="text-amber-400 font-bold">"Compare 3 Songs"</span> to load 3 tracks into parallel columns.
            </span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline">
              <strong>2.</strong> Drag sections across or click <span className="text-amber-300 font-bold">"★ Master"</span> on cards to assemble best lyrics.
            </span>
            <span className="hidden lg:inline">•</span>
            <span className="hidden lg:inline">
              <strong>3.</strong> Scroll mouse wheel to zoom, drag empty canvas to pan.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsGuideModalOpen(true)}
              className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
            >
              Full Guide & Hotkeys
            </button>
            <button
              type="button"
              onClick={() => {
                setShowQuickGuideBanner(false);
                if (typeof window !== 'undefined') localStorage.setItem('brickos_whiteboard_quick_guide', 'hidden');
              }}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
              title="Dismiss quick banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECONDARY TOOLBAR: PALETTE, VIEWPORT & INSERTION */}
      {/* ========================================================================= */}
      <div className="px-4 py-2 bg-slate-900/80 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        {/* Left: Quick Insert Block Palette */}
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="text-slate-400 text-[10px] uppercase font-bold mr-1">Insert Block:</span>
          <button
            type="button"
            onClick={() => handleAddBlock('song_section')}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-950/70 text-indigo-300 hover:bg-indigo-900 border border-indigo-800/50 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Song Section [V/C/B]</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddBlock('sticky_note')}
            className="flex items-center gap-1 px-2 py-1 rounded bg-amber-950/70 text-amber-300 hover:bg-amber-900 border border-amber-800/50 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Sticky Note</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddBlock('chords_prog')}
            className="flex items-center gap-1 px-2 py-1 rounded bg-purple-950/70 text-purple-300 hover:bg-purple-900 border border-purple-800/50 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Chord Chart</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddBlock('theology_sop')}
            className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-950/70 text-emerald-300 hover:bg-emerald-900 border border-emerald-800/50 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>SOP Audit</span>
          </button>
          <button
            type="button"
            onClick={() => handleAddBlock('suno_prompt')}
            className="flex items-center gap-1 px-2 py-1 rounded bg-rose-950/70 text-rose-300 hover:bg-rose-900 border border-rose-800/50 cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>Suno AI Block</span>
          </button>
          <button
            type="button"
            onClick={() => setIsImageModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-900/80 text-white hover:bg-indigo-800 border border-indigo-500/50 shadow-xs cursor-pointer font-bold"
            title="Add Storyboard Thumbnail Image card and link to song arrangement"
          >
            <ImageIcon className="w-3.5 h-3.5 text-indigo-300" />
            <span>+ Thumbnail Image</span>
          </button>
        </div>

        {/* Center: Lyrics & Card Search Toolbar */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setFocusedMatchIndex(0);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (e.shiftKey) handlePrevSearchMatch();
                  else handleNextSearchMatch();
                }
              }}
              placeholder="Search whiteboard words..."
              className="bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-lg pl-8 pr-12 py-1 text-xs text-white placeholder-slate-500 font-mono w-44 sm:w-56 outline-none"
            />
            {searchQuery && (
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <span className="text-[10px] font-mono font-bold text-amber-400">
                  {matchingBlocks.length > 0 ? `${focusedMatchIndex + 1}/${matchingBlocks.length}` : '0'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setFocusedMatchIndex(0);
                  }}
                  className="text-slate-500 hover:text-white text-xs px-1 cursor-pointer"
                  title="Clear search"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Previous / Next Match Buttons */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={handlePrevSearchMatch}
              disabled={matchingBlocks.length === 0}
              className="p-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-30 cursor-pointer transition"
              title="Previous Card Match (Shift+Enter)"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNextSearchMatch}
              disabled={matchingBlocks.length === 0}
              className="p-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-30 cursor-pointer transition"
              title="Next Card Match (Enter)"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Filter Type Selector */}
          <select
            value={searchFilterType}
            onChange={(e) => setSearchFilterType(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-[10px] font-mono text-slate-300 outline-none cursor-pointer"
            title="Filter search by card type"
          >
            <option value="all">All Cards</option>
            <option value="lyrics">Lyrics Only</option>
            <option value="notes">Notes</option>
            <option value="chords">Chords</option>
            <option value="images">Thumbnails</option>
          </select>

          {/* Matches List Toggle Button */}
          {matchingBlocks.length > 0 && (
            <button
              type="button"
              onClick={() => setShowSearchResultsList(!showSearchResultsList)}
              className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition border cursor-pointer ${
                showSearchResultsList ? 'bg-amber-600 text-slate-950 border-amber-400' : 'bg-slate-950 text-amber-400 border-amber-600/50 hover:bg-slate-800'
              }`}
              title="Toggle matching cards list"
            >
              {matchingBlocks.length} Found
            </button>
          )}

          {/* Jump to Lyrics Tab Button */}
          {onNavigateToTab && (
            <button
              type="button"
              onClick={() => onNavigateToTab('lyrics')}
              className="flex items-center gap-1 px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 text-indigo-300 border border-indigo-900/50 cursor-pointer transition"
              title="Switch to Lyrics & Suno Engine"
            >
              <FileText className="w-3 h-3 text-indigo-400" />
              <span className="hidden xl:inline">To Lyrics</span>
            </button>
          )}
        </div>

        {/* Right: Viewport Controls & Grid Styles (Only in Edgeless Mode) */}
        {viewMode === 'edgeless' && (
          <div className="flex items-center gap-2">
            {/* Grid Style Toggle */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded px-1 py-0.5 text-[10px]">
              {(['dots', 'grid', 'blueprint', 'blank'] as const).map(style => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setGridStyle(style)}
                  className={`px-1.5 py-0.5 rounded uppercase ${
                    gridStyle === style ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5">
              <button
                type="button"
                onClick={() => handleZoom(-0.15)}
                className="p-1 text-slate-400 hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
              <span className="text-[10px] w-9 text-center font-bold text-slate-300">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => handleZoom(0.15)}
                className="p-1 text-slate-400 hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleFitToContent}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] cursor-pointer"
              title="Fit all blocks to screen"
            >
              Fit Screen
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1 text-slate-400 hover:text-white"
              title="Reset 100%"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* SEARCH RESULTS MATCHES DRAWER (WHEN SEARCH IS ACTIVE) */}
      {showSearchResultsList && matchingBlocks.length > 0 && (
        <div className="px-4 py-2 bg-slate-950/95 border-b border-amber-500/30 flex items-center gap-2 overflow-x-auto custom-scrollbar z-30 text-xs font-mono animate-in slide-in-from-top-1 duration-150">
          <span className="text-[10px] uppercase font-bold text-amber-400 shrink-0">Matching Cards:</span>
          {matchingBlocks.map((b, idx) => (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                setFocusedMatchIndex(idx);
                panToBlock(b.id);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border shrink-0 transition cursor-pointer ${
                focusedMatchIndex === idx
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-300 shadow-md shadow-amber-950'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
            >
              <span className="text-[9px] opacity-75 uppercase">{b.sectionTag || b.type.replace('_', ' ')}</span>
              <span className="truncate max-w-[150px]">{b.title}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowSearchResultsList(false)}
            className="text-slate-500 hover:text-white text-xs px-1 ml-auto shrink-0 cursor-pointer"
            title="Close results bar"
          >
            ✕
          </button>
        </div>
      )}

      {/* Notification Toast */}
      {toastMessage && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-900 border border-indigo-500/40 text-indigo-200 shadow-2xl text-xs font-mono flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN VIEWPORT: EDGELESS INFINITE WHITEBOARD OR PAGE DOCUMENT */}
      {/* ========================================================================= */}
      <div className="flex-1 relative overflow-hidden select-none">
        {viewMode === 'edgeless' ? (
          /* ===================================================================== */
          /* EDGELESS MODE: INFINITE WHITEBOARD CANVAS */
          /* ===================================================================== */
          <div
            ref={containerRef}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            className={`w-full h-full relative cursor-grab active:cursor-grabbing overflow-hidden ${getGridBgClass()}`}
          >
            {/* Infinite World Coordinate Space */}
            <div
              className="absolute inset-0 origin-top-left pointer-events-none"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
              }}
            >
              {/* SVG Connectors Layer */}
              <svg className="absolute inset-0 w-[5000px] h-[5000px] pointer-events-none overflow-visible">
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="8"
                    markerHeight="8"
                    refX="6"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 6 3, 0 6" fill="#818cf8" />
                  </marker>
                </defs>
                {connectors.map(conn => {
                  const source = blocks.find(b => b.id === conn.sourceBlockId);
                  const target = blocks.find(b => b.id === conn.targetBlockId);
                  if (!source || !target) return null;

                  const startX = source.x + source.width;
                  const startY = source.y + 60;
                  const endX = target.x;
                  const endY = target.y + 60;

                  // Bezier curve control points
                  const dx = endX - startX;
                  const cp1X = startX + Math.max(40, dx * 0.5);
                  const cp1Y = startY;
                  const cp2X = endX - Math.max(40, dx * 0.5);
                  const cp2Y = endY;

                  const pathD = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
                  const midX = (startX + endX) / 2;
                  const midY = (startY + endY) / 2;

                  return (
                    <g key={conn.id} className="pointer-events-auto group cursor-pointer">
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#818cf8"
                        strokeWidth="2.5"
                        strokeDasharray="4,4"
                        markerEnd="url(#arrowhead)"
                        className="transition group-hover:stroke-rose-400 group-hover:stroke-[3.5px]"
                      />
                      {/* Connector label / Delete button on hover */}
                      <g
                        transform={`translate(${midX}, ${midY})`}
                        onClick={() => handleDeleteConnector(conn.id)}
                        className="opacity-60 group-hover:opacity-100 transition"
                      >
                        <rect x="-24" y="-10" width="48" height="20" rx="4" fill="#0f172a" stroke="#475569" />
                        <text x="0" y="4" fill="#94a3b8" fontSize="9" textAnchor="middle" fontFamily="monospace">
                          {conn.label || 'link'}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </svg>

              {/* Render Blocks onto Infinite Canvas */}
              {blocks.map(block => {
                const isSelected = selectedBlockId === block.id;
                const isConnectingSource = connectingSourceId === block.id;
                const colorConfig = COLOR_OPTIONS.find(c => c.id === block.color) || COLOR_OPTIONS[0];

                const isMatch = matchingBlockIds.includes(block.id);
                const isFocusedMatch = matchingBlocks[focusedMatchIndex]?.id === block.id;
                const isSearchActive = searchQuery.trim().length > 0;
                const isMasterBlock = block.x >= 1150 || block.tags?.includes('Master');
                const isSourceSection = !isMasterBlock && block.type === 'song_section';
                const isMasterHeader = isMasterBlock && block.tags?.includes('Header');

                return (
                  <div
                    key={block.id}
                    style={{
                      transform: `translate(${block.x}px, ${block.y}px)`,
                      width: `${block.width}px`
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      if (connectingSourceId) {
                        handleCompleteConnector(block.id);
                        return;
                      }
                      setSelectedBlockId(block.id);
                      setDraggingBlockId(block.id);
                      setDragOffset({
                        x: (e.clientX - pan.x) / zoom - block.x,
                        y: (e.clientY - pan.y) / zoom - block.y
                      });
                    }}
                    className={`absolute pointer-events-auto rounded-xl border backdrop-blur-md shadow-2xl transition-all flex flex-col ${
                      isMasterBlock ? 'bg-amber-950/40 border-amber-500/80 ring-2 ring-amber-400/60 shadow-[0_0_25px_rgba(245,158,11,0.2)]' : colorConfig.bg
                    } ${isMasterBlock ? 'border-amber-500/80' : colorConfig.border} ${
                      isFocusedMatch
                        ? 'ring-4 ring-amber-300 shadow-[0_0_35px_rgba(251,191,36,0.7)] z-20 scale-[1.02]'
                        : isMatch
                        ? 'ring-2 ring-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)] z-10'
                        : isSelected
                        ? 'ring-2 ring-indigo-400 shadow-[0_0_25px_rgba(99,102,241,0.25)]'
                        : isConnectingSource
                        ? 'ring-2 ring-amber-400 animate-pulse'
                        : 'hover:border-slate-500'
                    } ${
                      isSearchActive && !isMatch ? 'opacity-35 hover:opacity-90' : 'opacity-100'
                    }`}
                  >
                    {/* Block Header & Drag Handle */}
                    <div className="px-3 py-2 bg-slate-950/70 border-b border-slate-800/80 rounded-t-xl flex items-center justify-between gap-2 cursor-move">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: isMasterBlock ? '#f59e0b' : colorConfig.hex }}
                        />
                        {isMatch && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black text-[8px] uppercase tracking-wider shrink-0 animate-pulse">
                            MATCH
                          </span>
                        )}
                        {isMasterBlock && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black text-[8px] uppercase tracking-wider shrink-0">
                            ★ MASTER
                          </span>
                        )}
                        <input
                          type="text"
                          value={block.title}
                          onChange={(e) => handleUpdateBlock(block.id, { title: e.target.value })}
                          className="bg-transparent text-xs font-bold font-mono text-white outline-none w-full truncate"
                        />
                      </div>

                      {/* Card Header Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Quick Copy to Master button for source comparison blocks */}
                        {isSourceSection && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopySectionToMaster(block);
                            }}
                            className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold text-[10px] border border-amber-500/40 flex items-center gap-1 transition cursor-pointer"
                            title="Copy this section into the Master Best Version assembly lane"
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>★ Master</span>
                          </button>
                        )}

                        {/* Connect Arrow button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartConnector(block.id);
                          }}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-indigo-300"
                          title="Connect to another card"
                        >
                          <LinkIcon className="w-3 h-3" />
                        </button>

                        {/* Color Selector */}
                        <div className="flex items-center gap-0.5">
                          {COLOR_OPTIONS.slice(0, 4).map(c => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateBlock(block.id, { color: c.id });
                              }}
                              className={`w-2.5 h-2.5 rounded-full cursor-pointer ${
                                block.color === c.id ? 'ring-1 ring-white' : ''
                              }`}
                              style={{ backgroundColor: c.hex }}
                            />
                          ))}
                        </div>

                        {/* Delete Card */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBlock(block.id);
                          }}
                          className="p-1 rounded hover:bg-rose-950 text-slate-400 hover:text-rose-400"
                          title="Delete card"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Block Content Area */}
                    <div className="p-3 flex-1 flex flex-col gap-2">
                      {/* Storyboard Image Thumbnail Preview */}
                      {block.type === 'thumbnail_asset' && block.imageUrl && (
                        <div className="relative rounded-lg overflow-hidden border border-slate-700/80 bg-slate-950 aspect-video mb-1 group">
                          <img
                            src={block.imageUrl}
                            alt={block.title}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            onError={(e) => {
                              (e.target as any).src = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80';
                            }}
                          />
                          {block.shotNumber && (
                            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono font-bold text-amber-300 border border-amber-500/40">
                              {block.shotNumber}
                            </span>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                            <span className="text-[9px] font-mono text-slate-200 truncate">
                              Storyboard Visual
                            </span>
                          </div>
                        </div>
                      )}

                      <textarea
                        value={block.content}
                        onChange={(e) => handleUpdateBlock(block.id, { content: e.target.value })}
                        rows={block.type === 'thumbnail_asset' ? 2 : Math.max(4, Math.min(20, block.content.split('\n').length + 1))}
                        className="w-full bg-transparent text-xs font-mono text-slate-200 outline-none resize-none leading-relaxed selection:bg-indigo-900"
                        placeholder={block.type === 'thumbnail_asset' ? "Scene prompt / shot notes..." : "Enter lyrics, chords, or notes..."}
                        spellCheck={false}
                      />

                      {/* Master Column Quick Actions on Header Card */}
                      {isMasterHeader && (
                        <div className="flex items-center gap-1.5 pt-2 border-t border-amber-500/40 mt-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompileMasterToActiveLyrics();
                            }}
                            className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-[10px] flex items-center justify-center gap-1 shadow-sm transition cursor-pointer"
                            title="Compile all assembled master sections to active track lyrics"
                          >
                            <Send className="w-3 h-3" />
                            <span>Compile to Track</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsThreeSongModalOpen(true);
                            }}
                            className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-mono font-bold text-[10px] flex items-center gap-1 transition cursor-pointer"
                            title="Open 3-song side-by-side section comparison matrix"
                          >
                            <GitCompare className="w-3 h-3" />
                            <span>Diff Matrix</span>
                          </button>
                        </div>
                      )}

                      {/* Optional Subtitle / Tags / Chords Badge */}
                      <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800/60 mt-auto">
                        <span className="truncate max-w-[130px]">{block.subtitle || block.type}</span>
                        <div className="flex items-center gap-1.5">
                          {block.type === 'song_section' && (
                            <span className="text-[9px] text-emerald-400 font-mono font-bold bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/40">
                              {block.content.split('\n').filter(l => l.trim().length > 0).length} lines
                            </span>
                          )}
                          {block.sectionTag && (
                            <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                              {block.sectionTag}
                            </span>
                          )}
                          {block.type === 'thumbnail_asset' && onSendToVideoExpress && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSendToVideoExpress({
                                  title: block.title,
                                  prompt: block.content,
                                  shotNumber: block.shotNumber,
                                  imageUrl: block.imageUrl
                                });
                              }}
                              className="px-2 py-0.5 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60 text-[9px] font-bold flex items-center gap-1 transition cursor-pointer"
                              title="Send scene prompt & reference to VideoExpress Avatar Tab"
                            >
                              <Video className="w-2.5 h-2.5 text-rose-400" />
                              <span>To VideoExpress</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* FLOATING CANVAS ZOOM & NAVIGATION HUD (Figma/Miro style - Always accessible in Edgeless Mode) */}
            <div className="absolute bottom-4 right-4 z-40 bg-slate-900/95 border border-slate-700/80 rounded-2xl p-2 shadow-2xl backdrop-blur-xl flex flex-col gap-2 font-mono ring-1 ring-white/10">
              {/* Zoom Controls Bar */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleZoom(-0.15)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  title="Zoom Out (Key: -)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-bold text-amber-300 hover:text-white hover:bg-slate-850 transition cursor-pointer min-w-[52px] text-center"
                  title="Reset to 100% (Key: 0)"
                >
                  {Math.round(zoom * 100)}%
                </button>

                <button
                  type="button"
                  onClick={() => handleZoom(0.15)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  title="Zoom In (Key: +)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />

                <button
                  type="button"
                  onClick={handleFitToContent}
                  className="px-2 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                  title="Fit all blocks into viewport (Key: F)"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Fit All</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  title="Reset 100% (0)"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>

                <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />

                <button
                  type="button"
                  onClick={() => setIsGuideModalOpen(true)}
                  className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                  title="Open Whiteboard Guide & Navigation Help"
                >
                  <HelpCircle className="w-3 h-3" />
                  <span>Guide</span>
                </button>
              </div>

              {/* Mini radar preview & hint */}
              <div className="flex items-center justify-between text-[9px] text-slate-400 px-1 border-t border-slate-800 pt-1">
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ✦ Edgeless Canvas
                </span>
                <span className="text-slate-500">Wheel: Zoom • Drag: Pan</span>
              </div>
            </div>
          </div>
        ) : (
          /* ===================================================================== */
          /* PAGE MODE: STRUCTURED LINEAR DOCUMENT EDITOR */
          /* ===================================================================== */
          <div className="w-full h-full overflow-y-auto p-8 max-w-4xl mx-auto space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                Linear Document Flow (BlockSuite Page Mode)
              </span>
              <h1 className="text-2xl font-black text-white font-mono tracking-tight">
                {selectedTrack.title}
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-1">
                EP: {selectedTrack.ep} • Key: {selectedTrack.key} • {selectedTrack.bpm} BPM • {selectedTrack.genre}
              </p>
            </div>

            {/* Linear Block Renderers */}
            <div className="space-y-4">
              {blocks
                .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0) || a.y - b.y)
                .map((block, index) => {
                  const colorConfig = COLOR_OPTIONS.find(c => c.id === block.color) || COLOR_OPTIONS[0];
                  const isMatch = matchingBlockIds.includes(block.id);

                  return (
                    <div
                      key={block.id}
                      className={`p-4 rounded-xl border space-y-2 transition-all ${
                        isMatch
                          ? 'border-amber-400 bg-amber-950/25 ring-2 ring-amber-400/50 shadow-lg shadow-amber-950/40'
                          : `bg-slate-900/60 ${colorConfig.border}`
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-500 font-bold">
                            #{index + 1}
                          </span>
                          {isMatch && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black text-[8px] uppercase tracking-wider shrink-0 animate-pulse">
                              MATCH
                            </span>
                          )}
                          <span className={`text-xs font-mono font-bold ${colorConfig.text}`}>
                            {block.title}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 px-1.5 py-0.5 rounded bg-slate-950">
                            {block.type}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteBlock(block.id)}
                          className="text-slate-500 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {block.type === 'thumbnail_asset' && block.imageUrl && (
                        <div className="relative rounded-lg overflow-hidden border border-slate-700/80 bg-slate-950 aspect-video max-w-md my-2">
                          <img
                            src={block.imageUrl}
                            alt={block.title}
                            className="w-full h-full object-cover"
                          />
                          {block.shotNumber && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono font-bold text-amber-300 border border-amber-500/40">
                              {block.shotNumber}
                            </span>
                          )}
                          {onSendToVideoExpress && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSendToVideoExpress({
                                  title: block.title,
                                  prompt: block.content,
                                  shotNumber: block.shotNumber,
                                  imageUrl: block.imageUrl
                                });
                              }}
                              className="absolute bottom-2 right-2 px-2.5 py-1 rounded bg-rose-600/90 hover:bg-rose-500 text-white text-[10px] font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md"
                              title="Send scene prompt & reference to VideoExpress Avatar Tab"
                            >
                              <Video className="w-3 h-3 text-white" />
                              <span>Send to VideoExpress</span>
                            </button>
                          )}
                        </div>
                      )}

                      <textarea
                        value={block.content}
                        onChange={(e) => handleUpdateBlock(block.id, { content: e.target.value })}
                        rows={Math.max(2, block.content.split('\n').length)}
                        className="w-full bg-transparent text-sm font-mono text-slate-200 outline-none resize-none leading-relaxed selection:bg-indigo-900"
                        spellCheck={false}
                      />
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* STORYBOARD THUMBNAIL IMAGE MODAL */}
      {/* ========================================================================= */}
      {isImageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl text-slate-100 font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Add Storyboard Thumbnail Card
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Add an image thumbnail card to the infinite canvas and link it with story connectors
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Image URL input */}
              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">
                  Image URL / Path: <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://... or /assets/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono outline-none focus:border-indigo-500"
                />
              </div>

              {/* Quick Sample Presets */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block font-semibold">Quick Visual Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Nashville Woodshop', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80', title: 'Woodshop Sanctification', shot: 'Scene 1 / Shot A' },
                    { label: 'Golden Candle Light', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80', title: 'Every Candle Victory', shot: 'Scene 2 / Shot B' },
                    { label: 'Studio Analog Desk', url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&auto=format&fit=crop&q=80', title: 'Brick Production Desk', shot: 'Scene 3 / Shot C' },
                    { label: 'Cathedral Acoustic Glow', url: 'https://images.unsplash.com/photo-1548625361-195fe61a55c3?w=800&auto=format&fit=crop&q=80', title: 'Throne Room Anchor', shot: 'Bridge Climax' }
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setNewImageUrl(preset.url);
                        setNewImageTitle(preset.title);
                        setNewImageShotNumber(preset.shot);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[10px] border border-slate-700 transition cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Shot Number */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">Card Title:</label>
                  <input
                    type="text"
                    value={newImageTitle}
                    onChange={(e) => setNewImageTitle(e.target.value)}
                    placeholder="e.g. Intro Sunrise Reveal"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold block">Shot / Scene Number:</label>
                  <input
                    type="text"
                    value={newImageShotNumber}
                    onChange={(e) => setNewImageShotNumber(e.target.value)}
                    placeholder="e.g. Scene 1 / Shot A"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Prompt / Scene Notes */}
              <div className="space-y-1">
                <label className="text-slate-300 font-bold block">Scene & Prompt Notes:</label>
                <textarea
                  value={newImageNotes}
                  onChange={(e) => setNewImageNotes(e.target.value)}
                  rows={3}
                  placeholder="Describe camera movement, lighting, emotion, or story context..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono outline-none resize-none focus:border-indigo-500"
                />
              </div>

              {/* Preview if URL provided */}
              {newImageUrl.trim() && (
                <div className="rounded-lg overflow-hidden border border-slate-800 aspect-video relative max-h-40 bg-slate-950">
                  <img
                    src={newImageUrl.trim()}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as any).src = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80';
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleCreateThumbnailAsset(newImageUrl, newImageTitle, newImageShotNumber, newImageNotes)}
                disabled={!newImageUrl.trim()}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Place on Whiteboard</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* NEXTCLOUD FIBER LINKED ASSETS SLIDE-OUT DRAWER */}
      {/* ========================================================================= */}
      {isNextcloudDrawerOpen && (
        <div className="absolute right-0 top-14 bottom-10 w-96 z-40 bg-slate-900/98 backdrop-blur-md border-l border-slate-700/80 shadow-2xl flex flex-col font-mono text-xs">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span>Nextcloud Fiber Assets</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-600/40">FIBER LIVE</span>
                </h3>
                <span className="text-[10px] text-slate-400">
                  {selectedTrack.id === 'TRK-03' ? '/Music-Production/ECV' : `/Music-Production/${selectedTrack.id}`} ({linkedNextcloudAssets.length} indexed)
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsNextcloudDrawerOpen(false)}
              className="text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Sync status & actions */}
          <div className="p-3 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-400">
              Host: <strong className="text-sky-300">nextcloud.mermaid-symmetric.ts.net</strong>
            </span>
            <button
              type="button"
              onClick={handleRealtimeNextcloudSync}
              disabled={isNextcloudSyncing}
              className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isNextcloudSyncing ? 'animate-spin' : ''}`} />
              <span>{isNextcloudSyncing ? 'Indexing...' : 'Sync Nextcloud Live'}</span>
            </button>
          </div>

          {/* Asset List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {linkedNextcloudAssets.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Database className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p>No Nextcloud assets linked for {selectedTrack.id} yet.</p>
                <button
                  type="button"
                  onClick={handleRealtimeNextcloudSync}
                  className="mt-2 text-indigo-400 underline text-xs cursor-pointer"
                >
                  Scan /Music-Production now
                </button>
              </div>
            ) : (
              linkedNextcloudAssets.map((asset) => {
                const isImage = asset.category === 'VISUAL_ARTWORK';
                const isVideo = asset.category === 'VIDEO_REEL';
                const isAudio = asset.category === 'MASTER_AUDIO' || asset.category === 'UVR5_VOCAL_STEM' || asset.category === 'INSTRUMENTAL_STEM';

                return (
                  <div
                    key={asset.id}
                    className="p-3 rounded-xl bg-slate-850 border border-slate-750 hover:border-slate-650 transition space-y-2 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isImage ? (
                          <ImageIcon className="w-4 h-4 text-purple-400 shrink-0" />
                        ) : isVideo ? (
                          <Video className="w-4 h-4 text-rose-400 shrink-0" />
                        ) : (
                          <Music className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                        <span className="font-bold text-slate-200 truncate max-w-[200px]" title={asset.filename}>
                          {asset.filename}
                        </span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-900 border border-slate-750 text-slate-300">
                        {asset.fileSizeFormatted}
                      </span>
                    </div>

                    {/* Thumbnail preview if visual */}
                    {isImage && asset.previewImageUrl && (
                      <div className="w-full h-24 rounded-lg overflow-hidden border border-slate-750 bg-black/40">
                        <img src={asset.previewImageUrl} alt={asset.filename} className="w-full h-full object-cover" />
                      </div>
                    )}

                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                      {asset.notes || 'Nextcloud WebDAV asset'}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                      <span className="text-[9px] text-slate-500 font-mono">
                        {asset.category.replace(/_/g, ' ')}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddAssetToWhiteboard(asset)}
                        className="px-2 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600/60 text-indigo-200 border border-indigo-500/40 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                        title="Add this asset card directly to the whiteboard canvas"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Drop to Canvas</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FOOTER: STATS & QUICK NAVIGATION SHORTCUTS */}
      {/* ========================================================================= */}
      <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <span>Active Track: <strong className="text-white">{selectedTrack.title}</strong></span>
          <span>•</span>
          <span>Last Saved: <strong className="text-emerald-400">{lastSavedTime || 'Just now'}</strong></span>
          {nextcloudBackupNotice && (
            <>
              <span>•</span>
              <span className={nextcloudBackupNotice.success ? 'text-sky-300' : 'text-amber-400'}>
                {nextcloudBackupNotice.message}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigateToTab && onNavigateToTab('lyrics')}
            className="hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
          >
            <span>Open Lyric Suite</span>
            <ArrowRight className="w-3 h-3" />
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => onNavigateToTab && onNavigateToTab('version-matrix')}
            className="hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
          >
            <span>3-Way Version Matrix</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* BLOCKSUITE WHITEBOARD INTERACTIVE GUIDE & INSTRUCTIONS MODAL */}
      <BlockSuiteGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        onOpenThreeSongCompare={() => setIsThreeSongModalOpen(true)}
        onFitScreen={handleFitToContent}
      />

      {/* 3-SONG MULTI-COMPARISON & STAGING MATRIX MODAL */}
      <BlockSuiteThreeSongComparatorModal
        isOpen={isThreeSongModalOpen}
        onClose={() => setIsThreeSongModalOpen(false)}
        tracks={tracks}
        selectedTrack={selectedTrack}
        onLoadThreeSongsToCanvas={handleLoadThreeSongsToCanvas}
        onApplyDirectMasterLyrics={(compiled) => {
          onUpdateTrackLyrics(compiled, `3-Song Composite (${new Date().toLocaleDateString()})`);
          showToast(`Applied composite lyrics directly to ${selectedTrack.title}!`, 'success');
        }}
      />
    </div>
  );
};
