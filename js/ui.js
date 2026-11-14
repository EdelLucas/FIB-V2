// FIB Personalabteilung · UI-Utilities, Navigation, Akzentfarbe, Uhr
// ===================== UTILS =====================
function animateCount(el,target){
  if(!el)return;
  target=parseInt(target)||0;
  const start=parseInt(el.textContent)||0;
  if(start===target){el.textContent=target;return;}
  const dur=600,t0=performance.now();
  function step(now){
    const p=Math.min(1,(now-t0)/dur);
    el.textContent=Math.round(start+(target-start)*p);
    if(p<1) requestAnimationFrame(step); else el.textContent=target;
  }
  requestAnimationFrame(step);
}
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200);}
function cp(id){const e=document.getElementById(id);if(!e)return;navigator.clipboard.writeText(e.textContent).then(()=>showToast('In Zwischenablage kopiert')).catch(()=>{});}
function sv(name,el){
  const target=document.querySelector(`.ni[onclick*="'${name}'"]`);
  if(target && target.hasAttribute('data-roles') && !hasRole(target.getAttribute('data-roles'))){
    showToast('Kein Zugriff auf dieses Modul');
    return;
  }
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('act'));
  document.querySelectorAll('.ni').forEach(n=>n.classList.remove('act'));
  const vEl=document.getElementById('v-'+name);if(vEl)vEl.classList.add('act');
  if(el&&el.classList&&el.classList.contains('ni'))el.classList.add('act');
  else document.querySelectorAll('.ni').forEach(n=>{if((n.getAttribute('onclick')||'').includes("'"+name+"'"))n.classList.add('act');});
  toggleSidebar(false);
  const mainEl=document.querySelector('.main');if(mainEl)mainEl.scrollTop=0;
  if(name==='ma')filterMA();
  if(name==='kl')klRender();
  if(name==='profil')renderMyProfile();
  if(name==='benutzer')renderUserList();
  if(name==='fibco'){resetDeptTabs('fibco');renderDeptMembers('fibco','FIBCO');}
  if(name==='cid'){resetDeptTabs('cid');renderDeptMembers('cid','CID');}
  if(name==='td'){resetDeptTabs('td');renderDeptMembers('td','TD');}
  if(name==='cirg'){resetDeptTabs('cirg');cirgRenderEvents();cirgFillEventSelects();cirgRenderLogs();renderDeptMembers('cirg','CIRG');}
  if(name==='law'){resetDeptTabs('law');lawRender();renderDeptMembers('law','LAW');}
}
// Wechselt zwischen den Reitern innerhalb einer Abteilungs-Seite (z.B. Fallakte / Mitglieder)
function deptTabSwitch(view, tab, btn){
  document.querySelectorAll('#v-'+view+' .dept-tab').forEach(b=>b.classList.remove('act'));
  if(btn) btn.classList.add('act');
  document.querySelectorAll('#v-'+view+' .dept-tabpanel').forEach(p=>p.style.display='none');
  const target=document.getElementById(view+'-tab-'+tab);
  if(target) target.style.display = (tab==='members') ? 'block' : 'flex';
  if(tab==='members'){
    const codeMap={fibco:'FIBCO',cid:'CID',td:'TD',cirg:'CIRG',law:'LAW'};
    renderDeptMembers(view, codeMap[view]);
  }
  if(view==='cirg'&&tab==='logs') cirgRenderLogs();
}
// Setzt eine Abteilungs-Seite beim Verlassen/Wiederbetreten auf den ersten Reiter zurueck
function resetDeptTabs(view){
  const firstTab=document.querySelector('#v-'+view+' .dept-tab');
  if(firstTab) deptTabSwitch(view,'main',firstTab);
}
// Springt von der Sidebar direkt in den "Mitglieder"-Reiter einer Abteilungs-Seite
function goToDeptMembers(view, btn){
  sv(view, btn);
  const membersBtn=document.querySelector('#v-'+view+' .dept-tab[onclick*="\'members\'"]');
  if(membersBtn) deptTabSwitch(view,'members',membersBtn);
}
function setCol(h){
  document.documentElement.style.setProperty('--g',h);
  const r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);
  document.documentElement.style.setProperty('--gd',`rgba(${r},${g},${b},0.4)`);
  document.documentElement.style.setProperty('--gg',`rgba(${r},${g},${b},0.12)`);
  const el=document.getElementById('colhex');if(el)el.textContent=h;
  try{localStorage.setItem('fib_color',h);}catch(e){}
}
async function saveColToAccount(h){
  if(!currentUser)return;
  const msgEl=document.getElementById('colsave-msg');
  try{
    await saveProfile(currentUser,{themeColor:h});
    currentProfile.themeColor=h;
    if(msgEl){msgEl.textContent='Gespeichert';setTimeout(()=>{msgEl.textContent='';},1800);}
  }catch(e){
    console.error('saveColToAccount error',e);
    if(msgEl)msgEl.textContent='Fehler beim Speichern';
  }
}
function tick(){
  const t=new Date(),s=[t.getHours(),t.getMinutes(),t.getSeconds()].map(n=>String(n).padStart(2,'0')).join(':');
  ['clk','bclk'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=s;});
}


// ===================== DASHBOARD =====================
// Abteilungsübersicht live aus dem Mitarbeiterverzeichnis berechnen
const DASH_DEPTS=[
  ['CIRG','Critical Incident Response Group'],
  ['CID','Criminal Investigative Division'],
  ['FIBCO','Corruption Office'],
  ['HR','Human Resources'],
  ['PR','Public Relations'],
  ['TD','Training Division'],
  ['IA','Internal Affairs'],
  ['LAW','LAW Department']
];
function renderDashboard(){
  const body=document.getElementById('dash-depts');
  const total=MA.length||1;
  if(body){
    const rows=DASH_DEPTS.map(([code,label])=>({code,label,n:deptMembers(code).length}))
      .sort((a,b)=>b.n-a.n);
    body.innerHTML=rows.map(r=>{
      const pct=r.n/total*100;
      const pctTxt=r.n&&pct<1?'< 1 %':Math.round(pct)+' %';
      return `<tr><td>${r.label} <span class="muted">(${r.code})</span></td><td class="num">${r.n}</td>
        <td><div class="bar"><span style="width:${Math.min(100,pct).toFixed(1)}%"></span></div><span class="bar-lbl">${pctTxt}</span></td></tr>`;
    }).join('');
  }
  const lead=document.getElementById('dash-lead');
  if(lead) lead.textContent=MA.filter(m=>parseInt(m.rank)>=28).length;
  const dep=document.getElementById('dash-depcount');
  if(dep) dep.textContent=DASH_DEPTS.length;
}

// ===================== MOBILE SIDEBAR =====================
function toggleSidebar(force){
  const open=typeof force==='boolean'?force:!document.body.classList.contains('sb-open');
  document.body.classList.toggle('sb-open',open);
}
document.addEventListener('keydown',e=>{
  if(e.key!=='Escape')return;
  toggleSidebar(false);
  document.querySelectorAll('.modal-bg.show').forEach(m=>m.classList.remove('show'));
});
