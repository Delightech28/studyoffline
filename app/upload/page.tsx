"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import AppNavbar from "@/components/AppNavbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { extractPdfText } from "@/lib/pdfExtract";
import {
  saveNote, getAllNotes, saveNoteResult, getNoteResult, deleteNote,
  type StoredNote, type NoteResult,
} from "@/lib/db";

// ── Types ─────────────────────────────────────────────────────────────────────
type Tab = "summary" | "concepts" | "questions";

interface PageState {
  note: StoredNote | null;
  result: NoteResult | null;
  activeTab: Tab;
  loading: boolean;
  loadingStage: string;
  error: string | null;
  fromCache: boolean;
}

export default function UploadPage() {
  const [isOnline, setIsOnline]         = useState(true);
  const [notification, setNotification] = useState<string | null>(null);
  const [isDragging, setIsDragging]     = useState(false);
  const [savedNotes, setSavedNotes]     = useState<StoredNote[]>([]);
  const [state, setState]               = useState<PageState>({
    note: null, result: null, activeTab: "summary",
    loading: false, loadingStage: "", error: null, fromCache: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const notify = useCallback((msg: string, duration = 5000) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), duration);
  }, []);

  // ── Online / offline ───────────────────────────────────────────────────────
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const on  = () => { setIsOnline(true); };
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  // ── Load saved notes list ──────────────────────────────────────────────────
  useEffect(() => {
    getAllNotes().then(setSavedNotes).catch(console.error);
  }, [state.note]);

  // ── Process a file ─────────────────────────────────────────────────────────
  const processFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setState((s) => ({ ...s, error: "Please upload a PDF file." }));
      return;
    }
    setState((s) => ({ ...s, loading: true, loadingStage: "Reading your notes…", error: null, fromCache: false, result: null }));

    try {
      // 1. Extract text client-side (no server, no internet needed)
      setState((s) => ({ ...s, loadingStage: "Extracting text from PDF…" }));
      const { text: content } = await extractPdfText(file);

      // 2. Save raw note to IndexedDB immediately
      const noteId = crypto.randomUUID();
      const note: StoredNote = { id: noteId, name: file.name, content, timestamp: Date.now() };
      await saveNote(note);

      setState((s) => ({ ...s, note, loadingStage: "Sending to Gemma AI…" }));

      // 3. Offline — queue AI processing
      if (!navigator.onLine) {
        setState((s) => ({
          ...s, note, loading: false,
          error: "You're offline — AI summary will generate once you're back online. Your notes are saved.",
        }));
        notify("Notes saved locally. AI will process when online.");
        return;
      }

      // 4. Call AI
      setState((s) => ({ ...s, loadingStage: "Generating summary & practice questions…" }));
      const res = await fetch("/api/process-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, filename: file.name }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "AI error"); }
      const { summary, concepts, questions } = await res.json();

      const noteResult: NoteResult = {
        id: noteId, summary, concepts, questions,
        timestamp: Date.now(), source: "api",
      };
      await saveNoteResult(noteResult);

      setState((s) => ({ ...s, note, result: noteResult, loading: false, loadingStage: "", fromCache: false }));
      notify("Notes processed and cached successfully!");
    } catch (err) {
      setState((s) => ({
        ...s, loading: false, loadingStage: "",
        error: err instanceof Error ? err.message : "Something went wrong.",
      }));
    }
  }, [notify]);

  // ── Load a saved note from IndexedDB ──────────────────────────────────────
  const loadSavedNote = async (note: StoredNote) => {
    setState((s) => ({ ...s, loading: true, loadingStage: "Loading from cache…", error: null }));
    try {
      const result = await getNoteResult(note.id);
      if (result) {
        setState((s) => ({ ...s, note, result: { ...result, source: "cache" }, loading: false, loadingStage: "", fromCache: true }));
      } else if (!navigator.onLine) {
        setState((s) => ({ ...s, note, result: null, loading: false, error: "You're offline — no cached AI results for this note yet." }));
      } else {
        // Have raw text, re-process with AI
        setState((s) => ({ ...s, note, loadingStage: "Generating AI summary…" }));
        const res = await fetch("/api/process-note", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: note.content, filename: note.name }),
        });
        if (!res.ok) throw new Error("AI processing failed");
        const { summary, concepts, questions } = await res.json();
        const noteResult: NoteResult = { id: note.id, summary, concepts, questions, timestamp: Date.now(), source: "api" };
        await saveNoteResult(noteResult);
        setState((s) => ({ ...s, note, result: noteResult, loading: false, loadingStage: "", fromCache: false }));
      }
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: err instanceof Error ? err.message : "Failed to load note." }));
    }
  };

  const handleDeleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNote(id);
    setSavedNotes((prev) => prev.filter((n) => n.id !== id));
    if (state.note?.id === id) setState((s) => ({ ...s, note: null, result: null, error: null }));
  };

  // ── Drag and drop ──────────────────────────────────────────────────────────
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const set = (tab: Tab) => setState((s) => ({ ...s, activeTab: tab }));

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <AppNavbar title="Upload Notes" notification={notification} />

      <main className="flex-1 no-scrollbar">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-10">

          {/* ── Page header ── */}
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Upload Your Notes</h1>
            <p className="text-slate-500 text-sm">
              Upload a PDF lecture note — Gemma AI will summarise it, extract key concepts, and generate practice questions.
            </p>
          </div>

          {/* ── Drop zone ── */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Upload PDF file"
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-8 py-14 cursor-pointer transition-all duration-200 select-none ${
              isDragging
                ? "border-blue-400 bg-blue-50 scale-[1.01]"
                : state.note && !state.loading
                ? "border-emerald-300 bg-emerald-50"
                : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50"
            }`}
          >
            <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileInput} aria-hidden="true" />

            {state.loading ? (
              <LoadingState stage={state.loadingStage} />
            ) : state.note ? (
              <FileReadyState name={state.note.name} fromCache={state.fromCache} onReplace={() => fileInputRef.current?.click()} />
            ) : (
              <EmptyDropState />
            )}
          </div>

          {/* ── Error ── */}
          {state.error && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3">
              <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <span>{state.error}</span>
            </div>
          )}

          {/* ── Results tabs ── */}
          {state.result && !state.loading && (
            <div className="flex flex-col gap-0 rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
              {/* Tab bar */}
              <div className="flex border-b border-slate-100 bg-slate-50/60">
                {(["summary", "concepts", "questions"] as Tab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => set(tab)}
                    className={`flex-1 py-3.5 text-sm font-semibold capitalize transition-all border-b-2 ${
                      state.activeTab === tab
                        ? "border-blue-500 text-blue-600 bg-white"
                        : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/60"
                    }`}
                  >
                    {tab === "summary" ? "📋 Summary" : tab === "concepts" ? "💡 Key Concepts" : "✏️ Practice Questions"}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="p-6">
                {/* Cache badge */}
                {state.fromCache && (
                  <div className="mb-4">
                    <Badge variant="success">
                      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                      From Cache
                    </Badge>
                  </div>
                )}

                {state.activeTab === "summary" && (
                  <div className="prose prose-slate prose-sm max-w-none">
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{state.result.summary}</p>
                  </div>
                )}

                {state.activeTab === "concepts" && (
                  <ul className="flex flex-col gap-2.5">
                    {state.result.concepts.map((c, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                        <span className="text-slate-700 text-sm leading-relaxed">{c}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {state.activeTab === "questions" && (
                  <div className="flex flex-col gap-4">
                    {state.result.questions.map((q, i) => (
                      <PracticeQuestion key={i} index={i + 1} question={q.q} answer={q.a} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── My Notes section ── */}
          {savedNotes.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">My Notes</h2>
                <Badge variant="secondary">{savedNotes.length} saved</Badge>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {savedNotes.map((note) => (
                  <Card
                    key={note.id}
                    className={`cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group ${
                      state.note?.id === note.id ? "ring-2 ring-blue-500 border-blue-200" : ""
                    }`}
                    onClick={() => loadSavedNote(note)}
                  >
                    <CardContent className="p-4 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{note.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {new Date(note.timestamp).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteNote(note.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                        aria-label="Delete note"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function EmptyDropState() {
  return (
    <>
      <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
        <svg className="w-8 h-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
      </div>
      <div className="text-center">
        <p className="font-semibold text-slate-700">Drop your PDF here</p>
        <p className="text-slate-400 text-sm mt-1">or click to browse · PDF files only</p>
      </div>
      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
          AI Summary
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
          Key Concepts
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
          Practice Questions
        </span>
      </div>
    </>
  );
}

function FileReadyState({ name, fromCache, onReplace }: { name: string; fromCache: boolean; onReplace: () => void }) {
  return (
    <>
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
        <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </div>
      <div className="text-center">
        <p className="font-semibold text-slate-800 max-w-xs truncate">{name}</p>
        {fromCache && <Badge variant="success" className="mt-1">From Cache</Badge>}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onReplace(); }}
        className="text-xs text-blue-600 hover:text-blue-800 font-medium underline underline-offset-2"
      >
        Upload a different file
      </button>
    </>
  );
}

function LoadingState({ stage }: { stage: string }) {
  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-sm" aria-live="polite" aria-busy="true">
      <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin" aria-hidden="true" />
      <p className="text-sm font-semibold text-slate-600">{stage}</p>
      <div className="w-full flex flex-col gap-2">
        <Skeleton className="h-3 w-full rounded-full" />
        <Skeleton className="h-3 w-4/5 rounded-full" />
        <Skeleton className="h-3 w-3/5 rounded-full" />
      </div>
    </div>
  );
}

function PracticeQuestion({ index, question, answer }: { index: number; question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-slate-100 overflow-hidden bg-slate-50/60">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-blue-50/40 transition-colors"
        aria-expanded={open}
      >
        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
          {index}
        </span>
        <span className="flex-1 text-sm font-semibold text-slate-800 leading-relaxed">{question}</span>
        <svg
          className={`w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-4 pt-0 border-t border-slate-100">
          <div className="flex items-start gap-3 mt-3">
            <span className="text-xs font-bold text-emerald-600 flex-shrink-0 mt-0.5">ANS</span>
            <p className="text-sm text-slate-700 leading-relaxed">{answer}</p>
          </div>
        </div>
      )}
    </div>
  );
}
