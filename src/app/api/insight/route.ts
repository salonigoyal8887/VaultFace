import { NextRequest, NextResponse } from "next/server";
import { fetchGeminiText } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const inputText = body?.text?.trim();

    if (!inputText) {
      return NextResponse.json({ error: "Missing 'text' field in request body." }, { status: 400 });
    }

    const content = await fetchGeminiText(inputText);

    return NextResponse.json({ content });
  } catch (err: unknown) {
    console.error("Insight API error:", err);
    return NextResponse.json(
      {
        error: "Insight generation failed",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
