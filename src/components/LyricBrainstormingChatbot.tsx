import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Plus,
  Copy,
  Check,
  RotateCcw,
  Lightbulb,
  Music,
  BookOpen,
  Compass,
  ArrowRight,
  Flame,
  FileText,
  Trash2,
  Download,
  Sliders,
  ChevronDown,
  Layers,
  Wand2
} from 'lucide-react';
import { Track } from '../types';

export interface LyricBrainstormingChatbotProps {
  track: Track;
  onInsertLyrics: (snippet: string, mode: 'replace' | 'append' | 'prepend') => void;
  isDarkMode?: boolean;
  onNavigateToWorkbench?: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const QUICK_BRAINSTORM_PROMPTS = [
  {
    label: 'Chorus Hooks',
    icon: Flame,
    color: 'from-amber-600 to-rose-600',
    prompt: 'Brainstorm 5 powerful, emotionally resonant chorus hook lines for this song. Give each a brief rhyme scheme and meter.'
  },
  {
    label: 'Biblical Metaphors',
    icon: BookOpen,
    color: 'from-purple-600 to-indigo-600',
    prompt: 'Suggest 4 fresh theological metaphors and scriptural imagery that fit the emotional mood without sounding cliché.'
  },
  {
    label: 'Nashville Storytelling',
    icon: Music,
    color: 'from-emerald-600 to-teal-600',
    prompt: 'Give me 3 visceral, specific visual scenes for Verse 1 (concrete objects, weather, tangible actions, setting the room).'
  },
  {
    label: 'Rhyme & Phrasing',
    icon: Sparkles,
    color: 'from-cyan-600 to-blue-600',
    prompt: 'Explore rich vowel rhymes and rhythmic phrasing ideas for the title and central emotional theme.'
  },
  {
    label: 'Bridge Climax',
    icon: Wand2,
    color: 'from-indigo-600 to-pink-600',
    prompt: 'Brainstorm a high-intensity bridge that shifts perspective and releases the tension into the final chorus.'
  }
];

export const LyricBrainstormingChatbot: React.FC<LyricBrainstormingChatbotProps> = ({
  track,
  onInsertLyrics,
  isDarkMode = true,
  onNavigateToWorkbench
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const cached = localStorage.getItem(`brickos_lyric_brainstorm_${track.id}`);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn('Failed to parse cached brainstorm messages', e);
    }
    return [
      {
        id: 'welcome-1',
        role: 'assistant',
        content: `Hey Ted! I'm your Gemini songwriting and ideation co-writer for **"${track.title}"**.\n\nWhat are you feeling for this track? Drop a few raw words, a scripture passage, a melody idea, or pick one of the quick starters below and let's craft something unforgettable.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [input, setInput] = useState('');
  const [scratchpad, setScratchpad] = useState(() => {
    try {
      return localStorage.getItem(`brickos_lyric_scratchpad_${track.id}`) || '';
    } catch {
      return '';
    }
  });
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [insertedMsgId, setInsertedMsgId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<'gemini-3.8-flash' | 'gemini-3.1-pro-preview'>('gemini-3.1-pro-preview');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Save conversation per track
  useEffect(() => {
    try {
      localStorage.setItem(`brickos_lyric_brainstorm_${track.id}`, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to cache brainstorm messages', e);
    }
  }, [messages, track.id]);

  // Save scratchpad per track
  useEffect(() => {
    try {
      localStorage.setItem(`brickos_lyric_scratchpad_${track.id}`, scratchpad);
    } catch (e) {
      console.warn('Failed to cache scratchpad', e);
    }
  }, [scratchpad, track.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const userPrompt = (textToSend !== undefined ? textToSend : input).trim();
    if (!userPrompt || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      role: 'user',
      content: userPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const systemInstruction = `You are an elite Nashville master songwriter, lyricist, and creative songwriting partner inside brickOS Studio following the BrickOS v10 SOP.
Current Track Context:
- Title: "${track.title}"
- ID: ${track.id}
- Genre: ${track.genre}
- Tempo: ${track.bpm} BPM
- Musical Key: ${track.key}
- EP Collection: ${track.ep}
${scratchpad.trim() ? `\nSongwriter's Raw Scratchpad Ideas:\n"${scratchpad}"\n` : ''}
${track.lyrics?.trim() ? `\nCurrent Draft Lyrics:\n"""\n${track.lyrics}\n"""\n` : '\n(The song is currently in early ideation - no draft lyrics locked in yet.)\n'}
Guidelines:
1. Brainstorm visceral, singable, and emotionally resonant lyrical concepts.
2. The 'Christianese' Filter: Strictly replace generic religious clichés, church buzzwords, and tired slogans with raw, conversational poetics grounded in real human experience.
3. Emphasize Nashville craftsmanship: tangible sensory details, authentic narrative stakes, rhythmically locked meter, and memorable hooks.
4. When writing lyric sections, format them cleanly with standard brackets like [Verse 1], [Chorus], [Bridge] so the writer can insert them straight into the workbench.
5. Be concise, punchy, inspiring, and conversational.`;

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          systemInstruction,
          model: selectedModel
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-a`,
        role: 'assistant',
        content: data.reply || "I didn't receive a response. Let's try again with a slightly different angle.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Brainstorming error:', err);
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        role: 'assistant',
        content: `⚠️ Brainstorming note: ${err.message || 'Could not connect to Gemini'}. Please verify connection and retry.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendScratchpad = () => {
    if (!scratchpad.trim()) return;
    handleSendMessage(`Here are my raw brainstorm notes and ideas for "${track.title}". Please analyze them, extract the strongest hooks, and propose an authentic 4-part structure (Verse 1, Pre-Chorus, Chorus, Bridge):\n\n${scratchpad}`);
  };

  const handleCopyText = (id: string, text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedMsgId(id);
      setTimeout(() => setCopiedMsgId(null), 2500);
    }
  };

  const handleInsertSnippet = (id: string, snippet: string, mode: 'append' | 'replace') => {
    // Extract lyric sections if they exist in brackets, or use the whole text
    onInsertLyrics(snippet, mode);
    setInsertedMsgId(id);
    setTimeout(() => setInsertedMsgId(null), 3000);
  };

  const handleClearChat = () => {
    if (window.confirm('Clear brainstorming conversation history for this track?')) {
      const resetMsg: ChatMessage = {
        id: 'welcome-reset',
        role: 'assistant',
        content: `Brainstorm session refreshed for **"${track.title}"**. What new direction or musical vibe should we explore?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([resetMsg]);
    }
  };

  return (
    <div className={`rounded-2xl border shadow-xl flex flex-col transition-all overflow-hidden ${
      isDarkMode 
        ? 'bg-slate-900 border-slate-800 text-white' 
        : 'bg-white border-slate-200 text-slate-900'
    }`}>
      {/* 1. HEADER: WORKFLOW 1 BANNER & CONTEXT */}
      <div className={`px-5 py-3.5 border-b flex items-center justify-between gap-4 flex-wrap ${
        isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-amber-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Workflow 1
              </span>
              <h3 className="text-sm font-black tracking-tight">Gemini Creative Lyric Brainstorming</h3>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Ideate concepts, rhymes, hooks & theological themes for <strong className="text-indigo-300">{track.id}: {track.title}</strong>
            </p>
          </div>
        </div>

        {/* Model Selector & Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800 text-xs">
            <Bot className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as any)}
              className="bg-transparent text-xs font-mono font-bold text-slate-300 focus:outline-hidden cursor-pointer"
            >
              <option value="gemini-3.1-pro-preview">gemini-3.1-pro (Deep Reasoning & Production Craft)</option>
              <option value="gemini-3.8-flash">gemini-3.8-flash (Fast & Lightweight)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleClearChat}
            className={`p-1.5 rounded-xl border transition text-slate-400 hover:text-rose-400 cursor-pointer ${
              isDarkMode ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'
            }`}
            title="Clear brainstorming chat"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {onNavigateToWorkbench && (
            <button
              type="button"
              onClick={onNavigateToWorkbench}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-950 transition cursor-pointer"
              title="Jump to Workflow 2: Lyric Multi-Pane Workbench"
            >
              <span>To Lyric Workbench</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. SONGWRITER'S SCRATCHPAD / RAW IDEAS SEED DRAWER */}
      <div className={`border-b transition-all ${
        isDarkMode ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-50/60 border-slate-200'
      }`}>
        <div 
          onClick={() => setIsScratchpadOpen(!isScratchpadOpen)}
          className="px-5 py-2.5 flex items-center justify-between cursor-pointer select-none hover:bg-white/5 transition"
        >
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-slate-200">Songwriter's Raw Scratchpad & Brainstorm Seeds</span>
            <span className="text-[10px] font-mono text-slate-400">
              ({scratchpad.length > 0 ? `${scratchpad.split(/\s+/).filter(Boolean).length} words` : 'Empty — jot rough ideas here'})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-indigo-400">
              {isScratchpadOpen ? 'Hide' : 'Show Scratchpad'}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isScratchpadOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {isScratchpadOpen && (
          <div className="p-4 pt-0 space-y-2.5 animate-fadeIn">
            <textarea
              value={scratchpad}
              onChange={(e) => setScratchpad(e.target.value)}
              placeholder="Jot down rough ideas, fragments, a cool hook phrase, scripture passages (e.g. Ezekiel 37, Isaiah 53), voice-memo notes, or musical vibes..."
              rows={3}
              className={`w-full p-3 rounded-xl border text-xs font-mono resize-y focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                isDarkMode 
                  ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500' 
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                <span>💡 Tip: Write a few thoughts and hit "Brainstorm with Gemini" to turn raw seeds into verse/chorus options.</span>
              </div>
              <button
                type="button"
                onClick={handleSendScratchpad}
                disabled={!scratchpad.trim() || isLoading}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>Brainstorm These Seeds with Gemini →</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. 1-CLICK QUICK PROMPT PILLS */}
      <div className={`px-5 py-2.5 border-b flex items-center gap-2 overflow-x-auto custom-scrollbar ${
        isDarkMode ? 'bg-slate-950/20 border-slate-800/60' : 'bg-slate-100/50 border-slate-200'
      }`}>
        <span className="text-[10px] font-mono text-slate-400 uppercase font-bold shrink-0">Starters:</span>
        {QUICK_BRAINSTORM_PROMPTS.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(q.prompt)}
            disabled={isLoading}
            className={`px-3 py-1 rounded-xl text-xs font-medium border transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs hover:scale-102 active:scale-98 ${
              isDarkMode 
                ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-200 hover:text-white' 
                : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800'
            }`}
          >
            <q.icon className="w-3.5 h-3.5 text-amber-400" />
            <span>{q.label}</span>
          </button>
        ))}
      </div>

      {/* 4. CHAT CONVERSATION THREAD */}
      <div className="p-5 flex-1 overflow-y-auto space-y-4 max-h-[460px] min-h-[300px] custom-scrollbar">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[85%] rounded-2xl p-4 shadow-md space-y-2.5 ${
                isUser
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : isDarkMode
                  ? 'bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-tl-none'
                  : 'bg-slate-50 border border-slate-200 text-slate-900 rounded-tl-none'
              }`}>
                {/* Header info */}
                <div className="flex items-center justify-between gap-4 text-[10px] font-mono opacity-70">
                  <span className="font-bold">{isUser ? 'Ted Moyer (Songwriter)' : 'Gemini Songwriting Partner'}</span>
                  <span>{msg.timestamp}</span>
                </div>

                {/* Message body */}
                <div className="text-xs whitespace-pre-wrap leading-relaxed font-sans">
                  {msg.content}
                </div>

                {/* Assistant Action Strip: Insert to Workbench / Copy */}
                {!isUser && (
                  <div className="pt-2 border-t border-slate-700/50 flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleInsertSnippet(msg.id, msg.content, 'append')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition flex items-center gap-1 cursor-pointer ${
                        insertedMsgId === msg.id
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : isDarkMode
                          ? 'bg-indigo-600/20 hover:bg-indigo-600 border-indigo-500/40 text-indigo-300 hover:text-white'
                          : 'bg-indigo-50 hover:bg-indigo-600 border-indigo-200 text-indigo-700 hover:text-white'
                      }`}
                      title="Append this lyrical block directly into your active lyric workbench"
                    >
                      {insertedMsgId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-white" />
                          <span>Inserted to Draft!</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3" />
                          <span>Insert to Lyric Draft</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyText(msg.id, msg.content)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition flex items-center gap-1 cursor-pointer ${
                        copiedMsgId === msg.id
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : isDarkMode
                          ? 'bg-slate-900/60 hover:bg-slate-700 border-slate-700 text-slate-300'
                          : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                      }`}
                      title="Copy response to clipboard"
                    >
                      {copiedMsgId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-white" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-400" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-indigo-700 flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 justify-start animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Bot className="w-4 h-4 animate-spin-slow" />
            </div>
            <div className={`p-3.5 rounded-2xl border text-xs font-mono flex items-center gap-2 ${
              isDarkMode ? 'bg-slate-800/80 border-slate-700 text-indigo-300' : 'bg-slate-100 border-slate-200 text-indigo-700'
            }`}>
              <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
              <span>Gemini is composing rhymes, hooks & Nashville concepts...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* 5. BOTTOM INPUT COMPOSER */}
      <div className={`p-4 border-t ${
        isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask Gemini for hooks, lines, rhymes, or thematic ideas for "${track.title}"...`}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 rounded-xl border text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
              isDarkMode 
                ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' 
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
            }`}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-950 transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
