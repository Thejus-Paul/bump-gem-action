const core = require("@actions/core");
const exec = require("@actions/exec");

const getLabels = (labels, defaultBumpLabel) => {
  const bumpTypes = ["major", "minor", "patch"];
  const labelsArray = labels.split(",");
  const isDefaultBumpLabelPresent = bumpTypes.some(
    (bumpType) => bumpType === defaultBumpLabel
  );
  const isBumpTypePresent = bumpTypes.some((bumpType) =>
    labelsArray.includes(bumpType)
  );

  if (isBumpTypePresent) {
    return labels;
  } else {
    return isDefaultBumpLabelPresent ? defaultBumpLabel : false;
  }
};

const bumpGem = async () => {
  const labels = core.getInput("labels");
  const defaultBumpLabel = core.getInput("default_bump_label");

  const prLabels = getLabels(labels, defaultBumpLabel);

  if (!Boolean(prLabels)) {
    core.setFailed(
      "No bump type label (major, minor, or patch) or default bump label was found in the PR."
    );
  }

  try {
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
    await exec.exec(`bump_gem_version labels ${prLabels}`);

    core.info("Successfully bumped gem version! 🎉");

    if (core.isDebug()) {
      core.debug("After bump, the gem version is:");
      await exec.exec("bump_gem_version current");
    }
  } catch (error) {
    core.setFailed(error.message);
  }
};

module.exports = bumpGem;
