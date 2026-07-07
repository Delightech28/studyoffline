# StudyOffline

> **AI-powered study companion for university students in low-connectivity environments.**
> Built for the **Build with Gemma Hackathon — COOU 2026**.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Delightech28/studyoffline)

---

## The Problem

University students in Nigeria and across Africa regularly face unreliable internet. Traditional AI study tools are useless the moment connectivity drops — all your questions, notes, and answers disappear.

**StudyOffline is built differently.** Every AI response is cached locally in the browser the moment it arrives. Students can ask questions, upload lecture notes, and access everything they've ever learned — even when completely offline.

---

## Live Demo

🔗 **[studyoffline.vercel.app](https://studyoffline.vercel.app)**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| AI Model | Gemma 4 via Google AI Studio (Gemini API) |
| Local Storage | IndexedDB (browser-native, no external DB) |
| PDF Parsing | pdfjs-dist v5 (runs entirely client-side in the browser) |
| Hosting | Vercel |
| Package Manager | pnpm |

---

## Project Structure

```
studyoffline/
├── app/
│   ├── page.tsx                  # Landing page
│   ├── ask/page.tsx              # Ask/Chat page
│   ├── upload/page.tsx           # Upload Notes page
│   ├── history/page.tsx          # History page
│   └── api/
│       ├── ask/route.ts          # Chat endpoint → Gemma API
│       └── process-note/route.ts # PDF summarisation endpoint → Gemma API
├── components/
│   ├── AppNavbar.tsx             # Shared navbar (Ask, Upload, History)
│   ├── landing/                  # Landing page section components
│   ├── chat/                     # ChatMessage, TypingIndicator, SuggestionChips
│   └── ui/                       # Button, Textarea, Badge, Skeleton, Card
├── lib/
│   ├── db.ts                     # IndexedDB wrapper (all local storage)
│   ├── gemma.ts                  # Shared Gemma API helper (retries + fallback)
│   └── pdfExtract.ts             # Client-side PDF text extraction
└── public/
    └── pdf.worker.min.mjs        # pdfjs worker (served locally, works offline)
```

---

## Pages

### Landing Page (`/`)

Static marketing page explaining the product. Fully offline-capable once loaded.

- Hero section with offline/online visual demonstration
- Features section — Ask Offline, Upload Notes, Practice Questions
- How It Works — 3-step walkthrough
- Live connectivity status indicator (reads actual `navigator.onLine`)
- Scroll-triggered fade-in animations via `IntersectionObserver`

---

### Ask / Chat Page (`/ask`)

The core Q&A interface. Resembles a messaging app — user messages right-aligned, AI responses left-aligned with Markdown rendering.

**Question flow:**

```
User submits question
        │
        ▼
1. Search IndexedDB for cached answer (normalised match)
        │
   ┌────┴────┐
   │  Found  │──→ Display instantly with "From Cache" badge
   └────┬────┘
        │ Not found
        ▼
2. Check navigator.onLine
        │
   ┌────┴─────┐
   │  Offline │──→ Save to pending queue in IndexedDB
   │          │    Show offline warning to user
   └────┬─────┘
        │ Online
        ▼
3. POST /api/ask → Gemma API (with retry + fallback)
        │
        ▼
4. Save response to IndexedDB immediately
        │
        ▼
5. Render response with Markdown formatting
```

**Offline queue:** When the `online` event fires, all pending questions are automatically sent to the API and the user is notified via a green toast banner.

**Markdown rendering:** AI responses render `###` headings, `**bold**`, `*italic*`, `` `code` ``, bullet lists, and numbered lists — implemented without any external library.

---

### Upload Notes Page (`/upload`)

PDF upload pipeline with AI-powered summarisation.

**Processing flow:**

```
User uploads PDF
        │
        ▼
1. Client-side text extraction (pdfjs-dist, no internet required)
        │
        ▼
2. Save raw text to IndexedDB immediately (safe even if AI fails)
        │
        ▼
3. Check navigator.onLine
        │
   ┌────┴─────┐
   │  Offline │──→ Show "AI summary pending" message. Raw text is saved.
   └────┬─────┘
        │ Online
        ▼
4. POST /api/process-note → 3 sequential Gemma calls:
   a. Summary (3–5 paragraphs, plain language)
   b. Key Concepts (6–10 bullet points)
   c. Practice Questions (4 Q&A pairs)
        │
        ▼
5. Save NoteResult to IndexedDB
        │
        ▼
6. Display in tabbed interface: Summary | Key Concepts | Practice Questions
```

- **My Notes** — lists all previously uploaded PDFs. Click any note to load its cached results instantly (offline-capable).
- **Practice Questions** — each question has a collapsible answer toggle.
- **Delete** — removes both raw text and AI results from IndexedDB.

---

### History Page (`/history`)

**100% offline.** Reads entirely from IndexedDB — zero API calls on this page.

- **Q&A tab** — all cached chat answers, searchable by question or answer text
- **Notes tab** — all uploaded PDFs with their AI summaries, concepts, and practice questions
- Each Q&A expands to show the full answer with a "Ask a follow-up" link
- Each note expands into a mini tabbed view matching the Upload page layout
- Delete buttons on both Q&As and notes with live count updates

---

## AI Layer

### Model Fallback Chain

If the primary model fails, the system automatically tries the next model:

```
gemma-4-31b-it          ← primary (highest quality)
       │ fails after 3 retries
       ▼
gemma-4-26b-a4b-it      ← fallback 1
       │ fails after 3 retries
       ▼
gemma-4-9b-it           ← fallback 2 (fastest, most stable)
       │ fails after 3 retries
       ▼
Error returned to user
```

### Retry Logic (per model)

| Attempt | Wait before retry |
|---|---|
| 1 → 2 | 2 seconds |
| 2 → 3 | 4 seconds |
| 3 → next model | immediate |

Hard errors (400, 401, 403) skip retries entirely and move straight to the next model.

### Thought Filtering

Gemma 4 includes internal reasoning steps in its response (marked `thought: true`). These are stripped before any text is shown to the user — only final answer parts are returned.

---

## IndexedDB Schema (`lib/db.ts`)

| Store | Key | Contents |
|---|---|---|
| `chats` | `id` | Cached Q&A pairs — question, answer, timestamp, source |
| `pending` | `id` | Questions queued while offline |
| `notes` | `id` | Raw extracted PDF text |
| `noteResults` | `id` | AI-generated summary, concepts, Q&A per note |

Cache lookup uses **normalised matching** (lowercase + trim + collapse whitespace) so minor variations still hit the cache.

---

## Offline / Online Behaviour

| Scenario | Behaviour |
|---|---|
| Ask question — online, not cached | Calls API → saves to IndexedDB → shows answer |
| Ask question — online, already cached | Loads from IndexedDB instantly, "From Cache" badge |
| Ask question — offline, cached | Loads from IndexedDB instantly, "From Cache" badge |
| Ask question — offline, not cached | Saves to pending queue, shows warning |
| Connection restored | Pending queue auto-processes, green toast notification |
| Upload PDF — online | Extract client-side → save raw → call AI → save result |
| Upload PDF — offline | Extract client-side → save raw → show "AI pending" message |
| View History page | Always works offline — reads only from IndexedDB |
| Open saved note | AI result cached → instant. Not cached + online → re-processes |

---

## API Routes

### `POST /api/ask`

```json
Request:  { "question": "string", "context": "string (optional)" }
Response: { "answer": "string" }
```

Timeout: 30 seconds (Vercel function).

### `POST /api/process-note`

```json
Request:  { "content": "string", "filename": "string" }
Response: { "summary": "string", "concepts": ["string"], "questions": [{ "q": "string", "a": "string" }] }
```

Makes 3 sequential Gemma calls. Timeout: 60 seconds (Vercel function).

---

## Environment Variables

| Variable | Description |
|---|---|
| `GEMMA_API_KEY` | Google AI Studio API key |

Set in Vercel: **Project → Settings → Environment Variables**.

For local development, add to `.env.local`:

```env
GEMMA_API_KEY=your_key_here
```

---

## Running Locally

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Built With

- [Next.js](https://nextjs.org/) — React framework with App Router
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first styling
- [Google AI Studio](https://aistudio.google.com/) — Gemma 4 API access
- [pdfjs-dist](https://mozilla.github.io/pdf.js/) — Client-side PDF parsing
- [Vercel](https://vercel.com/) — Hosting and serverless functions

---

## Hackathon

**Build with Gemma — COOU 2026**

This project was built for the Build with Gemma Hackathon hosted at COOU. The core challenge was building a genuinely useful AI application that degrades gracefully in low-connectivity conditions — a real constraint for students across Nigeria.
