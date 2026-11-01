# Foyt Labs project guidelines

## Style and content

Use **wfo** as the personal display name in visible copy and metadata.

Maintain a professional terminal-inspired portfolio. Use the name **Foyt Labs**, without a slash. Keep the brand icon and wordmark free of underscore cursor marks. Keep copy factual, concise, and specific to the software. Avoid slogans, jokes, hype, conversational introductions, or invented capabilities. Do not restore the scrolling text ticker, Projects/The lab header links, or an Omarchy attribution in the footer.

Retain the monospace typography, dark terminal palettes, restrained accent colors, thin borders, ASCII branding, and responsive grid. Use the theme variables in `dist/style.css`; do not hard-code new colors. Any new animation must respect reduced-motion settings and the site's motion toggle.

## Adding a repository card

1. Verify with current GitHub metadata that the repository is public and belongs to the intended owner. Never advertise private repositories or include their names, descriptions, links, or credentials in source or assets.
2. Read the public README to verify features, requirements, language, installation, and release availability. Do not assume every project has a downloadable release or a license.
3. In `dist/index.html`, copy the existing `article.project-card` structure inside `#project-grid`. Set `data-category` to the appropriate filter category, choose an existing accent variable, and preserve the visual, content, metadata, tags, and actions sections.
4. Add a small original ASCII illustration relevant to the project in `.project-visual`. Mark decorative art `aria-hidden="true"`; ensure it fits on narrow screens. Use a neutral numbered category caption rather than a slogan.
5. Provide the project name, a short factual description, verified language, and a few relevant tags. Include an Explore project button with a unique `data-project` key and a direct GitHub source link with a specific accessible label. External links require `target="_blank"` and `rel="noopener noreferrer"`.
6. Add the matching entry to the `projects` object in `dist/app.js`: `title`, exact `repo` name, `tag`, factual `description`, verified `features`, and `requires`. Set `release` only if a latest release exists. Check installation anchors against the actual README; extend URL handling if a project uses a different installation section.
7. Update every affected count: hero repository total, filter totals, result count, and the JavaScript filter denominator. Update the index date after verifying the collection. Add a new filter only when the category needs one.
8. Keep card order and illustration numbering consistent. Preserve the two-column desktop grid and one-column mobile layout.

## Verification and publication

This is a buildless static site served from `dist/`. Run `node --check dist/app.js`. Preview desktop and mobile layouts, filters, detail dialogs, source/download links, theme and motion controls. Confirm no horizontal overflow. Check the command menu with Arrow Up/Down, Home/End, Enter, Tab, and Escape; keep keyboard focus visible.

Keep `.openai/hosting.json` and its existing project ID as historical Sites metadata, outside `dist/`. Production hosting is Cloudflare Pages at `foyt.net`, connected to `wfoyt/website`. Publish by pushing to `main`; serve `dist/` with no build command. Use the Cloudflare Pages workflow for production deployments.
