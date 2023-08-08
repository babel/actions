const cp = require("child_process");
cp.execSync(`cd ${__dirname}; npm ci`);

const core = require("@actions/core");

const prefix = core.getInput("prefix") ?? "";

const exec = cmd => cp.execSync(cmd).toString().trim();

const currentTag = exec(`git describe --abbrev=0 --tags --match '${prefix}*' HEAD`);
const lastTag = exec(`git describe --abbrev=0 --tags --match '${prefix}*' ${currentTag}^`);

core.setOutput("old", lastTag);
core.setOutput("new", currentTag);

console.log({ lastTag, currentTag });
