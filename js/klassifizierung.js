// FIB Personalabteilung · Klassifizierung (Orga-Kontakte)
// ===================== KLASSIFIZIERUNG =====================
const KL_ORGA_COLORS={FIB:'#1e3a5f',LSPD:'#2f6fd6',SAHP:'#2f8f5b',LI:'#9333c4',EMS:'#dc3545',NG:'#0d9488',GOV:'#c2680a'};
let KL_DATA=[];
let EXTRA_TRAININGS={}; // { [Pass-ID]: [{name,passed}, ...] } -- von TD zusaetzlich erfasste/korrigierte Ausbildungen
let CIRG_EVENTS=[];     // [{id,name,desc,date}]
let CIRG_LOGS=[];       // [{id,eventId,eventName,text,author,ts}]
let LAW_CASES=[];       // [{id,mandant,akteId,datum,status,sachverhalt,notizen,erstellt}]
let MA_ORDER=[];        // Reihenfolge (Pass-IDs) für manuell sortiertes Mitarbeiterverzeichnis
let KL_ORGA='Alle';

function klLoad(){try{const d=localStorage.getItem('fib_kl');if(d)KL_DATA=JSON.parse(d);}catch(e){}}
function klSave(){cloudPush();}

function klAdd(){
  const orga=gv('kl-orga'),name=gv('kl-name').trim(),id=gv('kl-id').trim(),rang=gv('kl-rang').trim(),tel=gv('kl-tel').trim(),info=gv('kl-info').trim();
  if(!orga||!name){showToast('Orga und Name sind Pflichtfelder!');return;}

  // Duplikat-Prüfung: gleicher Name UND gleiche Orga
  const dup = KL_DATA.find(e =>
    e.name.toLowerCase() === name.toLowerCase() && e.orga === orga
  );
  if(dup){
    showToast('⚠️ '+name+' ist in '+orga+' bereits eingetragen!');
    // Felder rot markieren
    const nf=document.getElementById('kl-name');
    const of2=document.getElementById('kl-orga');
    [nf,of2].forEach(el=>{if(el){el.style.borderColor='var(--re)';setTimeout(()=>el.style.borderColor='',2000);}});
    return;
  }

  // Orga-Tab auf die neue Orga setzen
  const savedOrga = orga;
  KL_DATA.push({orga,name,id,rang,tel,info});
  klSave();
  // Formular leeren aber Orga behalten
  sv2('kl-name','');sv2('kl-id','');sv2('kl-rang','');sv2('kl-tel','');sv2('kl-info','');
  // Tab auf die eingetragene Orga wechseln
  const tab = document.querySelector(`#kl-orga-tabs .orga-tab[data-orga="${savedOrga}"]`);
  if(tab) klSwitch(tab);
  else klRender();
  showToast('Eintrag hinzugefügt');
}

function klDel(i){
  if(!confirm('Eintrag wirklich löschen?'))return;
  KL_DATA.splice(i,1);
  klSave();
  klRender();
  showToast('Gelöscht');
}

function klSwitch(el){
  document.querySelectorAll('#kl-orga-tabs .orga-tab').forEach(t=>t.classList.remove('act'));
  el.classList.add('act');
  KL_ORGA=el.dataset.orga;
  klRender();
}

function klRender(){
  const q=(gv('kl-search')||'').toLowerCase();
  let list=KL_ORGA==='Alle'?KL_DATA:KL_DATA.filter(e=>e.orga===KL_ORGA);
  if(q)list=list.filter(e=>(e.name||'').toLowerCase().includes(q)||(e.id||'').includes(q)||(e.rang||'').toLowerCase().includes(q)||(e.tel||'').includes(q)||(e.info||'').toLowerCase().includes(q));

  const body=document.getElementById('kl-body');
  const empty=document.getElementById('kl-empty');
  const count=document.getElementById('kl-count');
  const title=document.getElementById('kl-list-title');

  title.textContent=KL_ORGA==='Alle'?'[ Alle Einträge ]':'[ '+KL_ORGA+' ]';
  count.textContent=list.length+' Einträge';

  if(!list.length){
    body.innerHTML='';
    empty.style.display='block';
  } else {
    empty.style.display='none';
    body.innerHTML=list.map((e)=>{
      const ri=KL_DATA.indexOf(e);
      const col=KL_ORGA_COLORS[e.orga]||'var(--mu)';
      const nameSafe=e.name.replace(/'/g,"\\'");
      return`<tr draggable="true" data-ri="${ri}" class="kl-drag-row" style="cursor:grab;">
        <td>
          <span style="color:var(--mu);font-size:14px;vertical-align:middle;margin-right:5px;cursor:grab" title="Ziehen zum Sortieren">⠿</span>
          <span style="display:inline-block;font-size:10px;padding:1px 8px;border-radius:2px;border:1px solid ${col}55;background:${col}20;color:${col};font-weight:bold;letter-spacing:.05em">${e.orga}</span>
        </td>
        <td style="font-weight:bold">${e.name}</td>
        <td style="color:var(--mu);font-size:11px">${e.id||'--'}</td>
        <td style="font-size:11px">${e.rang||'--'}</td>
        <td style="color:var(--bl);font-size:11px">${e.tel||'--'}</td>
        <td style="color:var(--mu);font-size:10px;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${(e.info||'').replace(/"/g,'&quot;')}">${e.info||'--'}</td>
        <td style="text-align:center;white-space:nowrap">
          <div style="display:flex;gap:3px;justify-content:center;">
            <button class="btn sm bl" onclick="klCopyName('${nameSafe}')" title="Name kopieren"><i class="ti ti-user"></i></button>
            <button class="btn sm" onclick="klOpenEdit(${ri})" title="Bearbeiten" style="color:var(--g);border-color:var(--gd)"><i class="ti ti-edit"></i></button>
            <button class="btn sm ng" onclick="klDel(${ri})" title="Löschen"><i class="ti ti-trash"></i></button>
          </div>
        </td>
      </tr>`;
    }).join('');

    // Drag & Drop initialisieren
    klInitDrag();
  }

  // Tab-Zahler aktualisieren
  ['Alle','FIB','LSPD','SAHP','LI','EMS','NG','GOV'].forEach(o=>{
    const tab=document.querySelector(`#kl-orga-tabs .orga-tab[data-orga="${o}"]`);
    if(!tab)return;
    const cnt=o==='Alle'?KL_DATA.length:KL_DATA.filter(e=>e.orga===o).length;
    let badge=tab.querySelector('.orga-cnt');
    if(cnt>0){
      if(!badge){badge=document.createElement('span');badge.className='orga-cnt';tab.appendChild(badge);}
      badge.textContent=cnt;
    } else {
      if(badge)badge.remove();
    }
  });
}

function klInitDrag(){
  const rows=document.querySelectorAll('.kl-drag-row');
  let dragSrc=null;

  rows.forEach(row=>{
    row.addEventListener('dragstart',function(e){
      dragSrc=this;
      this.style.opacity='0.4';
      e.dataTransfer.effectAllowed='move';
      e.dataTransfer.setData('text/plain', this.dataset.ri);
    });
    row.addEventListener('dragend',function(){
      this.style.opacity='1';
      document.querySelectorAll('.kl-drag-row').forEach(r=>{
        r.style.borderTop='';
        r.style.borderBottom='';
      });
    });
    row.addEventListener('dragover',function(e){
      e.preventDefault();
      e.dataTransfer.dropEffect='move';
      document.querySelectorAll('.kl-drag-row').forEach(r=>{r.style.borderTop='';r.style.borderBottom='';});
      // Zeige Linie oben oder unten je nach Mausposition
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
      const fromRi=parseInt(e.dataTransfer.getData('text/plain'));
      const toRi=parseInt(this.dataset.ri);
      if(isNaN(fromRi)||isNaN(toRi)||fromRi===toRi)return;

      // Bestimme ob vor oder nach dem Ziel eingefügt werden soll
      const rect=this.getBoundingClientRect();
      const insertAfter=e.clientY>=(rect.top+rect.height/2);

      // Element aus Array entfernen
      const item=KL_DATA.splice(fromRi,1)[0];

      // Neue Position berechnen (nach dem Entfernen verschiebt sich der Index)
      let insertAt=KL_DATA.indexOf(KL_DATA.find((_,i)=>i===(fromRi<toRi?toRi-1:toRi)));
      // Einfacher: direkt über den aktuellen toRi-Wert nach Entfernen
      let newIdx=toRi>fromRi?toRi-1:toRi;
      if(insertAfter) newIdx++;
      newIdx=Math.max(0,Math.min(newIdx,KL_DATA.length));

      KL_DATA.splice(newIdx,0,item);
      klSave();
      klRender();
    });
  });
}

function klCopyName(name){
  navigator.clipboard.writeText(name).then(()=>showToast('Name kopiert: '+name)).catch(()=>{});
}

function klOpenEdit(ri){
  const e=KL_DATA[ri];if(!e)return;
  document.getElementById('kl-edit-idx').value=ri;
  document.getElementById('kl-edit-orga').value=e.orga||'';
  document.getElementById('kl-edit-name').value=e.name||'';
  document.getElementById('kl-edit-id').value=e.id||'';
  document.getElementById('kl-edit-rang').value=e.rang||'';
  document.getElementById('kl-edit-tel').value=e.tel||'';
  document.getElementById('kl-edit-info').value=e.info||'';
  document.getElementById('kl-modal').classList.add('show');
}

function klCloseModal(){document.getElementById('kl-modal').classList.remove('show');}

function klSaveModal(){
  const ri=parseInt(document.getElementById('kl-edit-idx').value);
  const orga=document.getElementById('kl-edit-orga').value;
  const name=document.getElementById('kl-edit-name').value.trim();
  if(!orga||!name){showToast('Orga und Name sind Pflichtfelder!');return;}
  KL_DATA[ri]={
    orga,name,
    id:document.getElementById('kl-edit-id').value.trim(),
    rang:document.getElementById('kl-edit-rang').value.trim(),
    tel:document.getElementById('kl-edit-tel').value.trim(),
    info:document.getElementById('kl-edit-info').value.trim()
  };
  klSave();klRender();klCloseModal();showToast('Eintrag gespeichert');
}

document.getElementById('kl-modal').addEventListener('click',function(e){if(e.target===this)klCloseModal();});

function klCopyList(orga){
  const list=orga==='Alle'?KL_DATA:KL_DATA.filter(e=>e.orga===orga);
  if(!list.length){showToast('Keine Einträge vorhanden');return;}
  const groups={};
  list.forEach(e=>{if(!groups[e.orga])groups[e.orga]=[];groups[e.orga].push(e);});
  const mask=(str)=>{if(!str||str==='--')return'--';return'||'+str+'||';};
  const emoji_map={FIB:'🟡',LSPD:'🔵',SAHP:'🟢',LI:'🟣',EMS:'🔴',NG:'🩵',GOV:'🟠'};
  let out='';
  Object.keys(groups).forEach(org=>{
    const emoji=emoji_map[org]||'⚪';
    out+=`${emoji} **${org}**\n`;
    groups[org].forEach(e=>{
      out+=`${e.name} | ${e.rang||'--'} | ID: ${mask(e.id)} | Tel: ${mask(e.tel)}${e.info?` | ${e.info}`:''}\n`;
    });
    out+='\n';
  });
  navigator.clipboard.writeText(out.trim()).then(()=>showToast('Liste für Discord kopiert!')).catch(()=>{});
}

