const core = require("@actions/core");

const create = async (octokit, context, branchName) => {
  const title = core.getInput("pr_title");
  const body = core.getInput("pr_body");
  const base = core.getInput("base_branch");

  try {
    const response = await octokit.rest.pulls.create({
      base,
      body,
      head: branchName,
      title,
      ...context.repo,
    });
    return response?.data?.number;
  } catch (error) {
    core.setFailed(error.message);
  }
};

const merge = async (octokit, context, prNumber) => {
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

module.exports = {
  create,
  merge,
};
