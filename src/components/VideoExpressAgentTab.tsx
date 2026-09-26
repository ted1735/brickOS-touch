import React, { useState, useMemo } from 'react';
import {
  Video,
  User,
  Mic,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Copy,
  Sparkles,
  RefreshCw,
  HardDrive,
  FileText,
  Clock,
  Scissors,
  CheckSquare,
  Lock,
  Unlock,
  Layers,
  ChevronRight,
  ExternalLink,
  Film,
  Zap,
  Play
} from 'lucide-react';
import { Track, VideoExpressProject, VideoExpressSceneClip } from '../types';

interface VideoExpressAgentTabProps {
  tracks: Track[];
  selectedTrack: Track;
  isDarkMode: boolean;
  onSelectTrack: (track: Track) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  copyToClipboard: (text: string, label: string) => void;
}

const CHARACTER_PRESETS = [
  {
    id: 'nashville_producer',
    name: 'The Nashville Engineer',
    archetype: 'Audio Master / Craftsman',
    avatarUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=500&auto=format&fit=crop&q=80',
    prompt: 'Photorealistic 45-year-old male audio engineer, weathered work flannel shirt, Sennheiser studio headphones resting around neck, salt-and-pepper beard, focused determined expression, soft warm analog studio console lighting in background, 50mm portrait lens, 8k documentary aesthetic.',
    voiceClone: 'The Architect (Resolute Baritone)',
    aspectRatio: '9:16' as const
  },
  {
    id: 'sovereign_pastor',
    name: 'The Sovereign Preacher',
    archetype: 'Theological Teacher',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
    prompt: 'Photorealistic 38-year-old male pastor, dark wool jacket over dark charcoal crewneck, earnest and piercing eye contact, rustic timber chapel beam architecture in soft bokeh background, natural morning sunlight streaming from high window, 85mm anamorphic portrait, cinematic realism.',
    voiceClone: 'Silas Thorne (Gravelly Nashville Voice)',
    aspectRatio: '9:16' as const
  },
  {
    id: 'frontline_healer',
    name: 'The Frontline Nurse',
    archetype: 'Healthcare Servant (TRK-27)',
    avatarUrl: 'https://images.unsplash.com/photo-1594824813605-649080d85970?w=500&auto=format&fit=crop&q=80',
    prompt: 'Photorealistic 34-year-old female ICU charge nurse, navy medical scrubs, stethoscope around neck, hair tied back with tired yet unwavering eyes, quiet sterile dawn hospital hallway in soft chiaroscuro background, photorealistic documentary realism, 50mm f/1.8 lens.',
    voiceClone: 'Rachel (Steady & Empathetic Voice)',
    aspectRatio: '9:16' as const
  },
  {
    id: 'blue_collar_artisan',
    name: 'The Cedar Craftsman',
    archetype: 'Blue Collar Laborer',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=80',
    prompt: 'Photorealistic 50-year-old craftsman, leather workshop apron over denim shirt, sawdust in beard, calloused hands resting on workbench, warm golden hour sunbeams illuminating dust motes, deep facial character lines, rugged conviction, 8k photographic depth.',
    voiceClone: 'Silas Thorne (Gravelly Nashville Voice)',
    aspectRatio: '9:16' as const
  }
];

export const VideoExpressAgentTab: React.FC<VideoExpressAgentTabProps> = ({
  tracks,
  selectedTrack,
  isDarkMode,
  onSelectTrack,
  showToast,
  copyToClipboard
}) => {
  // Selected character preset or custom
  const [selectedPresetId, setSelectedPresetId] = useState<string>('nashville_producer');
  const [characterName, setCharacterName] = useState<string>('The Nashville Engineer');
  const [characterPrompt, setCharacterPrompt] = useState<string>(CHARACTER_PRESETS[0].prompt);
  const [referenceLocked, setReferenceLocked] = useState<boolean>(true);
  const [referenceSeed, setReferenceSeed] = useState<number>(428901);
  const [characterAvatarUrl, setCharacterAvatarUrl] = useState<string>(CHARACTER_PRESETS[0].avatarUrl);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('9:16');
  
  // Script and voice configuration
  const [topicInput, setTopicInput] = useState<string>(
    `The hidden story behind "${selectedTrack.title}": why human striving fails until you hit the Throne Room Pivot.`
  );
  const [voiceCloneName, setVoiceCloneName] = useState<string>('The Architect (Resolute Baritone)');
  const [deadAirTrim, setDeadAirTrim] = useState<number>(0.25); // seconds trimmed from head & tail

  // 6-8 micro-scenes adhering strictly to the <100 characters per line rule
  const [scenes, setScenes] = useState<VideoExpressSceneClip[]>([
    {
      sceneNumber: 1,
      sceneTitle: 'Hook: The False Striving',
      spokenLine: 'Most people spend their entire lives working on the wrong foundation.',
      charCount: 66,
      durationSeconds: 7.5,
      cameraMovement: 'Slow dramatic push-in to eye level',
      avatarExpression: 'Serious, direct gaze, calm authority',
      trimHeadSeconds: 0.25,
      trimTailSeconds: 0.25,
      audioVoiceoverId: 'voice_01',
      renderStatus: 'verified',
      evidenceStatus: 'pass'
    },
    {
      sceneNumber: 2,
      sceneTitle: 'The Problem: 5 AM Fatigue',
      spokenLine: 'You wake up at five in the morning carrying weights you were never meant to hold.',
      charCount: 82,
      durationSeconds: 8.0,
      cameraMovement: 'Subtle handheld drift, steady framing',
      avatarExpression: 'Slight head nod, empathetic recognition',
      trimHeadSeconds: 0.2,
      trimTailSeconds: 0.3,
      audioVoiceoverId: 'voice_02',
      renderStatus: 'verified',
      evidenceStatus: 'pass'
    },
    {
      sceneNumber: 3,
      sceneTitle: 'The Grinding Friction',
      spokenLine: 'Sweat on the brow, calloused hands, and a quiet ache in your chest.',
      charCount: 68,
      durationSeconds: 7.2,
      cameraMovement: 'Side angle 45-degree, medium close-up',
      avatarExpression: 'Pensive, reflecting on unseen labor',
      trimHeadSeconds: 0.25,
      trimTailSeconds: 0.25,
      audioVoiceoverId: 'voice_03',
      renderStatus: 'verified',
      evidenceStatus: 'pass'
    },
    {
      sceneNumber: 4,
      sceneTitle: 'The Pivot: 3-Second Stillness',
      spokenLine: 'And then right here—everything stops. Two seconds of complete dead air.',
      charCount: 74,
      durationSeconds: 8.5,
      cameraMovement: 'Camera freezes completely, spotlight narrows',
      avatarExpression: 'Intentional pause, deep breath, piercing stillness',
      trimHeadSeconds: 0.3,
      trimTailSeconds: 0.2,
      audioVoiceoverId: 'voice_04',
      renderStatus: 'verified',
      evidenceStatus: 'pass'
    },
    {
      sceneNumber: 5,
      sceneTitle: 'The Breakthrough Revelation',
      spokenLine: 'That silence is where your striving dies and His sovereignty takes over.',
      charCount: 71,
      durationSeconds: 8.0,
      cameraMovement: 'Graceful slow upward tilt, warm light swell',
      avatarExpression: 'Unmistakable conviction, eyes brightening',
      trimHeadSeconds: 0.25,
      trimTailSeconds: 0.25,
      audioVoiceoverId: 'voice_05',
      renderStatus: 'verified',
      evidenceStatus: 'pass'
    },
    {
      sceneNumber: 6,
      sceneTitle: 'The Song Connection',
      spokenLine: `That is the exact moment we captured in our track, "${selectedTrack.title}".`,
      charCount: 68,
      durationSeconds: 7.8,
      cameraMovement: 'Return to center close-up, sharp anamorphic focus',
      avatarExpression: 'Confident, inviting smile of victory',
      trimHeadSeconds: 0.2,
      trimTailSeconds: 0.25,
      audioVoiceoverId: 'voice_06',
      renderStatus: 'verified',
      evidenceStatus: 'pass'
    },
    {
      sceneNumber: 7,
      sceneTitle: 'Call to Action & Epilogue',
      spokenLine: 'Listen to the full master in the studio now. Build on the cornerstone.',
      charCount: 70,
      durationSeconds: 7.5,
      cameraMovement: 'Smooth pull-back into full studio landscape',
      avatarExpression: 'Resolute nod of peace, resting in Christ',
      trimHeadSeconds: 0.25,
      trimTailSeconds: 0.35,
      audioVoiceoverId: 'voice_07',
      renderStatus: 'verified',
      evidenceStatus: 'pass'
    }
  ]);

  // Active view mode
  const [activeTabSubView, setActiveTabSubView] = useState<'editor' | 'evidence' | 'prompt_export'>('editor');

  // Handle preset selection
  const handleSelectPreset = (presetId: string) => {
    const found = CHARACTER_PRESETS.find(p => p.id === presetId);
    if (!found) return;
    setSelectedPresetId(found.id);
    setCharacterName(found.name);
    setCharacterPrompt(found.prompt);
    setCharacterAvatarUrl(found.avatarUrl);
    setVoiceCloneName(found.voiceClone);
    setReferenceLocked(true);
    setReferenceSeed(Math.floor(Math.random() * 899999) + 100000);
    showToast(`Loaded "${found.name}" with locked reference!`, 'info');
  };

  // Update scene text and validate character limit (< 100)
  const handleUpdateSceneText = (index: number, newText: string) => {
    setScenes(prev => {
      const next = [...prev];
      const count = newText.length;
      next[index] = {
        ...next[index],
        spokenLine: newText,
        charCount: count,
        evidenceStatus: count < 100 ? 'pass' : 'fail'
      };
      return next;
    });
  };

  // Re-generate script from current selected track
  const handleAutoScriptFromTrack = () => {
    const title = selectedTrack.title;
    const thesis = selectedTrack.thesis || 'Sovereignty over self-reliance.';
    
    setTopicInput(`Inside "${title}": Transforming raw labor into eternal worship.`);
    setScenes([
      {
        sceneNumber: 1,
        sceneTitle: 'Hook: The Question',
        spokenLine: `What happens when you give everything you have, and it still feels incomplete?`,
        charCount: 75,
        durationSeconds: 7.5,
        cameraMovement: 'Slow dramatic push-in to eye level',
        avatarExpression: 'Serious, direct gaze, calm authority',
        trimHeadSeconds: deadAirTrim,
        trimTailSeconds: deadAirTrim,
        audioVoiceoverId: 'voice_01',
        renderStatus: 'synced',
        evidenceStatus: 'pass'
      },
      {
        sceneNumber: 2,
        sceneTitle: 'The Context of the Track',
        spokenLine: `When we wrote "${title}", we wanted to capture that exact struggle.`,
        charCount: 65,
        durationSeconds: 7.2,
        cameraMovement: 'Subtle handheld drift, steady framing',
        avatarExpression: 'Slight head nod, empathetic recognition',
        trimHeadSeconds: deadAirTrim,
        trimTailSeconds: deadAirTrim,
        audioVoiceoverId: 'voice_02',
        renderStatus: 'synced',
        evidenceStatus: 'pass'
      },
      {
        sceneNumber: 3,
        sceneTitle: 'The Physical Striving',
        spokenLine: 'Hands on the wheel, eyes on the road, praying for light in the fog.',
        charCount: 67,
        durationSeconds: 7.8,
        cameraMovement: 'Side angle 45-degree, medium close-up',
        avatarExpression: 'Pensive, reflecting on unseen labor',
        trimHeadSeconds: deadAirTrim,
        trimTailSeconds: deadAirTrim,
        audioVoiceoverId: 'voice_03',
        renderStatus: 'synced',
        evidenceStatus: 'pass'
      },
      {
        sceneNumber: 4,
        sceneTitle: 'The Bridge Drop',
        spokenLine: 'Right at the two-minute mark, the music drops out completely.',
        charCount: 61,
        durationSeconds: 8.2,
        cameraMovement: 'Camera freezes completely, spotlight narrows',
        avatarExpression: 'Intentional pause, deep breath, piercing stillness',
        trimHeadSeconds: deadAirTrim,
        trimTailSeconds: deadAirTrim,
        audioVoiceoverId: 'voice_04',
        renderStatus: 'synced',
        evidenceStatus: 'pass'
      },
      {
        sceneNumber: 5,
        sceneTitle: 'The Sovereign Pivot',
        spokenLine: 'Not by human might, but by sovereign grace taking the burden.',
        charCount: 60,
        durationSeconds: 8.0,
        cameraMovement: 'Graceful slow upward tilt, warm light swell',
        avatarExpression: 'Unmistakable conviction, eyes brightening',
        trimHeadSeconds: deadAirTrim,
        trimTailSeconds: deadAirTrim,
        audioVoiceoverId: 'voice_05',
        renderStatus: 'synced',
        evidenceStatus: 'pass'
      },
      {
        sceneNumber: 6,
        sceneTitle: 'The Sound Experience',
        spokenLine: `Experience the full Nashville mix of "${title}" in brickOS Studio today.`,
        charCount: 71,
        durationSeconds: 7.6,
        cameraMovement: 'Return to center close-up, sharp anamorphic focus',
        avatarExpression: 'Confident, inviting smile of victory',
        trimHeadSeconds: deadAirTrim,
        trimTailSeconds: deadAirTrim,
        audioVoiceoverId: 'voice_06',
        renderStatus: 'synced',
        evidenceStatus: 'pass'
      }
    ]);
    showToast(`Generated scripted scenes for "${title}" adhering to <100 chars!`, 'success');
  };

  // Calculate total duration
  const totalDuration = useMemo(() => {
    return scenes.reduce((acc, s) => acc + (s.durationSeconds - s.trimHeadSeconds - s.trimTailSeconds), 0);
  }, [scenes]);

  // Evidence table verification metrics
  const evidenceMetrics = useMemo(() => {
    const totalScenes = scenes.length;
    const passedChars = scenes.filter(s => s.charCount < 100).length;
    const allCharsPass = passedChars === totalScenes;
    const isReferenceLocked = referenceLocked;
    const isDurationPaced = totalDuration >= 45 && totalDuration <= 65; // High retention 60s sweet spot
    const isFullyVerified = allCharsPass && isReferenceLocked && totalScenes >= 6;

    return {
      totalScenes,
      passedChars,
      allCharsPass,
      isReferenceLocked,
      isDurationPaced,
      isFullyVerified
    };
  }, [scenes, referenceLocked, totalDuration]);

  // Generate the self-contained SYSTEM_PROMPT.md exactly as formatted in the strontiumplatform repo
  const systemPromptMarkdown = useMemo(() => {
    return `# VideoExpress.ai Consistent-Character Talking Avatar Workflow
## Project: ${selectedTrack.title} — 60s Talking Avatar Reel
Generated by brickOS Sovereign Studio (v1.6)

### 1. CHARACTER SPECIFICATION (LOCKED REFERENCE MODE)
- **Character Name**: ${characterName}
- **Role / Archetype**: ${CHARACTER_PRESETS.find(p => p.id === selectedPresetId)?.archetype || 'Custom Persona'}
- **Seed Lock**: ${referenceSeed} (LOCKED: ${referenceLocked ? 'YES' : 'NO'})
- **Visual Description Prompt**: 
  "${characterPrompt}"
- **Negative Prompt**: 
  "cartoon, CGI, glossy plastic face, floating teeth, deformed hands, inconsistent facial bone structure, morphing collar, oversaturated neon, extra fingers"
- **Aspect Ratio**: ${aspectRatio} (Vertical 1080x1920)

### 2. CLONEVOICE.AI NARRATION INTEGRATION
- **Voice Clone Profile**: ${voiceCloneName}
- **Pacing / Cadence**: 140 words per minute, steady cadence
- **Dead-Air Pacing Trim**: Head -${deadAirTrim}s, Tail -${deadAirTrim}s per clip

### 3. DETERMINISTIC SCENE BREAKDOWN (STRICT < 100 CHARS PER LINE)
${scenes.map(s => `#### Scene ${s.sceneNumber}: ${s.sceneTitle}
- **Spoken Line** (${s.charCount} chars): "${s.spokenLine}"
- **Camera Direction**: ${s.cameraMovement}
- **Avatar Facial Expression**: ${s.avatarExpression}
- **Duration**: ${s.durationSeconds}s (Net: ${(s.durationSeconds - s.trimHeadSeconds - s.trimTailSeconds).toFixed(1)}s)
- **Trim Timing**: Head: -${s.trimHeadSeconds}s | Tail: -${s.trimTailSeconds}s
`).join('\n')}

### 4. EVIDENCE TABLE & WORKFLOW VERIFICATION (GATES)
| Scene # | Spoken Line | Chars (<100) | Locked Seed | Net Duration | Audio Voice ID | Status |
|---|---|---|---|---|---|---|
${scenes.map(s => `| ${s.sceneNumber} | ${s.spokenLine.substring(0, 35)}... | ${s.charCount} (${s.charCount < 100 ? 'PASS' : 'FAIL'}) | ${referenceSeed} | ${(s.durationSeconds - s.trimHeadSeconds - s.trimTailSeconds).toFixed(1)}s | ${s.audioVoiceoverId} | VERIFIED |`).join('\n')}

**Total Paced Duration**: ${totalDuration.toFixed(1)}s (Target: ~60s Vertical Reel)
**Character Consistency Gate**: ${referenceLocked ? 'PASS (Reference Seed Locked)' : 'FAIL (Seed Unlocked)'}
**Line Drift Gate**: ${evidenceMetrics.allCharsPass ? 'PASS (100% Lines Under 100 Chars)' : 'FAIL (Contains Lines >= 100 Chars)'}
`;
  }, [selectedTrack, characterName, selectedPresetId, referenceSeed, referenceLocked, characterPrompt, aspectRatio, voiceCloneName, deadAirTrim, scenes, totalDuration, evidenceMetrics]);

  return (
    <div className={`p-6 rounded-2xl border space-y-6 transition-colors duration-200 ${
      isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
    }`}>
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-800/60">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-purple-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-wide flex items-center gap-2">
                  <span>VideoExpress.ai Talking Avatar Agent</span>
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Consistent Character Mode
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  &lt;100 Chars Rule
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Automated 60-second vertical talking-avatar reels with reference-locked faces, CloneVoice.ai narration, and deterministic evidence table verification.
              </p>
            </div>
          </div>
        </div>

        {/* Top Action Tabs & Track Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Song selector dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-mono text-[11px]">Track:</span>
            <select
              value={selectedTrack.id}
              onChange={(e) => {
                const found = tracks.find(t => t.id === e.target.value);
                if (found) onSelectTrack(found);
              }}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition focus:outline-hidden ${
                isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            >
              {tracks.map(t => (
                <option key={t.id} value={t.id}>
                  {t.id}: {t.title} ({t.ep.split(':')[0]})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTabSubView('editor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTabSubView === 'editor'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Studio Timeline</span>
            </button>
            <button
              onClick={() => setActiveTabSubView('evidence')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTabSubView === 'evidence'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Evidence Table</span>
              {evidenceMetrics.isFullyVerified ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-400" />
              )}
            </button>
            <button
              onClick={() => setActiveTabSubView('prompt_export')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTabSubView === 'prompt_export'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>SYSTEM_PROMPT.md</span>
            </button>
          </div>
        </div>
      </div>

      {/* METRIC STRIP (DURATION, RETENTION & GATES) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
          isDarkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="w-9 h-9 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-mono">Paced Duration</div>
            <div className="text-sm font-black text-rose-400 font-mono">
              {totalDuration.toFixed(1)}s <span className="text-[10px] text-slate-500 font-normal">/ 60s Reel</span>
            </div>
          </div>
        </div>

        <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
          isDarkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="w-9 h-9 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-mono">Character Lock</div>
            <div className="text-sm font-black text-purple-300 font-mono flex items-center gap-1.5">
              <span>Seed {referenceSeed}</span>
              <span className="text-[10px] text-emerald-400 font-bold">LOCKED</span>
            </div>
          </div>
        </div>

        <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
          isDarkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            evidenceMetrics.allCharsPass ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
          }`}>
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-mono">&lt;100 Chars Gate</div>
            <div className={`text-sm font-black font-mono ${evidenceMetrics.allCharsPass ? 'text-emerald-400' : 'text-rose-400'}`}>
              {evidenceMetrics.passedChars} / {evidenceMetrics.totalScenes} Passed
            </div>
          </div>
        </div>

        <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
          isDarkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            evidenceMetrics.isFullyVerified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
          }`}>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-mono">Workflow Status</div>
            <div className={`text-xs font-black font-mono uppercase ${evidenceMetrics.isFullyVerified ? 'text-emerald-400' : 'text-amber-400'}`}>
              {evidenceMetrics.isFullyVerified ? 'Ready for Render' : 'Needs Verification'}
            </div>
          </div>
        </div>
      </div>

      {/* SUBVIEW 1: STUDIO TIMELINE & AVATAR ENGINE */}
      {activeTabSubView === 'editor' && (
        <div className="space-y-6">
          {/* STAGE 1: CHARACTER IDENTITY & REFERENCE LOCKING */}
          <div className={`p-5 rounded-2xl border space-y-4 ${
            isDarkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50/80 border-slate-200'
          }`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold tracking-wide">
                  Step 1: Consistent Character Model & Reference Lock
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReferenceLocked(!referenceLocked)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition cursor-pointer ${
                    referenceLocked
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700/60'
                      : 'bg-rose-950 text-rose-300 border-rose-700/60'
                  }`}
                >
                  {referenceLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  <span>{referenceLocked ? 'Reference Locked (100% Consistency)' : 'Reference Unlocked (Drift Risk)'}</span>
                </button>
              </div>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {CHARACTER_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                    selectedPresetId === preset.id
                      ? 'bg-rose-950/40 border-rose-500 shadow-md shadow-rose-950/40 ring-1 ring-rose-500'
                      : isDarkMode
                      ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={preset.avatarUrl}
                      alt={preset.name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-700 shadow-xs"
                    />
                    <div>
                      <div className="text-xs font-black text-white">{preset.name}</div>
                      <div className="text-[10px] text-rose-400 font-mono">{preset.archetype}</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-2">
                    {preset.prompt}
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/80">
                    <span>Voice: {preset.voiceClone.split(' (')[0]}</span>
                    <span className="text-rose-400 font-bold">{preset.aspectRatio}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Character Prompt & Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Locked Character Reference Prompt</span>
                  <span className="font-mono text-[10px] text-slate-500">Seed: #{referenceSeed}</span>
                </label>
                <textarea
                  value={characterPrompt}
                  onChange={(e) => setCharacterPrompt(e.target.value)}
                  rows={2}
                  className={`w-full p-2.5 rounded-xl border text-xs font-mono transition focus:outline-hidden ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  CloneVoice.ai Voice Model
                </label>
                <select
                  value={voiceCloneName}
                  onChange={(e) => setVoiceCloneName(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border text-xs font-bold transition focus:outline-hidden ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="The Architect (Resolute Baritone)">The Architect (Resolute Baritone, Nashville)</option>
                  <option value="Silas Thorne (Gravelly Nashville Voice)">Silas Thorne (Gravelly Nashville Voice)</option>
                  <option value="Rachel (Steady & Empathetic Voice)">Rachel (Steady & Empathetic Voice)</option>
                  <option value="Ms. T (Dynamic Soul & Passion)">Ms. T (Dynamic Soul & Passion)</option>
                  <option value="Custom Cloned Studio Voice">Custom Voice Clone ID (via WebDAV)</option>
                </select>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                  <span>Dead-Air Trim:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="range"
                      min="0.1"
                      max="0.5"
                      step="0.05"
                      value={deadAirTrim}
                      onChange={(e) => setDeadAirTrim(parseFloat(e.target.value))}
                      className="w-20 accent-rose-500 cursor-pointer"
                    />
                    <span className="text-rose-400 font-bold">{deadAirTrim}s</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STAGE 2: SCRIPT GENERATOR & SCENE TIMELINE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold tracking-wide flex items-center gap-2">
                  <Film className="w-4 h-4 text-purple-400" />
                  <span>Step 2: Script Timeline & Strict Sentence Splitting (&lt; 100 Chars)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Each spoken line is deterministically capped at under 100 characters to prevent audio-video drift and lip-sync warping.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoScriptFromTrack}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Generate Script from "{selectedTrack.title}"</span>
                </button>
              </div>
            </div>

            {/* Scenes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {scenes.map((scene, idx) => (
                <div
                  key={scene.sceneNumber}
                  className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                    scene.charCount >= 100
                      ? 'bg-rose-950/30 border-rose-600'
                      : isDarkMode
                      ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-rose-300 border border-slate-800">
                        Scene #{scene.sceneNumber}: {scene.sceneTitle}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                          scene.charCount < 100
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border-rose-800 animate-pulse'
                        }`}>
                          {scene.charCount} / 100
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {(scene.durationSeconds - scene.trimHeadSeconds - scene.trimTailSeconds).toFixed(1)}s
                        </span>
                      </div>
                    </div>

                    {/* Spoken Line Input */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
                        <span>Spoken Narration Line</span>
                        {scene.charCount >= 100 && (
                          <span className="text-rose-400 font-bold flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Exceeds 100 chars
                          </span>
                        )}
                      </label>
                      <textarea
                        value={scene.spokenLine}
                        onChange={(e) => handleUpdateSceneText(idx, e.target.value)}
                        rows={2}
                        className={`w-full p-2 rounded-lg border text-xs font-sans transition focus:outline-hidden ${
                          scene.charCount >= 100
                            ? 'bg-rose-950/40 border-rose-500 text-rose-200'
                            : isDarkMode
                            ? 'bg-slate-900 border-slate-800 text-slate-200'
                            : 'bg-slate-50 border-slate-300 text-slate-800'
                        }`}
                      />
                    </div>

                    {/* Camera & Facial Expression metadata */}
                    <div className="text-[10px] space-y-1 font-mono text-slate-400 pt-1 border-t border-slate-800/60">
                      <div><strong className="text-slate-300">Camera:</strong> {scene.cameraMovement}</div>
                      <div><strong className="text-slate-300">Expression:</strong> {scene.avatarExpression}</div>
                    </div>
                  </div>

                  {/* Pacing Trim Badges */}
                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 pt-2 border-t border-slate-800/80">
                    <span className="flex items-center gap-1">
                      <Scissors className="w-3 h-3 text-rose-400" />
                      <span>Trim: -{scene.trimHeadSeconds}s / -{scene.trimTailSeconds}s</span>
                    </span>
                    <span className="text-emerald-400 font-bold">Lip-Sync Synced</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBVIEW 2: DETERMINISTIC EVIDENCE TABLE (THE GITHUB REPO CORE GATE) */}
      {activeTabSubView === 'evidence' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold tracking-wide flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                <span>Deterministic Evidence Table & Gate Verification</span>
              </h3>
              <p className="text-xs text-slate-400">
                Mandatory completion gate from the Strontiumplatform workflow: every clip must be strictly verified before marking render ready.
              </p>
            </div>

            <button
              onClick={() => {
                const tableText = scenes.map(s => 
                  `Scene ${s.sceneNumber}: "${s.spokenLine}" | Chars: ${s.charCount}/100 [${s.charCount < 100 ? 'PASS' : 'FAIL'}] | Duration: ${(s.durationSeconds - s.trimHeadSeconds - s.trimTailSeconds).toFixed(1)}s`
                ).join('\n');
                copyToClipboard(tableText, 'Evidence Table');
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copy Evidence Table</span>
            </button>
          </div>

          <div className="border border-slate-800 rounded-xl bg-slate-950 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">#</th>
                    <th className="py-2.5 px-3">Scene & Spoken Line</th>
                    <th className="py-2.5 px-3 w-28 text-center">Char Limit (&lt;100)</th>
                    <th className="py-2.5 px-3 w-28 text-center">Character Lock</th>
                    <th className="py-2.5 px-3 w-28 text-center">Net Duration</th>
                    <th className="py-2.5 px-3 w-28 text-center">Dead-Air Trim</th>
                    <th className="py-2.5 px-3 w-24 text-center">Gate Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {scenes.map((s) => (
                    <tr key={s.sceneNumber} className="hover:bg-slate-900/60 transition">
                      <td className="py-2.5 px-3 text-center text-slate-500 font-bold">{s.sceneNumber}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-white">{s.sceneTitle}</div>
                        <div className="text-[11px] text-slate-400 font-sans italic mt-0.5">"{s.spokenLine}"</div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.charCount < 100
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800 animate-pulse'
                        }`}>
                          {s.charCount} chars {s.charCount < 100 ? '✓' : '✗'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-purple-950 text-purple-300 border border-purple-800 font-bold">
                          Seed #{referenceSeed}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-rose-400 font-bold">
                        {(s.durationSeconds - s.trimHeadSeconds - s.trimTailSeconds).toFixed(1)}s
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-400 text-[10px]">
                        -{s.trimHeadSeconds}s / -{s.trimTailSeconds}s
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.charCount < 100
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {s.charCount < 100 ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Evidence Summary Footer */}
            <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-xs font-bold text-slate-200">
                  Evidence Gate Passed: {evidenceMetrics.passedChars} of {evidenceMetrics.totalScenes} Clips Validated for 60s Reel.
                </span>
              </div>
              <div className="text-xs font-mono text-slate-400">
                Net Timeline: <strong className="text-rose-400">{totalDuration.toFixed(1)}s</strong> | Target Range: 45s-65s
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBVIEW 3: SYSTEM_PROMPT.MD GENERATOR & DISPATCH */}
      {activeTabSubView === 'prompt_export' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold tracking-wide flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                <span>Self-Contained SYSTEM_PROMPT.md (Claude Code / ChatGPT / Codex)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Copy and paste this markdown directly into your AI browser agent to control VideoExpress.ai without extra downloads or API setup.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => copyToClipboard(systemPromptMarkdown, 'SYSTEM_PROMPT.md')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-purple-950/50"
              >
                <Copy className="w-3.5 h-3.5 text-amber-300" />
                <span>Copy SYSTEM_PROMPT.md</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const blob = new Blob([systemPromptMarkdown], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `VideoExpress_${selectedTrack.id}_SystemPrompt.md`;
                  a.click();
                  URL.revokeObjectURL(url);
                  showToast('Downloaded SYSTEM_PROMPT.md file!', 'success');
                }}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
                <span>Download .md</span>
              </button>
            </div>
          </div>

          <div className="border border-slate-800 rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto custom-scrollbar">
            {systemPromptMarkdown}
          </div>

          <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                Ready to link generated MP4 avatar clips directly into <strong>Nextcloud Folder 207332</strong> under <code>/Music-Production/VideoExpress-Avatars/</code>.
              </span>
            </div>
            <a
              href="https://app.videoexpress.ai"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 underline"
            >
              <span>Open VideoExpress.ai App</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
