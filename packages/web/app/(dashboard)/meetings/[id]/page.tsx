'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

import { ItemsWorkspace } from '@/components/items/ItemsWorkspace';
import {
  meetingsApi,
  meetingItemsApi,
  momApi,
  Meeting,
  Highlight,
  MeetingItem,
  MeetingItemStatus,
  MeetingItemUpdateInput,
  MoM,
  TranscriptEvent,
  BACKEND_BASE_URL,
} from '@/lib/api';

const markdownComponents = {
  h1: (props: React.ComponentProps<'h1'>) => <h1 className="mb-2 mt-5 text-lg font-semibold text-[var(--ink-strong)]" {...props} />,
  h2: (props: React.ComponentProps<'h2'>) => <h2 className="mb-2 mt-4 text-base font-semibold text-[var(--ink-strong)]" {...props} />,
  h3: (props: React.ComponentProps<'h3'>) => <h3 className="mb-2 mt-4 text-sm font-semibold text-[var(--ink-muted)]" {...props} />,
  p: (props: React.ComponentProps<'p'>) => <p className="mb-3 text-sm leading-relaxed text-[var(--ink-muted)] last:mb-0" {...props} />,
  ul: (props: React.ComponentProps<'ul'>) => <ul className="mb-3 list-disc space-y-1 pl-5 text-sm text-[var(--ink-muted)]" {...props} />,
  ol: (props: React.ComponentProps<'ol'>) => <ol className="mb-3 list-decimal space-y-1 pl-5 text-sm text-[var(--ink-muted)]" {...props} />,
  li: (props: React.ComponentProps<'li'>) => <li className="leading-relaxed" {...props} />,
  strong: (props: React.ComponentProps<'strong'>) => <strong className="font-semibold text-[var(--ink-strong)]" {...props} />,
  em: (props: React.ComponentProps<'em'>) => <em className="italic text-[var(--ink-muted)]" {...props} />,
  code: (props: React.ComponentProps<'code'>) => <code className="rounded bg-[#eff6ff] px-1 py-0.5 text-[0.9em] text-[#1d4ed8]" {...props} />,
};

interface EvidenceMetadata {
  generatedBy?: string;
  sourceQuote?: string;
  context?: string;
  relationType?: string;
  alertType?: string;
}

function normalizeMetadata(metadata: MeetingItem['metadata']): EvidenceMetadata {
  if (!metadata || typeof metadata !== 'object') return {};
  return metadata as EvidenceMetadata;
}

function humanizeKey(value?: string | null): string | null {
  if (!value) return null;
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatConfidence(confidence?: number | null): string | null {
  if (typeof confidence !== 'number') return null;
  return `${Math.round(confidence * 100)}% confidence`;
}

function buildTranscriptSnippet(
  item: MeetingItem,
  transcripts: TranscriptEvent[]
): { quote: string | null; spanLabel: string | null } {
  const metadata = normalizeMetadata(item.metadata);
  const directQuote =
    typeof metadata.sourceQuote === 'string' && metadata.sourceQuote.trim().length > 0
      ? metadata.sourceQuote.trim()
      : null;

  if (directQuote) {
    const range = item.sourceTranscriptRange;
    return {
      quote: directQuote,
      spanLabel:
        range && typeof range.startSeq === 'number' && typeof range.endSeq === 'number'
          ? `Segments ${range.startSeq}-${range.endSeq}`
          : null,
    };
  }

  const range = item.sourceTranscriptRange;
  if (!range || typeof range.startSeq !== 'number' || typeof range.endSeq !== 'number') {
    return { quote: null, spanLabel: null };
  }

  const relatedEvents = transcripts.filter(
    (event) => event.sequenceNumber >= range.startSeq && event.sequenceNumber <= range.endSeq
  );

  if (relatedEvents.length === 0) {
    return {
      quote: null,
      spanLabel: `Segments ${range.startSeq}-${range.endSeq}`,
    };
  }

  const quote = relatedEvents
    .slice(0, 3)
    .map((event) => `${event.speaker}: ${event.content}`)
    .join(' ');

  return {
    quote,
    spanLabel: `Segments ${range.startSeq}-${range.endSeq}`,
  };
}

function buildEvidenceChips(item: MeetingItem): string[] {
  const metadata = normalizeMetadata(item.metadata);

  return [metadata.generatedBy, metadata.relationType, metadata.alertType]
    .map((value) => humanizeKey(value))
    .filter((value): value is string => Boolean(value));
}

function EvidenceTraceSection({
  items,
  transcripts,
}: {
  items: MeetingItem[];
  transcripts: TranscriptEvent[];
}) {
  const evidenceItems = useMemo(
    () =>
      items
        .map((item) => {
          const metadata = normalizeMetadata(item.metadata);
          const snippet = buildTranscriptSnippet(item, transcripts);
          const confidenceLabel = formatConfidence(item.aiConfidence);
          const evidenceChips = buildEvidenceChips(item);
          const context =
            typeof metadata.context === 'string' && metadata.context.trim().length > 0
              ? metadata.context.trim()
              : null;

          return {
            item,
            confidenceLabel,
            evidenceChips,
            snippet,
            context,
          };
        })
        .filter(
          ({ confidenceLabel, evidenceChips, snippet, context }) =>
            Boolean(confidenceLabel) ||
            evidenceChips.length > 0 ||
            Boolean(snippet.quote) ||
            Boolean(snippet.spanLabel) ||
            Boolean(context)
        ),
    [items, transcripts]
  );

  if (evidenceItems.length === 0) {
    return null;
  }

  return (
    <div className="rounded-[1.4rem] border border-black/6 bg-white/84 p-5 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
      <div className="mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#1d4ed8]">
          Evidence Trace
        </h3>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          These cards show why the system created an item, including transcript evidence, AI
          confidence, and carry-forward signals when they exist.
        </p>
      </div>

      <div className="space-y-4">
        {evidenceItems.map(({ item, confidenceLabel, evidenceChips, snippet, context }) => (
          <div
            key={item.id}
            className="rounded-[1.2rem] border border-black/6 bg-[linear-gradient(180deg,#f8fbff,#fffef8)] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[var(--ink-strong)]">{item.title}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--ink-soft)]">
                  {item.itemType.replace(/_/g, ' ')}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {confidenceLabel && (
                  <span className="rounded-full border border-[#1d4ed8]/15 bg-[#eff6ff] px-2.5 py-1 text-[11px] font-medium text-[#1d4ed8]">
                    {confidenceLabel}
                  </span>
                )}
                {snippet.spanLabel && (
                  <span className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[11px] font-medium text-[var(--ink-muted)]">
                    {snippet.spanLabel}
                  </span>
                )}
                {evidenceChips.map((chip) => (
                  <span
                    key={`${item.id}-${chip}`}
                    className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[11px] font-medium text-cyan-700"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            {snippet.quote && (
              <blockquote className="mt-3 rounded-xl border-l-2 border-[#1d4ed8] bg-white/80 px-4 py-3 text-sm leading-relaxed text-[var(--ink-muted)]">
                {snippet.quote}
              </blockquote>
            )}

            {context && (
              <p className="mt-3 text-sm leading-relaxed text-[var(--ink-soft)]">
                <span className="font-medium text-[var(--ink-strong)]">Context:</span> {context}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function getCaptureSourceMeta(captureSource?: string | null) {
  switch (captureSource) {
    case 'manual':
      return {
        label: 'Transcript upload',
        badgeClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        note: 'This is the most reliable capture path today and is the recommended flow for demos and reviews.',
      };
    case 'bot':
      return {
        label: 'Bot preview',
        badgeClassName: 'border-amber-200 bg-amber-50 text-amber-700',
        note: 'Bot capture is still in development. Join reliability can vary depending on Google auth, waiting rooms, and meeting permissions.',
      };
    case 'extension':
      return {
        label: 'Extension preview',
        badgeClassName: 'border-cyan-200 bg-cyan-50 text-cyan-700',
        note: 'Extension audio capture works, but multi-speaker transcription with speaker-attributed labels is still being improved.',
      };
    default:
      return null;
  }
}

function AnalysisBanner({ meetingId, onComplete }: { meetingId: string; onComplete: () => Promise<void> }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    setBannerError(null);
    try {
      await meetingsApi.generateMom(meetingId);
      await meetingsApi.extractItems(meetingId);
      await onComplete();
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="mb-6 rounded-[1.4rem] border border-amber-200 bg-gradient-to-r from-amber-50 to-amber-50/60 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100">
            <svg className="h-4 w-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-amber-900">
              {bannerError ? 'Analysis failed' : 'Transcript available — analysis not yet run'}
            </p>
            <p className="text-xs text-amber-700">
              {bannerError || 'Click to generate the executive summary, action items, and highlights.'}
            </p>
          </div>
        </div>
        <button
          onClick={handleRunAnalysis}
          disabled={analyzing}
          className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#1d4ed8,#0891b2)] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(13,77,170,0.16)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {analyzing ? (
            <>
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Analyzing…
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {bannerError ? 'Retry Analysis' : 'Run Analysis'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function MeetingDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptEvent[]>([]);
  const [mom, setMom] = useState<MoM | null>(null);
  const [items, setItems] = useState<MeetingItem[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAudio, setHasAudio] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'items' | 'transcript'>('summary');
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const meetingRef = useRef<Meeting | null>(null);
  const captureSourceMeta = getCaptureSourceMeta(meeting?.captureSource);

  useEffect(() => { meetingRef.current = meeting; }, [meeting]);

  useEffect(() => {
    async function loadData() {
      try {
        const [meetingData, transcriptsData, momData, itemsData, highlightsData] = await Promise.all([
          meetingsApi.get(id),
          meetingsApi.getTranscripts(id),
          momApi.getByMeeting(id).catch(() => ({ mom: null })),
          meetingsApi.getItems(id).catch(() => ({ items: [] })),
          momApi.getHighlights(id).catch(() => ({ highlights: [] })),
        ]);
        setMeeting(meetingData.meeting);
        setTranscripts(transcriptsData.events || []);
        if (momData.mom) setMom(momData.mom);
        setItems(itemsData.items || []);
        setHighlights(highlightsData.highlights || []);

        // Auto-select best tab
        if (momData.mom || (highlightsData.highlights && highlightsData.highlights.length > 0)) {
          setActiveTab('summary');
        } else if (itemsData.items && itemsData.items.length > 0) {
          setActiveTab('items');
        } else {
          setActiveTab('transcript');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load meeting details');
      } finally {
        setLoading(false);
      }
    }
    if (id) loadData();

    const interval = setInterval(async () => {
      const current = meetingRef.current;
      if (!current || current.status !== 'in_progress') return;
      try {
        const [meetingData, transcriptsData] = await Promise.all([
          meetingsApi.get(id),
          meetingsApi.getTranscripts(id),
        ]);
        setMeeting(meetingData.meeting);
        setTranscripts(transcriptsData.events || []);
      } catch { /* silent */ }
    }, 3000);

    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (meeting?.status === 'in_progress' && transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcripts.length, meeting?.status]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1d4ed8] border-t-transparent" />
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="space-y-4">
        <Link
          href="/meetings"
          className="inline-flex items-center gap-2 text-sm text-[var(--ink-muted)] transition hover:text-[var(--ink-strong)]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to meetings
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error || 'Meeting not found'}
        </div>
      </div>
    );
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleItemStatusChange = async (itemId: string, status: MeetingItemStatus) => {
    const response = await meetingItemsApi.updateStatus(itemId, status, 'meeting_workspace');
    const updatedItem = response.item;
    setItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, ...updatedItem } : item))
    );
  };

  const handleItemUpdate = async (itemId: string, updates: MeetingItemUpdateInput) => {
    const response = await meetingItemsApi.update(itemId, updates);
    const updatedItem = response.item;
    setItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, ...updatedItem } : item))
    );
  };

  const hasMoMContent = mom || items.length > 0 || highlights.length > 0;
  const primaryBackHref = meeting.project?.id ? `/projects/${meeting.project.id}` : '/meetings';
  const primaryBackLabel = meeting.project?.name
    ? `Back to ${meeting.project.name}`
    : 'Back to meetings';

  return (
    <div className="max-w-[1100px]">
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Link
          href={primaryBackHref}
          className="inline-flex items-center gap-2 text-sm text-[var(--ink-muted)] transition hover:text-[var(--ink-strong)]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {primaryBackLabel}
        </Link>
        {meeting.project?.id && (
          <Link
            href="/meetings"
            className="inline-flex items-center gap-2 text-sm text-[var(--ink-soft)] transition hover:text-[var(--ink-strong)]"
          >
            All meetings
          </Link>
        )}
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-[family:var(--font-display)] text-3xl tracking-[-0.04em] text-[var(--ink-strong)]">{meeting.title}</h1>
        {meeting.project?.id && (
          <div className="mt-2">
            <Link
              href={`/projects/${meeting.project.id}`}
              className="inline-flex items-center gap-2 text-xs px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500/15 transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              Project workspace: {meeting.project.name}
            </Link>
          </div>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-[var(--ink-soft)]">
          <span>{meeting.startTime ? new Date(meeting.startTime).toLocaleString() : 'No date'}</span>
          <span className="text-black/20">|</span>
          <span>{transcripts.length} segments</span>
          {items.length > 0 && (
            <>
              <span className="text-black/20">|</span>
              <span>{items.length} items extracted</span>
            </>
          )}
          {meeting.captureSource && (
            <>
              <span className="text-black/20">|</span>
              <span className="capitalize">{meeting.captureSource}</span>
            </>
          )}
          {meeting.status === 'in_progress' && (
            <span className="text-green-400 flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Live
            </span>
          )}
        </div>

        {captureSourceMeta && (
          <div className="mt-3 inline-flex max-w-3xl flex-col gap-2 rounded-[1rem] border border-black/6 bg-white/82 px-3.5 py-3 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${captureSourceMeta.badgeClassName}`}
              >
                {captureSourceMeta.label}
              </span>
              <span className="text-xs text-[var(--ink-soft)]">Capture maturity note</span>
            </div>
            <p className="text-xs leading-relaxed text-[var(--ink-muted)]">{captureSourceMeta.note}</p>
          </div>
        )}
      </div>

      {/* Audio Player */}
      <div className="mb-6 rounded-[1.4rem] border border-black/6 bg-white/84 p-4 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#eff6ff]">
            <svg className="h-4 w-4 text-[#1d4ed8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a3 3 0 00-3 3v7a3 3 0 006 0V5a3 3 0 00-3-3z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 10v2a7 7 0 01-14 0v-2" />
            </svg>
          </div>
          <div className="flex-1">
            {meeting.status === 'in_progress' ? (
              <div className="flex items-center gap-2 text-sm text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Recording in progress...
              </div>
            ) : hasAudio ? (
              <audio
                controls
                className="w-full h-8"
                src={`${BACKEND_BASE_URL}/api/v1/meetings/${id}/audio`}
                preload="metadata"
                onError={() => setHasAudio(false)}
              />
            ) : (
              <p className="text-sm text-[var(--ink-soft)]">No audio recording available</p>
            )}
          </div>
        </div>
      </div>

      {/* Analysis prompt — show when transcripts exist but no analysis */}
      {!mom && transcripts.length > 0 && meeting.status !== 'in_progress' && (
        <AnalysisBanner meetingId={id} onComplete={async () => {
          const [momData, itemsData, highlightsData] = await Promise.all([
            momApi.getByMeeting(id).catch(() => ({ mom: null })),
            meetingsApi.getItems(id).catch(() => ({ items: [] })),
            momApi.getHighlights(id).catch(() => ({ highlights: [] })),
          ]);
          if (momData.mom) setMom(momData.mom);
          setItems(itemsData.items || []);
          setHighlights(highlightsData.highlights || []);
          if (momData.mom) setActiveTab('summary');
        }} />
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-black/8">
        {([
          { key: 'summary' as const, label: 'Summary', show: hasMoMContent },
          { key: 'items' as const, label: 'Action Items', count: items.length, show: true },
          { key: 'transcript' as const, label: 'Transcript', count: transcripts.length, show: true },
        ]).filter(t => t.show).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-[2px] flex items-center gap-2 ${
              activeTab === tab.key
                ? 'border-[#1d4ed8] text-[var(--ink-strong)]'
                : 'border-transparent text-[var(--ink-soft)] hover:text-[var(--ink-strong)]'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-md ${
                activeTab === tab.key ? 'bg-[#eff6ff] text-[#1d4ed8]' : 'bg-slate-100 text-[var(--ink-soft)]'
              }`}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Summary Tab ── */}
      {activeTab === 'summary' && hasMoMContent && (
        <div className="space-y-4">
          <EvidenceTraceSection items={items} transcripts={transcripts} />

          {/* Executive Summary */}
          {mom?.executiveSummary && (
            <div className="rounded-[1.4rem] border border-black/6 bg-white/84 p-5 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#1d4ed8]">Executive Summary</h3>
              <p className="text-sm leading-relaxed text-[var(--ink-muted)]">{mom.executiveSummary}</p>
            </div>
          )}

          {/* Detailed Summary */}
          {mom?.detailedSummary && (
            <div className="rounded-[1.4rem] border border-black/6 bg-white/84 p-5 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--ink-soft)]">Detailed Minutes</h3>
              <div className="max-w-none">
                <ReactMarkdown components={markdownComponents}>{mom.detailedSummary}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* Highlights */}
          {highlights.length > 0 && (
            <div className="rounded-[1.4rem] border border-black/6 bg-white/84 p-5 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--ink-soft)]">Key Highlights</h3>
              <div className="space-y-3">
                {highlights.map((h) => (
                  <div key={h.id} className="flex gap-3 items-start">
                    <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      h.highlightType === 'key_point' ? 'bg-cyan-400' :
                      h.highlightType === 'notable_quote' ? 'bg-purple-400' :
                      h.highlightType === 'outcome' ? 'bg-green-400' : 'bg-yellow-400'
                    }`} />
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[var(--ink-soft)]">{h.highlightType.replace('_', ' ')}</span>
                      <p className="text-sm leading-relaxed text-[var(--ink-muted)]">{h.content}</p>
                      {h.speaker && <span className="text-xs text-[var(--ink-soft)]">- {h.speaker}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Meta */}
          {mom && (
            <div className="flex items-center gap-4 px-1 text-xs text-[var(--ink-soft)]">
              {mom.aiModelVersion && <span>Model: {mom.aiModelVersion}</span>}
              {mom.processingTimeMs && <span>Processed in {(mom.processingTimeMs / 1000).toFixed(1)}s</span>}
            </div>
          )}
        </div>
      )}

      {/* ── Items Tab ── */}
      {activeTab === 'items' && (
        <div className="space-y-4">
          <EvidenceTraceSection items={items} transcripts={transcripts} />
          <ItemsWorkspace
            items={items}
            meetingsById={{ [meeting.id]: meeting }}
            workspaceKey={`meeting:${id}`}
            emptyMessage="No action items extracted for this meeting."
            onStatusChange={handleItemStatusChange}
            onItemUpdate={handleItemUpdate}
          />
        </div>
      )}

      {/* ── Transcript Tab ── */}
      {activeTab === 'transcript' && (
        <div className="overflow-hidden rounded-[1.4rem] border border-black/6 bg-white/84 p-5 shadow-[0_14px_36px_rgba(15,23,42,0.04)]">
          <div className="space-y-1 max-h-[65vh] overflow-y-auto pr-2">
            {transcripts.length === 0 ? (
              <div className="py-10 text-center text-sm text-[var(--ink-soft)]">
                {meeting.status === 'in_progress'
                  ? 'Waiting for captions...'
                  : 'No transcript captured for this meeting.'}
              </div>
            ) : (
              transcripts.map((event, i) => {
                const prevEvent = i > 0 ? transcripts[i - 1] : null;
                const isNewSpeaker = !prevEvent || prevEvent.speaker !== event.speaker;

                return (
                  <div key={event.id} className={`flex gap-3 ${isNewSpeaker ? 'mt-4' : 'mt-0.5'}`}>
                    {isNewSpeaker ? (
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#eff6ff] text-xs font-bold uppercase text-[#1d4ed8]">
                        {event.speaker.substring(0, 2)}
                      </div>
                    ) : (
                      <div className="w-8 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      {isNewSpeaker && (
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span className="text-sm font-medium text-[var(--ink-strong)]">{event.speaker}</span>
                          <span className="text-[11px] text-[var(--ink-soft)]">{formatTime(event.capturedAt)}</span>
                        </div>
                      )}
                      <p className="text-sm leading-relaxed text-[var(--ink-muted)]">{event.content}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}
