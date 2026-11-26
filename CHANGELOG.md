# Changelog

## 0.1.3

- Releases are now built and published by GitHub Actions, with build provenance attestations for `main.js`, `manifest.json`, and `styles.css`.

## 0.1.2

- Fixed community directory checks: removed `any`/`SafeAny` from the type surface, typed Blogger API responses, and set `minAppVersion` to 1.4.4 to match the APIs used (`processFrontMatter`, `ButtonComponent.setDisabled`).
- Dropped the `builtin-modules` and `lodash-es` dependencies.
- Added an ESLint setup using `eslint-plugin-obsidianmd`.
- Removed the `all` CSS reset.

## 0.1.1

- Reworded the plugin description (removed the redundant word "Obsidian") to satisfy the community directory checks.
- Replaced the `all` CSS reset with explicit properties (CSS lint).

## 0.1.0

- First release.
- Publish Obsidian notes to Google Blogger.
- Inline table styling so tables render on the blog.
- Embed local vault images as base64 data URIs (no external hosting).
- MathJax rendering (TeX or inline SVG).
- Multiple Blogger profiles and Draft/Live publishing.
- Auto-fit large posts to Blogger's request limit.
- English and Korean UI.
