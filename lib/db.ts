/**
 * IndexedDB wrapper for StudyOffline.
 *
 * Stores:
 *   - "chats"   : cached Q&A pairs (id, question, answer, timestamp, source)
 *   - "pending" : offline queued questions (id, question, timestamp)
 *   - "notes"   : uploaded PDF content (id, name, content, timestamp)
 */

const DB_NAME = "studyoffline";
const DB_VERSION = 2;

export interface CachedChat {
  id: string;
  question: string;
  answer: string;
  timestamp: number;
  source: "api" | "cache";
  noteId?: string; // if generated from a note
}

export interface PendingQuestion {
  id: string;
  question: string;
  timestamp: number;
}

export interface StoredNote {
  id: string;
  name: string;
  content: string; // extracted text
  timestamp: number;
}

export interface NoteResult {
  id: string;          // same id as StoredNote
  summary: string;
  concepts: string[];  // bullet list items
  questions: { q: string; a: string }[];
  timestamp: number;
  source: "api" | "cache";
}

// ─── Open / initialise DB ────────────────────────────────────────────────────

let _db: IDBDatabase | null = null;

export function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains("chats")) {
        const store = db.createObjectStore("chats", { keyPath: "id" });
        store.createIndex("timestamp", "timestamp");
      }

      if (!db.objectStoreNames.contains("pending")) {
        db.createObjectStore("pending", { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains("notes")) {
        db.createObjectStore("notes", { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains("noteResults")) {
        db.createObjectStore("noteResults", { keyPath: "id" });
      }
    };

    req.onsuccess = (e) => {
      _db = (e.target as IDBOpenDBRequest).result;
      resolve(_db);
    };

    req.onerror = () => reject(req.error);
  });
}

// ─── Generic helpers ─────────────────────────────────────────────────────────

function tx(
  db: IDBDatabase,
  store: string,
  mode: IDBTransactionMode = "readonly"
): IDBObjectStore {
  return db.transaction(store, mode).objectStore(store);
}

function wrap<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((res, rej) => {
    req.onsuccess = () => res(req.result);
    req.onerror  = () => rej(req.error);
  });
}

// ─── Chat cache ──────────────────────────────────────────────────────────────

/** Save a Q&A pair to IndexedDB */
export async function saveChat(chat: CachedChat): Promise<void> {
  const db = await openDB();
  await wrap(tx(db, "chats", "readwrite").put(chat));
}

/** Get all cached chats, newest first */
export async function getAllChats(): Promise<CachedChat[]> {
  const db = await openDB();
  const all = await wrap<CachedChat[]>(tx(db, "chats").getAll());
  return all.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Find a cached answer for a question.
 * Uses exact match first, then normalised (lowercase, trimmed) match.
 */
export async function findCachedAnswer(
  question: string
): Promise<CachedChat | null> {
  const db = await openDB();
  const all = await wrap<CachedChat[]>(tx(db, "chats").getAll());

  const normalise = (s: string) => s.toLowerCase().trim().replace(/\s+/g, " ");
  const q = normalise(question);

  return (
    all.find((c) => normalise(c.question) === q) ?? null
  );
}

/** Delete a single cached chat by id */
export async function deleteChat(id: string): Promise<void> {
  const db = await openDB();
  await wrap(tx(db, "chats", "readwrite").delete(id));
}

// ─── Pending queue ────────────────────────────────────────────────────────────

export async function enqueuePending(q: PendingQuestion): Promise<void> {
  const db = await openDB();
  await wrap(tx(db, "pending", "readwrite").put(q));
}

export async function getAllPending(): Promise<PendingQuestion[]> {
  const db = await openDB();
  return wrap<PendingQuestion[]>(tx(db, "pending").getAll());
}

export async function deletePending(id: string): Promise<void> {
  const db = await openDB();
  await wrap(tx(db, "pending", "readwrite").delete(id));
}

// ─── Notes ───────────────────────────────────────────────────────────────────

export async function saveNote(note: StoredNote): Promise<void> {
  const db = await openDB();
  await wrap(tx(db, "notes", "readwrite").put(note));
}

export async function getAllNotes(): Promise<StoredNote[]> {
  const db = await openDB();
  const all = await wrap<StoredNote[]>(tx(db, "notes").getAll());
  return all.sort((a, b) => b.timestamp - a.timestamp);
}

export async function getNoteById(id: string): Promise<StoredNote | null> {
  const db = await openDB();
  return wrap<StoredNote>(tx(db, "notes").get(id)) ?? null;
}

// ─── Note Results (AI-processed summaries / concepts / questions) ─────────────

export async function saveNoteResult(result: NoteResult): Promise<void> {
  const db = await openDB();
  await wrap(tx(db, "noteResults", "readwrite").put(result));
}

export async function getNoteResult(id: string): Promise<NoteResult | null> {
  const db = await openDB();
  const result = await wrap<NoteResult | undefined>(tx(db, "noteResults").get(id));
  return result ?? null;
}

export async function deleteNote(id: string): Promise<void> {
  const db = await openDB();
  await wrap(tx(db, "notes", "readwrite").delete(id));
  await wrap(tx(db, "noteResults", "readwrite").delete(id));
}
