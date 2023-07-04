const core = require('@actions/core');
const fs = require('fs');
const path = require('path');

const findPackageJson = async () => {
  const packagePath = core.getInput('path');
  core.debug(`Load package.json at ${path}`);
  const result = await fs.readFileSync(path.join(packagePath, 'package.json')).toString();

  return result;
};

export const getPackageVersion = async () => {
  const packageJson = await findPackageJson(path);

  return JSON.parse(packageJson).version;
}
