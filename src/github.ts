import * as github from "@actions/github";
import * as core from "@actions/core";

export type OctokitClient = ReturnType<typeof github.getOctokit>;

export function getOctokit(): OctokitClient {
  const token = core.getInput("github-token") || process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GitHub token not found. Set github-token input or GITHUB_TOKEN env.");
  }
  return github.getOctokit(token);
}

export function getRepoContext(): { owner: string; repo: string } {
  const { owner, repo } = github.context.repo;
  return { owner, repo };
}

export async function getPrDiff(
  octokit: OctokitClient,
  owner: string,
  repo: string,
  pullNumber: number,
): Promise<string> {
  const response = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: pullNumber,
    mediaType: { format: "diff" },
  });
  return String(response.data);
}

export async function findBotComment(
  octokit: OctokitClient,
  owner: string,
  repo: string,
  issueNumber: number,
  marker: string,
): Promise<number | undefined> {
  const comments = await octokit.paginate(octokit.rest.issues.listComments, {
    owner,
    repo,
    issue_number: issueNumber,
    per_page: 100,
  });

  const match = comments.find((comment) => comment.body?.includes(marker));
  return match?.id;
}

export async function upsertComment(
  octokit: OctokitClient,
  owner: string,
  repo: string,
  issueNumber: number,
  marker: string,
  body: string,
): Promise<number> {
  const fullBody = `${marker}\n${body}`;
  const existingId = await findBotComment(octokit, owner, repo, issueNumber, marker);

  if (existingId) {
    const updated = await octokit.rest.issues.updateComment({
      owner,
      repo,
      comment_id: existingId,
      body: fullBody,
    });
    return updated.data.id;
  }

  const created = await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body: fullBody,
  });
  return created.data.id;
}

export async function updatePrBody(
  octokit: OctokitClient,
  owner: string,
  repo: string,
  pullNumber: number,
  body: string,
): Promise<void> {
  await octokit.rest.pulls.update({
    owner,
    repo,
    pull_number: pullNumber,
    body,
  });
}

export async function listMergedPullRequests(
  octokit: OctokitClient,
  owner: string,
  repo: string,
  since?: string,
): Promise<Array<{ number: number; title: string; user: string; body: string }>> {
  const pulls = await octokit.paginate(octokit.rest.pulls.list, {
    owner,
    repo,
    state: "closed",
    sort: "updated",
    direction: "desc",
    per_page: 100,
  });

  const sinceTime = since ? Date.parse(since) : undefined;

  return pulls
    .filter((pull) => Boolean(pull.merged_at))
    .filter((pull) => !sinceTime || Date.parse(pull.merged_at!) >= sinceTime)
    .map((pull) => ({
      number: pull.number,
      title: pull.title,
      user: pull.user?.login ?? "unknown",
      body: pull.body ?? "",
    }));
}

export async function listCommitsSinceTag(
  octokit: OctokitClient,
  owner: string,
  repo: string,
  previousTag?: string,
): Promise<Array<{ sha: string; message: string; author: string }>> {
  if (!previousTag) {
    const commits = await octokit.paginate(octokit.rest.repos.listCommits, {
      owner,
      repo,
      per_page: 100,
    });
    return commits.map((commit) => ({
      sha: commit.sha.slice(0, 7),
      message: commit.commit.message.split("\n")[0] ?? "",
      author: commit.commit.author?.name ?? "unknown",
    }));
  }

  const response = await octokit.rest.repos.compareCommitsWithBasehead({
    owner,
    repo,
    basehead: `${previousTag}...HEAD`,
  });

  return (response.data.commits ?? []).map((commit) => ({
    sha: commit.sha.slice(0, 7),
    message: commit.commit.message.split("\n")[0] ?? "",
    author: commit.commit.author?.name ?? "unknown",
  }));
}

export async function getTagDate(
  octokit: OctokitClient,
  owner: string,
  repo: string,
  tag: string,
): Promise<string | undefined> {
  try {
    const ref = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `tags/${tag}`,
    });
    const objectType = ref.data.object.type;
    const objectSha = ref.data.object.sha;

    if (objectType === "tag") {
      const tagObj = await octokit.rest.git.getTag({ owner, repo, tag_sha: objectSha });
      return tagObj.data.tagger?.date;
    }

    const commit = await octokit.rest.git.getCommit({ owner, repo, commit_sha: objectSha });
    return commit.data.committer?.date;
  } catch {
    return undefined;
  }
}

export async function getLatestTag(
  octokit: OctokitClient,
  owner: string,
  repo: string,
  excludeTag?: string,
): Promise<string | undefined> {
  const tags = await octokit.paginate(octokit.rest.repos.listTags, {
    owner,
    repo,
    per_page: 30,
  });

  const candidates = tags.filter((tag) => tag.name !== excludeTag).slice(0, 20);
  const dated = await Promise.all(
    candidates.map(async (tag) => ({
      name: tag.name,
      date: (await getTagDate(octokit, owner, repo, tag.name)) ?? "",
    })),
  );

  dated.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
  return dated[0]?.name;
}

export async function createOrUpdateRelease(
  octokit: OctokitClient,
  owner: string,
  repo: string,
  tag: string,
  notes: string,
): Promise<void> {
  try {
    const existing = await octokit.rest.repos.getReleaseByTag({ owner, repo, tag });
    await octokit.rest.repos.updateRelease({
      owner,
      repo,
      release_id: existing.data.id,
      body: notes,
    });
    return;
  } catch {
    // release may not exist yet
  }

  await octokit.rest.repos.createRelease({
    owner,
    repo,
    tag_name: tag,
    name: tag,
    body: notes,
    draft: false,
    generate_release_notes: false,
  });
}
