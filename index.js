const core = require("@actions/core");
const exec = require("@actions/exec");

const BUMP_TYPES = ["major", "minor", "patch"];

const containsBumpTypeLabel = (labels) => {
  const labelsArray = labels.split(",");

  if (labelsArray.length === 0 || labelsArray[0] === "") {
    return false;
  }

  return BUMP_TYPES.some((bump_type) => labelsArray.includes(bump_type));
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
  } catch (error) {
    core.setFailed(error.message);
  }
};

run();
