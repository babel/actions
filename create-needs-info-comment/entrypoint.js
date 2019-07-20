const Octokit = require("@octokit/rest");
const { Toolkit } = require("actions-toolkit");

const tools = new Toolkit({
  event: ["issues.labeled"],
});

if (!process.env.BOT_TOKEN) {
  tools.exit.failure(
    "You must include the BOT_TOKEN as an environment variable.",
  );
}
const github = new Octokit({ auth: `token ${process.env.BOT_TOKEN}` });

function message(username) {
  return (
    `Hi @${username}! ` +
    "This issue is missing some important information we'll need " +
    "to be able to reproduce this issue.\n\n" +
    "Please understand that we receive a high volume of issues, " +
    "and there are only a limited number of volunteers that help " +
    "maintain this project. The easier it is for us to decipher an " +
    "issue with the info provided, the more likely it is that we'll " +
    "be able to help.\n\n" +
    "Please make sure you have the following information documented in " +
    "this ticket:\n\n" +
    "1. Your Babel configuration (typically from `.babelrc` or `babel.config.js`)\n" +
    "2. The current (incorrect) behavior you're seeing\n" +
    "3. The behavior you expect\n" +
    "4. A [short, self-contained example](http://sscce.org/)\n\n" +
    "Please provide either a link to the problem via the " +
    "[`repl`](https://babeljs.io/repl/), or if the `repl` is " +
    "insufficient, a new and minimal repository with instructions on " +
    "how to build/replicate the issue."
  );
}

function checkStatus(result) {
  if (result.status >= 200 && result.status < 300) {
    return result;
  }

  tools.exit.failure(`Received status ${result.status} from API.`);
}

async function createComment() {
  return checkStatus(
    await github.issues.createComment({
      ...tools.context.repo,
      issue_number: tools.context.issue.number,
      body: message(tools.context.payload.issue.user.login),
    }),
  );
}

createComment()
  .then(() => {
    tools.exit.success("action successful");
  })
  .catch(err => {
    tools.log.fatal(err);
    tools.exit.failure("action failed");
  });
