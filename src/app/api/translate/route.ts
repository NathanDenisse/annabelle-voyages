import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    const { allowed } = rateLimit(ip, { maxRequests: 20, windowMs: 60_000 });
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { text, from, to } = await req.json();
    if (!text || !from || !to) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const isFrToEn = from === "fr" && to === "en";
    const fromLabel = from === "fr" ? "français" : "anglais";
    const toLabel = to === "fr" ? "français" : "anglais";

    const prompt = isFrToEn
      ? `Traduis ce texte du français vers l'anglais. C'est pour le site d'une créatrice de contenu voyage. Garde un ton authentique et inspirant. Réponds uniquement avec la traduction, rien d'autre.\n\nTexte : ${text}`
      : `Traduis ce texte du ${fromLabel} vers le ${toLabel}. Réponds uniquement avec la traduction, rien d'autre.\n\nTexte : ${text}`;

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
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Translation failed" }, { status: 500 });
    }

    const data = await response.json();
    const translation = data.content?.[0]?.text?.trim() || "";

    return NextResponse.json({ translation });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
