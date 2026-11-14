// FIB Personalabteilung · Abteilungsmodule: FIBCO, CID, TD, CIRG, LAW
// ===================== FIBCO FALLAKTEN =====================
let FC_DATA = [];

function fcSave(){ cloudPush(); }

function fcPreview(){
  const name      = gv('fc-name')||'Name';
  const coid      = gv('fc-coid')||'CO-ID-1';
  const tatdat    = gv('fc-tatdat') ? gv('fc-tatdat').split('-').reverse().join('.') : 'TT.MM.YYYY';
  const codename  = gv('fc-codename')||'[Codename]';
  const tel       = gv('fc-tel')||'';
  const behoerde  = gv('fc-behoerde')||'';
  const familie   = gv('fc-familie')||'';
  const reisepass = gv('fc-reisepass')||'';
  const dienst    = gv('fc-dienstausweis')||'';
  const pa        = gv('fc-personalakte')||'';
  const pdaMain   = gv('fc-pda-main')||'';
  const pdaFz     = gv('fc-pda-fz')||'';
  const vorfall   = gv('fc-vorfall')||'[…]';
  const befragung = gv('fc-befragung')||'- ABC';
  const zeugen    = gv('fc-zeugen')||'- ABC';
  const beweise   = gv('fc-beweise')||'- ABC';
  const tatvorwurf= gv('fc-tatvorwurf')||'- ABC';
  const schluss   = gv('fc-schluss')||'TEXT';

  const txt =
`${name} | ${coid} | ${tatdat}
Codename: ${codename}
Telefonnummer: ${tel}
Behörde: ${behoerde}
Familie: ${familie}
Reisepass: ${reisepass}
Dienstausweis: ${dienst}
Personalakte: ${pa}
PDA Hauptseite: ${pdaMain}
PDA Fahrzeugliste: ${pdaFz}

[Vorfall]
${vorfall}

[Befragung Tatverdächtiger]
${befragung}

[Zeugen-/aussagen]
${zeugen}

[Beweissammlung]
${beweise}

[Tatvorwurf]
${tatvorwurf}

[Schlussbetrachtung]
${schluss}`;

  setOb('fc-pre', txt);
}

function fcAdd(){
  const name=gv('fc-name').trim(), coid=gv('fc-coid').trim();
  if(!name||!coid){showToast('Name und CO-ID sind Pflichtfelder!');return;}
  if(FC_DATA.find(e=>e.coid.toLowerCase()===coid.toLowerCase())){
    showToast('⚠️ CO-ID '+coid+' bereits vorhanden!');
    const el=document.getElementById('fc-coid');
    if(el){el.style.borderColor='var(--re)';setTimeout(()=>el.style.borderColor='',2000);}
    return;
  }
  const tatdat=gv('fc-tatdat')?gv('fc-tatdat').split('-').reverse().join('.'):'';
  FC_DATA.push({
    name, coid, tatdat,
    codename:     gv('fc-codename').trim(),
    tel:          gv('fc-tel').trim(),
    behoerde:     gv('fc-behoerde').trim(),
    familie:      gv('fc-familie').trim(),
    reisepass:    gv('fc-reisepass').trim(),
    dienstausweis:gv('fc-dienstausweis').trim(),
    personalakte: gv('fc-personalakte').trim(),
    pdaMain:      gv('fc-pda-main').trim(),
    pdaFz:        gv('fc-pda-fz').trim(),
    vorfall:      gv('fc-vorfall').trim(),
    befragung:    gv('fc-befragung').trim(),
    zeugen:       gv('fc-zeugen').trim(),
    beweise:      gv('fc-beweise').trim(),
    tatvorwurf:   gv('fc-tatvorwurf').trim(),
    schluss:      gv('fc-schluss').trim(),
    status:       gv('fc-status'),
    date:         gd()
  });
  fcSave();
  ['fc-name','fc-coid','fc-codename','fc-tel','fc-behoerde','fc-familie','fc-reisepass',
   'fc-dienstausweis','fc-personalakte','fc-pda-main','fc-pda-fz',
   'fc-vorfall','fc-befragung','fc-zeugen','fc-beweise','fc-tatvorwurf','fc-schluss'].forEach(id=>sv2(id,''));
  const td=document.getElementById('fc-tatdat');if(td)td.value='';
  sv2('fc-status','Offen');
  setOb('fc-pre','');
  fcRender();
  showToast('Fallakte gespeichert');
}

function fcDel(i){
  if(!confirm('Fallakte wirklich löschen?'))return;
  FC_DATA.splice(i,1);fcSave();fcRender();showToast('Gelöscht');
}

function fcExpand(i){
  const row=document.getElementById('fc-exp-'+i);
  if(!row)return;
  row.style.display=row.style.display==='none'?'table-row':'none';
}

function fcCopyEntry(i){
  const e=FC_DATA[i];if(!e)return;
  const txt=
`${e.name} | ${e.coid} | ${e.tatdat||'--'}
Codename: ${e.codename||''}
Telefonnummer: ${e.tel||''}
Behörde: ${e.behoerde||''}
Familie: ${e.familie||''}
Reisepass: ${e.reisepass||''}
Dienstausweis: ${e.dienstausweis||''}
Personalakte: ${e.personalakte||''}
PDA Hauptseite: ${e.pdaMain||''}
PDA Fahrzeugliste: ${e.pdaFz||''}

[Vorfall]
${e.vorfall||''}

[Befragung Tatverdächtiger]
${e.befragung||''}

[Zeugen-/aussagen]
${e.zeugen||''}

[Beweissammlung]
${e.beweise||''}

[Tatvorwurf]
${e.tatvorwurf||''}

[Schlussbetrachtung]
${e.schluss||''}`;
  navigator.clipboard.writeText(txt).then(()=>showToast('Fallakte kopiert!')).catch(()=>{});
}

function fcRender(){
  const q=(gv('fc-search')||'').toLowerCase();
  const f=gv('fc-filter');
  let list=FC_DATA.filter(e=>{
    const okQ=!q||(e.name||'').toLowerCase().includes(q)||(e.coid||'').toLowerCase().includes(q)||(e.familie||'').toLowerCase().includes(q)||(e.reisepass||'').includes(q);
    const okF=!f||e.status===f;
    return okQ&&okF;
  });
  const body=document.getElementById('fc-body');
  const empty=document.getElementById('fc-empty');
  const count=document.getElementById('fc-count');
  if(count)count.textContent=list.length+' Akten';
  const statusCol={Offen:'var(--wa)','In Bearbeitung':'var(--bl)',Abgeschlossen:'var(--gr)',Archiviert:'var(--mu)'};
  if(!list.length){if(body)body.innerHTML='';if(empty)empty.style.display='block';return;}
  if(empty)empty.style.display='none';
  if(body)body.innerHTML=list.map(e=>{
    const i=FC_DATA.indexOf(e);
    const col=statusCol[e.status]||'var(--mu)';
    return`<tr>
      <td style="color:var(--g);font-size:11px;white-space:nowrap;font-family:'SF Mono','Consolas',monospace;font-weight:600;">${e.coid}</td>
      <td style="font-weight:bold">${e.name}</td>
      <td style="font-size:11px;color:var(--mu);white-space:nowrap">${e.tatdat||'--'}</td>
      <td style="font-size:11px;color:var(--mu)">${e.familie||'--'}</td>
      <td><span style="display:inline-block;font-size:10px;padding:1px 7px;border-radius:2px;border:1.5px solid ${col};background:${col}12;color:${col};font-weight:700;letter-spacing:.03em;transform:rotate(-2deg);">${e.status}</span></td>
      <td style="font-size:11px;color:var(--mu);white-space:nowrap">${e.date||'--'}</td>
      <td style="text-align:center;white-space:nowrap">
        <div style="display:flex;gap:3px;justify-content:center;">
          <button class="btn sm" onclick="fcExpand(${i})" title="Details anzeigen" style="color:var(--g);border-color:var(--gd)"><i class="ti ti-eye"></i></button>
          <button class="btn sm bl" onclick="fcCopyEntry(${i})" title="Vorlage kopieren"><i class="ti ti-copy"></i></button>
          <button class="btn sm ng" onclick="fcDel(${i})" title="Löschen"><i class="ti ti-trash"></i></button>
        </div>
      </td>
    </tr>
    <tr id="fc-exp-${i}" style="display:none">
      <td colspan="7" style="background:var(--p2);padding:12px 14px;font-size:11px;color:var(--mu);border-bottom:1px solid var(--bd);line-height:1.9;">
        <div style="white-space:pre-wrap;font-family:'Courier New',monospace;">${
          (`${e.name} | ${e.coid} | ${e.tatdat||'--'}
Codename: ${e.codename||''}
Telefonnummer: ${e.tel||''}
Behörde: ${e.behoerde||''}
Familie: ${e.familie||''}
Reisepass: ${e.reisepass||''}
Dienstausweis: ${e.dienstausweis||''}
Personalakte: ${e.personalakte||''}
PDA Hauptseite: ${e.pdaMain||''}
PDA Fahrzeugliste: ${e.pdaFz||''}

[Vorfall]
${e.vorfall||''}

[Befragung Tatverdächtiger]
${e.befragung||''}

[Zeugen-/aussagen]
${e.zeugen||''}

[Beweissammlung]
${e.beweise||''}

[Tatvorwurf]
${e.tatvorwurf||''}

[Schlussbetrachtung]
${e.schluss||''}`).replace(/</g,'&lt;').replace(/>/g,'&gt;')
        }</div>
      </td>
    </tr>`;
  }).join('');
}

// ===================== CID BEWEISE =====================
let CID_DATA = [];

function cidSave(){ cloudPush(); }

function cidAdd(){
  const orga=gv('cid-orga'), beamter=gv('cid-beamter').trim(), tat=gv('cid-tat').trim();
  if(!orga||!beamter||!tat){showToast('Orga, Beamter und Tatvorwürfe sind Pflichtfelder!');return;}

  // Zeitstempel automatisch
  const now=new Date();
  const ts=[
    String(now.getDate()).padStart(2,'0'),
    String(now.getMonth()+1).padStart(2,'0'),
    now.getFullYear()
  ].join('.')+' '+[
    String(now.getHours()).padStart(2,'0'),
    String(now.getMinutes()).padStart(2,'0')
  ].join(':');

  CID_DATA.push({
    ts,
    orga,
    beamter,
    pass:    gv('cid-pass').trim(),
    kfz:     gv('cid-kfz').trim(),
    gang:    gv('cid-gang'),
    tatdat:  gv('cid-tatdat'),
    tatzeit: gv('cid-tatzeit'),
    tat,
    clip:    gv('cid-clip').trim()
  });

  cidSave();
  ['cid-pass','cid-kfz','cid-tat','cid-clip','cid-beamter'].forEach(id=>sv2(id,''));
  sv2('cid-orga','');sv2('cid-gang','');
  const td=document.getElementById('cid-tatdat'); if(td) td.value='';
  const tt=document.getElementById('cid-tatzeit'); if(tt) tt.value='';
  cidRender();
  showToast('Eintrag gespeichert');
}

function cidDel(i){
  if(!confirm('Eintrag wirklich löschen?'))return;
  CID_DATA.splice(i,1);cidSave();cidRender();showToast('Gelöscht');
}

function cidRender(){
  const q=(gv('cid-search')||'').toLowerCase();
  const fo=gv('cid-filter-orga');
  let list=CID_DATA.filter(e=>{
    const okQ=!q||
      (e.beamter||'').toLowerCase().includes(q)||
      (e.orga||'').toLowerCase().includes(q)||
      (e.pass||'').includes(q)||
      (e.kfz||'').toLowerCase().includes(q)||
      (e.tat||'').toLowerCase().includes(q);
    const okO=!fo||e.orga===fo;
    return okQ&&okO;
  });

  const body=document.getElementById('cid-body');
  const empty=document.getElementById('cid-empty');
  const count=document.getElementById('cid-count');
  if(count) count.textContent=list.length+' Einträge';

  const KL_ORGA_COL={FIB:'#1e3a5f',LSPD:'#2f6fd6',SAHP:'#2f8f5b',LI:'#9333c4',EMS:'#dc3545',NG:'#0d9488',GOV:'#c2680a'};

  if(!list.length){
    if(body) body.innerHTML='';
    if(empty) empty.style.display='block';
    return;
  }
  if(empty) empty.style.display='none';
  if(body) body.innerHTML=list.map(e=>{
    const i=CID_DATA.indexOf(e);
    const col=KL_ORGA_COL[e.orga]||'var(--mu)';
    const tatShort=e.tat&&e.tat.length>40?e.tat.slice(0,40)+'...':e.tat||'--';
    const clipHtml=e.clip
      ? (e.clip.startsWith('http')
          ? `<a href="${e.clip}" target="_blank" style="color:var(--bl);font-size:11px;text-decoration:none;"><i class="ti ti-external-link"></i> Link</a>`
          : `<span style="font-size:11px;color:var(--mu)">${e.clip}</span>`)
      : '<span style="color:var(--mu);font-size:11px">--</span>';
    const tatDatFmt=e.tatdat?e.tatdat.split('-').reverse().join('.'):'--';
    return`<tr>
      <td style="font-size:10px;color:var(--mu);white-space:nowrap">${e.ts||'--'}</td>
      <td><span style="display:inline-block;font-size:10px;padding:1px 7px;border-radius:2px;border:1px solid ${col}55;background:${col}20;color:${col};font-weight:bold">${e.orga}</span></td>
      <td style="font-size:11px;font-weight:bold;white-space:nowrap">${e.beamter}</td>
      <td style="font-size:11px;color:var(--mu)">${e.pass||'--'}</td>
      <td style="font-size:11px;color:var(--mu)">${e.kfz||'--'}</td>
      <td style="font-size:11px;color:var(--mu);white-space:nowrap">${e.gang||'--'}</td>
      <td style="font-size:11px;color:var(--mu);white-space:nowrap">${tatDatFmt}</td>
      <td style="font-size:11px;color:var(--mu);white-space:nowrap">${e.tatzeit||'--'}</td>
      <td style="font-size:11px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${e.tat||''}">${tatShort}</td>
      <td>${clipHtml}</td>
      <td style="text-align:center;white-space:nowrap">
        <div style="display:flex;gap:3px;justify-content:center;">
          <button class="btn sm" onclick="cidExpand(${i})" title="Details" style="color:var(--g);border-color:var(--gd)"><i class="ti ti-eye"></i></button>
          <button class="btn sm ng" onclick="cidDel(${i})" title="Löschen"><i class="ti ti-trash"></i></button>
        </div>
      </td>
    </tr>
    <tr id="cid-exp-${i}" style="display:none">
      <td colspan="11" style="background:var(--p2);padding:10px 14px;font-size:11px;color:var(--mu);border-bottom:1px solid var(--bd)">
        <b style="color:var(--tx)">Vollständige Tatvorwürfe:</b><br>${(e.tat||'').replace(/\n/g,'<br>')}
        ${e.gang?`<br><br><b style="color:var(--tx)">Gang:</b> ${e.gang}`:''}
        ${e.clip?`<br><br><b style="color:var(--tx)">Clip:</b> <a href="${e.clip}" target="_blank" style="color:var(--bl)">${e.clip}</a>`:''}
      </td>
    </tr>`;
  }).join('');
}

function cidExpand(i){
  const row=document.getElementById('cid-exp-'+i);
  if(!row)return;
  row.style.display=row.style.display==='none'?'table-row':'none';
}

// ===================== TD AUSBILDUNG =====================
function tdSave(){ cloudPush(); }

function tdLookup(){
  const id=gv('td-pass-in').trim();
  const foundEl=document.getElementById('td-found');
  const fieldsEl=document.getElementById('td-fields');
  if(!id){
    foundEl.innerHTML='<span style="color:var(--mu);font-size:11px">Pass-ID eingeben</span>';
    fieldsEl.style.display='none';
    return;
  }
  const m=MA.find(x=>x.id===id);
  if(!m){
    foundEl.innerHTML='<span style="color:var(--re);font-size:11px"><i class="ti ti-x" style="font-size:11px"></i> Kein Treffer</span>';
    fieldsEl.style.display='none';
    return;
  }
  foundEl.innerHTML=`<span style="color:var(--gr);font-size:11px"><i class="ti ti-check" style="font-size:11px"></i> <b>${m.name}</b> · ${m.rank}</span>`;
  fieldsEl.style.display='block';
  sv2('td-passid',m.id);
  sv2('td-name-ed',m.name);
  sv2('td-rang-ed',m.rank);
  tdRenderList();
}

function tdRenderList(){
  const id=gv('td-passid');
  const tbody=document.getElementById('td-train-list');
  const empty=document.getElementById('td-train-empty');
  if(!tbody)return;
  if(!id){tbody.innerHTML='';if(empty)empty.style.display='none';return;}
  const trains=getTrainingsForId(id);
  if(!trains.length){tbody.innerHTML='';if(empty)empty.style.display='block';return;}
  if(empty)empty.style.display='none';
  tbody.innerHTML=trains.map(t=>`<tr>
    <td>${t.name}</td>
    <td style="text-align:right"><span class="train-badge ${t.passed?'train-pass':'train-fail'}">${t.passed?'BESTANDEN':'NICHT ABSOLVIERT'}</span></td>
    <td style="text-align:center"><button class="btn sm ng" onclick="tdRemoveTraining('${t.name.replace(/'/g,"\\'")}')" title="Aus TD-Liste entfernen (Sheet-Wert bleibt bestehen)"><i class="ti ti-x"></i></button></td>
  </tr>`).join('');
}

function tdSaveTraining(){
  const id=gv('td-passid');
  if(!id){showToast('Bitte zuerst eine Person suchen');return;}
  const name=gv('td-train-name').trim();
  if(!name){showToast('Trainingsname eingeben');return;}
  const passed=gv('td-train-status')==='1';
  if(!EXTRA_TRAININGS[id]) EXTRA_TRAININGS[id]=[];
  const existing=EXTRA_TRAININGS[id].find(t=>t.name.toLowerCase()===name.toLowerCase());
  if(existing) existing.passed=passed; else EXTRA_TRAININGS[id].push({name,passed});
  tdSave();
  sv2('td-train-name','');
  tdRenderList();
  buildMA();
  showToast('Ausbildung eingetragen — im Verzeichnis sichtbar');
}

function tdRemoveTraining(name){
  const id=gv('td-passid');
  if(!id||!EXTRA_TRAININGS[id])return;
  EXTRA_TRAININGS[id]=EXTRA_TRAININGS[id].filter(t=>t.name.toLowerCase()!==name.toLowerCase());
  tdSave();
  tdRenderList();
  buildMA();
  showToast('Entfernt');
}

// ===================== TD-KORREKTUREN VERWALTEN (Einstellungen, Admin) =====================
function renderTdCorrections(){
  const box=document.getElementById('td-corrections-list');
  if(!box)return;
  const ids=Object.keys(EXTRA_TRAININGS).filter(id=>EXTRA_TRAININGS[id]&&EXTRA_TRAININGS[id].length);
  if(!ids.length){box.innerHTML='<div class="kl-empty">Keine manuellen TD-Korrekturen vorhanden.</div>';return;}
  box.innerHTML=ids.map(id=>{
    const m=MA.find(x=>x.id===id);
    const nm=m?m.name:('Pass-ID '+id);
    const entries=EXTRA_TRAININGS[id];
    return `<div style="background:var(--p2);border:1px solid var(--bd);border-radius:6px;padding:9px 12px;margin-bottom:7px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <div style="font-size:11px;font-weight:bold;color:var(--tx);">${nm} <span style="color:var(--mu);font-weight:normal;">(${id})</span></div>
        <button class="btn sm ng" onclick="clearTdCorrectionsFor('${id}')"><i class="ti ti-trash"></i> Alle für diese Person löschen</button>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        ${entries.map(t=>`<span class="train-badge ${t.passed?'train-pass':'train-fail'}" style="cursor:pointer;" onclick="clearOneTdCorrection('${id}','${t.name.replace(/'/g,"\\'")}')" title="Klicken zum Entfernen">${t.name} <i class="ti ti-x" style="font-size:9px;"></i></span>`).join('')}
      </div>
    </div>`;
  }).join('');
}
function clearOneTdCorrection(id,name){
  if(!EXTRA_TRAININGS[id])return;
  EXTRA_TRAININGS[id]=EXTRA_TRAININGS[id].filter(t=>t.name.toLowerCase()!==name.toLowerCase());
  if(!EXTRA_TRAININGS[id].length) delete EXTRA_TRAININGS[id];
  cloudPush();
  renderTdCorrections();
  buildMA();
  showToast('Korrektur entfernt — Sheet-Wert gilt wieder');
}
function clearTdCorrectionsFor(id){
  delete EXTRA_TRAININGS[id];
  cloudPush();
  renderTdCorrections();
  buildMA();
  showToast('Korrekturen für diese Person entfernt');
}
function clearAllTdCorrections(){
  if(!confirm('Wirklich ALLE manuellen TD-Korrekturen für ALLE Personen löschen? Danach gelten wieder ausschließlich die Sheet-Werte.'))return;
  EXTRA_TRAININGS={};
  cloudPush();
  renderTdCorrections();
  buildMA();
  showToast('Alle TD-Korrekturen gelöscht');
}

// ===================== CIRG EVENTS + LOGS =====================
function cirgSave(){ cloudPush(); }

function cirgAddEvent(){
  const name=gv('ce-name').trim();
  if(!name){showToast('Event-Name ist Pflicht');return;}
  const id='ev'+Date.now();
  CIRG_EVENTS.push({
    id, name,
    desc: gv('ce-desc').trim(),
    date: document.getElementById('ce-date').value||''
  });
  cirgSave();
  sv2('ce-name','');sv2('ce-desc','');
  document.getElementById('ce-date').value='';
  cirgRenderEvents();
  cirgFillEventSelects();
  showToast('Event gespeichert');
}

function cirgDelEvent(id){
  if(!confirm('Event wirklich löschen? Zugehörige Logs bleiben erhalten, verlieren aber die Verknüpfung.'))return;
  CIRG_EVENTS=CIRG_EVENTS.filter(e=>e.id!==id);
  cirgSave();
  cirgRenderEvents();
  cirgFillEventSelects();
  showToast('Event gelöscht');
}

function cirgExpandEvent(id){
  const row=document.getElementById('ce-exp-'+id);
  if(!row)return;
  row.style.display=row.style.display==='none'?'block':'none';
}

function cirgRenderEvents(){
  const box=document.getElementById('ce-list');
  const empty=document.getElementById('ce-empty');
  const count=document.getElementById('ce-count');
  if(!box)return;
  if(count) count.textContent=CIRG_EVENTS.length+' Events';
  if(!CIRG_EVENTS.length){box.innerHTML='';if(empty)empty.style.display='block';return;}
  if(empty)empty.style.display='none';
  box.innerHTML=CIRG_EVENTS.map(e=>`
    <div style="background:var(--p2);border:1px solid var(--bd);border-radius:5px;padding:10px 13px;margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
        <div>
          <span style="font-weight:bold;color:var(--tx);font-size:12px;">${e.name}</span>
          ${e.date?`<span style="font-size:10px;color:var(--mu);margin-left:8px;">${fmtD(e.date)}</span>`:''}
        </div>
        <div style="display:flex;gap:4px;">
          <button class="btn sm" style="color:var(--g);border-color:var(--gd)" onclick="cirgExpandEvent('${e.id}')" title="Erklärung anzeigen"><i class="ti ti-eye"></i></button>
          <button class="btn sm ng" onclick="cirgDelEvent('${e.id}')" title="Löschen"><i class="ti ti-trash"></i></button>
        </div>
      </div>
      <div id="ce-exp-${e.id}" style="display:none;margin-top:8px;padding-top:8px;border-top:1px solid var(--bd);font-size:11px;color:var(--mu);line-height:1.7;white-space:pre-wrap;">
        ${e.desc?e.desc.replace(/</g,'&lt;'):'Keine Erklärung hinterlegt.'}
      </div>
    </div>`).join('');
}

function cirgFillEventSelects(){
  const selAdd=document.getElementById('cl-event');
  const selFilter=document.getElementById('cl-filter');
  if(selAdd){
    const cur=selAdd.value;
    selAdd.innerHTML='<option value="">-- kein Event / allgemein --</option>'+CIRG_EVENTS.map(e=>`<option value="${e.id}">${e.name}</option>`).join('');
    selAdd.value=cur;
  }
  if(selFilter){
    const cur=selFilter.value;
    selFilter.innerHTML='<option value="">Alle Events</option>'+CIRG_EVENTS.map(e=>`<option value="${e.id}">${e.name}</option>`).join('');
    selFilter.value=cur;
  }
}

function cirgAddLog(){
  const text=gv('cl-text').trim();
  if(!text){showToast('Log-Text ist Pflicht');return;}
  const eventId=gv('cl-event');
  const ev=CIRG_EVENTS.find(e=>e.id===eventId);
  const now=new Date();
  const ts=[String(now.getDate()).padStart(2,'0'),String(now.getMonth()+1).padStart(2,'0'),now.getFullYear()].join('.')+' '+[String(now.getHours()).padStart(2,'0'),String(now.getMinutes()).padStart(2,'0')].join(':');
  CIRG_LOGS.unshift({
    id:'lg'+Date.now(),
    eventId: eventId||'',
    eventName: ev?ev.name:'',
    text,
    author: currentName||currentUser||'--',
    ts
  });
  cirgSave();
  sv2('cl-text','');
  cirgRenderLogs();
  showToast('Log gespeichert');
}

function cirgDelLog(id){
  if(!confirm('Log-Eintrag wirklich löschen?'))return;
  CIRG_LOGS=CIRG_LOGS.filter(l=>l.id!==id);
  cirgSave();
  cirgRenderLogs();
  showToast('Gelöscht');
}

function cirgRenderLogs(){
  const box=document.getElementById('cl-list');
  const empty=document.getElementById('cl-empty');
  const count=document.getElementById('cl-count');
  if(!box)return;
  cirgFillEventSelects();
  const f=gv('cl-filter');
  const list=f?CIRG_LOGS.filter(l=>l.eventId===f):CIRG_LOGS;
  if(count) count.textContent=list.length+' Einträge';
  if(!list.length){box.innerHTML='';if(empty)empty.style.display='block';return;}
  if(empty)empty.style.display='none';
  box.innerHTML=list.map(l=>`
    <div style="background:var(--p2);border:1px solid var(--bd);border-radius:5px;padding:9px 13px;margin-bottom:7px;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:5px;">
        <div style="font-size:10px;color:var(--mu);">
          ${l.eventName?`<span style="color:var(--g);font-weight:bold;">${l.eventName}</span> · `:''}${l.ts} · ${l.author}
        </div>
        <button class="btn sm ng" onclick="cirgDelLog('${l.id}')" title="Löschen"><i class="ti ti-trash"></i></button>
      </div>
      <div style="font-size:11px;color:var(--tx);white-space:pre-wrap;line-height:1.6;">${l.text.replace(/</g,'&lt;')}</div>
    </div>`).join('');
}

// ===================== LAW AKTENSYSTEM =====================
function lawSave(){ cloudPush(); }

function lawAdd(){
  const mandant=gv('lw-mandant').trim(), akteId=gv('lw-akteid').trim();
  if(!mandant||!akteId){showToast('Mandant und Akten-ID sind Pflichtfelder!');return;}
  if(LAW_CASES.find(c=>c.akteId.toLowerCase()===akteId.toLowerCase())){
    showToast('⚠️ Akten-ID '+akteId+' bereits vorhanden!');
    const el=document.getElementById('lw-akteid');
    if(el){el.style.borderColor='var(--re)';setTimeout(()=>el.style.borderColor='',2000);}
    return;
  }
  LAW_CASES.push({
    mandant, akteId,
    pass: gv('lw-pass').trim(),
    datum: document.getElementById('lw-datum').value?fmtD(document.getElementById('lw-datum').value):'',
    status: gv('lw-status'),
    sachverhalt: gv('lw-sachverhalt').trim(),
    notizen: gv('lw-notizen').trim(),
    erstellt: gd()
  });
  lawSave();
  ['lw-mandant','lw-akteid','lw-pass','lw-sachverhalt','lw-notizen'].forEach(id=>sv2(id,''));
  document.getElementById('lw-datum').value='';
  sv2('lw-status','Offen');
  lawRender();
  showToast('Akte gespeichert');
}

function lawDel(i){
  if(!confirm('Akte wirklich löschen?'))return;
  LAW_CASES.splice(i,1);lawSave();lawRender();showToast('Gelöscht');
}

function lawExpand(i){
  const row=document.getElementById('lw-exp-'+i);
  if(!row)return;
  row.style.display=row.style.display==='none'?'table-row':'none';
}

function lawRender(){
  const q=(gv('lw-search')||'').toLowerCase();
  const f=gv('lw-filter');
  let list=LAW_CASES.filter(c=>{
    const okQ=!q||(c.mandant||'').toLowerCase().includes(q)||(c.akteId||'').toLowerCase().includes(q)||(c.pass||'').includes(q);
    const okF=!f||c.status===f;
    return okQ&&okF;
  });
  const body=document.getElementById('lw-body');
  const empty=document.getElementById('lw-empty');
  const count=document.getElementById('lw-count');
  if(!body)return;
  if(count) count.textContent=list.length+' Akten';
  const statusCol={Offen:'var(--wa)','In Bearbeitung':'var(--bl)','Vor Gericht':'var(--re)',Abgeschlossen:'var(--gr)',Archiviert:'var(--mu)'};
  if(!list.length){body.innerHTML='';if(empty)empty.style.display='block';return;}
  if(empty)empty.style.display='none';
  body.innerHTML=list.map(c=>{
    const i=LAW_CASES.indexOf(c);
    const col=statusCol[c.status]||'var(--mu)';
    return`<tr>
      <td style="color:var(--g);font-size:11px;white-space:nowrap;font-family:'SF Mono','Consolas',monospace;font-weight:600;">${c.akteId}</td>
      <td style="font-weight:bold">${c.mandant}</td>
      <td style="font-size:11px;color:var(--mu);white-space:nowrap">${c.datum||'--'}</td>
      <td><span style="display:inline-block;font-size:10px;padding:1px 7px;border-radius:2px;border:1.5px solid ${col};background:${col}12;color:${col};font-weight:700;letter-spacing:.03em;transform:rotate(-2deg);">${c.status}</span></td>
      <td style="font-size:11px;color:var(--mu);white-space:nowrap">${c.erstellt||'--'}</td>
      <td style="text-align:center;white-space:nowrap">
        <div style="display:flex;gap:3px;justify-content:center;">
          <button class="btn sm" onclick="lawExpand(${i})" title="Details" style="color:var(--g);border-color:var(--gd)"><i class="ti ti-eye"></i></button>
          <button class="btn sm ng" onclick="lawDel(${i})" title="Löschen"><i class="ti ti-trash"></i></button>
        </div>
      </td>
    </tr>
    <tr id="lw-exp-${i}" style="display:none">
      <td colspan="6" style="background:var(--p2);padding:10px 14px;font-size:11px;color:var(--mu);border-bottom:1px solid var(--bd);line-height:1.8;">
        <b style="color:var(--tx)">Reisepass:</b> ${c.pass||'--'}<br>
        <b style="color:var(--tx)">Sachverhalt:</b><br>${(c.sachverhalt||'--').replace(/</g,'&lt;').replace(/\n/g,'<br>')}
        ${c.notizen?`<br><br><b style="color:var(--tx)">Notizen:</b><br>${c.notizen.replace(/</g,'&lt;').replace(/\n/g,'<br>')}`:''}
      </td>
    </tr>`;
  }).join('');
}



