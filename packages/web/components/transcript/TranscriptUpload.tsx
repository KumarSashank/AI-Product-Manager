'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

import { transcriptApi, meetingsApi, momApi, UploadResult, MoM } from '@/lib/api';

interface TranscriptUploadProps {
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'input' | 'processing' | 'result';

interface ProcessingStage {
  label: string;
  status: 'pending' | 'active' | 'done';
}

const inputClass =
  'w-full rounded-xl border border-black/10 bg-[rgba(248,251,255,0.8)] px-3.5 py-2.5 text-sm text-[var(--ink-strong)] placeholder:text-[var(--ink-soft)] transition focus:border-[#1d4ed8]/35 focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/20';

export function TranscriptUpload({ projectId, onClose, onSuccess }: TranscriptUploadProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('input');
  const [title, setTitle] = useState('');
  const [transcript, setTranscript] = useState('');
  const [contextNote, setContextNote] = useState('');
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detectedFormat, setDetectedFormat] = useState<string | null>(null);
  const [stages, setStages] = useState<ProcessingStage[]>([
    { label: 'Parsing transcript lines', status: 'pending' },
    { label: 'Creating meeting record', status: 'pending' },
    { label: 'Extracting action items & decisions with AI', status: 'pending' },
    { label: 'Generating Minutes of Meeting', status: 'pending' },
    { label: 'Saving highlights & items', status: 'pending' },
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!transcript.trim()) {
      setDetectedFormat(null);
      return;
    }
    const lines = transcript.split('\n').filter((l) => l.trim());
    const colonLines = lines.filter((l) => /^[^:]{1,50}:\s+.+$/.test(l));
    const timestampLines = lines.filter((l) => /^\d{2}:\d{2}/.test(l) || /-->/.test(l));

    if (timestampLines.length > lines.length * 0.2) {
      setDetectedFormat('VTT / SRT (timestamps will be stripped)');
    } else if (colonLines.length > lines.length * 0.5) {
      setDetectedFormat(`Speaker-attributed (${colonLines.length} attributed lines)`);
    } else {
      setDetectedFormat(`Plain text (${lines.length} lines)`);
    }
  }, [transcript]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setTranscript(text);
      if (!title) setTitle(file.name.replace(/\.(txt|vtt|srt)$/i, ''));
    };
    reader.readAsText(file);
  };

  const animateStages = () => {
    const timings = [500, 1500, 3000, 6000, 9000];
    timings.forEach((ms, idx) => {
      setTimeout(() => {
        setStages((prev) =>
          prev.map((s, i) => ({
            ...s,
            status: i < idx ? 'done' : i === idx ? 'active' : 'pending',
          }))
        );
      }, ms);
    });
  };

  const handleSubmit = async () => {
    if (!title.trim() || !transcript.trim()) return;
    setStep('processing');
    setError(null);
    animateStages();

    try {
      const res = await transcriptApi.upload(projectId, title, transcript, {
        analysisMode: 'product_manager',
        contextNote: contextNote.trim() || undefined,
      });

      // Check if the AI pipeline actually succeeded
      if (!res.momGeneration?.success || !res.momGeneration?.momId) {
        // Transcript was saved, but AI analysis failed — try running it again
        const meetingId = res.meetingId;
        try {
          setStages((prev) =>
            prev.map((s, i) => ({
              ...s,
              status: i < 2 ? ('done' as const) : i === 2 ? ('active' as const) : ('pending' as const),
            }))
          );

          await meetingsApi.generateMom(meetingId);

          // Refetch results
          const [momData, itemsData, highlightsData] = await Promise.all([
            momApi.getByMeeting(meetingId).catch(() => ({ mom: null })),
            meetingsApi.getItems(meetingId).catch(() => ({ items: [] })),
            momApi.getHighlights(meetingId).catch(() => ({ highlights: [] })),
          ]);

          // Update result with corrected counts
          res.momGeneration.success = true;
          res.momGeneration.momId = (momData.mom as MoM | null)?.id ?? null;
          res.momGeneration.itemsCreated = (itemsData.items || []).length;
          res.momGeneration.highlightsCreated = (highlightsData.highlights || []).length;
        } catch {
          // Still show partial success — transcript was saved
          console.warn('AI retry also failed, showing partial result');
        }
      }

      setStages((prev) => prev.map((s) => ({ ...s, status: 'done' as const })));
      await new Promise((r) => setTimeout(r, 600));
      setResult(res);
      setStep('result');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setStep('input');
    }
  };

  const lineCount = transcript.split('\n').filter((l) => l.trim().length > 0).length;
  const stepIdx = ['input', 'processing', 'result'].indexOf(step);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-[rgba(15,23,42,0.32)] backdrop-blur-[10px]" onClick={step !== 'processing' ? onClose : undefined} />

      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2rem] border border-black/6 bg-white/94 p-7 shadow-[0_28px_90px_rgba(15,23,42,0.14)] backdrop-blur">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#1d4ed8]">Meeting intake</p>
            <h2 className="mt-2 font-[family:var(--font-display)] text-2xl tracking-[-0.03em] text-[var(--ink-strong)]">
              Upload transcript
            </h2>
            <p className="mt-1.5 text-sm text-[var(--ink-soft)]">
              {step === 'input' && 'Paste or drop a meeting transcript and we will build the minutes.'}
              {step === 'processing' && 'Analysing your transcript — this usually takes 15 to 30 seconds.'}
              {step === 'result' && 'Minutes of meeting generated and saved to this project.'}
            </p>
          </div>
          {step !== 'processing' && (
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-full border border-black/8 bg-white/70 p-2 text-[var(--ink-soft)] transition hover:border-black/12 hover:text-[var(--ink-strong)]"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Step indicator */}
        <div className="mb-7 flex items-center gap-2">
          {(['input', 'processing', 'result'] as Step[]).map((s, i) => {
            const done = stepIdx > i;
            const active = step === s;
            return (
              <div key={s} className="flex flex-1 items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold transition ${
                    active
                      ? 'bg-[linear-gradient(135deg,#1d4ed8,#0891b2)] text-white shadow-[0_8px_18px_rgba(13,77,170,0.22)]'
                      : done
                        ? 'border border-[#1d4ed8]/20 bg-[#eff6ff] text-[#1d4ed8]'
                        : 'border border-black/8 bg-white text-[var(--ink-soft)]'
                  }`}
                >
                  {done ? (
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                {i < 2 && <div className={`h-px flex-1 ${done ? 'bg-[#1d4ed8]/25' : 'bg-black/8'}`} />}
              </div>
            );
          })}
        </div>

        {/* Step 1 — Input */}
        {step === 'input' && (
          <div className="space-y-5">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <div className="rounded-2xl border border-[#1d4ed8]/15 bg-[linear-gradient(180deg,#f0f7ff,#f5fbff)] px-4 py-3.5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#1d4ed8]">
                Recommended capture path
              </p>
              <p className="mt-1.5 text-sm leading-6 text-[var(--ink-muted)]">
                Transcript upload is the most reliable way to generate PM-style minutes today. Bot
                join and extension capture are still being tuned for broader real-world coverage.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--ink-strong)]">
                Meeting title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
                placeholder="e.g., Sprint Planning — Week 10"
                autoFocus
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label className="text-sm font-medium text-[var(--ink-strong)]">Transcript</label>
                <div className="flex items-center gap-3">
                  {lineCount > 0 && (
                    <span className="text-xs text-[var(--ink-soft)]">{lineCount} lines</span>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#1d4ed8]/20 bg-[#eff6ff] px-2.5 py-1.5 text-xs font-medium text-[#1d4ed8] transition hover:bg-[#e2efff]"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                      />
                    </svg>
                    Upload file
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.vtt,.srt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                className={`${inputClass} h-52 resize-none font-mono`}
                placeholder={`Paste your transcript here...\n\nSupported formats:\n  Speaker Name: what they said\n  Plain text (no speaker attribution)\n  VTT / SRT subtitle files`}
              />
              {detectedFormat && (
                <p className="mt-1.5 text-xs text-[var(--ink-soft)]">
                  <span className="font-medium text-[var(--ink-muted)]">Detected:</span>{' '}
                  {detectedFormat}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--ink-strong)]">
                Context <span className="font-normal text-[var(--ink-soft)]">(optional)</span>
              </label>
              <textarea
                value={contextNote}
                onChange={(e) => setContextNote(e.target.value)}
                className={`${inputClass} h-20 resize-none`}
                placeholder="Product goals, release context, stakeholders, or the kind of MoM you want."
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-black/8 bg-white px-4 py-2.5 text-sm font-medium text-[var(--ink-muted)] transition hover:border-black/12 hover:text-[var(--ink-strong)]"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!title.trim() || !transcript.trim()}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#1d4ed8,#0891b2)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(13,77,170,0.16)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Upload & analyse
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Processing */}
        {step === 'processing' && (
          <div className="space-y-6 py-4">
            <div className="flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-[#1d4ed8]/15">
                <div className="h-11 w-11 animate-spin rounded-full border-[3px] border-[#1d4ed8] border-t-transparent" />
              </div>
            </div>

            <div className="mx-auto max-w-sm space-y-2.5">
              {stages.map((stage, i) => (
                <div key={i} className="flex items-center gap-3">
                  {stage.status === 'done' ? (
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100">
                      <svg className="h-3 w-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : stage.status === 'active' ? (
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#eff6ff]">
                      <div className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-[#1d4ed8] border-t-transparent" />
                    </div>
                  ) : (
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-black/8 bg-white">
                      <div className="h-1.5 w-1.5 rounded-full bg-black/15" />
                    </div>
                  )}
                  <span
                    className={`text-sm ${
                      stage.status === 'done'
                        ? 'text-emerald-700'
                        : stage.status === 'active'
                          ? 'text-[#1d4ed8]'
                          : 'text-[var(--ink-soft)]'
                    }`}
                  >
                    {stage.label}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-center text-xs text-[var(--ink-soft)]">
              Please keep this tab open — we will show you the results here.
            </p>
          </div>
        )}

        {/* Step 3 — Results */}
        {step === 'result' && result && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-[family:var(--font-display)] text-lg tracking-[-0.02em] text-emerald-900">
                    Analysis complete
                  </h3>
                  <p className="text-xs text-emerald-700/80">
                    Processed in {(result.momGeneration.processingTimeMs / 1000).toFixed(1)}s
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { value: result.transcriptEventsCreated, label: 'Lines parsed' },
                  { value: result.momGeneration.itemsCreated, label: 'Items extracted' },
                  { value: result.momGeneration.highlightsCreated, label: 'Highlights' },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl border border-emerald-200/60 bg-white/80 px-3 py-2.5 text-center"
                  >
                    <p className="font-[family:var(--font-display)] text-2xl tracking-[-0.03em] text-emerald-800">
                      {s.value}
                    </p>
                    <p className="mt-0.5 text-[11px] text-emerald-700/80">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {result.momGeneration.error && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-800">
                <span className="font-medium">Partial result:</span> {result.momGeneration.error}
              </div>
            )}

            <div className="rounded-2xl border border-black/6 bg-[linear-gradient(180deg,#f8fbff,#fffef8)] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--ink-soft)]">
                Generated artifacts
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {result.momGeneration.momId && (
                  <span className="rounded-full border border-[#1d4ed8]/20 bg-[#eff6ff] px-3 py-1 text-xs font-medium text-[#1d4ed8]">
                    Executive summary
                  </span>
                )}
                {result.momGeneration.momId && (
                  <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700">
                    Detailed minutes
                  </span>
                )}
                {result.momGeneration.itemsCreated > 0 && (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                    Action items
                  </span>
                )}
                {result.momGeneration.highlightsCreated > 0 && (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                    Highlights
                  </span>
                )}
                <span className="rounded-full border border-black/8 bg-white px-3 py-1 text-xs font-medium text-[var(--ink-muted)]">
                  Full transcript
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-black/8 bg-white px-4 py-2.5 text-sm font-medium text-[var(--ink-muted)] transition hover:border-black/12 hover:text-[var(--ink-strong)]"
              >
                Back to project
              </button>
              <button
                onClick={() => {
                  onClose();
                  router.push(`/meetings/${result.meetingId}`);
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#1d4ed8,#0891b2)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(13,77,170,0.16)] transition hover:-translate-y-0.5"
              >
                View meeting details
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
