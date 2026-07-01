import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getExamByCode, submitExam } from "@/lib/exam-join.functions";

export const Route = createFileRoute("/exam/$code")({
  head: () => ({ meta: [{ title: "Exam in progress — QuizForge" }] }),
  component: TakeExam,
});

function TakeExam() {
  const { code } = Route.useParams();
  const studentName = typeof window !== "undefined" ? sessionStorage.getItem(`exam-name-${code}`) ?? "" : "";

  const { data, isLoading, error } = useQuery({
    queryKey: ["exam-join", code],
    queryFn: () => getExamByCode({ data: { code } }),
    retry: false,
  });

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState<{ score: number; total: number } | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (data && answers.length === 0) setAnswers(new Array(data.questions.length).fill(-1));
  }, [data, answers.length]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const endsAt = data?.ends_at ? new Date(data.ends_at).getTime() : 0;
  const remainingSec = Math.max(0, Math.floor((endsAt - now) / 1000));

  const submitMut = useMutation({
    mutationFn: () => submitExam({ data: { examId: data!.id, studentName, answers } }),
    onSuccess: (res) => setSubmitted(res),
    onError: (e: Error) => toast.error(e.message),
  });

  const timeUp = data && endsAt > 0 && remainingSec === 0;
  useEffect(() => {
    if (timeUp && !submitted && !submitMut.isPending && data) {
      submitMut.mutate();
    }
  }, [timeUp, submitted, submitMut, data]);

  if (!studentName) {
    return (
      <CenterCard title="Enter your name first">
        <p className="mb-4 text-sm text-muted-foreground">Go back and enter your name to join.</p>
        <Button asChild><Link to="/join" search={{ code }}>Back to join page</Link></Button>
      </CenterCard>
    );
  }
  if (isLoading) return <CenterCard title="Loading exam…"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></CenterCard>;
  if (error) return <CenterCard title="Couldn't join"><p className="text-sm text-destructive">{(error as Error).message}</p><Button asChild className="mt-4"><Link to="/join">Try another code</Link></Button></CenterCard>;
  if (!data) return null;

  if (submitted) {
    const pct = Math.round((submitted.score / submitted.total) * 100);
    return (
      <CenterCard title="Submitted!">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">{studentName}</p>
          <div className="my-4 text-5xl font-bold text-primary">{submitted.score}<span className="text-xl text-muted-foreground">/{submitted.total}</span></div>
          <p className="text-muted-foreground">{pct}% — thanks for taking the exam.</p>
        </div>
      </CenterCard>
    );
  }

  const q = data.questions[current];
  const progress = ((current + 1) / data.questions.length) * 100;
  const isLast = current === data.questions.length - 1;
  const answered = answers[current] !== -1;
  const mm = String(Math.floor(remainingSec / 60)).padStart(2, "0");
  const ss = String(remainingSec % 60).padStart(2, "0");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/30">
      <Toaster richColors position="top-center" />
      <div className="mx-auto max-w-2xl px-6 py-8">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{data.title} · <span className="text-muted-foreground">{studentName}</span></span>
              <span className={cn("flex items-center gap-1 font-mono", remainingSec < 60 && "text-destructive")}>
                <Clock className="h-4 w-4" /> {mm}:{ss}
              </span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">Question {current + 1} of {data.questions.length}</div>
            <Progress value={progress} className="mt-2 h-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <h2 className="text-xl font-semibold leading-snug">{q.question}</h2>
            <RadioGroup
              value={answers[current] === -1 ? "" : String(answers[current])}
              onValueChange={(v) => {
                const next = [...answers];
                next[current] = Number(v);
                setAnswers(next);
              }}
              className="space-y-2"
            >
              {q.options.map((opt, i) => (
                <label
                  key={i}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-accent",
                    answers[current] === i && "border-primary bg-accent",
                  )}
                >
                  <RadioGroupItem value={String(i)} id={`opt-${i}`} />
                  <span className="text-sm">{opt}</span>
                </label>
              ))}
            </RadioGroup>
            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0}>
                Previous
              </Button>
              {isLast ? (
                <Button onClick={() => submitMut.mutate()} disabled={!answered || submitMut.isPending}>
                  {submitMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Submit
                </Button>
              ) : (
                <Button onClick={() => setCurrent((c) => Math.min(data.questions.length - 1, c + 1))} disabled={!answered}>
                  Next
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CenterCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/30">
      <div className="mx-auto max-w-md px-6 py-16">
        <Card>
          <CardHeader><CardTitle>{title}</CardTitle><CardDescription>QuizForge exam</CardDescription></CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}
