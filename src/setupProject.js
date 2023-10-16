const core = require('@actions/core');
const exec = require('@actions/exec');

const setupProject= async () => {
  try {
    await exec.exec('yarn install');
    await exec.exec('yarn build');
    await exec.exec('yarn', ['config', 'set', 'version-tag-prefix', 'v']);
  } catch (error) {
    core.setFailed(error.message);
  }
}

module.exports = setupProject;