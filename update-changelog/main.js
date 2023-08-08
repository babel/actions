const cp = require("child_process");
const fs = require("fs").promises;
const path = require("path");

const exec = cmd => new Promise((res, rej) => {
  cp.exec(cmd, (err, stdout) => err ? rej(err) : res(stdout.toString()));
});

async function main() {
  await exec(`cd ${__dirname}; npm ci`);

  const core = require("@actions/core");

  const CHANGELOG_FILENAME = core.getInput("filename") || "CHANGELOG.md";
  const INSERTION_POINT = "<!-- insert-new-changelog-here -->";
  const CHANGELOG_PATH = path.resolve(process.env.GITHUB_WORKSPACE, CHANGELOG_FILENAME);

  const changelog = await fs.readFile(CHANGELOG_PATH, "utf8");
  if (!changelog.includes(INSERTION_POINT)) {
    throw new Error(`Missing "${INSERTION_POINT}" in CHANGELOG.md`);
  }

  let newChangelog = core.getInput("changelog", { required: true });
  newChangelog = JSON.parse(newChangelog);
  // Remove committers
  newChangelog = newChangelog.split("\n\n#### Committers")[0];

  newChangelog = changelog.replace(INSERTION_POINT, INSERTION_POINT + "\n" + newChangelog);

  await fs.writeFile(CHANGELOG_PATH, newChangelog);
}

main().catch(e => {
  process.exitCode = 1;
  throw e;
});
