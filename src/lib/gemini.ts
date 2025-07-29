const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1/models";
const MODEL = "gemini-1.5-flash";
const HEADERS = { "Content-Type": "application/json" };

// ---------- 1. Text-only Gemini Request ----------
export async function fetchGeminiText(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is missing");

  const res = await fetch(`${GEMINI_API_BASE}/${MODEL}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    }),
  });

  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  if (!res.ok || !text) {
    const message = json?.error?.message || "Unknown Gemini error";
    throw new Error(`Gemini API failed: ${message}`);
  }

  return text;
}

// ---------- 2. File + Prompt Gemini Request ----------
export async function fetchGeminiWithInlineData(params: {
  base64: string;
  mimeType: string;
  prompt: string;
}): Promise<string> {
  const { base64, mimeType, prompt } = params;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is missing");

  const res = await fetch(`${GEMINI_API_BASE}/${MODEL}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: base64,
                mimeType,
              },
            },
            { text: prompt },
          ],
        },
      ],
      // Optional config
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 256,
      },
    }),
  });

  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  if (!res.ok || !text) {
    const message = json?.error?.message || "Unknown Gemini error";
    throw new Error(`Gemini API failed: ${message}`);
  }

  return text;
}
