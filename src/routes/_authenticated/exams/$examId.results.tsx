import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, X, ChevronDown, ChevronRight, Download, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getExamResults } from "@/lib/exams.functions";

export const Route = createFileRoute("/_authenticated/exams/$examId/results")({
  head: () => ({ meta: [{ title: "Exam results — QuizForge" }] }),
  component: ResultsPage,
});

type Question = { question: string; options: string[]; correctIndex: number; explanation?: string };

function ResultsPage() {
  const { examId } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["exam-results", examId],
    queryFn: () => getExamResults({ data: { id: examId } }),
  });
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const questions = useMemo(
    () => (data?.exam.questions as unknown as Question[] | undefined) ?? [],
    [data],
  );

  if (isLoading || !data) {
    return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  }

  const { exam, submissions } = data;

  const exportCSV = () => {
    const header = [
      "Rank",
      "Student",
      "Score",
      "Total",
      "Percent",
      "Submitted",
      ...questions.map((_, i) => `Q${i + 1}`),
      ...questions.map((_, i) => `Q${i + 1} Correct`),
    ];
    const rows = submissions.map((s, idx) => {
      const answers = (s.answers as unknown as (number | null)[]) ?? [];
      const letter = (n: number | null | undefined) =>
        n === null || n === undefined ? "" : String.fromCharCode(65 + n);
      return [
        String(idx + 1),
        s.student_name,
        String(s.score),
        String(s.total_questions),
        `${Math.round((s.score / s.total_questions) * 100)}%`,
        new Date(s.submitted_at).toLocaleString(),
        ...questions.map((_, qi) => letter(answers[qi])),
        ...questions.map((q, qi) =>
          answers[qi] === null || answers[qi] === undefined
            ? "N"
            : answers[qi] === q.correctIndex
              ? "Y"
              : "N",
        ),
      ];
    });
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exam.title.replace(/[^a-z0-9]+/gi, "_")}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(exam.title, 14, 16);
    doc.setFontSize(10);
    doc.text(
      `${submissions.length} student${submissions.length === 1 ? "" : "s"} · ${questions.length} question${questions.length === 1 ? "" : "s"}`,
      14,
      22,
    );

    autoTable(doc, {
      startY: 28,
      head: [["#", "Student", "Score", "Percent", "Submitted"]],
      body: submissions.map((s, idx) => [
        idx + 1,
        s.student_name,
        `${s.score} / ${s.total_questions}`,
        `${Math.round((s.score / s.total_questions) * 100)}%`,
        new Date(s.submitted_at).toLocaleString(),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 41, 59] },
    });

    submissions.forEach((s, idx) => {
      const answers = (s.answers as unknown as (number | null)[]) ?? [];
      doc.addPage();
      doc.setFontSize(13);
      doc.text(`${idx + 1}. ${s.student_name}`, 14, 16);
      doc.setFontSize(10);
      doc.text(
        `Score: ${s.score} / ${s.total_questions} (${Math.round((s.score / s.total_questions) * 100)}%)`,
        14,
        22,
      );
      autoTable(doc, {
        startY: 28,
        head: [["#", "Question", "Their answer", "Correct", "Result"]],
        body: questions.map((q, qi) => {
          const chosen = answers[qi];
          const chosenText =
            chosen === null || chosen === undefined
              ? "—"
              : `${String.fromCharCode(65 + chosen)}. ${q.options[chosen]}`;
          const correctText = `${String.fromCharCode(65 + q.correctIndex)}. ${q.options[q.correctIndex]}`;
          const result =
            chosen === null || chosen === undefined
              ? "No answer"
              : chosen === q.correctIndex
                ? "Correct"
                : "Wrong";
          return [qi + 1, q.question, chosenText, correctText, result];
        }),
        styles: { fontSize: 8, cellWidth: "wrap" },
        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: 70 },
          2: { cellWidth: 45 },
          3: { cellWidth: 45 },
          4: { cellWidth: 18 },
        },
        headStyles: { fillColor: [30, 41, 59] },
      });
    });

    doc.save(`${exam.title.replace(/[^a-z0-9]+/gi, "_")}_results.pdf`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/30">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
          <Link to="/exams/$examId" params={{ examId }}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to exam
          </Link>
        </Button>

        <Card className="mb-6 shadow-lg">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-2xl">{exam.title}</CardTitle>
              <CardDescription>
                Detailed results · {submissions.length} student{submissions.length === 1 ? "" : "s"} ·{" "}
                {questions.length} question{questions.length === 1 ? "" : "s"}
              </CardDescription>
            </div>
            {submissions.length > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportCSV}>
                  <Download className="mr-1 h-4 w-4" /> CSV
                </Button>
                <Button variant="outline" size="sm" onClick={exportPDF}>
                  <FileText className="mr-1 h-4 w-4" /> PDF
                </Button>
              </div>
            )}
          </CardHeader>
        </Card>

        {submissions.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No submissions yet.
            </CardContent>
          </Card>
        ) : (
          <>
            <AnalyticsCard submissions={submissions} questions={questions} />

          <div className="space-y-3">
            {submissions.map((s, idx) => {
              const answers = (s.answers as unknown as (number | null)[]) ?? [];
              const isOpen = expanded[s.id];
              const pct = Math.round((s.score / s.total_questions) * 100);
              return (
                <Card key={s.id} className="overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpanded((p) => ({ ...p, [s.id]: !p[s.id] }))}
                    className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-accent/40"
                  >
                    <div className="flex items-center gap-3">
                      {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <span className="w-6 text-center font-mono text-sm text-muted-foreground">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-medium">{s.student_name}</div>
                        <div className="text-xs text-muted-foreground">
                          Submitted {new Date(s.submitted_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {s.score} / {s.total_questions}
                      </div>
                      <div className="text-xs text-muted-foreground">{pct}%</div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t bg-muted/20 p-4">
                      <ol className="space-y-3">
                        {questions.map((q, qi) => {
                          const chosen = answers[qi];
                          const correct = chosen === q.correctIndex;
                          const unanswered = chosen === null || chosen === undefined;
                          return (
                            <li key={qi} className="rounded-lg border bg-background p-3">
                              <div className="flex items-start gap-2">
                                <div
                                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                                    correct
                                      ? "bg-green-500/15 text-green-600"
                                      : "bg-destructive/15 text-destructive"
                                  }`}
                                >
                                  {correct ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium">
                                    {qi + 1}. {q.question}
                                  </div>
                                  <div className="mt-2 space-y-1">
                                    {q.options.map((opt, oi) => {
                                      const isCorrect = oi === q.correctIndex;
                                      const isChosen = oi === chosen;
                                      return (
                                        <div
                                          key={oi}
                                          className={`rounded px-2 py-1 text-xs ${
                                            isCorrect
                                              ? "bg-green-500/10 text-green-700 dark:text-green-400"
                                              : isChosen
                                                ? "bg-destructive/10 text-destructive"
                                                : "text-muted-foreground"
                                          }`}
                                        >
                                          <span className="font-mono">{String.fromCharCode(65 + oi)}.</span>{" "}
                                          {opt}
                                          {isCorrect && <span className="ml-2 font-medium">(correct)</span>}
                                          {isChosen && !isCorrect && (
                                            <span className="ml-2 font-medium">(their answer)</span>
                                          )}
                                          {isChosen && isCorrect && (
                                            <span className="ml-2 font-medium">(their answer)</span>
                                          )}
                                        </div>
                                      );
                                    })}
                                    {unanswered && (
                                      <div className="text-xs italic text-muted-foreground">
                                        No answer submitted
                                      </div>
                                    )}
                                  </div>
                                  {q.explanation && (
                                    <div className="mt-2 rounded bg-muted/50 p-2 text-xs text-muted-foreground">
                                      <span className="font-medium">Explanation:</span> {q.explanation}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ol>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
          </>
        )}
      </div>
    </div>
  );

}

type Submission = {
  id: string;
  student_name: string;
  score: number;
  total_questions: number;
  answers: unknown;
  submitted_at: string;
};

function AnalyticsCard({
  submissions,
  questions,
}: {
  submissions: Submission[];
  questions: Question[];
}) {
  const n = submissions.length;
  const percents = submissions.map((s) => (s.score / s.total_questions) * 100);
  const avg = percents.reduce((a, b) => a + b, 0) / n;
  const high = Math.max(...percents);
  const low = Math.min(...percents);
  const sorted = [...percents].sort((a, b) => a - b);
  const median =
    n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
  const passRate = (percents.filter((p) => p >= 50).length / n) * 100;

  const perQuestion = questions.map((q, qi) => {
    let correct = 0;
    let unanswered = 0;
    const optionCounts = new Array(q.options.length).fill(0) as number[];
    for (const s of submissions) {
      const a = (s.answers as (number | null)[] | undefined)?.[qi];
      if (a === null || a === undefined) unanswered++;
      else {
        optionCounts[a] = (optionCounts[a] ?? 0) + 1;
        if (a === q.correctIndex) correct++;
      }
    }
    return {
      correct,
      unanswered,
      optionCounts,
      pct: Math.round((correct / n) * 100),
    };
  });

  const hardest = perQuestion
    .map((p, i) => ({ i, pct: p.pct }))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 3);

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg">Overall analytics</CardTitle>
        <CardDescription>Aggregate performance across all {n} students.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Stat label="Average" value={`${Math.round(avg)}%`} />
          <Stat label="Median" value={`${Math.round(median)}%`} />
          <Stat label="Highest" value={`${Math.round(high)}%`} />
          <Stat label="Lowest" value={`${Math.round(low)}%`} />
          <Stat label="Pass rate" value={`${Math.round(passRate)}%`} hint="≥ 50%" />
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold">Per-question correctness</h3>
          <div className="space-y-2">
            {perQuestion.map((p, qi) => (
              <div key={qi} className="rounded-lg border p-3">
                <div className="mb-1 flex items-start justify-between gap-3 text-sm">
                  <span className="line-clamp-1">
                    <span className="font-mono text-muted-foreground">Q{qi + 1}.</span>{" "}
                    {questions[qi].question}
                  </span>
                  <span
                    className={`shrink-0 font-semibold ${
                      p.pct >= 70
                        ? "text-green-600"
                        : p.pct >= 40
                          ? "text-amber-600"
                          : "text-destructive"
                    }`}
                  >
                    {p.pct}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full ${
                      p.pct >= 70
                        ? "bg-green-500"
                        : p.pct >= 40
                          ? "bg-amber-500"
                          : "bg-destructive"
                    }`}
                    style={{ width: `${p.pct}%` }}
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {questions[qi].options.map((opt, oi) => (
                    <span key={oi} className={oi === questions[qi].correctIndex ? "text-green-600" : ""}>
                      {String.fromCharCode(65 + oi)}: {p.optionCounts[oi]}
                      {oi === questions[qi].correctIndex && " ✓"}
                    </span>
                  ))}
                  {p.unanswered > 0 && <span>Skipped: {p.unanswered}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {hardest.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold">Hardest questions</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {hardest.map((h) => (
                <li key={h.i}>
                  <span className="font-mono">Q{h.i + 1}</span> — {h.pct}% correct ·{" "}
                  <span className="text-foreground">{questions[h.i].question}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

