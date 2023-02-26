const core = require("@actions/core");
const exec = require("@actions/exec");
const github = require("@actions/github");

const containsBumpTypeLabel = (labels) => {
  const bumpTypes = ["major", "minor", "patch"];
  const labelsArray = labels.split(",");

  if (labelsArray.length === 0 || labelsArray[0] === "") {
    return false;
  }

  return bumpTypes.some((bumpType) => labelsArray.includes(bumpType));
};

const createBranch = async (octokit, context, branch) => {
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
  const reference = `heads/${branch}`;

  try {
    const response = await octokit.rest.git.deleteRef({
      ref: reference,
      ...context.repo,
    });
    return response;
  } catch (error) {
    core.setFailed(error.message);
  }
};

const getChangedFiles = async (changedFiles) => {
  const commitableFiles = [];
  for (const path of changedFiles) {
    let content = "";
    const options = {
      listeners: {
        stdout: (data) => {
          content += data.toString();
        },
      },
    };

    await exec.exec("cat", [path], options);

    commitableFiles.push({
      content,
      path,
      mode: "100644",
      type: "commit",
    });
  }
  return commitableFiles;
};

const createCommit = async (octokit, context, branchName) => {
  try {
    const branch = await octokit.rest.repos.getBranch({
      ...context.repo,
      branch: branchName,
    });

    const branchSha = branch.data.commit.sha;

    const commits = await octokit.rest.repos.listCommits({
      ...context.repo,
      sha: branchSha,
    });

    const commitSHA = commits.data[0].sha;

    let changedFiles = [];
    const gitOptions = {};
    gitOptions.listeners = {
      stdout: (data) => {
        const changedFilesString = data.toString();
        changedFiles = changedFilesString
          .split("\n")
          .map((file) => file.split(" ")[2])
          .filter(Boolean);
      },
    };
    await exec.exec("git", ["status", "-s"], gitOptions);

    const commitableFiles = await getChangedFiles(changedFiles);

    const {
      data: { sha: currentTreeSHA },
    } = await octokit.rest.git.createTree({
      ...context.repo,
      tree: commitableFiles,
      base_tree: commitSHA,
      message: "Bumped gem version",
      parents: [commitSHA],
    });

    const {
      data: { sha: newCommitSHA },
    } = await octokit.rest.git.createCommit({
      ...context.repo,
      tree: currentTreeSHA,
      message: "Bumped gem version",
      parents: [commitSHA],
    });

    await octokit.rest.git.updateRef({
      ...context.repo,
      sha: newCommitSHA,
      ref: `heads/${branchName}`,
    });

    core.debug(`Commit created on the ${branchName} branch!`);
  } catch (error) {
    core.setFailed(error.message);
  }
};

const createPR = async (octokit, context, branchName) => {
  try {
    const response = await octokit.rest.pulls.create({
      head: branchName,
      base: "main",
      title: "Bump gem version",
      body: "Bump gem version",
      ...context.repo,
    });
    return response?.data?.number;
  } catch (error) {
    core.setFailed(error.message);
  }
};

const mergePR = async (octokit, context, prNumber) => {
  try {
    const response = await octokit.rest.pulls.merge({
      ...context.repo,
      pull_number: prNumber,
      merge_method: "squash",
    });
    return response;
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
    const branchName = core.getInput("branch");
    const context = github.context;

    core.debug(`Creating branch ${branchName}`);
    let isBranchCreated = await createBranch(octokit, context, branchName);

    core.debug("Branch created:", Boolean(isBranchCreated));
    if (!Boolean(isBranchCreated)) {
      core.debug("Deleting the existing branch...");
      const isBranchDeleted = await deleteBranch(octokit, context, branchName);
      core.debug("Branch deleted:", Boolean(isBranchDeleted));

      core.debug(`Creating a new branch ${branchName}`);
      isBranchCreated = await createBranch(octokit, context, branchName);
      core.debug("Branch created:", Boolean(isBranchCreated));
    }

    core.debug("Creating a commit...");
    await createCommit(octokit, context, branchName);

    core.debug("Creating a PR...");
    const prNumber = await createPR(octokit, context, branchName);

    core.debug("PR created:", Boolean(prNumber));
    await mergePR(octokit, context, prNumber);
  } catch (error) {
    core.setFailed(error.message);
  }
};

run();
