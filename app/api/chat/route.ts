import { siteConfig } from "../../../siteConfig";

export const runtime = "edge";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const cleanReply = (text: unknown) => {
  if (typeof text !== "string") return "";
  return text
    .replace(/^["'“”]+|["'“”]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
};

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const apiKey = (
      process.env.AI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.OPENAI_API_KEY ||
      ""
    ).trim();
    const baseUrl = (
      process.env.AI_API_BASE_URL ||
      process.env.GEMINI_API_BASE_URL ||
      "https://generativelanguage.googleapis.com"
    )
      .trim()
      .replace(/\/+$/, "");
    const modelId = (process.env.AI_MODEL_ID || siteConfig.geminiConfig.modelId).trim();

    if (!apiKey) {
      return jsonResponse({ error: "Key missing" }, 500);
    }

    if (!message || typeof message !== "string") {
      return jsonResponse({ error: "Message missing" }, 400);
    }

    const isGoogleNative = baseUrl.includes("generativelanguage.googleapis.com");
    const response = isGoogleNative
      ? await fetch(`${baseUrl}/v1beta/models/${modelId}:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: siteConfig.geminiConfig.systemPrompt }],
            },
            contents: [{ parts: [{ text: message }] }],
            generationConfig: {
              maxOutputTokens: siteConfig.geminiConfig.maxOutputTokens,
              temperature: siteConfig.geminiConfig.temperature,
            },
          }),
        })
      : await fetch(`${baseUrl}${baseUrl.endsWith("/v1") ? "" : "/v1"}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: modelId,
            messages: [
              { role: "system", content: siteConfig.geminiConfig.systemPrompt },
              { role: "user", content: message },
            ],
            max_tokens: siteConfig.geminiConfig.maxOutputTokens,
            temperature: siteConfig.geminiConfig.temperature,
          }),
        });

    const data = await response.json();

    if (!response.ok) {
      return jsonResponse(
        {
          error: `Model request failed: ${response.status}`,
          details: data.error?.message || data.message || "Unknown error",
        },
        response.status,
      );
    }

    const reply = cleanReply(isGoogleNative
      ? data.candidates?.[0]?.content?.parts?.[0]?.text
      : data.choices?.[0]?.message?.content);

    return jsonResponse({ reply: reply || "现在稍微有点卡住了，等我缓一下。" });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return jsonResponse({ error: message }, 500);
  }
}

export async function GET() {
  return jsonResponse({
    status: "Ready",
    model: process.env.AI_MODEL_ID || siteConfig.geminiConfig.modelId,
  });
}
