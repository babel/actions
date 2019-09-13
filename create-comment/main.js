const cp = require("child_process");
cp.execSync(`cd ${__dirname}; npm ci`);

const core = require("@actions/core");
const github = require("@actions/github");

const token = core.getInput("token", { required: true });
const comment = core.getInput("comment", { required: true });
const issue = core.getInput("issue", { required: true });
const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");

const octokit = new github.GitHub(token);

octokit.issues.createComment({
  owner,
  repo,
  issue_number: issue,
  body: comment,
}).then(
  ({ status }) => {
    if (status < 200 || status >= 300) {
      core.setFailed(`Received status ${result.status} from API.`)
    }
  },
  e => core.setFailed(e.message),
);
