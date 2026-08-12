import * as core from "@actions/core";
import { type AiConfig } from "./ai.js";
import {
  createOrUpdateRelease,
  getLatestTag,
  getOctokit,
  getRepoContext,
  getTagDate,
  listCommitsSinceTag,
  listMergedPullRequests,
} from "./github.js";
import { generateWithTemplate } from "./template.js";

const RELEASE_SYSTEM = `You are a release manager writing clear GitHub Release Notes.
Output markdown with:
## Highlights
## Changes
### Features
### Fixes
### Other
## Contributors
Use conventional grouping when possible. Be concise.`;

export async function runReleaseNotes(
  config: AiConfig,
  tag: string,
  previousTagInput?: string,
): Promise<string> {
  const octokit = getOctokit();
  const { owner, repo } = getRepoContext();

  const previousTag = previousTagInput || (await getLatestTag(octokit, owner, repo, tag));
  const since = previousTag ? await getTagDate(octokit, owner, repo, previousTag) : undefined;

  const [commits, pulls] = await Promise.all([
    listCommitsSinceTag(octokit, owner, repo, previousTag),
    listMergedPullRequests(octokit, owner, repo, since),
  ]);

  const userPrompt = [
    `Repository: ${owner}/${repo}`,
    `Release tag: ${tag}`,
    previousTag ? `Previous tag: ${previousTag}` : "Previous tag: (first release)",
    "",
    "Merged PRs:",
    pulls.length
      ? pulls.map((pull) => `- #${pull.number} ${pull.title} (@${pull.user})`).join("\n")
      : "(none)",
    "",
    "Commits:",
    commits.length
      ? commits.map((commit) => `- ${commit.sha} ${commit.message} (${commit.author})`).join("\n")
      : "(none)",
    "",
    "Generate release notes markdown.",
  ].join("\n");

  const templatePath = core.getInput("template-path") || undefined;
  const notes = await generateWithTemplate(config, templatePath, RELEASE_SYSTEM, userPrompt, core.info);
  const updateRelease = (core.getInput("update-release") || "true").toLowerCase() !== "false";

  if (updateRelease) {
    await createOrUpdateRelease(octokit, owner, repo, tag, notes);
  }

  return notes;
}
