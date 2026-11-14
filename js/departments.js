// FIB Personalabteilung · Abteilungsmodule: FIBCO, CID, TD, CIRG, LAW
// Alle Einträge haben eine feste ID; Löschen/Bearbeiten läuft über diese ID
// (nicht mehr über die Position in der Liste) und als Cloud-Transaktion.

// ===================== FIBCO FALLAKTEN =====================
const FC_FIELDS=['name','coid','codename','tel','behoerde','familie','reisepass','dienstausweis','personalakte','pdaMain','pdaFz','vorfall','befragung','zeugen','beweise','tatvorwurf','schluss','status'];
const FC_INPUT={name:'fc-name',coid:'fc-coid',codename:'fc-codename',tel:'fc-tel',behoerde:'fc-behoerde',familie:'fc-familie',reisepass:'fc-reisepass',dienstausweis:'fc-dienstausweis',personalakte:'fc-personalakte',pdaMain:'fc-pda-main',pdaFz:'fc-pda-fz',vorfall:'fc-vorfall',befragung:'fc-befragung',zeugen:'fc-zeugen',beweise:'fc-beweise',tatvorwurf:'fc-tatvorwurf',schluss:'fc-schluss',status:'fc-status'};

// Ein einziger Text-Baustein für Vorschau, Kopieren und Detailansicht
function fcText(e,ph){
  ph=ph||{};
  const v=k=>e[k]||ph[k]||'';
  return`${v('name')} | ${v('coid')} | ${e.tatdat||ph.tatdat||'--'}
Codename: ${v('codename')}
Telefonnummer: ${v('tel')}
Behörde: ${v('behoerde')}
Familie: ${v('familie')}
Reisepass: ${v('reisepass')}
Dienstausweis: ${v('dienstausweis')}
Personalakte: ${v('personalakte')}
PDA Hauptseite: ${v('pdaMain')}
PDA Fahrzeugliste: ${v('pdaFz')}

[Vorfall]
${v('vorfall')}

[Befragung Tatverdächtiger]
${v('befragung')}

[Zeugen-/aussagen]
${v('zeugen')}

[Beweissammlung]
${v('beweise')}

[Tatvorwurf]
${v('tatvorwurf')}

[Schlussbetrachtung]
${v('schluss')}`;
}
function fcFormValues(){
  const e={};
  FC_FIELDS.forEach(k=>{e[k]=gv(FC_INPUT[k]).trim();});
  e.tatdat=isoToDmy(gv('fc-tatdat'));
  return e;
}
function fcPreview(){
  setOb('fc-pre',fcText(fcFormValues(),{name:'Name',coid:'CO-ID-1',tatdat:'TT.MM.JJJJ',codename:'[Codename]',vorfall:'[…]',befragung:'- ABC',zeugen:'- ABC',beweise:'- ABC',tatvorwurf:'- ABC',schluss:'TEXT'}));
}
async function fcAdd(){
  if(!requireFields([['fc-name','Name eingeben'],['fc-coid','CO-ID eingeben']]))return;
  const e={...fcFormValues(),id:uid('fc'),date:gd(),by:currentName||currentUser};
  let dup=false;
  await cloudMutate('fc',list=>{
    if(list.some(x=>(x.coid||'').toLowerCase()===e.coid.toLowerCase())){dup=true;return undefined;}
    list.push(e);return list;
  });
  if(dup){fieldError('fc-coid',`CO-ID ${e.coid} ist bereits vergeben`);return;}
  clearForm(Object.values(FC_INPUT).concat('fc-tatdat'));
  sv2('fc-status','Offen');
  fcPreview();
  showToast('Fallakte gespeichert');
}
function fcRender(){
  const q=gv('fc-search').toLowerCase().trim(),f=gv('fc-filter');
  const list=(DB.fc||[]).filter(e=>
    (!q||[e.name,e.coid,e.familie,e.reisepass].join(' ').toLowerCase().includes(q))&&(!f||e.status===f));
  setOb('fc-count',list.length+' Akten');
  fillTable('fc-body',list.map(e=>{
    const k=itemKey(e),rid='fc-exp-'+_hash(k);
    return`<tr>
      <td class="mono accent strong nowrap">${esc(e.coid)}</td>
      <td class="strong">${esc(e.name)}</td>
      <td class="muted small nowrap">${esc(e.tatdat||'--')}</td>
      <td class="muted small">${esc(e.familie||'--')}</td>
      <td>${statusBadge(e.status)}</td>
      <td class="muted small nowrap">${esc(e.date||'--')}</td>
      <td class="actions">
        <button class="btn sm icon" data-action="toggle-row" data-arg="${rid}" title="Details"><i class="ti ti-eye"></i></button>
        <button class="btn sm icon" data-action="fc-status" data-arg="${esc(k)}" title="Status ändern"><i class="ti ti-progress"></i></button>
        <button class="btn sm icon" data-action="fc-copy" data-arg="${esc(k)}" title="Vorlage kopieren"><i class="ti ti-copy"></i></button>
        <button class="btn sm icon danger" data-action="fc-del" data-arg="${esc(k)}" title="Löschen"><i class="ti ti-trash"></i></button>
      </td>
    </tr>
    <tr id="${rid}" class="exp" hidden><td colspan="7"><pre class="exp-pre">${esc(fcText(e))}</pre></td></tr>`;
  }).join(''),'fc-empty',!list.length);
}
async function fcChangeStatus(k){
  const e=findByKey(DB.fc,k);if(!e)return;
  const next=CASE_STATUS[(CASE_STATUS.indexOf(e.status)+1)%CASE_STATUS.length];
  const ok=await uiConfirm(`Status von ${e.coid} von „${e.status}“ auf „${next}“ setzen?`,{title:'Status ändern',okText:next});
  if(!ok)return;
  await cloudMutate('fc',list=>{const x=findByKey(list,k);if(!x)return undefined;x.status=next;return list;});
  showToast('Status: '+next);
}

// ===================== CID BEWEISE =====================
async function cidAdd(){
  if(!requireFields([['cid-orga','Orga wählen'],['cid-beamter','Beamten eintragen'],['cid-tat','Tatvorwürfe eintragen']]))return;
  const e={
    id:uid('cid'),ts:nowStamp(),
    orga:gv('cid-orga'),beamter:gv('cid-beamter').trim(),pass:gv('cid-pass').trim(),kfz:gv('cid-kfz').trim(),
    gang:gv('cid-gang'),tatdat:gv('cid-tatdat'),tatzeit:gv('cid-tatzeit'),tat:gv('cid-tat').trim(),clip:gv('cid-clip').trim(),
    by:currentName||currentUser
  };
  await cloudMutate('cid',list=>{list.push(e);return list;});
  clearForm(['cid-orga','cid-beamter','cid-pass','cid-kfz','cid-gang','cid-tatdat','cid-tatzeit','cid-tat','cid-clip']);
  showToast('Eintrag gespeichert');
}
function clipHtml(clip){
  const url=safeUrl(clip);
  if(url)return`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" class="info-text"><i class="ti ti-external-link"></i> Link</a>`;
  return clip?`<span class="muted small">${esc(clip)}</span>`:'<span class="muted">--</span>';
}
function cidRender(){
  const q=gv('cid-search').toLowerCase().trim(),fo=gv('cid-filter-orga');
  const list=(DB.cid||[]).filter(e=>
    (!q||[e.beamter,e.orga,e.pass,e.kfz,e.tat].join(' ').toLowerCase().includes(q))&&(!fo||e.orga===fo));
  setOb('cid-count',list.length+' Einträge');
  fillTable('cid-body',list.map(e=>{
    const k=itemKey(e),rid='cid-exp-'+_hash(k);
    const tat=e.tat||'';
    const url=safeUrl(e.clip);
    return`<tr>
      <td class="muted small nowrap">${esc(e.ts||'--')}</td>
      <td>${orgaBadge(e.orga)}</td>
      <td class="strong nowrap">${esc(e.beamter)}</td>
      <td class="mono muted">${esc(e.pass||'--')}</td>
      <td class="muted small">${esc(e.kfz||'--')}</td>
      <td class="muted small nowrap">${esc(e.gang||'--')}</td>
      <td class="muted small nowrap">${esc(e.tatdat?isoToDmy(e.tatdat):'--')}</td>
      <td class="muted small nowrap">${esc(e.tatzeit||'--')}</td>
      <td class="small clip" title="${esc(tat)}">${esc(tat.length>40?tat.slice(0,40)+'…':tat||'--')}</td>
      <td>${clipHtml(e.clip)}</td>
      <td class="actions">
        <button class="btn sm icon" data-action="toggle-row" data-arg="${rid}" title="Details"><i class="ti ti-eye"></i></button>
        <button class="btn sm icon danger" data-action="cid-del" data-arg="${esc(k)}" title="Löschen"><i class="ti ti-trash"></i></button>
      </td>
    </tr>
    <tr id="${rid}" class="exp" hidden><td colspan="11">
      <div class="exp-title">Vollständige Tatvorwürfe</div><div>${escMultiline(tat)}</div>
      ${e.gang?`<div class="exp-title">Gang</div><div>${esc(e.gang)}</div>`:''}
      ${e.clip?`<div class="exp-title">Clip</div><div>${url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" class="info-text">${esc(url)}</a>`:esc(e.clip)}</div>`:''}
      ${e.by?`<div class="exp-title">Erfasst von</div><div>${esc(e.by)}</div>`:''}
    </td></tr>`;
  }).join(''),'cid-empty',!list.length);
}

// ===================== TD AUSBILDUNG =====================
function tdLookup(){
  const id=gv('td-pass-in').trim();
  const found=$('td-found');
  const m=id&&MA.find(x=>x.id===id);
  show('td-fields',!!m);
  sv2('td-passid',m?m.id:'');
  if(!id){found.innerHTML='';return;}
  if(!m){found.innerHTML='<span class="err-text"><i class="ti ti-x"></i> Kein Treffer</span>';return;}
  found.innerHTML=`<span class="ok-text"><i class="ti ti-check"></i> <b>${esc(m.name)}</b> · ${esc(m.rank)}</span>`;
  sv2('td-name',m.name);sv2('td-rang',m.rank);
  tdRenderList();
}
function tdRenderList(){
  const id=gv('td-passid');
  if(!id){fillTable('td-train-list','','td-train-empty',false);return;}
  const trains=getTrainingsForId(id);
  const manual=new Set((DB.extraTrainings[id]||[]).map(t=>t.name.toLowerCase()));
  fillTable('td-train-list',trains.map(t=>`<tr>
    <td>${esc(t.name)}${manual.has(t.name.toLowerCase())?' <span class="live-tag">TD</span>':''}</td>
    <td class="right">${trainBadge(t)}</td>
    <td class="actions">${manual.has(t.name.toLowerCase())?`<button class="btn sm icon danger" data-action="td-remove" data-arg="${esc(t.name)}" title="TD-Eintrag entfernen (Sheet-Wert gilt wieder)"><i class="ti ti-x"></i></button>`:''}</td>
  </tr>`).join(''),'td-train-empty',!trains.length);
}
async function tdSaveTraining(){
  const id=gv('td-passid');
  if(!id){showToast('Bitte zuerst eine Person suchen',{type:'info'});return;}
  if(!requireFields([['td-train-name','Name der Ausbildung']]))return;
  const name=gv('td-train-name').trim(),passed=gv('td-train-status')==='1';
  await cloudMutate('extraTrainings',all=>{
    const list=all[id]=all[id]||[];
    const ex=list.find(t=>t.name.toLowerCase()===name.toLowerCase());
    if(ex)ex.passed=passed;else list.push({name,passed});
    return all;
  });
  sv2('td-train-name','');
  showToast('Ausbildung eingetragen – im Verzeichnis sichtbar');
}
async function tdRemoveTraining(name,id){
  id=id||gv('td-passid');
  await cloudMutate('extraTrainings',all=>{
    if(!all[id])return undefined;
    all[id]=all[id].filter(t=>t.name.toLowerCase()!==name.toLowerCase());
    if(!all[id].length)delete all[id];
    return all;
  });
  showToast('Entfernt – Sheet-Wert gilt wieder');
}

// TD-Korrekturen verwalten (Einstellungen, nur Admin)
function renderTdCorrections(){
  const box=$('td-corrections-list');if(!box)return;
  const all=DB.extraTrainings||{};
  const ids=Object.keys(all).filter(id=>all[id]&&all[id].length);
  if(!ids.length){box.innerHTML='<div class="empty">Keine manuellen TD-Korrekturen vorhanden.</div>';return;}
  box.innerHTML=ids.map(id=>{
    const m=MA.find(x=>x.id===id);
    return`<div class="card-row">
      <div class="card-row-h">
        <div class="strong">${esc(m?m.name:'Pass-ID '+id)} <span class="muted">(${esc(id)})</span></div>
        <button class="btn sm danger" data-action="td-clear-person" data-arg="${esc(id)}"><i class="ti ti-trash"></i> Alle für diese Person</button>
      </div>
      <div class="chips">${all[id].map(t=>`<button type="button" class="train-badge ${t.passed?'train-pass':'train-fail'}" data-action="td-clear-one" data-arg="${esc(id)}" data-name="${esc(t.name)}" title="Klicken zum Entfernen">${esc(t.name)} <i class="ti ti-x"></i></button>`).join('')}</div>
    </div>`;
  }).join('');
}
async function clearTdCorrectionsFor(id){
  const ok=await uiConfirm('Alle manuellen TD-Einträge dieser Person entfernen?',{okText:'Entfernen',danger:true});
  if(!ok)return;
  await cloudMutate('extraTrainings',all=>{delete all[id];return all;});
  showToast('Korrekturen entfernt');
}
async function clearAllTdCorrections(){
  const ok=await uiConfirm('Wirklich ALLE manuellen TD-Korrekturen für ALLE Personen löschen? Danach gelten ausschließlich die Sheet-Werte.',{title:'Alle TD-Korrekturen löschen',okText:'Alle löschen',danger:true});
  if(!ok)return;
  await cloudMutate('extraTrainings',()=>({}));
  showToast('Alle TD-Korrekturen gelöscht');
}

// ===================== CIRG EVENTS + LOGS =====================
async function cirgAddEvent(){
  if(!requireFields([['ce-name','Event-Name eingeben']]))return;
  const e={id:uid('ev'),name:gv('ce-name').trim(),desc:gv('ce-desc').trim(),date:gv('ce-date'),by:currentName||currentUser};
  await cloudMutate('cirgEvents',list=>{list.push(e);return list;});
  clearForm(['ce-name','ce-desc','ce-date']);
  showToast('Event gespeichert');
}
function cirgRenderEvents(){
  const list=DB.cirgEvents||[];
  setOb('ce-count',list.length+' Events');
  show('ce-empty',!list.length);
  $('ce-list').innerHTML=list.map(e=>`<div class="card-row">
    <div class="card-row-h">
      <div><span class="strong">${esc(e.name)}</span>${e.date?` <span class="muted small">· ${esc(fmtD(e.date))}</span>`:''}</div>
      <div class="actions">
        <button class="btn sm icon" data-action="toggle-row" data-arg="ce-exp-${esc(e.id)}" title="Beschreibung"><i class="ti ti-eye"></i></button>
        <button class="btn sm icon danger" data-action="cirg-del-event" data-arg="${esc(e.id)}" title="Löschen"><i class="ti ti-trash"></i></button>
      </div>
    </div>
    <div id="ce-exp-${esc(e.id)}" class="card-row-body" hidden>${e.desc?escMultiline(e.desc):'<span class="muted">Keine Beschreibung hinterlegt.</span>'}</div>
  </div>`).join('');
  cirgFillEventSelects();
}
function cirgFillEventSelects(){
  const opts=(DB.cirgEvents||[]).map(e=>`<option value="${esc(e.id)}">${esc(e.name)}</option>`).join('');
  [['cl-event','-- kein Event / allgemein --'],['cl-filter','Alle Events']].forEach(([id,ph])=>{
    const s=$(id);if(!s)return;
    const cur=s.value;
    s.innerHTML=`<option value="">${ph}</option>`+opts;
    s.value=cur;
  });
}
async function cirgAddLog(){
  if(!requireFields([['cl-text','Log-Text eingeben']]))return;
  const eventId=gv('cl-event');
  const ev=(DB.cirgEvents||[]).find(e=>e.id===eventId);
  const l={id:uid('lg'),eventId,eventName:ev?ev.name:'',text:gv('cl-text').trim(),author:currentName||currentUser||'--',ts:nowStamp()};
  await cloudMutate('cirgLogs',list=>{list.unshift(l);return list;});
  sv2('cl-text','');
  showToast('Log gespeichert');
}
function cirgRenderLogs(){
  const f=gv('cl-filter');
  const list=(DB.cirgLogs||[]).filter(l=>!f||l.eventId===f);
  setOb('cl-count',list.length+' Einträge');
  show('cl-empty',!list.length);
  $('cl-list').innerHTML=list.map(l=>`<div class="card-row">
    <div class="card-row-h">
      <div class="muted small">${l.eventName?`<span class="accent strong">${esc(l.eventName)}</span> · `:''}${esc(l.ts)} · ${esc(l.author)}</div>
      <button class="btn sm icon danger" data-action="cirg-del-log" data-arg="${esc(l.id)}" title="Löschen"><i class="ti ti-trash"></i></button>
    </div>
    <div class="card-row-text">${escMultiline(l.text)}</div>
  </div>`).join('');
}

// ===================== LAW AKTENSYSTEM =====================
async function lawAdd(){
  if(!requireFields([['lw-mandant','Mandant eingeben'],['lw-akteid','Akten-ID eingeben']]))return;
  const c={
    id:uid('law'),mandant:gv('lw-mandant').trim(),akteId:gv('lw-akteid').trim(),pass:gv('lw-pass').trim(),
    datum:gv('lw-datum')?fmtD(gv('lw-datum')):'',status:gv('lw-status'),
    sachverhalt:gv('lw-sachverhalt').trim(),notizen:gv('lw-notizen').trim(),erstellt:gd(),by:currentName||currentUser
  };
  let dup=false;
  await cloudMutate('lawCases',list=>{
    if(list.some(x=>(x.akteId||'').toLowerCase()===c.akteId.toLowerCase())){dup=true;return undefined;}
    list.push(c);return list;
  });
  if(dup){fieldError('lw-akteid',`Akten-ID ${c.akteId} ist bereits vergeben`);return;}
  clearForm(['lw-mandant','lw-akteid','lw-pass','lw-datum','lw-sachverhalt','lw-notizen']);
  sv2('lw-status','Offen');
  showToast('Akte gespeichert');
}
function lawRender(){
  const q=gv('lw-search').toLowerCase().trim(),f=gv('lw-filter');
  const list=(DB.lawCases||[]).filter(c=>
    (!q||[c.mandant,c.akteId,c.pass].join(' ').toLowerCase().includes(q))&&(!f||c.status===f));
  setOb('lw-count',list.length+' Akten');
  fillTable('lw-body',list.map(c=>{
    const k=itemKey(c),rid='lw-exp-'+_hash(k);
    return`<tr>
      <td class="mono accent strong nowrap">${esc(c.akteId)}</td>
      <td class="strong">${esc(c.mandant)}</td>
      <td class="muted small nowrap">${esc(c.datum||'--')}</td>
      <td>${statusBadge(c.status)}</td>
      <td class="muted small nowrap">${esc(c.erstellt||'--')}</td>
      <td class="actions">
        <button class="btn sm icon" data-action="toggle-row" data-arg="${rid}" title="Details"><i class="ti ti-eye"></i></button>
        <button class="btn sm icon" data-action="law-status" data-arg="${esc(k)}" title="Status ändern"><i class="ti ti-progress"></i></button>
        <button class="btn sm icon danger" data-action="law-del" data-arg="${esc(k)}" title="Löschen"><i class="ti ti-trash"></i></button>
      </td>
    </tr>
    <tr id="${rid}" class="exp" hidden><td colspan="6">
      <div class="exp-title">Reisepass</div><div>${esc(c.pass||'--')}</div>
      <div class="exp-title">Sachverhalt</div><div>${escMultiline(c.sachverhalt||'--')}</div>
      ${c.notizen?`<div class="exp-title">Notizen</div><div>${escMultiline(c.notizen)}</div>`:''}
    </td></tr>`;
  }).join(''),'lw-empty',!list.length);
}
async function lawChangeStatus(k){
  const c=findByKey(DB.lawCases,k);if(!c)return;
  const next=LAW_STATUS[(LAW_STATUS.indexOf(c.status)+1)%LAW_STATUS.length];
  const ok=await uiConfirm(`Status von ${c.akteId} von „${c.status}“ auf „${next}“ setzen?`,{title:'Status ändern',okText:next});
  if(!ok)return;
  await cloudMutate('lawCases',list=>{const x=findByKey(list,k);if(!x)return undefined;x.status=next;return list;});
  showToast('Status: '+next);
}

Object.assign(ACTIONS,{
  'fc-add':fcAdd,
  'fc-del':(k)=>removeWithUndo('fc',k,'Fallakte'),
  'fc-copy':(k)=>{const e=findByKey(DB.fc,k);if(e)copyText(fcText(e),'Fallakte kopiert');},
  'fc-status':fcChangeStatus,
  'cid-add':cidAdd,
  'cid-del':(k)=>removeWithUndo('cid',k,'Eintrag'),
  'td-save':tdSaveTraining,
  'td-remove':(name)=>tdRemoveTraining(name),
  'td-clear-one':(id,el)=>tdRemoveTraining(el.dataset.name,id),
  'td-clear-person':clearTdCorrectionsFor,
  'td-clear-all':clearAllTdCorrections,
  'cirg-add-event':cirgAddEvent,
  'cirg-del-event':(id)=>removeWithUndo('cirgEvents',id,'Event'),
  'cirg-add-log':cirgAddLog,
  'cirg-del-log':(id)=>removeWithUndo('cirgLogs',id,'Log-Eintrag'),
  'law-add':lawAdd,
  'law-del':(k)=>removeWithUndo('lawCases',k,'Akte'),
  'law-status':lawChangeStatus
});
Object.assign(INPUTS,{'fc-preview':fcPreview,'fc-filter':fcRender,'cid-filter':cidRender,'td-lookup':tdLookup,'lw-filter':lawRender});
Object.assign(CHANGES,{'fc-preview':fcPreview,'fc-filter':fcRender,'cid-filter':cidRender,'cl-filter':cirgRenderLogs,'lw-filter':lawRender});
onStore('fc',fcRender);
onStore('cid',cidRender);
onStore('extraTrainings',()=>{tdRenderList();renderTdCorrections();});
onStore('cirgEvents',cirgRenderEvents);
onStore('cirgLogs',cirgRenderLogs);
onStore('lawCases',lawRender);
