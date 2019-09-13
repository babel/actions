console.log("STARTED");

const cp = require("child_process");
cp.execSync(`cd ${__dirname}; npm ci`);

const core = require("@actions/core");
const github = require("@actions/github");

const org = core.getInput("org", { required: true });
const username = core.getInput("username", { required: true });
const token = core.getInput("token", { required: true });

const octokit = new github.GitHub(token);

main();
async function main() {
  const { data: orgs } = checkStatus(
    await octokit.orgs.listForUser({ username, per_page: 100 }),
  );

  const isMember = orgs.some(({ login }) => login === org);

  core.setOutput("result", isMember ? "1" : "0");
}

function checkStatus(result) {
  if (result.status >= 200 && result.status < 300) {
    return result;
  }

  core.setFailed(`Received status ${result.status} from API.`);
  process.exit();
}
