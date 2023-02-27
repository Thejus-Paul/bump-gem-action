# bump-gem-action

[![DeepScan grade](https://deepscan.io/api/teams/20541/projects/23984/branches/733494/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=20541&pid=23984&bid=733494)

The GitHub action to bump the gem or engine version from the pull request labels.

## Inputs

### `labels`

**Required** The labels of the pull request separated by comma.

### `token`

**Required** The GitHub token to authenticate with GitHub API.

## `branch`

**Optional** The branch to push the changes to. Default `"bump-gem-version"`.

## `commit_message`

**Optional** The commit message to use. Default `"Bumped gem version"`.

## `pr_title`

**Optional** The pull request title to use. Default `"Updated gem version"`.

## `pr_body`

**Optional** The pull request body to use. Default `"New version release"`.

## Example usage

```yaml
  - name: Bump gem version
    uses: Thejus-Paul/bump-gem-action@main
    with:
      labels: ${{ join(github.event.pull_request.labels.*.name, ',') }}
      token: ${{ secrets.GITHUB_TOKEN }}
```

## Local development

1. Install the dependencies

    ```bash
    npm install
    ```

2. Make the necessary changes to `action.yml` and/or `index.js`.

3. Compile the `index.js` with the dependencies into a single file.

    ```bash
    npm run build
    ```

4. Commit the changes and push to the branch.

    ```bash
    git add .
    git commit -m "Commit message"
    git tag -a v1.0.0 -m "v1.0.0"
    git push --follow-tags
    ```
