import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const QuestionSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.string().min(1)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().optional().default(""),
});

export type ExamQuestion = z.infer<typeof QuestionSchema>;

const CreateSchema = z.object({
  title: z.string().trim().min(2).max(120),
  timeLimitMinutes: z.number().int().min(1).max(240),
  questions: z.array(QuestionSchema).min(1).max(50),
});

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export const createExam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => CreateSchema.parse(data))
  .handler(async ({ data, context }) => {
    // try a few codes to avoid unique collisions
    for (let i = 0; i < 5; i++) {
      const code = makeCode();
      const { data: row, error } = await context.supabase
        .from("exams")
        .insert({
          host_user_id: context.userId,
          title: data.title,
          code,
          questions: data.questions,
          time_limit_seconds: data.timeLimitMinutes * 60,
          status: "draft",
        })
        .select("id, code")
        .single();
      if (!error) return row;
      if (!/duplicate/i.test(error.message)) throw new Error(error.message);
    }
    throw new Error("Could not generate a unique exam code, try again.");
  });

export const listMyExams = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("exams")
      .select("id, title, code, status, time_limit_seconds, started_at, ends_at, created_at, questions")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((e) => ({
      ...e,
      question_count: Array.isArray(e.questions) ? (e.questions as unknown[]).length : 0,
      questions: undefined,
    }));
  });

export const getExam = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: exam, error } = await context.supabase
      .from("exams")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    const { data: subs, error: sErr } = await context.supabase
      .from("exam_submissions")
      .select("id, student_name, score, total_questions, submitted_at")
      .eq("exam_id", data.id)
      .order("score", { ascending: false });
    if (sErr) throw new Error(sErr.message);
    return { exam, submissions: subs ?? [] };
  });

export const getExamResults = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: exam, error } = await context.supabase
      .from("exams")
      .select("id, title, questions, host_user_id")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    if (exam.host_user_id !== context.userId) throw new Error("Not authorized");
    const { data: subs, error: sErr } = await context.supabase
      .from("exam_submissions")
      .select("id, student_name, score, total_questions, answers, submitted_at")
      .eq("exam_id", data.id)
      .order("score", { ascending: false });
    if (sErr) throw new Error(sErr.message);
    return { exam, submissions: subs ?? [] };
  });

export const startExam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: exam, error: gErr } = await context.supabase
      .from("exams")
      .select("time_limit_seconds")
      .eq("id", data.id)
      .single();
    if (gErr) throw new Error(gErr.message);
    const now = new Date();
    const ends = new Date(now.getTime() + exam.time_limit_seconds * 1000);
    const { error } = await context.supabase
      .from("exams")
      .update({ status: "active", started_at: now.toISOString(), ends_at: ends.toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const endExam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("exams")
      .update({ status: "ended", ends_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteExam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("exams").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
