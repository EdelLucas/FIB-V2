// FIB Personalabteilung · Basis-Helfer: Escaping, Dialoge, Toast, Validierung, Events

// ===================== SICHERE AUSGABE =====================
// ALLE Daten, die per innerHTML ausgegeben werden, laufen durch esc().
// Damit kann niemand über ein Eingabefeld HTML/JavaScript einschleusen.
const _ESC_MAP={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;'};
function esc(v){
  if(v===null||v===undefined)return'';
  return String(v).replace(/[&<>"'`]/g,c=>_ESC_MAP[c]);
}
// Mehrzeiligen Text sicher ausgeben (Zeilenumbrüche bleiben erhalten)
function escMultiline(v){return esc(v).replace(/\n/g,'<br>');}
// Nur http(s)-Links zulassen – verhindert javascript:-Links
function safeUrl(u){
  const s=String(u||'').trim();
  return /^https?:\/\//i.test(s)?s:'';
}
// Profilbilder: nur hochgeladene Bilder (data:image) oder https-Links
function safeImg(u){
  const s=String(u||'').trim();
  if(/^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=]+$/i.test(s))return s;
  if(/^https:\/\//i.test(s))return s;
  return'';
}

// ===================== IDs =====================
function uid(prefix){
  const r=(crypto.getRandomValues?Array.from(crypto.getRandomValues(new Uint8Array(6)),b=>b.toString(16).padStart(2,'0')).join(''):Math.random().toString(16).slice(2,14));
  return (prefix||'')+Date.now().toString(36)+r;
}
// Stabiler Schlüssel für Einträge – auch für alte Einträge ohne ID
function _hash(str){let h=5381;for(let i=0;i<str.length;i++)h=((h<<5)+h+str.charCodeAt(i))|0;return(h>>>0).toString(36);}
function itemKey(e){return e&&e.id?String(e.id):'h'+_hash(JSON.stringify(e,Object.keys(e||{}).sort()));}
function findByKey(list,key){return(list||[]).find(e=>itemKey(e)===key);}

// ===================== KLEINE HELFER =====================
const $=id=>document.getElementById(id);
function gv(id){const e=$(id);return e?e.value:'';}
function sv2(id,v){const e=$(id);if(e)e.value=v==null?'':v;}
function setOb(id,v){const e=$(id);if(e)e.textContent=v;}
function show(id,on){const e=typeof id==='string'?$(id):id;if(e)e.hidden=!on;}
function fmtD(raw){
  if(!raw)return'--';
  if(String(raw).includes('.'))return raw;
  const d=new Date(raw);
  if(isNaN(d))return'--';
  return[String(d.getDate()).padStart(2,'0'),String(d.getMonth()+1).padStart(2,'0'),d.getFullYear()].join('.');
}
function gd(){return fmtD(new Date().toISOString().slice(0,10));}
function nowStamp(){
  const n=new Date(),p=x=>String(x).padStart(2,'0');
  return`${p(n.getDate())}.${p(n.getMonth()+1)}.${n.getFullYear()} ${p(n.getHours())}:${p(n.getMinutes())}`;
}
function isoToDmy(v){return v?v.split('-').reverse().join('.'):'';}
function dmyToIso(str){if(!str)return'';return String(str).includes('.')?str.split('.').reverse().join('-'):str;}
function rankCls(r){const n=parseInt(r);if(n>=26)return'rh';if(n>=20)return'rm';return'rl';}
function clone(v){return v===undefined?v:JSON.parse(JSON.stringify(v));}
function copyText(txt,msg){
  return navigator.clipboard.writeText(txt)
    .then(()=>showToast(msg||'In Zwischenablage kopiert'))
    .catch(()=>showToast('Kopieren nicht möglich',{type:'err'}));
}
function cp(id){const e=$(id);if(e)copyText(e.textContent);}

// ===================== TOAST (mit optionalem "Rückgängig") =====================
let _toastTimer=null;
function showToast(msg,opts){
  opts=opts||{};
  const t=$('toast');if(!t)return;
  t.className='toast '+(opts.type||'ok');
  t.innerHTML=`<span>${esc(msg)}</span>`;
  if(opts.action){
    const b=document.createElement('button');
    b.type='button';b.className='toast-btn';b.textContent=opts.action.label;
    b.addEventListener('click',()=>{hideToast();opts.action.fn();});
    t.appendChild(b);
  }
  // Reflow, damit die Einblend-Animation neu startet
  void t.offsetWidth;
  t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer=setTimeout(hideToast,opts.duration||(opts.action?6000:2400));
}
function hideToast(){const t=$('toast');if(t)t.classList.remove('show');}

// ===================== DIALOGE (ersetzen alert/confirm/prompt) =====================
let _dlgResolve=null;
function _dlgOpen(o){
  return new Promise(resolve=>{
    if(_dlgResolve)_dlgResolve(o.input?null:false);
    _dlgResolve=resolve;
    $('dlg-title').textContent=o.title||'Bestätigen';
    $('dlg-msg').textContent=o.message||'';
    const inp=$('dlg-input');
    inp.hidden=!o.input;
    inp.type=o.inputType||'text';
    inp.value=o.value||'';
    inp.placeholder=o.placeholder||'';
    $('dlg-err').textContent='';
    const ok=$('dlg-ok');
    ok.textContent=o.okText||'OK';
    ok.className='btn '+(o.danger?'danger':'ok');
    $('dlg-cancel').hidden=!!o.alert;
    $('dlg').dataset.minlen=o.minLength||0;
    $('dlg').dataset.mode=o.input?'prompt':(o.alert?'alert':'confirm');
    $('dlg').classList.add('show');
    setTimeout(()=>(o.input?inp:ok).focus(),30);
  });
}
function _dlgClose(result){
  $('dlg').classList.remove('show');
  const r=_dlgResolve;_dlgResolve=null;
  if(r)r(result);
}
function _dlgSubmit(){
  const mode=$('dlg').dataset.mode;
  if(mode==='prompt'){
    const v=$('dlg-input').value;
    const min=parseInt($('dlg').dataset.minlen)||0;
    if(v.length<min){$('dlg-err').textContent=`Mindestens ${min} Zeichen.`;return;}
    _dlgClose(v);
  } else _dlgClose(true);
}
function _dlgCancel(){_dlgClose($('dlg').dataset.mode==='prompt'?null:false);}
function uiConfirm(message,o){return _dlgOpen({...(o||{}),message});}
function uiPrompt(message,o){return _dlgOpen({...(o||{}),message,input:true});}
function uiAlert(message,o){return _dlgOpen({title:'Hinweis',...(o||{}),message,alert:true});}

// ===================== FORMULAR-VALIDIERUNG =====================
// requireFields([['kl-orga','Orga wählen'],['kl-name','Name fehlt']]) -> true/false
function fieldError(id,msg){
  const el=$(id);if(!el)return;
  el.classList.add('invalid');
  let m=el.parentElement.querySelector(':scope > .field-err');
  if(!m){m=document.createElement('div');m.className='field-err';el.insertAdjacentElement('afterend',m);}
  m.textContent=msg;
}
function clearFieldError(el){
  if(!el||!el.classList)return;
  el.classList.remove('invalid');
  const m=el.parentElement&&el.parentElement.querySelector(':scope > .field-err');
  if(m)m.remove();
}
function requireFields(list){
  let ok=true,first=null;
  list.forEach(([id,msg])=>{
    clearFieldError($(id));
    if(!String(gv(id)).trim()){fieldError(id,msg||'Pflichtfeld');ok=false;if(!first)first=$(id);}
  });
  if(first)first.focus();
  return ok;
}
function clearForm(ids){ids.forEach(id=>{sv2(id,'');clearFieldError($(id));});}

// ===================== TABELLEN =====================
// Füllt eine Tabelle und setzt data-label je Zelle (für die Karten-Ansicht am Handy)
function fillTable(tbodyId,html,emptyId,isEmpty){
  const body=$(tbodyId);if(!body)return;
  body.innerHTML=html;
  if(emptyId)show(emptyId,!!isEmpty);
  const table=body.closest('table');
  const heads=table?Array.from(table.querySelectorAll('thead th')).map(th=>th.textContent.trim()):[];
  body.querySelectorAll('tr:not(.exp)').forEach(tr=>{
    Array.from(tr.children).forEach((td,i)=>{if(heads[i]&&!td.hasAttribute('data-label'))td.setAttribute('data-label',heads[i]);});
  });
}
function statusBadge(status){
  const col=STATUS_COLORS[status]||'var(--mu)';
  return`<span class="stamp" style="--c:${col}">${esc(status||'--')}</span>`;
}
function orgaBadge(orga){
  const col=ORGA_COLORS[orga]||'var(--mu)';
  return`<span class="orga-badge" style="--c:${col}">${esc(orga||'--')}</span>`;
}

// ===================== EVENT-DELEGATION =====================
// Statt onclick="..." im HTML: data-action="name" (+ data-arg).
// Jedes Modul registriert seine Funktionen in ACTIONS.
const ACTIONS={};
const INPUTS={};   // data-input  -> bei jeder Eingabe
const CHANGES={};  // data-change -> bei Änderung (select, date, color ...)
function _run(map,name,el,e){
  const fn=map[name];
  if(!fn){console.warn('Keine Aktion registriert:',name);return;}
  try{
    const r=fn(el.dataset.arg,el,e);
    if(r&&typeof r.catch==='function')r.catch(err=>{console.error(err);showToast('Fehler: '+(err.message||err),{type:'err'});});
  }catch(err){console.error(err);showToast('Fehler: '+(err.message||err),{type:'err'});}
}
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-action]');
  if(!el||el.disabled)return;
  if(el.tagName==='A'&&!el.getAttribute('href'))e.preventDefault();
  _run(ACTIONS,el.dataset.action,el,e);
});
document.addEventListener('input',e=>{
  clearFieldError(e.target);
  const el=e.target.closest('[data-input]');
  if(el)_run(INPUTS,el.dataset.input,el,e);
});
document.addEventListener('change',e=>{
  clearFieldError(e.target);
  const el=e.target.closest('[data-change]');
  if(el)_run(CHANGES,el.dataset.change,el,e);
});
document.addEventListener('keydown',e=>{
  if(e.key==='Enter'){
    const el=e.target.closest('[data-enter]');
    if(el&&el.tagName!=='TEXTAREA'){e.preventDefault();_run(ACTIONS,el.dataset.enter,el,e);}
    if($('dlg').classList.contains('show')&&e.target.id==='dlg-input'){e.preventDefault();_dlgSubmit();}
  }
  if(e.key==='Escape'){
    if($('dlg').classList.contains('show')){_dlgCancel();return;}
    const open=document.querySelector('.modal-bg.show');
    if(open){open.classList.remove('show');return;}
    if(typeof toggleSidebar==='function')toggleSidebar(false);
  }
});
// Formulare nie wirklich absenden (alles läuft über data-action)
document.addEventListener('submit',e=>e.preventDefault());
// Klick auf den abgedunkelten Hintergrund schließt ein Fenster
document.addEventListener('mousedown',e=>{
  if(e.target.classList&&e.target.classList.contains('modal-bg')){
    if(e.target.id==='dlg')_dlgCancel();
    else e.target.classList.remove('show');
  }
});
Object.assign(ACTIONS,{
  'dlg-ok':_dlgSubmit,
  'dlg-cancel':_dlgCancel,
  'close-modal':(id)=>{const m=$(id);if(m)m.classList.remove('show');},
  'copy':(id)=>cp(id)
});
function openModal(id){const m=$(id);if(m)m.classList.add('show');}
function closeModalById(id){const m=$(id);if(m)m.classList.remove('show');}

// ===================== WIEDERKEHRENDE HTML-BLÖCKE =====================
// Werden einmal beim Laden aus Platzhaltern erzeugt, statt sie 5–6x zu kopieren.
function _options(list,placeholder){
  return(placeholder!=null?`<option value="">${esc(placeholder)}</option>`:'')+list.map(v=>`<option>${esc(v)}</option>`).join('');
}
function buildTemplates(){
  // <select data-options="orgas|ranks|case-status|law-status" data-placeholder="...">
  document.querySelectorAll('select[data-options]').forEach(s=>{
    const src={orgas:ORGAS,ranks:RANKS,'case-status':CASE_STATUS,'law-status':LAW_STATUS}[s.dataset.options]||[];
    const ph=s.hasAttribute('data-placeholder')?s.dataset.placeholder:null;
    s.innerHTML=_options(src,ph);
  });

  // Pass-ID-Suche der HR-Module: <div data-lookup="ra"></div>
  document.querySelectorAll('[data-lookup]').forEach(box=>{
    const p=box.dataset.lookup;
    box.className='lookup';
    box.innerHTML=`<label class="fl" for="${p}-pass-in">Reisepassnummer oder Name</label>
      <div class="lookup-row">
        <div class="sw"><i class="ti ti-search"></i>
          <input class="fi si" id="${p}-pass-in" placeholder="Pass-ID oder Name …" autocomplete="off" data-input="lookup" data-arg="${p}">
        </div>
        <div id="${p}-found" class="lookup-found"></div>
      </div>`;
  });

  // Mitgliederliste einer Abteilung: <div data-members="fibco"></div>
  document.querySelectorAll('[data-members]').forEach(box=>{
    const p=box.dataset.members;
    box.innerHTML=`<div class="pan">
      <div class="pan-h">
        <div class="pan-t">Mitglieder der Abteilung</div>
        <div class="pan-tools">
          <button class="btn sm" id="dm-${p}-toggle" data-action="dept-toggle-all" data-arg="${p}">Alle Mitarbeiter anzeigen</button>
          <span class="count" id="dm-${p}-count"></span>
        </div>
      </div>
      <div class="tbl-wrap"><table class="tbl cards">
        <thead><tr><th>Pass-ID</th><th>Name</th><th>Rang</th><th>DN</th><th>Abteilungen</th></tr></thead>
        <tbody id="dm-${p}-body"></tbody>
      </table></div>
      <div id="dm-${p}-empty" class="empty" hidden>Keine Mitglieder gefunden.</div>
    </div>`;
  });

  // Orga-Tabs der Klassifizierung
  const tabs=$('kl-orga-tabs');
  if(tabs)tabs.innerHTML=['Alle',...ORGAS].map((o,i)=>`<button type="button" class="orga-tab${i===0?' act':''}" data-orga="${o}" data-action="kl-switch" data-arg="${o}">${o}</button>`).join('');

  // Rollen-Auswahl im Account-Formular
  const roleBox=$('ue-roles');
  if(roleBox)roleBox.innerHTML=ROLES.map(([v,l])=>`<label class="role-chip"><input type="checkbox" value="${v}" class="ue-role"> ${esc(l)}</label>`).join('');
}
