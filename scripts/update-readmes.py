#!/usr/bin/env python3
"""Refresh the static project pages from the public GitHub READMEs."""

import json
import posixpath
import re
from dataclasses import dataclass, field
from html import escape
from html.parser import HTMLParser
from pathlib import Path
from tempfile import TemporaryDirectory
from urllib.error import HTTPError, URLError
from urllib.parse import quote, unquote, urlencode, urlsplit, urlunsplit
from urllib.request import Request, urlopen


OUTPUT = Path(__file__).resolve().parents[1] / "dist" / "projects"
OWNER = "wfoyt"
GITHUB = "https://github.com"
API = "https://api.github.com"
RAW = "https://raw.githubusercontent.com"
VOID = {"br", "hr", "img", "input", "wbr"}
CONTENT_TAGS = set("""
    a abbr b blockquote br caption code dd del details div dl dt em h1 h2 h3
    h4 h5 h6 hr i img input kbd li mark ol p pre s samp small span strong
    sub summary sup table tbody td tfoot th thead tr ul var wbr
""".split())
SHELL_IDS = {
    "top", "theme-name", "theme-toggle", "command-open", "command-dialog",
    "command-title", "command-theme", "command-motion", "motion-toggle",
    "project-title", "readme-title",
}


@dataclass(frozen=True)
class Project:
    slug: str
    repo: str
    title: str
    summary: str
    accent: str
    install: str


PROJECTS = (
    Project(
        "flatfind", "flatfind", "Flatfind",
        "Find, preview, install, and remove Flatpak apps from a full-screen terminal picker.",
        "green", "quick-start",
    ),
    Project(
        "lumen", "Lumen", "Lumen",
        "A native GNOME app for chatting with Ollama, working with files, and using model tools.",
        "green", "get-started",
    ),
    Project(
        "redragon-control", "Redragon-Control", "Redragon Control",
        "Control K686 MAX keyboard lighting, remap keys and the wheel, and keep your favorite setups in profiles.",
        "orange", "installation",
    ),
    Project(
        "omarchy-audio-control", "Omarchy-Audio-Control", "Omarchy Audio Control",
        "Album art, track details, player selection, and playback controls in the Omarchy bar.",
        "purple", "installation",
    ),
    Project(
        "omarchy-monitor-manager", "omarchy-monitor-manager", "Monitor Layout",
        "Position displays, tune resolution and scale, and preview changes with automatic rollback.",
        "blue", "install",
    ),
)


def github(path, accept="application/vnd.github+json"):
    request = Request(f"{API}{path}", headers={"Accept": accept, "User-Agent": "Foyt-readme-refresh"})
    with urlopen(request, timeout=20) as response:
        return response.read().decode("utf-8")


@dataclass
class Element:
    name: str
    attrs: dict = field(default_factory=dict)
    children: list = field(default_factory=list)

    def descendants(self):
        for child in self.children:
            if isinstance(child, Element):
                yield child
                yield from child.descendants()

    def text(self):
        return "".join(child.text() if isinstance(child, Element) else child for child in self.children)


class RenderedHTML(HTMLParser):
    def __init__(self):
        super().__init__()
        self.root = Element("root")
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        element = Element(tag, dict(attrs))
        self.stack[-1].children.append(element)
        if tag not in VOID:
            self.stack.append(element)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        if len(self.stack) == 1 or self.stack[-1].name != tag:
            raise ValueError(f"GitHub returned an unmatched closing tag: {tag}")
        self.stack.pop()

    def handle_data(self, data):
        self.stack[-1].children.append(data)


class Readme:
    def __init__(self, html, project, revision, path):
        parser = RenderedHTML()
        parser.feed(html)
        parser.close()
        if len(parser.stack) != 1:
            raise ValueError("GitHub returned incomplete HTML")
        articles = [
            element for element in parser.root.descendants()
            if element.name == "article" and "markdown-body" in self.classes(element)
        ]
        if len(articles) != 1:
            raise ValueError("Could not identify the rendered GitHub README")

        repo = f"{OWNER}/{project.repo}"
        self.project = project
        self.readme_path = path
        self.repo_path = posixpath.dirname(path)
        self.blob = f"{GITHUB}/{repo}/blob/{revision}"
        self.raw = f"{RAW}/{repo}/{revision}"
        self.sections = []
        self.ids = set()
        self.fragments = set()
        self.html = self.children(articles[0])
        if not self.sections or project.install not in self.ids:
            raise ValueError(f"Expected README sections and #{project.install}")
        if missing := self.fragments - self.ids:
            raise ValueError(f"README links to missing fragments: {', '.join(sorted(missing))}")

    @staticmethod
    def classes(element):
        return (element.attrs.get("class") or "").split()

    def local_id(self, value):
        value = unquote(value).removeprefix("user-content-")
        if not re.fullmatch(r"[\w.-]+", value):
            raise ValueError(f"Invalid README fragment {value!r}")
        return value

    def register_id(self, value):
        if value in SHELL_IDS or value in self.ids:
            raise ValueError(f"Duplicate README ID {value!r}")
        self.ids.add(value)
        return value

    def children(self, element):
        return "".join(
            self.render(child) if isinstance(child, Element) else escape(child, quote=False)
            for child in element.children
        )

    def heading(self, element):
        nodes = [child for child in element.children if isinstance(child, Element)]
        if len(nodes) != 2:
            raise ValueError("Unexpected GitHub heading structure")
        heading, permalink = nodes
        href = permalink.attrs.get("href", "")
        if not re.fullmatch(r"h[1-6]", heading.name) or permalink.name != "a" or not href.startswith("#"):
            raise ValueError("GitHub heading is missing its permalink")
        slug = self.register_id(self.local_id(href[1:]))
        title = " ".join(heading.text().split())
        if heading.name == "h1":
            if title.casefold() == self.project.title.casefold():
                return f'<span id="{escape(slug)}" aria-hidden="true"></span>'
            return html_tag("h2", {"id": slug, "class": "readme-document-title"}, self.children(heading))
        if heading.name == "h2":
            self.sections.append((slug, title))
        return html_tag(heading.name, {"id": slug}, self.children(heading))

    def url(self, value, image=False):
        if not value or any(ord(char) < 32 or char == "\\" for char in value):
            raise ValueError(f"Invalid README URL {value!r}")
        if value.startswith("#") and not image:
            fragment = self.local_id(value[1:])
            self.fragments.add(fragment)
            return f"#{quote(fragment)}"

        parts = urlsplit(value)
        if parts.scheme or parts.netloc:
            if parts.scheme == "mailto" and not image and not parts.netloc:
                return value
            schemes = ("", "https") if image else ("", "http", "https")
            if parts.scheme not in schemes or not parts.hostname or parts.username or parts.password:
                raise ValueError(f"Unsupported README URL {value!r}")
            return urlunsplit(parts._replace(scheme=parts.scheme or "https"))

        path = unquote(parts.path)
        if not image and posixpath.normpath(posixpath.join(self.repo_path, path)) == self.readme_path and parts.fragment:
            return self.url(f"#{parts.fragment}")
        path = posixpath.normpath(posixpath.join("/", self.repo_path, path))
        base = self.raw if image else self.blob
        return f"{base}{urlunsplit(parts._replace(path=quote(path)))}"

    def render(self, element):
        tag, source = element.name, element.attrs
        classes = self.classes(element)
        if tag == "div" and "markdown-heading" in classes:
            return self.heading(element)
        if tag == "markdown-accessiblity-table":
            return self.children(element)
        if tag not in CONTENT_TAGS:
            raise ValueError(f"Unexpected tag in the rendered README: {tag}")

        attrs = {}
        if source.get("id"):
            attrs["id"] = self.register_id(self.local_id(source["id"]))
        if source.get("title"):
            attrs["title"] = source["title"]
        if source.get("align") == "center" and tag in {"div", "p"}:
            attrs["class"] = "readme-center"
        if tag == "span":
            syntax = [token for token in classes if re.fullmatch(r"pl-[a-z0-9-]+", token)]
            if syntax:
                attrs["class"] = " ".join(syntax)
        if tag == "a" and "href" in source:
            children = [child for child in element.children if isinstance(child, Element) or child.strip()]
            if len(children) == 1 and isinstance(children[0], Element) and "id" not in attrs:
                child = children[0]
                if child.name == "img" and not child.attrs.get("alt") and child.attrs.get("src") == source["href"]:
                    return self.render(child)
            attrs["href"] = self.url(source["href"])
            if not attrs["href"].startswith("#"):
                attrs.update(target="_blank", rel="noopener noreferrer")
        if tag == "img":
            attrs.update(src=self.url(source.get("src"), image=True), alt=source.get("alt") or "",
                         loading="lazy", decoding="async")
            for dimension in ("width", "height"):
                if re.fullmatch(r"[1-9][0-9]{0,4}", source.get(dimension) or ""):
                    attrs[dimension] = source[dimension]
            if source.get("align") == "right":
                attrs["class"] = "readme-image-right"
        if tag == "details" and "open" in source:
            attrs["open"] = ""
        if tag == "ol" and re.fullmatch(r"[0-9]+", source.get("start") or ""):
            attrs["start"] = source["start"]
        if tag == "input":
            if source.get("type") != "checkbox" or "disabled" not in source:
                raise ValueError("Unexpected input in the rendered README")
            attrs.update(type="checkbox", disabled="")
            if "checked" in source:
                attrs["checked"] = ""
        content = self.children(element)
        if tag == "a" and "href" in attrs:
            images = [child for child in element.children if isinstance(child, Element) and child.name == "img"]
            if len(images) == 1 and len(children) == 1 and urlsplit(images[0].attrs.get("src", "")).path.lower().endswith(".gif"):
                label = escape(images[0].attrs.get("alt") or "View animation")
                content = f'<span class="readme-animated-image">{content}</span><span class="readme-animation-label">{label}</span>'
        result = html_tag(tag, attrs, content)
        if tag == "table":
            return f'<div class="readme-table" tabindex="0" role="region" aria-label="README table">{result}</div>'
        return result


def html_tag(tag, attrs, content=""):
    opening = "<" + tag + "".join(f' {key}="{escape(value)}"' for key, value in attrs.items()) + ">"
    return opening if tag in VOID else f"{opening}{content}</{tag}>"


def render_page(project):
    api_repo = f"/repos/{OWNER}/{project.repo}"
    metadata = json.loads(github(api_repo))
    if metadata["full_name"] != f"{OWNER}/{project.repo}" or metadata["private"] or metadata["visibility"] != "public":
        raise ValueError(f"Expected a public repository owned by {OWNER}")

    branch = quote(metadata["default_branch"], safe="")
    revision = json.loads(github(f"{api_repo}/commits/{branch}"))["sha"]
    if not re.fullmatch(r"[0-9a-f]{40}", revision):
        raise ValueError("GitHub returned an invalid commit ID")
    readme_endpoint = f"{api_repo}/readme?{urlencode({'ref': revision})}"
    readme_metadata = json.loads(github(readme_endpoint))
    readme_path = readme_metadata["path"]
    if not re.fullmatch(r"(?:[\w.-]+/)*[\w.-]+", readme_path):
        raise ValueError("GitHub returned an invalid README path")
    html = github(readme_endpoint, "application/vnd.github.html+json")
    readme = Readme(html, project, revision, readme_path)

    try:
        github(f"{api_repo}/releases/latest")
        release = True
    except HTTPError as error:
        if error.code != 404:
            raise
        release = False

    repo_url = f"{GITHUB}/{OWNER}/{project.repo}"
    readme_url = f"{repo_url}/blob/{branch}/{quote(readme_path)}"
    title = escape(project.title)
    summary = escape(project.summary)
    canonical = f"https://foyt.net/projects/{project.slug}/"
    toc = "\n".join(
        f'              <li><a href="#{quote(slug)}">{escape(heading)}</a></li>'
        for slug, heading in readme.sections
    )
    if release:
        secondary = f'<a class="button" href="{repo_url}/releases/latest" target="_blank" rel="noopener noreferrer">Latest release <span aria-hidden="true">↗</span></a>'
    else:
        secondary = f'<a class="button" href="#{project.install}">Installation <span aria-hidden="true">↓</span></a>'

    return f'''<!doctype html>
<!-- Generated by scripts/update-readmes.py from {OWNER}/{project.repo}@{revision}:{readme_path} -->
<html lang="en" data-theme="gruvbox">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title} README · Foyt</title>
  <meta name="author" content="{OWNER}">
  <meta name="description" content="{summary}">
  <meta property="og:title" content="{title} README · Foyt">
  <meta property="og:description" content="{summary}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="{canonical}">
  <link rel="canonical" href="{canonical}">
  <link rel="icon" type="image/svg+xml" href="/logo.svg">
  <script src="/app.js?v=project-readmes-1"></script>
  <script type="module" src="/project-readme.js?v=1"></script>
  <link rel="stylesheet" href="/style.css?v=live-readmes-1">
</head>
<body class="project-page" data-project-accent="{project.accent}">
  <a href="#readme-title" class="skip-link">Skip to README</a>
  <header class="header">
    <a class="brand" href="/" aria-label="Foyt.net home"><span class="mini-logo" aria-hidden="true">[ƒ]</span><span>Foyt.net</span></a>
    <nav aria-label="Main navigation"><a href="{GITHUB}/{OWNER}" target="_blank" rel="noopener noreferrer">GitHub ↗</a></nav>
    <div class="header-tools">
      <button id="theme-toggle" aria-label="Switch color theme" title="Switch theme (T)">◐ <span id="theme-name">Gruvbox</span></button>
      <button id="command-open" aria-label="Open command menu" title="Command menu">⌘ <kbd>K</kbd></button>
    </div>
  </header>
  <main class="wrap project-page-main" id="top">
    <a class="project-back" href="/#projects"><span aria-hidden="true">←</span> All projects</a>
    <header class="project-page-intro">
      <div class="project-page-identity">
        <p class="project-page-repo">{OWNER}/{project.repo}</p>
        <h1 id="project-title">{title}</h1>
        <p class="project-page-summary">{summary}</p>
      </div>
      <div class="project-page-actions">
        <a class="button primary" href="{repo_url}" target="_blank" rel="noopener noreferrer">Open on GitHub <span aria-hidden="true">↗</span></a>
        {secondary}
      </div>
    </header>
    <div class="project-docs">
      <aside class="project-toc" aria-label="On this page">
        <details>
          <summary class="project-toc-title">On this page</summary>
          <ul>
{toc}
          </ul>
        </details>
      </aside>
      <section class="project-readme" aria-labelledby="readme-title">
        <div class="project-readme-bar">
          <h2 id="readme-title" tabindex="-1">README.md</h2>
          <a href="{readme_url}" target="_blank" rel="noopener noreferrer">README on GitHub <span aria-hidden="true">↗</span></a>
        </div>
        <p class="readme-status" role="status" hidden>Showing the saved README. Open the README on GitHub to check for updates.</p>
        <div class="readme-content" data-repo="{project.repo}" data-branch="{branch}" data-path="{quote(readme_path)}" data-snapshot-sha="{escape(readme_metadata['sha'])}">
{readme.html.strip()}
        </div>
      </section>
    </div>
  </main>
  <footer class="footer wrap">
    <a href="/" class="brand"><span class="mini-logo" aria-hidden="true">[ƒ]</span> Foyt.net</a>
    <button id="motion-toggle" aria-pressed="false">◉ Motion: on</button>
    <a class="logo-download" href="/foyt-ascii.txt" download>↓ Download ASCII logo</a>
    <a href="#top" aria-label="Back to top">↑ Back to top</a>
  </footer>
  <dialog id="command-dialog" aria-labelledby="command-title">
    <div class="dialog-top"><h2 id="command-title">Command menu</h2><button class="close-dialog" aria-label="Close command menu">[ esc ]</button></div>
    <p class="muted">Use ↑ and ↓ to select an option. Press Enter to open.</p>
    <a href="/#projects" class="command-item">Explore projects <kbd>P</kbd></a>
    <a href="/#about" class="command-item">About Foyt.net <kbd>A</kbd></a>
    <button class="command-item" id="command-theme">Switch theme <kbd>T</kbd></button>
    <button class="command-item" id="command-motion">Toggle motion <kbd>M</kbd></button>
    <a href="{repo_url}" class="command-item" target="_blank" rel="noopener noreferrer">Open GitHub <span>↗</span></a>
  </dialog>
</body>
</html>
'''


def main():
    pages = {}
    for project in PROJECTS:
        try:
            pages[project.slug] = render_page(project)
        except (KeyError, URLError, ValueError) as error:
            raise SystemExit(f"{project.repo}: {error}") from error

    OUTPUT.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory(dir=OUTPUT) as directory:
        for slug, page in pages.items():
            (Path(directory) / f"{slug}.html").write_text(page, encoding="utf-8")
        for slug in pages:
            destination = OUTPUT / slug
            destination.mkdir(exist_ok=True)
            (Path(directory) / f"{slug}.html").replace(destination / "index.html")


if __name__ == "__main__":
    main()
