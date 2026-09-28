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
  ChevronDown
} from 'lucide-react';
import {
  Track,
  WhiteboardCanvasDoc,
  BlockSuiteBlock,
  BlockSuiteBlockType,
  BlockSuiteConnector,
  NextcloudSyncConfig
} from '../types';
import {
  loadWhiteboardFromFirestore,
  saveWhiteboardToFirestore,
  subscribeToFirestoreWhiteboard,
  isFirebaseConfigured
} from '../lib/firebase';
import { getSavedNextcloudConfig } from '../data/nextcloudFolderAssets';

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

  const containerRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<any>(null);

  const showToast = (msg: string) => {
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

  // Helper to generate default blocks from track lyrics if empty
  const generateInitialBlocksFromTrack = (track: Track): { blocks: BlockSuiteBlock[]; connectors: BlockSuiteConnector[] } => {
    const rawLyrics = track.lyrics || '';
    const sectionChunks = rawLyrics.split(/\n\n+/).filter(c => c.trim().length > 0);
    const newBlocks: BlockSuiteBlock[] = [];
    const newConnectors: BlockSuiteConnector[] = [];

    let currentX = 120;
    let currentY = 100;

    // Header / Song Meta block
    const metaBlock: BlockSuiteBlock = {
      id: `meta_${Date.now()}`,
      type: 'theology_sop',
      title: `${track.title} — Song Thesis & SOP`,
      subtitle: `Key: ${track.key} • ${track.bpm} BPM • EP: ${track.ep}`,
      content: `Thesis: ${track.thesis || 'Christocentric sovereign theological anchor.'}\nVocal Archetype: ${track.vocal || 'Lead'}\nNashville Rule: Enforce Throne Room Pivot before bridge.`,
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

    if (sectionChunks.length > 0) {
      sectionChunks.forEach((chunk, index) => {
        const lines = chunk.split('\n');
        const firstLine = lines[0].trim();
        const isBracketTag = firstLine.startsWith('[') && firstLine.endsWith(']');
        const tag = isBracketTag ? firstLine : `[Section ${index + 1}]`;
        const bodyContent = isBracketTag ? lines.slice(1).join('\n') : chunk;

        let color = 'indigo';
        if (tag.toLowerCase().includes('chorus')) color = 'cyan';
        else if (tag.toLowerCase().includes('bridge')) color = 'amber';
        else if (tag.toLowerCase().includes('hook') || tag.toLowerCase().includes('drop')) color = 'rose';

        const blockId = `block_${index + 1}_${Date.now()}`;
        const newBlock: BlockSuiteBlock = {
          id: blockId,
          type: 'song_section',
          title: tag,
          subtitle: `Arrangement Part #${index + 1}`,
          content: bodyContent,
          x: currentX,
          y: currentY + (index % 2 === 0 ? 0 : 40),
          width: 320,
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

        currentX += 360;
        if (currentX > 1600) {
          currentX = 120;
          currentY += 420;
        }
      });
    } else {
      // Default template arrangement blocks
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

  // Load from Firestore or initialize when selectedTrack changes
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const loadWhiteboard = async () => {
      setFirestoreStatus('saving');
      try {
        const cloudCanvas = await loadWhiteboardFromFirestore(selectedTrack.id);
        if (cloudCanvas && cloudCanvas.blocks && cloudCanvas.blocks.length > 0) {
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
          // Initialize fresh template for this track
          const initial = generateInitialBlocksFromTrack(selectedTrack);
          setBlocks(initial.blocks);
          setConnectors(initial.connectors);
          setFirestoreStatus('saved');
        }

        // Setup real-time listener for multi-device sync
        unsubscribe = subscribeToFirestoreWhiteboard(selectedTrack.id, (updatedCanvas) => {
          if (updatedCanvas && updatedCanvas.blocks) {
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
      }
    };

    loadWhiteboard();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [selectedTrack.id]);

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
    // Sort song_section blocks by orderIndex or X coordinate
    const songSections = blocks
      .filter(b => b.type === 'song_section')
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0) || a.x - b.x);

    if (songSections.length === 0) {
      showToast('No song section blocks found to compile');
      return;
    }

    const compiledText = songSections
      .map(b => `${b.sectionTag || b.title}\n${b.content.trim()}`)
      .join('\n\n');

    onUpdateTrackLyrics(compiledText, `Whiteboard Draft (${new Date().toLocaleDateString()})`);
    showToast('Compiled whiteboard sections to active track lyrics!');
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
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-slate-950 text-slate-100 rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden">
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
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
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
              <span className="text-slate-600">•</span>
              <span>{blocks.length} Blocks</span>
              <span>•</span>
              <span>{connectors.length} Connectors</span>
            </div>
          </div>
        </div>

        {/* Center: Isomorphic Mode Switcher (Edgeless Infinite Whiteboard vs Page Document) */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setViewMode('edgeless');
              triggerAutoSave(blocks, connectors, 'edgeless');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
              viewMode === 'edgeless'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Edgeless Whiteboard</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode('page');
              triggerAutoSave(blocks, connectors, 'page');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
              viewMode === 'page'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Page Document</span>
          </button>
        </div>

        {/* Right: Actions, Sync Badges & Nextcloud Backups */}
        <div className="flex items-center flex-wrap gap-2">
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
                      colorConfig.bg
                    } ${colorConfig.border} ${
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
                          style={{ backgroundColor: colorConfig.hex }}
                        />
                        {isMatch && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black text-[8px] uppercase tracking-wider shrink-0 animate-pulse">
                            MATCH
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
                        rows={block.type === 'thumbnail_asset' ? 2 : Math.max(3, Math.min(10, block.content.split('\n').length))}
                        className="w-full bg-transparent text-xs font-mono text-slate-200 outline-none resize-none leading-relaxed selection:bg-indigo-900"
                        placeholder={block.type === 'thumbnail_asset' ? "Scene prompt / shot notes..." : "Enter lyrics, chords, or notes..."}
                        spellCheck={false}
                      />

                      {/* Optional Subtitle / Tags / Chords Badge */}
                      <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800/60 mt-auto">
                        <span className="truncate max-w-[150px]">{block.subtitle || block.type}</span>
                        <div className="flex items-center gap-1">
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

            {/* Bottom-Right Whiteboard Minimap / Viewport Indicator */}
            <div className="absolute bottom-4 right-4 z-40 bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 shadow-2xl backdrop-blur-md flex flex-col gap-1.5 text-[10px] font-mono">
              <div className="flex items-center justify-between text-slate-400 font-bold">
                <span>CANVAS RADAR</span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <div className="w-32 h-20 bg-slate-950 rounded border border-slate-800 relative overflow-hidden">
                {/* Tiny representation of cards */}
                {blocks.map(b => (
                  <div
                    key={b.id}
                    className="absolute bg-indigo-400 rounded-[1px] opacity-70"
                    style={{
                      left: `${Math.min(120, Math.max(2, (b.x / 2000) * 128))}px`,
                      top: `${Math.min(70, Math.max(2, (b.y / 2000) * 80))}px`,
                      width: '10px',
                      height: '6px'
                    }}
                  />
                ))}
              </div>
              <span className="text-[9px] text-slate-500 text-center">Drag canvas to pan</span>
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
    </div>
  );
};
