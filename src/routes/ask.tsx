import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Search, Sparkles, Loader2, ArrowLeft, BookOpen, Clock, X, Trash2 } from "lucide-react";
import { askQuestion, type AskAnswer } from "@/lib/ask.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/ask")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Ask — Instant AI answers to any question" },
      { name: "description", content: "Type a question and get an instant AI-generated answer with key points and related questions." },
      { property: "og:title", content: "Ask — Instant AI answers" },
      { property: "og:description", content: "Google-style search that answers any question with AI." },
    ],
  }),
  component: AskPage,
});

const RECENT_KEY = "ask-recent-searches";
const RECENT_MAX = 10;

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string").slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

function AskPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate({ from: "/ask" });
  const [query, setQuery] = useState(q);
  const [answer, setAnswer] = useState<AskAnswer | null>(null);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  const persistRecent = (next: string[]) => {
    setRecent(next);
    try {
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      // ignore quota errors
    }
  };

  const addRecent = (value: string) => {
    const v = value.trim();
    if (!v) return;
    const next = [v, ...recent.filter((r) => r.toLowerCase() !== v.toLowerCase())].slice(0, RECENT_MAX);
    persistRecent(next);
  };

  const removeRecent = (value: string) => {
    persistRecent(recent.filter((r) => r !== value));
  };

  const clearRecent = () => persistRecent([]);

  const mutation = useMutation({
    mutationFn: (question: string) => askQuestion({ data: { question } }),
    onSuccess: (data, question) => {
      setAnswer(data);
      addRecent(question);
    },
    onError: (e: Error) => toast.error(e.message || "Failed to get an answer"),
  });

  useEffect(() => {
    if (q && q.trim().length >= 2) {
      setQuery(q);
      mutation.mutate(q.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);


  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      toast.error("Type at least 2 characters.");
      return;
    }
    navigate({ search: { q: trimmed } });
  };

  const hasResults = !!answer || mutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/30">
      <Toaster richColors position="top-center" />
      <header className="border-b border-border/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to QuizForge
          </Link>
          <span className="text-sm font-semibold tracking-tight">Ask AI</span>
        </div>
      </header>

      <main className={hasResults ? "mx-auto max-w-3xl px-6 py-8" : "mx-auto flex min-h-[calc(100vh-64px)] max-w-3xl flex-col items-center justify-center px-6 py-10"}>
        {!hasResults && (
          <div className="mb-8 text-center">
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
              Ask <span className="text-primary">anything</span>
            </h1>
            <p className="mt-3 text-muted-foreground">
              A Google-style search box that answers your question with AI.
            </p>
          </div>
        )}

        <form onSubmit={submit} className="w-full">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything… e.g. What causes rainbows?"
              className="h-14 rounded-full pl-12 pr-32 text-base shadow-md focus-visible:shadow-lg"
              autoFocus
            />
            <Button
              type="submit"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" /> Ask</>
              )}
            </Button>
          </div>
        </form>

        {!hasResults && recent.length > 0 && (
          <div className="mt-8 w-full">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Clock className="h-4 w-4" /> Recent searches
              </h3>
              <Button variant="ghost" size="sm" onClick={clearRecent} className="text-xs text-muted-foreground">
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Clear all
              </Button>
            </div>
            <Card>
              <CardContent className="p-2">
                <ul className="divide-y divide-border">
                  {recent.map((r) => (
                    <li key={r} className="group flex items-center gap-2 px-2">
                      <button
                        type="button"
                        onClick={() => navigate({ search: { q: r } })}
                        className="flex flex-1 items-center gap-3 py-2.5 text-left text-sm hover:text-primary"
                      >
                        <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">{r}</span>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-60 hover:opacity-100"
                        onClick={() => removeRecent(r)}
                        aria-label={`Remove ${r}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {hasResults && (
          <div className="mt-8 space-y-6">
            {mutation.isPending && (
              <Card>
                <CardContent className="flex items-center gap-3 py-6 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Thinking about your question…
                </CardContent>
              </Card>
            )}

            {answer && !mutation.isPending && (
              <>
                <Card className="shadow-lg">
                  <CardContent className="space-y-4 py-6">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                      <Sparkles className="h-3.5 w-3.5" /> AI answer
                    </div>
                    <p className="text-lg leading-relaxed">{answer.answer}</p>
                    {answer.bullets.length > 0 && (
                      <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                        {answer.bullets.map((b, i) => <li key={i}>{b}</li>)}
                      </ul>
                    )}
                  </CardContent>
                </Card>

                {answer.sources.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-muted-foreground">References</h3>
                    <div className="space-y-2">
                      {answer.sources.map((s, i) => (
                        <Card key={i}>
                          <CardContent className="flex gap-3 py-3">
                            <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <div className="text-sm">
                              <div className="font-medium">{s.title}</div>
                              <div className="text-muted-foreground">{s.snippet}</div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {answer.related.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Related searches</h3>
                    <div className="flex flex-wrap gap-2">
                      {answer.related.map((r, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          onClick={() => navigate({ search: { q: r } })}
                        >
                          {r}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
