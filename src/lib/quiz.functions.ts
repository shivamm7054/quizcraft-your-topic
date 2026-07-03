import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  topic: z.string().trim().min(2).max(120),
  count: z.number().int().min(1).max(50).default(5),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
});

const QuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().optional().default(""),
});

export type QuizQuestion = z.infer<typeof QuestionSchema>;

export const generateQuiz = createServerFn({ method: "POST" })
  .inputValidator((data) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Lovable AI is not configured.");

    const prompt = `Generate exactly ${data.count} multiple-choice questions on the topic "${data.topic}" at ${data.difficulty} difficulty. Each question must have exactly 4 options and one correct answer. Return ONLY valid JSON in this shape: {"questions":[{"question":"...","options":["a","b","c","d"],"correctIndex":0,"explanation":"..."}]}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an expert quiz generator. Respond with strict JSON only, no markdown fences." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) throw new Error("Rate limit reached. Please try again shortly.");
      if (res.status === 402) throw new Error("AI credits exhausted. Please add credits in Lovable Cloud.");
      throw new Error(`AI request failed: ${text.slice(0, 200)}`);
    }

    const json = await res.json();
    const content: string = json.choices?.[0]?.message?.content ?? "{}";

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { questions: [] };
    }

    const questions = z.object({ questions: z.array(QuestionSchema) }).parse(parsed).questions;
    return { topic: data.topic, difficulty: data.difficulty, questions };
  });
