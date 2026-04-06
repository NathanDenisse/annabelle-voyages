import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

const SYSTEM_PROMPT = `Tu es l'assistant d'Annabelle Cathala, une créatrice de contenu voyage française vivant à Dublin. Elle crée des photos et vidéos de voyages dans les plus beaux endroits du monde, avec un style authentique, chaleureux et inspirant. Génère des textes courts, élégants et engageants pour son portfolio web. Réponds uniquement en JSON avec un tableau "suggestions" de 3 strings.`;

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    const { allowed } = rateLimit(ip, { maxRequests: 20, windowMs: 60_000 });
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { field, context, lang } = await req.json();
    if (!field) {
      return NextResponse.json({ error: "Missing field" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const langLabel = lang === "en" ? "anglais" : "français";
    let prompt = `Génère 3 suggestions en ${langLabel} pour le champ "${field}".`;
    if (context) {
      prompt += ` Contexte : ${JSON.stringify(context)}`;
    }
    prompt += ` Réponds uniquement en JSON : {"suggestions": ["...", "...", "..."]}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Suggestion failed" }, { status: 500 });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text?.trim() || "{}";

    // Parse JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ suggestions: [] });
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return NextResponse.json({ suggestions: parsed.suggestions || [] });
    } catch {
      return NextResponse.json({ suggestions: [] });
    }
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
