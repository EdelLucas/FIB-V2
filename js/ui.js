// FIB Personalabteilung · Navigation, Breadcrumbs, Theme, Seitenleiste, Schnellsuche

// Beim Öffnen einer Ansicht: was neu gezeichnet werden soll
const VIEW_ENTER={
  dash:renderDashboard,
  ma:()=>filterMA(true),
  kl:klRender,
  profil:renderMyProfile,
  benutzer:renderUserList,
  tpl:()=>showTplTab(curTplKey),
  cfg:()=>{renderTdCorrections();renderMigrationStatus();renderThemeButtons();},
  fibco:()=>{fcRender();fcPreview();},
  cid:cidRender,
  td:tdRenderList,
  cirg:()=>{cirgRenderEvents();cirgRenderLogs();},
  law:lawRender
};
const VIEW_TITLES={dash:'Dashboard',ma:'Mitarbeiterverzeichnis',kl:'Klassifizierung',rang:'Ranganpassung',ein:'Einstellung',kue:'Kündigung',san:'Sanktion',pa:'Personalakte',az:'AZ-System',tpl:'Vorlagen-Editor',fibco:'Fallakten',cid:'Beweise',td:'Ausbildung',cirg:'Events',law:'Aktensystem',profil:'Mein Profil',benutzer:'Benutzerverwaltung',cfg:'Einstellungen'};

function sv(name){
  const nav=document.querySelector(`.ni[data-view="${name}"]:not([data-tab])`);
  const view=$('v-'+name);
  if(!view)return;
  const need=view.dataset.roles||(nav&&nav.dataset.roles);
  if(need&&!hasRole(need)){showToast('Kein Zugriff auf dieses Modul',{type:'err'});return;}
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('act',v===view));
  setActiveNav(nav);
  // Breadcrumb + Fenstertitel
  const group=nav&&nav.closest('.nav-group');
  const groupLabel=name==='profil'?'Account':(group?group.dataset.label:'Übersicht');
  setOb('crumb-group',groupLabel);
  setOb('crumb-page',VIEW_TITLES[name]||name);
  document.title=(VIEW_TITLES[name]||'FIB')+' · FIB Personalabteilung';
  if(group&&group.classList.contains('collapsed'))toggleNavGroup(group.dataset.group,false);
  toggleSidebar(false);
  const main=document.querySelector('.main');if(main)main.scrollTop=0;
  if(DEPTS[name])deptTabSwitch(name,'main');
  if(VIEW_ENTER[name])VIEW_ENTER[name]();
}
function setActiveNav(el){
  document.querySelectorAll('.ni,.sb-user').forEach(n=>{
    const on=n===el;
    n.classList.toggle('act',on);
    if(on)n.setAttribute('aria-current','page');else n.removeAttribute('aria-current');
  });
  if(!el){const u=document.querySelector('.sb-user');if(u&&$('v-profil').classList.contains('act'))u.classList.add('act');}
}
// Reiter innerhalb einer Abteilungsseite (Fallakte / Mitglieder …)
function deptTabSwitch(view,tab){
  document.querySelectorAll(`#v-${view} .dept-tab`).forEach(b=>b.classList.toggle('act',b.dataset.tab===tab));
  document.querySelectorAll(`#v-${view} .dept-tabpanel`).forEach(p=>{p.hidden=p.id!==`${view}-tab-${tab}`;});
  if(tab==='members')renderDeptMembers(view);
  if(view==='cirg'&&tab==='logs')cirgRenderLogs();
}
function goToDeptMembers(view,el){
  sv(view);
  deptTabSwitch(view,'members');
  setActiveNav(el);
  setOb('crumb-page','Mitglieder');
}

// ---------- Seitenleiste: Gruppen, Mini-Modus, Mobil ----------
function _lsGet(k,d){try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v);}catch(e){return d;}}
function _lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
function toggleNavGroup(g,force){
  const el=document.querySelector(`.nav-group[data-group="${g}"]`);if(!el)return;
  const collapsed=typeof force==='boolean'?force:!el.classList.contains('collapsed');
  el.classList.toggle('collapsed',collapsed);
  const state=_lsGet('fib_nav_collapsed',{});state[g]=collapsed;_lsSet('fib_nav_collapsed',state);
}
function restoreNavGroups(){
  const state=_lsGet('fib_nav_collapsed',{});
  Object.keys(state).forEach(g=>{const el=document.querySelector(`.nav-group[data-group="${g}"]`);if(el)el.classList.toggle('collapsed',!!state[g]);});
  document.body.classList.toggle('sb-mini',!!_lsGet('fib_sb_mini',false));
}
function toggleSidebar(force){
  const open=typeof force==='boolean'?force:!document.body.classList.contains('sb-open');
  document.body.classList.toggle('sb-open',open);
  const t=document.querySelector('.sb-toggle');if(t)t.setAttribute('aria-expanded',open);
}
function toggleSidebarMini(){
  const mini=!document.body.classList.contains('sb-mini');
  document.body.classList.toggle('sb-mini',mini);
  _lsSet('fib_sb_mini',mini);
}

// ---------- Theme (hell / dunkel) ----------
function setTheme(t){
  document.documentElement.dataset.theme=t;
  try{localStorage.setItem('fib_theme',t);}catch(e){}
  renderThemeButtons();
}
function toggleTheme(){ setTheme(document.documentElement.dataset.theme==='light'?'dark':'light'); }
function renderThemeButtons(){
  const t=document.documentElement.dataset.theme||'dark';
  document.querySelectorAll('[data-action="theme-set"]').forEach(b=>b.classList.toggle('act',b.dataset.arg===t));
}

// ---------- Akzentfarbe ----------
function setCol(h){
  if(!/^#[0-9a-f]{6}$/i.test(h||''))return;
  const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);
  const root=document.documentElement.style;
  root.setProperty('--g',h);
  root.setProperty('--gd',`rgba(${r},${g},${b},0.4)`);
  root.setProperty('--gg',`rgba(${r},${g},${b},0.13)`);
  root.setProperty('--on-g',(r*299+g*587+b*114)/1000>160?'#0b0c0f':'#ffffff');
  setOb('colhex',h);
  sv2('colpick',h);
  document.querySelectorAll('.swatch').forEach(s=>s.classList.toggle('act',s.dataset.arg===h));
  try{localStorage.setItem('fib_color',h);}catch(e){}
}
async function saveColToAccount(h){
  setCol(h);
  if(!currentUser)return;
  try{
    await saveProfile(currentUser,{themeColor:h});
    currentProfile.themeColor=h;
    showToast('Farbe gespeichert');
  }catch(e){ showToast('Farbe konnte nicht gespeichert werden',{type:'err'}); }
}
function renderColorPresets(){
  const box=$('col-presets');if(!box)return;
  const presets=[['#4a90e2','Blau'],['#6366f1','Indigo'],['#14b8a6','Teal'],['#a855f7','Violett'],['#f59e0b','Amber'],['#f43f5e','Rot'],['#22c55e','Grün']];
  box.innerHTML=presets.map(([c,l])=>`<button type="button" class="swatch" style="--c:${c}" data-action="set-color" data-arg="${c}" title="${l}"><span></span>${l}</button>`).join('');
}

// ---------- Uhr ----------
function tick(){ setOb('clk',new Date().toTimeString().slice(0,8)); }

// ===================== SCHNELLSUCHE (Strg+K) =====================
let _palItems=[],_palSel=0;
function openPalette(){
  if(!currentUser)return;
  sv2('palette-input','');
  renderPalette('');
  openModal('palette');
  setTimeout(()=>$('palette-input').focus(),20);
}
function paletteSource(q){
  q=q.toLowerCase().trim();
  // Module: alle sichtbaren Navigationseinträge
  const mods=[];
  document.querySelectorAll('.sb .ni').forEach(n=>{
    if(n.closest('[hidden]')||n.hidden)return;
    const group=n.closest('.nav-group');
    const label=n.textContent.trim();
    const full=(group&&group.dataset.label&&n.dataset.tab?group.dataset.label+' · ':'')+label;
    mods.push({type:'mod',label:full,sub:group?group.dataset.label:'',icon:(n.querySelector('i')||{}).className||'ti ti-point',action:n.dataset.action,arg:n.dataset.arg,el:n});
  });
  const modHits=mods.filter(m=>!q||m.label.toLowerCase().includes(q)||(m.sub||'').toLowerCase().includes(q));
  // Personen aus dem Verzeichnis
  const people=q.length<2?[]:MA.filter(m=>[m.name,m.id,m.rank,m.dn].join(' ').toLowerCase().includes(q)).slice(0,8)
    .map(m=>({type:'person',label:m.name,sub:`${m.rank||''} · ID ${m.id}`,icon:'ti ti-user',id:m.id}));
  return[...modHits.slice(0,q?8:12),...people];
}
function renderPalette(q){
  _palItems=paletteSource(q);
  _palSel=0;
  const list=$('palette-list');
  if(!_palItems.length){list.innerHTML='<li class="palette-empty">Nichts gefunden.</li>';return;}
  let lastType='';
  list.innerHTML=_palItems.map((it,i)=>{
    const head=it.type!==lastType?`<li class="palette-group">${it.type==='mod'?'Module':'Personen'}</li>`:'';
    lastType=it.type;
    return head+`<li role="option" class="palette-item${i===0?' sel':''}" data-idx="${i}">
      <i class="${esc(it.icon)}"></i><span class="palette-label">${esc(it.label)}</span><span class="palette-sub">${esc(it.sub||'')}</span><i class="ti ti-corner-down-left palette-enter"></i>
    </li>`;
  }).join('');
}
function movePalette(d){
  if(!_palItems.length)return;
  _palSel=(_palSel+d+_palItems.length)%_palItems.length;
  document.querySelectorAll('.palette-item').forEach(li=>li.classList.toggle('sel',+li.dataset.idx===_palSel));
  const cur=document.querySelector('.palette-item.sel');if(cur)cur.scrollIntoView({block:'nearest'});
}
function runPalette(i){
  const it=_palItems[i];if(!it)return;
  closeModalById('palette');
  if(it.type==='person'){openPerson(it.id);return;}
  if(it.action==='nav-members')goToDeptMembers(it.arg,it.el);else sv(it.arg);
}
document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openPalette();return;}
  if(!$('palette').classList.contains('show'))return;
  if(e.key==='ArrowDown'){e.preventDefault();movePalette(1);}
  else if(e.key==='ArrowUp'){e.preventDefault();movePalette(-1);}
  else if(e.key==='Enter'){e.preventDefault();runPalette(_palSel);}
});
document.addEventListener('input',e=>{ if(e.target.id==='palette-input')renderPalette(e.target.value); });
document.addEventListener('click',e=>{
  const li=e.target.closest('.palette-item');
  if(li)runPalette(+li.dataset.idx);
});

Object.assign(ACTIONS,{
  'nav':(name)=>sv(name),
  'nav-members':(view,el)=>goToDeptMembers(view,el),
  'nav-group':(g)=>toggleNavGroup(g),
  'dept-tab':(arg)=>{const [view,tab]=arg.split(':');deptTabSwitch(view,tab);},
  'sidebar':()=>toggleSidebar(),
  'sidebar-close':()=>toggleSidebar(false),
  'sidebar-mini':toggleSidebarMini,
  'theme':toggleTheme,
  'theme-set':(t)=>setTheme(t),
  'palette':openPalette,
  'set-color':(c)=>saveColToAccount(c)
});
Object.assign(INPUTS,{'color-preview':(_,el)=>setCol(el.value)});
Object.assign(CHANGES,{'color-save':(_,el)=>saveColToAccount(el.value)});
