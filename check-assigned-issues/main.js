const cp = require("child_process");
cp.execSync(`cd ${__dirname}; npm ci`);

const core = require("@actions/core");
const github = require("@actions/github");
const fetch = require("node-fetch");
const cheerio = require("cheerio");

const get = name => core.getInput(name, { required: true });

const token = get("token");
const bot = get("bot_name");
const comment = get("comment");

const MILLIS_PER_DAY = 1000 * 60 * 60 * 24;
const WAIT_BEFORE_WARNING = get("days_before_warning") * MILLIS_PER_DAY;
const WAIT_BEFORE_UNASSIGNING = get("days_before_unassigning") * MILLIS_PER_DAY;

const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");

const octokit = new github.GitHub(token);

getAssignedIssues({ owner, repo }).then(
  parallel(async ({ number, assignee, hasPRs }) => {
    if (hasPRs) return;

    try {
      await octokit.repos.checkCollaborator({
        owner,
        repo,
        username: assignee,
      });

      console.log(
        `Issue #${number} - Skipping because @${assignee} is a collaborator.`,
      );
      return;
    } catch {}

    const comments = await octokit.issues.listComments({
      owner,
      repo,
      issue_number: number,
    });

    const lastCommentOfAssignee = getLastDate(
      comments.data,
      cmnt => cmnt.user.login === assignee,
    );
    const lastCommentOfBot = getLastDate(
      comments.data,
      cmnt => cmnt.user.login === bot,
    );

    const time = Date.now() - lastCommentOfAssignee;

    if (time > WAIT_BEFORE_UNASSIGNING + WAIT_BEFORE_WARNING) {
      console.log(`Issue #${number} - Unassigning.`);
      await octokit.issues.removeAssignees({
        owner,
        repo,
        issue_number: number,
        assignees: [assignee],
      });
    } else if (time > WAIT_BEFORE_WARNING) {
      if (lastCommentOfBot > lastCommentOfAssignee) {
        console.log(`Issue #${number} - Already warned.`);
      } else {
        console.log(`Issue #${number} - Warning.`);
        await octokit.issues.createComment({
          owner,
          repo,
          issue_number: number,
          body: comment.replace(/\$\{username}/g, assignee),
        });
      }
    } else {
      console.log(`Issue #${number} - Skipping.`);
    }
  }),
);

// The GitHub api doesn't seem to support this
async function getAssignedIssues({ owner, repo }) {
  const url = `https://github.com/${owner}/${repo}/issues/assigned/*?page=`;

  const issues = [];

  let i = 1;
  do {
    const response = await fetch(url + i);
    const $ = cheerio.load(await response.text());

    $("[id^=issue_]").each(function () {
      const result = $(this)
        .attr("id")
        .match(/^issue_(\d+)$/);

      if (!result) return;
      const number = Number(result[1]);

      const assignee = $(".AvatarStack-body", this)
        .attr("aria-label")
        .replace("Assigned to ", "");

      const hasPRs = $(".octicon-git-pull-request", this).length !== 0;

      issues.push({ number, assignee, hasPRs });
    });

    const $page = $(".paginate-container .current");
    var totalPages = Number($page.attr("data-total-pages"));

    i++;
  } while (i <= totalPages);

  return issues;
}

function parallel(fn) {
  return arr => Promise.all(arr.map(fn));
}

function getLastDate(arr, predicate) {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i], i, arr)) return new Date(arr[i].created_at);
  }
  return -Infinity;
}
