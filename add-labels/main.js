const cp = require("child_process");
cp.execSync(`cd ${__dirname}; npm ci`);

const core = require("@actions/core");
const github = require("@actions/github");

const token = core.getInput("token", { required: true });
const labels = JSON.parse(core.getInput("labels", { required: true }));
const number = core.getInput("number", { required: true });
const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");

const octokit = new github.GitHub(token);

octokit.issues.addLabels({ owner, repo, issue_number: number, labels }).then(
  ({ status }) => {
    if (status < 200 || status >= 300) {
      core.setFailed(`Received status ${status} from API.`);
    }
  },
  e => core.setFailed(e.message)
);
