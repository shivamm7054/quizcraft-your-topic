import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const QuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().optional().default(""),
});

const SaveSchema = z.object({
  topic: z.string().min(1).max(200),
  difficulty: z.enum(["easy", "medium", "hard"]),
  score: z.number().int().min(0),
  totalQuestions: z.number().int().min(1),
  questions: z.array(QuestionSchema),
  answers: z.array(z.number().int()),
});

export const saveQuizResult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => SaveSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error, data: row } = await context.supabase
      .from("quiz_results")
      .insert({
        user_id: context.userId,
        topic: data.topic,
        difficulty: data.difficulty,
        score: data.score,
        total_questions: data.totalQuestions,
        questions: data.questions,
        answers: data.answers,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const listQuizResults = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("quiz_results")
      .select("id, topic, difficulty, score, total_questions, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const deleteQuizResult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("quiz_results")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
