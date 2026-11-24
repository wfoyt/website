const $ = (s) => document.querySelector(s);
const themes = ['gruvbox','phosphor','tokyo'];
let theme = themes.includes(localStorage.getItem('foyt-theme')) ? localStorage.getItem('foyt-theme') : 'gruvbox';
function applyTheme(){document.documentElement.dataset.theme=theme;$('#theme-name').textContent={gruvbox:'Gruvbox',phosphor:'Phosphor',tokyo:'Tokyo Night'}[theme];localStorage.setItem('foyt-theme',theme)}
function nextTheme(){theme=themes[(themes.indexOf(theme)+1)%themes.length];applyTheme()}
applyTheme();$('#theme-toggle').addEventListener('click',nextTheme);$('#command-theme').addEventListener('click',nextTheme);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const motionToggle = $('#motion-toggle');
const reactorArt = $('#reactor-art');
const coordinate = $('#coordinate');
let motion = localStorage.getItem('foyt-motion') !== 'false';
let angle = .42;
let frame;
let lastFrame;

function applyMotion() {
 const active = motion && !reducedMotion.matches;
 document.documentElement.classList.toggle('motion-off', !active);
 motionToggle.textContent = active ? '◉ Motion: on' : '○ Motion: off';
 motionToggle.setAttribute('aria-pressed', String(!active));
 $('#reactor-status').textContent = active ? '[ RUNNING ]' : '[ PAUSED ]';

 cancelAnimationFrame(frame);
 lastFrame = undefined;
 if (active && !document.hidden) frame = requestAnimationFrame(animateReactor);
}

function toggleMotion() {
 if (reducedMotion.matches) return;
 motion = !motion;
 localStorage.setItem('foyt-motion', String(motion));
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

renderReactor();
applyMotion();
motionToggle.addEventListener('click', toggleMotion);
$('#command-motion').addEventListener('click', toggleMotion);
reducedMotion.addEventListener('change', applyMotion);
document.addEventListener('visibilitychange', applyMotion);

const filters = [...document.querySelectorAll('.filter')];
const cards = [...document.querySelectorAll('.project-card')];
const total = String(cards.length).padStart(2, '0');
const cardObserver = new IntersectionObserver((entries, observer) => {
 for (const { target, isIntersecting } of entries) {
  if (!isIntersecting) continue;
  target.classList.add('card-reveal');
  observer.unobserve(target);
 }
});

cards.forEach(card => cardObserver.observe(card));
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
const projects={
 lumen:{title:'Lumen',repo:'Lumen',tag:'LOCAL AI / DESKTOP APP',description:'Lumen is a native GNOME client for Ollama conversations, file attachments, and model tools.',features:['Chat with Ollama locally or connect to your own server.','Attach images, PDFs, text, code, and CSV files with built-in previews.','Use Python tools, optional Brave Search, and custom MCP servers.','Save conversations locally and revisit different response versions.'],requires:'Linux, Flatpak, a running Ollama service, and a downloaded model. Image and tool support depend on your selected model.',release:true},
 redragon:{title:'Redragon Control',repo:'Redragon-Control',tag:'HARDWARE / DESKTOP APP',description:'Lighting, key shortcuts, and wheel controls for the Redragon K686WBG-RGB-MAX on Linux. Built with GTK 4 and libadwaita.',features:['Save keyboard lighting and choose from 17 built-in animations.','Remap keys and wheel actions to shortcuts or media controls.','Save, switch, import, and export reusable profiles.','Match Adwaita or your Omarchy desktop palette.'],requires:'64-bit x86 Linux and a supported K686 MAX keyboard. Lighting requires the 2.4 GHz receiver; key and wheel remapping also supports a USB cable. Other Redragon models are not currently supported.',release:true},
 audio:{title:'Omarchy Audio Control',repo:'Omarchy-Audio-Control',tag:'MUSIC / OMARCHY PLUGIN',description:'A themed music button for the Omarchy Quickshell bar, with native colors, spacing, and popup behavior.',features:['See album artwork, track name, artist, and album.','Control previous/restart, play/pause, and next.','Choose between available media players.','Keep Omarchy’s media hotkeys and player detection.'],requires:'Omarchy with Quickshell and the omarchy plugin commands. Your music player must expose MPRIS controls and metadata.',installAnchor:'installation'},
 monitor:{title:'Monitor Layout',repo:'omarchy-monitor-manager',tag:'DISPLAYS / OMARCHY PLUGIN',description:'A native Omarchy shell plugin for arranging displays and tuning each monitor’s resolution, refresh rate, and scale.',features:['Drag numbered displays into place with snapping edges.','Fine-tune positions, resolution, refresh rate, and scale.','Preview changes with a 20-second automatic rollback.','Save backed-up settings while preserving manual configuration outside the managed block.'],requires:'Omarchy 4’s Quickshell plugin system, Hyprland’s Lua configuration API, and Python 3. This version manages active extended displays; mirroring and monitor disabling are outside its scope.'},
 flatfind: {
  title: 'Flatfind',
  repo: 'flatfind',
  tag: 'FLATPAK / TERMINAL TOOL',
  description: 'Flatfind is an Omarchy-inspired terminal picker for finding, installing, and removing Flatpak apps.',
  features: [
   'Search available or installed apps by name or app ID.',
   'Preview package details such as source, branch, and architecture.',
   'Select multiple apps to install or remove in one session.',
   'Browse user, system, or named Flatpak installations.'
  ],
  requires: 'Flatpak, Python 3, and fzf 0.64 or later on your PATH. Enable a Flatpak remote such as Flathub to browse available apps.'
 }
};
const projectDialog=$('#project-dialog'),commandDialog=$('#command-dialog');
document.querySelectorAll('[data-project]').forEach(button=>button.addEventListener('click',()=>{
 const p=projects[button.dataset.project],url=`https://github.com/wfoyt/${p.repo}`;
 $('#detail-path').textContent=`~/public/${p.repo}`;
 const detailsUrl = p.release ? `${url}/releases/latest` : `${url}#${p.installAnchor ?? 'install'}`;
 $('#detail-content').innerHTML=`<p class="eyebrow accent">${p.tag}</p><h2 id="detail-title">${p.title}</h2><p>${p.description}</p><ul>${p.features.map(f=>`<li>${f}</li>`).join('')}</ul><p class="requirement">${p.requires}</p><div class="detail-actions"><a class="button primary" href="${detailsUrl}" target="_blank" rel="noopener noreferrer">${p.release?'Get the latest release':'Installation guide'} ↗</a><a class="text-link" href="${url}" target="_blank" rel="noopener noreferrer">Browse source ↗</a></div>`;
 projectDialog.showModal();
}));
document.querySelectorAll('.close-dialog').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}}));
const commandItems = [...commandDialog.querySelectorAll('.command-item')];
function openCommandMenu(){commandDialog.showModal();commandItems[0].focus()}
$('#command-open').addEventListener('click',openCommandMenu);
commandDialog.addEventListener('keydown',event=>{
 const index=commandItems.indexOf(document.activeElement);
 let next;
 if(event.key==='ArrowDown')next=(index+1)%commandItems.length;
 if(event.key==='ArrowUp')next=index<0?commandItems.length-1:(index-1+commandItems.length)%commandItems.length;
 if(event.key==='Home')next=0;
 if(event.key==='End')next=commandItems.length-1;
 if(next!==undefined){event.preventDefault();event.stopPropagation();commandItems[next].focus();commandItems[next].scrollIntoView({block:'nearest'})}
 if(event.key==='Enter'&&index>=0){event.preventDefault();commandItems[index].click()}
});
commandDialog.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>commandDialog.close()));
document.addEventListener('keydown',e=>{
 if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(projectDialog.open)projectDialog.close();commandDialog.open?commandDialog.close():openCommandMenu();return}
 if(e.ctrlKey||e.metaKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||projectDialog.open)return;
 const key=e.key.toLowerCase();
 if(key==='t')nextTheme();if(key==='m')toggleMotion();
 if(key==='p'||key==='a'){commandDialog.close();location.hash=key==='p'?'projects':'about'}
 if(key==='?')openCommandMenu();
});
