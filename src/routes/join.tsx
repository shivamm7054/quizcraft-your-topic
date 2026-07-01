import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

export const Route = createFileRoute("/join")({
  validateSearch: z.object({ code: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Join an exam — QuizForge" },
      { name: "description", content: "Enter your exam code and name to start." },
    ],
  }),
  component: JoinPage,
});

function JoinPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [code, setCode] = useState((search.code ?? "").toUpperCase());
  const [name, setName] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    const n = name.trim();
    if (c.length !== 6) return toast.error("Code must be 6 characters.");
    if (n.length < 1) return toast.error("Enter your name.");
    sessionStorage.setItem(`exam-name-${c}`, n);
    navigate({ to: "/exam/$code", params: { code: c } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/30">
      <Toaster richColors position="top-center" />
      <div className="mx-auto max-w-md px-6 py-16">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Brain className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">QuizForge</span>
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Join an exam</CardTitle>
            <CardDescription>Enter the 6-character code your host shared.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label>Exam code</Label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="text-center font-mono text-2xl tracking-widest"
                  placeholder="ABC123"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>Your name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
              </div>
              <Button type="submit" size="lg" className="w-full">Join exam</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
