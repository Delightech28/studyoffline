import { Badge } from "@/components/ui/badge";
import { CachedChat } from "@/lib/db";

interface ChatMessageProps {
  role: "user" | "ai";
  text: string;
  source?: CachedChat["source"];
  timestamp?: number;
}

export default function ChatMessage({ role, text, source, timestamp }: ChatMessageProps) {
  const isUser = role === "user";
  const time = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className={`message-enter flex items-end gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"} max-w-full`}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex-shrink-0 flex items-center justify-center shadow-sm mb-0.5">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09 3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        </div>
      )}

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center mb-0.5">
          <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
      )}

      {/* Bubble */}
      <div className={`flex flex-col gap-1 max-w-[75%] sm:max-w-[65%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed break-words shadow-sm ${
            isUser
              ? "bg-blue-600 text-white rounded-br-sm"
              : "bg-white border border-slate-100 text-slate-800 rounded-tl-sm"
          }`}
        >
          {isUser ? (
            <span className="whitespace-pre-wrap">{text}</span>
          ) : (
            <MarkdownContent text={text} />
          )}
        </div>

        {/* Footer row: cache badge + time */}
        <div className={`flex items-center gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
          {source === "cache" && (
            <Badge variant="success">
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 14.5A6.5 6.5 0 1110 3.5a6.5 6.5 0 010 13zm-1-4.25l-2-2 1.06-1.06L9 10.12l3.44-3.44 1.06 1.06-4.5 4.5z"/>
              </svg>
              From Cache
            </Badge>
          )}
          {time && (
            <span className="text-[10px] text-slate-400">{time}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Lightweight Markdown renderer ───────────────────────────────────────────
// Handles: ### headings, **bold**, *italic*, `code`, bullet lists, numbered lists, blank lines

function MarkdownContent({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // ### Heading 3
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="font-bold text-slate-900 text-base mt-3 mb-1 first:mt-0">
          {inlineFormat(line.slice(4))}
        </h3>
      );
      i++;
      continue;
    }

    // ## Heading 2
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="font-bold text-slate-900 text-base mt-3 mb-1 first:mt-0">
          {inlineFormat(line.slice(3))}
        </h2>
      );
      i++;
      continue;
    }

    // # Heading 1
    if (line.startsWith("# ")) {
      elements.push(
        <h2 key={i} className="font-bold text-slate-900 text-base mt-3 mb-1 first:mt-0">
          {inlineFormat(line.slice(2))}
        </h2>
      );
      i++;
      continue;
    }

    // Unordered list — collect consecutive bullet lines
    if (/^[\*\-]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[\*\-]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[\*\-]\s/, ""));
        i++;
      }
      elements.push(
        <ul key={i} className="list-none space-y-1 my-2">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 mt-1.5" aria-hidden="true" />
              <span>{inlineFormat(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list — collect consecutive numbered lines
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      let num = 1;
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
        num++;
      }
      elements.push(
        <ol key={i} className="space-y-1 my-2">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {j + 1}
              </span>
              <span>{inlineFormat(item)}</span>
            </li>
          ))}
        </ol>
      );
      void num;
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="mb-2 last:mb-0">
        {inlineFormat(line)}
      </p>
    );
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}

// Inline formatting: **bold**, *italic*, `code`
function inlineFormat(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i} className="italic">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-[12px] font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
