const SUGGESTIONS = [
  "Explain this concept simply",
  "Summarize this topic",
  "Give me examples of this",
  "What are the key points?",
  "Create a practice question",
  "Compare and contrast these",
];

interface SuggestionChipsProps {
  onSelect: (text: string) => void;
  disabled?: boolean;
}

export default function SuggestionChips({ onSelect, disabled }: SuggestionChipsProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Suggestion chips">
      {SUGGESTIONS.map((s) => (
        <button
          key={s}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(s)}
          className="text-xs font-medium px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-colors disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
