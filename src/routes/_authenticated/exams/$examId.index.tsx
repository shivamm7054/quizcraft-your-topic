import { createFileRoute, Link } from "@tanstack/react-router";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Play, Square, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { endExam, getExam, startExam } from "@/lib/exams.functions";

export const Route = createFileRoute("/_authenticated/exams/$examId/")({
  head: () => ({ meta: [{ title: "Manage exam — QuizForge" }] }),
  component: ExamDetail,
});

function ExamDetail() {
  const { examId } = Route.useParams();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["exam", examId],
    queryFn: () => getExam({ data: { id: examId } }),
    refetchInterval: 5000,
  });

  const start = useMutation({
    mutationFn: () => startExam({ data: { id: examId } }),
    onSuccess: () => { toast.success("Exam is now open. Each student's timer starts when they begin."); qc.invalidateQueries({ queryKey: ["exam", examId] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const stop = useMutation({
    mutationFn: () => endExam({ data: { id: examId } }),
    onSuccess: () => { toast.success("Exam ended."); qc.invalidateQueries({ queryKey: ["exam", examId] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const exam = data?.exam;
  const submissions = data?.submissions ?? [];

  if (isLoading || !data || !exam) {
    return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  }
  const joinUrl = typeof window !== "undefined" ? `${window.location.origin}/join?code=${exam.code}` : "";
  const minutes = Math.round(exam.time_limit_seconds / 60);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/30">
      <Toaster richColors position="top-center" />
      <div className="mx-auto max-w-4xl px-6 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
          <Link to="/exams">
            <ArrowLeft className="mr-1 h-4 w-4" /> All exams
          </Link>
        </Button>

        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">{exam.title}</CardTitle>
                <CardDescription>
                  {(exam.questions as unknown[]).length} questions · {Math.round(exam.time_limit_seconds / 60)} min ·{" "}
                  <span className="capitalize">{exam.status}</span>
                </CardDescription>
              </div>
              {exam.status === "draft" && (
                <Button onClick={() => start.mutate()} disabled={start.isPending}>
                  {start.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                  Start exam
                </Button>
              )}
              {exam.status === "active" && (
                <Button variant="destructive" onClick={() => stop.mutate()} disabled={stop.isPending}>
                  <Square className="mr-2 h-4 w-4" /> End now
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase text-muted-foreground">Join code</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="font-mono text-3xl font-bold tracking-wider">{exam.code}</span>
                  <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(exam.code); toast.success("Code copied"); }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-2 truncate text-xs text-muted-foreground">{joinUrl}</p>
                <Button size="sm" variant="outline" className="mt-2" onClick={() => { navigator.clipboard.writeText(joinUrl); toast.success("Link copied"); }}>
                  Copy join link
                </Button>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase text-muted-foreground">Per-student time limit</p>
                <p className="mt-1 font-mono text-3xl font-bold">{minutes} min</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {exam.status === "active"
                    ? "Each student's countdown starts when they open the exam."
                    : exam.status === "ended"
                      ? "Exam is closed. Students can no longer join."
                      : "Click Start exam to open the join code."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Submissions ({submissions.length})</CardTitle>
                <CardDescription>Live leaderboard, ordered by score.</CardDescription>
              </div>
              {submissions.length > 0 && (
                <Button asChild size="sm" variant="outline">
                  <Link to="/exams/$examId/results" params={{ examId }}>
                    View detailed results
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <p className="py-6 text-center text-muted-foreground">No submissions yet.</p>
            ) : (
              <div className="space-y-2">
                {submissions.map((s, i) => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center font-mono text-sm text-muted-foreground">{i + 1}</span>
                      <span className="font-medium">{s.student_name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{s.score} / {s.total_questions}</div>
                      <div className="text-xs text-muted-foreground">{Math.round((s.score / s.total_questions) * 100)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
