// FIB Personalabteilung · Navigation, Reiter, Akzentfarbe, Uhr, Mobil-Menü

// Beim Öffnen einer Ansicht: was neu gezeichnet werden soll
const VIEW_ENTER={
  ma:()=>filterMA(true),
  kl:klRender,
  profil:renderMyProfile,
  benutzer:renderUserList,
  tpl:()=>showTplTab(curTplKey),
  cfg:()=>{renderTdCorrections();renderMigrationStatus();},
  fibco:()=>{fcRender();fcPreview();},
  cid:cidRender,
  td:tdRenderList,
  cirg:()=>{cirgRenderEvents();cirgRenderLogs();},
  law:lawRender
};

function sv(name){
  const nav=document.querySelector(`.ni[data-view="${name}"]`);
  const view=$('v-'+name);
  if(!view)return;
  const need=view.dataset.roles||(nav&&nav.dataset.roles);
  if(need&&!hasRole(need)){showToast('Kein Zugriff auf dieses Modul',{type:'err'});return;}
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('act',v===view));
  document.querySelectorAll('.ni').forEach(n=>{
    const on=n.dataset.view===name&&!n.dataset.tab;
    n.classList.toggle('act',on);
    if(on)n.setAttribute('aria-current','page');else n.removeAttribute('aria-current');
  });
  toggleSidebar(false);
  const main=document.querySelector('.main');if(main)main.scrollTop=0;
  if(DEPTS[name])deptTabSwitch(name,'main');
  if(VIEW_ENTER[name])VIEW_ENTER[name]();
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
  document.querySelectorAll('.ni').forEach(n=>n.classList.toggle('act',n===el));
}

// ---------- Akzentfarbe ----------
function setCol(h){
  if(!/^#[0-9a-f]{6}$/i.test(h||''))return;
  const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);
  const root=document.documentElement.style;
  root.setProperty('--g',h);
  root.setProperty('--gd',`rgba(${r},${g},${b},0.4)`);
  root.setProperty('--gg',`rgba(${r},${g},${b},0.12)`);
  // Lesbare Schrift auf gefüllten Buttons (hell auf dunkel / dunkel auf hell)
  root.setProperty('--on-g',(r*299+g*587+b*114)/1000>160?'#0b0c0f':'#ffffff');
  setOb('colhex',h);
  sv2('colpick',h);
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
  const presets=[['#4a90e2','Blau'],['#14b8a6','Teal'],['#a855f7','Violett'],['#f59e0b','Amber'],['#f43f5e','Rot'],['#22c55e','Grün']];
  box.innerHTML=presets.map(([c,l])=>`<button type="button" class="swatch" style="--c:${c}" data-action="set-color" data-arg="${c}" title="${l}"><span></span>${l}</button>`).join('');
}

// ---------- Uhr ----------
function tick(){
  const s=new Date().toTimeString().slice(0,8);
  setOb('clk',s);setOb('bclk',s);
}

// ---------- Mobil-Menü ----------
function toggleSidebar(force){
  const open=typeof force==='boolean'?force:!document.body.classList.contains('sb-open');
  document.body.classList.toggle('sb-open',open);
  const t=document.querySelector('.sb-toggle');if(t)t.setAttribute('aria-expanded',open);
}

Object.assign(ACTIONS,{
  'nav':(name)=>sv(name),
  'nav-members':(view,el)=>goToDeptMembers(view,el),
  'dept-tab':(arg)=>{const [view,tab]=arg.split(':');deptTabSwitch(view,tab);},
  'sidebar':()=>toggleSidebar(),
  'sidebar-close':()=>toggleSidebar(false),
  'set-color':(c)=>saveColToAccount(c)
});
Object.assign(INPUTS,{'color-preview':(_,el)=>setCol(el.value)});
Object.assign(CHANGES,{'color-save':(_,el)=>saveColToAccount(el.value)});
