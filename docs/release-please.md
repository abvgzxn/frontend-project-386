# Release Please

The separate `.github/workflows/release-please.yml` workflow runs after pushes to
`main`. It reads the manifest configuration and uses the repository's built-in
`GITHUB_TOKEN` to maintain a release pull request from Conventional Commits.

The workflow deliberately sets `skip-github-release: true`: this ticket prepares
release pull requests but does not publish a GitHub Release. Publishing can be
added as a separate, explicitly reviewed step later.

Release Please needs `contents`, `issues`, and `pull-requests` write permission
to update the manifest, changelog, and release pull request. It does not need a
personal access token or a product login. Product slices are independent of the
workflow and do not depend on a release pull request being merged.

The root package starts at `0.1.0`, as recorded in both
`release-please-config.json` and `.release-please-manifest.json`. The validation
script checks that these files remain compatible; `jactionlint` validates the
workflow during the normal lint/check gate.

To validate configuration without creating a release, run:

```sh
npm run validate:release-please
jactionlint --ignore duplicate-triggers .github/workflows/*.yml
```
