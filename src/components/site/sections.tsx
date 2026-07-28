import { motion } from "framer-motion";
import {
  Sparkles,
  Zap,
  Users,
  MessageSquareText,
  BarChart3,
  Quote,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={fadeUp}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-2xl text-center"
    >
      <span className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {eyebrow}
      </span>
      <h2 className="mt-4 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-pretty text-muted-foreground">{subtitle}</p>}
    </motion.div>
  );
}

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Quiz Generator",
    body: "Type any topic and get a well-balanced multiple-choice exam in seconds, at the difficulty you choose.",
    to: "/",
    hash: "create",
    cta: "Generate a quiz",
  },
  {
    icon: Zap,
    title: "Instant Results",
    body: "Auto-scored the moment you submit, with a clean breakdown of every right and wrong answer.",
    to: "/history",
    cta: "View your results",
  },
  {
    icon: Users,
    title: "Multiplayer Exams",
    body: "Host a timed exam, share a join code, and let a whole classroom take it at once — no accounts needed.",
    to: "/exams",
    cta: "Host an exam",
  },
  {
    icon: MessageSquareText,
    title: "AI Explanations",
    body: "Every question comes with a clear explanation, so a quiz becomes an actual learning moment.",
    to: "/ask",
    cta: "Ask AI anything",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    body: "Per-student scores, hardest questions, option distribution and CSV or PDF exports for hosts.",
    to: "/exams",
    cta: "Open analytics",
  },
] as const;

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
      <SectionHeading
        eyebrow="Features"
        title="Everything you need to test knowledge"
        subtitle="From a solo practice quiz to a fully proctored classroom exam — one polished workflow."
      />
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            transition={{ duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              to={f.to}
              hash={"hash" in f ? (f as { hash?: string }).hash : undefined}
              className="group glass lift block h-full rounded-3xl p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-linear-to-br from-brand/25 to-cyan/25 text-brand-glow ring-1 ring-border transition-transform duration-300 group-hover:scale-110">
                <f.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-glow">
                {f.cta}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </Link>
          </motion.div>
        ))}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={fadeUp}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="relative overflow-hidden rounded-3xl border border-brand/40 bg-linear-to-br from-brand/25 via-brand/10 to-cyan/25 p-6"
        >
          <h3 className="text-lg font-bold">Ready in one line</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            No setup, no question banks to maintain. Describe the topic — QuizForge writes the exam.
          </p>
          <Link
            to="/"
            hash="create"
            className="mt-6 inline-flex items-center gap-1 rounded-full bg-linear-to-r from-brand to-cyan px-5 py-2.5 text-sm font-semibold text-brand-foreground transition-transform duration-300 hover:scale-105"
          >
            Create a quiz
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}


const STATS = [
  { value: "10K+", label: "Quizzes generated" },
  { value: "5K+", label: "Active learners" },
  { value: "98%", label: "Answer accuracy" },
  { value: "<10s", label: "Average generation time" },
];

export function Stats() {
  return (
    <section className="mx-auto max-w-7xl px-6">
      <div className="glass-strong relative overflow-hidden rounded-3xl px-6 py-12 sm:px-12">
        <div className="aurora -left-20 top-0 h-64 w-64 bg-brand/40" aria-hidden />
        <div className="aurora -right-16 bottom-0 h-64 w-64 bg-cyan/30" aria-hidden />
        <dl className="relative grid gap-8 text-center sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <dt className="sr-only">{s.label}</dt>
              <dd>
                <span className="block text-4xl font-extrabold tracking-tight text-gradient sm:text-5xl">
                  {s.value}
                </span>
                <span className="mt-2 block text-sm text-muted-foreground">{s.label}</span>
              </dd>
            </motion.div>
          ))}
        </dl>
      </div>
    </section>
  );
}

const TESTIMONIALS = [
  {
    quote:
      "I generate a revision quiz for every lesson in under a minute. My students actually ask for them now.",
    name: "Priya Sharma",
    role: "High-school biology teacher",
  },
  {
    quote:
      "We ran a 40-person timed assessment with a single join code. The analytics export saved me an evening.",
    name: "Daniel Okafor",
    role: "L&D lead, fintech",
  },
  {
    quote:
      "The AI explanations are the real feature. It's the difference between a score and actually learning.",
    name: "Mei Tanaka",
    role: "Medical student",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
      <SectionHeading eyebrow="Testimonials" title="Loved by teachers and teams" />
      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <motion.figure
            key={t.name}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="glass lift flex h-full flex-col rounded-3xl p-6"
          >
            <Quote className="h-6 w-6 text-brand-glow" />
            <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground/90">
              “{t.quote}”
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-linear-to-br from-brand to-cyan text-sm font-bold text-brand-foreground">
                {t.name.charAt(0)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{t.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{t.role}</span>
              </span>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}

const FAQS = [
  {
    q: "Do students need an account to take an exam?",
    a: "No. As a host you share a 6-character join code; students enter the code and their name, and the timer starts individually for each of them.",
  },
  {
    q: "How many questions can a quiz have?",
    a: "Anywhere from 1 to 50 questions per quiz or exam. You choose the exact number and the difficulty level.",
  },
  {
    q: "Can I edit AI-generated questions?",
    a: "Yes. When hosting an exam you can generate with AI, then edit any question, option or correct answer — or write the whole set manually.",
  },
  {
    q: "Can I export the results?",
    a: "Hosts get a detailed results dashboard with per-student breakdowns, plus one-click CSV and PDF exports.",
  },
  {
    q: "Is my quiz history saved?",
    a: "Sign in and every completed quiz is stored in your history with the topic, score, date and your full answer review.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-6 py-20 sm:py-28">
      <SectionHeading eyebrow="FAQ" title="Questions, answered" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="glass mt-10 rounded-3xl px-5 py-2"
      >
        <Accordion type="single" collapsible>
          {FAQS.map((f, i) => (
            <AccordionItem key={f.q} value={`item-${i}`} className="border-border">
              <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </section>
  );
}
