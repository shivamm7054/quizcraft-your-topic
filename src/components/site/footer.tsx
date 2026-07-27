import { Link } from "@tanstack/react-router";
import { Brain, Github, Twitter, Linkedin, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-border">
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-linear-to-r from-transparent via-brand/60 to-transparent" />
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-linear-to-br from-brand to-cyan text-brand-foreground">
              <Brain className="h-5 w-5" />
            </span>
            <span className="text-lg font-extrabold tracking-tight">QuizForge</span>
          </div>
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            AI-powered quizzes and live exams for teachers, teams and lifelong learners.
          </p>
          <div className="mt-5 flex gap-2">
            {[
              { icon: Twitter, label: "Twitter" },
              { icon: Github, label: "GitHub" },
              { icon: Linkedin, label: "LinkedIn" },
              { icon: Mail, label: "Email" },
            ].map(({ icon: Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/60 hover:text-foreground"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <FooterCol
          title="Product"
          items={[
            { label: "Create quiz", to: "/" },
            { label: "Ask AI", to: "/ask" },
            { label: "Join exam", to: "/join" },
          ]}
        />
        <FooterCol
          title="Host"
          items={[
            { label: "Host exams", to: "/exams" },
            { label: "My history", to: "/history" },
          ]}
        />
        <div>
          <h3 className="text-sm font-semibold">Company</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            {["Features", "Testimonials", "FAQ"].map((l) => (
              <li key={l}>
                <a href={`#${l.toLowerCase()}`} className="transition-colors hover:text-foreground">
                  {l}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} QuizForge. All rights reserved.</p>
          <p>Built with AI · Designed for learning</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: { label: string; to: string }[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
        {items.map((i) => (
          <li key={i.label}>
            <Link to={i.to} className="transition-colors hover:text-foreground">
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
