import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Brain, Trash2, ArrowLeft, Loader2, LogOut } from "lucide-react";
import { listQuizResults, deleteQuizResult } from "@/lib/quiz-results.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "My quiz history — QuizForge" }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["quiz-results"],
    queryFn: () => listQuizResults(),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteQuizResult({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["quiz-results"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    qc.clear();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/30">
      <Toaster richColors position="top-center" />
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Brain className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">QuizForge</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your quiz history</h1>
            <p className="mt-1 text-sm text-muted-foreground">Every exam you complete is saved here.</p>
          </div>
          <Button asChild variant="outline"><Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> New quiz</Link></Button>
        </div>

        {isLoading && (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        )}

        {!isLoading && (!data || data.length === 0) && (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            No quizzes yet. <Link to="/" className="text-primary underline">Take your first quiz</Link>.
          </CardContent></Card>
        )}

        <div className="space-y-3">
          {data?.map((r) => {
            const pct = Math.round((r.score / r.total_questions) * 100);
            return (
              <Card key={r.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.topic}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()} · {r.difficulty}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-semibold text-primary">{r.score}/{r.total_questions}</div>
                      <div className="text-xs text-muted-foreground">{pct}%</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => del.mutate(r.id)}
                      disabled={del.isPending}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
