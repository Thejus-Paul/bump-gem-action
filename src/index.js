const core = require("@actions/core");
const exec = require("@actions/exec");
const github = require("@actions/github");

const bumpGem = require("./bump");
const packageRelease = require("./packageRelease")
const branch = require("./branch");
const commit = require("./commit");
const pr = require("./pr");

const run = async () => {
  try {
    const labels = core.getInput("labels").split(",");
    if(labels.includes("backend")) {
      await bumpGem();
    }

    if(labels.includes("frontend")) {
      core.info("Bumping frontend version...");
      await packageRelease(labels);     
    }

    core.info("Committing and pushing the new version...");
    const token = core.getInput("token");
    const octokit = github.getOctokit(token);
    const branchName = core.getInput("new_branch");
    const context = github.context;

    core.info("Creating or Replacing branch...");
    await branch.createOrReplace(octokit, context, branchName);

    core.info("Creating a commit...");
    await commit.create(octokit, context, branchName);

    core.info("Creating a PR...");
    const prNumber = await pr.create(octokit, context, branchName);

    core.debug("PR created:", Boolean(prNumber));
  } catch (error) {
    core.setFailed(error.message);
  }
};

run();
