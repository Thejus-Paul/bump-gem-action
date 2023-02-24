# bump-gem-action

The GitHub action to bump the gem or engine version from the pull request labels.

## Inputs

### `labels`

**Required** The labels of the pull request separated by comma.

## Example usage

```yaml
  - name: Bump gem version
    uses: Thejus-Paul/bump-gem-action@main
    with:
      labels: ${{ join(github.event.pull_request.labels.*.name, ',') }}
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
