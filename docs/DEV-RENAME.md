# Development Repository Rename Runbook

Target repository name: `collecttcg/Collect_TCG_Dev`

This branch (`dev-rename-ready`) is prepared for the repository rename. Do not merge it into the old `Collect_TCG_Beta` main branch before the GitHub repository itself is renamed, because its canonical/SEO URLs intentionally target `Collect_TCG_Dev`.

## One-time GitHub admin action

Rename:

`collecttcg/Collect_TCG_Beta`

to:

`collecttcg/Collect_TCG_Dev`

GitHub repository redirects are not relied on for the GitHub Pages project-site path.

## After the rename

1. Confirm both `main` and `dev-rename-ready` branches exist under `collecttcg/Collect_TCG_Dev`.
2. Fast-forward `main` to `dev-rename-ready`.
3. Confirm the renamed workflow file is `.github/workflows/dev-seo.yml`.
4. Let the Development SEO workflow regenerate `beta/cards/**`, `beta/sitemap.xml`, `beta/robots.txt`, and `beta/seo-slugs.json` using the new `Collect_TCG_Dev` Pages path.
5. Wait for the final package-validation commit and GitHub Pages deployment.
6. Verify active source/config files contain no `Collect_TCG_Beta` repository URL.
7. Historical release manifests/changelog entries may still use Beta naming and must not be rewritten.

## Intended Development URLs

- Site: `https://collecttcg.github.io/Collect_TCG_Dev/beta/`
- Insights: `https://collecttcg.github.io/Collect_TCG_Dev/insights/`

## Intentionally retained

- Internal directory `beta/`
- Historical Beta package names
- Historical Beta release manifests
- Historical changelog terminology
- Legacy internal storage/cache keys unless explicitly migrated

Production `2026-09-27-v05` already localized the Zatch Bell logo and no longer depends on the old Development/Beta repository URL.
