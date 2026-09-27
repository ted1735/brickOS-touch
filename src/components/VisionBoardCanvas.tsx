import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  Plus,
  Move,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Palette,
  Film,
  Music,
  FileText,
  Bookmark,
  Trash2,
  Send,
  Save,
  Check,
  Share2,
  Layers,
  ArrowRight,
  Eye,
  Sliders,
  Type
} from 'lucide-react';

export type VisionCardType = 'lyric' | 'visual_art' | 'video_scene' | 'suno_audio' | 'theology_sop';

export interface VisionCard {
  id: string;
  type: VisionCardType;
  title: string;
  subtitle?: string;
  content: string;
  x: number;
  y: number;
  width?: number;
  color: string;
  tags?: string[];
  connectedTo?: string[]; // IDs of cards this card connects to with SVG curve
}

interface VisionBoardCanvasProps {
  initialLyrics: string;
  trackTitle?: string;
  bpm?: number;
  musicalKey?: string;
  genre?: string;
  vocal?: string;
  onCompileToLyrics: (compiledLyrics: string) => void;
  onSendToSunoTab?: (lyrics: string) => void;
  isDarkMode?: boolean;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const VisionBoardCanvas: React.FC<VisionBoardCanvasProps> = ({
  initialLyrics,
  trackTitle = 'Sovereign Track',
  bpm = 128,
  musicalKey = 'Abm',
  genre = 'Christian Hip Hop / Worship',
  vocal = 'Primary Vocal',
  onCompileToLyrics,
  onSendToSunoTab,
  isDarkMode = true,
  showToast
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showConnections, setShowConnections] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Generate cards from lyrics and track metadata
  const [cards, setCards] = useState<VisionCard[]>(() => {
    const parsedCards: VisionCard[] = [];
    const blocks = initialLyrics.split(/\n\n+/).filter(b => b.trim().length > 0);

    // 1. Parse lyric blocks
    blocks.forEach((block, idx) => {
      const lines = block.split('\n');
      const firstLine = lines[0].trim();
      const isHeader = firstLine.startsWith('[');
      const title = isHeader ? firstLine : `Section ${idx + 1}`;
      const content = isHeader ? lines.slice(1).join('\n') : block;

      let color = 'border-indigo-600/70 bg-slate-900/95';
      if (title.toLowerCase().includes('chorus')) color = 'border-purple-600/80 bg-slate-900/95';
      if (title.toLowerCase().includes('bridge') || title.toLowerCase().includes('pivot')) color = 'border-amber-500/80 bg-slate-900/95';

      parsedCards.push({
        id: `card-lyric-${idx + 1}`,
        type: 'lyric',
        title,
        subtitle: `Block ${idx + 1} • Lyric Unit`,
        content,
        x: 60 + (idx % 3) * 360,
        y: 60 + Math.floor(idx / 3) * 300,
        width: 320,
        color,
        tags: [isHeader ? 'Tagged' : 'Raw', 'Arrangement'],
        connectedTo: idx > 0 ? [`card-lyric-${idx}`] : []
      });
    });

    // 2. Add Visual Artwork Concept Card
    parsedCards.push({
      id: 'card-visual-art',
      type: 'visual_art',
      title: '🎨 Album Cover & Visual Thesis',
      subtitle: 'NightCafe / Midjourney Moodboard',
      content: `Prompt: Cinematic biblical realism, rugged quarry stone cross, morning golden hour rim light, photorealistic 8k, volumetric atmosphere, 1:1 aspect ratio.`,
      x: 60,
      y: 680,
      width: 340,
      color: 'border-pink-600/70 bg-slate-900/95',
      tags: ['1:1 Art', 'Aesthetic', 'Album Cover']
    });

    // 3. Add Veo 3 Video Scene Storyboard Card
    parsedCards.push({
      id: 'card-veo-video',
      type: 'video_scene',
      title: '🎬 Veo 3 Cinematic Reel Storyboard',
      subtitle: '9:16 Vertical Short-Form Scene',
      content: `Phase 1 Hook: High-contrast close up of performer singing first line into vintage mic.
Phase 2 Build: Aerial slow-motion drone flyover abandoned stone sanctuary.
Phase 3 Drop: Explosive light beam breakthrough aligned with Chorus beat drop.`,
      x: 430,
      y: 680,
      width: 350,
      color: 'border-rose-600/70 bg-slate-900/95',
      tags: ['9:16 Reel', 'Veo 3', 'TikTok/Reels Hook']
    });

    // 4. Add Suno 4-Block Audio Engine Card
    parsedCards.push({
      id: 'card-suno-audio',
      type: 'suno_audio',
      title: '⚡ Suno v5.5 Audio Engine Prompt',
      subtitle: `${genre} • ${bpm} BPM`,
      content: `Key: ${musicalKey} | BPM: ${bpm}
Vocal: ${vocal}
Style Prompt: Heavy 808 sub-bass, atmospheric Rhodes piano chords, authentic male rap vocal, soaring female worship chorus lift.
Negative Prompt: digital distortion, thin treble, muffled vocal, sibilance.`,
      x: 810,
      y: 680,
      width: 340,
      color: 'border-blue-600/70 bg-slate-900/95',
      tags: ['Suno v5.5', 'Audio Engine', 'BPM Lock']
    });

    // 5. Add Theological SOP Sticky Note
    parsedCards.push({
      id: 'card-theology-sop',
      type: 'theology_sop',
      title: '🛡️ Nashville SOP & Theological Check',
      subtitle: 'Sovereign Records Standard',
      content: `• Throne Room Pivot: Must execute vertical shift by Bridge.
• Christianese Filter: Purge clichés; favor blue-collar testimony.
• Selah Prayer Gate: 24h prayer stationkeeping before final master.`,
      x: 1180,
      y: 60,
      width: 300,
      color: 'border-emerald-600/70 bg-slate-900/95',
      tags: ['Nashville SOP', 'Theology', 'Quality Control']
    });

    return parsedCards;
  });

  // Re-parse when initialLyrics changes externally
  useEffect(() => {
    if (initialLyrics && initialLyrics.trim().length > 0) {
      // Retain custom nodes like visual_art/suno, but refresh lyrics
      setCards(prev => {
        const nonLyricCards = prev.filter(c => c.type !== 'lyric');
        const blocks = initialLyrics.split(/\n\n+/).filter(b => b.trim().length > 0);
        const newLyricCards: VisionCard[] = blocks.map((block, idx) => {
          const lines = block.split('\n');
          const firstLine = lines[0].trim();
          const isHeader = firstLine.startsWith('[');
          const title = isHeader ? firstLine : `Section ${idx + 1}`;
          const content = isHeader ? lines.slice(1).join('\n') : block;

          let color = 'border-indigo-600/70 bg-slate-900/95';
          if (title.toLowerCase().includes('chorus')) color = 'border-purple-600/80 bg-slate-900/95';
          if (title.toLowerCase().includes('bridge') || title.toLowerCase().includes('pivot')) color = 'border-amber-500/80 bg-slate-900/95';

          return {
            id: `card-lyric-${idx + 1}`,
            type: 'lyric',
            title,
            subtitle: `Block ${idx + 1} • Lyric Unit`,
            content,
            x: 60 + (idx % 3) * 360,
            y: 60 + Math.floor(idx / 3) * 300,
            width: 320,
            color,
            tags: [isHeader ? 'Tagged' : 'Raw', 'Arrangement'],
            connectedTo: idx > 0 ? [`card-lyric-${idx}`] : []
          };
        });
        return [...newLyricCards, ...nonLyricCards];
      });
    }
  }, [initialLyrics]);

  // Update card position on drag stop
  const handleDragEnd = (id: string, info: any) => {
    setCards(prev =>
      prev.map(c => {
        if (c.id === id) {
          return {
            ...c,
            x: Math.max(20, c.x + info.offset.x),
            y: Math.max(20, c.y + info.offset.y)
          };
        }
        return c;
      })
    );
  };

  // Edit card content
  const handleUpdateContent = (id: string, newContent: string) => {
    setCards(prev =>
      prev.map(c => (c.id === id ? { ...c, content: newContent } : c))
    );
  };

  // Edit card title
  const handleUpdateTitle = (id: string, newTitle: string) => {
    setCards(prev =>
      prev.map(c => (c.id === id ? { ...c, title: newTitle } : c))
    );
  };

  // Add new card
  const handleAddCard = (type: VisionCardType) => {
    const id = `card-${type}-${Date.now()}`;
    const newCard: VisionCard = {
      id,
      type,
      title: type === 'lyric' ? '[New Section]' : type === 'visual_art' ? '🎨 Art Concept' : type === 'video_scene' ? '🎬 Video Scene' : '📝 Studio Note',
      subtitle: 'Custom Board Block',
      content: type === 'lyric' ? 'Enter lyrics here...' : 'Describe creative prompt or notes...',
      x: 120 + Math.random() * 200,
      y: 120 + Math.random() * 200,
      width: 320,
      color: type === 'lyric' ? 'border-indigo-600/70 bg-slate-900/95' : type === 'visual_art' ? 'border-pink-600/70 bg-slate-900/95' : 'border-emerald-600/70 bg-slate-900/95',
      tags: ['User Created']
    };
    setCards(prev => [...prev, newCard]);
    setSelectedCardId(id);
    if (showToast) showToast('Added new card to Vision Board!', 'success');
  };

  // Remove card
  const handleDeleteCard = (id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
    if (selectedCardId === id) setSelectedCardId(null);
    if (showToast) showToast('Card removed from board', 'info');
  };

  // Compile spatial lyric cards into coherent markdown song
  const handleCompileBoard = () => {
    const lyricCards = cards
      .filter(c => c.type === 'lyric')
      .sort((a, b) => {
        // Sort top to bottom, then left to right
        if (Math.abs(a.y - b.y) > 100) return a.y - b.y;
        return a.x - b.x;
      });

    const compiled = lyricCards
      .map(c => {
        const title = c.title.trim();
        const body = c.content.trim();
        return title ? `${title}\n${body}` : body;
      })
      .join('\n\n');

    onCompileToLyrics(compiled);
    if (showToast) showToast('Compiled Vision Board into Song Lyrics!', 'success');
  };

  // 1-Click Send to Suno Tab
  const handleCompileAndSendToSuno = () => {
    const lyricCards = cards
      .filter(c => c.type === 'lyric')
      .sort((a, b) => (Math.abs(a.y - b.y) > 100 ? a.y - b.y : a.x - b.x));

    const compiled = lyricCards
      .map(c => `${c.title.trim()}\n${c.content.trim()}`)
      .join('\n\n');

    onCompileToLyrics(compiled);
    if (onSendToSunoTab) {
      onSendToSunoTab(compiled);
    }
  };

  // Filtered cards
  const filteredCards = cards.filter(c => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'lyrics') return c.type === 'lyric';
    if (activeFilter === 'visuals') return c.type === 'visual_art' || c.type === 'video_scene';
    if (activeFilter === 'audio') return c.type === 'suno_audio' || c.type === 'theology_sop';
    return true;
  });

  return (
    <div className="flex flex-col h-[750px] bg-slate-950 text-slate-100 rounded-xl border border-slate-800 overflow-hidden relative select-none">
      {/* Vision Board Canvas Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/95 border-b border-slate-800 z-20 backdrop-blur-md flex-wrap gap-2">
        <div className="flex items-center space-x-3">
          <div className="p-1.5 rounded-lg bg-indigo-950 border border-indigo-700/60 text-indigo-400">
            <Layers className="w-4 h-4 text-indigo-300" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <span>Vision Board & Storyboard Canvas</span>
              <span className="text-[10px] bg-indigo-950 border border-indigo-700 text-indigo-300 px-2 py-0.5 rounded font-mono">
                BlockSuite Edgeless Mode
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Drag, arrange, and connect lyric stanzas, video scenes, album art prompts, and audio tags
            </p>
          </div>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex items-center space-x-2 flex-wrap gap-1.5">
          {/* Filter Pills */}
          <div className="flex bg-slate-950 border border-slate-800 rounded p-0.5 text-xs">
            {['all', 'lyrics', 'visuals', 'audio'].map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-2 py-1 rounded text-[11px] font-medium capitalize transition ${
                  activeFilter === f ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Add Block Dropdown Buttons */}
          <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded px-1.5 py-1">
            <span className="text-[10px] text-slate-500 font-mono mr-1">ADD:</span>
            <button
              onClick={() => handleAddCard('lyric')}
              className="p-1 hover:bg-slate-800 text-indigo-300 rounded text-[11px] flex items-center space-x-1"
              title="Add Lyric Stanza Card"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Lyric</span>
            </button>
            <button
              onClick={() => handleAddCard('visual_art')}
              className="p-1 hover:bg-slate-800 text-pink-300 rounded text-[11px] flex items-center space-x-1"
              title="Add Visual Artwork Prompt Card"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Art</span>
            </button>
            <button
              onClick={() => handleAddCard('video_scene')}
              className="p-1 hover:bg-slate-800 text-rose-300 rounded text-[11px] flex items-center space-x-1"
              title="Add Veo 3 Video Scene Card"
            >
              <Film className="w-3.5 h-3.5" />
              <span>Scene</span>
            </button>
            <button
              onClick={() => handleAddCard('theology_sop')}
              className="p-1 hover:bg-slate-800 text-emerald-300 rounded text-[11px] flex items-center space-x-1"
              title="Add SOP Rule Card"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>SOP</span>
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs">
            <button
              onClick={() => setZoom(prev => Math.max(0.6, prev - 0.1))}
              className="text-slate-400 hover:text-white p-0.5"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono text-indigo-300 w-8 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(prev => Math.min(1.4, prev + 0.1))}
              className="text-slate-400 hover:text-white p-0.5"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="text-slate-500 hover:text-white p-0.5 ml-1"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Toggle Connector Lines */}
          <button
            onClick={() => setShowConnections(!showConnections)}
            className={`px-2 py-1 rounded text-xs font-semibold border transition ${
              showConnections
                ? 'bg-purple-950 border-purple-600 text-purple-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title="Toggle SVG arrangement connection lines"
          >
            Wires
          </button>

          {/* Compile to Song */}
          <button
            onClick={handleCompileBoard}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold shadow transition"
            title="Compile the spatial board into structured song lyrics"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Compile Board</span>
          </button>

          {/* Send to Suno */}
          {onSendToSunoTab && (
            <button
              onClick={handleCompileAndSendToSuno}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded text-xs font-semibold shadow transition"
              title="Compile and open in Lyric & Suno Studio"
            >
              <Send className="w-3.5 h-3.5" />
              <span>To Suno Tab</span>
            </button>
          )}
        </div>
      </div>

      {/* Infinite Canvas Container with Subtle Grid Background */}
      <div
        ref={containerRef}
        className="flex-1 w-full h-full overflow-auto relative bg-[#0b0f19] cursor-grab active:cursor-grabbing"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(99, 102, 241, 0.12) 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      >
        <div
          className="relative min-w-[2400px] min-h-[1600px] p-8 origin-top-left transition-transform duration-75"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* SVG Connection Lines between Linked Cards */}
          {showConnections && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              <defs>
                <linearGradient id="wireGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0.7" />
                </linearGradient>
              </defs>
              {filteredCards.map((card) => {
                if (!card.connectedTo || card.connectedTo.length === 0) return null;
                return card.connectedTo.map((targetId) => {
                  const target = cards.find(c => c.id === targetId);
                  if (!target) return null;

                  const startX = card.x + (card.width || 320) / 2;
                  const startY = card.y + 60;
                  const endX = target.x + (target.width || 320) / 2;
                  const endY = target.y + 60;

                  const dx = endX - startX;
                  const dy = endY - startY;
                  const controlX1 = startX + dx * 0.5;
                  const controlY1 = startY;
                  const controlX2 = startX + dx * 0.5;
                  const controlY2 = endY;

                  return (
                    <g key={`${card.id}->${targetId}`}>
                      <path
                        d={`M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`}
                        fill="none"
                        stroke="url(#wireGradient)"
                        strokeWidth="2.5"
                        strokeDasharray="6,4"
                        className="animate-pulse"
                      />
                      <circle cx={endX} cy={endY} r="4" fill="#a855f7" />
                    </g>
                  );
                });
              })}
            </svg>
          )}

          {/* Draggable Vision Cards */}
          {filteredCards.map((card) => {
            const isSelected = selectedCardId === card.id;

            return (
              <motion.div
                key={card.id}
                drag
                dragMomentum={false}
                onDragEnd={(_, info) => handleDragEnd(card.id, info)}
                onClick={() => setSelectedCardId(card.id)}
                style={{
                  position: 'absolute',
                  left: card.x,
                  top: card.y,
                  width: card.width || 320
                }}
                className={`rounded-xl border shadow-2xl backdrop-blur-md z-10 transition-shadow ${card.color} ${
                  isSelected ? 'ring-2 ring-indigo-400 shadow-indigo-500/20' : 'hover:shadow-lg'
                }`}
              >
                {/* Card Header with Drag Handle */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-950/80 rounded-t-xl cursor-move">
                  <div className="flex items-center space-x-2 flex-1 mr-2 min-w-0">
                    <Move className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <input
                      type="text"
                      value={card.title}
                      onChange={(e) => handleUpdateTitle(card.id, e.target.value)}
                      className="bg-transparent font-bold text-xs text-white focus:outline-none focus:border-b border-indigo-400 truncate w-full"
                    />
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCard(card.id);
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                      title="Delete card"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Subtitle / Metadata */}
                {card.subtitle && (
                  <div className="px-3 py-1 bg-slate-900/60 border-b border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>{card.subtitle}</span>
                    <span className="uppercase tracking-wider font-semibold text-indigo-400">{card.type.replace('_', ' ')}</span>
                  </div>
                )}

                {/* Card Body - Content Editor */}
                <div className="p-3">
                  <textarea
                    value={card.content}
                    onChange={(e) => handleUpdateContent(card.id, e.target.value)}
                    rows={card.type === 'lyric' ? 6 : 4}
                    className="w-full bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 text-xs text-slate-200 font-mono resize-y focus:outline-none focus:border-indigo-500/80 leading-relaxed selection:bg-indigo-900"
                    placeholder="Enter block content..."
                  />
                </div>

                {/* Card Footer with Tags */}
                {card.tags && card.tags.length > 0 && (
                  <div className="px-3 py-1.5 bg-slate-950/70 border-t border-slate-800/80 rounded-b-xl flex items-center justify-between flex-wrap gap-1">
                    <div className="flex items-center space-x-1 flex-wrap gap-1">
                      {card.tags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="text-[9px] bg-slate-800/80 border border-slate-700/60 text-slate-400 px-1.5 py-0.5 rounded font-mono"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {card.content.split('\n').length} lines
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
