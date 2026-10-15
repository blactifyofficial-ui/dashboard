'use client';

import { useState, useEffect } from 'react';
import { BrainCircuit, CheckCircle2, AlertCircle, KeyRound, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GeminiSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [isEnv, setIsEnv] = useState(false);
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [inputKey, setInputKey] = useState('');
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch('/api/ai-analysis/settings');
      if (res.ok) {
        const data = await res.json();
        setConfigured(data.configured);
        setIsEnv(data.isEnv);
        setMaskedKey(data.maskedKey);
      }
    } catch (err) {
      console.error('Failed to load Gemini settings:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveKey(e: React.FormEvent) {
    e.preventDefault();
    if (!inputKey.trim()) {
      toast.error('Please enter a valid Gemini API key');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/ai-analysis/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: inputKey.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save key');
      }

      toast.success('Gemini API key saved successfully!');
      setConfigured(true);
      setMaskedKey(data.maskedKey);
      setInputKey('');
      setShowInput(false);
    } catch (err: any) {
      toast.error(err.message || 'Error saving API key');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-card p-4 sm:p-6 rounded-xl border border-border shadow-xs text-card-foreground">
      <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300 border border-neutral-700">
            <BrainCircuit size={16} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-card-foreground">Google Gemini AI Integration</h2>
            <p className="text-xs text-muted-foreground">Powers the AI Strategic Business &amp; Financial Intelligence page</p>
          </div>
        </div>

        {!loading && (
          <div className="flex items-center gap-1.5 text-xs font-mono">
            {configured ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
                <CheckCircle2 size={12} /> Active ({isEnv ? 'ENV' : 'Database'})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-medium">
                <AlertCircle size={12} /> Missing Key
              </span>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4 text-xs sm:text-sm text-muted-foreground">
        <p>
          Blactify uses <strong>Google Gemini 2.5 Flash</strong> to run deep diagnostics across sales, operational expenses, Meta Ads efficiency, and cash flow runways.
        </p>

        {loading ? (
          <div className="flex items-center gap-2 py-2 text-muted-foreground">
            <Loader2 size={15} className="animate-spin" />
            <span>Checking configuration status...</span>
          </div>
        ) : configured ? (
          <div className="p-3.5 rounded-lg bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-foreground font-mono font-medium text-xs">
                <KeyRound size={13} className="text-muted-foreground" />
                <span>Current Key:</span>
                <span className="text-neutral-400">{maskedKey}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {isEnv
                  ? 'Loaded securely from GEMINI_API_KEY environment variable (.env.local).'
                  : 'Stored securely in system settings database.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowInput(!showInput)}
              className="h-8 px-3 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors w-fit"
            >
              {showInput ? 'Cancel' : 'Change Key'}
            </button>
          </div>
        ) : (
          <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
            No Gemini API key is configured. You can either add <code className="bg-neutral-900 px-1 py-0.5 rounded text-amber-200 font-mono">GEMINI_API_KEY</code> to your <code className="bg-neutral-900 px-1 py-0.5 rounded text-amber-200 font-mono">.env.local</code> file or paste it below.
          </div>
        )}

        {(!configured || showInput) && !loading && (
          <form onSubmit={handleSaveKey} className="space-y-3 pt-2">
            <label className="block text-xs font-medium text-neutral-300">
              Enter Google Gemini API Key
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="password"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="AIzaSy..."
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs sm:text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
                disabled={saving}
              />
              <button
                type="submit"
                disabled={saving || !inputKey.trim()}
                className="h-9 px-4 bg-white hover:bg-neutral-200 text-black text-xs sm:text-sm font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shrink-0"
              >
                {saving && <Loader2 size={13} className="animate-spin" />}
                <span>Save API Key</span>
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              You can generate a free API key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:opacity-80">Google AI Studio</a>.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
