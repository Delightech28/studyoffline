"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import ChatMessage from "@/components/chat/ChatMessage";
import TypingIndicator from "@/components/chat/TypingIndicator";
import SuggestionChips from "@/components/chat/SuggestionChips";
import AppNavbar from "@/components/AppNavbar";
import {
  findCachedAnswer,
  saveChat,
  getAllPending,
  enqueuePending,
  deletePending,
  type CachedChat,
} from "@/lib/db";

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
  source?: CachedChat["source"];
  timestamp: number;
}

export default function AskPage() {
  const [messages, setMessages]         = useState<Message[]>([]);
  const [input, setInput]               = useState("");
  const [isLoading, setIsLoading]       = useState(false);
  const [isOnline, setIsOnline]         = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  const bottomRef     = useRef<HTMLDivElement>(null);
  const textareaRef   = useRef<HTMLTextAreaElement>(null);
  const processingRef = useRef(false);

  // ── Scroll to bottom ───────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // ── Online / offline ───────────────────────────────────────────────────────
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline  = () => { setIsOnline(true);  processPendingQueue(); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const notify = (msg: string, duration = 5000) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), duration);
  };

  // ── Process pending queue ──────────────────────────────────────────────────
  const processPendingQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      const pending = await getAllPending();
      if (!pending.length) return;
      notify(`Connection restored — processing ${pending.length} pending question${pending.length > 1 ? "s" : ""}…`);
      for (const item of pending) {
        await deletePending(item.id);
        await askAI(item.question, true);
      }
    } finally {
      processingRef.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Core ask function ──────────────────────────────────────────────────────
  const askAI = async (question: string, silent = false) => {
    const trimmed = question.trim();
    if (!trimmed) return;
    const ts = Date.now();

    if (!silent) {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "user", text: trimmed, timestamp: ts },
      ]);
    }
    setIsLoading(true);

    // 1 — cache first
    const cached = await findCachedAnswer(trimmed);
    if (cached) {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "ai", text: cached.answer, source: "cache", timestamp: Date.now() },
      ]);
      setIsLoading(false);
      return;
    }

    // 2 — offline, no cache
    if (!navigator.onLine) {
      await enqueuePending({ id: crypto.randomUUID(), question: trimmed, timestamp: Date.now() });
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "ai",
          text: "⚠️ You're offline and this question hasn't been asked before.\n\nIt's been saved to your queue and will be answered automatically once your connection returns.\n\nCheck your History for previously cached answers.",
          timestamp: Date.now(),
        },
      ]);
      setIsLoading(false);
      return;
    }

    // 3 — call API
    try {
      const res  = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "Unknown error");

      const answer: string = data.answer;
      await saveChat({ id: crypto.randomUUID(), question: trimmed, answer, timestamp: Date.now(), source: "api" });

      setMessages((prev) => [
        ...prev,
        ...(silent ? [{ id: crypto.randomUUID(), role: "user" as const, text: trimmed, timestamp: ts }] : []),
        { id: crypto.randomUUID(), role: "ai" as const, text: answer, source: "api" as const, timestamp: Date.now() },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "ai", text: `❌ Error: ${msg}\n\nPlease try again.`, timestamp: Date.now() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;
    const q = input.trim();
    setInput("");
    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    textareaRef.current?.focus();
    await askAI(q);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen overflow-hidden">

      <AppNavbar title="Ask StudyOffline" notification={notification} />

      {/* ════════════════════════════════════════
          MESSAGES AREA
      ════════════════════════════════════════ */}
      <main className="flex-1 overflow-y-auto no-scrollbar chat-bg chat-messages">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-5 min-h-full">

          {/* Empty state */}
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center text-center flex-1 py-20 gap-6 select-none animate-fade-in">

              {/* Icon */}
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-200">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                </div>
                {/* Floating status dot */}
                <span
                  className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${isOnline ? "bg-emerald-500" : "bg-slate-400"}`}
                  aria-hidden="true"
                >
                  <span className={`w-2 h-2 rounded-full bg-white ${isOnline ? "animate-pulse" : ""}`} />
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold text-slate-800">Ask StudyOffline</h2>
                <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
                  Ask any question about your studies. Powered by Gemma 4 — every answer is cached locally so you can access it offline later.
                </p>
              </div>

              {!isOnline && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-4 py-2.5 rounded-xl">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  Offline — only previously cached answers available
                </div>
              )}

              {/* Quick stats */}
              <div className="flex items-center gap-6 text-xs text-slate-400 mt-2">
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                  Instant answers
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
                  </svg>
                  Cached locally
                </span>
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Works offline
                </span>
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              role={msg.role}
              text={msg.text}
              source={msg.source}
              timestamp={msg.timestamp}
            />
          ))}

          {isLoading && <TypingIndicator />}

          <div ref={bottomRef} className="h-1" />
        </div>
      </main>

      {/* ════════════════════════════════════════
          INPUT FOOTER
      ════════════════════════════════════════ */}
      <footer className="flex-shrink-0 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-[0_-8px_32px_rgba(0,0,0,0.06)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-3">

          {/* Suggestion chips — only when conversation is empty */}
          {messages.length === 0 && (
            <SuggestionChips
              onSelect={(text) => {
                setInput(text);
                textareaRef.current?.focus();
              }}
              disabled={isLoading}
            />
          )}

          {/* Input row */}
          <div className="flex items-end gap-2.5">
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isOnline
                    ? "Ask a question… (Enter to send, Shift+Enter for new line)"
                    : "Offline — type to queue your question for when you're back online"
                }
                rows={1}
                disabled={isLoading}
                className="min-h-[48px] max-h-40 leading-relaxed shadow-sm"
                style={{ height: "auto" }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = Math.min(el.scrollHeight, 160) + "px";
                }}
                aria-label="Type your question"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-12 w-12 rounded-xl flex-shrink-0 shadow-md shadow-blue-200 hover:shadow-blue-300 transition-shadow"
              aria-label="Send question"
            >
              {isLoading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5" />
                </svg>
              )}
            </Button>
          </div>

          {/* Footer meta */}
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-slate-400">
              Powered by Gemma 4 · Answers cached in your browser
            </p>
            <div className="flex items-center gap-3">
              {messages.length > 0 && (
                <Badge variant="secondary">
                  {messages.filter((m) => m.role === "ai").length} answer{messages.filter((m) => m.role === "ai").length !== 1 ? "s" : ""}
                </Badge>
              )}
              <Link
                href="/history"
                className="text-[10px] text-blue-500 hover:text-blue-700 font-medium transition-colors"
              >
                View all history →
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
