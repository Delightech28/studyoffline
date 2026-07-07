"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppNavbar from "@/components/AppNavbar";
import OfflineToggle from "@/components/OfflineToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  getAllChats,
  getAllNotes,
  getNoteResult,
  deleteChat,
  deleteNote,
  type CachedChat,
  type StoredNote,
  type NoteResult,
} from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = "qa" | "notes";

interface NoteWithResult extends StoredNote {
  result: NoteResult | null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HistoryPage() {
  const [activeTab, setActiveTab]   = useState<Tab>("qa");
  const [chats, setChats]           = useState<CachedChat[]>([]);
  const [notes, setNotes]           = useState<NoteWithResult[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [expandedChat, setExpandedChat] = useState<string | null>(null);
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  const [expandedQ, setExpandedQ]   = useState<Record<string, boolean>>({});

  // ── Load everything from IndexedDB on mount ────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [allChats, allNotes] = await Promise.all([getAllChats(), getAllNotes()]);

        // Attach AI results to each note
        const notesWithResults: NoteWithResult[] = await Promise.all(
          allNotes.map(async (note) => ({
            ...note,
            result: await getNoteResult(note.id),
          }))
        );

        setChats(allChats);
        setNotes(notesWithResults);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Delete handlers ────────────────────────────────────────────────────────
  const handleDeleteChat = async (id: string) => {
    await deleteChat(id);
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (expandedChat === id) setExpandedChat(null);
  };

  const handleDeleteNote = async (id: string) => {
    await deleteNote(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (expandedNote === id) setExpandedNote(null);
  };

  // ── Filtered lists ─────────────────────────────────────────────────────────
  const q = search.toLowerCase();
  const filteredChats = chats.filter(
    (c) => c.question.toLowerCase().includes(q) || c.answer.toLowerCase().includes(q)
  );
  const filteredNotes = notes.filter((n) => n.name.toLowerCase().includes(q));

  // ── Format date ───────────────────────────────────────────────────────────
  const fmt = (ts: number) =>
    new Date(ts).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 no-scrollbar">
      <AppNavbar title="History" />
      <OfflineToggle />

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8">

          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">History</h1>
              <p className="text-slate-500 text-sm mt-1">
                All your cached Q&amp;As and processed notes — fully available offline.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="secondary">{chats.length} answers</Badge>
              <Badge variant="secondary">{notes.length} notes</Badge>
            </div>
          </div>

          {/* ── Search ── */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions, answers, or note names…"
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              aria-label="Search history"
            />
          </div>

          {/* ── Tabs ── */}
          <div className="flex border-b border-slate-200 gap-0">
            {(["qa", "notes"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab === "qa" ? `💬 Q&A (${filteredChats.length})` : `📄 Notes (${filteredNotes.length})`}
              </button>
            ))}
          </div>

          {/* ── Loading skeleton ── */}
          {loading && (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col gap-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          )}

          {/* ── Q&A Tab ── */}
          {!loading && activeTab === "qa" && (
            <div className="flex flex-col gap-3">
              {filteredChats.length === 0 ? (
                <EmptyState
                  icon="💬"
                  title={search ? "No matches found" : "No cached answers yet"}
                  description={
                    search
                      ? "Try a different search term."
                      : "Ask a question on the Ask page — every AI response is automatically saved here."
                  }
                  action={!search ? { href: "/ask", label: "Ask a question" } : undefined}
                />
              ) : (
                filteredChats.map((chat) => (
                  <Card
                    key={chat.id}
                    className={`transition-all duration-200 ${expandedChat === chat.id ? "ring-2 ring-blue-200" : "hover:shadow-md"}`}
                  >
                    <CardContent className="p-0">
                      {/* Question row */}
                      <button
                        className="w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-slate-50/60 transition-colors rounded-t-2xl"
                        onClick={() => setExpandedChat(expandedChat === chat.id ? null : chat.id)}
                        aria-expanded={expandedChat === chat.id}
                      >
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2">{chat.question}</p>
                          <p className="text-xs text-slate-400 mt-1">{fmt(chat.timestamp)}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <Badge variant={chat.source === "cache" ? "success" : "default"}>
                            {chat.source === "cache" ? "Cached" : "AI"}
                          </Badge>
                          <svg
                            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${expandedChat === chat.id ? "rotate-180" : ""}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                          </svg>
                        </div>
                      </button>

                      {/* Answer */}
                      {expandedChat === chat.id && (
                        <div className="border-t border-slate-100">
                          <div className="px-5 py-4 flex items-start gap-3">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                              </svg>
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap flex-1">{chat.answer}</p>
                          </div>
                          <div className="px-5 pb-4 flex items-center justify-between gap-3 border-t border-slate-50 pt-3">
                            <Link
                              href={`/ask`}
                              className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
                            >
                              Ask a follow-up →
                            </Link>
                            <button
                              onClick={() => handleDeleteChat(chat.id)}
                              className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
                              aria-label="Delete this answer"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* ── Notes Tab ── */}
          {!loading && activeTab === "notes" && (
            <div className="flex flex-col gap-3">
              {filteredNotes.length === 0 ? (
                <EmptyState
                  icon="📄"
                  title={search ? "No matches found" : "No notes uploaded yet"}
                  description={
                    search
                      ? "Try a different search term."
                      : "Upload a PDF on the Upload Notes page — summaries, concepts, and practice questions are saved here."
                  }
                  action={!search ? { href: "/upload", label: "Upload notes" } : undefined}
                />
              ) : (
                filteredNotes.map((note) => (
                  <Card
                    key={note.id}
                    className={`transition-all duration-200 ${expandedNote === note.id ? "ring-2 ring-indigo-200" : "hover:shadow-md"}`}
                  >
                    <CardContent className="p-0">
                      {/* Note header row */}
                      <button
                        className="w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-slate-50/60 transition-colors rounded-t-2xl"
                        onClick={() => setExpandedNote(expandedNote === note.id ? null : note.id)}
                        aria-expanded={expandedNote === note.id}
                      >
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 text-sm truncate">{note.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{fmt(note.timestamp)}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          {note.result
                            ? <Badge variant="success">AI Processed</Badge>
                            : <Badge variant="secondary">Raw Only</Badge>
                          }
                          <svg
                            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${expandedNote === note.id ? "rotate-180" : ""}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                          </svg>
                        </div>
                      </button>

                      {/* Note expanded content */}
                      {expandedNote === note.id && note.result && (
                        <div className="border-t border-slate-100">
                          <NoteResultView
                            result={note.result}
                            expandedQ={expandedQ}
                            onToggleQ={(key) =>
                              setExpandedQ((prev) => ({ ...prev, [key]: !prev[key] }))
                            }
                          />
                          <div className="px-5 pb-4 flex items-center justify-between border-t border-slate-50 pt-3">
                            <Link href="/upload" className="text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors">
                              Open in Upload page →
                            </Link>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
                              aria-label="Delete this note"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Note with no AI result yet */}
                      {expandedNote === note.id && !note.result && (
                        <div className="border-t border-slate-100 px-5 py-5 flex flex-col gap-3">
                          <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                            </svg>
                            Raw notes saved — AI summary not yet generated. Open the Upload page to process this note.
                          </div>
                          <Link href="/upload">
                            <Button size="sm" variant="outline">Generate Summary</Button>
                          </Link>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function EmptyState({
  icon, title, description, action,
}: {
  icon: string;
  title: string;
  description: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col items-center text-center py-20 gap-5 select-none animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl">
        {icon}
      </div>
      <div>
        <p className="font-bold text-slate-700 text-lg">{title}</p>
        <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto leading-relaxed">{description}</p>
      </div>
      {action && (
        <Link href={action.href}>
          <Button size="sm">{action.label}</Button>
        </Link>
      )}
    </div>
  );
}

function NoteResultView({
  result,
  expandedQ,
  onToggleQ,
}: {
  result: NoteResult;
  expandedQ: Record<string, boolean>;
  onToggleQ: (key: string) => void;
}) {
  const [tab, setTab] = useState<"summary" | "concepts" | "questions">("summary");

  return (
    <div className="flex flex-col">
      {/* Mini tab bar */}
      <div className="flex border-b border-slate-100 bg-slate-50/60">
        {(["summary", "concepts", "questions"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-semibold capitalize transition-all border-b-2 ${
              tab === t
                ? "border-blue-500 text-blue-600 bg-white"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {t === "summary" ? "📋 Summary" : t === "concepts" ? "💡 Concepts" : "✏️ Questions"}
          </button>
        ))}
      </div>

      <div className="px-5 py-4">
        {tab === "summary" && (
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {result.summary}
          </p>
        )}

        {tab === "concepts" && (
          <ul className="flex flex-col gap-2">
            {result.concepts.map((c, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {c}
              </li>
            ))}
          </ul>
        )}

        {tab === "questions" && (
          <div className="flex flex-col gap-3">
            {result.questions.map((q, i) => {
              const key = `${result.id}-${i}`;
              const open = !!expandedQ[key];
              return (
                <div key={i} className="rounded-xl border border-slate-100 overflow-hidden">
                  <button
                    onClick={() => onToggleQ(key)}
                    className="w-full flex items-start gap-2.5 px-4 py-3 text-left hover:bg-blue-50/40 transition-colors"
                    aria-expanded={open}
                  >
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm font-semibold text-slate-800 leading-snug">{q.q}</span>
                    <svg
                      className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                  {open && (
                    <div className="px-4 pb-3 pt-1 border-t border-slate-100 flex items-start gap-2">
                      <span className="text-[10px] font-bold text-emerald-600 flex-shrink-0 mt-0.5">ANS</span>
                      <p className="text-sm text-slate-600 leading-relaxed">{q.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
