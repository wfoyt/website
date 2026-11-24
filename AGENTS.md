# Foyt project guidelines

## Style and content

Use **wfoyt** as the personal display name in visible copy and metadata.

Maintain a professional terminal-inspired portfolio. Use the name **Foyt**, without a slash. Keep the brand icon and wordmark free of underscore cursor marks. Keep copy factual, concise, and specific to the software. Avoid slogans, jokes, hype, conversational introductions, or invented capabilities. Do not restore the scrolling text ticker, section links in the header, or an Omarchy attribution in the footer.

Retain the monospace typography, dark terminal palettes, restrained accent colors, thin borders, ASCII branding, and responsive grid. Use the theme variables in `dist/style.css`; do not hard-code new colors. Any new animation must respect reduced-motion settings and the site's motion toggle.

## Adding a project

1. Verify with current GitHub metadata that `wfoyt` owns the repository and that it is public. Never advertise private repositories or include their names, descriptions, links, or credentials in source or assets.
2. Read the README on the repository's default branch to verify features, requirements, and installation. Check the language and release availability on GitHub. Do not assume every project has a downloadable release or a license.
3. In `dist/index.html`, copy the existing `article.project-card` structure inside `#project-grid`. Set `data-category` to the appropriate filter category, choose an existing accent variable, and preserve the visual, content, metadata, tags, and actions sections.
4. Add a small original ASCII illustration relevant to the project in `.project-visual`. Mark decorative art `aria-hidden="true"`; ensure it fits on narrow screens. Use a neutral numbered category caption rather than a slogan.
5. Provide the project name, a short factual description, verified language, and a few relevant tags. Include a Read README link to `/projects/<slug>/` and a direct GitHub source link. Give both links specific accessible labels. External links require `target="_blank"` and `rel="noopener noreferrer"`.
6. Add a `Project` to `PROJECTS` in `scripts/update-readmes.py`. Use the same unique lowercase, hyphen-separated `slug` as the card URL, the exact GitHub `repo` name, a matching `title` and `summary`, and the card's `accent` name (such as `green`). Set `install` to the README's actual installation heading fragment without the leading `#`. Follow the sync steps below to generate `dist/projects/<slug>/index.html`.
7. Update the hero repository total, filter totals, and initial result count. Update the index date after verifying the collection. Add a new filter only when the category needs one.
8. Keep card order and illustration numbering consistent. Preserve the two-column desktop grid and one-column mobile layout.

## Syncing project READMEs from GitHub

1. Update the README in its GitHub repository and make sure the change is on that repository's default branch. Update the project's `install` value if the installation heading changed.
2. From the website repository root, run `python3 scripts/update-readmes.py` with network access to GitHub. The script verifies public ownership, renders each registered repository's README at the current default-branch commit, and refreshes all pages under `dist/projects/`. It checks for a latest release and uses the installation link when there is no release.
3. Review the generated diff and preview the affected pages. Check the contents links, installation section, images, and GitHub links. Make content corrections in the source README on GitHub and run the script again.
4. Commit the generated HTML with any related card or project entry changes. Follow the publication steps below to update the live site. GitHub README edits appear on the site after you regenerate and publish the static pages.

## Verification and publication

This is a buildless static site served from `dist/`. Run `node --check dist/app.js`. Preview desktop and mobile layouts, filters, README pages and their section links, source/download links, and theme and motion controls. Confirm no horizontal overflow. Check the command menu with Arrow Up/Down, Home/End, Enter, Tab, and Escape. Keep keyboard focus visible.

Keep `.openai/hosting.json` and its existing project ID as historical Sites metadata, outside `dist/`. Production hosting is Cloudflare Pages at `foyt.net`, connected to `wfoyt/website`. Publish by pushing to `main`; serve `dist/` with no build command. Use the Cloudflare Pages workflow for production deployments.
