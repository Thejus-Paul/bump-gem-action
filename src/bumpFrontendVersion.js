const core = require("@actions/core");
const exec = require("@actions/exec");

const  bumpFrontendVersion = async (labels) => {
  const version = getVersionFromLabels(labels);

  core.info(`Bumping frontend version to ${version}`);
  await exec.exec(`yarn version --${version} --no-git-tag-version`);
}

const  getVersionFromLabels = (labels) => {
  if (labels.includes('major')) {
    return 'major';
  } else if (labels.includes('minor')) {
    return 'minor';
  } else if (labels.includes('patch')) {
    return 'patch';
  } else {
    return 'patch';
  }
}

module.exports = bumpFrontendVersion;
