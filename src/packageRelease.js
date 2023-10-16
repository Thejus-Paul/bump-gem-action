const setupProject = require('./setupProject');
const bumpFrontendVersion = require('./bumpFrontendVersion')
const { getPackageVersion } = require('./utils')
const core = require('@actions/core');

const packageRelease = async (labels) => {
  await setupProject();
  await bumpFrontendVersion(labels);
  const result = await getPackageVersion();
  core.info(`Package version after bump: ${result}`);
  core.setOutput('version', result);
}

module.exports = packageRelease;

