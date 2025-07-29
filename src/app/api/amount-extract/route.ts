// File: app/api/gemini/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchGeminiWithInlineData } from "@/lib/gemini"; 

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_MIME_TYPE = "application/pdf";

const EXTRACTION_PROMPT = `
You are a precise financial extraction assistant.

The attached PDF is a payslip, invoice, or receipt.

Return ONLY the final payable amount:
Priority labels:
1. Net Salary Payable / Net Salary / Net Pay
2. Total Earnings / Total Earnings (A)
3. Grand Total / Amount Paid / Total Amount / Total

Rules:
- Output ONLY the number (no commas, no currency symbol, no words).
- Keep decimals if present.
- If nothing matches, output EXACTLY: NONE
`.trim();

// ---------- Helpers ----------
function normalizeNumberString(str: string): string {
  return str.replace(/(?<=\d),(?=\d)/g, "").trim();
}

function extractAmount(text: string): number | null {
  const cleaned = normalizeNumberString(text);
  if (/^\s*NONE\s*$/i.test(cleaned)) return null;

  const match = cleaned.match(/\d+(?:\.\d+)?/);
  const value = match ? parseFloat(match[0]) : NaN;
  return isNaN(value) ? null : value;
}

// ---------- Main Route ----------
export async function POST(req: NextRequest) {
  try {
    const { base64, mimeType } = await req.json();

    if (!base64) {
      return NextResponse.json({ error: "Missing 'base64' field." }, { status: 400 });
    }

    const rawText = await fetchGeminiWithInlineData({
      base64,
      mimeType: mimeType || DEFAULT_MIME_TYPE,
      prompt: EXTRACTION_PROMPT,
    });

    const amount = extractAmount(rawText);

    if (amount === null) {
      return NextResponse.json(
        { error: "Could not extract a valid amount.", rawText },
        { status: 422 }
      );
    }

    return NextResponse.json({
      amount,
      rawText,
      source: "gemini-inline-pdf",
    });
  } catch (err: unknown) {
    console.error("Gemini PDF extraction error:", err);
    return NextResponse.json(
      {
        error: "Gemini PDF extraction failed.",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
