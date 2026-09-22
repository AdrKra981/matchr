"use client";
import { Fragment, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { AlertCircle, ArrowUp, History, RotateCw, Sparkles, Square } from "lucide-react";
import { useAgent, type Turn } from "@/lib/useAgent";
import Button from "../ui/Button";
import Markdown from "./Markdown";

/** Kept in step with the route handler, so the box stops before the server says no. */
const MAX_QUESTION_CHARS = 2000;

/** Past this the box scrolls instead of pushing the conversation off screen. */
const MAX_INPUT_HEIGHT = 160;

// Written around what the agent's tools can actually do: fetch offers and rank them.
const SUGGESTIONS = [
  "Find Python developer offers and rank them against my CV",
  "Fetch fresh frontend offers and show me the top 5",
  "Rank the offers I already have against my CV",
];

function scrollToBottom(smooth: boolean) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({
    top: document.documentElement.scrollHeight,
    behavior: smooth && !reduced ? "smooth" : "auto",
  });
}

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** "Today", "Yesterday", or a short date — the heading over each day's turns. */
function dayLabel(iso: string): string {
  const date = new Date(iso);
  const daysAgo = Math.round((startOfDay(new Date()) - startOfDay(date)) / DAY_MS);
  if (daysAgo === 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: daysAgo > 300 ? "numeric" : undefined,
  });
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function DaySeparator({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-3 text-xs font-medium text-muted">
      <span className="h-px flex-1 bg-line" aria-hidden />
      <h3>{label}</h3>
      <span className="h-px flex-1 bg-line" aria-hidden />
    </li>
  );
}

/** Stand-in bubbles while saved history loads, so the empty state doesn't flash first. */
function HistorySkeleton() {
  return (
    <div className="flex flex-col gap-8 py-4" aria-busy aria-label="Loading your conversation">
      {[0, 1].map((i) => (
        <div key={i} className="flex animate-pulse-soft flex-col gap-4">
          <div className="h-10 w-2/5 self-end rounded-2xl rounded-br-md bg-accent-soft" />
          <div className="flex gap-3">
            <div className="size-7 shrink-0 rounded-lg bg-sunken" />
            <div className="flex flex-1 flex-col gap-2 pt-1">
              <div className="h-3 w-11/12 rounded bg-sunken" />
              <div className="h-3 w-4/5 rounded bg-sunken" />
              <div className="h-3 w-3/5 rounded bg-sunken" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Silence during a tool call reads as a hang, so count the seconds out loud. */
function Working() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <p className="flex items-center gap-2.5 text-sm text-muted">
      <span className="size-1.5 animate-pulse-soft rounded-full bg-accent" aria-hidden />
      Working on it
      <span className="tabular-nums">{seconds}s</span>
    </p>
  );
}

function EmptyState({ onPick }: { onPick: (question: string) => void }) {
  return (
    <div className="flex flex-col gap-6 py-4 sm:py-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-tight text-balance">
          What kind of job are you after?
        </h2>
        <p className="max-w-prose text-[15px] leading-relaxed text-muted">
          The assistant pulls fresh offers for a role and ranks them against the
          CV you uploaded on the Matches tab.
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <li key={suggestion}>
            <button
              type="button"
              onClick={() => onPick(suggestion)}
              className="w-full rounded-xl border border-line bg-raised px-4 py-3 text-left text-sm text-ink
                transition-colors duration-150 hover:border-line-strong hover:bg-sunken"
            >
              {suggestion}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TurnItem({
  turn,
  canRetry,
  onRetry,
}: {
  turn: Turn;
  canRetry: boolean;
  onRetry: () => void;
}) {
  const working = turn.status === "working";

  return (
    <li className="flex flex-col gap-4">
      <div className="flex max-w-[85%] flex-col items-end gap-1 self-end">
        <p
          className="whitespace-pre-wrap break-words rounded-2xl rounded-br-md
            bg-accent-soft px-4 py-2.5 text-[15px] leading-relaxed text-ink"
        >
          <span className="sr-only">You asked: </span>
          {turn.question}
        </p>
        <time dateTime={turn.askedAt} className="px-1 text-xs tabular-nums text-muted">
          {timeLabel(turn.askedAt)}
        </time>
      </div>

      <div className="flex gap-3">
        <span
          aria-hidden
          className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-on"
        >
          <Sparkles className="size-3.5" />
        </span>

        <div
          aria-live="polite"
          aria-busy={working}
          className="flex min-w-0 flex-1 flex-col gap-3 pt-0.5"
        >
          <span className="sr-only">Assistant:</span>

          {turn.reply && <Markdown source={turn.reply} streaming={working} />}

          {working && <Working />}

          {turn.status === "done" && !turn.reply && (
            <p className="text-sm text-muted">
              {turn.restored
                ? "No reply was saved for this question. The run was stopped or didn't finish."
                : "The assistant finished without writing a reply. Try a more specific question."}
            </p>
          )}

          {turn.status === "stopped" && <p className="text-sm text-muted">Stopped.</p>}

          {turn.status === "failed" && (
            <div className="flex flex-col items-start gap-3 rounded-xl bg-danger-soft p-4">
              <p className="flex items-start gap-2 text-sm text-danger">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {turn.error}
              </p>
              <Button variant="secondary" size="sm" onClick={onRetry} disabled={!canRetry}>
                <RotateCw className="size-4" aria-hidden />
                Try again
              </Button>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

export default function AgentChat() {
  const { turns, history, busy, ask, stop } = useAgent();
  const [draft, setDraft] = useState("");
  const input = useRef<HTMLTextAreaElement>(null);
  const inputId = useId();

  const loading = history === "loading";
  const turnCount = turns.length;
  const lastReply = turns.at(-1)?.reply;

  // A new question always brings the page down to it. Loaded history jumps
  // straight to the latest turn instead of gliding past every old one.
  const shownCount = useRef(0);
  useEffect(() => {
    if (turnCount > 0) scrollToBottom(shownCount.current > 0);
    shownCount.current = turnCount;
  }, [turnCount]);

  // Follow the reply as it streams in — unless the reader scrolled up to look at something.
  useEffect(() => {
    if (lastReply === undefined) return;
    const root = document.documentElement;
    if (root.scrollHeight - window.innerHeight - window.scrollY < 200) {
      scrollToBottom(false);
    }
  }, [lastReply]);

  const send = (text: string) => {
    const question = text.trim();
    if (!question || busy || loading) return;
    setDraft("");
    if (input.current) {
      input.current.style.height = "";
      // The send button is about to become the stop button; keep focus somewhere useful.
      input.current.focus();
    }
    void ask(question);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends, Shift+Enter breaks the line, and neither fires mid-IME composition.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(draft);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      {history === "failed" && (
        <p className="mb-4 flex items-center gap-2 text-sm text-muted">
          <History className="size-4 shrink-0" aria-hidden />
          Couldn&apos;t load your earlier conversation. New questions still work.
        </p>
      )}

      {loading ? (
        <HistorySkeleton />
      ) : turns.length === 0 ? (
        <EmptyState onPick={send} />
      ) : (
        <ol className="flex flex-col gap-8 pb-4" aria-label="Conversation">
          {turns.map((turn, i) => {
            const day = dayLabel(turn.askedAt);
            const newDay = i === 0 || dayLabel(turns[i - 1].askedAt) !== day;
            return (
              <Fragment key={turn.id}>
                {newDay && <DaySeparator label={day} />}
                <TurnItem
                  turn={turn}
                  canRetry={!busy}
                  onRetry={() => send(turn.question)}
                />
              </Fragment>
            );
          })}
        </ol>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
        className="sticky bottom-0 mt-auto bg-surface pb-5 pt-3 sm:pb-8
          before:pointer-events-none before:absolute before:inset-x-0 before:-top-6 before:h-6
          before:bg-linear-to-t before:from-surface before:to-transparent"
      >
        <div
          className="flex items-end gap-2 rounded-2xl border border-line bg-raised p-2 pl-4 shadow-card
            transition-colors duration-150 focus-within:border-accent"
        >
          <label htmlFor={inputId} className="sr-only">
            Your question
          </label>
          {/* The box around it shows focus, so the global outline is switched off here.
              It has to be !important: that rule is unlayered and outranks utilities. */}
          <textarea
            id={inputId}
            ref={input}
            rows={1}
            value={draft}
            maxLength={MAX_QUESTION_CHARS}
            placeholder={loading ? "Loading your conversation…" : "Ask the assistant to find or rank offers"}
            onChange={(e) => {
              setDraft(e.target.value);
              // Grow with the text, up to a point.
              const el = e.target;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, MAX_INPUT_HEIGHT)}px`;
            }}
            onKeyDown={onKeyDown}
            className="max-h-40 flex-1 resize-none bg-transparent py-1.5 text-[15px] leading-6 text-ink
              outline-none! placeholder:text-muted"
          />

          {/* Keyed so React swaps the element instead of morphing one button into the other. */}
          {busy ? (
            <button
              key="stop"
              type="button"
              onClick={() => {
                stop();
                input.current?.focus();
              }}
              title="Stop"
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-ink text-surface
                transition-opacity duration-150 hover:opacity-80"
            >
              <Square className="size-3.5 fill-current" aria-hidden />
              <span className="sr-only">Stop</span>
            </button>
          ) : (
            <button
              key="send"
              type="submit"
              disabled={!draft.trim() || loading}
              title="Send"
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-on
                transition-colors duration-150 hover:bg-accent-hover
                disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-accent"
            >
              <ArrowUp className="size-4" aria-hidden />
              <span className="sr-only">Send</span>
            </button>
          )}
        </div>

        <p className="mt-2 px-1 text-xs text-muted">
          Each question starts a new run, so include everything the assistant needs
          to know.
        </p>
      </form>
    </div>
  );
}
