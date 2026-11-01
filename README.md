# Foyt Labs

A buildless project directory for the public repositories of [wfoyt](https://github.com/wfoyt). Original ASCII branding, an animated orbital sculpture, three terminal color themes, project filters, detail dialogs, and keyboard navigation.

Serve `dist/` with any static web server. No build or package installation is required.

## Content

The four listed repositories were explicitly verified public using GitHub metadata on October 31, 2026. Content is a curated snapshot, not an authenticated GitHub integration. To add projects, verify public visibility first and update the directory and its counts. Never embed credentials or private repository metadata.

Keyboard: Cmd/Ctrl+K opens the command menu; P jumps to projects; A opens the lab section; T cycles themes; M toggles motion; Arrow Up/Down selects command-menu options; Home/End jumps to the first/last option; Enter activates the selected option; Escape closes dialogs. Respects reduced-motion preferences.

Original logo assets live at `dist/logo.svg` and `dist/foyt-labs-ascii.txt`. See `AGENTS.md` for design and repository-card guidelines.

## Deployment

Production is hosted on Cloudflare Pages at https://foyt.net, from the `main` branch of `wfoyt/website`. Serve `dist/` with no build command and no framework preset. Pushes to `main` trigger production deployments; other branches receive preview deployments through the Cloudflare GitHub integration.

The `.openai/hosting.json` file preserves the original Sites project metadata for reference. Cloudflare Pages is the production deployment target.
