import React, { useState, useRef } from 'react';
import {
  FileText,
  Save,
  Upload,
  Download,
  RotateCcw,
  CheckCircle,
  X,
  Plus,
  Trash2,
  Eye,
  Edit3,
  HelpCircle,
  Code,
  Tag,
  ShieldCheck,
  Heart,
  Flame,
  Check,
  AlertTriangle
} from 'lucide-react';
import { SOPRulesPackage } from '../types';
import { CANONICAL_SOP_MARKDOWN, INITIAL_SOP_RULES } from '../data/canonicalSOPRules';

interface SOPRulesEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  rulesPackage: SOPRulesPackage;
  onSaveRules: (newRules: SOPRulesPackage) => Promise<void> | void;
}

export const SOPRulesEditorModal: React.FC<SOPRulesEditorModalProps> = ({
  isOpen,
  onClose,
  rulesPackage,
  onSaveRules
}) => {
  const [activeTab, setActiveTab] = useState<'markdown' | 'visual' | 'import_export'>('markdown');
  const [rawMarkdown, setRawMarkdown] = useState<string>(rulesPackage.rawMarkdown);
  const [clichesList, setClichesList] = useState<string[]>([...rulesPackage.cliches]);
  const [newClicheInput, setNewClicheInput] = useState<string>('');
  const [requiredTagsList, setRequiredTagsList] = useState<string[]>([...rulesPackage.requiredTags]);
  const [newTagInput, setNewTagInput] = useState<string>('');
  const [throneRoomTriggersList, setThroneRoomTriggersList] = useState<string[]>([...rulesPackage.throneRoomTriggers]);
  const [newTriggerInput, setNewTriggerInput] = useState<string>('');
  const [sonicScarRatio, setSonicScarRatio] = useState<string>(rulesPackage.sonicScarRatio || '3:1');

  // Markdown preview mode
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  const [saveErrorNotice, setSaveErrorNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Add a new cliché to blacklist
  const handleAddCliche = () => {
    const trimmed = newClicheInput.trim().toLowerCase();
    if (trimmed && !clichesList.includes(trimmed)) {
      const updated = [...clichesList, trimmed];
      setClichesList(updated);
      setNewClicheInput('');
      syncMarkdownFromVisual(updated, requiredTagsList, throneRoomTriggersList, sonicScarRatio);
    }
  };

  // Remove a cliché from blacklist
  const handleRemoveCliche = (clicheToRemove: string) => {
    const updated = clichesList.filter((c) => c !== clicheToRemove);
    setClichesList(updated);
    syncMarkdownFromVisual(updated, requiredTagsList, throneRoomTriggersList, sonicScarRatio);
  };

  // Add required tag
  const handleAddTag = () => {
    let trimmed = newTagInput.trim();
    if (!trimmed.startsWith('[')) trimmed = `[${trimmed}`;
    if (!trimmed.endsWith(']')) trimmed = `${trimmed}]`;
    if (trimmed && !requiredTagsList.includes(trimmed)) {
      const updated = [...requiredTagsList, trimmed];
      setRequiredTagsList(updated);
      setNewTagInput('');
      syncMarkdownFromVisual(clichesList, updated, throneRoomTriggersList, sonicScarRatio);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = requiredTagsList.filter((t) => t !== tagToRemove);
    setRequiredTagsList(updated);
    syncMarkdownFromVisual(clichesList, updated, throneRoomTriggersList, sonicScarRatio);
  };

  // Add trigger
  const handleAddTrigger = () => {
    const trimmed = newTriggerInput.trim().toLowerCase();
    if (trimmed && !throneRoomTriggersList.includes(trimmed)) {
      const updated = [...throneRoomTriggersList, trimmed];
      setThroneRoomTriggersList(updated);
      setNewTriggerInput('');
      syncMarkdownFromVisual(clichesList, requiredTagsList, updated, sonicScarRatio);
    }
  };

  const handleRemoveTrigger = (triggerToRemove: string) => {
    const updated = throneRoomTriggersList.filter((t) => t !== triggerToRemove);
    setThroneRoomTriggersList(updated);
    syncMarkdownFromVisual(clichesList, requiredTagsList, updated, sonicScarRatio);
  };

  // Helper to re-generate markdown when visual controls change
  const syncMarkdownFromVisual = (
    cliches: string[],
    tags: string[],
    triggers: string[],
    ratio: string
  ) => {
    const clichesFormatted = cliches.map((c) => `  - \`${c}\``).join('\n');
    const tagsFormatted = tags.map((t) => `\`${t}\``).join(', ');
    const triggersFormatted = triggers.map((t) => `\`${t}\``).join(', ');

    const newMd = `# The Nashville SOP v1.9 — Lyrical & Theological Constitution
*brickOS Sovereign Records — Lead Theological & Production Standard Operating Procedures*

## Rule 1: The OBI Chorus Funnel (Mandatory Structure)
- Every sovereign track MUST feature explicit structural tags: ${tagsFormatted}.
- The chorus serves as the emotional, theological, and melodic center of gravity.
- Verses establish honest blue-collar struggle; the chorus opens into sovereign worship.
- **Trigger**: Detected by presence of ${tagsFormatted}.

## Rule 2: The Throne Room Pivot (Mandatory by Bridge)
- No song remains indefinitely in grief, desolation, or human limitation.
- By the bridge, there MUST be an intentional theological pivot into the Throne Room of God.
- Acknowledge the broken gravel road, but turn eyes to the King of Kings.
- **Trigger**: Scans for keywords ${triggersFormatted}.

## Rule 3: Christianese Filter & Blue-Collar Reality
- Strip out tired, plastic church jargon.
- Replace generic "Christianese" clichés with 5:00 AM truck-cab honesty, grease on hands, and scriptural grit.
- **Blacklisted Clichés**:
${clichesFormatted}
- **Preferred Blue-Collar Vocab**:
  - Cold rain on windshield, heavy timber, broken bread, blood on the altar, calloused knees, mercy before sunrise.

## Rule 4: The ${ratio} Sonic Scar Ratio
- Enforce ${ratio.split(':')[0]} organic/analog human textures (acoustic resonator guitar, rough baritone vocal, wooden kick/snare) to ${ratio.split(':')[1]} synthetic element.
- Reject heavy digital autotune; preserve vocal grain and honest rasp.

## Rule 5: Christocentric Theological Depth
- Focus on God's sovereignty, redemptive grace, and covenant faithfulness.
- Eliminate self-help theological moralism; exult Christ alone.
`;
    setRawMarkdown(newMd);
  };

  // File Upload (.md or .txt)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawMarkdown(content);
        // Automatically extract cliches if present under Rule 3 or Blacklisted
        extractClichesFromMarkdown(content);
      }
    };
    reader.readAsText(file);
  };

  // Extract blacklist from raw markdown text
  const extractClichesFromMarkdown = (md: string) => {
    const lines = md.split('\n');
    const extractedCliches: string[] = [];
    let inBlacklistSection = false;

    lines.forEach((line) => {
      const lower = line.toLowerCase();
      if (lower.includes('blacklist') || lower.includes('cliché') || lower.includes('cliche')) {
        inBlacklistSection = true;
      } else if (inBlacklistSection && lower.startsWith('## rule')) {
        inBlacklistSection = false;
      }

      if (inBlacklistSection) {
        const match = line.match(/[-*]\s*`?([a-zA-Z\s]{3,35})`?/);
        if (match && match[1] && !match[1].includes('Rule') && !match[1].includes('preferred')) {
          extractedCliches.push(match[1].trim().toLowerCase());
        }
      }
    });

    if (extractedCliches.length > 0) {
      setClichesList(Array.from(new Set([...clichesList, ...extractedCliches])));
    }
  };

  // Download raw markdown file
  const handleDownloadMarkdown = () => {
    const blob = new Blob([rawMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Nashville_SOP_v1.9_Rules_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Reset to canonical v1.9 defaults
  const handleResetDefaults = () => {
    if (confirm('Reset all rules to the canonical Nashville SOP v1.9 standards?')) {
      setRawMarkdown(CANONICAL_SOP_MARKDOWN);
      setClichesList([...INITIAL_SOP_RULES.cliches]);
      setRequiredTagsList([...INITIAL_SOP_RULES.requiredTags]);
      setThroneRoomTriggersList([...INITIAL_SOP_RULES.throneRoomTriggers]);
      setSonicScarRatio(INITIAL_SOP_RULES.sonicScarRatio);
    }
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedPackage: SOPRulesPackage = {
        version: 'v1.9',
        updatedAt: new Date().toISOString().split('T')[0],
        rawMarkdown,
        cliches: clichesList,
        requiredTags: requiredTagsList,
        throneRoomTriggers: throneRoomTriggersList,
        sonicScarRatio,
        rules: [
          {
            id: 'obi-chorus',
            name: 'OBI Chorus Funnel',
            description: 'Requires explicit chorus tag as theological anchor.',
            triggerType: 'required_tag',
            tags: requiredTagsList,
            severity: 'error',
            enabled: true
          },
          {
            id: 'throne-room-pivot',
            name: 'Throne Room Pivot',
            description: 'Mandatory theological shift by bridge to the throne room.',
            triggerType: 'contains_any',
            tags: throneRoomTriggersList,
            severity: 'warning',
            enabled: true
          },
          {
            id: 'christianese-filter',
            name: 'Christianese Filter',
            description: 'Blacklist of plastic jargon; demands blue-collar truck cab reality.',
            triggerType: 'forbidden_phrase',
            bannedPhrases: clichesList,
            severity: 'error',
            enabled: true
          },
          {
            id: 'sonic-scar',
            name: `${sonicScarRatio} Sonic Scar Ratio`,
            description: `${sonicScarRatio.split(':')[0]} organic elements to ${sonicScarRatio.split(':')[1]} processed element.`,
            triggerType: 'ratio',
            severity: 'info',
            enabled: true
          }
        ]
      };

      await onSaveRules(updatedPackage);
      setSaveSuccessNotice(true);
      setSaveErrorNotice(null);
      setTimeout(() => {
        setSaveSuccessNotice(false);
        onClose();
      }, 1000);
    } catch (e: any) {
      setSaveErrorNotice(e.message || 'Error saving rules');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-4 flex-wrap bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg">
              <ShieldCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                  The Nashville SOP v1.9 — Rules & Doctrine Editor
                </h3>
                <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-mono text-[10px] font-bold border border-indigo-700/50">
                  Live Audit Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Update rules via direct Markdown editing, custom text parameters, or file import (.md).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close editor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SUB-NAV TABS */}
        <div className="px-5 pt-3 border-b border-slate-800 flex items-center justify-between gap-4 flex-wrap bg-slate-900">
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <button
              onClick={() => setActiveTab('markdown')}
              className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'markdown'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Direct Text & Markdown Editor</span>
            </button>

            <button
              onClick={() => setActiveTab('visual')}
              className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'visual'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Visual Criteria & Blacklist ({clichesList.length} Clichés)</span>
            </button>

            <button
              onClick={() => setActiveTab('import_export')}
              className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'import_export'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Import / Export (.md Files)</span>
            </button>
          </div>

          {activeTab === 'markdown' && (
            <div className="flex items-center gap-2 pb-2">
              <button
                type="button"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition flex items-center gap-1 cursor-pointer ${
                  isPreviewMode
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                }`}
              >
                {isPreviewMode ? <Edit3 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{isPreviewMode ? 'Switch to Edit' : 'Markdown Preview'}</span>
              </button>
            </div>
          )}
        </div>

        {/* EDITOR BODY */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
          
          {/* ======================================================== */}
          {/* TAB 1: DIRECT TEXT & MARKDOWN EDITOR                     */}
          {/* ======================================================== */}
          {activeTab === 'markdown' && (
            <div className="h-full flex flex-col space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono">
                  Characters: {rawMarkdown.length} • Lines: {rawMarkdown.split('\n').length} • Words:{' '}
                  {rawMarkdown.split(/\s+/).filter(Boolean).length}
                </span>
                <span className="text-indigo-400 text-[11px]">
                  Syntax: Standard CommonMark / GitHub Flavored Markdown
                </span>
              </div>

              {isPreviewMode ? (
                /* Formatted Markdown Preview */
                <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-5 overflow-y-auto custom-scrollbar text-slate-200 font-sans text-xs space-y-3.5 leading-relaxed shadow-inner">
                  {rawMarkdown.split('\n\n').map((block, idx) => {
                    if (block.startsWith('# ')) {
                      return <h1 key={idx} className="text-lg font-black text-white border-b border-slate-800 pb-2">{block.replace('# ', '')}</h1>;
                    }
                    if (block.startsWith('## ')) {
                      return <h2 key={idx} className="text-sm font-bold text-amber-400 mt-4 border-b border-slate-800/60 pb-1">{block.replace('## ', '')}</h2>;
                    }
                    if (block.startsWith('*') && block.endsWith('*')) {
                      return <p key={idx} className="text-xs text-indigo-300 italic">{block.replace(/\*/g, '')}</p>;
                    }
                    if (block.includes('- ')) {
                      return (
                        <ul key={idx} className="list-disc pl-5 space-y-1 text-slate-300">
                          {block.split('\n').filter(l => l.trim().startsWith('-')).map((item, i) => (
                            <li key={i} className="font-mono text-[11px]">{item.replace(/^-\s*/, '')}</li>
                          ))}
                        </ul>
                      );
                    }
                    return <p key={idx} className="text-slate-300 leading-relaxed font-mono text-[11px]">{block}</p>;
                  })}
                </div>
              ) : (
                /* Monospace Markdown Textarea */
                <textarea
                  value={rawMarkdown}
                  onChange={(e) => {
                    setRawMarkdown(e.target.value);
                    extractClichesFromMarkdown(e.target.value);
                  }}
                  className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-indigo-500 custom-scrollbar shadow-inner"
                  placeholder="Paste or write SOP rules in markdown..."
                />
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: VISUAL CRITERIA & CLICHÉ BLACKLIST BUILDER        */}
          {/* ======================================================== */}
          {activeTab === 'visual' && (
            <div className="space-y-5">
              
              {/* SECTION: CHRISTIANESE CLICHÉ BLACKLIST */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-rose-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Christianese Cliché Filter Blacklist ({clichesList.length})
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Any match immediately illuminates the warning light
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newClicheInput}
                    onChange={(e) => setNewClicheInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCliche())}
                    placeholder="Add banned cliché phrase (e.g. 'walk in victory', 'destiny helper')..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCliche}
                    className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1 shadow cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Blacklist Tag</span>
                  </button>
                </div>

                {/* Chips Grid */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {clichesList.map((cliche) => (
                    <span
                      key={cliche}
                      className="px-2.5 py-1 rounded-lg bg-rose-950/70 border border-rose-800/50 text-rose-300 text-xs font-mono flex items-center gap-1.5"
                    >
                      <span>"{cliche}"</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCliche(cliche)}
                        className="text-rose-400 hover:text-white transition cursor-pointer"
                        title="Remove this cliché from blacklist"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* SECTION: REQUIRED STRUCTURAL TAGS */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Rule 1: Required Structural Section Tags ({requiredTagsList.length})
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Must be present for OBI Funnel green light
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="e.g. [Chorus], [Bridge], [The Throne Room Pivot]..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Required Tag</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {requiredTagsList.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-800/50 text-emerald-300 text-xs font-mono flex items-center gap-1.5"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-emerald-400 hover:text-white transition cursor-pointer"
                        title="Remove tag"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* SECTION: THRONE ROOM PIVOT TRIGGERS */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Rule 2: Throne Room Pivot Triggers ({throneRoomTriggersList.length})
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Keywords that satisfy the mandatory bridge pivot
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTriggerInput}
                    onChange={(e) => setNewTriggerInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTrigger())}
                    placeholder="Keyword or phrase (e.g. 'throne room', 'pivot', 'sovereign')..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddTrigger}
                    className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1 shadow cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Trigger Keyword</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {throneRoomTriggersList.map((trig) => (
                    <span
                      key={trig}
                      className="px-2.5 py-1 rounded-lg bg-amber-950/70 border border-amber-800/50 text-amber-300 text-xs font-mono flex items-center gap-1.5"
                    >
                      <span>"{trig}"</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTrigger(trig)}
                        className="text-amber-400 hover:text-white transition cursor-pointer"
                        title="Remove trigger"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* SECTION: 3:1 SONIC SCAR RATIO */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Rule 4: Sonic Scar Organic-to-Synthetic Ratio
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Organic analog elements : Synthetic elements
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {['3:1', '4:1', '2:1', '5:1'].map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => {
                        setSonicScarRatio(ratio);
                        syncMarkdownFromVisual(clichesList, requiredTagsList, throneRoomTriggersList, ratio);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-mono font-bold border transition cursor-pointer ${
                        sonicScarRatio === ratio
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      {ratio} Ratio
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: IMPORT & EXPORT MARKDOWN FILES                     */}
          {/* ======================================================== */}
          {activeTab === 'import_export' && (
            <div className="space-y-5">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Upload Markdown File (.md / .txt)
                  </h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Select a local Markdown file containing your custom Nashville SOP rules, theological doctrine, or cliché blacklist. It will immediately populate the live rules editor and update the real-time quality audit.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".md,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Choose .md File to Upload</span>
                  </button>
                  <span className="text-xs text-slate-500 font-mono">Supported formats: .md, .txt</span>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Download Current Rules as Markdown (.md)
                  </h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Save your active Nashville SOP guidelines, cliché blacklist, and structural rules as a clean, versioned Markdown file for version control, GitHub, or documentation vaults.
                </p>

                <button
                  type="button"
                  onClick={handleDownloadMarkdown}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-2 transition cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Download Nashville_SOP_v1.9_Rules.md</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-3 flex-wrap bg-slate-950/80">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
              title="Reset all rules to canonical Nashville SOP v1.9 standards"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Reset to Canonical Defaults</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {saveSuccessNotice && (
              <span className="text-emerald-400 font-bold text-xs flex items-center gap-1 font-mono animate-fadeIn">
                <Check className="w-4 h-4" /> Rules applied live!
              </span>
            )}

            {saveErrorNotice && (
              <span className="text-rose-400 font-bold text-xs flex items-center gap-1 font-mono animate-fadeIn">
                <AlertTriangle className="w-4 h-4" /> {saveErrorNotice}
              </span>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-950/50 transition cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save & Apply Live to Audit'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
