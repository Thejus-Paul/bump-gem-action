const core = require("@actions/core");
const exec = require("@actions/exec");
const github = require("@actions/github");

const containsBumpTypeLabel = (labels) => {
  const bumpTypes = ["major", "minor", "patch"];
  const labelsArray = labels.split(",");

  if (labelsArray.length === 0 || labelsArray[0] === "") {
    return false;
  }

  return bumpTypes.some((bump_type) => labelsArray.includes(bump_type));
};

const createBranch = async (octokit, context, branch) => {
  // Sometimes branch might come in with refs/heads already
  branch = branch.replace("refs/heads/", "");
  const reference = `refs/heads/${branch}`;

  // throws HttpError if branch already exists.
  try {
    await octokit.rest.repos.getBranch({
      ...context.repo,
      branch,
    });
  } catch (error) {
    if (error.name === "HttpError" && error.status === 404) {
      const response = await octokit.rest.git.createRef({
        ref: reference,
        sha: context.sha,
        ...context.repo,
      });

      return response?.data?.ref === reference;
    } else {
      throw Error(error);
    }
  }
};

const deleteBranch = async (octokit, context, branch) => {
  branch = branch.replace("ref/heads/", "");
  const reference = `refs/heads/${branch}`;

  try {
    return await octokit.rest.git.deleteRef({
      ref: reference,
      ...context.repo,
    });
  } catch (error) {
    core.setFailed(error.message);
  }
};

const run = async () => {
  try {
    const labels = core.getInput("labels");

    if (!labels || !containsBumpTypeLabel(labels)) {
      core.error(
        "No bump type label (major, minor, or patch) was found in the PR."
      );
    }

    if (core.isDebug()) {
      core.debug("Installing the gem...");
      await exec.exec("gem install bump_gem_version");
    } else {
      await exec.exec("gem install -q --silent bump_gem_version");
    }

    if (core.isDebug()) {
      core.debug("Before bump, the gem version was:");
      await exec.exec("bump_gem_version current");
    }

    core.debug("Bumping gem version...");
    await exec.exec(`bump_gem_version labels ${labels}`);

    core.info("Successfully bumped gem version! 🎉");

    if (core.isDebug()) {
      core.debug("After bump, the gem version is:");
      await exec.exec("bump_gem_version current");
    }

    core.info("Committing and pushing the new version...");
    const token = core.getInput("token");
    const octokit = github.getOctokit(token);
    const branch = core.getInput("branch");
    const context = github.context;

    core.debug(`Creating branch ${branch}`);
    let isCreated = await createBranch(octokit, context, branch);

    console.log("Branch created:", Boolean(isCreated));
    if (!Boolean(isCreated)) {
      console.log("Deleting the existing branch...");
      const isDeleted = await deleteBranch(octokit, context, branch);
      console.log("Branch deleted:", Boolean(isDeleted));
      console.log(`Creating a new branch ${branch}`);
      isCreated = await createBranch(octokit, context, branch);
      console.log("Branch created:", Boolean(isCreated));
    }
  } catch (error) {
    core.setFailed(error.message);
  }
};

run();
