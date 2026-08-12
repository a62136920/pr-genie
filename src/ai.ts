export type Language = "zh" | "en" | "auto";

export interface AiProviderConfig {
  apiKey: string;
  apiBase: string;
  model: string;
}

export interface AiConfig extends AiProviderConfig {
  language: Language;
  fallback?: AiProviderConfig;
}

export async function chatCompletion(
  config: AiProviderConfig,
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

export async function chatCompletionWithFallback(
  config: AiConfig,
  system: string,
  user: string,
  log: (message: string) => void = () => undefined,
): Promise<string> {
  try {
    return await chatCompletion(config, system, user);
  } catch (primaryError) {
    if (!config.fallback?.apiKey) {
      throw primaryError;
    }
    const reason = primaryError instanceof Error ? primaryError.message : String(primaryError);
    log(`Primary provider failed, switching to fallback: ${reason}`);
    return chatCompletion(config.fallback, system, user);
  }
}

export function languageHint(language: Language): string {
  if (language === "zh") return "Write in Simplified Chinese.";
  if (language === "en") return "Write in English.";
  return "Match the dominant language of commits/PR titles; default to Simplified Chinese if unclear.";
}
