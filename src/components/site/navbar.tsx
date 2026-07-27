import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  KeyRound,
  Search,
  Users,
  History,
  LogIn,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out.");
  };

  const initial = (user?.email ?? "?").charAt(0).toUpperCase();

  const links = (
    <>
      <Button asChild variant="ghost" size="sm" className="justify-start">
        <Link to="/ask">
          <Search className="mr-2 h-4 w-4" /> Ask AI
        </Link>
      </Button>
      <Button asChild variant="ghost" size="sm" className="justify-start">
        <Link to="/join">
          <KeyRound className="mr-2 h-4 w-4" /> Join Exam
        </Link>
      </Button>
      {user && (
        <>
          <Button asChild variant="ghost" size="sm" className="justify-start">
            <Link to="/exams">
              <Users className="mr-2 h-4 w-4" /> Host
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="justify-start">
            <Link to="/history">
              <History className="mr-2 h-4 w-4" /> History
            </Link>
          </Button>
        </>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full">
      <div
        className={cn(
          "w-full transition-all duration-300",
          scrolled ? "glass border-b" : "border-b border-transparent",
        )}
      >
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-linear-to-br from-brand to-cyan text-brand-foreground shadow-lg">
              <Brain className="h-5 w-5" />
            </span>
            <span className="truncate text-lg font-extrabold tracking-tight">QuizForge</span>
          </Link>

          <div className="flex items-center gap-1">
            <nav className="hidden items-center gap-1 md:flex">{links}</nav>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="min-h-11 min-w-11 rounded-full"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {user ? (
              <div className="hidden items-center gap-2 md:flex">
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarFallback className="bg-linear-to-br from-brand to-cyan text-xs font-bold text-brand-foreground">
                    {initial}
                  </AvatarFallback>
                </Avatar>
                <Button variant="ghost" size="sm" onClick={signOut} aria-label="Sign out">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                className="hidden rounded-full bg-linear-to-r from-brand to-cyan text-brand-foreground shine md:inline-flex"
                onClick={() => navigate({ to: "/auth" })}
              >
                <LogIn className="mr-2 h-4 w-4" /> Sign in
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="min-h-11 min-w-11 md:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-border glass md:hidden"
            >
              <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
                {links}
                {user ? (
                  <Button variant="ghost" size="sm" className="justify-start" onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="mt-1 rounded-full bg-linear-to-r from-brand to-cyan text-brand-foreground"
                    onClick={() => navigate({ to: "/auth" })}
                  >
                    <LogIn className="mr-2 h-4 w-4" /> Sign in
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
