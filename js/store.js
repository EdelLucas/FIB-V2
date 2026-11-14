// FIB Personalabteilung · Datenspeicher (Firestore) + Google-Sheet-Sync
//
// Jeder Bereich liegt in einem eigenen Dokument  fib_data/<bereich>  = {v:<daten>, migrated:true}.
// Dadurch können die Firestore-Regeln pro Abteilung prüfen, wer lesen/schreiben darf.
//
// Änderungen laufen über cloudMutate() als TRANSAKTION: Es wird immer der aktuelle
// Stand aus der Cloud gelesen, geändert und zurückgeschrieben. So überschreiben sich
// gleichzeitige Änderungen verschiedener Nutzer nicht mehr gegenseitig.
//
// Altbestand: Früher lag alles in EINEM Dokument fib/data. Solange ein Bereich noch
// nicht übernommen ist, wird der Altbestand mit angezeigt; beim ersten Speichern in
// diesem Bereich wird er automatisch ins neue Dokument übernommen.

// Bereich -> [Lese-Rolle, Schreib-Rolle, Standardwert]   (null = alle angemeldeten Nutzer)
const STORE_KEYS = {
  kl:             [null,   null,    []],
  maOrder:        [null,   null,    []],
  extraTrainings: [null,   'td',    {}],
  tpls:           ['hr',   'hr',    {}],
  fc:             ['fibco','fibco', []],
  cid:            ['cid',  'cid',   []],
  cirgEvents:     ['cirg', 'cirg',  []],
  cirgLogs:       ['cirg', 'cirg',  []],
  lawCases:       ['law',  'law',   []]
};
const DB = {};             // aktuelle (wirksame) Daten je Bereich
const STORE_HOOKS = {};    // Bereich -> [Render-Funktionen]
const _docs = {};          // Rohdaten der neuen Dokumente
let _legacy = null;        // Rohdaten des alten Sammeldokuments fib/data
let _unsubs = [];

Object.keys(STORE_KEYS).forEach(k=>{ DB[k]=clone(STORE_KEYS[k][2]); });

function onStore(key,fn){ (STORE_HOOKS[key]=STORE_HOOKS[key]||[]).push(fn); }
function canReadKey(k){ const r=STORE_KEYS[k][0]; return !r||hasRole(r); }
function canWriteKey(k){ const r=STORE_KEYS[k][1]; return !r||hasRole(r); }

// Altbestand + neue Daten zusammenführen (nur solange noch nicht übernommen)
function _merge(key,legacyVal,newVal){
  const def=STORE_KEYS[key][2];
  if(Array.isArray(def)){
    const a=Array.isArray(legacyVal)?legacyVal:[], b=Array.isArray(newVal)?newVal:[];
    if(key==='maOrder') return b.length?b:a;
    const kf=key==='kl'?klKey:itemKey;   // Klassifizierung: "id" ist dort die Pass-ID
    const seen=new Set(a.map(kf));
    return [...a, ...b.filter(e=>!seen.has(kf(e)))];
  }
  return {...(legacyVal||{}), ...(newVal||{})};
}
function _effective(key){
  const d=_docs[key];
  if(d&&d.migrated) return d.v!==undefined?d.v:clone(STORE_KEYS[key][2]);
  return _merge(key, _legacy?_legacy[key]:undefined, d?d.v:undefined);
}
function _publish(key){
  DB[key]=_effective(key);
  (STORE_HOOKS[key]||[]).forEach(fn=>{ try{fn(DB[key]);}catch(e){console.error('Render-Fehler',key,e);} });
}

function stopStore(){
  _unsubs.forEach(u=>{try{u();}catch(e){}});
  _unsubs=[];
  Object.keys(_docs).forEach(k=>delete _docs[k]);
  _legacy=null;
  Object.keys(STORE_KEYS).forEach(k=>{ DB[k]=clone(STORE_KEYS[k][2]); });
}

async function startStore(){
  stopStore();
  setCloudStatus('loading');
  try{
    await initFirebase();
  }catch(e){ setCloudStatus('err'); return; }
  let pending=0;
  const done=()=>{ if(--pending<=0) setCloudStatus('ok'); };
  const onErr=(what)=>(err)=>{
    console.error('Listener-Fehler',what,err);
    if(isPermissionError(err)) handleLostAccess();
    else setCloudStatus('err');
  };
  // Altbestand (wird nach erfolgreicher Übernahme vom Admin gelöscht)
  pending++;
  _unsubs.push(FB.fs.onSnapshot(fbDoc('fib','data'),snap=>{
    _legacy=snap.exists()?snap.data():null;
    Object.keys(STORE_KEYS).forEach(k=>{ if(canReadKey(k)) _publish(k); });
    done();
  },err=>{ _legacy=null; done(); if(!isPermissionError(err)) console.warn('Altbestand nicht lesbar',err); }));
  // Neue Bereichs-Dokumente – nur die, die der Nutzer lesen darf
  Object.keys(STORE_KEYS).forEach(key=>{
    if(!canReadKey(key)) return;
    pending++;
    let first=true;
    _unsubs.push(FB.fs.onSnapshot(fbDoc('fib_data',key),snap=>{
      _docs[key]=snap.exists()?snap.data():null;
      _publish(key);
      if(first){first=false;done();}
    },onErr(key)));
  });
}

// Änderung als Transaktion: fn bekommt eine Kopie der aktuellen Daten und gibt die neuen zurück.
async function cloudMutate(key,fn){
  if(!canWriteKey(key)){ showToast('Keine Berechtigung für diesen Bereich',{type:'err'}); throw new Error('no-permission'); }
  await initFirebase();
  setCloudStatus('saving');
  try{
    const result = await FB.fs.runTransaction(FB.db, async tx=>{
      const ref=fbDoc('fib_data',key);
      const snap=await tx.get(ref);
      const cur=snap.exists()?snap.data():null;
      let base;
      if(cur&&cur.migrated){
        base=cur.v!==undefined?cur.v:clone(STORE_KEYS[key][2]);
      }else{
        let legacyVal;
        try{ const ls=await tx.get(fbDoc('fib','data')); legacyVal=ls.exists()?ls.data()[key]:undefined; }catch(e){ legacyVal=undefined; }
        base=_merge(key,legacyVal,cur?cur.v:undefined);
      }
      const next=fn(clone(base));
      if(next===undefined) return clone(base);
      tx.set(ref,{v:next,migrated:true,updatedAt:Date.now(),updatedBy:currentUser||''});
      return next;
    });
    setCloudStatus('ok');
    return result;
  }catch(e){
    console.error('cloudMutate',key,e);
    setCloudStatus('err');
    if(isPermissionError(e)) showToast('Keine Berechtigung – bitte neu anmelden',{type:'err'});
    else showToast('Speichern fehlgeschlagen – Verbindung prüfen',{type:'err'});
    throw e;
  }
}

// Löschen mit "Rückgängig" im Toast
async function removeWithUndo(key,itemK,label){
  let removed=null,index=-1;
  await cloudMutate(key,list=>{
    index=list.findIndex(e=>itemKey(e)===itemK);
    if(index<0) return undefined;
    removed=list.splice(index,1)[0];
    return list;
  });
  if(!removed){ showToast('Eintrag nicht mehr vorhanden',{type:'info'}); return; }
  showToast((label||'Eintrag')+' gelöscht',{action:{label:'Rückgängig',fn:()=>{
    cloudMutate(key,list=>{
      if(list.some(e=>itemKey(e)===itemKey(removed))) return undefined;
      list.splice(Math.min(index,list.length),0,removed);
      return list;
    }).then(()=>showToast('Wiederhergestellt')).catch(()=>{});
  }}});
}

// Admin: alle Bereiche übernehmen und den Altbestand löschen
async function finalizeMigration(){
  if(!hasRole('admin')) return;
  const ok=await uiConfirm('Alle Bereiche werden in die neue Struktur übernommen und das alte Sammeldokument danach gelöscht. Fortfahren?',{title:'Datenübernahme abschließen',okText:'Übernehmen'});
  if(!ok) return;
  for(const key of Object.keys(STORE_KEYS)) await cloudMutate(key,v=>v);
  await FB.fs.deleteDoc(fbDoc('fib','data'));
  showToast('Datenübernahme abgeschlossen');
  renderMigrationStatus();
}
function renderMigrationStatus(){
  const box=$('migration-status');if(!box)return;
  const open=Object.keys(STORE_KEYS).filter(k=>!(_docs[k]&&_docs[k].migrated));
  if(!_legacy&&!open.length){box.innerHTML='<span class="ok-text">Alle Daten sind in der neuen, abgesicherten Struktur.</span>';show('migration-btn',false);return;}
  box.innerHTML=_legacy
    ? `Altbestand vorhanden. Noch nicht übernommen: <b>${esc(open.join(', ')||'–')}</b>`
    : `Kein Altbestand mehr vorhanden.`;
  show('migration-btn',!!_legacy);
}

function setCloudStatus(s){
  const map={
    ok:['var(--gr)','ONLINE',4], err:['var(--re)','FEHLER — Verbindung prüfen',1],
    loading:['var(--wa)','Lade …',2], saving:['var(--wa)','Speichert …',3], off:['var(--mu)','OFFLINE',0]
  };
  const [col,txt,bars]=map[s]||['var(--mu)',s,0];
  ['cloud-status','cloud-status-cfg'].forEach(id=>{const el=$(id);if(el){el.style.color=col;el.textContent=txt;}});
  const dot=$('cloud-dot');
  if(dot) dot.querySelectorAll('span').forEach((b,i)=>{b.style.background=i<bars?col:'var(--bd2)';});
  if(s==='ok'||s==='err') renderMigrationStatus();
}

// ===================== GOOGLE SHEETS LIVE SYNC =====================
const SHEET_ID='1uzAA-_O2JtDBs3bpRG9Mqbva67dqh45LPDjPEf8-njQ';
const SHEET_GID='1591796957';
const SHEET_URL=`https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;
let sheetSyncInterval=null;

function parseCSV(text){
  // Robuster CSV-Parser (Anführungszeichen, Kommas und Zeilenumbrüche in Zellen)
  const rows=[];let row=[],cur='',inQ=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(inQ){
      if(c==='"'){ if(text[i+1]==='"'){cur+='"';i++;} else inQ=false; }
      else cur+=c;
    }else if(c==='"') inQ=true;
    else if(c===','){row.push(cur.trim());cur='';}
    else if(c==='\n'||c==='\r'){
      if(c==='\r'&&text[i+1]==='\n')i++;
      row.push(cur.trim());rows.push(row);row=[];cur='';
    }else cur+=c;
  }
  if(cur||row.length){row.push(cur.trim());rows.push(row);}
  return rows;
}

// Spalten im Sheet (0-basiert): B=ID(1) C=Name(2) D=Rang(3) F=DN(5) I=Division(8) K=Strike(10)
// M=Eintritt(12) N=Letzte Beförderung(13) Q/R=Abteilungen(16/17)
// Schulungs-Häkchen: T=GA U=EVS W=AKS X=TST Y=VHF/EL Z=JUR AA=UC AB=FTK (V ist ausgeblendet)
const TRAIN_COLS=[[19,'GA'],[20,'EVS'],[22,'AKS'],[23,'TST'],[24,'VHF/EL'],[25,'JUR'],[26,'UC'],[27,'FTK']];
function _checked(v){v=(v||'').trim().toUpperCase();return v==='TRUE'||v==='WAHR'||v==='JA'||v==='X'||v==='1';}

async function syncFromSheet(){
  const ss=$('sheet-status');
  try{
    if(ss){ss.textContent='Sheet: Lade …';ss.style.color='var(--wa)';}
    const res=await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`);
    if(!res.ok) throw new Error('Sheet nicht erreichbar');
    const rows=parseCSV(await res.text());
    let start=9;
    for(let i=0;i<Math.min(rows.length,15);i++){
      const r=rows[i].map(c=>c.toUpperCase());
      if(r.includes('ID')&&r.includes('NAME')){start=i+1;break;}
    }
    const list=[];
    for(let i=start;i<rows.length;i++){
      const r=rows[i];
      const id=(r[1]||'').trim(), name=(r[2]||'').trim();
      if(!id&&!name) continue;
      list.push({
        id, name,
        rank:(r[3]||'').trim(), dn:(r[5]||'').trim(), div:(r[8]||'').trim(),
        strike:(r[10]||'0/3').trim()||'0/3',
        date:(r[12]||'').trim(), lastPromo:(r[13]||'').trim(),
        abt:[r[16],r[17]].map(x=>(x||'').trim()).filter(Boolean).join(' | '),
        trainings:TRAIN_COLS.map(([idx,n])=>({name:n,passed:_checked(r[idx])}))
      });
    }
    if(list.length){
      MA=list;
      applyMaOrder();
      refreshDirectory();
      if(ss){
        const t=new Date().toTimeString().slice(0,8);
        ss.textContent='Sheet: ✓ '+t;ss.style.color='var(--gr)';
      }
    }
  }catch(e){
    console.warn('Sheet sync error:',e);
    if(ss){ss.textContent='Sheet: ✗ Fehler';ss.style.color='var(--re)';}
  }
}
function startSheetSync(){
  syncFromSheet();
  clearInterval(sheetSyncInterval);
  sheetSyncInterval=setInterval(syncFromSheet,30000);
}
function stopSheetSync(){ clearInterval(sheetSyncInterval); sheetSyncInterval=null; }

Object.assign(ACTIONS,{
  'reload-data':()=>{ startStore(); syncFromSheet(); showToast('Daten werden neu geladen …',{type:'info'}); },
  'finalize-migration':finalizeMigration
});
