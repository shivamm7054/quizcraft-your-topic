import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Sparkles, RotateCcw, Check, X, Loader2, ArrowRight, KeyRound } from "lucide-react";
import { generateQuiz, type QuizQuestion } from "@/lib/quiz.functions";
import { saveQuizResult } from "@/lib/quiz-results.functions";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { Features, Stats, Testimonials, FAQ } from "@/components/site/sections";
import heroImg from "@/assets/hero-3d.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QuizForge — AI-powered MCQ exams on any topic" },
      { name: "description", content: "Turn any topic into an AI-generated multiple-choice exam with instant results, AI explanations, live multiplayer exams and host analytics." },
      { property: "og:title", content: "QuizForge — AI-powered MCQ exams on any topic" },
      { property: "og:description", content: "Turn any topic into an AI-generated multiple-choice exam with instant results, AI explanations and host analytics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "QuizForge — AI-powered MCQ exams" },
      { name: "twitter:description", content: "Turn any topic into an AI-generated multiple-choice exam in seconds." },
    ],
  }),
  component: Home,
});

type Stage = "setup" | "exam" | "results";

const ease = [0.22, 1, 0.36, 1] as const;

function Home() {
  const [stage, setStage] = useState<Stage>("setup");
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [saved, setSaved] = useState(false);
  const { user } = useAuth();

  const mutation = useMutation({
    mutationFn: (vars: { topic: string; count: number; difficulty: "easy" | "medium" | "hard" }) =>
      generateQuiz({ data: vars }),
    onSuccess: (res) => {
      setQuestions(res.questions);
      setAnswers(new Array(res.questions.length).fill(-1));
      setCurrent(0);
      setSaved(false);
      setStage("exam");
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to generate quiz"),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: {
      topic: string;
      difficulty: "easy" | "medium" | "hard";
      score: number;
      totalQuestions: number;
      questions: QuizQuestion[];
      answers: number[];
    }) => saveQuizResult({ data: payload }),
    onSuccess: () => {
      setSaved(true);
      toast.success("Result saved to your history.");
    },
    onError: (e: Error) => toast.error(e.message || "Failed to save result"),
  });

  const start = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim().length < 2) {
      toast.error("Enter a topic (at least 2 characters).");
      return;
    }
    mutation.mutate({ topic: topic.trim(), count, difficulty });
  };

  const reset = () => {
    setStage("setup");
    setQuestions([]);
    setAnswers([]);
    setCurrent(0);
    setSaved(false);
  };

  const score = answers.reduce((s, a, i) => (a === questions[i]?.correctIndex ? s + 1 : s), 0);

  const submitExam = () => {
    setStage("results");
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (user && !saved) {
      saveMutation.mutate({
        topic: topic.trim(),
        difficulty,
        score: answers.reduce((s, a, i) => (a === questions[i]?.correctIndex ? s + 1 : s), 0),
        totalQuestions: questions.length,
        questions,
        answers,
      });
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <Toaster richColors position="top-center" />

      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div className="aurora left-[-10%] top-[-8%] h-[420px] w-[420px] bg-brand/35" />
        <div className="aurora right-[-12%] top-[18%] h-[380px] w-[380px] bg-cyan/25" />
        <div className="aurora bottom-[-10%] left-[35%] h-[420px] w-[420px] bg-brand/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_35%,var(--color-background)_85%)]" />
      </div>

      <Navbar />

      <main>
        {stage === "setup" && (
          <>
            <Hero
              topic={topic}
              setTopic={setTopic}
              count={count}
              setCount={setCount}
              difficulty={difficulty}
              setDifficulty={setDifficulty}
              onSubmit={start}
              pending={mutation.isPending}
            />
            <Stats />
            <Features />
            <Testimonials />
            <FAQ />
          </>
        )}

        {stage === "exam" && questions.length > 0 && (
          <div className="mx-auto max-w-3xl px-6 py-12">
            <ExamView
              questions={questions}
              current={current}
              answers={answers}
              topic={topic}
              onSelect={(i) => {
                const next = [...answers];
                next[current] = i;
                setAnswers(next);
              }}
              onPrev={() => setCurrent((c) => Math.max(0, c - 1))}
              onNext={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
              onSubmit={submitExam}
            />
          </div>
        )}

        {stage === "results" && (
          <div className="mx-auto max-w-3xl px-6 py-12">
            <ResultsView
              questions={questions}
              answers={answers}
              score={score}
              topic={topic}
              onRestart={reset}
              saveStatus={
                !user
                  ? "signed-out"
                  : saveMutation.isPending
                    ? "saving"
                    : saved
                      ? "saved"
                      : saveMutation.isError
                        ? "error"
                        : "idle"
              }
            />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function Hero(props: {
  topic: string;
  setTopic: (v: string) => void;
  count: number;
  setCount: (n: number) => void;
  difficulty: "easy" | "medium" | "hard";
  setDifficulty: (d: "easy" | "medium" | "hard") => void;
  onSubmit: (e: React.FormEvent) => void;
  pending: boolean;
}) {
  const { topic, setTopic, count, setCount, difficulty, setDifficulty, onSubmit, pending } = props;

  return (
    <section id="create" className="mx-auto max-w-7xl px-6 pb-16 pt-10 sm:pt-16">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-10">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-brand-glow" />
            Powered by frontier AI models
          </span>

          <h1 className="mt-6 text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            Turn any topic into a{" "}
            <span className="text-gradient">premium MCQ exam</span>
          </h1>

          <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Generate, take and host multiple-choice exams in seconds. Instant scoring, AI
            explanations, live multiplayer rooms and a full analytics dashboard for hosts.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#create-card"
              className="group inline-flex items-center rounded-full bg-linear-to-r from-brand to-cyan px-6 py-3 text-sm font-semibold text-brand-foreground shine transition-transform duration-300 hover:scale-[1.03]"
            >
              Create a quiz
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
            <Button
              asChild
              variant="outline"
              className="rounded-full border-border bg-surface px-6 py-3 text-sm font-semibold backdrop-blur transition-transform duration-300 hover:scale-[1.03]"
            >
              <Link to="/join">
                <KeyRound className="mr-2 h-4 w-4" /> Join an exam
              </Link>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span>No credit card</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span>Up to 50 questions</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span>CSV & PDF exports</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease, delay: 0.1 }}
          className="relative mx-auto w-full max-w-lg"
        >
          <div className="absolute inset-6 -z-10 rounded-full bg-brand/25 blur-3xl" aria-hidden />
          <img
            src={heroImg}
            width={1024}
            height={1024}
            alt="3D illustration of an AI generating a multiple-choice quiz dashboard"
            className="float-slow w-full drop-shadow-2xl"
          />
        </motion.div>
      </div>

      {/* Floating glass form card */}
      <motion.div
        id="create-card"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease, delay: 0.2 }}
        className="glass-strong mx-auto mt-16 max-w-3xl rounded-3xl p-6 sm:p-9"
      >
        <div className="mb-6">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Create your exam</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Anything from “World War II” to “React hooks”.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              placeholder="e.g. Photosynthesis, Ancient Rome, JavaScript closures…"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              maxLength={120}
              className="h-12 rounded-2xl border-border bg-surface text-base backdrop-blur focus-visible:ring-brand"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="count">Questions</Label>
              <Input
                id="count"
                type="number"
                min={1}
                max={50}
                value={count}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  setCount(Number.isFinite(n) ? Math.max(1, Math.min(50, Math.floor(n))) : 1);
                }}
                className="h-12 rounded-2xl border-border bg-surface backdrop-blur focus-visible:ring-brand"
              />
            </div>

            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as "easy" | "medium" | "hard")}>
                <SelectTrigger className="h-12 rounded-2xl border-border bg-surface backdrop-blur">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={pending}
            className="h-13 w-full rounded-2xl bg-linear-to-r from-brand to-cyan py-6 text-base font-semibold text-brand-foreground shine transition-transform duration-300 hover:scale-[1.01] disabled:opacity-70"
          >
            {pending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating your quiz…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" /> Generate Quiz
              </>
            )}
          </Button>

          {pending && (
            <div className="space-y-2">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full w-1/3 animate-[shimmer-sweep_1.4s_ease-in-out_infinite] rounded-full bg-linear-to-r from-brand to-cyan" />
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Writing questions and explanations…
              </p>
            </div>
          )}
        </form>
      </motion.div>
    </section>
  );
}

function ExamView({
  questions, current, answers, topic, onSelect, onPrev, onNext, onSubmit,
}: {
  questions: QuizQuestion[];
  current: number;
  answers: number[];
  topic: string;
  onSelect: (i: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
}) {
  const q = questions[current];
  const progress = ((current + 1) / questions.length) * 100;
  const isLast = current === questions.length - 1;
  const answered = answers[current] !== -1;
  const allAnswered = answers.every((a) => a !== -1);

  return (
    <motion.div
      key={current}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
      className="glass-strong rounded-3xl p-6 sm:p-8"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-sm text-muted-foreground">
        <span className="truncate font-semibold text-foreground">{topic}</span>
        <span className="shrink-0">
          {current + 1} / {questions.length}
        </span>
      </div>
      <Progress value={progress} className="mt-3 h-2" />

      <h2 className="mt-7 text-xl font-bold leading-snug sm:text-2xl">{q.question}</h2>

      <RadioGroup
        value={answers[current] === -1 ? "" : String(answers[current])}
        onValueChange={(v) => onSelect(Number(v))}
        className="mt-6 space-y-3"
      >
        {q.options.map((opt, i) => (
          <label
            key={i}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/50",
              answers[current] === i && "border-brand bg-brand/10 glow-brand",
            )}
          >
            <RadioGroupItem value={String(i)} id={`opt-${i}`} />
            <span className="text-sm sm:text-base">{opt}</span>
          </label>
        ))}
      </RadioGroup>

      <div className="mt-8 flex items-center justify-between gap-3">
        <Button variant="outline" className="rounded-full" onClick={onPrev} disabled={current === 0}>
          Previous
        </Button>
        {isLast ? (
          <Button
            onClick={onSubmit}
            disabled={!allAnswered}
            className="rounded-full bg-linear-to-r from-brand to-cyan text-brand-foreground shine"
          >
            Submit Exam
          </Button>
        ) : (
          <Button
            onClick={onNext}
            disabled={!answered}
            className="rounded-full bg-linear-to-r from-brand to-cyan text-brand-foreground shine"
          >
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}

function ResultsView({
  questions, answers, score, topic, onRestart, saveStatus,
}: {
  questions: QuizQuestion[];
  answers: number[];
  score: number;
  topic: string;
  onRestart: () => void;
  saveStatus: "idle" | "saving" | "saved" | "error" | "signed-out";
}) {
  const pct = Math.round((score / questions.length) * 100);
  const verdict = pct >= 80 ? "Excellent!" : pct >= 60 ? "Nice work." : pct >= 40 ? "Keep practicing." : "Let's try again.";

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease }}
        className="glass-strong rounded-3xl p-8 text-center"
      >
        <p className="text-sm text-muted-foreground">{topic}</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{verdict}</h1>
        <div className="mt-6 text-6xl font-extrabold text-gradient sm:text-7xl">
          {score}
          <span className="text-2xl text-muted-foreground">/{questions.length}</span>
        </div>
        <p className="mt-2 text-muted-foreground">{pct}% correct</p>
        <div className="mt-4 text-xs text-muted-foreground">
          {saveStatus === "saving" && (
            <span className="inline-flex items-center">
              <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Saving to history…
            </span>
          )}
          {saveStatus === "saved" && <span className="text-success">✓ Saved to your history</span>}
          {saveStatus === "error" && <span className="text-destructive">Couldn&apos;t save to history</span>}
          {saveStatus === "signed-out" && (
            <span>
              <Link to="/auth" className="text-brand-glow underline">Sign in</Link> to save your results.
            </span>
          )}
        </div>
        <Button
          onClick={onRestart}
          size="lg"
          className="mt-7 rounded-full bg-linear-to-r from-brand to-cyan text-brand-foreground shine"
        >
          <RotateCcw className="mr-2 h-4 w-4" /> New Quiz
        </Button>
      </motion.div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold">Review</h2>
        {questions.map((q, i) => {
          const chosen = answers[i];
          const correct = chosen === q.correctIndex;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.4) }}
              className="glass space-y-3 rounded-3xl p-6"
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full",
                    correct ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive",
                  )}
                >
                  {correct ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                </span>
                <p className="font-semibold">{i + 1}. {q.question}</p>
              </div>
              <div className="ml-9 space-y-1.5 text-sm">
                {q.options.map((opt, j) => (
                  <div
                    key={j}
                    className={cn(
                      "rounded-xl px-3 py-2",
                      j === q.correctIndex && "bg-success/15 text-success",
                      j === chosen && j !== q.correctIndex && "bg-destructive/15 text-destructive",
                    )}
                  >
                    {opt}
                    {j === q.correctIndex && <span className="ml-2 text-xs">(correct)</span>}
                    {j === chosen && j !== q.correctIndex && <span className="ml-2 text-xs">(your answer)</span>}
                  </div>
                ))}
                {q.explanation && <p className="pt-2 text-muted-foreground">{q.explanation}</p>}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
