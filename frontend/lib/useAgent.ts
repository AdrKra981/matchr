"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { streamAgent } from "./api";
import { messageOf } from "./errors";

export type TurnStatus = "working" | "done" | "stopped" | "failed";

export interface Turn {
    id: number;
    question: string;
    /** Grows as the reply streams in. */
    reply: string;
    status: TurnStatus;
    /** Only set when the run failed. */
    error?: string;
}

/**
 * The assistant tab's conversation: one agent run per question.
 *
 * The backend keeps no history between runs, so neither does this — turns live
 * in memory while the page is open, and every question goes out on its own.
 */
export function useAgent() {
    const [turns, setTurns] = useState<Turn[]>([]);
    // The in-flight run's controller, or null when idle.
    const running = useRef<AbortController | null>(null);
    const nextId = useRef(0);

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
            const controller = new AbortController();
            running.current = controller;

            const id = nextId.current++;
            setTurns((prev) => [...prev, { id, question, reply: "", status: "working" }]);

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
        [patch],
    );

    const stop = useCallback(() => running.current?.abort(), []);

    // Leaving the tab mid-run shouldn't leave the backend working for nobody.
    useEffect(() => () => running.current?.abort(), []);

    const busy = turns.at(-1)?.status === "working";
    return { turns, busy, ask, stop };
}
