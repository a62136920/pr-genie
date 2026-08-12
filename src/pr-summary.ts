import * as core from "@actions/core";
import * as github from "@actions/github";
import { type AiConfig } from "./ai.js";
import {
  getOctokit,
  getPrDiff,
  getRepoContext,
  upsertComment,
  updatePrBody,
} from "./github.js";
import { generateWithTemplate } from "./template.js";

const PR_SYSTEM = `You are a senior engineer writing concise, actionable PR descriptions.
Output markdown with sections:
## 概要 / Summary
## 变更点 / Changes
## 测试建议 / Test plan
## 风险 / Risks (if any)
Keep bullets short. No filler.`;

export async function runPrSummary(
  config: AiConfig,
  marker: string,
  maxDiffChars: number,
): Promise<{ summary: string; commentId: number }> {
  const octokit = getOctokit();
  const { owner, repo } = getRepoContext();

  const prNumber =
    github.context.payload.pull_request?.number ??
    github.context.payload.issue?.number;

  if (!prNumber) {
    throw new Error("This action must run on pull_request or issue_comment events");
  }

  const pull = await octokit.rest.pulls.get({ owner, repo, pull_number: prNumber });
  let diff = await getPrDiff(octokit, owner, repo, prNumber);
  if (diff.length > maxDiffChars) {
    diff = `${diff.slice(0, maxDiffChars)}\n\n...[diff truncated]`;
  }

  const userPrompt = [
    `Repository: ${owner}/${repo}`,
    `PR #${prNumber}: ${pull.data.title}`,
    `Author: ${pull.data.user?.login ?? "unknown"}`,
    `Base: ${pull.data.base.ref} <- Head: ${pull.data.head.ref}`,
    "",
    "Existing PR body:",
    pull.data.body || "(empty)",
    "",
    "Diff:",
    diff || "(no diff)",
    "",
    "Generate the PR description markdown.",
  ].join("\n");

  const templatePath = core.getInput("template-path") || undefined;
  const summary = await generateWithTemplate(config, templatePath, PR_SYSTEM, userPrompt, core.info);
  const commentId = await upsertComment(octokit, owner, repo, prNumber, marker, summary);

  const writeToBody = (core.getInput("write-to-body") || "false").toLowerCase() === "true";
  if (writeToBody) {
    await updatePrBody(octokit, owner, repo, prNumber, summary);
  }

  return { summary, commentId };
}
