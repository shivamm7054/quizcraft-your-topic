import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Brain, Loader2 } from "lucide-react";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — QuizForge" },
      { name: "description", content: "Sign in to save your quiz history on QuizForge." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, [navigate]);

  const signInGoogle = async () => {
    setSigning(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message || "Sign-in failed");
        setSigning(false);
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/" });
    } catch (e) {
      toast.error((e as Error).message);
      setSigning(false);
    }
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
        </div>
      </header>
      <main className="mx-auto flex max-w-md items-center px-6 py-16">
        <Card className="w-full shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Sign in to QuizForge</CardTitle>
            <CardDescription>Save your quiz history and track your progress.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={signInGoogle} disabled={signing} size="lg" className="w-full" variant="outline">
              {signing ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirecting…</>
              ) : (
                <><GoogleIcon /> Continue with Google</>
              )}
            </Button>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              You can still take quizzes without an account — just sign in to save them.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.65 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.9 1.5l2.7-2.6C16.9 3.4 14.7 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12S6.7 21.6 12 21.6c6.9 0 11.5-4.8 11.5-11.6 0-.8-.1-1.4-.2-2H12z"/>
    </svg>
  );
}
