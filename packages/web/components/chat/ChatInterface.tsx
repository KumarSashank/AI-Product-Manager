'use client';

import { useState, useRef, useEffect } from 'react';

import { ragApi } from '@/lib/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
}

interface ChatInterfaceProps {
  projectId: string;
}

export function ChatInterface({ projectId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await ragApi.getContext(userMessage.content, projectId);
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.context || 'No relevant information found for your query.',
        sources: res.sources,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    'What decisions were made?',
    'What are the action items?',
    'Summarize the last meeting',
    'What blockers were raised?',
  ];

  return (
    <div className="flex h-[500px] flex-col overflow-hidden rounded-[1.5rem] border border-black/6 bg-white/84 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#eff6ff]">
              <svg
                className="h-5 w-5 text-[#1d4ed8]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <p className="mb-4 text-sm text-[var(--ink-soft)]">Ask questions about your meetings</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="rounded-full border border-black/8 bg-[#f8fbff] px-3 py-1.5 text-xs text-[var(--ink-muted)] transition hover:border-black/12 hover:bg-white hover:text-[var(--ink-strong)]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-lg text-sm ${
                  msg.role === 'user'
                    ? 'bg-[linear-gradient(135deg,#1d4ed8,#0891b2)] text-white shadow-[0_12px_24px_rgba(13,77,170,0.15)]'
                    : 'border border-black/6 bg-[#f8fbff] text-[var(--ink-strong)]'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.sources && msg.sources.length > 0 && (
                  <p className="mt-2 border-t border-black/6 pt-2 text-xs text-[var(--ink-soft)]">
                    Sources: {msg.sources.length} meeting(s)
                  </p>
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-lg border border-black/6 bg-[#f8fbff] px-4 py-3">
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1d4ed8]" />
                <div
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1d4ed8]"
                  style={{ animationDelay: '0.1s' }}
                />
                <div
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1d4ed8]"
                  style={{ animationDelay: '0.2s' }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-black/6 bg-white/70 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 rounded-xl border border-black/10 bg-[#f8fbff] px-3.5 py-2.5 text-sm text-[var(--ink-strong)] placeholder:text-[var(--ink-soft)] transition focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/15"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-xl bg-[linear-gradient(135deg,#1d4ed8,#0891b2)] px-3.5 py-2.5 text-white transition hover:-translate-y-0.5 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
