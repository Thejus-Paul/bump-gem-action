# bump-gem-action

[![DeepScan grade](https://deepscan.io/api/teams/20541/projects/23984/branches/733494/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=20541&pid=23984&bid=733494)

The GitHub action to bump the gem or engine version from the pull request labels.

## Inputs

### `labels`

**Required** The labels of the pull request separated by comma.

### `token`

**Required** The GitHub token to authenticate with GitHub API.

### `new_branch`

**Optional** The branch to push the changes to. Default `"bump-gem-version"`.

### `base_branch`

**Optional** The base branch to create the pull request from. Default `"main"`.

### `commit_message`

**Optional** The commit message to use. Default `"Updated gem version"`.

### `pr_title`

**Optional** The pull request title to use. Default `"Updated gem version"`.

### `pr_body`

**Optional** The pull request body to use. Default `"New version release"`.

### `default_bump_label`

**Optional** Provide a default bump label for cases when labels does not include a bump type label.

```yaml
- name: Bump gem version
  uses: Thejus-Paul/bump-gem-action@main
  with:
    labels: ${{ join(github.event.pull_request.labels.*.name, ',') }}
    token: ${{ secrets.GITHUB_TOKEN }}
    default_bump_label: patch
```

### `bump_version_pr_labels`

**Optional** Provide a comma separated list of labels passed to the bump version PR.

```yaml
- name: Bump gem version
  uses: Thejus-Paul/bump-gem-action@main
  with:
    labels: ${{ join(github.event.pull_request.labels.*.name, ',') }}
    token: ${{ secrets.GITHUB_TOKEN }}
    default_bump_label: patch
    bump_version_pr_labels: mergepr
```

## Example usage

```yaml
- name: Bump gem version
  uses: Thejus-Paul/bump-gem-action@main
  with:
    labels: ${{ join(github.event.pull_request.labels.*.name, ',') }}
    token: ${{ secrets.GITHUB_TOKEN }}
```

## Local development

1. Install the dependencies.

    ```bash
    pnpm install
    ```

2. Make the necessary changes to `action.yml` and/or `index.js`.

3. Compile the `index.js` with the dependencies into a single file.

    ```bash
    pnpm run build
    ```

4. Commit the changes and push to the branch.

    ```bash
    git add .
    git commit -m "Commit message"
    git tag -s -a v1.0.0 -m "v1.0.0"
    git push --follow-tags
    ```
