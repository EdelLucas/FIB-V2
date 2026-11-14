// FIB Personalabteilung · HR-Module: Nachrichten-Generatoren + Vorlagen-Editor
//
// Die Vorlagen liegen jetzt in der Cloud (fib_data/tpls) und gelten für die ganze HR.
// Das Absender-Profil (Name/Rang/Abteilung) bleibt persönlich im Browser gespeichert.

const TPL_DEFAULTS={
  rang:`-# Ranganpassung . FIB Personalabteilung\n\n**Mitarbeiter:** {dn} | {name}\n**Von:** {alter_rang}\n**Nach:** {neuer_rang}\n**Datum:** {datum}\n**Begründung:** {grund}{absender}`,
  ein: `-# Einstellung . FIB Personalabteilung\n\n**Dienstnummer:** {dn}\n**Name:** {name}\n**Rang:** {rang}\n**Abteilung:** @{abteilung}\n**Einstellungsdatum:** {datum}\n\nWillkommen im Federal Investigation Bureau!{absender}`,
  kue: `-# Kündigung . FIB Personalabteilung\n\n**Mitarbeiter:** {dn} | {name}\n**Rang:** {rang}\n**Datum:** {datum}\n**Grund:** {grund}\n\nDer Mitarbeiter wird mit sofortiger Wirkung aus dem Dienst entlassen.{absender}`,
  az:  `Das Federal Investigation Bureau (FIB),\nübermittelt hiermit das Arbeitszeugnis von:\n\n**Vor- u. Nachname:** {name}\n**Reisepassnr.:** {pass}\n**Rang:** {rang}\n**Datum der Kündigung:** {datum}\n\n(Arbeitszeugnis wird als Anhang beigefügt){absender}`,
  san: `-# Sanktion . FIB Personalabteilung\n\n**Mitarbeiter:** {dn} | {name}\n**Sanktionsart:** {sanktion}\n**Datum:** {datum}\n**Begründung:** {grund}{absender}`,
  pa:  `-# Personalakte . FIB\n\n**Dienstnummer:** {dn}\n**Name:** {name}\n**Rang:** {rang}\n**Abteilung:** {abteilung}\n**Eintrittsdatum:** {eintritt}\n**Strike:** {strike}\n**Status:** Aktiv{absender}`
};
const TPL_LABELS={rang:'Ranganpassung',ein:'Einstellung',kue:'Kündigung',az:'AZ-System',san:'Sanktion',pa:'Personalakte'};
const TPL_VARS=[
  ['dn','Dienstnummer'],['name','Name'],['rang','Rang'],['datum','Heutiges Datum'],['grund','Begründung'],
  ['abteilung','Abteilung'],['alter_rang','Alter Rang'],['neuer_rang','Neuer Rang'],['pass','Reisepassnr.'],
  ['absender','Absender-Zeile'],['sanktion','Sanktionsart'],['eintritt','Eintrittsdatum'],['strike','Strike']
];
const TPL_SAMPLE={dn:'42',name:'Max Mustermann',rang:'17. Commander',alter_rang:'16. Lieutenant Commander',neuer_rang:'17. Commander',grund:'Herausragende Leistungen im Dienst',abteilung:'Human Resources',pass:'99999',sanktion:'Schriftliche Verwarnung',strike:'0/3'};

// Generator je Modul: Vorlage + Variablen aus den Formularfeldern
const GENERATORS={
  ra:{tpl:'rang',vars:()=>({dn:gv('ra-dn')||'XX',name:gv('ra-name')||'Name',alter_rang:gv('ra-old')||'Alter Rang',neuer_rang:gv('ra-new')||'Neuer Rang',rang:gv('ra-old')||'--',grund:gv('ra-grund')||'--'})},
  es:{tpl:'ein', vars:()=>({dn:gv('es-dn')||'XX',name:gv('es-name')||'Name',rang:gv('es-rang')||'Rang',abteilung:gv('es-abt')||'Abteilung'})},
  ku:{tpl:'kue', vars:()=>({dn:gv('ku-dn')||'XX',name:gv('ku-name')||'Name',rang:gv('ku-rang')||'--',grund:gv('ku-grund')||'--'})},
  az:{tpl:'az',  vars:()=>({name:gv('az-name')||'Vor- u. Nachname',pass:gv('az-pass')||'--',rang:gv('az-rang')||'--',datum:gv('az-datum')?fmtD(gv('az-datum')):'--'})},
  sa:{tpl:'san', vars:()=>({dn:gv('sa-dn')||'XX',name:gv('sa-name')||'Name',sanktion:gv('sa-art')||'--',grund:gv('sa-grund')||'--'})},
  pa:{tpl:'pa',  vars:()=>({dn:gv('pa-dn')||'XX',name:gv('pa-name')||'Name',rang:gv('pa-rang')||'--',abteilung:gv('pa-abt')||'--',eintritt:gv('pa-datum')?fmtD(gv('pa-datum')):gd(),strike:gv('pa-strike')||'0/3'})}
};

function getTpl(key){ const t=DB.tpls||{}; return typeof t[key]==='string'?t[key]:TPL_DEFAULTS[key]; }
function applyTplVars(tpl,vars){ return tpl.replace(/\{(\w+)\}/g,(m,k)=>vars[k]!==undefined?vars[k]:m); }
function baseVars(){ return{datum:gd(),eintritt:gd(),absender:absLine(),dn:'--',name:'--',rang:'--',grund:'--',abteilung:'--',alter_rang:'--',neuer_rang:'--',pass:'--',sanktion:'--',strike:'0/3'}; }
function updatePreview(pfx){
  const g=GENERATORS[pfx];if(!g)return;
  const txt=applyTplVars(getTpl(g.tpl),{...baseVars(),...g.vars()}).trimEnd();
  setOb(pfx+'-pre',txt);
  const md=$(pfx+'-md');if(md)md.innerHTML=mdToHtml(txt);
}
function updateAllPreviews(){ Object.keys(GENERATORS).forEach(updatePreview); }

// ---------- Absender-Profil ----------
function loadAbs(){ try{ return JSON.parse(localStorage.getItem('fib_abs'))||{}; }catch(e){ return{}; } }
function loadAbsIntoFields(){ const a=loadAbs(); sv2('cfg-name',a.name);sv2('cfg-rang',a.rang);sv2('cfg-abt',a.abt); }
function saveAbs(){
  try{ localStorage.setItem('fib_abs',JSON.stringify({name:gv('cfg-name'),rang:gv('cfg-rang'),abt:gv('cfg-abt')})); }catch(e){}
  updateAllPreviews();
}
function absLine(){
  const a=[gv('cfg-name'),gv('cfg-abt'),gv('cfg-rang')].filter(Boolean);
  return a.length?'\n\n'+a.join('\n'):'';
}

// ---------- Vorlagen-Editor ----------
let curTplKey='rang';
function showTplTab(key){
  curTplKey=key;
  document.querySelectorAll('#tpl-tabs .orga-tab').forEach(b=>b.classList.toggle('act',b.dataset.arg===key));
  setOb('tpl-title',TPL_LABELS[key]+' — Vorlage bearbeiten');
  sv2('tpl-editor',getTpl(key));
  updateTplPreview();
}
function updateTplPreview(){
  const sample={...baseVars(),...TPL_SAMPLE,datum:gd(),eintritt:gd(),absender:absLine()};
  const txt=applyTplVars(gv('tpl-editor'),sample);
  setOb('tpl-preview',txt);
  const md=$('tpl-md');if(md)md.innerHTML=mdToHtml(txt);
}
async function saveTpl(){
  const key=curTplKey,val=gv('tpl-editor');
  await cloudMutate('tpls',t=>{t[key]=val;return t;});
  showToast(`Vorlage „${TPL_LABELS[key]}“ für alle gespeichert`);
}
async function resetTpl(){
  const key=curTplKey;
  const ok=await uiConfirm(`Vorlage „${TPL_LABELS[key]}“ für alle auf den Standardtext zurücksetzen?`,{okText:'Zurücksetzen',danger:true});
  if(!ok)return;
  await cloudMutate('tpls',t=>{delete t[key];return t;});
  sv2('tpl-editor',TPL_DEFAULTS[key]);updateTplPreview();
  showToast('Standard wiederhergestellt');
}
// Früher lagen Vorlagen nur im Browser – einmalig in die Cloud übernehmen
let _tplLocalChecked=false;
function migrateLocalTemplates(){
  if(_tplLocalChecked||!canWriteKey('tpls'))return;
  _tplLocalChecked=true;
  let local={};
  try{ local=JSON.parse(localStorage.getItem('fib_tpl'))||{}; }catch(e){}
  const keys=Object.keys(local).filter(k=>TPL_DEFAULTS[k]&&typeof local[k]==='string');
  if(!keys.length)return;
  cloudMutate('tpls',t=>{ keys.forEach(k=>{ if(typeof t[k]!=='string') t[k]=local[k]; }); return t; })
    .then(()=>{ try{localStorage.removeItem('fib_tpl');}catch(e){} showToast('Deine lokalen Vorlagen wurden in die Cloud übernommen',{type:'info'}); })
    .catch(()=>{});
}
function renderTplVars(){
  const box=$('tpl-vars');if(!box)return;
  box.innerHTML=TPL_VARS.map(([k,l])=>`<button type="button" class="var-chip" data-action="tpl-insert" data-arg="${k}" title="An der Cursor-Position einfügen"><code>{${k}}</code> ${esc(l)}</button>`).join('');
}
function insertTplVar(k){
  const ed=$('tpl-editor');
  const s=ed.selectionStart||0,e=ed.selectionEnd||0,ins='{'+k+'}';
  ed.value=ed.value.slice(0,s)+ins+ed.value.slice(e);
  ed.focus();ed.selectionStart=ed.selectionEnd=s+ins.length;
  updateTplPreview();
}

Object.assign(ACTIONS,{
  'tpl-tab':showTplTab,
  'tpl-save':saveTpl,
  'tpl-reset':resetTpl,
  'tpl-insert':insertTplVar,
  'abs-save':()=>{saveAbs();showToast('Absender-Profil gespeichert');}
});
Object.assign(INPUTS,{
  'preview':(pfx)=>updatePreview(pfx),
  'tpl-preview':updateTplPreview,
  'abs':saveAbs
});
Object.assign(CHANGES,{'preview':(pfx)=>updatePreview(pfx)});
onStore('tpls',()=>{
  updateAllPreviews();
  if($('v-tpl').classList.contains('act')&&document.activeElement!==$('tpl-editor')) showTplTab(curTplKey);
  migrateLocalTemplates();
});
