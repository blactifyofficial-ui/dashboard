'use client';

import { useState } from 'react';
import { Send, Bot, User, Loader2, Sparkles, HelpCircle, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface AiConsultantChatProps {
  timeframe: string;
  summary: string;
}

const SUGGESTED_PROMPTS = [
  'How can we reduce our COD cancellation and return rate?',
  'If we increase our Meta Ads budget by 20%, what will happen to net margins?',
  'Which expense category should we audit or cut first to improve cash flow?',
  'How can we increase Average Order Value (AOV) using our top products?',
];

export default function AiConsultantChat({ timeframe, summary }: AiConsultantChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSend(questionText?: string) {
    const q = (questionText || input).trim();
    if (!q || loading) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: q }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai-analysis/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          timeframe,
          summary,
          history: messages,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get answer from AI advisor');
      }

      setMessages([...newMessages, { role: 'model', content: data.answer }]);
    } catch (err: any) {
      toast.error(err.message || 'Error communicating with AI advisor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h2 className="text-base sm:text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
            <span>Ask the AI Business Advisor</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Consult the AI directly on scenario modeling, COD strategies, or marketing scaling using your current store numbers.
          </p>
        </div>
      </div>

      {/* Suggested Quick Prompt Pills */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <HelpCircle size={12} /> Suggested Scenario Inquiries:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(prompt)}
              disabled={loading}
              className="text-xs px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 transition-colors text-left flex items-center gap-1 disabled:opacity-50"
            >
              <span>{prompt}</span>
              <ArrowUpRight size={11} className="text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Conversation Thread */}
      {messages.length > 0 && (
        <div className="space-y-3 pt-2 max-h-[400px] overflow-y-auto pr-1">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 text-xs sm:text-sm ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'model' && (
                <div className="w-7 h-7 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0 text-foreground font-mono font-semibold text-[11px]">
                  AI
                </div>
              )}

              <div
                className={`p-3.5 rounded-xl max-w-[85%] whitespace-pre-line leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-neutral-800 text-white font-medium ml-auto border border-neutral-700'
                    : 'bg-neutral-950/80 text-neutral-200 border border-neutral-800 font-sans'
                }`}
              >
                {msg.content}
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0 text-xs font-semibold">
                  You
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-2 pl-10">
              <Loader2 size={14} className="animate-spin text-primary" />
              <span>Synthesizing data-backed recommendation...</span>
            </div>
          )}
        </div>
      )}

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2 pt-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a strategic business question about your store..."
          disabled={loading}
          className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="h-9 px-4 bg-white hover:bg-neutral-200 text-black text-xs sm:text-sm font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shrink-0"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}
