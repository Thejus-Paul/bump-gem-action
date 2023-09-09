const core = require("@actions/core");

const create = async (octokit, context, branchName) => {
  const title = core.getInput("pr_title");
  const body = core.getInput("pr_body");
  const base = core.getInput("base_branch");
  const bumpVersionPrLabels = core.getInput("bump_version_pr_labels");
  const labelsArray = bumpVersionPrLabels ? bumpVersionPrLabels.split(",") : [];

  try {
    const response = await octokit.rest.pulls.create({
      base,
      body,
      head: branchName,
      title,
      ...context.repo,
    });
    core.debug(`Created pull request: ${JSON.stringify(response)}`);

    await octokit.rest.issues.addLabels({
      ...context.repo,
      issue_number: response.data.number,
      labels: ["skip-version-bump", ...labelsArray],
    });
    core.debug("Added requirement labels to the PR");

    return response.data.number;
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
