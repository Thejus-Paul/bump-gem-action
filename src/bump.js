const core = require("@actions/core");
const exec = require("@actions/exec");

const containsBumpTypeLabel = (labels) => {
  const bumpTypes = ["major", "minor", "patch"];
  const labelsArray = labels.split(",");

  if (labelsArray.length === 0 || labelsArray[0] === "") {
    return false;
  }

  return bumpTypes.some((bumpType) => labelsArray.includes(bumpType));
};

const bumpGem = async () => {
  const labels = core.getInput("labels");

  if (!labels || !containsBumpTypeLabel(labels)) {
    core.error(
      "No bump type label (major, minor, or patch) was found in the PR."
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
    await exec.exec(`bump_gem_version labels ${labels}`);

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
