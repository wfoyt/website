# Foyt

A buildless directory for [wfoyt](https://github.com/wfoyt)’s public desktop apps, terminal tools, and Omarchy plugins. The site includes an ASCII wordmark, an animated orbital illustration, three terminal color themes, project filters, and dedicated README pages with links to GitHub.

Serve `dist/` with any static web server. No build or package installation is required.

## Content

The five listed repositories were verified public using GitHub metadata on November 26, 2026. The directory is a curated snapshot. To add projects, verify public visibility first and update the directory and its counts. Never embed credentials or private repository metadata.

Project pages load the latest public README from GitHub when opened. Each page includes a bundled snapshot for visitors who cannot reach the GitHub API or use JavaScript. Run `python3 scripts/update-readmes.py` from the repository root to refresh those snapshots, then review the changes under `dist/projects/`.

Cmd/Ctrl+K opens the command menu. P jumps to Projects, A jumps to About, T cycles themes, and M toggles motion. In the command menu, Arrow Up/Down moves between options, Home/End jumps to the first or last option, and Enter activates the selected option. Escape closes the menu. The site respects the system’s reduced-motion preference.

The logo assets are `dist/logo.svg` and `dist/foyt-ascii.txt`. See `AGENTS.md` for design and repository-card guidelines.

## Deployment

Production is hosted on Cloudflare Pages at https://foyt.net, from the `main` branch of `wfoyt/website`. Serve `dist/` with no build command and no framework preset. Pushes to `main` trigger production deployments. Other branches receive preview deployments through the Cloudflare GitHub integration.

The `.openai/hosting.json` file preserves the original Sites project metadata for reference. Cloudflare Pages is the production deployment target.
