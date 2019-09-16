const cp = require("child_process");
cp.execSync(`cd ${__dirname}; npm ci`);

const core = require("@actions/core");
const github = require("@actions/github");
const picomatch = require("picomatch");

const token = core.getInput("token", { required: true });
const labels = JSON.parse(core.getInput("labels", { required: true }));
const number = core.getInput("pull_number", { required: true });
const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");

const matchers = Object.entries(labels).map(([label, globs]) => ({
  label,
  matches: picomatch(globs)
}));

const octokit = new github.GitHub(token);

octokit.pulls
  .listFiles({ owner, repo, pull_number: number })
  .then(({ status, data: files }) => {
    if (status < 200 || status >= 300) {
      throw new Error(`Received status ${status} from API.`);
    }

    const newLabels = [];

    for (const { filename } of files) {
      for (const { label, matches } of matchers) {
        if (matches(filename)) newLabels.push(label);
      }
    }

    core.setOutput("labels", JSON.stringify(newLabels));
  })
  .catch(e => core.setFailed(e.message));
