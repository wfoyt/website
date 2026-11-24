const $ = (s) => document.querySelector(s);

function readPreference(key) {
 try {
  return window.localStorage?.getItem(key) ?? null;
 } catch {
  return null;
 }
}

function savePreference(key, value) {
 try {
  window.localStorage?.setItem(key, value);
 } catch {
  // Keep preferences working for the current visit when storage is blocked.
 }
}

const themeNames = { gruvbox: 'Gruvbox', phosphor: 'Phosphor', tokyo: 'Tokyo Night' };
const themes = Object.keys(themeNames);

function preferredTheme() {
 const savedTheme = readPreference('foyt-theme');
 return themes.includes(savedTheme) ? savedTheme : 'gruvbox';
}

let theme = preferredTheme();

function applyTheme() {
 document.documentElement.dataset.theme = theme;
 const label = $('#theme-name');
 if (label) label.textContent = themeNames[theme];
}

function nextTheme() {
 theme = themes[(themes.indexOf(theme) + 1) % themes.length];
 applyTheme();
 savePreference('foyt-theme', theme);
}

applyTheme();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let motion = readPreference('foyt-motion') !== 'false';

function applyMotionPreference() {
 const active = motion && !reducedMotion.matches;
 document.documentElement.classList.toggle('motion-off', !active);
 return active;
}

applyMotionPreference();

function initializeSite() {
 const motionToggle = $('#motion-toggle');
 const commandMotion = $('#command-motion');
 const wordmark = $('.wordmark');
 const reactorArt = $('#reactor-art');
 const reactorStatus = $('#reactor-status');
 const coordinate = $('#coordinate');
 let angle = .42;
 let frame;
 let lastFrame;

 function applyMotion() {
  const reduced = reducedMotion.matches;
  const active = applyMotionPreference();
  motionToggle.textContent = reduced ? '○ Motion: reduced' : active ? '◉ Motion: on' : '○ Motion: off';
  motionToggle.setAttribute('aria-pressed', String(!active));
  for (const control of [motionToggle, commandMotion]) {
   control.setAttribute('aria-disabled', String(reduced));
   control.title = reduced ? 'Your browser requests reduced motion' : '';
  }

  if (!reactorArt) return;
  reactorStatus.textContent = reduced ? '[ REDUCED MOTION ]' : active ? '[ RUNNING ]' : '[ PAUSED ]';
  cancelAnimationFrame(frame);
  lastFrame = undefined;
  if (active && !document.hidden) {
   wordmark.classList.add('reveal-wordmark');
   frame = requestAnimationFrame(animateReactor);
  }
 }

 function toggleMotion() {
  if (reducedMotion.matches) return;
  motion = !motion;
  savePreference('foyt-motion', String(motion));
  applyMotion();
 }

 // Original ASCII orbital sculpture. Every frame is plain, selectable text.
 function renderReactor(){
  const w=64,h=24,grid=Array.from({length:h},()=>Array(w).fill(' '));
  const depth=Array.from({length:h},()=>Array(w).fill(-Infinity));
  function dot(x,y,z,char){const c=Math.round(w/2+x*2.05),r=Math.round(h/2+y);if(c>=0&&c<w&&r>=0&&r<h&&z>depth[r][c]){grid[r][c]=char;depth[r][c]=z}}
  for(let ring=0;ring<3;ring++)for(let t=0;t<Math.PI*2;t+=.035){
   let x=11*Math.cos(t),y=7.8*Math.sin(t),z=0;
   const tilt=[.35,1.17,2.15][ring];let yy=y*Math.cos(tilt),zz=y*Math.sin(tilt);
   let xx=x*Math.cos(angle)-zz*Math.sin(angle);z=x*Math.sin(angle)+zz*Math.cos(angle);y=yy;
   dot(xx,y,z,z>0?'@':':');
  }
  const core=['  ___ ',' | F |',' |___|'];core.forEach((line,i)=>[...line].forEach((c,j)=>{if(c!==' ')dot((j-2.5)/2.05,i-1,99,c)}));
  for(let i=0;i<12;i++){const t=i*2.399+angle*.25;dot(Math.cos(t)*14,Math.sin(t)*10,-100,'.')}
  reactorArt.textContent=grid.map(r=>r.join('')).join('\n');
  coordinate.textContent=(Math.sin(angle)*1.618).toFixed(3);
 }

 function animateReactor(now) {
  lastFrame ??= now;
  const elapsed = now - lastFrame;
  if (elapsed >= 30) {
   angle += Math.min(elapsed, 100) * .00028;
   renderReactor();
   lastFrame = now;
  }
  frame = requestAnimationFrame(animateReactor);
 }

 if (reactorArt) {
  renderReactor();
  document.addEventListener('visibilitychange', applyMotion);
 }
 applyTheme();
 applyMotion();
 $('#theme-toggle').addEventListener('click', nextTheme);
 $('#command-theme').addEventListener('click', nextTheme);
 motionToggle.addEventListener('click', toggleMotion);
 commandMotion.addEventListener('click', toggleMotion);
 reducedMotion.addEventListener('change', applyMotion);
 window.addEventListener('pageshow', event => {
  if (!event.persisted) return;
  theme = preferredTheme();
  motion = readPreference('foyt-motion') !== 'false';
  applyTheme();
  applyMotion();
 });

 const filters = [...document.querySelectorAll('.filter')];
 const cards = [...document.querySelectorAll('.project-card')];
 const total = String(cards.length).padStart(2, '0');
 if (cards.length && 'IntersectionObserver' in window) {
  const cardObserver = new IntersectionObserver((entries, observer) => {
   for (const { target, isIntersecting } of entries) {
    if (!isIntersecting) continue;
    target.classList.add('card-reveal');
    observer.unobserve(target);
   }
  });
  cards.forEach(card => cardObserver.observe(card));
 }
 filters.forEach(button => button.addEventListener('click', () => {
  const filter = button.dataset.filter;
  for (const option of filters) {
   const active = option === button;
   option.classList.toggle('active', active);
   option.setAttribute('aria-pressed', String(active));
  }

  let count = 0;
  for (const card of cards) {
   card.hidden = filter !== 'all' && card.dataset.category !== filter;
   if (!card.hidden) count++;
  }
  $('#result-count').textContent = `showing ${String(count).padStart(2, '0')} / ${total}`;
 }));

 const contents = $('.project-toc details');
 if (contents) {
  const compactLayout = matchMedia('(max-width: 760px)');
  const updateContents = () => { contents.open = !compactLayout.matches; };
  updateContents();
  compactLayout.addEventListener('change', updateContents);
 }

 const commandDialog = $('#command-dialog');
 const commandItems = [...commandDialog.querySelectorAll('.command-item')];
 const sectionCommands = {
  p: commandDialog.querySelector('a[href$="#projects"]'),
  a: commandDialog.querySelector('a[href$="#about"]')
 };

 function openCommandMenu() {
  if (commandDialog.open) return;
  commandDialog.showModal();
  commandItems[0].focus();
 }

 $('#command-open').addEventListener('click', openCommandMenu);
 commandDialog.querySelector('.close-dialog').addEventListener('click', () => commandDialog.close());
 commandDialog.addEventListener('click', event => {
  if (event.target !== commandDialog) return;
  const bounds = commandDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom) commandDialog.close();
 });
 commandDialog.addEventListener('keydown', event => {
  const index = commandItems.indexOf(document.activeElement);
  let next;
  if (event.key === 'ArrowDown') next = (index + 1) % commandItems.length;
  if (event.key === 'ArrowUp') next = index < 0 ? commandItems.length - 1 : (index - 1 + commandItems.length) % commandItems.length;
  if (event.key === 'Home') next = 0;
  if (event.key === 'End') next = commandItems.length - 1;
  if (next !== undefined) {
   event.preventDefault();
   commandItems[next].focus();
   commandItems[next].scrollIntoView({ block: 'nearest' });
  }
  if (event.key === 'Enter' && index >= 0) {
   event.preventDefault();
   commandItems[index].click();
  }
 });
 commandDialog.querySelectorAll('a').forEach(link => link.addEventListener('click', () => commandDialog.close()));
 document.addEventListener('keydown', event => {
  const key = event.key.toLowerCase();
  if ((event.metaKey || event.ctrlKey) && key === 'k') {
   event.preventDefault();
   if (commandDialog.open) commandDialog.close();
   else openCommandMenu();
   return;
  }
  if (event.ctrlKey || event.metaKey || event.altKey || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
  if (key === 't') nextTheme();
  if (key === 'm') toggleMotion();
  if (key === 'p' || key === 'a') sectionCommands[key].click();
  if (key === '?') openCommandMenu();
 });
}

document.addEventListener('DOMContentLoaded', initializeSite);
