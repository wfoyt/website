const $ = (s) => document.querySelector(s);
const glyphs = {
 F:['██████','██    ','█████ ','██    ','██    ','██    '],
 O:[' ████ ','██  ██','██  ██','██  ██','██  ██',' ████ '],
 Y:['██  ██','██  ██',' ████ ','  ██  ','  ██  ','  ██  '],
 T:['██████','  ██  ','  ██  ','  ██  ','  ██  ','  ██  '],
 L:['██    ','██    ','██    ','██    ','██    ','██████'],
 A:[' ████ ','██  ██','██  ██','██████','██  ██','██  ██'],
 B:['█████ ','██  ██','█████ ','██  ██','██  ██','█████ '],
 S:[' █████','██    ',' ████ ','    ██','    ██','█████ '],
 ' ':['   ','   ','   ','   ','   ','   ']
};
const asciiLogo = Array.from({length:6},(_,row)=>[...'FOYT LABS'].map(c=>glyphs[c][row]).join('  ')).join('\n');
$('#wordmark').textContent = asciiLogo;
const themes = ['gruvbox','phosphor','tokyo'];
let theme = themes.includes(localStorage.getItem('foyt-theme')) ? localStorage.getItem('foyt-theme') : 'gruvbox';
function applyTheme(){document.documentElement.dataset.theme=theme;$('#theme-name').textContent={gruvbox:'Gruvbox',phosphor:'Phosphor',tokyo:'Tokyo Night'}[theme];localStorage.setItem('foyt-theme',theme)}
function nextTheme(){theme=themes[(themes.indexOf(theme)+1)%themes.length];applyTheme()}
applyTheme();$('#theme-toggle').addEventListener('click',nextTheme);$('#command-theme').addEventListener('click',nextTheme);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let motion = localStorage.getItem('foyt-motion') === null ? !reducedMotion.matches : localStorage.getItem('foyt-motion') === 'true';
function applyMotion(){const active=motion&&!reducedMotion.matches;document.documentElement.classList.toggle('motion-off',!active);$('#motion-toggle').textContent=active?'◉ Motion: on':'○ Motion: off';$('#motion-toggle').setAttribute('aria-pressed',String(!active));$('#reactor-status').textContent=active?'[ RUNNING ]':'[ PAUSED ]';localStorage.setItem('foyt-motion',String(motion))}
function toggleMotion(){motion=!motion;applyMotion()}
applyMotion();$('#motion-toggle').addEventListener('click',toggleMotion);$('#command-motion').addEventListener('click',toggleMotion);
reducedMotion.addEventListener('change',()=>{motion=!reducedMotion.matches;applyMotion()});
// Original ASCII orbital sculpture. Every frame is plain, selectable text.
let angle=.42, last=0;
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
 $('#reactor-art').textContent=grid.map(r=>r.join('')).join('\n');$('#coordinate').textContent=(Math.sin(angle)*1.618).toFixed(3);
}
function animate(now){if(now-last>85&&motion&&!reducedMotion.matches&&!document.hidden){angle+=.018;renderReactor();last=now}requestAnimationFrame(animate)}
renderReactor();requestAnimationFrame(animate);
document.querySelectorAll('.filter').forEach(button=>button.addEventListener('click',()=>{
 document.querySelectorAll('.filter').forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
 let count=0;document.querySelectorAll('.project-card').forEach(card=>{card.hidden=button.dataset.filter!=='all'&&card.dataset.category!==button.dataset.filter;if(!card.hidden)count++});
 $('#result-count').textContent=`showing ${String(count).padStart(2,'0')} / 04`;
}));
const projects={
 lumen:{title:'Lumen',repo:'Lumen',tag:'LOCAL AI / DESKTOP APP',description:'Your ideas. Your models. Your Linux desktop. Lumen brings Ollama conversations and useful everyday tools into a native GNOME app.',features:['Chat with Ollama locally or connect to your own server.','Attach images, PDFs, text, code, and CSV files with built-in previews.','Use Python tools, optional Brave Search, and custom MCP servers.','Save conversations locally and revisit different response versions.'],requires:'Linux, Flatpak, a running Ollama service, and a downloaded model. Image and tool support depend on your selected model.',release:true},
 redragon:{title:'Redragon Control',repo:'Redragon-Control',tag:'HARDWARE / DESKTOP APP',description:'Lighting, key shortcuts, and wheel controls for the Redragon K686WBG-RGB-MAX on Linux. Built with GTK 4 and libadwaita.',features:['Save keyboard lighting and choose from 17 built-in animations.','Remap keys and wheel actions to shortcuts or media controls.','Save, switch, import, and export reusable profiles.','Match Adwaita or your Omarchy desktop palette.'],requires:'64-bit x86 Linux and a supported K686 MAX keyboard. Lighting requires the 2.4 GHz receiver; key and wheel remapping also supports a USB cable. Other Redragon models are not currently supported.',release:true},
 audio:{title:'Omarchy Audio Control',repo:'Omarchy-Audio-Control',tag:'MUSIC / OMARCHY PLUGIN',description:'A themed music button for the Omarchy Quickshell bar, with native colors, spacing, and popup behavior.',features:['See album artwork, track name, artist, and album.','Control previous/restart, play/pause, and next.','Choose between available media players.','Keep Omarchy’s media hotkeys and player detection.'],requires:'Omarchy with Quickshell and the omarchy plugin commands. Your music player must expose MPRIS controls and metadata.',release:false},
 monitor:{title:'Monitor Layout',repo:'omarchy-monitor-manager',tag:'DISPLAYS / OMARCHY PLUGIN',description:'A native Omarchy shell plugin for arranging displays and tuning each monitor’s resolution, refresh rate, and scale.',features:['Drag numbered displays into place with snapping edges.','Fine-tune positions, resolution, refresh rate, and scale.','Preview changes with a 20-second automatic rollback.','Save backed-up settings while preserving manual configuration outside the managed block.'],requires:'Omarchy 4’s Quickshell plugin system, Hyprland’s Lua configuration API, and Python 3. This version manages active extended displays; mirroring and monitor disabling are outside its scope.',release:false}
};
const projectDialog=$('#project-dialog'),commandDialog=$('#command-dialog');
document.querySelectorAll('[data-project]').forEach(button=>button.addEventListener('click',()=>{
 const p=projects[button.dataset.project],url=`https://github.com/wfoyt/${p.repo}`;
 $('#detail-path').textContent=`~/public/${p.repo}`;
 $('#detail-content').innerHTML=`<p class="eyebrow accent">${p.tag}</p><h2 id="detail-title">${p.title}</h2><p>${p.description}</p><ul>${p.features.map(f=>`<li>${f}</li>`).join('')}</ul><p class="requirement">${p.requires}</p><div class="detail-actions"><a class="button primary" href="${url}${p.release?'/releases/latest':'#install'}" target="_blank" rel="noopener noreferrer">${p.release?'Get the latest release':'Installation guide'} ↗</a><a class="text-link" href="${url}" target="_blank" rel="noopener noreferrer">Browse source ↗</a></div>`;
 projectDialog.showModal();
}));
document.querySelectorAll('.close-dialog').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}}));
$('#command-open').addEventListener('click',()=>commandDialog.showModal());
commandDialog.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>commandDialog.close()));
document.addEventListener('keydown',e=>{
 if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(projectDialog.open)projectDialog.close();commandDialog.open?commandDialog.close():commandDialog.showModal();return}
 if(e.ctrlKey||e.metaKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||projectDialog.open)return;
 const key=e.key.toLowerCase();
 if(key==='t')nextTheme();if(key==='m')toggleMotion();
 if(key==='p'||key==='a'){commandDialog.close();location.hash=key==='p'?'projects':'about'}
 if(key==='?')commandDialog.showModal();
});
