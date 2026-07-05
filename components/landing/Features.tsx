"use client";

const features = [
  {
    icon: (
      <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    ),
    title: "Ask Anything Offline",
    description:
      "Type any question and get a clear AI explanation powered by Gemma 4. Every response is cached locally — so you can revisit your full Q&A history even when there's no internet.",
    color: "blue",
    delay: "reveal-delay-1",
  },
  {
    icon: (
      <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    title: "Upload & Understand Notes",
    description:
      "Upload your lecture notes or PDFs once. StudyOffline reads the content, breaks it down into plain language, and stores everything in your browser — no re-upload needed next time.",
    color: "indigo",
    delay: "reveal-delay-2",
  },
  {
    icon: (
      <svg className="w-6 h-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Practice Questions",
    description:
      "Automatically generate practice questions from your uploaded notes. Test your understanding, prepare for exams, and track your progress — all without leaving the app.",
    color: "violet",
    delay: "reveal-delay-3",
  },
];

const colorMap: Record<string, { bg: string; ring: string; badge: string }> = {
  blue:   { bg: "bg-blue-50",   ring: "ring-blue-100",   badge: "bg-blue-100 text-blue-700" },
  indigo: { bg: "bg-indigo-50", ring: "ring-indigo-100", badge: "bg-indigo-100 text-indigo-700" },
  violet: { bg: "bg-violet-50", ring: "ring-violet-100", badge: "bg-violet-100 text-violet-700" },
};

export default function Features() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16 reveal">
          <span className="inline-block text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">
            What You Get
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Everything You Need to Study Smarter
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Built specifically for students dealing with unreliable internet. All the power
            of AI, with offline-first resilience baked in.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((f) => {
            const colors = colorMap[f.color];
            return (
              <article
                key={f.title}
                className={`reveal ${f.delay} group relative bg-white rounded-2xl border border-slate-100 p-7 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1`}
              >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl ${colors.bg} ring-2 ${colors.ring} flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110`}>
                  {f.icon}
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.description}</p>

                {/* Offline badge */}
                <div className={`mt-5 inline-flex items-center gap-1.5 text-xs font-semibold ${colors.badge} px-2.5 py-1 rounded-full`}>
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Works Offline
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
