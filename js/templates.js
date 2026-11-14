// FIB Personalabteilung · Vorlagen-Editor + Nachrichten-Generatoren
// ===================== VORLAGEN-EDITOR =====================
const TPL_DEFAULTS={
  rang:`-# Ranganpassung . FIB Personalabteilung\n\n**Mitarbeiter:** {dn} | {name}\n**Von:** {alter_rang}\n**Nach:** {neuer_rang}\n**Datum:** {datum}\n**Begruendung:** {grund}{absender}`,
  ein: `-# Einstellung . FIB Personalabteilung\n\n**Dienstnummer:** {dn}\n**Name:** {name}\n**Rang:** {rang}\n**Abteilung:** @{abteilung}\n**Einstellungsdatum:** {datum}\n\nWillkommen im Federal Investigation Bureau!{absender}`,
  kue: `-# Kuendigung . FIB Personalabteilung\n\n**Mitarbeiter:** {dn} | {name}\n**Rang:** {rang}\n**Datum:** {datum}\n**Grund:** {grund}\n\nDer Mitarbeiter wird mit sofortiger Wirkung aus dem Dienst entlassen.{absender}`,
  az:  `Das Federal Investigation Bureau (FIB),\nuebermittelt hiermit das Arbeitszeugnis von:\n\n**Vor- u. Nachname:** {name}\n**Reisepassnr.:** {pass}\n**Rang:** {rang}\n**Datum der Kuendigung:** {datum}\n\n(Arbeitszeugnis wird als Anhang beigefuegt){absender}`,
  san: `-# Sanktion . FIB Personalabteilung\n\n**Mitarbeiter:** {dn} | {name}\n**Sanktionsart:** {sanktion}\n**Datum:** {datum}\n**Begruendung:** {grund}{absender}`,
  pa:  `-# Personalakte . FIB\n\n**Dienstnummer:** {dn}\n**Name:** {name}\n**Rang:** {rang}\n**Abteilung:** {abteilung}\n**Eintrittsdatum:** {eintritt}\n**Strike:** 0/3\n**Status:** Aktiv{absender}`,
};
const TPL_LABELS={rang:'Ranganpassung',ein:'Einstellung',kue:'Kündigung',az:'AZ-System',san:'Sanktion',pa:'Personalakte'};
const TPL_SAMPLE={dn:'42',name:'Max Mustermann',rang:'17. Commander',alter_rang:'16. Lieutenant Commander',neuer_rang:'17. Commander',datum:gd(),grund:'Herausragende Leistungen im Dienst',abteilung:'Human Resources',pass:'99999',sanktion:'Schriftliche Verwarnung',eintritt:gd(),absender:''};

function loadTpls(){try{const d=localStorage.getItem('fib_tpl');if(d)return JSON.parse(d);}catch(e){}return{};}
function saveTpls(t){try{localStorage.setItem('fib_tpl',JSON.stringify(t));}catch(e){}}

let TPLS=loadTpls();
let curTplKey='rang';

function getTpl(key){return TPLS[key]!==undefined?TPLS[key]:TPL_DEFAULTS[key];}

function showTplTab(key,btn){
  curTplKey=key;
  document.querySelectorAll('.tpl-tab').forEach(b=>b.classList.remove('act-tab'));
  if(btn)btn.classList.add('act-tab');
  const lbl=TPL_LABELS[key]||key;
  const title=document.getElementById('tpl-pan-title');
  if(title)title.querySelector('.pan-t').textContent='[ '+lbl+' — Vorlage bearbeiten ]';
  const ed=document.getElementById('tpl-editor');
  if(ed){ed.value=getTpl(key);updateTplPreview();}
}

function applyTplVars(tpl,vars){return tpl.replace(/\{(\w+)\}/g,(_,k)=>vars[k]!==undefined?vars[k]:'{'+k+'}');}

function updateTplPreview(){
  const ed=document.getElementById('tpl-editor');
  const pre=document.getElementById('tpl-preview');
  if(!ed||!pre)return;
  const sample={
    name:gv('ra-name')||gv('ku-name')||gv('az-name')||gv('sa-name')||gv('pa-name')||TPL_SAMPLE.name,
    dn:gv('ra-dn')||gv('ku-dn')||gv('sa-dn')||gv('pa-dn')||TPL_SAMPLE.dn,
    rang:gv('ra-old')||gv('ku-rang')||gv('az-rang')||gv('pa-rang')||TPL_SAMPLE.rang,
    alter_rang:gv('ra-old')||TPL_SAMPLE.alter_rang,
    neuer_rang:gv('ra-new')||TPL_SAMPLE.neuer_rang,
    datum:gd(),
    grund:gv('ra-grund')||gv('ku-grund')||gv('sa-grund')||TPL_SAMPLE.grund,
    abteilung:gv('es-abt')||gv('pa-abt')||TPL_SAMPLE.abteilung,
    pass:gv('az-pass')||TPL_SAMPLE.pass,
    sanktion:gv('sa-art')||TPL_SAMPLE.sanktion,
    eintritt:fmtD(gv('pa-datum'))||gd(),
    absender:absLine(),
  };
  pre.textContent=applyTplVars(ed.value,sample);
}

function saveTpl(){
  const ed=document.getElementById('tpl-editor');if(!ed)return;
  TPLS[curTplKey]=ed.value;saveTpls(TPLS);
  showToast('Vorlage "'+TPL_LABELS[curTplKey]+'" gespeichert');
  [upRa,upEs,upKu,upAz,upSa,upPa].forEach(f=>f());
}

function resetTpl(key){
  if(!confirm('Vorlage "'+TPL_LABELS[key]+'" auf Standard zurücksetzen?'))return;
  delete TPLS[key];saveTpls(TPLS);
  const ed=document.getElementById('tpl-editor');
  if(ed){ed.value=TPL_DEFAULTS[key];updateTplPreview();}
  showToast('Standard wiederhergestellt');
  [upRa,upEs,upKu,upAz,upSa,upPa].forEach(f=>f());
}

function renderTpl(key,vars){return applyTplVars(getTpl(key),vars);}

function upRa(){
  const vars={dn:gv('ra-dn')||'XX',name:gv('ra-name')||'Name',alter_rang:gv('ra-old')||'Alter Rang',neuer_rang:gv('ra-new')||'Neuer Rang',datum:gd(),grund:gv('ra-grund')||'--',rang:gv('ra-old')||'--',abteilung:'--',pass:'--',sanktion:'--',eintritt:gd(),absender:absLine()};
  setOb('ra-pre',renderTpl('rang',vars).trimEnd());
}
function upEs(){
  const vars={dn:gv('es-dn')||'XX',name:gv('es-name')||'Name',rang:gv('es-rang')||'Rang',abteilung:gv('es-abt')||'Abteilung',datum:gd(),grund:'--',alter_rang:'--',neuer_rang:'--',pass:'--',sanktion:'--',eintritt:gd(),absender:absLine()};
  setOb('es-pre',renderTpl('ein',vars).trimEnd());
}
function upKu(){
  const vars={dn:gv('ku-dn')||'XX',name:gv('ku-name')||'Name',rang:gv('ku-rang')||'--',datum:gd(),grund:gv('ku-grund')||'--',abteilung:'--',alter_rang:'--',neuer_rang:'--',pass:'--',sanktion:'--',eintritt:gd(),absender:absLine()};
  setOb('ku-pre',renderTpl('kue',vars).trimEnd());
}
function upAz(){
  const vars={name:gv('az-name')||'Vor- u. Nachname',pass:gv('az-pass')||'--',rang:gv('az-rang')||'--',datum:fmtD(gv('az-datum'))||'--',dn:'--',abteilung:'--',grund:'--',alter_rang:'--',neuer_rang:'--',sanktion:'--',eintritt:gd(),absender:absLine()};
  setOb('az-pre',renderTpl('az',vars).trimEnd());
}
function upSa(){
  const vars={dn:gv('sa-dn')||'XX',name:gv('sa-name')||'Name',sanktion:gv('sa-art')||'--',datum:gd(),grund:gv('sa-grund')||'--',rang:'--',abteilung:'--',alter_rang:'--',neuer_rang:'--',pass:'--',eintritt:gd(),absender:absLine()};
  setOb('sa-pre',renderTpl('san',vars).trimEnd());
}
function upPa(){
  const vars={dn:gv('pa-dn')||'XX',name:gv('pa-name')||'Name',rang:gv('pa-rang')||'--',abteilung:gv('pa-abt')||'--',eintritt:fmtD(gv('pa-datum'))||gd(),datum:gd(),grund:'--',alter_rang:'--',neuer_rang:'--',pass:'--',sanktion:'--',absender:absLine()};
  setOb('pa-pre',renderTpl('pa',vars).trimEnd());
}


