import React, { useState, useEffect } from 'react';
import {
  Plug,
  Plus,
  RefreshCw,
  Trash2,
  Play,
  Pin,
  PinOff,
  FileText,
  Key,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Terminal,
  ChevronRight,
  Shield,
  Clock
} from 'lucide-react';
import {
  McpServerPublic,
  McpToolDefinition,
  McpResourceDefinition,
  McpPinnedWidget
} from '../types/mcpStatus';

interface McpHubIngestionPanelProps {
  servers: McpServerPublic[];
  pinnedWidgets: McpPinnedWidget[];
  progressMarkdown?: string;
  isDarkMode: boolean;
  onRefreshDashboard: () => Promise<void>;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const McpHubIngestionPanel: React.FC<McpHubIngestionPanelProps> = ({
  servers,
  pinnedWidgets,
  progressMarkdown = '',
  isDarkMode,
  onRefreshDashboard,
  onNotify
}) => {
  const [selectedServerId, setSelectedServerId] = useState<string>(
    servers[0]?.id || 'brickos-primary-mcp'
  );
  const [selectedTool, setSelectedTool] = useState<McpToolDefinition | null>(null);
  const [toolArgs, setToolArgs] = useState<Record<string, string>>({});
  const [toolOutput, setToolOutput] = useState<any>(null);
  const [toolLatency, setToolLatency] = useState<number | null>(null);
  const [toolError, setToolError] = useState<string | null>(null);
  const [isRunningTool, setIsRunningTool] = useState(false);

  // Resource browser state
  const [activeResourceUri, setActiveResourceUri] = useState<string>('brickos://PROGRESS.md');
  const [resourceContent, setResourceContent] = useState<string>(progressMarkdown);
  const [isLoadingResource, setIsLoadingResource] = useState(false);

  // Add / Edit MCP server drawer state
  const [showServerForm, setShowServerForm] = useState(false);
  const [editingServerId, setEditingServerId] = useState<string | undefined>(undefined);
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formAuthType, setFormAuthType] = useState<'none' | 'bearer' | 'header'>('none');
  const [formAuthHeaderName, setFormAuthHeaderName] = useState('Authorization');
  const [formAuthToken, setFormAuthToken] = useState('');
  const [isSavingServer, setIsSavingServer] = useState(false);
  const [discoveringId, setDiscoveringId] = useState<string | null>(null);

  const selectedServer =
    servers.find((s) => s.id === selectedServerId) || servers[0] || null;

  useEffect(() => {
    if (progressMarkdown && !resourceContent) {
      setResourceContent(progressMarkdown);
    }
  }, [progressMarkdown]);

  useEffect(() => {
    if (selectedServer?.tools?.length && !selectedTool) {
      setSelectedTool(selectedServer.tools[0]);
    }
  }, [selectedServer]);

  const cardSurface = isDarkMode
    ? 'bg-slate-900/90 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200 text-slate-900';
  const subSurface = isDarkMode
    ? 'bg-slate-950/80 border-slate-800 text-slate-200'
    : 'bg-slate-50 border-slate-200 text-slate-800';
  const mutedText = isDarkMode ? 'text-slate-400' : 'text-slate-600';

  const handleOpenAddServer = () => {
    setEditingServerId(undefined);
    setFormName('');
    setFormUrl('https://');
    setFormAuthType('none');
    setFormAuthHeaderName('Authorization');
    setFormAuthToken('');
    setShowServerForm(true);
  };

  const handleOpenEditServer = (srv: McpServerPublic) => {
    setEditingServerId(srv.id);
    setFormName(srv.name);
    setFormUrl(srv.url);
    setFormAuthType(srv.authType || 'none');
    setFormAuthHeaderName(srv.authHeaderName || 'Authorization');
    setFormAuthToken(srv.hasAuthToken ? '••••••••' : '');
    setShowServerForm(true);
  };

  const handleSaveServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUrl.trim()) {
      onNotify('Enter both an MCP server name and URL.', 'error');
      return;
    }
    setIsSavingServer(true);
    try {
      const res = await fetch('/api/mcp/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingServerId,
          name: formName.trim(),
          url: formUrl.trim(),
          authType: formAuthType,
          authHeaderName: formAuthHeaderName.trim() || 'Authorization',
          authToken: formAuthToken,
          enabled: true,
          discover: true
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to save server');
      setShowServerForm(false);
      if (data.server?.id) setSelectedServerId(data.server.id);
      await onRefreshDashboard();
      onNotify(
        data.discovery?.ok
          ? `Connected ${data.server.name} (${data.discovery.tools?.length || 0} tools discovered)`
          : `Saved ${data.server.name} (check connection status)`,
        data.discovery?.ok ? 'success' : 'info'
      );
    } catch (err: any) {
      onNotify(err?.message || 'Failed to save MCP server', 'error');
    } finally {
      setIsSavingServer(false);
    }
  };

  const handleDiscoverServer = async (serverId: string) => {
    setDiscoveringId(serverId);
    try {
      const res = await fetch('/api/mcp/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId })
      });
      const data = await res.json();
      await onRefreshDashboard();
      if (data.success) {
        onNotify(
          `Synced ${data.discovery?.tools?.length || 0} tools & ${data.discovery?.resources?.length || 0} resources (${data.discovery?.latencyMs}ms)`,
          'success'
        );
      } else {
        onNotify(data.discovery?.error || 'MCP discovery failed', 'error');
      }
    } catch (err: any) {
      onNotify(err?.message || 'Discovery request failed', 'error');
    } finally {
      setDiscoveringId(null);
    }
  };

  const handleDeleteServer = async (srv: McpServerPublic) => {
    if (srv.isPrimary) return;
    try {
      const res = await fetch(`/api/mcp/servers/${encodeURIComponent(srv.id)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        if (selectedServerId === srv.id) setSelectedServerId('brickos-primary-mcp');
        await onRefreshDashboard();
        onNotify(`Removed MCP server "${srv.name}"`, 'info');
      }
    } catch (err: any) {
      onNotify(err?.message || 'Failed to delete server', 'error');
    }
  };

  const parseToolArgsForCall = (): Record<string, any> => {
    const props = selectedTool?.inputSchema?.properties || {};
    const out: Record<string, any> = {};
    for (const [key, val] of Object.entries(toolArgs)) {
      if (val === '' || val === undefined) continue;
      const schemaType = props[key]?.type;
      if (schemaType === 'integer' || schemaType === 'number') {
        const num = Number(val);
        if (!Number.isNaN(num)) out[key] = num;
      } else if (schemaType === 'boolean') {
        out[key] = val === 'true';
      } else if (schemaType === 'array' || schemaType === 'object') {
        try {
          out[key] = JSON.parse(val);
        } catch {
          out[key] = schemaType === 'array' ? val.split(',').map((s) => s.trim()).filter(Boolean) : val;
        }
      } else {
        out[key] = val;
      }
    }
    return out;
  };

  const handleSelectTool = (tool: McpToolDefinition) => {
    setSelectedTool(tool);
    setToolOutput(null);
    setToolError(null);
    const defaults: Record<string, string> = {};
    const props = tool.inputSchema?.properties || {};
    for (const [key, def] of Object.entries(props)) {
      if (def?.default !== undefined) {
        defaults[key] = typeof def.default === 'object' ? JSON.stringify(def.default) : String(def.default);
      }
    }
    setToolArgs(defaults);
  };

  const handleRunTool = async () => {
    if (!selectedServer || !selectedTool) return;
    setIsRunningTool(true);
    setToolError(null);
    try {
      const args = parseToolArgsForCall();
      const res = await fetch('/api/mcp/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: selectedServer.id,
          toolName: selectedTool.name,
          arguments: args
        })
      });
      const data = await res.json();
      setToolLatency(data.latencyMs ?? null);
      if (!data.success) {
        setToolError(data.error || 'Tool call failed');
        setToolOutput(null);
      } else {
        setToolOutput(data.data);
      }
    } catch (err: any) {
      setToolError(err?.message || 'MCP tool call failed');
    } finally {
      setIsRunningTool(false);
    }
  };

  const handlePinTool = async () => {
    if (!selectedServer || !selectedTool) return;
    try {
      const args = parseToolArgsForCall();
      const res = await fetch('/api/mcp/pins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: selectedServer.id,
          toolName: selectedTool.name,
          title: selectedTool.annotations?.title || selectedTool.name,
          args
        })
      });
      const data = await res.json();
      if (data.success) {
        await onRefreshDashboard();
        onNotify(`Pinned "${selectedTool.annotations?.title || selectedTool.name}" to Global Status Bento.`, 'success');
      }
    } catch (err: any) {
      onNotify(err?.message || 'Failed to pin widget', 'error');
    }
  };

  const handleUnpin = async (pinId: string) => {
    try {
      await fetch(`/api/mcp/pins/${encodeURIComponent(pinId)}`, { method: 'DELETE' });
      await onRefreshDashboard();
      onNotify('Unpinned MCP widget from Status Bento.', 'info');
    } catch {}
  };

  const handleLoadResource = async (resItem: McpResourceDefinition) => {
    if (!selectedServer) return;
    setActiveResourceUri(resItem.uri);
    setIsLoadingResource(true);
    try {
      const res = await fetch('/api/mcp/resource', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId: selectedServer.id, uri: resItem.uri })
      });
      const data = await res.json();
      if (data.success) {
        setResourceContent(
          typeof data.content === 'string' ? data.content : JSON.stringify(data.content, null, 2)
        );
      } else {
        setResourceContent(`Error loading resource: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      setResourceContent(`Failed to read resource: ${err?.message}`);
    } finally {
      setIsLoadingResource(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* SECTION 1: REGISTERED MCP SERVERS REGISTRY */}
      <section className={`rounded-2xl border p-4 sm:p-5 ${cardSurface}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/40">
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight">
              Registered MCP Servers & Ingestion Pipeline
            </h2>
            <p className={`text-xs mt-0.5 ${mutedText}`}>
              Server-side JSON-RPC 2.0 proxy supporting Streamable HTTP + SSE and optional Bearer/custom auth headers.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAddServer}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 transition cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add MCP Server</span>
          </button>
        </div>

        {/* Add / Edit Form */}
        {showServerForm && (
          <form
            onSubmit={handleSaveServer}
            className={`mt-4 rounded-xl border p-4 space-y-3 ${subSurface}`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                {editingServerId ? 'Edit MCP Server Connection' : 'Connect New MCP Server'}
              </h3>
              <button
                type="button"
                onClick={() => setShowServerForm(false)}
                className={`text-xs px-2.5 py-1 rounded-lg hover:bg-slate-800 cursor-pointer ${mutedText}`}
              >
                Cancel
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-medium mb-1 ${mutedText}`}>Display Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Muse Social MCP or Home Suno Runner"
                  className={`w-full min-h-[44px] px-3 py-2 rounded-lg border text-sm ${
                    isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${mutedText}`}>MCP Endpoint URL</label>
                <input
                  type="url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://example.moyercloud.com/mcp"
                  className={`w-full min-h-[44px] px-3 py-2 rounded-lg border text-sm font-mono ${
                    isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${mutedText}`}>Authentication Mode</label>
                <select
                  value={formAuthType}
                  onChange={(e) => setFormAuthType(e.target.value as 'none' | 'bearer' | 'header')}
                  className={`w-full min-h-[44px] px-3 py-2 rounded-lg border text-sm ${
                    isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="none">No Auth Header</option>
                  <option value="bearer">Bearer Token (Authorization: Bearer ...)</option>
                  <option value="header">Custom Header Key / Value</option>
                </select>
              </div>
              {formAuthType !== 'none' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {formAuthType === 'header' && (
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${mutedText}`}>Header Name</label>
                      <input
                        type="text"
                        value={formAuthHeaderName}
                        onChange={(e) => setFormAuthHeaderName(e.target.value)}
                        placeholder="X-API-Key"
                        className={`w-full min-h-[44px] px-3 py-2 rounded-lg border text-sm font-mono ${
                          isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                    </div>
                  )}
                  <div className={formAuthType === 'bearer' ? 'sm:col-span-2' : ''}>
                    <label className={`block text-xs font-medium mb-1 ${mutedText}`}>Token / Secret Value</label>
                    <input
                      type="password"
                      value={formAuthToken}
                      onChange={(e) => setFormAuthToken(e.target.value)}
                      placeholder="Stored server-side only in SQLite"
                      className={`w-full min-h-[44px] px-3 py-2 rounded-lg border text-sm font-mono ${
                        isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSavingServer}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSavingServer ? 'animate-spin' : ''}`} />
                <span>{isSavingServer ? 'Saving & Discovering...' : 'Save & Discover Tools'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Server List */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
          {servers.map((srv) => {
            const isSelected = selectedServer?.id === srv.id;
            const isConnected = srv.lastStatus === 'connected';
            return (
              <div
                key={srv.id}
                onClick={() => {
                  setSelectedServerId(srv.id);
                  if (srv.tools?.length) handleSelectTool(srv.tools[0]);
                }}
                className={`rounded-xl border p-3.5 transition cursor-pointer flex flex-col justify-between gap-3 ${
                  isSelected
                    ? isDarkMode
                      ? 'bg-indigo-950/35 border-indigo-500/70'
                      : 'bg-indigo-50/70 border-indigo-400'
                    : subSurface
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Plug className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="truncate">{srv.name}</span>
                    </div>
                    <p className={`text-xs font-mono truncate mt-0.5 ${mutedText}`}>{srv.url}</p>
                    <div className={`text-xs mt-1.5 flex flex-wrap items-center gap-1.5 ${mutedText}`}>
                      <span className={isConnected ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
                        {isConnected ? 'Connected' : srv.lastStatus || 'Pending'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{srv.lastLatencyMs || 0}ms</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{srv.tools?.length || 0} tools</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{srv.resources?.length || 0} resources</span>
                      {srv.hasAuthToken && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 text-cyan-400">
                            <Key className="w-3 h-3" /> {srv.authType === 'bearer' ? 'Bearer' : srv.authHeaderName}
                          </span>
                        </>
                      )}
                    </div>
                    {srv.lastError && (
                      <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{srv.lastError}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleDiscoverServer(srv.id)}
                      disabled={discoveringId === srv.id}
                      className={`min-h-[40px] min-w-[40px] px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 cursor-pointer ${
                        isDarkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-200' : 'border-slate-300 hover:bg-slate-100 text-slate-800'
                      }`}
                      title="Run initialize + tools/list + resources/list"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${discoveringId === srv.id ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">Sync</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditServer(srv)}
                      className={`min-h-[40px] px-2.5 rounded-lg border text-xs font-medium cursor-pointer ${
                        isDarkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      Auth / Edit
                    </button>
                    {!srv.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleDeleteServer(srv)}
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                        title="Delete custom MCP server"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 2: PINNED MCP TELEMETRY WIDGETS */}
      {pinnedWidgets.length > 0 && (
        <section className={`rounded-2xl border p-4 sm:p-5 ${cardSurface}`}>
          <h3 className="text-sm font-bold mb-3">Pinned Multi-MCP Bento Widgets ({pinnedWidgets.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pinnedWidgets.map((pin) => (
              <div key={pin.id} className={`rounded-xl border p-3.5 ${subSurface}`}>
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800/40">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">{pin.title}</div>
                    <div className={`text-[11px] font-mono truncate ${mutedText}`}>
                      {pin.toolName} · {pin.lastRunAt ? new Date(pin.lastRunAt).toLocaleTimeString() : 'Not yet run'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUnpin(pin.id)}
                    className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-400 cursor-pointer"
                    title="Unpin widget"
                  >
                    <PinOff className="w-3.5 h-3.5" />
                  </button>
                </div>
                <pre className="mt-2 text-[11px] font-mono overflow-x-auto max-h-40 whitespace-pre-wrap text-slate-300">
                  {typeof pin.lastResult === 'string'
                    ? pin.lastResult.slice(0, 800)
                    : JSON.stringify(pin.lastResult, null, 2)?.slice(0, 800)}
                </pre>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 3: INTERACTIVE TOOL CALLER & RESOURCE / RULES VIEWER */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Left: Tools List + Execution Form */}
        <section className={`xl:col-span-7 rounded-2xl border p-4 sm:p-5 flex flex-col gap-4 ${cardSurface}`}>
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <span>Live MCP Tool Runner ({selectedServer?.tools?.length || 0})</span>
              </h3>
              <p className={`text-xs mt-0.5 ${mutedText}`}>
                Invoke any tool exposed by {selectedServer?.name || 'selected server'} or pin its output to the Bento dashboard.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Tool selector list */}
            <div className={`md:col-span-5 rounded-xl border p-2 max-h-[420px] overflow-y-auto space-y-1 ${subSurface}`}>
              {(selectedServer?.tools || []).map((t) => {
                const active = selectedTool?.name === t.name;
                return (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => handleSelectTool(t)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition cursor-pointer flex items-center justify-between gap-2 ${
                      active
                        ? 'bg-indigo-600 text-white font-semibold'
                        : isDarkMode
                        ? 'hover:bg-slate-800/80 text-slate-300'
                        : 'hover:bg-slate-200/60 text-slate-800'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="truncate">{t.annotations?.title || t.name}</div>
                      <div className={`text-[10px] font-mono truncate ${active ? 'text-indigo-200' : mutedText}`}>
                        {t.name} {t.annotations?.readOnlyHint ? '· Read-Only' : '· Action'}
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  </button>
                );
              })}
              {(!selectedServer?.tools || selectedServer.tools.length === 0) && (
                <div className={`p-4 text-xs text-center ${mutedText}`}>
                  No tools discovered yet. Click Sync above.
                </div>
              )}
            </div>

            {/* Selected tool arguments + output */}
            <div className={`md:col-span-7 rounded-xl border p-3.5 space-y-3 ${subSurface}`}>
              {selectedTool ? (
                <>
                  <div>
                    <div className="text-sm font-semibold">
                      {selectedTool.annotations?.title || selectedTool.name}
                    </div>
                    <p className={`text-xs mt-1 leading-relaxed ${mutedText}`}>{selectedTool.description}</p>
                  </div>

                  {/* Dynamic Schema Inputs */}
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {Object.entries(selectedTool.inputSchema?.properties || {}).map(([propKey, schema]: [string, any]) => {
                      const isReq = selectedTool.inputSchema?.required?.includes(propKey);
                      return (
                        <div key={propKey}>
                          <label className={`block text-[11px] font-mono mb-1 ${mutedText}`}>
                            {propKey}
                            {isReq ? ' *' : ''} ({schema?.type || 'string'})
                          </label>
                          {Array.isArray(schema?.enum) ? (
                            <select
                              value={toolArgs[propKey] ?? ''}
                              onChange={(e) => setToolArgs((prev) => ({ ...prev, [propKey]: e.target.value }))}
                              className={`w-full min-h-[40px] px-2.5 py-1.5 rounded-lg border text-xs font-mono ${
                                isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                              }`}
                            >
                              <option value="">-- select --</option>
                              {schema.enum.map((opt: string) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={toolArgs[propKey] ?? ''}
                              onChange={(e) => setToolArgs((prev) => ({ ...prev, [propKey]: e.target.value }))}
                              placeholder={schema?.description || (schema?.default !== undefined ? `Default: ${schema.default}` : '')}
                              className={`w-full min-h-[40px] px-2.5 py-1.5 rounded-lg border text-xs font-mono ${
                                isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                              }`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleRunTool}
                      disabled={isRunningTool}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{isRunningTool ? 'Executing...' : 'Execute Tool'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handlePinTool}
                      className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 cursor-pointer ${
                        isDarkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-200' : 'border-slate-300 hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <Pin className="w-3.5 h-3.5 text-amber-400" />
                      <span>Pin to Status Bento</span>
                    </button>
                    {toolLatency !== null && (
                      <span className={`text-xs font-mono flex items-center gap-1 ${mutedText}`}>
                        <Clock className="w-3 h-3" /> {toolLatency}ms
                      </span>
                    )}
                  </div>

                  {toolError && (
                    <div className="p-2.5 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-300 text-xs font-mono">
                      {toolError}
                    </div>
                  )}

                  {toolOutput !== null && (
                    <div className="space-y-1">
                      <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Response Payload</span>
                      </div>
                      <pre className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono overflow-x-auto max-h-56 whitespace-pre-wrap text-slate-200">
                        {typeof toolOutput === 'string'
                          ? toolOutput
                          : JSON.stringify(toolOutput, null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              ) : (
                <div className={`text-xs ${mutedText}`}>Select a tool from the left list to inspect schema and execute.</div>
              )}
            </div>
          </div>
        </section>

        {/* Right: Live MCP Resources (AGENTS.md, PROGRESS.md, Rules) */}
        <section className={`xl:col-span-5 rounded-2xl border p-4 sm:p-5 flex flex-col gap-3 ${cardSurface}`}>
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>Live brickOS Rules & Ledger Resources</span>
              </h3>
              <p className={`text-xs mt-0.5 ${mutedText}`}>
                Ground-truth rules hosted by `brickos-remote-mcp` governing brand playlists, cohort windows & EGM gates.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(selectedServer?.resources || []).map((r) => {
              const active = activeResourceUri === r.uri;
              return (
                <button
                  key={r.uri}
                  type="button"
                  onClick={() => handleLoadResource(r)}
                  className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : isDarkMode
                      ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                      : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {r.uri.includes('rules/') ? <Shield className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                  <span>{r.name.replace('Rule: ', '')}</span>
                </button>
              );
            })}
          </div>

          <div className={`rounded-xl border p-3.5 flex-1 min-h-[320px] max-h-[420px] overflow-y-auto ${subSurface}`}>
            {isLoadingResource ? (
              <div className={`text-xs font-mono ${mutedText}`}>Reading {activeResourceUri} from MCP server...</div>
            ) : (
              <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed text-slate-300">
                {resourceContent || 'Select a resource tab above to inspect live brickOS rules.'}
              </pre>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
