"use client";

import { motion } from "framer-motion";
import { Check, Sparkles, X } from "lucide-react";
import type { PlaygroundNote } from "@/lib/playground-queries";
import type { MergeReview } from "@/hooks/usePlaygroundSync";

function NotesPreview({ title, notes }: { title: string; notes: PlaygroundNote[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-2">{title}</div>
      <div className="space-y-2 max-h-28 overflow-y-auto pr-1">
        {notes.slice(-3).map((note) => (
          <div key={note.id} className="rounded-lg bg-slate-950/70 border border-white/10 p-2">
            <p className="text-sm text-slate-100 whitespace-pre-wrap wrap-break-word">{note.text}</p>
            <p className="mt-1 text-[10px] text-slate-500 font-mono uppercase">
              {note.id} • {new Date(note.timestamp).toLocaleTimeString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MergeReviewCard({
  review,
  onApprove,
  onDismiss,
}: {
  review: MergeReview;
  onApprove: () => void;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-3xl border border-amber-400/30 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-2xl overflow-hidden"
    >
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-amber-400/15 text-amber-300 flex items-center justify-center">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">AI merge review</div>
            <div className="text-xs text-slate-400">
              Local semantic merge suggestion is ready for approval.
            </div>
          </div>
        </div>
        <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200">
          Opt in
        </span>
      </div>

      <div className="grid gap-4 p-5 lg:grid-cols-[1fr_1.15fr]">
        <NotesPreview title="Local draft" notes={review.localNotes} />
        <NotesPreview title="Peer draft" notes={review.remoteNotes} />
      </div>

      <div className="border-t border-white/10 px-5 py-4 bg-slate-950/60">
        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-2">
          Suggested merge
        </div>
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/8 p-4">
          <div className="space-y-2">
            {review.suggestion.map((note) => (
              <div key={note.id} className="rounded-xl bg-slate-950/80 border border-white/10 p-3">
                <p className="text-sm text-white whitespace-pre-wrap wrap-break-word">{note.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onApprove}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-transform hover:scale-[1.01]"
          >
            <Check className="h-4 w-4" />
            Approve merge
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10"
          >
            <X className="h-4 w-4" />
            Keep reviewing
          </button>
          <p className="text-xs text-slate-400">
            Approval applies the merged state to both clients and records the sync event.
          </p>
        </div>
      </div>
    </motion.div>
  );
}