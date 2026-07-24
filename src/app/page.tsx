"use client";

import { useState } from "react";

interface Source {
  section_id: string;
  doc_id: string;
  category: string;
  title: string;
  content: string;
  similarity: number;
}

interface AskResponse {
  query: string;
  answer: string;
  sources: Source[];
}

const EXAMPLE_QUESTIONS = [
  "What is the timely filing limit for claims?",
  "What are the requirements for prior authorization?",
  "What is the appeals process for denied claims?",
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runQuery(q: string) {
    if (!q.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.error || `Request failed: ${res.status}`);
      }

      const data: AskResponse = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runQuery(query);
  }

  function handleExampleClick(q: string) {
    setQuery(q);
    runQuery(q);
  }

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black min-h-screen">
      <main className="flex flex-1 w-full max-w-3xl flex-col py-16 px-6 sm:px-16">
        {/* Header / summary */}
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-black dark:text-zinc-50 mb-2">
          Healthcare Policy Compliance Assistant
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
          A retrieval-augmented generation (RAG) system over a corpus of healthcare
          policy documents. Ask a question and it retrieves the most relevant policy
          sections via vector similarity search, then generates a grounded answer that
          cites its sources — and explicitly flags conflicting policies across
          different documents instead of silently picking one.
        </p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-8">
          Next.js · Supabase (pgvector) · OpenAI embeddings + gpt-4o-mini · 2,500 indexed policy sections
        </p>

        {/* Search box */}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. What is the timely filing limit for claims?"
            className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-black dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-zinc-50"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-black dark:bg-zinc-50 text-white dark:text-black px-6 py-3 font-medium transition-colors hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Thinking..." : "Ask"}
          </button>
        </form>

        {/* Example questions */}
        <div className="flex flex-wrap gap-2 mb-10">
          {EXAMPLE_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => handleExampleClick(q)}
              disabled={loading}
              className="text-xs rounded-full border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 px-4 py-3 mb-8">
            Error: {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="animate-pulse mb-8">
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full mb-2" />
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6 mb-2" />
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3" />
          </div>
        )}

        {result && !loading && (
          <div>
            <div className="rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-5 py-4 mb-8 whitespace-pre-wrap leading-relaxed text-black dark:text-zinc-50">
              {result.answer}
            </div>

            {result.sources.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-black dark:text-zinc-50 mb-3">
                  Sources
                </h2>
                <div className="flex flex-col gap-3">
                  {result.sources.map((src, i) => (
                    <div
                      key={src.section_id}
                      className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-4 py-3 text-sm"
                    >
                      <div className="font-semibold text-black dark:text-zinc-50 mb-1">
                        [{i + 1}] {src.doc_id} — {src.title}{" "}
                        <span className="font-normal text-zinc-400">
                          ({src.category}, similarity {src.similarity.toFixed(3)})
                        </span>
                      </div>
                      <div className="text-zinc-600 dark:text-zinc-400">
                        {src.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}