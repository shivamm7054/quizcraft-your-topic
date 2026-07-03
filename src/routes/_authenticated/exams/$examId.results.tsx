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
          <CardHeader>
            <CardTitle className="text-2xl">{exam.title}</CardTitle>
            <CardDescription>
              Detailed results · {submissions.length} student{submissions.length === 1 ? "" : "s"} ·{" "}
              {questions.length} question{questions.length === 1 ? "" : "s"}
            </CardDescription>
          </CardHeader>
        </Card>

        {submissions.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No submissions yet.
            </CardContent>
          </Card>
        ) : (
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
        )}
      </div>
    </div>
  );
}
