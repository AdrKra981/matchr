"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getAgentHistory, streamAgent } from "./api";
import { messageOf } from "./errors";
import type { AgentMessage } from "./types";

export type TurnStatus = "working" | "done" | "stopped" | "failed";

export interface Turn {
    id: number;
    question: string;
    /** Grows as the reply streams in. */
    reply: string;
    status: TurnStatus;
    /** When the question was asked, as an ISO timestamp. */
    askedAt: string;
    /** Loaded from saved history rather than asked while the page was open. */
    restored?: boolean;
    /** Only set when the run failed. */
    error?: string;
}

export type HistoryState = "loading" | "ready" | "failed";

/**
 * Pairs saved messages back up into question/answer turns.
 *
 * The backend saves the question when a run starts and the reply only once it
 * completes, so a question with no reply after it was stopped or failed. An
 * assistant message with no question before it lost its question to the
 * history limit, and is dropped rather than shown out of context.
 */
function toTurns(messages: AgentMessage[], nextId: () => number): Turn[] {
    const turns: Turn[] = [];
    for (const message of messages) {
        if (message.role === "user") {
            turns.push({
                id: nextId(),
                question: message.content,
                reply: "",
                status: "done",
                askedAt: message.created_at,
                restored: true,
            });
            continue;
        }
        const last = turns.at(-1);
        if (last && !last.reply) last.reply = message.content;
    }
    return turns;
}

/**
 * The assistant tab's conversation: one agent run per question.
 *
 * Past turns come from the backend's saved history when the tab opens. The
 * agent itself doesn't read that history yet, so every question still goes out
 * on its own.
 */
export function useAgent() {
    const [turns, setTurns] = useState<Turn[]>([]);
    const [history, setHistory] = useState<HistoryState>("loading");
    // The in-flight run's controller, or null when idle.
    const running = useRef<AbortController | null>(null);
    const nextId = useRef(0);

    useEffect(() => {
        let cancelled = false;
        getAgentHistory()
            .then((messages) => {
                if (cancelled) return;
                setTurns(toTurns(messages, () => nextId.current++));
                setHistory("ready");
            })
            .catch(() => {
                // Old turns are nice to have; the chat still works without them.
                if (!cancelled) setHistory("failed");
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const patch = useCallback(
        (id: number, change: (turn: Turn) => Partial<Turn>) => {
            setTurns((prev) =>
                prev.map((turn) => (turn.id === id ? { ...turn, ...change(turn) } : turn)),
            );
        },
        [],
    );

    const ask = useCallback(
        async (question: string) => {
            // One run at a time — each one spends LLM tokens and job-board quota.
            if (running.current) return;
            // Asking before history arrives would save a question that then
            // shows up twice, once live and once in the loaded history.
            if (history === "loading") return;
            const controller = new AbortController();
            running.current = controller;

            const id = nextId.current++;
            setTurns((prev) => [
                ...prev,
                { id, question, reply: "", status: "working", askedAt: new Date().toISOString() },
            ]);

            try {
                await streamAgent(
                    question,
                    (text) => patch(id, (turn) => ({ reply: turn.reply + text })),
                    controller.signal,
                );
                patch(id, () => ({ status: "done" }));
            } catch (e) {
                patch(id, () =>
                    controller.signal.aborted
                        ? { status: "stopped" }
                        : { status: "failed", error: messageOf(e) },
                );
            } finally {
                running.current = null;
            }
        },
        [patch, history],
    );

    const stop = useCallback(() => running.current?.abort(), []);

    // Leaving the tab mid-run shouldn't leave the backend working for nobody.
    useEffect(() => () => running.current?.abort(), []);

    const busy = turns.at(-1)?.status === "working";
    return { turns, history, busy, ask, stop };
}
