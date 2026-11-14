// FIB Personalabteilung · Mitarbeiterverzeichnis, Pass-Suche, Abteilungsmitglieder, Dashboard
//
// Quelle des Verzeichnisses ist ausschließlich das Google Sheet (siehe store.js).
// Änderungen an Personen werden im Sheet gemacht – hier wird nur angezeigt, sortiert
// und gesucht. Die manuelle Reihenfolge (Drag & Drop) wird in der Cloud gespeichert.

let MA=DEF.map(m=>({...m}));
let filtered=[...MA];
let maPage=1;
const PER=15;

// ===================== VERZEICHNIS =====================
function buildMA(){
  const start=(maPage-1)*PER;
  const page=filtered.slice(start,start+PER);
  const html=page.map(m=>{
    const trains=mergeTrainings(m.trainings,m.id);
    const passCount=trains.filter(t=>t.passed).length;
    const rowId='ma-exp-'+_hash(String(m.id));
    return`<tr draggable="true" data-mid="${esc(m.id)}" class="drag-row">
      <td class="mono muted"><span class="grip" title="Ziehen zum Sortieren">⠿</span>${esc(m.id)}</td>
      <td class="strong"><button type="button" class="name-link" data-action="person" data-arg="${esc(m.id)}">${esc(m.name)}</button></td>
      <td><span class="rb ${rankCls(m.rank)}">${esc(m.rank||'--')}</span></td>
      <td class="accent">${esc(m.dn||'--')}</td>
      <td class="muted small">${esc(m.div||'--')}</td>
      <td class="muted small clip" title="${esc(m.abt)}">${esc(m.abt||'--')}</td>
      <td>${trains.length?`<button type="button" class="link-btn" data-action="toggle-row" data-arg="${rowId}">${passCount}/${trains.length} bestanden</button>`:'--'}</td>
      <td class="${m.strike&&m.strike!=='0/3'?'err-text':'ok-text'}">${esc(m.strike||'0/3')}</td>
      <td class="muted small nowrap">${esc(m.date||'--')}</td>
    </tr>
    <tr id="${rowId}" class="exp" hidden><td colspan="9">
      <div class="exp-title">Ausbildungen — ${esc(m.name)}</div>
      <div class="chips">${trains.map(t=>trainBadge(t,esc(t.name))).join('')||'<span class="muted">Keine Ausbildungen hinterlegt.</span>'}</div>
    </td></tr>`;
  }).join('');
  fillTable('ma-body',html,'ma-empty',!filtered.length);
  const cnt=$('ma-count');
  if(cnt)cnt.textContent=filtered.length?`${start+1}–${Math.min(start+PER,filtered.length)} von ${filtered.length}`:'0';
  setOb('ma-badge',MA.length+' AGENTEN');
  buildPgr();
  initDragSort('#ma-body .drag-row','mid',onMaDrop);
}
function buildPgr(){
  const total=Math.ceil(filtered.length/PER),pgr=$('ma-pgr');if(!pgr)return;
  if(total<=1){pgr.innerHTML='';return;}
  const btn=(p,label,cur)=>`<button type="button" class="${cur?'cur':''}" data-action="ma-page" data-arg="${p}"${p<1||p>total?' disabled':''}>${label}</button>`;
  let h=btn(maPage-1,'‹');
  for(let i=1;i<=total;i++)h+=btn(i,i,i===maPage);
  pgr.innerHTML=h+btn(maPage+1,'›');
}
function maGo(p){const t=Math.ceil(filtered.length/PER)||1;maPage=Math.max(1,Math.min(+p,t));buildMA();}
function filterMA(keepPage){
  const q=gv('ma-search').toLowerCase().trim(),f=gv('ma-filter');
  filtered=MA.filter(m=>{
    const hay=[m.name,m.id,m.rank,m.abt,m.dn].join(' ').toLowerCase();
    return(!q||hay.includes(q))&&(!f||m.div===f);
  });
  if(!keepPage)maPage=1;
  buildMA();
}
// Nach Sheet-Sync oder TD-Änderung alles Abhängige neu zeichnen
function refreshDirectory(){
  filterMA(true);
  Object.keys(DEPTS).forEach(renderDeptMembers);
  renderDashboard();
  setOb('cfg-count',MA.length);
  if($('v-td').classList.contains('act'))tdRenderList();
}

// Reihenfolge aus der Cloud anwenden; unbekannte IDs (neu im Sheet) hinten anhängen
function applyMaOrder(){
  const order=DB.maOrder||[];
  if(!order.length)return;
  const pos=new Map(order.map((id,i)=>[String(id),i]));
  MA=MA.map((m,i)=>({m,i})).sort((a,b)=>{
    const pa=pos.has(a.m.id)?pos.get(a.m.id):1e6+a.i, pb=pos.has(b.m.id)?pos.get(b.m.id):1e6+b.i;
    return pa-pb;
  }).map(x=>x.m);
}
function onMaDrop(fromId,toId,after){
  const ids=MA.map(m=>String(m.id));
  const from=ids.indexOf(fromId);if(from<0)return;
  ids.splice(from,1);
  let to=ids.indexOf(toId);if(to<0)return;
  ids.splice(after?to+1:to,0,fromId);
  // sofort lokal anzeigen, dann speichern
  const byId=new Map(MA.map(m=>[String(m.id),m]));
  MA=ids.map(id=>byId.get(id));
  filterMA(true);
  cloudMutate('maOrder',()=>ids).then(()=>showToast('Reihenfolge gespeichert')).catch(()=>{});
}

// Wiederverwendbares Drag & Drop für Tabellenzeilen (Verzeichnis + Klassifizierung)
function initDragSort(selector,dataKey,onDrop){
  const rows=document.querySelectorAll(selector);
  let src=null;
  const clear=()=>rows.forEach(r=>r.classList.remove('drop-before','drop-after'));
  rows.forEach(row=>{
    row.addEventListener('dragstart',e=>{src=row;row.classList.add('dragging');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',row.dataset[dataKey]);});
    row.addEventListener('dragend',()=>{row.classList.remove('dragging');clear();});
    row.addEventListener('dragover',e=>{
      e.preventDefault();clear();
      const r=row.getBoundingClientRect();
      row.classList.add(e.clientY<r.top+r.height/2?'drop-before':'drop-after');
    });
    row.addEventListener('dragleave',()=>row.classList.remove('drop-before','drop-after'));
    row.addEventListener('drop',e=>{
      e.preventDefault();clear();
      if(src===row)return;
      const r=row.getBoundingClientRect();
      onDrop(e.dataTransfer.getData('text/plain'),row.dataset[dataKey],e.clientY>=r.top+r.height/2);
    });
  });
}

// ===================== PASS-SUCHE (HR-Module) =====================
// Welche Felder je Modul aus dem Verzeichnis befüllt werden
const LOOKUP_FILL={
  ra:m=>{sv2('ra-name',m.name);sv2('ra-dn',m.dn);sv2('ra-abt',m.abt);sv2('ra-strike',m.strike||'0/3');sv2('ra-old',m.rank);const i=RANKS.indexOf(m.rank);sv2('ra-new',i>0?RANKS[i-1]:'');},
  es:m=>{sv2('es-name',m.name);sv2('es-dn',m.dn);},
  ku:m=>{sv2('ku-name',m.name);sv2('ku-dn',m.dn);sv2('ku-rang',m.rank);sv2('ku-abt',m.abt);},
  az:m=>{sv2('az-name',m.name);sv2('az-pass',m.id);sv2('az-rang',m.rank);sv2('az-abt',m.abt);},
  sa:m=>{sv2('sa-name',m.name);sv2('sa-dn',m.dn);sv2('sa-rang',m.rank);sv2('sa-strike',m.strike||'0/3');},
  pa:m=>{sv2('pa-name',m.name);sv2('pa-dn',m.dn);sv2('pa-rang',m.rank);sv2('pa-abt',m.abt==='--'?'':m.abt);sv2('pa-strike',m.strike||'0/3');sv2('pa-datum',dmyToIso(m.date));}
};
function findPerson(val){
  if(!val)return{m:null,hits:0};
  const exact=MA.find(x=>x.id===val);
  if(exact)return{m:exact,hits:1};
  const q=val.toLowerCase();
  const hits=MA.filter(x=>x.name.toLowerCase().includes(q));
  return{m:hits.length===1?hits[0]:null,hits:hits.length};
}
function lookupPass(pfx){
  const val=gv(pfx+'-pass-in').trim();
  const found=$(pfx+'-found');
  const {m,hits}=findPerson(val);
  show(pfx+'-fields',!!m);
  show(pfx+'-hint',!m);
  if(!val){found.innerHTML='';return;}
  if(!m){
    found.innerHTML=hits>1
      ?`<span class="accent"><i class="ti ti-list-search"></i> ${hits} Treffer – genauer eingeben</span>`
      :'<span class="err-text"><i class="ti ti-x"></i> Kein Treffer</span>';
    return;
  }
  found.innerHTML=`<span class="ok-text"><i class="ti ti-check"></i> <b>${esc(m.name)}</b> · ${esc(m.rank)}</span>`;
  LOOKUP_FILL[pfx](m);
  updatePreview(pfx);
}

// ===================== ABTEILUNGS-MITGLIEDER =====================
const DEPT_SHOW_ALL={};
function deptMembers(code){
  const re=new RegExp('\\b'+code.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b','i');
  return MA.filter(m=>m.abt&&re.test(m.abt));
}
function renderDeptMembers(prefix){
  if(!$('dm-'+prefix+'-body'))return;
  const all=!!DEPT_SHOW_ALL[prefix];
  setOb('dm-'+prefix+'-toggle',all?'Nur Abteilung anzeigen':'Alle Mitarbeiter anzeigen');
  const list=all?MA:deptMembers(DEPTS[prefix]);
  setOb('dm-'+prefix+'-count',list.length+(all?' Mitarbeiter':' Mitglieder'));
  fillTable('dm-'+prefix+'-body',list.map(m=>`<tr>
    <td class="mono muted">${esc(m.id)}</td>
    <td class="strong"><button type="button" class="name-link" data-action="person" data-arg="${esc(m.id)}">${esc(m.name)}</button></td>
    <td><span class="rb ${rankCls(m.rank)}">${esc(m.rank||'--')}</span></td>
    <td class="accent">${esc(m.dn||'--')}</td>
    <td class="muted small">${esc(m.abt||'--')}</td>
  </tr>`).join(''),'dm-'+prefix+'-empty',!list.length);
}

// ===================== DASHBOARD =====================
function renderDashboard(){
  const total=MA.length||1;
  // Abteilungen als Balken
  const rows=DASH_DEPTS.map(([code,label])=>({code,label,n:deptMembers(code).length})).sort((a,b)=>b.n-a.n);
  const max=Math.max(1,...rows.map(r=>r.n));
  const box=$('dash-depts');
  if(box)box.innerHTML=rows.map(r=>`<div class="dept-bar">
      <div class="dept-bar-label"><span class="strong">${esc(r.code)}</span><span class="muted small">${esc(r.label)}</span></div>
      <div class="dept-bar-track"><span style="width:${(r.n/max*100).toFixed(1)}%"></span></div>
      <div class="dept-bar-val mono">${r.n}<span class="muted small"> · ${r.n&&r.n/total<.01?'<1':Math.round(r.n/total*100)}%</span></div>
    </div>`).join('');
  // Kennzahlen
  animateCount($('dash-count'),MA.length);
  animateCount($('dash-lead'),MA.filter(m=>parseInt(m.rank)>=28).length);
  animateCount($('dash-strikes'),MA.filter(m=>m.strike&&m.strike!=='0/3').length);
  let passed=0,all=0;
  MA.forEach(m=>{const t=mergeTrainings(m.trainings,m.id);all+=t.length;passed+=t.filter(x=>x.passed).length;});
  setOb('dash-train',all?Math.round(passed/all*100)+' %':'–');
  // Begrüßung
  const h=new Date().getHours();
  setOb('dash-greet',h<11?'Guten Morgen':h<18?'Guten Tag':'Guten Abend');
  setOb('dash-date',new Date().toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long',year:'numeric'}));
  renderActivity();
}
// Letzte Änderungen aus den Cloud-Bereichen, die der Nutzer lesen darf
const AREA_LABELS={kl:['Klassifizierung','ti-shield-lock','kl'],maOrder:['Verzeichnis-Reihenfolge','ti-arrows-sort','ma'],extraTrainings:['TD-Ausbildungen','ti-school','td'],tpls:['HR-Vorlagen','ti-template','tpl'],fc:['FIBCO Fallakten','ti-folder-open','fibco'],cid:['CID Beweise','ti-microscope','cid'],cirgEvents:['CIRG Events','ti-calendar-event','cirg'],cirgLogs:['CIRG Logs','ti-notes','cirg'],lawCases:['LAW Akten','ti-scale','law']};
function renderActivity(){
  const box=$('dash-activity');if(!box)return;
  const items=(typeof storeActivity==='function'?storeActivity():[]).slice(0,6);
  if(!items.length){box.innerHTML='<li class="empty">Noch keine Änderungen.</li>';return;}
  box.innerHTML=items.map(a=>{
    const [label,icon,view]=AREA_LABELS[a.key]||[a.key,'ti-point','dash'];
    return`<li><button type="button" class="activity-item" data-action="nav" data-arg="${view}">
      <span class="activity-icon"><i class="ti ${icon}"></i></span>
      <span class="activity-text"><span class="strong">${esc(label)}</span><span class="muted small">${a.by?'von '+esc(a.by)+' · ':''}${esc(timeAgo(a.at))}</span></span>
    </button></li>`;
  }).join('');
}
function animateCount(el,target){
  if(!el)return;
  target=parseInt(target)||0;
  const start=parseInt(el.textContent)||0;
  if(start===target||matchMedia('(prefers-reduced-motion: reduce)').matches){el.textContent=target;return;}
  const t0=performance.now();
  const step=now=>{const p=Math.min(1,(now-t0)/600);el.textContent=Math.round(start+(target-start)*p);if(p<1)requestAnimationFrame(step);};
  requestAnimationFrame(step);
}

Object.assign(ACTIONS,{
  'ma-page':maGo,
  'toggle-row':(id)=>{const r=$(id);if(r)r.hidden=!r.hidden;},
  'person':(id)=>openPerson(id),
  'dept-toggle-all':(p)=>{DEPT_SHOW_ALL[p]=!DEPT_SHOW_ALL[p];renderDeptMembers(p);},
  'open-sheet':()=>window.open(SHEET_URL,'_blank','noopener')
});
Object.assign(INPUTS,{'ma-filter':()=>filterMA(),'lookup':lookupPass});
Object.assign(CHANGES,{'ma-filter':()=>filterMA()});
onStore('maOrder',()=>{applyMaOrder();filterMA(true);});
onStore('extraTrainings',()=>refreshDirectory());

// ===================== PERSONENKARTE =====================
function openPerson(id){
  const m=MA.find(x=>String(x.id)===String(id));if(!m)return;
  const trains=mergeTrainings(m.trainings,m.id);
  const pass=trains.filter(t=>t.passed).length;
  const hrBtns=hasRole('hr')?`<div class="brow">
      <button class="btn sm" data-action="person-start" data-arg="ra" data-id="${esc(m.id)}"><i class="ti ti-award"></i> Ranganpassung</button>
      <button class="btn sm" data-action="person-start" data-arg="sa" data-id="${esc(m.id)}"><i class="ti ti-gavel"></i> Sanktion</button>
      <button class="btn sm" data-action="person-start" data-arg="pa" data-id="${esc(m.id)}"><i class="ti ti-id-badge"></i> Personalakte</button>
      <button class="btn sm danger" data-action="person-start" data-arg="ku" data-id="${esc(m.id)}"><i class="ti ti-user-minus"></i> Kündigung</button>
    </div>`:'';
  $('person-body').innerHTML=`
    <div class="person-head">
      ${avatarHtml(m.name,'','xl')}
      <div>
        <div class="profile-header-name">${esc(m.name)}</div>
        <div class="person-tags"><span class="rb ${rankCls(m.rank)}">${esc(m.rank||'--')}</span>${m.div?`<span class="role-tag">${esc(m.div)}</span>`:''}</div>
      </div>
    </div>
    <dl class="kv">
      <dt>Pass-ID</dt><dd class="mono">${esc(m.id)}</dd>
      <dt>Dienstnummer</dt><dd class="mono">${esc(m.dn||'--')}</dd>
      <dt>Abteilung</dt><dd>${esc(m.abt||'--')}</dd>
      <dt>Strike</dt><dd class="${m.strike&&m.strike!=='0/3'?'err-text':'ok-text'}">${esc(m.strike||'0/3')}</dd>
      <dt>Eintritt</dt><dd>${esc(m.date||'--')}</dd>
      <dt>Letzte Beförderung</dt><dd>${esc(m.lastPromo||'--')}</dd>
    </dl>
    <h3 class="form-section">Ausbildungen <span class="muted small">${pass}/${trains.length} bestanden</span></h3>
    <div class="chips">${trains.map(t=>trainBadge(t,esc(t.name))).join('')||'<span class="muted">Keine Ausbildungen hinterlegt.</span>'}</div>
    ${hrBtns}`;
  openModal('person-modal');
}
ACTIONS['person-start']=(pfx,el)=>{
  const view={ra:'rang',sa:'san',pa:'pa',ku:'kue'}[pfx];
  closeModalById('person-modal');
  sv(view);
  sv2(pfx+'-pass-in',el.dataset.id);
  lookupPass(pfx);
};
