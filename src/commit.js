const core = require("@actions/core");
const exec = require("@actions/exec");

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

const create = async (octokit, context, branchName) => {
  const commitMessage = core.getInput("commit_message");

  try {
    const branch = await octokit.rest.repos.getBranch({
      ...context.repo,
      branch: branchName,
    });
    core.info(`Get branch response: ${JSON.stringify(branch)}`);
    
    const branchSha = branch.data.commit.sha;

    const commits = await octokit.rest.repos.listCommits({
      ...context.repo,
      sha: branchSha,
    });
    core.info(`Get commits response: ${JSON.stringify(commits)}`);

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
      message: commitMessage,
      parents: [commitSHA],
    });

    const {
      data: { sha: newCommitSHA },
    } = await octokit.rest.git.createCommit({
      ...context.repo,
      tree: currentTreeSHA,
      message: commitMessage,
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

module.exports = {
  create,
};
