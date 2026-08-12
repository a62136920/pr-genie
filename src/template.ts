import { readFile } from "node:fs/promises";
import { chatCompletion, languageHint, type AiConfig, type Language } from "./ai.js";

export interface PromptTemplate {
  system: string;
  language?: Language;
}

export async function loadTemplate(templatePath: string): Promise<PromptTemplate> {
  const raw = await readFile(templatePath, "utf8");
  const systemMatch = raw.match(/system:\s*\|\s*\n([\s\S]*?)(?:\n[a-z_]+:|$)/);
  const languageMatch = raw.match(/^language:\s*(.+)$/m);

  if (!systemMatch?.[1]) {
    throw new Error(`Invalid template: missing system block in ${templatePath}`);
  }

  const dedented = systemMatch[1]
    .split("\n")
    .map((line) => line.replace(/^\s{2}/, ""))
    .join("\n")
    .trim();

  const language = (languageMatch?.[1]?.trim() as Language | undefined) ?? undefined;
  return { system: dedented, language };
}

export async function generateWithTemplate(
  config: AiConfig,
  templatePath: string | undefined,
  defaultSystem: string,
  userPrompt: string,
): Promise<string> {
  let system = defaultSystem;
  let language = config.language;

  if (templatePath) {
    const template = await loadTemplate(templatePath);
    system = template.system;
    if (template.language) {
      language = template.language;
    }
  }

  const mergedPrompt = `${userPrompt}\n\n${languageHint(language)}`;
  return chatCompletion({ ...config, language }, system, mergedPrompt);
}
