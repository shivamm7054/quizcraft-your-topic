import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Sparkles, Trash2, ArrowLeft, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { createExam, deleteExam, listMyExams } from "@/lib/exams.functions";
import { generateQuiz, type QuizQuestion } from "@/lib/quiz.functions";

export const Route = createFileRoute("/_authenticated/exams/")({
  head: () => ({ meta: [{ title: "My Exams — QuizForge" }] }),
  component: ExamsPage,
});

type Question = QuizQuestion;

function ExamsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: exams, isLoading } = useQuery({
    queryKey: ["my-exams"],
    queryFn: () => listMyExams(),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [timeLimit, setTimeLimit] = useState(15);
  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [topic, setTopic] = useState("");
  const [aiCount, setAiCount] = useState(5);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [questions, setQuestions] = useState<Question[]>([]);

  const genMutation = useMutation({
    mutationFn: () => generateQuiz({ data: { topic: topic.trim(), count: aiCount, difficulty } }),
    onSuccess: (res) => {
      setQuestions(res.questions);
      toast.success(`Generated ${res.questions.length} questions. Review and edit before creating.`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createExam({
        data: { title: title.trim(), timeLimitMinutes: timeLimit, questions },
      }),
    onSuccess: (res) => {
      toast.success("Exam created!");
      qc.invalidateQueries({ queryKey: ["my-exams"] });
      navigate({ to: "/exams/$examId", params: { examId: res.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMutation = useMutation({
    mutationFn: (id: string) => deleteExam({ data: { id } }),
    onSuccess: () => {
      toast.success("Exam deleted.");
      qc.invalidateQueries({ queryKey: ["my-exams"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addBlankQuestion = () =>
    setQuestions((qs) => [...qs, { question: "", options: ["", "", "", ""], correctIndex: 0, explanation: "" }]);

  const updateQ = (i: number, patch: Partial<Question>) =>
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));

  const removeQ = (i: number) => setQuestions((qs) => qs.filter((_, idx) => idx !== i));

  const canCreate =
    title.trim().length >= 2 &&
    questions.length > 0 &&
    questions.every(
      (q) => q.question.trim() && q.options.every((o) => o.trim()) && q.correctIndex >= 0 && q.correctIndex < 4,
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/30">
      <Toaster richColors position="top-center" />
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
              <Link to="/"><ArrowLeft className="mr-1 h-4 w-4" /> Home</Link>
            </Button>
            <h1 className="text-3xl font-bold">Host Exams</h1>
            <p className="text-muted-foreground">Create timed MCQ exams and share a join code with students.</p>
          </div>
          {!showCreate && (
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Exam
            </Button>
          )}
        </div>

        {showCreate && (
          <Card className="mb-8 shadow-lg">
            <CardHeader>
              <CardTitle>Create Exam</CardTitle>
              <CardDescription>Set title, timer, and questions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Exam title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Biology midterm" />
                </div>
                <div className="space-y-2">
                  <Label>Time limit (minutes)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={240}
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Math.max(1, Math.min(240, Number(e.target.value) || 1)))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Questions source</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={mode === "ai" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMode("ai")}
                  >
                    AI-generate
                  </Button>
                  <Button
                    type="button"
                    variant={mode === "manual" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMode("manual")}
                  >
                    Write manually
                  </Button>
                </div>
              </div>

              {mode === "ai" && (
                <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-3">
                  <div className="space-y-2 sm:col-span-3">
                    <Label>Topic</Label>
                    <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Cell biology" />
                  </div>
                  <div className="space-y-2">
                    <Label>Count</Label>
                    <Select value={String(aiCount)} onValueChange={(v) => setAiCount(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[3, 5, 7, 10, 15].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Difficulty</Label>
                    <Select value={difficulty} onValueChange={(v) => setDifficulty(v as "easy" | "medium" | "hard")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      onClick={() => genMutation.mutate()}
                      disabled={genMutation.isPending || topic.trim().length < 2}
                      className="w-full"
                    >
                      {genMutation.isPending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating…</>
                      ) : (
                        <><Sparkles className="mr-2 h-4 w-4" /> Generate</>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Questions ({questions.length})</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addBlankQuestion}>
                    <Plus className="mr-1 h-3 w-3" /> Add question
                  </Button>
                </div>
                {questions.length === 0 && (
                  <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    No questions yet. Generate with AI or add manually.
                  </p>
                )}
                {questions.map((q, i) => (
                  <Card key={i} className="border-muted">
                    <CardContent className="space-y-3 py-4">
                      <div className="flex items-start gap-2">
                        <span className="mt-2 text-sm font-medium text-muted-foreground">#{i + 1}</span>
                        <Input
                          value={q.question}
                          onChange={(e) => updateQ(i, { question: e.target.value })}
                          placeholder="Question text"
                        />
                        <Button size="icon" variant="ghost" onClick={() => removeQ(i)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {q.options.map((opt, j) => (
                          <label key={j} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${i}`}
                              checked={q.correctIndex === j}
                              onChange={() => updateQ(i, { correctIndex: j })}
                              title="Mark as correct"
                            />
                            <Input
                              value={opt}
                              onChange={(e) => {
                                const opts = [...q.options];
                                opts[j] = e.target.value;
                                updateQ(i, { options: opts });
                              }}
                              placeholder={`Option ${j + 1}`}
                            />
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">Select the radio next to the correct answer.</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex gap-2">
                <Button onClick={() => createMutation.mutate()} disabled={!canCreate || createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Exam
                </Button>
                <Button variant="ghost" onClick={() => { setShowCreate(false); setQuestions([]); setTitle(""); setTopic(""); }}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {isLoading && <p className="text-muted-foreground">Loading…</p>}
          {exams && exams.length === 0 && !showCreate && (
            <Card><CardContent className="py-10 text-center text-muted-foreground">No exams yet. Click <b>New Exam</b> to create one.</CardContent></Card>
          )}
          {exams?.map((e) => (
            <Card key={e.id}>
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link to="/exams/$examId" params={{ examId: e.id }} className="truncate font-semibold hover:underline">
                      {e.title}
                    </Link>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      e.status === "active" ? "bg-green-500/15 text-green-700 dark:text-green-400"
                      : e.status === "ended" ? "bg-muted text-muted-foreground"
                      : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                    }`}>{e.status}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Code <b className="font-mono text-foreground">{e.code}</b> · {e.question_count} questions · {Math.round(e.time_limit_seconds / 60)} min
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link to="/exams/$examId" params={{ examId: e.id }}>
                    <Pencil className="mr-1 h-3 w-3" /> Manage
                  </Link>
                </Button>
                <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete this exam?")) delMutation.mutate(e.id); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
