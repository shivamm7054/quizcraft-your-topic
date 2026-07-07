import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  question: z.string().trim().min(2).max(500),
});

const SourceSchema = z.object({
  title: z.string(),
  snippet: z.string(),
});

const AnswerSchema = z.object({
  answer: z.string(),
  bullets: z.array(z.string()).default([]),
  related: z.array(z.string()).default([]),
  sources: z.array(SourceSchema).default([]),
});

export type AskAnswer = z.infer<typeof AnswerSchema>;

export const askQuestion = createServerFn({ method: "POST" })
  .inputValidator((data) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Lovable AI is not configured.");

    const prompt = `Answer the following user question clearly and factually, as a helpful search assistant.

Question: ${data.question}

Return ONLY valid JSON in this exact shape:
{
  "answer": "A concise 2-4 sentence direct answer.",
  "bullets": ["key point 1", "key point 2", "key point 3"],
  "related": ["related question 1", "related question 2", "related question 3"],
  "sources": [{"title":"reference name","snippet":"short supporting note"}]
}
Keep bullets to 3-5 items. Keep related to 3 short questions. Sources are illustrative references (books, standards, well-known sites) — do not fabricate URLs.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a knowledgeable search assistant. Reply in strict JSON only — no markdown fences." },
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
      parsed = match ? JSON.parse(match[0]) : {};
    }
    return AnswerSchema.parse(parsed);
  });
