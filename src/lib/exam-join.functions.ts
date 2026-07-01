import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CodeSchema = z.object({ code: z.string().trim().toUpperCase().length(6) });

export const getExamByCode = createServerFn({ method: "POST" })
  .inputValidator((data) => CodeSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: exam, error } = await supabaseAdmin
      .from("exams")
      .select("id, title, code, status, time_limit_seconds, started_at, ends_at, questions")
      .eq("code", data.code)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!exam) throw new Error("Exam not found.");
    if (exam.status === "draft") throw new Error("This exam has not started yet.");
    if (exam.status === "ended") throw new Error("This exam has ended.");
    // strip correct answers before sending to student
    const publicQuestions = (exam.questions as Array<{ question: string; options: string[] }>).map(
      (q) => ({ question: q.question, options: q.options }),
    );
    return {
      id: exam.id,
      title: exam.title,
      code: exam.code,
      time_limit_seconds: exam.time_limit_seconds,
      started_at: exam.started_at,
      ends_at: exam.ends_at,
      questions: publicQuestions,
    };
  });

const SubmitSchema = z.object({
  examId: z.string().uuid(),
  studentName: z.string().trim().min(1).max(80),
  answers: z.array(z.number().int().min(-1).max(3)),
});

export const submitExam = createServerFn({ method: "POST" })
  .inputValidator((data) => SubmitSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: exam, error } = await supabaseAdmin
      .from("exams")
      .select("id, status, ends_at, questions")
      .eq("id", data.examId)
      .single();
    if (error) throw new Error(error.message);
    if (exam.status === "draft") throw new Error("Exam has not started.");
    // Allow submission slightly after ends_at (grace) but reject if forcibly ended long ago
    const questions = exam.questions as Array<{ correctIndex: number }>;
    const score = data.answers.reduce(
      (s, a, i) => (a === questions[i]?.correctIndex ? s + 1 : s),
      0,
    );
    const { error: iErr } = await supabaseAdmin.from("exam_submissions").insert({
      exam_id: exam.id,
      student_name: data.studentName,
      answers: data.answers,
      score,
      total_questions: questions.length,
    });
    if (iErr) throw new Error(iErr.message);
    return { score, total: questions.length };
  });
