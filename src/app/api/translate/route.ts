import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, from, to } = await req.json();
    if (!text || !from || !to) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const fromLabel = from === "fr" ? "français" : "anglais";
    const toLabel = to === "fr" ? "français" : "anglais";

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
            content: `Traduis ce texte du ${fromLabel} vers le ${toLabel}. Réponds uniquement avec la traduction, sans guillemets, sans explication.\n\nTexte : ${text}`,
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
