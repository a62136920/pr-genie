import * as core from "@actions/core";
import { type AiConfig } from "./ai.js";
import { runPrSummary } from "./pr-summary.js";
import { runReleaseNotes } from "./release-notes.js";

function readConfig(): AiConfig {
  return {
    apiKey: core.getInput("api-key", { required: true }),
    apiBase: core.getInput("api-base") || "https://api.openai.com/v1",
    model: core.getInput("model") || "gpt-4o-mini",
    language: (core.getInput("language") || "auto") as AiConfig["language"],
  };
}

async function main(): Promise<void> {
  const mode = core.getInput("mode", { required: true });
  const config = readConfig();
  const marker = core.getInput("comment-marker") || "<!-- pr-genie -->";
  const maxDiffChars = Number(core.getInput("max-diff-chars") || "120000");

  if (mode === "pr-summary") {
    const result = await runPrSummary(config, marker, maxDiffChars);
    core.setOutput("summary", result.summary);
    core.setOutput("comment-id", String(result.commentId));
    core.info(`PR summary posted (comment #${result.commentId})`);
    return;
  }

  if (mode === "release-notes") {
    const tag = core.getInput("tag") || process.env.GITHUB_REF_NAME || "";
    if (!tag) {
      throw new Error("release-notes mode requires tag input or GITHUB_REF_NAME");
    }
    const previousTag = core.getInput("previous-tag") || undefined;
    const notes = await runReleaseNotes(config, tag, previousTag);
    core.setOutput("summary", notes);
    core.info(`Release notes generated for ${tag}`);
    return;
  }

  throw new Error(`Unknown mode: ${mode}. Use pr-summary or release-notes.`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  core.setFailed(message);
});
