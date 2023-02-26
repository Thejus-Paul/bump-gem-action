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

const run = async () => {
  try {
    const labels = core.getInput("labels");

    if (!labels || !containsBumpTypeLabel(labels)) {
      throw new Error(
        "No bump type label (major, minor, or patch) was found in the PR."
      );
    }

    core.debug("\nInstalling the gem...");
    await exec.exec("gem install -q --silent bump_gem_version");

    core.debug("\nBefore bump, the gem version was:");
    await exec.exec("bump_gem_version current");

    core.debug("\nBumping gem version...");
    await exec.exec(`bump_gem_version labels ${labels}`);

    core.debug("\nSuccessfully bumped gem version! 🎉");

    core.debug("\nAfter bump, the gem version is:");
    await exec.exec("bump_gem_version current");

    core.debug("\nCommitting and pushing the new version...");
    const token = core.getInput("token");
    const octokit = github.getOctokit(token);
    const branch = core.getInput("branch");
    const context = github.context;

    core.debug(`Creating branch ${branch}`);
    const isCreated = await createBranch(octokit, context, branch);

    console.log("created", isCreated);
  } catch (error) {
    core.setFailed(error.message);
  }
};

run();
