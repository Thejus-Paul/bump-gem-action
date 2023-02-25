const core = require("@actions/core");
const exec = require("@actions/exec");
const github = require("@actions/github");

const BUMP_TYPES = ["major", "minor", "patch"];

const containsBumpTypeLabel = (labels) => {
  const labelsArray = labels.split(",");

  if (labelsArray.length === 0 || labelsArray[0] === "") {
    return false;
  }

  return BUMP_TYPES.some((bump_type) => labelsArray.includes(bump_type));
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

const run = async () => {
  try {
    const labels = core.getInput("labels");

    if (!labels || !containsBumpTypeLabel(labels)) {
      throw new Error(
        "No bump type label (major, minor, or patch) was found in the PR."
      );
    }

    console.log("\nInstalling the gem...");
    await exec.exec("gem install -q --silent bump_gem_version");

    console.log("\nBefore bump, the gem version was:");
    await exec.exec("bump_gem_version current");

    console.log("\nBumping gem version...");
    await exec.exec(`bump_gem_version labels ${labels}`);

    console.log("\nSuccessfully bumped gem version! 🎉");

    console.log("\nAfter bump, the gem version is:");
    await exec.exec("bump_gem_version current");

    console.log("\nCommitting and pushing the new version...");
    const token = core.getInput("token");
    const branch = core.getInput("branch");
    const context = github.context;
    const octokit = github.getOctokit(token);

    core.debug(`Creating branch ${branch}`);
    const isCreated = await createBranch(octokit, context, branch);

    core.setOutput("created", Boolean(isCreated));
  } catch (error) {
    core.setFailed(error.message);
  }
};

run();
