const cp = require("child_process");
cp.execSync(`cd ${__dirname}; npm ci`);

const path = require("path");
const fs = require("fs");

{
  // GitHub has a bug where their API says that the Copilot user URL is
  // https://api.github.com/users/Copilot, but it's actually
  // https://api.github.com/users/Copilot[bot]
  const fileToFix = path.resolve(__dirname, "node_modules/lerna-changelog/lib/github-api.js");
  let text = fs.readFileSync(fileToFix, "utf-8");
  text = text.replace("_fetch(url) {\n", `_fetch(url) { if (url === "https://api.github.com/users/Copilot") url += "[bot]";\n`);
  fs.writeFileSync(fileToFix, text);
}

const core = require("@actions/core");
const lernaChangelog = path.resolve(__dirname, "node_modules/.bin/lerna-changelog");

const exec = cmd => cp.execSync(cmd).toString().trim();

const tagFrom = core.getInput("from", { required: true });
const tagTo = core.getInput("to", { required: true });
const tagFilter = core.getInput("filter")

if (tagFilter) { /* Patch lerna-changelog to only filter for relevant tags */
  const fs = require("fs");
  const filepath = __dirname + "/node_modules/lerna-changelog/lib/changelog.js"
  let code = fs.readFileSync(filepath, "utf-8");
  const INSERTION_POINT = ".map(ref => ref.substr(TAG_PREFIX.length))"
  code = code.replace(INSERTION_POINT, `${INSERTION_POINT}
    .filter(ref => ref.includes(${JSON.stringify(tagFilter)}))
  `);
  fs.writeFileSync(filepath, code);
}

const changelog = exec(`node ${lernaChangelog} --tag-from ${tagFrom} --tag-to ${tagTo}`);

core.setOutput("changelog", JSON.stringify(changelog));
