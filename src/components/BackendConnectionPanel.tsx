import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Server, RefreshCw, Edit3, Loader2 } from 'lucide-react';

export const BackendConnectionPanel: React.FC = () => {
  const [currentUrl, setCurrentUrl] = useState('');
  const [editing, setEditing] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [status, setStatus] = useState<'unknown' | 'checking' | 'connected' | 'error'>('unknown');
  const [healthData, setHealthData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const url = (window as any).SkillTokAPI?.currentUrl || 'Not detected';
    setCurrentUrl(url);
    setNewUrl(url);
    testConnection();
  }, []);

  const testConnection = async () => {
    setStatus('checking');
    setErrorMsg('');
    try {
      const result = await (window as any).SkillTokAPI?.testConnection();
      if (result?.error) {
        setStatus('error');
        setErrorMsg(result.error);
        setHealthData(null);
      } else {
        setStatus('connected');
        setHealthData(result);
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  };

  const saveNewUrl = () => {
    if (!newUrl.trim()) return;
    (window as any).SkillTokAPI?.setBackendUrl(newUrl.trim());
  };

  const resetToDefault = () => {
    if (confirm('Reset to default backend URL?')) {
      (window as any).SkillTokAPI?.reset();
    }
  };

  return (
    <div className={`p-6 bg-slate-900 rounded-3xl border-2 space-y-4 shadow-xl ${
      status === 'connected' ? 'border-emerald-500/40' :
      status === 'error' ? 'border-rose-500/40' :
      'border-slate-800'
    }`}>
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <div className={`p-2 rounded-xl ${
          status === 'connected' ? 'bg-emerald-500/10 text-emerald-400' :
          status === 'error' ? 'bg-rose-500/10 text-rose-400' :
          'bg-cyan-500/10 text-cyan-400'
        }`}>
          <Server className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-white">Backend Connection Status</h3>
            {status === 'connected' && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-extrabold animate-pulse">● LIVE</span>}
            {status === 'error' && <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-extrabold">● OFFLINE</span>}
            {status === 'checking' && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-extrabold">● CHECKING</span>}
          </div>
          <p className="text-xs text-slate-400">Auto-detected from Railway env vars and live health check</p>
        </div>
        <button onClick={testConnection} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl" title="Re-test connection">
          {status === 'checking' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </button>
      </div>

      {/* Current URL Display */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Active Backend URL</label>
        {editing ? (
          <div className="flex gap-2">
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://your-backend.up.railway.app"
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
            />
            <button onClick={saveNewUrl} className="px-4 py-2 bg-emerald-500 text-slate-950 font-extrabold text-xs rounded-xl">
              Save & Reload
            </button>
            <button onClick={() => setEditing(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl">
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
            <code className="flex-1 text-xs font-mono text-cyan-300 break-all">{currentUrl}</code>
            <button onClick={() => setEditing(true)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300" title="Override URL">
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Connection Result */}
      {status === 'connected' && healthData && (
        <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4" /> Connection healthy — all services reachable
          </div>
          {healthData.services && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
              {Object.entries(healthData.services).map(([service, ok]: any) => (
                <div key={service} className="flex items-center gap-1.5 p-2 bg-slate-950 rounded">
                  <span className={ok ? 'text-emerald-400' : 'text-rose-400'}>
                    {ok ? '●' : '○'}
                  </span>
                  <span className="text-slate-300 capitalize">{service}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {status === 'error' && (
        <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
            <AlertCircle className="w-4 h-4" /> Cannot reach backend
          </div>
          <p className="text-xs text-slate-300 break-all">{errorMsg}</p>
          <div className="pt-2 border-t border-rose-500/20 space-y-1">
            <p className="text-[11px] text-slate-400 font-bold">Troubleshooting:</p>
            <ul className="text-[11px] text-slate-400 space-y-0.5 list-disc list-inside">
              <li>Confirm your Railway backend service is deployed and running</li>
              <li>Check the URL above matches your Railway service URL</li>
              <li>Verify <code className="bg-slate-950 px-1 rounded">CORS_ORIGIN</code> in backend includes this frontend URL</li>
              <li>Use the Edit button above to override the URL if it's wrong</li>
            </ul>
          </div>
        </div>
      )}

      {/* Reset button */}
      {currentUrl !== 'https://skilltok-backend-production.up.railway.app' && (
        <button onClick={resetToDefault} className="text-xs text-slate-400 hover:text-slate-200 underline">
          Reset to default URL
        </button>
      )}

      <div className="p-3 bg-cyan-500/5 border border-cyan-500/20 rounded-xl text-[11px] text-cyan-300">
        💡 <strong>How auto-connection works:</strong> The frontend reads <code className="bg-slate-950 px-1 rounded font-mono">VITE_BACKEND_URL</code> from Railway environment variables at build time. To change, add it in Railway → your frontend service → Variables tab → redeploy.
      </div>
    </div>
  );
};
