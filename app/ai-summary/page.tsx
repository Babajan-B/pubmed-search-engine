'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Eye, EyeOff, Sparkles, Loader2, Copy, Check, Download } from 'lucide-react';
import { exportWord } from '@/lib/export';
import type { Article } from '@/app/api/search/route';

const LS_KEY = 'scholarabb_ai_articles';

interface StoredData {
  articles: Article[];
  query: string;
  citationFormat: 'vancouver' | 'apa' | 'ama';
}

function FormattedOutput({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1 text-sm text-foreground/90 leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-base font-bold text-foreground mt-6 mb-2 first:mt-0">{line.slice(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-sm font-semibold text-indigo-400 mt-5 mb-1">{line.slice(4)}</h3>;
        }
        if (line.startsWith('**Citation:**')) {
          return (
            <p key={i} className="text-xs text-muted-foreground italic border-l-2 border-indigo-500/40 pl-3 mt-2">
              {line.replace('**Citation:**', 'Citation:').trim()}
            </p>
          );
        }
        if (line === '---') {
          return <hr key={i} className="border-border my-4" />;
        }
        if (line.trim() === '') {
          return <div key={i} className="h-2" />;
        }
        const formatted = line
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
          .replace(/\[(\d+(?:,\d+)*)\]/g, '<span class="inline-flex items-center px-1 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300">[$1]</span>');
        return <p key={i} dangerouslySetInnerHTML={{ __html: formatted }} />;
      })}
    </div>
  );
}

export default function AISummaryPage() {
  const router = useRouter();
  const [stored, setStored] = useState<StoredData | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [mode, setMode] = useState<'individual' | 'synthesis'>('individual');
  const [citationFormat, setCitationFormat] = useState<'vancouver' | 'apa' | 'ama'>('vancouver');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [geminiModel, setGeminiModel] = useState('gemini-2.5-flash');

  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      try {
        const parsed: StoredData = JSON.parse(raw);
        setStored(parsed);
        if (parsed.citationFormat) setCitationFormat(parsed.citationFormat);
        // Load saved API key if present
        const savedKey = localStorage.getItem('scholarabb_gemini_key') ?? '';
        setApiKey(savedKey);
      } catch {
        setStored(null);
      }
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!stored?.articles.length) return;
    if (!apiKey.trim()) { setError('Please enter your Gemini API key.'); return; }

    setLoading(true);
    setError('');
    setResult('');

    // Persist key for this session only (sessionStorage would be safer but less convenient)
    localStorage.setItem('scholarabb_gemini_key', apiKey.trim());

    try {
      const res = await fetch('/api/ai-summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          model: geminiModel,
          mode,
          articles: stored.articles,
          citationFormat,
          query: stored.query,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return; }
      setResult(data.result ?? '');
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  }, [stored, apiKey, mode, citationFormat]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadWord = async () => {
    if (!stored?.articles) return;
    await exportWord(stored.articles, citationFormat, stored.query || 'ai-summary');
  };

  const articles = stored?.articles ?? [];
  const query = stored?.query ?? '';

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-white/5 bg-background/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to search
          </button>
          <span className="text-white/20">|</span>
          <span className="font-semibold tracking-tight text-sm flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            AI Summary
          </span>
          {query && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              — {query}
            </span>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {articles.length === 0 ? (
          <div className="rounded-xl border border-border bg-card/50 p-10 text-center space-y-4">
            <Sparkles className="h-10 w-10 mx-auto text-indigo-400/40" />
            <p className="text-muted-foreground text-sm">No articles loaded.</p>
            <p className="text-muted-foreground/60 text-xs">Go back to the search page, select articles, and click <strong>AI Summary</strong>.</p>
            <Button variant="outline" size="sm" onClick={() => router.push('/')}>
              <ArrowLeft className="h-3 w-3 mr-1" />
              Back to Search
            </Button>
          </div>
        ) : (
          <>
            {/* Config panel */}
            <div className="rounded-xl border border-border bg-card/50 p-5 space-y-5">
              <div className="flex flex-wrap items-start gap-5">
                {/* API Key */}
                <div className="flex-1 min-w-64 space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                    Gemini API Key
                  </Label>
                  <div className="relative">
                    <Input
                      type={showKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="AIza…"
                      className="pr-10 bg-white/5 border-white/10 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground/60">
                    Get a free key at{' '}
                    <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                      aistudio.google.com
                    </a>
                    . Key is stored locally and never sent to our servers.
                  </p>
                </div>

                {/* Citation format */}
                <div className="space-y-1.5 w-44">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                    Citation Format
                  </Label>
                  <Select value={citationFormat} onValueChange={(v) => setCitationFormat(v as 'vancouver' | 'apa' | 'ama')}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vancouver">Vancouver / NLM</SelectItem>
                      <SelectItem value="apa">APA 7th</SelectItem>
                      <SelectItem value="ama">AMA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Gemini model */}
                <div className="space-y-1.5 w-52">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                    Gemini Model
                  </Label>
                  <Select value={geminiModel} onValueChange={setGeminiModel}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash (fast)</SelectItem>
                      <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro (best)</SelectItem>
                      <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Article count */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                    Articles
                  </Label>
                  <div className="h-9 flex items-center px-3 rounded-md border border-white/10 bg-white/5 text-sm text-foreground/70">
                    {articles.length} selected
                  </div>
                </div>
              </div>

              {/* Mode tabs + Generate */}
              <div className="flex flex-wrap items-end gap-4 pt-1 border-t border-border">
                <Tabs value={mode} onValueChange={(v) => setMode(v as 'individual' | 'synthesis')} className="flex-1">
                  <TabsList className="bg-white/5 border border-white/10">
                    <TabsTrigger value="individual" className="text-xs data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-300">
                      Individual Summaries
                    </TabsTrigger>
                    <TabsTrigger value="synthesis" className="text-xs data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-300">
                      Literature Review
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <Button
                  onClick={handleGenerate}
                  disabled={loading || !apiKey.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white h-9"
                >
                  {loading
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating…</>
                    : <><Sparkles className="h-4 w-4 mr-2" />Generate</>
                  }
                </Button>
              </div>

              {/* Mode description */}
              <p className="text-[11px] text-muted-foreground/60">
                {mode === 'individual'
                  ? `Each of the ${articles.length} article${articles.length > 1 ? 's' : ''} will receive its own 2–3 paragraph AI-written summary with a formatted citation.`
                  : `All ${articles.length} article${articles.length > 1 ? 's' : ''} will be synthesised into a single coherent mini literature review with inline citations and a reference list.`
                }
              </p>
            </div>

            {/* Selected articles preview */}
            <details className="group rounded-xl border border-border bg-card/30 overflow-hidden">
              <summary className="px-5 py-3 text-xs text-muted-foreground cursor-pointer hover:text-foreground flex items-center gap-2 select-none">
                <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                {articles.length} article{articles.length > 1 ? 's' : ''} selected for AI processing
              </summary>
              <div className="px-5 pb-4 space-y-1.5 max-h-64 overflow-y-auto">
                {articles.map((a, i) => (
                  <div key={a.pmid} className="text-xs text-muted-foreground flex gap-2">
                    <span className="text-indigo-400/60 font-mono w-5 flex-shrink-0">[{i + 1}]</span>
                    <span>
                      <span className="text-foreground/80">{a.title}</span>
                      {' — '}
                      <span>{a.journal}, {a.year}</span>
                      {a.jif && <span className="text-violet-400/70"> · JIF {a.jif}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </details>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-destructive text-sm">
                {error}
              </div>
            )}

            {/* Result */}
            {result && (
              <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                    {mode === 'individual' ? 'Individual Summaries' : 'Literature Review'}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handleCopy} className="text-xs h-7 gap-1">
                      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleDownloadWord} className="text-xs h-7 gap-1">
                      <Download className="h-3 w-3" />
                      Word
                    </Button>
                  </div>
                </div>
                <div className="px-6 py-5">
                  <FormattedOutput text={result} />
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
