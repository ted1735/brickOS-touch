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
  Clock,
  Eye,
  EyeOff,
  Lock,
  FlaskConical
} from 'lucide-react';
import {
  McpServerPublic,
  McpToolDefinition,
  McpResourceDefinition,
  McpPinnedWidget,
  McpAuthProfilePublic,
  McpAuthTestResult,
  McpAuthType
} from '../types/mcpStatus';

interface McpHubIngestionPanelProps {
  servers: McpServerPublic[];
  pinnedWidgets: McpPinnedWidget[];
  authProfiles?: McpAuthProfilePublic[];
  progressMarkdown?: string;
  isDarkMode: boolean;
  onRefreshDashboard: () => Promise<void>;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const McpHubIngestionPanel: React.FC<McpHubIngestionPanelProps> = ({
  servers,
  pinnedWidgets,
  authProfiles = [],
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

  // Auth Manager State (Reusable Bearer / Header / Env Profiles)
  const [profiles, setProfiles] = useState<McpAuthProfilePublic[]>(authProfiles);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | undefined>(undefined);
  const [profName, setProfName] = useState('');
  const [profAuthType, setProfAuthType] = useState<'bearer' | 'header' | 'env_bearer'>('bearer');
  const [profHeaderName, setProfHeaderName] = useState('Authorization');
  const [profEnvVarName, setProfEnvVarName] = useState('BRICK_MCP_BEARER_TOKEN');
  const [profSecret, setProfSecret] = useState('');
  const [profClearSecret, setProfClearSecret] = useState(false);
  const [profDescription, setProfDescription] = useState('');
  const [showProfSecretText, setShowProfSecretText] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profTestTargetUrl, setProfTestTargetUrl] = useState(
    servers[0]?.url || 'https://brick-mcp.moyercloud.com/mcp'
  );
  const [profTestResult, setProfTestResult] = useState<McpAuthTestResult | null>(null);
  const [isTestingProfAuth, setIsTestingProfAuth] = useState(false);

  // Add / Edit MCP server drawer state
  const [showServerForm, setShowServerForm] = useState(false);
  const [editingServerId, setEditingServerId] = useState<string | undefined>(undefined);
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formAuthType, setFormAuthType] = useState<McpAuthType>('none');
  const [formAuthProfileId, setFormAuthProfileId] = useState('');
  const [formAuthHeaderName, setFormAuthHeaderName] = useState('Authorization');
  const [formAuthToken, setFormAuthToken] = useState('');
  const [formClearToken, setFormClearToken] = useState(false);
  const [showServerSecretText, setShowServerSecretText] = useState(false);
  const [isSavingServer, setIsSavingServer] = useState(false);
  const [isTestingServerAuth, setIsTestingServerAuth] = useState(false);
  const [serverTestResult, setServerTestResult] = useState<McpAuthTestResult | null>(null);
  const [discoveringId, setDiscoveringId] = useState<string | null>(null);

  const selectedServer =
    servers.find((s) => s.id === selectedServerId) || servers[0] || null;

  useEffect(() => {
    setProfiles(authProfiles);
  }, [authProfiles]);

  useEffect(() => {
    if (progressMarkdown && !resourceContent) {
      setResourceContent(progressMarkdown);
    }
  }, [progressMarkdown]);

  const populateToolDefaults = (tool: McpToolDefinition) => {
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

  useEffect(() => {
    if (selectedServer?.tools?.length) {
      const stillExists = selectedTool
        ? selectedServer.tools.some((t) => t.name === selectedTool.name)
        : false;
      if (!selectedTool || !stillExists) {
        populateToolDefaults(selectedServer.tools[0]);
      }
    } else if (selectedTool) {
      setSelectedTool(null);
      setToolArgs({});
    }
  }, [selectedServer?.id, selectedServer?.tools?.length]);

  const cardSurface = isDarkMode
    ? 'bg-slate-900/90 border-slate-800 text-slate-100'
    : 'bg-white border-slate-200 text-slate-900';
  const subSurface = isDarkMode
    ? 'bg-slate-950/80 border-slate-800 text-slate-200'
    : 'bg-slate-50 border-slate-200 text-slate-800';
  const mutedText = isDarkMode ? 'text-slate-400' : 'text-slate-600';
  const inputSurface = isDarkMode
    ? 'bg-slate-900 border-slate-700 text-white'
    : 'bg-white border-slate-300 text-slate-900';

  const refreshProfilesFromApi = async () => {
    try {
      const res = await fetch('/api/mcp/auth/profiles');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.profiles)) {
        setProfiles(data.profiles);
      }
    } catch {
      // ignore background list error
    }
  };

  // ==========================================
  // AUTH PROFILE HANDLERS
  // ==========================================

  const handleOpenAddProfile = () => {
    setEditingProfileId(undefined);
    setProfName('Gemini Android Bearer Token');
    setProfAuthType('bearer');
    setProfHeaderName('Authorization');
    setProfEnvVarName('BRICK_MCP_BEARER_TOKEN');
    setProfSecret('');
    setProfClearSecret(false);
    setProfDescription('Bearer token shared with Gemini Android MCP integration');
    setProfTestTargetUrl(selectedServer?.url || 'https://brick-mcp.moyercloud.com/mcp');
    setProfTestResult(null);
    setShowProfSecretText(false);
    setShowProfileForm(true);
  };

  const handleOpenEditProfile = (prof: McpAuthProfilePublic) => {
    setEditingProfileId(prof.id);
    setProfName(prof.name);
    setProfAuthType(prof.authType);
    setProfHeaderName(prof.headerName || 'Authorization');
    setProfEnvVarName(prof.envVarName || 'BRICK_MCP_BEARER_TOKEN');
    setProfSecret(prof.hasSecret ? '••••••••' : '');
    setProfClearSecret(false);
    setProfDescription(prof.description || '');
    setProfTestTargetUrl(selectedServer?.url || 'https://brick-mcp.moyercloud.com/mcp');
    setProfTestResult(null);
    setShowProfSecretText(false);
    setShowProfileForm(true);
  };

  const handleTestProfileAuth = async () => {
    if (!profTestTargetUrl.trim()) {
      onNotify('Enter a target MCP endpoint URL to run auth diagnostic.', 'error');
      return;
    }
    setIsTestingProfAuth(true);
    setProfTestResult(null);
    try {
      const res = await fetch('/api/mcp/auth/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: profTestTargetUrl.trim(),
          authType: profAuthType === 'env_bearer' ? 'profile' : profAuthType,
          authProfileId: profAuthType === 'env_bearer' ? editingProfileId : undefined,
          authHeaderName: profHeaderName.trim() || 'Authorization',
          authToken: profSecret
        })
      });
      const data = await res.json();
      if (data.result) {
        setProfTestResult(data.result);
      } else {
        setProfTestResult({
          ok: false,
          httpStatus: res.status,
          latencyMs: 0,
          authModeUsed: profAuthType,
          authChallenge: '',
          error: data.error || 'Diagnostic failed'
        });
      }
    } catch (err: any) {
      setProfTestResult({
        ok: false,
        httpStatus: 0,
        latencyMs: 0,
        authModeUsed: profAuthType,
        authChallenge: '',
        error: err?.message || 'Network request failed'
      });
    } finally {
      setIsTestingProfAuth(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profName.trim()) {
      onNotify('Auth profile name is required.', 'error');
      return;
    }
    setIsSavingProfile(true);
    try {
      const res = await fetch('/api/mcp/auth/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingProfileId,
          name: profName.trim(),
          authType: profAuthType,
          headerName: profHeaderName.trim() || 'Authorization',
          envVarName: profEnvVarName.trim(),
          secret: profClearSecret ? '' : profSecret,
          clearSecret: profClearSecret,
          description: profDescription.trim()
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Failed to save auth profile (HTTP ${res.status})`);
      }
      if (Array.isArray(data.profiles)) {
        setProfiles(data.profiles);
      } else {
        await refreshProfilesFromApi();
      }
      setShowProfileForm(false);
      await onRefreshDashboard();
      onNotify(`Saved encrypted auth profile "${data.profile?.name || profName}"`, 'success');
    } catch (err: any) {
      onNotify(err?.message || 'Failed to save auth profile', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDeleteProfile = async (prof: McpAuthProfilePublic) => {
    try {
      const res = await fetch(`/api/mcp/auth/profiles/${encodeURIComponent(prof.id)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not remove auth profile');
      }
      if (Array.isArray(data.profiles)) {
        setProfiles(data.profiles);
      }
      await onRefreshDashboard();
      onNotify(`Deleted auth profile "${prof.name}"`, 'info');
    } catch (err: any) {
      onNotify(err?.message || 'Failed to delete auth profile', 'error');
    }
  };

  // ==========================================
  // SERVER REGISTRY & HANDSHAKE TESTER
  // ==========================================

  const handleOpenAddServer = () => {
    setEditingServerId(undefined);
    setFormName('');
    setFormUrl('https://');
    setFormAuthType(profiles.length > 0 ? 'profile' : 'none');
    setFormAuthProfileId(profiles[0]?.id || '');
    setFormAuthHeaderName('Authorization');
    setFormAuthToken('');
    setFormClearToken(false);
    setShowServerSecretText(false);
    setServerTestResult(null);
    setShowServerForm(true);
  };

  const handleOpenEditServer = (srv: McpServerPublic) => {
    setEditingServerId(srv.id);
    setFormName(srv.name);
    setFormUrl(srv.url);
    setFormAuthType(srv.authType || 'none');
    setFormAuthProfileId(srv.authProfileId || profiles[0]?.id || '');
    setFormAuthHeaderName(srv.authHeaderName || 'Authorization');
    setFormAuthToken(srv.hasAuthToken ? '••••••••' : '');
    setFormClearToken(false);
    setShowServerSecretText(false);
    setServerTestResult(null);
    setShowServerForm(true);
  };

  const handleTestServerAuth = async () => {
    if (!formUrl.trim()) {
      onNotify('Enter the MCP endpoint URL before testing handshake.', 'error');
      return;
    }
    setIsTestingServerAuth(true);
    setServerTestResult(null);
    try {
      const res = await fetch('/api/mcp/auth/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: editingServerId,
          url: formUrl.trim(),
          authType: formAuthType,
          authHeaderName: formAuthHeaderName.trim() || 'Authorization',
          authToken: formClearToken ? '' : formAuthToken,
          authProfileId: formAuthType === 'profile' ? formAuthProfileId : undefined
        })
      });
      const data = await res.json();
      if (data.result) {
        setServerTestResult(data.result);
      } else {
        setServerTestResult({
          ok: false,
          httpStatus: res.status,
          latencyMs: 0,
          authModeUsed: formAuthType,
          authChallenge: '',
          error: data.error || 'Auth handshake failed'
        });
      }
    } catch (err: any) {
      setServerTestResult({
        ok: false,
        httpStatus: 0,
        latencyMs: 0,
        authModeUsed: formAuthType,
        authChallenge: '',
        error: err?.message || 'Test request failed'
      });
    } finally {
      setIsTestingServerAuth(false);
    }
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
          authProfileId: formAuthType === 'profile' ? formAuthProfileId : '',
          authHeaderName: formAuthHeaderName.trim() || 'Authorization',
          authToken: formClearToken ? '' : formAuthToken,
          clearAuthToken: formClearToken,
          enabled: true,
          discover: true
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Failed to save server (HTTP ${res.status})`);
      }
      setShowServerForm(false);
      if (data.server?.id) setSelectedServerId(data.server.id);
      await onRefreshDashboard();
      onNotify(
        data.discovery?.ok
          ? `Connected ${data.server.name} (${data.discovery.tools?.length || 0} tools discovered)`
          : `Saved ${data.server.name} (${data.discovery?.error || 'check connection status'})`,
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
      if (res.ok && data.success) {
        onNotify(
          `Synced ${data.discovery?.tools?.length || 0} tools & ${data.discovery?.resources?.length || 0} resources (${data.discovery?.latencyMs}ms)`,
          'success'
        );
      } else {
        onNotify(data.discovery?.error || data.error || 'MCP discovery failed', 'error');
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
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete MCP server');
      }
      if (selectedServerId === srv.id) setSelectedServerId('brickos-primary-mcp');
      await onRefreshDashboard();
      onNotify(`Removed MCP server "${srv.name}"`, 'info');
    } catch (err: any) {
      onNotify(err?.message || 'Failed to delete server', 'error');
    }
  };

  // ==========================================
  // LIVE TOOL RUNNER & RESOURCE READER
  // ==========================================

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
    populateToolDefaults(tool);
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
      if (!res.ok || !data.success) {
        setToolError(data.error || `Tool call failed (HTTP ${res.status})`);
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
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to pin widget');
      }
      await onRefreshDashboard();
      onNotify(`Pinned "${selectedTool.annotations?.title || selectedTool.name}" to Global Status Bento.`, 'success');
    } catch (err: any) {
      onNotify(err?.message || 'Failed to pin widget', 'error');
    }
  };

  const handleUnpin = async (pinId: string) => {
    try {
      const res = await fetch(`/api/mcp/pins/${encodeURIComponent(pinId)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to unpin widget');
      }
      await onRefreshDashboard();
      onNotify('Unpinned MCP widget from Status Bento.', 'info');
    } catch (err: any) {
      onNotify(err?.message || 'Failed to unpin widget', 'error');
    }
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
      if (res.ok && data.success) {
        setResourceContent(
          typeof data.content === 'string' ? data.content : JSON.stringify(data.content, null, 2)
        );
      } else {
        setResourceContent(`Error loading resource: ${data.error || `HTTP ${res.status}`}`);
      }
    } catch (err: any) {
      setResourceContent(`Failed to read resource: ${err?.message}`);
    } finally {
      setIsLoadingResource(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* SECTION 0: MCP AUTH MANAGER (GEMINI ANDROID BEARER TOKEN & ENCRYPTED CREDENTIAL VAULT) */}
      <section className={`rounded-2xl border p-4 sm:p-5 ${cardSurface}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/40">
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>MCP Auth Manager (Bearer Token Vault)</span>
            </h2>
            <p className={`text-xs mt-0.5 ${mutedText}`}>
              Encrypted AES-256-GCM server-side storage for Gemini Android Bearer tokens &amp; custom auth headers. Secrets are never returned to the browser.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAddProfile}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-2 transition cursor-pointer whitespace-nowrap shrink-0"
          >
            <Key className="w-4 h-4" />
            <span>New Bearer Auth Profile</span>
          </button>
        </div>

        {/* Auth Profile Add / Edit Drawer */}
        {showProfileForm && (
          <form onSubmit={handleSaveProfile} className={`mt-4 rounded-xl border p-4 space-y-3 ${subSurface}`}>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">
                {editingProfileId ? 'Edit Bearer Auth Profile' : 'Create Reusable Bearer Auth Profile'}
              </h3>
              <button
                type="button"
                onClick={() => setShowProfileForm(false)}
                className={`text-xs px-2.5 py-1 rounded-lg hover:bg-slate-800 cursor-pointer ${mutedText}`}
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-medium mb-1 ${mutedText}`}>Profile Name</label>
                <input
                  type="text"
                  value={profName}
                  onChange={(e) => setProfName(e.target.value)}
                  placeholder="Gemini Android Bearer Token"
                  className={`w-full min-h-[44px] px-3 py-2 rounded-lg border text-sm ${inputSurface}`}
                />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${mutedText}`}>Credential Type</label>
                <select
                  value={profAuthType}
                  onChange={(e) => setProfAuthType(e.target.value as 'bearer' | 'header' | 'env_bearer')}
                  className={`w-full min-h-[44px] px-3 py-2 rounded-lg border text-sm ${inputSurface}`}
                >
                  <option value="bearer">Bearer Token (Authorization: Bearer &lt;token&gt;)</option>
                  <option value="header">Custom Header Name + Secret</option>
                  <option value="env_bearer">Server Env Var Binding (process.env)</option>
                </select>
              </div>

              {profAuthType === 'header' && (
                <div>
                  <label className={`block text-xs font-medium mb-1 ${mutedText}`}>Header Name</label>
                  <input
                    type="text"
                    value={profHeaderName}
                    onChange={(e) => setProfHeaderName(e.target.value)}
                    placeholder="X-API-Key"
                    className={`w-full min-h-[44px] px-3 py-2 rounded-lg border text-sm font-mono ${inputSurface}`}
                  />
                </div>
              )}

              {profAuthType === 'env_bearer' ? (
                <div>
                  <label className={`block text-xs font-medium mb-1 ${mutedText}`}>Server Environment Variable Name</label>
                  <input
                    type="text"
                    value={profEnvVarName}
                    onChange={(e) => setProfEnvVarName(e.target.value)}
                    placeholder="BRICK_MCP_BEARER_TOKEN"
                    className={`w-full min-h-[44px] px-3 py-2 rounded-lg border text-sm font-mono ${inputSurface}`}
                  />
                </div>
              ) : (
                <div className={profAuthType === 'bearer' ? 'md:col-span-2' : ''}>
                  <div className="flex items-center justify-between mb-1">
                    <label className={`text-xs font-medium ${mutedText}`}>
                      {profAuthType === 'bearer' ? 'Bearer Token (same token used in Gemini Android)' : 'Header Secret Value'}
                    </label>
                    {editingProfileId && (
                      <label className="flex items-center gap-1.5 text-xs text-amber-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={profClearSecret}
                          onChange={(e) => {
                            setProfClearSecret(e.target.checked);
                            if (e.target.checked) setProfSecret('');
                          }}
                        />
                        <span>Clear Stored Secret</span>
                      </label>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showProfSecretText ? 'text' : 'password'}
                      value={profSecret}
                      disabled={profClearSecret}
                      onChange={(e) => setProfSecret(e.target.value)}
                      placeholder="Paste Bearer token (leave •••••••• unchanged to keep current secret)"
                      className={`w-full min-h-[44px] pl-3 pr-10 py-2 rounded-lg border text-sm font-mono ${inputSurface}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowProfSecretText((v) => !v)}
                      className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded ${mutedText} hover:text-white cursor-pointer`}
                      title={showProfSecretText ? 'Hide token' : 'Reveal token input'}
                    >
                      {showProfSecretText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="md:col-span-2">
                <label className={`block text-xs font-medium mb-1 ${mutedText}`}>Notes / Endpoint Scope</label>
                <input
                  type="text"
                  value={profDescription}
                  onChange={(e) => setProfDescription(e.target.value)}
                  placeholder="Optional description (e.g. brick-mcp.moyercloud.com + staging MCPs)"
                  className={`w-full min-h-[40px] px-3 py-1.5 rounded-lg border text-xs ${inputSurface}`}
                />
              </div>
            </div>

            {/* Live Bearer Test Bar */}
            <div className="pt-2 border-t border-slate-800/50 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="url"
                  value={profTestTargetUrl}
                  onChange={(e) => setProfTestTargetUrl(e.target.value)}
                  placeholder="https://brick-mcp.moyercloud.com/mcp"
                  className={`flex-1 min-w-[220px] min-h-[40px] px-3 py-1.5 rounded-lg border text-xs font-mono ${inputSurface}`}
                />
                <button
                  type="button"
                  onClick={handleTestProfileAuth}
                  disabled={isTestingProfAuth}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                    isDarkMode ? 'border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/50' : 'border-cyan-400 text-cyan-700 hover:bg-cyan-50'
                  }`}
                >
                  <FlaskConical className={`w-3.5 h-3.5 ${isTestingProfAuth ? 'animate-pulse' : ''}`} />
                  <span>{isTestingProfAuth ? 'Probing Handshake...' : 'Test Auth Against Endpoint'}</span>
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{isSavingProfile ? 'Encrypting & Saving...' : 'Save Auth Profile'}</span>
                </button>
              </div>

              {profTestResult && (
                <div
                  className={`rounded-lg border p-3 text-xs font-mono space-y-1 ${
                    profTestResult.ok
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                      : 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                  }`}
                >
                  <div className="font-semibold flex flex-wrap items-center gap-2">
                    <span>HTTP {profTestResult.httpStatus || 'ERR'}</span>
                    <span>·</span>
                    <span className="tabular-nums">{profTestResult.latencyMs}ms</span>
                    <span>·</span>
                    <span>{profTestResult.authModeUsed}</span>
                    {profTestResult.ok && (
                      <span>· {profTestResult.toolCount || 0} tools, {profTestResult.resourceCount || 0} resources</span>
                    )}
                  </div>
                  {profTestResult.authChallenge && (
                    <div>WWW-Authenticate: {profTestResult.authChallenge}</div>
                  )}
                  {profTestResult.error && <div>Detail: {profTestResult.error}</div>}
                  {profTestResult.hint && <div className="opacity-90">Hint: {profTestResult.hint}</div>}
                </div>
              )}
            </div>
          </form>
        )}

        {/* Stored Profiles List */}
        {profiles.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {profiles.map((prof) => (
              <div key={prof.id} className={`rounded-xl border p-3.5 flex flex-col justify-between gap-2.5 ${subSurface}`}>
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold truncate">{prof.name}</span>
                    <span
                      className={`text-[11px] font-mono tabular-nums ${
                        prof.lastVerifiedStatus === 200
                          ? 'text-emerald-400'
                          : prof.lastVerifiedStatus >= 400
                          ? 'text-rose-400'
                          : mutedText
                      }`}
                    >
                      {prof.lastVerifiedStatus ? `HTTP ${prof.lastVerifiedStatus}` : 'Unverified'}
                    </span>
                  </div>
                  <div className={`text-[11px] font-mono mt-1 ${mutedText}`}>
                    {prof.authType === 'env_bearer'
                      ? `env:${prof.envVarName || 'UNSET'}`
                      : `${prof.authType === 'bearer' ? 'Bearer' : prof.headerName} · ${prof.tokenPreview || 'No secret'}`}
                  </div>
                  {prof.description && (
                    <p className={`text-[11px] mt-1 line-clamp-2 ${mutedText}`}>{prof.description}</p>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/40">
                  <span className={`text-[11px] font-mono tabular-nums ${mutedText}`}>
                    {prof.linkedServerCount || 0} linked endpoint{(prof.linkedServerCount || 0) === 1 ? '' : 's'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditProfile(prof)}
                      className={`min-h-[34px] px-2.5 rounded-lg border text-xs font-medium cursor-pointer ${
                        isDarkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-200' : 'border-slate-300 hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      Rotate / Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProfile(prof)}
                      className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                      title="Delete Auth Profile"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !showProfileForm && (
            <div className={`mt-4 rounded-xl border p-3.5 text-xs ${subSurface} ${mutedText}`}>
              No reusable Bearer Auth Profiles saved yet. Add your Gemini Android Bearer token here or configure per-server authentication below.
            </div>
          )
        )}
      </section>

      {/* SECTION 1: REGISTERED MCP SERVERS REGISTRY */}
      <section className={`rounded-2xl border p-4 sm:p-5 ${cardSurface}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/40">
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight">
              Registered MCP Servers &amp; Ingestion Pipeline
            </h2>
            <p className={`text-xs mt-0.5 ${mutedText}`}>
              Server-side JSON-RPC 2.0 proxy supporting Streamable HTTP + SSE, reusable Bearer Auth Profiles, and direct header tokens.
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

        {/* Add / Edit Server Form */}
        {showServerForm && (
          <form
            onSubmit={handleSaveServer}
            className={`mt-4 rounded-xl border p-4 space-y-3 ${subSurface}`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                {editingServerId ? 'Edit MCP Server Connection & Auth' : 'Connect New MCP Server'}
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
                  className={`w-full min-h-[44px] px-3 py-2 rounded-lg border text-sm ${inputSurface}`}
                />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${mutedText}`}>MCP Endpoint URL</label>
                <input
                  type="url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://example.moyercloud.com/mcp"
                  className={`w-full min-h-[44px] px-3 py-2 rounded-lg border text-sm font-mono ${inputSurface}`}
                />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${mutedText}`}>Authentication Mode</label>
                <select
                  value={formAuthType}
                  onChange={(e) => {
                    const nextType = e.target.value as McpAuthType;
                    setFormAuthType(nextType);
                    if (nextType === 'profile' && !formAuthProfileId && profiles[0]?.id) {
                      setFormAuthProfileId(profiles[0].id);
                    }
                  }}
                  className={`w-full min-h-[44px] px-3 py-2 rounded-lg border text-sm ${inputSurface}`}
                >
                  <option value="none">No Auth Header</option>
                  <option value="profile">Shared Bearer Auth Profile (Recommended)</option>
                  <option value="bearer">Direct Bearer Token (Authorization: Bearer ...)</option>
                  <option value="header">Custom Header Key / Value</option>
                </select>
              </div>

              {formAuthType === 'profile' && (
                <div>
                  <label className={`block text-xs font-medium mb-1 ${mutedText}`}>Linked Auth Profile</label>
                  <select
                    value={formAuthProfileId}
                    onChange={(e) => setFormAuthProfileId(e.target.value)}
                    className={`w-full min-h-[44px] px-3 py-2 rounded-lg border text-sm ${inputSurface}`}
                  >
                    <option value="">-- Select Bearer Auth Profile --</option>
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.tokenPreview || p.envVarName || p.authType})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(formAuthType === 'bearer' || formAuthType === 'header') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {formAuthType === 'header' && (
                    <div>
                      <label className={`block text-xs font-medium mb-1 ${mutedText}`}>Header Name</label>
                      <input
                        type="text"
                        value={formAuthHeaderName}
                        onChange={(e) => setFormAuthHeaderName(e.target.value)}
                        placeholder="X-API-Key"
                        className={`w-full min-h-[44px] px-3 py-2 rounded-lg border text-sm font-mono ${inputSurface}`}
                      />
                    </div>
                  )}
                  <div className={formAuthType === 'bearer' ? 'sm:col-span-2' : ''}>
                    <div className="flex items-center justify-between mb-1">
                      <label className={`text-xs font-medium ${mutedText}`}>Token / Secret Value</label>
                      {editingServerId && (
                        <label className="flex items-center gap-1.5 text-xs text-amber-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formClearToken}
                            onChange={(e) => {
                              setFormClearToken(e.target.checked);
                              if (e.target.checked) setFormAuthToken('');
                            }}
                          />
                          <span>Clear Token</span>
                        </label>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showServerSecretText ? 'text' : 'password'}
                        value={formAuthToken}
                        disabled={formClearToken}
                        onChange={(e) => setFormAuthToken(e.target.value)}
                        placeholder="Encrypted at rest in server-side SQLite"
                        className={`w-full min-h-[44px] pl-3 pr-10 py-2 rounded-lg border text-sm font-mono ${inputSurface}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowServerSecretText((v) => !v)}
                        className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded ${mutedText} hover:text-white cursor-pointer`}
                      >
                        {showServerSecretText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {serverTestResult && (
              <div
                className={`rounded-lg border p-3 text-xs font-mono space-y-1 ${
                  serverTestResult.ok
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    : 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                }`}
              >
                <div className="font-semibold flex flex-wrap items-center gap-2">
                  <span>HTTP {serverTestResult.httpStatus || 'ERR'}</span>
                  <span>·</span>
                  <span className="tabular-nums">{serverTestResult.latencyMs}ms</span>
                  <span>·</span>
                  <span>{serverTestResult.authModeUsed}</span>
                  {serverTestResult.ok && (
                    <span>· {serverTestResult.toolCount || 0} tools discovered</span>
                  )}
                </div>
                {serverTestResult.authChallenge && (
                  <div>WWW-Authenticate: {serverTestResult.authChallenge}</div>
                )}
                {serverTestResult.error && <div>Detail: {serverTestResult.error}</div>}
                {serverTestResult.hint && <div className="opacity-90">Hint: {serverTestResult.hint}</div>}
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleTestServerAuth}
                disabled={isTestingServerAuth}
                className={`min-h-[44px] px-4 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer ${
                  isDarkMode ? 'border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/50' : 'border-cyan-400 text-cyan-700 hover:bg-cyan-50'
                }`}
              >
                <FlaskConical className={`w-3.5 h-3.5 ${isTestingServerAuth ? 'animate-pulse' : ''}`} />
                <span>{isTestingServerAuth ? 'Testing Handshake...' : 'Test Auth & Handshake'}</span>
              </button>
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
                      <span className="font-mono tabular-nums">{srv.lastLatencyMs || 0}ms</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{srv.tools?.length || 0} tools</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{srv.resources?.length || 0} resources</span>
                      {(srv.hasAuthToken || srv.authType === 'profile') && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 text-cyan-400">
                            <Key className="w-3 h-3" />
                            {srv.authType === 'profile'
                              ? `Profile: ${srv.authProfileName || 'Linked'}`
                              : srv.authType === 'bearer'
                              ? `Bearer ${srv.tokenPreview || ''}`
                              : srv.authHeaderName}
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
                              className={`w-full min-h-[40px] px-2.5 py-1.5 rounded-lg border text-xs font-mono ${inputSurface}`}
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
                              className={`w-full min-h-[40px] px-2.5 py-1.5 rounded-lg border text-xs font-mono ${inputSurface}`}
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
                      <span className={`text-xs font-mono tabular-nums flex items-center gap-1 ${mutedText}`}>
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
                <span>Live brickOS Rules &amp; Ledger Resources</span>
              </h3>
              <p className={`text-xs mt-0.5 ${mutedText}`}>
                Ground-truth rules hosted by `brickos-remote-mcp` governing brand playlists, cohort windows &amp; EGM gates.
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
