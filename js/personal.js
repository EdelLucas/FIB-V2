// FIB Personalabteilung · Helfer, Mitarbeiterverzeichnis, Pass-Lookup
function gv(id){const e=document.getElementById(id);return e?e.value:'';}
function sv2(id,v){const e=document.getElementById(id);if(e)e.value=v;}
function setOb(id,v){const e=document.getElementById(id);if(e)e.textContent=v;}
function fmtD(raw){if(!raw)return'--';if(raw.includes('.'))return raw;const d=new Date(raw);return[String(d.getDate()).padStart(2,'0'),String(d.getMonth()+1).padStart(2,'0'),d.getFullYear()].join('.');}
function gd(){return fmtD(new Date().toISOString().slice(0,10));}
function rankCls(r){const n=parseInt(r);if(n>=26)return'rh';if(n>=20)return'rm';return'rl';}

// --- ABSENDER ---
function loadAbs(){try{const d=localStorage.getItem('fib_abs');if(d)return JSON.parse(d);}catch(e){}return{name:'',rang:'',abt:''};}
function syncFromCfg(){
  const name=gv('cfg-name'),rang=gv('cfg-rang'),abt=gv('cfg-abt');
  try{localStorage.setItem('fib_abs',JSON.stringify({name,rang,abt}));}catch(e){}
  [upRa,upEs,upKu,upAz,upSa,upPa].forEach(f=>f());
}
function loadAbsIntoFields(){const a=loadAbs();sv2('cfg-name',a.name||'');sv2('cfg-rang',a.rang||'');sv2('cfg-abt',a.abt||'');}
function absLine(){
  const name=gv('cfg-name'),rang=gv('cfg-rang'),abt=gv('cfg-abt');
  if(!name&&!abt&&!rang)return'';
  let line='\n\n';
  if(name)line+=name+'\n';
  if(abt)line+=abt+'\n';
  if(rang)line+=rang;
  return line.trimEnd();
}

// --- TABLE ---
function parseAusbList(str){
  if(!str)return[];
  return str.split(/[,;\/|]+/).map(s=>s.trim()).filter(Boolean);
}
function buildMA(){
  const s=(maPage-1)*PER,sl=filtered.slice(s,s+PER);
  document.getElementById('ma-body').innerHTML=sl.map(m=>{
    const baseTrains=(m.trainings&&m.trainings.length)?m.trainings:parseAusbList(m.ausb).map(n=>({name:n,passed:true}));
    const trains=mergeTrainings(baseTrains,m.id);
    const passCount=trains.filter(t=>t.passed).length;
    const safeId=String(m.id).replace(/[^a-zA-Z0-9_-]/g,'_');
    const midSafe=String(m.id).replace(/'/g,"\\'");
    return `<tr draggable="true" data-mid="${midSafe}" class="ma-drag-row" style="cursor:grab;">
    <td style="color:var(--mu);font-size:11px"><span style="color:var(--mu);font-size:14px;vertical-align:middle;margin-right:5px;cursor:grab" title="Ziehen zum Sortieren">⠿</span>${m.id}</td>
    <td style="font-weight:bold">${m.name}</td>
    <td><span class="rb ${rankCls(m.rank)}">${m.rank}</span></td>
    <td style="color:var(--g)">${m.dn||'--'}</td>
    <td style="color:var(--mu);font-size:11px">${m.div||'--'}</td>
    <td style="color:var(--mu);font-size:10px;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${m.abt||''}">${m.abt||'--'}</td>
    <td style="color:#2f6fd6;font-size:10px;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
      ${trains.length?`<span style="cursor:pointer;border-bottom:1px dotted #2f6fd6" onclick="maExpandTrainings('${safeId}')">${passCount}/${trains.length} bestanden</span>`:'--'}
    </td>
    <td style="color:${m.strike==='0/3'?'var(--gr)':'var(--re)'}">${m.strike||'0/3'}</td>
    <td style="color:var(--mu);font-size:11px;white-space:nowrap">${m.date||'--'}</td>
    <td style="text-align:center;white-space:nowrap">
      ${trains.length?`<button class="btn sm" style="color:var(--bl);border-color:rgba(47,111,214,.35)" onclick="maExpandTrainings('${safeId}')" title="Ausbildungen anzeigen"><i class="ti ti-school"></i></button>`:''}
      <button class="btn sm bl" onclick="openEdit('${m.id}')" title="Bearbeiten"><i class="ti ti-edit"></i></button>
      <button class="btn sm ng" onclick="delMA('${m.id}')" title="Löschen"><i class="ti ti-trash"></i></button>
    </td></tr>
    <tr id="ma-exp-${safeId}" style="display:none">
      <td colspan="10" style="background:var(--p2);padding:10px 14px;border-bottom:1px solid var(--bd);">
        <div style="font-size:10px;color:var(--mu);letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px;">Ausbildungen / Schulungen — ${m.name}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          ${trains.length?trains.map(t=>`<span class="train-badge ${t.passed?'train-pass':'train-fail'}">${t.name}</span>`).join(''):'<span style="font-size:11px;color:var(--mu)">Keine Ausbildungen hinterlegt.</span>'}
        </div>
      </td>
    </tr>`;
  }).join('');
  const cnt=document.getElementById('ma-count');
  if(cnt)cnt.textContent=`${Math.min(s+1,filtered.length)}-${Math.min(s+PER,filtered.length)} von ${filtered.length}`;
  const b=document.getElementById('ma-badge');if(b)b.textContent=MA.length+' AGENTEN';
  const dc=document.getElementById('dash-count');if(dc)animateCount(dc,MA.length);
  const cc=document.getElementById('cfg-count');if(cc)cc.textContent=MA.length;
  renderDashboard();
  buildPgr();
  maInitDrag();
}
function maExpandTrainings(safeId){
  const row=document.getElementById('ma-exp-'+safeId);
  if(!row)return;
  row.style.display=row.style.display==='none'?'table-row':'none';
}
function buildPgr(){
  const total=Math.ceil(filtered.length/PER),pgr=document.getElementById('ma-pgr');if(!pgr)return;
  if(total<=1){pgr.innerHTML='';return;}
  let h='<button onclick="maGo(maPage-1)">&#x2039;</button>';
  for(let i=1;i<=total;i++)h+=`<button class="${i===maPage?'cur':''}" onclick="maGo(${i})">${i}</button>`;
  pgr.innerHTML=h+'<button onclick="maGo(maPage+1)">&#x203a;</button>';
}
function maGo(p){const t=Math.ceil(filtered.length/PER);maPage=Math.max(1,Math.min(p,t));buildMA();}

// Sortiert MA anhand der gespeicherten Reihenfolge (MA_ORDER). Neue/unbekannte IDs
// (z.B. neu aus dem Sheet) werden hinten angehängt, in ihrer bisherigen Reihenfolge.
function applyMaOrder(){
  if(!MA_ORDER||!MA_ORDER.length)return;
  const byId={};
  MA.forEach(m=>{byId[m.id]=m;});
  const ordered=[];
  MA_ORDER.forEach(id=>{if(byId[id]){ordered.push(byId[id]);delete byId[id];}});
  MA.forEach(m=>{if(byId[m.id])ordered.push(m);}); // Rest in urspruenglicher Reihenfolge anhangen
  MA=ordered;
}
function saveMaOrder(){
  MA_ORDER=MA.map(m=>m.id);
  cloudPush();
}

function maInitDrag(){
  const rows=document.querySelectorAll('.ma-drag-row');
  let dragSrc=null;

  rows.forEach(row=>{
    row.addEventListener('dragstart',function(e){
      dragSrc=this;
      this.style.opacity='0.4';
      e.dataTransfer.effectAllowed='move';
      e.dataTransfer.setData('text/plain', this.dataset.mid);
    });
    row.addEventListener('dragend',function(){
      this.style.opacity='1';
      document.querySelectorAll('.ma-drag-row').forEach(r=>{r.style.borderTop='';r.style.borderBottom='';});
    });
    row.addEventListener('dragover',function(e){
      e.preventDefault();
      e.dataTransfer.dropEffect='move';
      document.querySelectorAll('.ma-drag-row').forEach(r=>{r.style.borderTop='';r.style.borderBottom='';});
      const rect=this.getBoundingClientRect();
      const mid=rect.top+rect.height/2;
      if(e.clientY<mid) this.style.borderTop='2px solid var(--g)';
      else this.style.borderBottom='2px solid var(--g)';
    });
    row.addEventListener('dragleave',function(){
      this.style.borderTop='';
      this.style.borderBottom='';
    });
    row.addEventListener('drop',function(e){
      e.preventDefault();
      if(dragSrc===this)return;
      const fromId=e.dataTransfer.getData('text/plain');
      const toId=this.dataset.mid;
      if(!fromId||!toId||fromId===toId)return;

      const fromIdx=MA.findIndex(m=>String(m.id)===fromId);
      let toIdx=MA.findIndex(m=>String(m.id)===toId);
      if(fromIdx===-1||toIdx===-1)return;

      const rect=this.getBoundingClientRect();
      const insertAfter=e.clientY>=(rect.top+rect.height/2);

      const item=MA.splice(fromIdx,1)[0];
      toIdx=MA.findIndex(m=>String(m.id)===toId); // Index nach dem Entfernen neu ermitteln
      let newIdx=insertAfter?toIdx+1:toIdx;
      newIdx=Math.max(0,Math.min(newIdx,MA.length));
      MA.splice(newIdx,0,item);

      saveMaOrder();
      filterMA();
      showToast('Reihenfolge gespeichert');
    });
  });
}

function filterMA(){
  const q=gv('ma-search').toLowerCase(),f=gv('ma-filter');
  filtered=MA.filter(m=>{
    const ok=!q||(m.name.toLowerCase().includes(q)||m.id.includes(q)||m.rank.toLowerCase().includes(q)||(m.abt||'').toLowerCase().includes(q)||(m.dn||'').includes(q)||(m.ausb||'').toLowerCase().includes(q)||(m.notes||'').toLowerCase().includes(q));
    return ok&&(!f||m.div===f);
  });
  maPage=1;buildMA();
}
function delMA(id){if(!confirm('Mitarbeiter wirklich löschen?'))return;MA=MA.filter(m=>m.id!==id);saveMA();filtered=filtered.filter(m=>m.id!==id);buildMA();refreshSelects();}

// --- MODAL ---
function fillRankSel(){const s=document.getElementById('m-rank');if(!s||s.options.length>1)return;RANKS.forEach(r=>{const o=document.createElement('option');o.value=r;o.textContent=r;s.appendChild(o);});}
function openAddModal(){
  fillRankSel();
  document.getElementById('modal-title').textContent='Mitarbeiter hinzufügen';
  document.getElementById('modal-eid').value='';
  ['m-id','m-name','m-dn','m-abt','m-ausb','m-notes'].forEach(id=>sv2(id,''));
  sv2('m-rank','');sv2('m-div','');sv2('m-strike','0/3');sv2('m-status','Aktiv');
  document.getElementById('m-date').value='';
  document.getElementById('ma-modal').classList.add('show');
}
function openEdit(id){
  fillRankSel();
  const m=MA.find(x=>x.id===id);if(!m)return;
  document.getElementById('modal-title').textContent='Mitarbeiter bearbeiten';
  document.getElementById('modal-eid').value=id;
  sv2('m-id',m.id);sv2('m-name',m.name);sv2('m-rank',m.rank);sv2('m-dn',m.dn||'');
  sv2('m-div',m.div||'');sv2('m-abt',m.abt||'');sv2('m-ausb',m.ausb||'');
  sv2('m-strike',m.strike||'0/3');sv2('m-status',m.status||'Aktiv');sv2('m-notes',m.notes||'');
  const dv=m.date&&m.date.includes('.')?m.date.split('.').reverse().join('-'):(m.date||'');
  document.getElementById('m-date').value=dv;
  document.getElementById('ma-modal').classList.add('show');
}
function closeModal(){document.getElementById('ma-modal').classList.remove('show');}
function saveModal(){
  const eid=gv('modal-eid'),nid=gv('m-id').trim();
  if(!nid||!gv('m-name').trim()||!gv('m-rank')){alert('Bitte Pass-ID, Name und Rang ausfüllen.');return;}
  if(!eid&&MA.find(m=>m.id===nid)){alert('Pass-ID bereits vorhanden!');return;}
  const dv=document.getElementById('m-date').value;
  const entry={id:nid,name:gv('m-name').trim(),rank:gv('m-rank'),dn:gv('m-dn').trim(),div:gv('m-div'),abt:gv('m-abt').trim(),ausb:gv('m-ausb').trim(),strike:gv('m-strike'),status:gv('m-status'),notes:gv('m-notes').trim(),date:dv?fmtD(dv):''};
  if(eid){const i=MA.findIndex(m=>m.id===eid);if(i>=0)MA[i]=entry;}else MA.push(entry);
  saveMA();filtered=[...MA];filterMA();refreshSelects();closeModal();showToast('Gespeichert');
}
document.getElementById('ma-modal').addEventListener('click',function(e){if(e.target===this)closeModal();});

// --- PASS LOOKUP ---
function lookupPass(pfx){
  const inp=document.getElementById(pfx+'-pass-in');if(!inp)return;
  const val=inp.value.trim();
  const foundEl=document.getElementById(pfx+'-found');
  const fieldsEl=document.getElementById(pfx+'-fields');
  if(!val){
    if(foundEl)foundEl.innerHTML='<span style="color:var(--mu);font-size:11px">Pass-ID oder Name eingeben</span>';
    if(fieldsEl)fieldsEl.style.display='none';
    return;
  }
  let m=MA.find(x=>x.id===val);
  if(!m){
    const q=val.toLowerCase();
    const hits=MA.filter(x=>x.name.toLowerCase().includes(q));
    if(hits.length===1){m=hits[0];}
    else if(hits.length>1){
      if(foundEl)foundEl.innerHTML=`<span style="color:var(--g);font-size:11px"><i class="ti ti-search" style="font-size:11px"></i> ${hits.length} Treffer — Pass-ID prazisieren</span>`;
      if(fieldsEl)fieldsEl.style.display='none';
      return;
    }
  }
  if(!m){
    if(foundEl)foundEl.innerHTML='<span style="color:var(--re);font-size:11px"><i class="ti ti-x" style="font-size:11px"></i> Kein Treffer</span>';
    if(fieldsEl)fieldsEl.style.display='none';
    return;
  }
  if(foundEl)foundEl.innerHTML=`<span style="color:var(--gr);font-size:11px"><i class="ti ti-check" style="font-size:11px"></i> <b>${m.name}</b> · ${m.rank}</span>`;
  if(fieldsEl)fieldsEl.style.display='block';
  if(pfx==='ra'){
    sv2('ra-name',m.name);sv2('ra-dn',m.dn||'');
    sv2('ra-name-ed',m.name);sv2('ra-dn-ed',m.dn||'');
    sv2('ra-abt-ed',m.abt||'');sv2('ra-strike-ed',m.strike||'0/3');
    sv2('ra-old',m.rank);
    const ri=RANKS.indexOf(m.rank);
    sv2('ra-new',ri>0?RANKS[ri-1]:'');
    upRa();
  }
  if(pfx==='es'){sv2('es-dn',m.dn||'');sv2('es-name',m.name);sv2('es-name-ed',m.name);sv2('es-dn-ed',m.dn||'');upEs();}
  if(pfx==='ku'){
    sv2('ku-dn',m.dn||'');sv2('ku-name',m.name);sv2('ku-rang',m.rank);
    sv2('ku-name-ed',m.name);sv2('ku-dn-ed',m.dn||'');
    sv2('ku-rang-ed',m.rank);sv2('ku-abt-ed',m.abt||'');upKu();
  }
  if(pfx==='az'){
    sv2('az-name',m.name);sv2('az-pass',m.id);sv2('az-rang',m.rank);
    sv2('az-name-ed',m.name);sv2('az-pass-ed',m.id);
    sv2('az-rang-ed',m.rank);sv2('az-abt-ed',m.abt||'');upAz();
  }
  if(pfx==='sa'){
    sv2('sa-dn',m.dn||'');sv2('sa-name',m.name);
    sv2('sa-name-ed',m.name);sv2('sa-dn-ed',m.dn||'');
    sv2('sa-rang-ed',m.rank);sv2('sa-strike-ed',m.strike||'0/3');upSa();
  }
  if(pfx==='pa'){
    sv2('pa-dn',m.dn||'');sv2('pa-name',m.name);sv2('pa-rang',m.rank);sv2('pa-abt',m.abt==='--'?'':m.abt||'');
    sv2('pa-name-ed',m.name);sv2('pa-dn-ed',m.dn||'');
    sv2('pa-rang-ed',m.rank);sv2('pa-abt-ed',m.abt==='--'?'':m.abt||'');
    sv2('pa-strike-ed',m.strike||'0/3');
    const dv=m.date&&m.date.includes('.')?m.date.split('.').reverse().join('-'):(m.date||'');
    const dtEl=document.getElementById('pa-datum');if(dtEl)dtEl.value=dv;
    upPa();
  }
}

function refreshSelects(){}
function fillSelects(){
  ['ra-old','ra-new','es-rang'].forEach(id=>{const s=document.getElementById(id);if(!s)return;RANKS.forEach(r=>{const o=document.createElement('option');o.value=r;o.textContent=r;s.appendChild(o);});});
}

