const content = document.querySelector('.readme-content');
const { repo, branch, path, snapshotSha } = content.dataset;
const repository = `https://github.com/wfoyt/${repo}`;
const fileBase = `${repository}/blob/${branch}/`;
const imageBase = `https://raw.githubusercontent.com/wfoyt/${repo}/${branch}/`;
const projectTitle = document.querySelector('#project-title').textContent.trim();
const allowedTags = new Set(`
 abbr b blockquote br caption code dd del details div dl dt em h1 h2 h3 h4 h5 h6
 hr i img input kbd li mark ol p pre s samp small span strong sub summary sup
 table tbody td tfoot th thead tr ul var wbr a
`.trim().split(/\s+/));

function fragment(value) {
 try {
  return decodeURIComponent(value).replace(/^user-content-/, '');
 } catch {
  return value;
 }
}

function readmeUrl(value, image = false) {
 if (!value?.trim()) return null;
 if (!image && value.startsWith('#')) return `#${encodeURIComponent(fragment(value.slice(1)))}`;
 try {
  const base = image ? imageBase : fileBase;
  // Resolve repository-relative paths separately so ../ and / stay in the repository.
  const relative = new URL(value, `https://readme.invalid/${path}`);
  if (relative.origin === 'https://readme.invalid') {
   if (!image && relative.pathname === `/${path}` && relative.hash) {
    return `#${encodeURIComponent(fragment(relative.hash.slice(1)))}`;
   }
   return `${base}${relative.pathname.slice(1)}${relative.search}${relative.hash}`;
  }
  const protocols = image ? ['https:'] : ['https:', 'http:', 'mailto:'];
  if (protocols.includes(relative.protocol) && !relative.username && !relative.password) return relative.href;
 } catch {
  // Leave invalid URLs out of the rendered README.
 }
 return null;
}

function renderReadme(html) {
 // Parse in an inert template and rebuild the document using only approved elements and attributes.
 const template = document.createElement('template');
 template.innerHTML = html;
 const article = template.content.querySelector('article.markdown-body');
 if (!article?.textContent.trim()) throw new Error('GitHub returned an empty README');

 const ids = new Set([...document.querySelectorAll('[id]')]
  .filter(element => !content.contains(element))
  .map(element => element.id));

 function render(source) {
  if (source.nodeType === Node.TEXT_NODE) return document.createTextNode(source.data);
  if (source.nodeType !== Node.ELEMENT_NODE || source.namespaceURI !== 'http://www.w3.org/1999/xhtml') return null;

  const tag = source.localName;
  if (tag === 'div' && source.classList.contains('markdown-heading')) {
   const heading = source.querySelector(':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6');
   const anchor = source.querySelector(':scope > a[href^="#"]');
   if (heading && anchor) return renderHeading(heading, fragment(anchor.getAttribute('href').slice(1)));
  }
  if (tag === 'markdown-accessiblity-table') return renderChildren(source);
  if (!allowedTags.has(tag)) return null;
  if (tag === 'h1') return renderHeading(source, fragment(source.id));
  if (tag === 'input' && (source.type !== 'checkbox' || !source.disabled)) return null;

  const element = document.createElement(tag);
  setId(element, fragment(source.id));
  if (source.title) element.title = source.title;
  if ((tag === 'div' || tag === 'p') && source.getAttribute('align') === 'center') element.className = 'readme-center';
  if (tag === 'span') element.className = [...source.classList].filter(token => /^pl-[a-z0-9-]+$/.test(token)).join(' ');
  if (tag === 'a') {
   const href = source.getAttribute('href');
   const image = source.firstElementChild;
   if (!source.id && source.childElementCount === 1 && !source.textContent.trim() &&
       image?.localName === 'img' && !image.alt && image.getAttribute('src') === href) return render(image);
   const url = readmeUrl(href);
   if (url) {
    element.setAttribute('href', url);
    if (!url.startsWith('#')) {
     element.target = '_blank';
     element.rel = 'noopener noreferrer';
    }
   }
  }
  if (tag === 'img') {
   const src = readmeUrl(source.getAttribute('src'), true);
   if (!src) return null;
   element.alt = source.alt;
   element.loading = 'lazy';
   element.decoding = 'async';
   for (const name of ['width', 'height']) {
    const dimension = source.getAttribute(name);
    if (/^[1-9][0-9]{0,4}$/.test(dimension)) element.setAttribute(name, dimension);
   }
   if (source.getAttribute('align') === 'right') element.className = 'readme-image-right';
   element.src = src;
   if (/\.gif$/i.test(new URL(src).pathname) && source.parentElement.localName === 'a' &&
       readmeUrl(source.parentElement.getAttribute('href'))) {
    const media = document.createDocumentFragment();
    const label = document.createElement('span');
    label.className = 'readme-animation-label';
    label.textContent = element.alt || 'View animation';
    element.classList.add('readme-animated-image');
    media.append(element, label);
    return media;
   }
  }
  if (tag === 'details') element.open = source.open;
  if (tag === 'ol' && /^\d+$/.test(source.getAttribute('start'))) element.start = source.start;
  if (tag === 'input') {
   element.type = 'checkbox';
   element.disabled = true;
   element.checked = source.checked;
   element.setAttribute('aria-label', source.checked ? 'Completed' : 'Incomplete');
  }
  element.append(renderChildren(source));
  if (tag !== 'table') return element;

  const wrapper = document.createElement('div');
  wrapper.className = 'readme-table';
  wrapper.tabIndex = 0;
  wrapper.setAttribute('role', 'region');
  wrapper.setAttribute('aria-label', 'README table');
  wrapper.append(element);
  return wrapper;
 }

 function renderChildren(source) {
  const children = document.createDocumentFragment();
  for (const child of source.childNodes) {
   const safe = render(child);
   if (safe) children.append(safe);
  }
  return children;
 }

 function setId(element, id) {
  if (id && !ids.has(id)) {
   element.id = id;
   ids.add(id);
  }
 }

 function renderHeading(source, id) {
  const topHeading = source.localName === 'h1';
  const duplicateTitle = topHeading && source.textContent.trim().toLowerCase() === projectTitle.toLowerCase();
  const heading = document.createElement(duplicateTitle ? 'span' : topHeading ? 'h2' : source.localName);
  setId(heading, id);
  if (duplicateTitle) {
   heading.setAttribute('aria-hidden', 'true');
  } else {
   if (topHeading) heading.className = 'readme-document-title';
   heading.append(renderChildren(source));
  }
  return heading;
 }

 const readme = renderChildren(article);
 if (!readme.textContent.trim()) throw new Error('No readable README content');
 return readme;
}

function updateNavigation(readme) {
 const toc = document.querySelector('.project-toc');
 const list = toc.querySelector('ul');
 const headings = [...readme.querySelectorAll('h2[id]:not(.readme-document-title)')];
 const links = headings.map(heading => {
  const item = document.createElement('li');
  const link = document.createElement('a');
  link.setAttribute('href', `#${encodeURIComponent(heading.id)}`);
  link.textContent = heading.textContent.trim();
  item.append(link);
  return item;
 });
 list.replaceChildren(...links);
 toc.hidden = !links.length;

 const install = document.querySelector('.project-page-actions a[href^="#"]');
 if (install && !readme.getElementById(fragment(install.hash.slice(1)))) {
  const heading = headings.find(candidate => /^(install(?:ation|ing)?(?:\s|$)|getting started|get started|quick start)/i.test(candidate.textContent.trim()));
  install.hidden = !heading;
  if (heading) install.setAttribute('href', `#${encodeURIComponent(heading.id)}`);
 }
}

async function refreshReadme() {
 try {
  if (!/^[a-z\d_.-]+$/i.test(repo)) throw new Error('Invalid GitHub repository');
  const response = await fetch(`https://api.github.com/repos/wfoyt/${repo}/readme?ref=HEAD`, {
   headers: { Accept: 'application/vnd.github.html+json' },
   cache: 'no-cache',
   credentials: 'omit',
   signal: AbortSignal.timeout(5000)
  });
  if (!response.ok) throw new Error(`GitHub README returned ${response.status}`);
  if (response.headers.get('ETag') === `"${snapshotSha}"`) return;

  const readme = renderReadme(await response.text());
  const hash = fragment(location.hash.slice(1));
  const previousTarget = document.getElementById(hash);
  const latestTarget = readme.getElementById(hash);
  const shouldScroll = latestTarget && (!previousTarget || previousTarget.getBoundingClientRect().top >= 0);
  updateNavigation(readme);
  content.replaceChildren(readme);
  if (shouldScroll) latestTarget.scrollIntoView({ behavior: 'instant' });
 } catch {
  document.querySelector('.readme-status').hidden = false;
 }
}

refreshReadme();
