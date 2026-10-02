import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FileText,
  Copy,
  GitBranch,
  Sparkles,
  Zap,
  Sliders,
  AlertCircle,
  CheckCircle,
  SlidersHorizontal,
  RefreshCw,
  Heart,
  Flame,
  Check,
  Upload,
  Download,
  FileUp,
  HardDrive,
  Save,
  Clock,
  ShieldCheck,
  Search,
  Eye,
  Trash2,
  History,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  BookmarkCheck,
  ArrowRight,
  RotateCcw,
  Columns,
  Maximize2,
  ExternalLink,
  Layers,
  HelpCircle,
  Info,
  Settings,
  Grid,
  Trophy,
  Code,
  Edit3,
  FolderEdit,
  Disc,
  Tag,
  Undo2,
  Music
} from 'lucide-react';
import { Track, AuditFeedbackRecord, TrackVersion, SOPRulesPackage, SoundPreset, TrackTitleChangeHistoryRecord } from '../types';
import { EP_COLLECTIONS } from '../data/canonicalCatalog';
import { getLocalCachedSOPRules, saveSOPRulesToCloud, loadSOPRulesFromCloud } from '../lib/sopRulesStore';
import { SOPRulesEditorModal } from './SOPRulesEditorModal';
import { SoundPresetLibraryModal } from './SoundPresetLibraryModal';
import { SUNO_USERSCRIPT_CODE } from '../data/automationUserscripts';
import { loadPresetsFromFirestore, subscribeToFirestorePresets, getLocalCachedPresets, isFirebaseConfigured } from '../lib/firebase';
import { getNextVersionString } from '../utils/versioning';
import { SectionQuickHelpBanner } from './SectionQuickHelpBanner';

interface LyricsAndSunoTabProps {
  track: Track;
  onUpdateTrack: (field: string, value: any) => void;
  onCopyText: (text: string, label: string) => void;
  onOpenSectionGuide?: (sectionId?: any) => void;
  onNavigateToTab?: (tab: string) => void;
  isDarkMode?: boolean;
}

export const LyricsAndSunoTab: React.FC<LyricsAndSunoTabProps> = ({
  track,
  onUpdateTrack,
  onCopyText,
  onOpenSectionGuide,
  onNavigateToTab,
  isDarkMode = true,
}) => {
  // Multi-pane comparison layout state (up to 3 panes side-by-side)
  const [paneCount, setPaneCount] = useState<1 | 2 | 3>(1);
  const [selectedVerAIndex, setSelectedVerAIndex] = useState<number>(() =>
    track.versions.length > 1 ? track.versions.length - 2 : 0
  );
  const [selectedVerBIndex, setSelectedVerBIndex] = useState<number>(() =>
    track.versions.length > 2 ? track.versions.length - 3 : 0
  );
  const [highlightDiff, setHighlightDiff] = useState<boolean>(true);
  const [syncScroll, setSyncScroll] = useState<boolean>(true);

  // Pane scroll refs for synchronized scrolling
  const pane1Ref = useRef<HTMLTextAreaElement | null>(null);
  const pane2Ref = useRef<HTMLDivElement | null>(null);
  const pane3Ref = useRef<HTMLDivElement | null>(null);

  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<string | null>(null);
  const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);
  const [auditModel, setAuditModel] = useState<'gemini-3.1-pro-preview' | 'gemini-3.8-flash'>('gemini-3.8-flash');
  const [copiedBlock, setCopiedBlock] = useState<number | null>(null);
  const [isFeedbackCopied, setIsFeedbackCopied] = useState(false);

  // Automated Re-write & Dual-Version Commitment Pipeline
  const [isApplyingChanges, setIsApplyingChanges] = useState(false);
  const [applyStageMessage, setApplyStageMessage] = useState<string | null>(null);
  const [successCommitNotification, setSuccessCommitNotification] = useState<{
    message: string;
    preVer: string;
    postVer: string;
  } | null>(null);
  const [errorNotification, setErrorNotification] = useState<string | null>(null);

  // Stored Feedback History & Review Vault State
  const [showFeedbackVault, setShowFeedbackVault] = useState(false);
  const [expandedFeedbackId, setExpandedFeedbackId] = useState<string | null>(null);

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importedText, setImportedText] = useState('');
  const [autoTagLyrics, setAutoTagLyrics] = useState(true);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');

  // Save Checkpoint Modal State
  const [isCheckpointModalOpen, setIsCheckpointModalOpen] = useState(false);
  const [checkpointReason, setCheckpointReason] = useState('');
  const [lastSavedTime, setLastSavedTime] = useState<string>('Just now');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  // Diff comparison modal
  const [comparingVersion, setComparingVersion] = useState<any | null>(null);

  // Explanation Modal for Suno 4-Block Reactive Compiler
  const [showCompilerExplainer, setShowCompilerExplainer] = useState(false);
  const [showSunoUserscriptModal, setShowSunoUserscriptModal] = useState(false);
  const [copiedSunoUserscript, setCopiedSunoUserscript] = useState(false);

  // Nashville SOP Rules Manager State (Direct Markdown & Text Editing)
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [sopRules, setSopRules] = useState<SOPRulesPackage>(() => getLocalCachedSOPRules());

  // Song & Project Title Versioning & Renaming System
  const [isEditingIdentity, setIsEditingIdentity] = useState(false);
  const [editTitleInput, setEditTitleInput] = useState(track.title);
  const [editEpInput, setEditEpInput] = useState(track.ep);
  const [editReasonInput, setEditReasonInput] = useState('');
  const [isTitleHistoryModalOpen, setIsTitleHistoryModalOpen] = useState(false);
  const [titleUpdateSuccess, setTitleUpdateSuccess] = useState<string | null>(null);

  useEffect(() => {
    setEditTitleInput(track.title);
    setEditEpInput(track.ep);
  }, [track.id, track.title, track.ep]);

  const handleSaveIdentity = () => {
    const cleanTitle = editTitleInput.trim();
    const cleanEp = editEpInput.trim();
    if (!cleanTitle) return;

    if (cleanTitle === track.title && cleanEp === track.ep) {
      setIsEditingIdentity(false);
      return;
    }

    const newRecord: TrackTitleChangeHistoryRecord = {
      id: `title-hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      trackId: track.id,
      previousTitle: track.title,
      newTitle: cleanTitle,
      previousEp: track.ep,
      newEp: cleanEp,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      author: 'Studio Producer',
      reason: editReasonInput.trim() || 'Renamed in Lyric Master Vault'
    };

    const updatedHistory = [newRecord, ...(track.titleHistory || [])];
    onUpdateTrack('batch_update', {
      title: cleanTitle,
      ep: cleanEp,
      titleHistory: updatedHistory
    });

    setTitleUpdateSuccess(`Song updated to "${cleanTitle}" [${cleanEp}] with revision history saved.`);
    setIsEditingIdentity(false);
    setEditReasonInput('');
    setTimeout(() => setTitleUpdateSuccess(null), 5000);
  };

  const handleRevertIdentity = (item: TrackTitleChangeHistoryRecord) => {
    const revertRecord: TrackTitleChangeHistoryRecord = {
      id: `title-hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      trackId: track.id,
      previousTitle: track.title,
      newTitle: item.previousTitle,
      previousEp: track.ep,
      newEp: item.previousEp,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      author: 'Studio Producer',
      reason: `Reverted to "${item.previousTitle}" (${item.previousEp}) from checkpoint on ${item.timestamp}`
    };

    const updatedHistory = [revertRecord, ...(track.titleHistory || [])];
    onUpdateTrack('batch_update', {
      title: item.previousTitle,
      ep: item.previousEp,
      titleHistory: updatedHistory
    });

    setTitleUpdateSuccess(`Reverted song title to "${item.previousTitle}" and project to "${item.previousEp}".`);
    setIsTitleHistoryModalOpen(false);
    setTimeout(() => setTitleUpdateSuccess(null), 5000);
  };

  // Lyric Word & Tag Search State
  const [searchWord, setSearchWord] = useState('');
  const [replaceWord, setReplaceWord] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [searchStatusMsg, setSearchStatusMsg] = useState<string | null>(null);

  // Compute all match positions
  const lyricMatches = useMemo(() => {
    if (!searchWord.trim() || !track.lyrics) return [];
    try {
      const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = wholeWord ? `\\b${escapeRegex(searchWord)}\\b` : escapeRegex(searchWord);
      const flags = caseSensitive ? 'g' : 'gi';
      const regex = new RegExp(pattern, flags);
      const matches: { index: number; length: number; text: string; line: number }[] = [];
      let match: RegExpExecArray | null;

      while ((match = regex.exec(track.lyrics)) !== null) {
        const textBefore = track.lyrics.substring(0, match.index);
        const line = textBefore.split('\n').length;
        matches.push({
          index: match.index,
          length: match[0].length,
          text: match[0],
          line
        });
      }
      return matches;
    } catch {
      return [];
    }
  }, [searchWord, track.lyrics, caseSensitive, wholeWord]);

  // Jump to specific match in textarea
  const jumpToMatch = (idx: number) => {
    if (!lyricMatches.length) return;
    const targetIdx = ((idx % lyricMatches.length) + lyricMatches.length) % lyricMatches.length;
    setActiveMatchIndex(targetIdx);
    const m = lyricMatches[targetIdx];
    if (pane1Ref.current && m) {
      pane1Ref.current.focus();
      pane1Ref.current.setSelectionRange(m.index, m.index + m.length);
      const totalLines = (track.lyrics || '').split('\n').length || 1;
      const lineHeight = pane1Ref.current.scrollHeight / totalLines;
      pane1Ref.current.scrollTop = Math.max(0, (m.line - 3) * lineHeight);
    }
  };

  const handleNextMatch = () => {
    jumpToMatch(activeMatchIndex + 1);
  };

  const handlePrevMatch = () => {
    jumpToMatch(activeMatchIndex - 1);
  };

  const handleReplaceCurrent = () => {
    if (!lyricMatches.length || !searchWord.trim()) return;
    const m = lyricMatches[activeMatchIndex] || lyricMatches[0];
    if (!m) return;
    const newLyrics = track.lyrics.substring(0, m.index) + replaceWord + track.lyrics.substring(m.index + m.length);
    onUpdateTrack('lyrics', newLyrics);
    setSearchStatusMsg(`Replaced 1 occurrence of "${m.text}" with "${replaceWord}"`);
    setTimeout(() => setSearchStatusMsg(null), 3000);
  };

  const handleReplaceAll = () => {
    if (!lyricMatches.length || !searchWord.trim()) return;
    const count = lyricMatches.length;
    const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = wholeWord ? `\\b${escapeRegex(searchWord)}\\b` : escapeRegex(searchWord);
    const flags = caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(pattern, flags);
    const newLyrics = track.lyrics.replace(regex, replaceWord);
    onUpdateTrack('lyrics', newLyrics);
    setSearchStatusMsg(`Replaced all ${count} occurrences with "${replaceWord}"`);
    setTimeout(() => setSearchStatusMsg(null), 3500);
  };

  // Cross-version search count
  const matchingVersionsCount = useMemo(() => {
    if (!searchWord.trim()) return 0;
    const term = searchWord.toLowerCase();
    return track.versions.filter(v => v.lyrics && v.lyrics.toLowerCase().includes(term)).length;
  }, [searchWord, track.versions]);

  // Sound Preset Library State (4-Block Engine Configurations)
  const [isPresetLibraryOpen, setIsPresetLibraryOpen] = useState(false);
  const [presets, setPresets] = useState<SoundPreset[]>(() => getLocalCachedPresets());
  const [activePresetName, setActivePresetName] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    loadPresetsFromFirestore().then((loaded) => {
      if (loaded && loaded.length > 0) setPresets(loaded);
    });
    const unsub = subscribeToFirestorePresets((updated) => {
      if (updated && updated.length > 0) setPresets(updated);
    });
    if (unsub) unsubscribe = unsub;
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleApplyPreset = (
    preset: SoundPreset,
    options?: { applyVocalCast?: boolean; applyBpm?: boolean; applyKey?: boolean }
  ) => {
    onUpdateTrack('sunoPrompt', preset.sunoPrompt);
    onUpdateTrack('negativePrompt', preset.negativePrompt);
    onUpdateTrack('engineSliders', preset.engineSliders);
    if (options?.applyVocalCast && preset.vocalCast) {
      onUpdateTrack('vocalCast', preset.vocalCast);
    }
    if (options?.applyBpm && preset.targetBpm) {
      onUpdateTrack('bpm', preset.targetBpm);
    }
    if (options?.applyKey && preset.targetKey) {
      onUpdateTrack('key', preset.targetKey);
    }
    setActivePresetName(preset.name);
  };

  useEffect(() => {
    loadSOPRulesFromCloud().then((loaded) => {
      if (loaded) setSopRules(loaded);
    });
  }, []);

  // Synchronize feedback history from track or localStorage on track selection
  useEffect(() => {
    if (!track.auditHistory || track.auditHistory.length === 0) {
      try {
        const saved = localStorage.getItem(`brickos_audit_${track.id}`);
        if (saved) {
          const parsed: AuditFeedbackRecord[] = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            onUpdateTrack('auditHistory', parsed);
            if (!auditResult) {
              setAuditResult(parsed[0].feedback);
              setActiveFeedbackId(parsed[0].id);
            }
          }
        }
      } catch (_) {}
    } else if (track.auditHistory && track.auditHistory.length > 0 && !auditResult) {
      setAuditResult(track.auditHistory[0].feedback);
      setActiveFeedbackId(track.auditHistory[0].id);
    }
  }, [track.id]);

  // Adjust default version indices when track changes
  useEffect(() => {
    if (track.versions.length > 1) {
      setSelectedVerAIndex(track.versions.length - 2);
    } else {
      setSelectedVerAIndex(0);
    }
    if (track.versions.length > 2) {
      setSelectedVerBIndex(track.versions.length - 3);
    } else {
      setSelectedVerBIndex(0);
    }
  }, [track.id, track.versions.length]);

  // Direct Paste from Clipboard helper
  const handlePasteToLyrics = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        onUpdateTrack('lyrics', text);
      } else {
        setIsImportModalOpen(true);
      }
    } catch {
      setIsImportModalOpen(true);
    }
  };

  const handleInsertTag = (tag: string) => {
    const newLyrics = track.lyrics ? `${track.lyrics}\n\n${tag}\n` : `${tag}\n`;
    onUpdateTrack('lyrics', newLyrics);
  };

  // Local storage auto-sync on change
  useEffect(() => {
    try {
      localStorage.setItem(`brickos_lyrics_${track.id}`, track.lyrics);
      setLastSavedTime(new Date().toLocaleTimeString());
      setSaveStatus('saved');
    } catch (_) {}
  }, [track.lyrics, track.id]);

  // Scroll sync handler across panes
  const handleScroll = (source: 'pane1' | 'pane2' | 'pane3') => {
    if (!syncScroll) return;
    if (source === 'pane1' && pane1Ref.current) {
      const percentage = pane1Ref.current.scrollTop / (pane1Ref.current.scrollHeight - pane1Ref.current.clientHeight || 1);
      if (pane2Ref.current) {
        pane2Ref.current.scrollTop = percentage * (pane2Ref.current.scrollHeight - pane2Ref.current.clientHeight);
      }
      if (pane3Ref.current) {
        pane3Ref.current.scrollTop = percentage * (pane3Ref.current.scrollHeight - pane3Ref.current.clientHeight);
      }
    } else if (source === 'pane2' && pane2Ref.current) {
      const percentage = pane2Ref.current.scrollTop / (pane2Ref.current.scrollHeight - pane2Ref.current.clientHeight || 1);
      if (pane1Ref.current) {
        pane1Ref.current.scrollTop = percentage * (pane1Ref.current.scrollHeight - pane1Ref.current.clientHeight);
      }
      if (pane3Ref.current) {
        pane3Ref.current.scrollTop = percentage * (pane3Ref.current.scrollHeight - pane3Ref.current.clientHeight);
      }
    } else if (source === 'pane3' && pane3Ref.current) {
      const percentage = pane3Ref.current.scrollTop / (pane3Ref.current.scrollHeight - pane3Ref.current.clientHeight || 1);
      if (pane1Ref.current) {
        pane1Ref.current.scrollTop = percentage * (pane1Ref.current.scrollHeight - pane1Ref.current.clientHeight);
      }
      if (pane2Ref.current) {
        pane2Ref.current.scrollTop = percentage * (pane2Ref.current.scrollHeight - pane2Ref.current.clientHeight);
      }
    }
  };

  // Generate Suno Block 1 (Lyrics & Meta-tags) - REACTIVELY COMPILED
  const block1Lyrics = `[Vocal Archetype: ${track.vocalCast || track.vocal}]\n${track.lyrics}`;

  // Generate Suno Block 2 (Style) - REACTIVELY COMPILED
  const block2Style = `${track.genre}, ${track.bpm} BPM, Key of ${track.key}, ${track.sunoPrompt}`;

  // Generate Suno Block 3 (Excluded Styles / Artifact Killer)
  const block3Excluded =
    track.negativePrompt ||
    'sibilance, high-frequency hiss, piercing treble, digital artifacts, muddy bass, muffled vocals, lo-fi, autotune, MIDI strings, electronic synths, heavy reverb, wash, stadium echo, screaming, shouting, long atmospheric gaps';

  // Generate Suno Block 4 (Engine Sliders)
  const block4Sliders = `Weirdness: ${track.engineSliders?.weirdness ?? 12} | Style Influence: ${
    track.engineSliders?.styleInfluence ?? 65
  } | Voice/Audio: ${track.engineSliders?.voiceAudio ?? 100}`;

  // Copy entire 4-block formatted bundle
  const handleCopyAllBlocks = () => {
    const bundle = `=== BLOCK 1: LYRICS & META-TAGS ===\n${block1Lyrics}\n\n=== BLOCK 2: STYLE ===\n${block2Style}\n\n=== BLOCK 3: EXCLUDED STYLES (ARTIFACT KILLER) ===\n${block3Excluded}\n\n=== BLOCK 4: ENGINE SLIDERS ===\n${block4Sliders}`;
    onCopyText(bundle, 'Suno v5.5 4-Block Generation Bundle');
  };

  // Run Gemini Lyrical & Theological Audit and store in review archive
  const handleRunAudit = async () => {
    if (!track.lyrics || !track.lyrics.trim()) {
      setAuditResult('Please paste or write lyrics first before running the theological audit.');
      return;
    }
    setIsAuditing(true);
    setAuditResult(null);
    setSuccessCommitNotification(null);
    try {
      const res = await fetch('/api/gemini/audit-lyric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: track.title,
          trackTitle: track.title,
          genre: track.genre,
          bpm: track.bpm,
          thesis: track.thesis,
          lyrics: track.lyrics,
          vocal: track.vocalCast || track.vocal,
          vocalCast: track.vocalCast || track.vocal,
          ep: track.ep,
          model: auditModel
        })
      });
      const data = await res.json();
      const feedbackText = data.audit || 'Audit complete: Lyrics pass Nashville SOP v1.9 standards.';
      setAuditResult(feedbackText);

      // Storing feedback for review later in the Review Vault
      const newRecord: AuditFeedbackRecord = {
        id: `fb-${Date.now()}`,
        timestamp:
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
          ', ' +
          new Date().toLocaleDateString(),
        model: auditModel === 'gemini-3.1-pro-preview' ? 'Gemini 3.1 Pro' : 'Gemini 3.8 Flash',
        feedback: feedbackText,
        status: 'pending'
      };

      const updatedHistory = [newRecord, ...(track.auditHistory || [])];
      onUpdateTrack('auditHistory', updatedHistory);
      setActiveFeedbackId(newRecord.id);

      try {
        localStorage.setItem(`brickos_audit_${track.id}`, JSON.stringify(updatedHistory));
      } catch (_) {}
    } catch (err: any) {
      setAuditResult(`[Audit Error] ${err.message || 'Unable to connect to Gemini API. Check network.'}`);
    } finally {
      setIsAuditing(false);
    }
  };

  // Quick Copy button for audit feedback
  const handleCopyFeedbackText = (textToCopy?: string) => {
    const text = textToCopy || auditResult;
    if (!text) return;
    onCopyText(text, 'Gemini Audit Feedback');
    setIsFeedbackCopied(true);
    setTimeout(() => setIsFeedbackCopied(false), 2500);
  };

  // Automated Apply Feedback Changes workflow
  const handleApplyFeedbackChanges = async (targetFeedback?: AuditFeedbackRecord) => {
    const feedbackText = targetFeedback ? targetFeedback.feedback : auditResult;
    if (!feedbackText || !track.lyrics.trim() || isApplyingChanges) return;

    setIsApplyingChanges(true);
    setSuccessCommitNotification(null);

    try {
      // Step 1: Pre-snapshot (+0.1 increment)
      const preVersionLabel = getNextVersionString(track.versions, 'Pre-AI Snapshot');
      setApplyStageMessage(`Step 1/3: Instant version ${preVersionLabel} committed before changes...`);

      onUpdateTrack('version_commit', {
        version: preVersionLabel,
        reason: 'Pre-Gemini Revision snapshot before applying audit critique',
        lyrics: track.lyrics,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
      });

      await new Promise((r) => setTimeout(r, 600));

      // Step 2: Gemini rewrites
      setApplyStageMessage('Step 2/3: Gemini is rewriting lyrics live to resolve all audit directives...');

      const res = await fetch('/api/gemini/rewrite-lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: track.title,
          genre: track.genre,
          bpm: track.bpm,
          thesis: track.thesis,
          lyrics: track.lyrics,
          vocal: track.vocalCast || track.vocal,
          ep: track.ep,
          auditFeedback: feedbackText,
          model: auditModel
        })
      });

      const data = await res.json();
      if (!data.rewrittenLyrics) {
        throw new Error(data.error || 'Gemini did not return rewritten lyrics');
      }

      const rewrittenLyrics = data.rewrittenLyrics;

      // Step 3: Screen update and Post-AI commit (+0.1 from the pre-snapshot)
      setApplyStageMessage('Step 3/3: Updating lyrics live & committing post-revision version...');
      onUpdateTrack('lyrics', rewrittenLyrics);

      const postVersionLabel = getNextVersionString([...track.versions, { version: preVersionLabel, timestamp: '', reason: '', lyrics: '' }], 'Post-AI Revision');

      const targetId = targetFeedback ? targetFeedback.id : activeFeedbackId;
      const updatedAuditHistory = (track.auditHistory || []).map((item) => {
        if (item.id === targetId || (item.feedback === feedbackText && item.status === 'pending')) {
          return {
            ...item,
            status: 'applied' as const,
            preRevisionVersion: preVersionLabel,
            postRevisionVersion: postVersionLabel
          };
        }
        return item;
      });

      onUpdateTrack('version_commit', {
        version: postVersionLabel,
        reason: `Applied Gemini audit revisions (${
          auditModel === 'gemini-3.1-pro-preview' ? 'Gemini 3.1 Pro' : 'Gemini 3.8 Flash'
        })`,
        lyrics: rewrittenLyrics,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        auditHistory: updatedAuditHistory
      });

      try {
        localStorage.setItem(`brickos_audit_${track.id}`, JSON.stringify(updatedAuditHistory));
      } catch (_) {}

      setSuccessCommitNotification({
        message: 'Revisions successfully applied and updated live on screen!',
        preVer: preVersionLabel,
        postVer: postVersionLabel
      });

      // Switch to 2 panes so user can see pre vs post side-by-side
      setPaneCount(2);
    } catch (err: any) {
      console.error('Failed to apply audit changes:', err);
      setErrorNotification(`Error applying Gemini revisions: ${err.message || 'Server error'}`);
    } finally {
      setIsApplyingChanges(false);
      setApplyStageMessage(null);
    }
  };

  // Import lyrics handler
  const handleProcessImport = () => {
    if (!importedText.trim()) return;

    let processed = importedText;
    if (autoTagLyrics) {
      if (!processed.includes('[Chorus]') && !processed.includes('[Verse')) {
        const paragraphs = processed.split(/\n\s*\n/);
        processed = paragraphs
          .map((p, i) => {
            if (i === 0) return `[Verse 1]\n${p}`;
            if (i === 1) return `[Chorus]\n${p}`;
            if (i === paragraphs.length - 1) return `[Outro]\n${p}`;
            if (i === paragraphs.length - 2) return `[Bridge]\n[The Throne Room Pivot]\n${p}`;
            return `[Verse ${i + 1}]\n${p}`;
          })
          .join('\n\n');
      }
    }

    const finalLyrics = importMode === 'replace' ? processed : `${track.lyrics}\n\n${processed}`;
    onUpdateTrack('lyrics', finalLyrics);
    setIsImportModalOpen(false);
    setImportedText('');
  };

  // File upload reader
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportedText(content);
      }
    };
    reader.readAsText(file);
  };

  // Download raw TXT
  const handleDownloadTxt = () => {
    const element = document.createElement('a');
    const file = new Blob([track.lyrics], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${track.title.replace(/\s+/g, '_')}_Lyrics.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Export full JSON song bundle
  const handleExportJson = () => {
    const songData = {
      title: track.title,
      id: track.id,
      ep: track.ep,
      bpm: track.bpm,
      key: track.key,
      genre: track.genre,
      vocal: track.vocalCast || track.vocal,
      thesis: track.thesis,
      lyrics: track.lyrics,
      sunoPrompt: track.sunoPrompt,
      negativePrompt: track.negativePrompt,
      engineSliders: track.engineSliders,
      versions: track.versions,
      auditHistory: track.auditHistory,
      exportedAt: new Date().toISOString()
    };
    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(songData, null, 2)], { type: 'application/json' });
    element.href = URL.createObjectURL(file);
    element.download = `${track.id}_${track.title.replace(/\s+/g, '_')}_MasterPackage.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Save manual Checkpoint (+0.1 increment)
  const handleSaveCheckpoint = () => {
    if (!checkpointReason.trim()) return;
    const newVersionLabel = getNextVersionString(track.versions);

    onUpdateTrack('version_commit', {
      version: newVersionLabel,
      reason: checkpointReason,
      lyrics: track.lyrics,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      bpm: track.bpm,
      genre: track.genre,
      vocal: track.vocalCast || track.vocal
    });

    setIsCheckpointModalOpen(false);
    setCheckpointReason('');
  };

  // Live Nashville SOP Audit triggers evaluated dynamically from active sopRules package
  const hasChorus = sopRules.requiredTags.every((tag) =>
    track.lyrics.toLowerCase().includes(tag.toLowerCase())
  );
  const hasThroneRoom = sopRules.throneRoomTriggers.some((trig) =>
    track.lyrics.toLowerCase().includes(trig.toLowerCase())
  );
  const linesCount = track.lyrics.split('\n').filter(Boolean).length;
  const wordCount = track.lyrics.split(/\s+/).filter(Boolean).length;

  // Cliché Filter check dynamically evaluated from active sopRules blacklist
  const foundCliches = sopRules.cliches.filter((c) =>
    track.lyrics.toLowerCase().includes(c.toLowerCase())
  );

  // Compute passing rules count
  const passingRulesCount =
    (hasChorus ? 1 : 0) + (hasThroneRoom ? 1 : 0) + (foundCliches.length === 0 ? 1 : 0) + 1; // 3:1 Sonic Scar baseline

  // Versions for comparative panes
  const versionA = track.versions[selectedVerAIndex] || track.versions[0];
  const versionB = track.versions[selectedVerBIndex] || track.versions[0];

  return (
    <div className="space-y-4">
      {/* SECTION QUICK HELP BANNER & SOP GUIDE */}
      <SectionQuickHelpBanner
        sectionId="lyrics"
        onOpenModalGuide={(sec) => onOpenSectionGuide?.(sec || 'lyrics')}
        isDarkMode={isDarkMode}
      />
      
      {/* STORAGE & SYNC STATUS HEADER BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-700/40 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Lyrics Master Vault</span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-700/50">
                ✓ LocalStorage & WebDAV Synced
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Last saved: <strong className="text-slate-200">{lastSavedTime}</strong> • Version:{' '}
              <strong className="text-indigo-400">
                {track.versions[track.versions.length - 1]?.version || 'v1.0'}
              </strong>
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsPresetLibraryOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 via-indigo-600 to-purple-600 hover:from-amber-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-950 transition cursor-pointer"
            title="Open Sound Preset Library (4-Block Engine Configurations)"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-300" />
            <span>Sound Presets ({presets.length})</span>
          </button>

          {onNavigateToTab && (
            <button
              type="button"
              onClick={() => onNavigateToTab('versions')}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-900/60 to-indigo-900/60 hover:from-amber-800/80 hover:to-indigo-800/80 text-amber-200 font-bold text-xs border border-amber-600/40 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Open Section Shootout (A/B/X) to compare choruses and verses across versions with LUFS loudness matching"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Section Shootout</span>
            </button>
          )}

          {onNavigateToTab && (
            <button
              type="button"
              onClick={() => onNavigateToTab('brainstorming')}
              className="px-3.5 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800/80 text-purple-200 font-bold text-xs border border-purple-700/50 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Open BlockSuite Infinite Whiteboard Canvas for visual brainstorming & arrangement"
            >
              <Grid className="w-3.5 h-3.5 text-purple-400" />
              <span>Open in Whiteboard</span>
            </button>
          )}

          {onOpenSectionGuide && (
            <button
              type="button"
              onClick={() => onOpenSectionGuide('lyrics')}
              className="px-3.5 py-2 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 font-bold text-xs border border-amber-700/50 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Open Lyric Engine & Nashville SOP Rules Guide"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>How To Use Lyrics & SOP</span>
            </button>
          )}

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-950 transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Lyrics</span>
          </button>

          <button
            onClick={() => setIsCheckpointModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-amber-400" />
            <span>Save Checkpoint</span>
          </button>

          <button
            onClick={handleDownloadTxt}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            title="Download formatted lyrics (.txt)"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">.TXT</span>
          </button>

          <button
            onClick={handleExportJson}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            title="Export complete song package (.json)"
          >
            <HardDrive className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Package</span>
          </button>

          {/* Jump to Suno Generator button */}
          <button
            onClick={() => {
              const el = document.getElementById('suno-4block-deck');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer"
            title="Jump to Suno 4-Block Generation Engine below"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>⚡ Suno 4-Blocks</span>
          </button>
        </div>
      </div>

      {/* SONG & PROJECT TITLE IDENTITY & VERSIONING SYSTEM */}
      <div className={`p-4 rounded-2xl border transition shadow-lg ${
        isDarkMode 
          ? 'bg-slate-900/90 border-slate-800 ring-1 ring-slate-800' 
          : 'bg-white border-slate-200 shadow-md'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Identity Info */}
          <div className="space-y-1 min-w-[240px]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/40">
                {track.id}
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                isDarkMode 
                  ? 'bg-cyan-950/60 border-cyan-700/40 text-cyan-300' 
                  : 'bg-cyan-50 border-cyan-200 text-cyan-800'
              }`}>
                <FolderEdit className="w-3 h-3 text-cyan-400" />
                <span>Project: {track.ep}</span>
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                isDarkMode 
                  ? 'bg-slate-950 border-slate-800 text-slate-400' 
                  : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}>
                {track.bpm} BPM • {track.key} • {track.genre}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              <Disc className="w-4 h-4 text-indigo-400 animate-spin-slow" />
              <h2 className={`text-lg font-black tracking-tight ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                {track.title}
              </h2>
            </div>
          </div>

          {/* Action Buttons: Rename & Title History */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditingIdentity(!isEditingIdentity)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                isEditingIdentity
                  ? 'bg-indigo-600 text-white shadow-indigo-900/50'
                  : isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
              }`}
              title="Change the song title or reassign EP project collection"
            >
              <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isEditingIdentity ? 'Close Title Editor' : 'Edit Song / Project Name'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsTitleHistoryModalOpen(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
              }`}
              title="Inspect change history for song & project names, and revert to previous titles"
            >
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>Title History ({track.titleHistory?.length || 0})</span>
            </button>
          </div>
        </div>

        {/* INLINE SONG & PROJECT TITLE EDITOR */}
        {isEditingIdentity && (
          <div className={`mt-3 pt-3 border-t space-y-3 animate-fadeIn ${
            isDarkMode ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Song Title (Nashville Sovereign Standard)
                </label>
                <input
                  type="text"
                  value={editTitleInput}
                  onChange={(e) => setEditTitleInput(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold border focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                    isDarkMode
                      ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                  placeholder="e.g. Crown of Thorns (Sovereign Mix)"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Project / EP Collection
                </label>
                <input
                  type="text"
                  value={editEpInput}
                  onChange={(e) => setEditEpInput(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-bold border focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                    isDarkMode
                      ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                  placeholder="e.g. EP 1: Restoration"
                />
                {/* Quick EP suggestions */}
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-mono">Quick Pick:</span>
                  {EP_COLLECTIONS.map((ep) => (
                    <button
                      key={ep.id}
                      type="button"
                      onClick={() => setEditEpInput(ep.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium border transition cursor-pointer ${
                        editEpInput === ep.id
                          ? 'bg-indigo-600 text-white border-indigo-500 font-bold'
                          : isDarkMode
                          ? 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      }`}
                    >
                      {ep.id}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                Reason for Title / Project Change (Tracked in Audit Versioning)
              </label>
              <input
                type="text"
                value={editReasonInput}
                onChange={(e) => setEditReasonInput(e.target.value)}
                className={`w-full px-3 py-1.5 rounded-xl text-xs border focus:outline-hidden focus:ring-2 focus:ring-indigo-500 ${
                  isDarkMode
                    ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
                placeholder="e.g. Nashville SOP compliance, radio edit renaming, or Suno v5.5 title refinement"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setEditTitleInput(track.title);
                  setEditEpInput(track.ep);
                  setIsEditingIdentity(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveIdentity}
                disabled={!editTitleInput.trim()}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-950 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save New Title & Project</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* TITLE & PROJECT UPDATE SUCCESS NOTIFICATION */}
      {titleUpdateSuccess && (
        <div className="bg-emerald-950/80 border border-emerald-600/50 rounded-2xl p-3 shadow-xl flex items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-300">{titleUpdateSuccess}</p>
              <p className="text-[10px] font-mono text-emerald-400/80">Persistent to Firestore & Nextcloud WebDAV metadata</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTitleUpdateSuccess(null)}
            className="p-1 rounded text-emerald-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* TITLE & PROJECT VERSION HISTORY MODAL */}
      {isTitleHistoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl flex flex-col max-h-[85vh] animate-scaleUp overflow-hidden ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className={`p-4 border-b flex items-center justify-between ${
              isDarkMode ? 'border-slate-800 bg-slate-950/80' : 'border-slate-100 bg-slate-50'
            }`}>
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Song & Project Title Version History
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400">
                    Track ID: {track.id} • Active: "{track.title}" ({track.ep})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTitleHistoryModalOpen(false)}
                className={`p-1.5 rounded-lg text-slate-400 hover:text-white transition cursor-pointer ${
                  isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-200'
                }`}
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 custom-scrollbar flex-1">
              {(!track.titleHistory || track.titleHistory.length === 0) ? (
                <div className={`p-8 text-center rounded-xl border ${
                  isDarkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <History className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    No Previous Title Changes Recorded
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-md mx-auto">
                    The current title "{track.title}" and project "{track.ep}" are the canonical initial values. Every time you rename this song or change its project collection, an immutable snapshot will be recorded here allowing one-click revert.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-[11px] font-mono text-slate-400">
                    Found {track.titleHistory.length} recorded title / project revision(s):
                  </div>

                  {track.titleHistory.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className={`p-3.5 rounded-xl border transition ${
                        isDarkMode
                          ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/40">
                            Snapshot #{track.titleHistory!.length - idx}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.timestamp}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRevertIdentity(item)}
                          className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                          title={`Revert title back to "${item.previousTitle}" and project back to "${item.previousEp}"`}
                        >
                          <Undo2 className="w-3 h-3" />
                          <span>Revert to Previous</span>
                        </button>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-mono text-[10px] w-14">Title:</span>
                          <span className="line-through text-rose-400/90 font-mono text-[11px]">{item.previousTitle}</span>
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          <span className="text-emerald-400 font-bold">{item.newTitle}</span>
                        </div>

                        {item.previousEp !== item.newEp && (
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 font-mono text-[10px] w-14">Project:</span>
                            <span className="line-through text-rose-400/90 font-mono text-[11px]">{item.previousEp}</span>
                            <ArrowRight className="w-3 h-3 text-slate-500" />
                            <span className="text-cyan-400 font-bold">{item.newEp}</span>
                          </div>
                        )}

                        {item.reason && (
                          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/60 flex items-start gap-1.5">
                            <span className="text-indigo-400 font-bold">Reason:</span>
                            <span>{item.reason}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={`p-3 border-t flex items-center justify-between ${
              isDarkMode ? 'border-slate-800 bg-slate-950/80' : 'border-slate-100 bg-slate-50'
            }`}>
              <span className="text-[10px] font-mono text-slate-500">
                Audit trail synced across local storage & cloud database
              </span>
              <button
                type="button"
                onClick={() => setIsTitleHistoryModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS NOTIFICATION BANNER */}
      {successCommitNotification && (
        <div className="bg-emerald-950/80 border border-emerald-600/50 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
              <CheckCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-300">{successCommitNotification.message}</h4>
              <p className="text-[11px] text-emerald-400/80 font-mono mt-0.5">
                Pre-change snapshot: <span className="text-white font-bold">{successCommitNotification.preVer}</span> •
                Post-change version: <span className="text-white font-bold">{successCommitNotification.postVer}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPaneCount(2)}
              className="px-3 py-1.5 rounded-lg bg-emerald-900/70 hover:bg-emerald-800 text-white text-[11px] font-bold border border-emerald-700/50 transition cursor-pointer"
            >
              Side-by-Side View
            </button>
            <button
              type="button"
              onClick={() => setSuccessCommitNotification(null)}
              className="p-1 rounded text-emerald-400 hover:text-white"
              title="Dismiss notification"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ERROR NOTIFICATION BANNER */}
      {errorNotification && (
        <div className="bg-rose-950/80 border border-rose-600/50 rounded-2xl p-4 shadow-xl flex items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-rose-300">Error Applying Revisions</h4>
              <p className="text-[11px] text-rose-400/80 font-mono mt-0.5">{errorNotification}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setErrorNotification(null)}
            className="p-1 rounded text-rose-400 hover:text-white"
            title="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULL-WIDTH LYRIC WORKBENCH & UP TO 3 PANES SIDE-BY-SIDE REVISION COMPARISON */}
      {/* ========================================================================= */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        
        {/* TOP TOOLBAR: PANE COUNT SELECTOR & WORKBENCH ACTIONS */}
        <div className="flex items-center justify-between gap-4 flex-wrap border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Full-Width Lyric Workbench
              </h3>
            </div>

            {/* PANE SWITCHER: 1 PANE, 2 PANES, 3 PANES */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
              <span className="text-[10px] text-slate-500 uppercase px-1.5 font-sans">Panes:</span>
              <button
                type="button"
                onClick={() => setPaneCount(1)}
                className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  paneCount === 1 ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Single Pane: Focused Active Lyric Draft"
              >
                <span>1 Pane</span>
              </button>

              <button
                type="button"
                onClick={() => setPaneCount(2)}
                className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  paneCount === 2 ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="2 Panes: Active Draft vs Revision A Side-by-Side"
              >
                <Columns className="w-3 h-3" />
                <span>2 Panes (A/B)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaneCount(3)}
                className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  paneCount === 3 ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="3 Panes: Active Draft vs Revision A vs Revision B Triple Compare"
              >
                <Columns className="w-3 h-3" />
                <span>3 Panes (Triple)</span>
              </button>
            </div>

            {paneCount > 1 && (
              <label className="flex items-center gap-1.5 text-[11px] text-slate-300 font-mono cursor-pointer ml-1">
                <input
                  type="checkbox"
                  checked={syncScroll}
                  onChange={(e) => setSyncScroll(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Sync Scroll</span>
              </label>
            )}
          </div>

          {/* Quick Actions & Copilot Trigger */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onCopyText(track.lyrics, `${track.title} Lyrics`)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center gap-1.5 transition cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              <span>Copy Raw</span>
            </button>

            <select
              value={auditModel}
              onChange={(e) => setAuditModel(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="gemini-3.8-flash">Gemini 3.8 Flash (Fast & Efficient)</option>
              <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Theological)</option>
            </select>

            <button
              onClick={handleRunAudit}
              disabled={isAuditing}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-50 transition cursor-pointer shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{isAuditing ? 'Auditing...' : 'Run Copilot Audit'}</span>
            </button>
          </div>
        </div>

        {/* NASHVILLE SOP v1.9 LIVE RULES & REAL-TIME QUALITY AUDIT BAR */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-white font-black tracking-wider">The Nashville SOP {sopRules.version} Live Rules</span>
              <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-mono text-[9px] border border-indigo-800/40">
                {passingRulesCount}/4 Standards Passing
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-indigo-400 font-mono text-[10px] hidden sm:inline">
                Real-time Quality Audit
              </span>
              <button
                type="button"
                onClick={() => setIsRulesModalOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1.5 shadow transition cursor-pointer"
                title="Edit SOP rules via Markdown, text editing, or file upload"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>⚙️ Edit Rules (Markdown / Text)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
            
            {/* 1. OBI Funnel Rule */}
            <div
              className={`p-2.5 rounded-xl border flex flex-col justify-between transition ${
                hasChorus
                  ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-700/50 text-rose-200'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <span className="font-bold text-[11px] flex items-center gap-1">
                  <CheckCircle className={`w-3.5 h-3.5 ${hasChorus ? 'text-emerald-400' : 'text-rose-400'}`} />
                  <span>OBI Chorus Funnel</span>
                </span>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${hasChorus ? 'bg-emerald-900/60 text-emerald-300' : 'bg-rose-900/60 text-rose-300'}`}>
                  {hasChorus ? 'DETECTED' : 'MISSING'}
                </span>
              </div>
              <p className="text-[10px] text-slate-300/80 mt-1">
                Trigger: Requires explicit <code className="text-white font-mono bg-black/40 px-1 rounded">[Chorus]</code> tag.
              </p>
              {!hasChorus && (
                <button
                  type="button"
                  onClick={() => handleInsertTag('[Chorus]')}
                  className="mt-2 text-[10px] font-bold text-rose-300 hover:text-white underline text-left cursor-pointer"
                >
                  + Insert [Chorus] Tag
                </button>
              )}
            </div>

            {/* 2. Throne Room Pivot Rule */}
            <div
              className={`p-2.5 rounded-xl border flex flex-col justify-between transition ${
                hasThroneRoom
                  ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-200'
                  : 'bg-amber-950/40 border-amber-700/50 text-amber-200'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <span className="font-bold text-[11px] flex items-center gap-1">
                  <Heart className={`w-3.5 h-3.5 ${hasThroneRoom ? 'text-emerald-400 fill-emerald-400' : 'text-amber-400'}`} />
                  <span>Throne Room Pivot</span>
                </span>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${hasThroneRoom ? 'bg-emerald-900/60 text-emerald-300' : 'bg-amber-900/60 text-amber-300'}`}>
                  {hasThroneRoom ? 'LIT UP' : 'PENDING'}
                </span>
              </div>
              <p className="text-[10px] text-slate-300/80 mt-1">
                Trigger: Scans for words <code className="text-white font-mono bg-black/40 px-1 rounded">throne room</code> or <code className="text-white font-mono bg-black/40 px-1 rounded">pivot</code> in bridge.
              </p>
              {!hasThroneRoom && (
                <button
                  type="button"
                  onClick={() => handleInsertTag('[Bridge]\n[The Throne Room Pivot]')}
                  className="mt-2 text-[10px] font-bold text-amber-300 hover:text-white underline text-left cursor-pointer"
                >
                  + Insert Throne Room Pivot
                </button>
              )}
            </div>

            {/* 3. Christianese Cliché Filter */}
            <div
              className={`p-2.5 rounded-xl border flex flex-col justify-between transition ${
                foundCliches.length === 0
                  ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-700/50 text-rose-200'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <span className="font-bold text-[11px] flex items-center gap-1">
                  <ShieldCheck className={`w-3.5 h-3.5 ${foundCliches.length === 0 ? 'text-emerald-400' : 'text-rose-400'}`} />
                  <span>Christianese Filter</span>
                </span>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${foundCliches.length === 0 ? 'bg-emerald-900/60 text-emerald-300' : 'bg-rose-900/60 text-rose-300'}`}>
                  {foundCliches.length === 0 ? 'CLEAN' : `${foundCliches.length} CLICHÉS`}
                </span>
              </div>
              <p className="text-[10px] text-slate-300/80 mt-1">
                Trigger: Blacklists phrases like <em>'fellowship'</em>, <em>'walk in victory'</em>, <em>'anointing fall'</em>.
              </p>
              {foundCliches.length > 0 && (
                <span className="mt-1 text-[10px] text-rose-300 font-mono truncate">
                  Found: {foundCliches.join(', ')}
                </span>
              )}
            </div>

            {/* 4. 3:1 Sonic Scar Rule */}
            <div className="p-2.5 rounded-xl border bg-slate-900 border-slate-800 text-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1.5">
                <span className="font-bold text-[11px] flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>3:1 Sonic Scar</span>
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  STANDARD
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Enforces 3 raw organic elements (acoustic, rough baritone, kick) to 1 synthetic element.
              </p>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* MULTI-PANE COMPARISON GRID: 1, 2, OR 3 PANES SIDE-BY-SIDE */}
        {/* ========================================================================= */}
        <div
          className={`grid gap-4 transition-all duration-200 ${
            paneCount === 1
              ? 'grid-cols-1'
              : paneCount === 2
              ? 'grid-cols-1 lg:grid-cols-2'
              : 'grid-cols-1 lg:grid-cols-3'
          }`}
        >
          {/* ========================================== */}
          {/* PANE 1: ACTIVE WORKING DRAFT (EDITABLE) */}
          {/* ========================================== */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 shadow-inner flex flex-col">
            
            {/* Pane 1 Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  Pane 1: Active Draft (Live)
                </span>
                <span className="font-mono text-[10px] text-indigo-400 bg-indigo-950 px-1.5 py-0.5 rounded border border-indigo-800/40">
                  {track.versions[track.versions.length - 1]?.version || 'v1.0'}
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                {linesCount} lines • {wordCount} words
              </div>
            </div>

            {/* INTERACTIVE LYRICS & WORD SEARCH TOOLBAR */}
            <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-2.5 space-y-2 shadow-inner">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                {/* Search Input & Match Navigation */}
                <div className="flex items-center gap-1.5 flex-1 min-w-[240px]">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchWord}
                      onChange={(e) => {
                        setSearchWord(e.target.value);
                        setActiveMatchIndex(0);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (e.shiftKey) handlePrevMatch();
                          else handleNextMatch();
                        }
                      }}
                      placeholder="Search lyrics, words, or [tags]..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-16 py-1.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500"
                    />
                    {searchWord && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          {lyricMatches.length > 0 ? `${activeMatchIndex + 1}/${lyricMatches.length}` : '0'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchWord('');
                            setActiveMatchIndex(0);
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
                      onClick={handlePrevMatch}
                      disabled={lyricMatches.length === 0}
                      className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-30 cursor-pointer transition"
                      title="Previous Match (Shift+Enter)"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextMatch}
                      disabled={lyricMatches.length === 0}
                      className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-30 cursor-pointer transition"
                      title="Next Match (Enter)"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Match Options: Case Sensitive & Whole Word */}
                  <button
                    type="button"
                    onClick={() => setCaseSensitive(!caseSensitive)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition border cursor-pointer ${
                      caseSensitive ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                    title="Toggle Case Sensitivity"
                  >
                    Aa
                  </button>
                  <button
                    type="button"
                    onClick={() => setWholeWord(!wholeWord)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition border cursor-pointer ${
                      wholeWord ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                    title="Match Whole Word Only"
                  >
                    \bW\b
                  </button>
                </div>

                {/* Find & Replace Toggle + Cross-Workflow Whiteboard Search */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowReplace(!showReplace)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition border cursor-pointer ${
                      showReplace ? 'bg-amber-600 text-slate-950 border-amber-400' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                    title="Toggle Find & Replace"
                  >
                    Replace
                  </button>

                  {onNavigateToTab && (
                    <button
                      type="button"
                      onClick={() => {
                        if (searchWord) localStorage.setItem('brickos_whiteboard_search_query', searchWord);
                        onNavigateToTab('whiteboard');
                      }}
                      className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-slate-950 hover:bg-slate-800 text-indigo-400 border border-slate-800 flex items-center gap-1 cursor-pointer transition"
                      title="Search for this word or lyrics on the BlockSuite Whiteboard canvas"
                    >
                      <Grid className="w-3 h-3" />
                      <span>In Whiteboard</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Expandable Replace Row */}
              {showReplace && (
                <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/80 animate-in slide-in-from-top-1 duration-150">
                  <input
                    type="text"
                    value={replaceWord}
                    onChange={(e) => setReplaceWord(e.target.value)}
                    placeholder="Replace with..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleReplaceCurrent}
                    disabled={lyricMatches.length === 0}
                    className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 text-[10px] font-bold font-mono transition disabled:opacity-40 cursor-pointer"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={handleReplaceAll}
                    disabled={lyricMatches.length === 0}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black font-mono transition disabled:opacity-40 cursor-pointer"
                  >
                    Replace All ({lyricMatches.length})
                  </button>
                </div>
              )}

              {/* Status / Feedback message */}
              {searchStatusMsg && (
                <div className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded border border-emerald-800/40">
                  ✓ {searchStatusMsg}
                </div>
              )}

              {/* Quick Jump Structural Tag Pills & Version Matches */}
              <div className="flex items-center justify-between gap-1 flex-wrap text-[10px] font-mono text-slate-400 pt-0.5">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-slate-500 text-[9px] uppercase">Jump To:</span>
                  {(['[Verse 1]', '[Chorus]', '[Bridge]', '[Hook]', '[Outro]'] as const).map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setSearchWord(tag);
                        setActiveMatchIndex(0);
                        setTimeout(() => jumpToMatch(0), 50);
                      }}
                      className="px-1.5 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 cursor-pointer transition"
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                {matchingVersionsCount > 0 && (
                  <span className="text-[10px] font-mono text-indigo-400">
                    Also in {matchingVersionsCount} saved version{matchingVersionsCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Quick section tag buttons */}
            <div className="flex items-center justify-between gap-1 flex-wrap text-[10px] font-mono bg-slate-900/60 p-1.5 rounded-lg border border-slate-800/60">
              <div className="flex items-center gap-1">
                <span className="text-slate-500 text-[9px] uppercase font-sans">Insert:</span>
                <button
                  type="button"
                  onClick={() => handleInsertTag('[Verse 1]')}
                  className="px-1.5 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800"
                >
                  +Verse
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTag('[Chorus]')}
                  className="px-1.5 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-indigo-300 hover:text-white border border-indigo-900/40"
                >
                  +Chorus
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTag('[Bridge]\n[The Throne Room Pivot]')}
                  className="px-1.5 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-amber-300 hover:text-white border border-amber-900/40"
                >
                  +Bridge
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertTag('[Outro]')}
                  className="px-1.5 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800"
                >
                  +Outro
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePasteToLyrics}
                  className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px]"
                >
                  Paste
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateTrack('lyrics', '')}
                  className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 text-[10px]"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Lyric Textarea */}
            <textarea
              ref={pane1Ref}
              onScroll={() => handleScroll('pane1')}
              rows={paneCount === 1 ? 16 : 20}
              value={track.lyrics}
              onChange={(e) => onUpdateTrack('lyrics', e.target.value)}
              className="w-full flex-1 bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-indigo-500 custom-scrollbar shadow-inner"
              placeholder="Write or paste lyrics with tags: [Verse 1], [Chorus], [Bridge], [Outro]..."
            />

            {/* Active Style Footnote */}
            <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800/80 space-y-1 text-[10px] text-slate-400 font-mono">
              <div className="flex items-center justify-between text-slate-300 font-bold">
                <span className="text-indigo-300">Active Style Parameters:</span>
                <span>{track.bpm} BPM • {track.key}</span>
              </div>
              <p className="truncate text-slate-400">{track.genre} • {track.vocalCast || track.vocal}</p>
            </div>
          </div>

          {/* ==================================================== */}
          {/* PANE 2: COMPARATIVE REVISION A (SIDE-BY-SIDE VIEW) */}
          {/* ==================================================== */}
          {paneCount >= 2 && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 shadow-inner flex flex-col">
              
              {/* Pane 2 Header with Version Selector */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                    Pane 2: Revision A
                  </span>
                  <select
                    value={selectedVerAIndex}
                    onChange={(e) => setSelectedVerAIndex(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-xs font-bold text-white focus:outline-none focus:border-amber-400 max-w-[150px] truncate"
                  >
                    {track.versions.map((ver, idx) => (
                      <option key={idx} value={idx}>
                        {ver.version} ({ver.timestamp?.split(' ')[0] || 'snapshot'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Actions for Version A */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateTrack('lyrics', versionA.lyrics);
                      onCopyText(versionA.lyrics, `Version ${versionA.version} restored to Active Draft`);
                    }}
                    className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 text-[10px] font-bold shadow-sm transition"
                    title="Restore Version A into Pane 1 Active Draft"
                  >
                    Restore
                  </button>
                  <button
                    type="button"
                    onClick={() => onCopyText(versionA.lyrics, `Version ${versionA.version} Lyrics`)}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="Copy Revision A"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Version Reason & Timestamp */}
              <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800 text-[10px] text-slate-400 flex items-center justify-between font-mono">
                <span className="truncate pr-2">{versionA.reason || 'Manual Checkpoint'}</span>
                <span className="text-slate-500 flex-shrink-0">{versionA.timestamp}</span>
              </div>

              {/* Readonly Monospace Viewer for Version A */}
              <div
                ref={pane2Ref}
                onScroll={() => handleScroll('pane2')}
                className="w-full flex-1 bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 font-mono leading-relaxed overflow-y-auto whitespace-pre-wrap custom-scrollbar"
                style={{ maxHeight: paneCount === 1 ? '400px' : '520px' }}
              >
                {versionA.lyrics || '(Empty revision lyrics)'}
              </div>

              {/* Version A Style Footnote */}
              <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800/80 space-y-1 text-[10px] text-slate-400 font-mono">
                <div className="flex items-center justify-between text-amber-300 font-bold">
                  <span>Revision A Target:</span>
                  <span>{versionA.version}</span>
                </div>
                {versionA.genre && (
                  <div className="text-[10px] text-indigo-300 font-sans font-bold flex items-center justify-between">
                    <span>{versionA.genre}</span>
                    {versionA.bpm && <span>{versionA.bpm} BPM</span>}
                  </div>
                )}
                {versionA.vocal && (
                  <div className="text-[10px] text-slate-400">
                    Vocal: <span className="text-slate-200">{versionA.vocal}</span>
                  </div>
                )}
                <p className="truncate text-slate-400">Lines: {versionA.lyrics.split('\n').filter(Boolean).length} • Words: {versionA.lyrics.split(/\s+/).filter(Boolean).length}</p>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* PANE 3: COMPARATIVE REVISION B / AI SUGGESTION */}
          {/* ======================================================== */}
          {paneCount >= 3 && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 shadow-inner flex flex-col">
              
              {/* Pane 3 Header with Version Selector */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-black text-purple-400 uppercase tracking-wider">
                    Pane 3: Revision B
                  </span>
                  <select
                    value={selectedVerBIndex}
                    onChange={(e) => setSelectedVerBIndex(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 text-xs font-bold text-white focus:outline-none focus:border-purple-400 max-w-[150px] truncate"
                  >
                    {track.versions.map((ver, idx) => (
                      <option key={idx} value={idx}>
                        {ver.version} ({ver.timestamp?.split(' ')[0] || 'snapshot'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Actions for Version B */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateTrack('lyrics', versionB.lyrics);
                      onCopyText(versionB.lyrics, `Version ${versionB.version} restored to Active Draft`);
                    }}
                    className="px-2 py-0.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold shadow-sm transition"
                    title="Restore Version B into Pane 1 Active Draft"
                  >
                    Restore
                  </button>
                  <button
                    type="button"
                    onClick={() => onCopyText(versionB.lyrics, `Version ${versionB.version} Lyrics`)}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="Copy Revision B"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Version Reason & Timestamp */}
              <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800 text-[10px] text-slate-400 flex items-center justify-between font-mono">
                <span className="truncate pr-2">{versionB.reason || 'Manual Checkpoint'}</span>
                <span className="text-slate-500 flex-shrink-0">{versionB.timestamp}</span>
              </div>

              {/* Readonly Monospace Viewer for Version B */}
              <div
                ref={pane3Ref}
                onScroll={() => handleScroll('pane3')}
                className="w-full flex-1 bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 font-mono leading-relaxed overflow-y-auto whitespace-pre-wrap custom-scrollbar"
                style={{ maxHeight: '520px' }}
              >
                {versionB.lyrics || '(Empty revision lyrics)'}
              </div>

              {/* Version B Style Footnote */}
              <div className="bg-slate-900/70 p-2.5 rounded-lg border border-slate-800/80 space-y-1 text-[10px] text-slate-400 font-mono">
                <div className="flex items-center justify-between text-purple-300 font-bold">
                  <span>Revision B Target:</span>
                  <span>{versionB.version}</span>
                </div>
                {versionB.genre && (
                  <div className="text-[10px] text-purple-300 font-sans font-bold flex items-center justify-between">
                    <span>{versionB.genre}</span>
                    {versionB.bpm && <span>{versionB.bpm} BPM</span>}
                  </div>
                )}
                {versionB.vocal && (
                  <div className="text-[10px] text-slate-400">
                    Vocal: <span className="text-slate-200">{versionB.vocal}</span>
                  </div>
                )}
                <p className="truncate text-slate-400">Lines: {versionB.lyrics.split('\n').filter(Boolean).length} • Words: {versionB.lyrics.split(/\s+/).filter(Boolean).length}</p>
              </div>

            </div>
          )}

        </div>

      </section>

      {/* ACTIVE AUDIT RESULT & ACTION CARD (IF ACTIVE) */}
      {auditResult && (
        <section className="bg-slate-900 border border-indigo-600/40 rounded-2xl p-5 space-y-4 shadow-2xl animate-fadeIn">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-700/60 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <span>brickOS Gemini Theological & Lyrical Audit</span>
                </h4>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                  <span className="font-mono text-indigo-300 font-semibold">{auditModel}</span>
                  <span>•</span>
                  {track.auditHistory?.find((a) => a.id === activeFeedbackId)?.status === 'applied' ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Changes Applied
                    </span>
                  ) : (
                    <span className="text-amber-400 font-bold">Review & Action Required</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFeedbackVault(!showFeedbackVault)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
              >
                <History className="w-3.5 h-3.5 text-purple-400" />
                <span>Review Vault ({(track.auditHistory || []).length})</span>
                {showFeedbackVault ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              <button
                type="button"
                onClick={() => setAuditResult(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-200 transition cursor-pointer"
                title="Close active feedback card"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 font-mono leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto custom-scrollbar shadow-inner">
            {auditResult}
          </div>

          {/* Action Row for Audit: Apply changes or Copy */}
          <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopyFeedbackText()}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                {isFeedbackCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-indigo-400" />}
                <span>{isFeedbackCopied ? 'Copied!' : 'Copy Audit Text'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleApplyFeedbackChanges()}
                disabled={isApplyingChanges}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition cursor-pointer disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isApplyingChanges ? 'Applying Revisions...' : 'Yes, I Agree — Apply Changes to Lyrics'}</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* ELEMENTS PREVIOUSLY ON RIGHT ARE NOW MOVED BELOW THE LYRICS WORKBENCH:   */}
      {/* SUNO v5.5 4-BLOCK GENERATION ENGINE, EXCLUDED STYLES & ENGINE SLIDERS    */}
      {/* ========================================================================= */}
      <section id="suno-4block-deck" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-2xl">
        
        {/* Header & Architecture Explanation */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4 gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                <Zap className="w-4 h-4 fill-amber-300" />
              </div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>Suno v5.5 4-Block Reactive Generation Engine</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/40 font-mono text-[10px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Reactive Compiler
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              <strong>How it works:</strong> This engine dynamically compiles your active lyrics, vocal cast archetype (<code className="text-indigo-300 font-mono">[{track.vocalCast || track.vocal}]</code>), musical styling, artifact exclusions, and engine sliders into the 4 Suno.com generation blocks in real time. It reacts instantly to your edits without requiring a slow re-run.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {activePresetName && (
              <div className="px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-700/60 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Active Preset: <strong>{activePresetName}</strong></span>
                <button
                  type="button"
                  onClick={() => setActivePresetName(null)}
                  className="ml-1 hover:text-white text-slate-400 text-xs"
                  title="Clear Preset Tag"
                >
                  ✕
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsPresetLibraryOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-950/40 transition cursor-pointer"
              title="Open Sound Preset Library for Suno 4-Block Engine"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-200" />
              <span>Sound Presets ({presets.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSunoUserscriptModal(true)}
              className="px-3.5 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-700/60 text-purple-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Get brickOS Suno 1-Click Auto-Fill Userscript"
            >
              <Code className="w-3.5 h-3.5 text-purple-400" />
              <span>1-Click Auto-Fill HUD</span>
            </button>

            <button
              type="button"
              onClick={handleCopyAllBlocks}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-950/40 transition cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy All 4-Blocks Bundle</span>
            </button>

            <a
              href="https://suno.com"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>Open Suno.com</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>
        </div>

        {/* Suno Userscript Modal */}
        {showSunoUserscriptModal && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowSunoUserscriptModal(false)}
          >
            <div
              className="w-full max-w-2xl bg-slate-900 border border-purple-500/40 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-100"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-purple-400" />
                  <h4 className="text-sm font-bold text-white">
                    brickOS Suno 1-Click Auto-Fill Userscript
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSunoUserscriptModal(false)}
                  className="text-slate-400 hover:text-white text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                This userscript runs directly inside <code className="text-indigo-400">suno.com</code> via Violentmonkey or Tampermonkey. It injects a floating HUD that reads your clipboard and automatically populates Lyrics, Style, Excluded Styles, and Title in 1 click!
              </p>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400 max-h-48 overflow-y-auto">
                {SUNO_USERSCRIPT_CODE.slice(0, 600)}...
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const blob = new Blob([SUNO_USERSCRIPT_CODE], { type: 'application/javascript' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'suno_1_click_auto_fill_userscript.user.js';
                    a.click();
                    URL.revokeObjectURL(url);
                    onCopyText('Downloaded suno_1_click_auto_fill_userscript.user.js', 'Userscript Download');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .user.js</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(SUNO_USERSCRIPT_CODE);
                      setCopiedSunoUserscript(true);
                      setTimeout(() => setCopiedSunoUserscript(false), 3000);
                      onCopyText(SUNO_USERSCRIPT_CODE, 'Suno 1-Click Userscript');
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                >
                  {copiedSunoUserscript ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSunoUserscript ? 'Copied Script!' : 'Copy Userscript to Clipboard'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4-BLOCK GRID: 2 COLUMNS OF BLOCKS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* BLOCK 1: LYRICS & META-TAGS */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-indigo-400 uppercase tracking-wider">BLOCK 1: Lyrics & Meta-Tags</span>
                  <span className="text-[10px] text-slate-500 font-mono">({linesCount} lines)</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onCopyText(block1Lyrics, 'Block 1: Lyrics');
                    setCopiedBlock(1);
                    setTimeout(() => setCopiedBlock(null), 2000);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  {copiedBlock === 1 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedBlock === 1 ? 'Copied!' : 'Copy Block 1'}</span>
                </button>
              </div>
              <pre className="text-xs text-slate-300 font-mono bg-slate-900/60 p-3 rounded-lg max-h-48 overflow-y-auto whitespace-pre-wrap custom-scrollbar mt-2 leading-relaxed">
                {block1Lyrics}
              </pre>
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-1">
              Includes prepended vocal cast archetype: <span className="text-indigo-300 font-semibold">[Vocal Archetype: {track.vocalCast || track.vocal}]</span>
            </p>
          </div>

          {/* BLOCK 2: STYLE OF MUSIC */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-400 uppercase tracking-wider">BLOCK 2: Style of Music</span>
                  <span className="text-[10px] text-slate-500 font-mono">({track.bpm} BPM)</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onCopyText(block2Style, 'Block 2: Style');
                    setCopiedBlock(2);
                    setTimeout(() => setCopiedBlock(null), 2000);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  {copiedBlock === 2 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedBlock === 2 ? 'Copied!' : 'Copy Block 2'}</span>
                </button>
              </div>
              <textarea
                rows={4}
                value={track.sunoPrompt}
                onChange={(e) => onUpdateTrack('sunoPrompt', e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-mono mt-2 focus:outline-none focus:border-amber-400"
                placeholder="Style prompt for Suno..."
              />
            </div>
            <div className="bg-slate-900/60 p-2 rounded-lg text-[10px] font-mono text-slate-400">
              Compiled Style: <span className="text-slate-200">{block2Style}</span>
            </div>
          </div>

          {/* BLOCK 3: EXCLUDED STYLES (ARTIFACT KILLER) */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-rose-400 uppercase tracking-wider">BLOCK 3: Excluded Styles</span>
                  <span className="text-[10px] text-rose-400/80 font-mono">Artifact Killer</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onCopyText(block3Excluded, 'Block 3: Excluded Styles');
                    setCopiedBlock(3);
                    setTimeout(() => setCopiedBlock(null), 2000);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  {copiedBlock === 3 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedBlock === 3 ? 'Copied!' : 'Copy Block 3'}</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={track.negativePrompt}
                onChange={(e) => onUpdateTrack('negativePrompt', e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-mono mt-2 focus:outline-none focus:border-rose-400"
                placeholder="sibilance, high-frequency hiss, digital artifacts, muddy bass..."
              />
            </div>
            <p className="text-[10px] text-slate-500 font-mono">
              Prevents phase distortion, harsh digital highs, and MIDI artificiality in Suno v5.5.
            </p>
          </div>

          {/* BLOCK 4: ENGINE SLIDERS */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-400 uppercase tracking-wider">BLOCK 4: Engine Sliders</span>
                  <span className="text-[10px] text-slate-500 font-mono">Suno Weights</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onCopyText(block4Sliders, 'Block 4: Sliders');
                    setCopiedBlock(4);
                    setTimeout(() => setCopiedBlock(null), 2000);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  {copiedBlock === 4 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedBlock === 4 ? 'Copied!' : 'Copy Block 4'}</span>
                </button>
              </div>

              {/* Slider Controls */}
              <div className="space-y-3 mt-3">
                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-slate-300">Weirdness (Harmonic Variance)</span>
                    <span className="font-mono text-indigo-400">{track.engineSliders?.weirdness ?? 12}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={track.engineSliders?.weirdness ?? 12}
                    onChange={(e) =>
                      onUpdateTrack('engineSliders', {
                        ...track.engineSliders,
                        weirdness: Number(e.target.value)
                      })
                    }
                    className="w-full accent-indigo-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-slate-300">Style Influence</span>
                    <span className="font-mono text-amber-400">{track.engineSliders?.styleInfluence ?? 65}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={track.engineSliders?.styleInfluence ?? 65}
                    onChange={(e) =>
                      onUpdateTrack('engineSliders', {
                        ...track.engineSliders,
                        styleInfluence: Number(e.target.value)
                      })
                    }
                    className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-slate-300">Voice / Audio Clarity</span>
                    <span className="font-mono text-emerald-400">{track.engineSliders?.voiceAudio ?? 100}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={track.engineSliders?.voiceAudio ?? 100}
                    onChange={(e) =>
                      onUpdateTrack('engineSliders', {
                        ...track.engineSliders,
                        voiceAudio: Number(e.target.value)
                      })
                    }
                    className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 p-2 rounded-lg text-[10px] font-mono text-slate-400">
              Compiled Values: <span className="text-slate-200">{block4Sliders}</span>
            </div>
          </div>

        </div>

      </section>

      {/* CHECKPOINT MODAL */}
      {isCheckpointModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Save className="w-4 h-4 text-amber-400" />
              <span>Create Immutable Checkpoint</span>
            </h3>
            <p className="text-xs text-slate-400">
              Save a versioned snapshot of the lyrics for <strong>{track.title}</strong> with rollback capabilities.
            </p>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Reason for Checkpoint</label>
              <input
                type="text"
                placeholder="e.g. Post-Bridge Polish, Nashville SOP adherence..."
                value={checkpointReason}
                onChange={(e) => setCheckpointReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCheckpointModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCheckpoint}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-950"
              >
                Save Version
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT LYRICS MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-400" />
                <span>Import Raw Lyrics</span>
              </h3>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Upload .TXT File</label>
              <input
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="w-full text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-indigo-300 hover:file:bg-slate-700 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Or Paste Text</label>
              <textarea
                rows={8}
                value={importedText}
                onChange={(e) => setImportedText(e.target.value)}
                placeholder="Paste song lyrics here..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoTagLyrics}
                  onChange={(e) => setAutoTagLyrics(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-indigo-600"
                />
                <span>Auto-detect [Verse], [Chorus], [Bridge]</span>
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessImport}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-950"
                >
                  Apply Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NASHVILLE SOP RULES & MARKDOWN / TEXT EDITOR MODAL */}
      <SOPRulesEditorModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        rulesPackage={sopRules}
        onSaveRules={async (newRules) => {
          setSopRules(newRules);
          await saveSOPRulesToCloud(newRules);
        }}
      />

      {/* SOUND PRESET LIBRARY MODAL (4-BLOCK SUNO ENGINE FORMULAS) */}
      <SoundPresetLibraryModal
        isOpen={isPresetLibraryOpen}
        onClose={() => setIsPresetLibraryOpen(false)}
        activeTrack={track}
        presets={presets}
        onApplyPreset={(preset, options) => {
          onUpdateTrack('sunoPrompt', preset.sunoPrompt);
          onUpdateTrack('negativePrompt', preset.negativePrompt);
          onUpdateTrack('engineSliders', preset.engineSliders);
          if (options?.applyVocalCast && preset.vocalCast) {
            onUpdateTrack('vocalCast', preset.vocalCast);
          }
          if (options?.applyBpm && preset.targetBpm) {
            onUpdateTrack('bpm', preset.targetBpm);
          }
          if (options?.applyKey && preset.targetKey) {
            onUpdateTrack('key', preset.targetKey);
          }
          setActivePresetName(preset.name);
        }}
        onCopyText={onCopyText}
        isFirestoreConnected={isFirebaseConfigured()}
        isDarkMode={isDarkMode}
      />

    </div>
  );
};
