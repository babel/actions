const cp = require("child_process");
cp.execSync(`cd ${__dirname}; npm ci`);

const core = require("@actions/core");
const github = require("@actions/github");

const base = core.getInput("base") || process.env.GITHUB_REF.replace("refs/heads/", "");

const token = core.getInput("token", { required: true });
const branch = core.getInput("branch", { required: true });
const title = core.getInput("title", { required: true });
const description = core.getInput("description", { required: true });
const labels = core.getInput("labels");

const [owner, repo] = (core.getInput("repository") || process.env.GITHUB_REPOSITORY).split("/");

const octokit = new github.GitHub(token);

(async function main() {
  const { data: prs } = await octokit.pulls.list({
    owner,
    repo,
    head: `${owner}:${branch}`,
    base,
    state: "open"
  });

  if (prs.length > 0) return;

  const result = await octokit.pulls.create({
    owner,
    repo,
    head: branch,
    base,
    maintainer_can_modify: true,
    title,
    body: description,
  });
  console.log("Create PR response: ", result);

  await octokit.issues.addLabels({
    owner,
    repo,
    issue_number: result.data.number,
    labels: labels ? labels.split("\n").map(l => l.trim()).filter(Boolean) : []
  })
})();
