export type Language = "zh" | "en" | "auto";

export interface AiConfig {
  apiKey: string;
  apiBase: string;
  model: string;
  language: Language;
}

export async function chatCompletion(
  config: AiConfig,
  system: string,
  user: string,
): Promise<string> {
  const url = `${config.apiBase.replace(/\/$/, "")}/chat/completions`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`AI request failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("AI returned empty content");
  }
  return content;
}

export function languageHint(language: Language): string {
  if (language === "zh") return "Write in Simplified Chinese.";
  if (language === "en") return "Write in English.";
  return "Match the dominant language of commits/PR titles; default to Simplified Chinese if unclear.";
}
