// FIB Personalabteilung · Klassifizierung (Kontakte anderer Organisationen)
let KL_ORGA='Alle';
let _klEditKey=null;

function klFormValues(p){
  return{orga:gv(p+'-orga'),name:gv(p+'-name').trim(),id:gv(p+'-id').trim(),rang:gv(p+'-rang').trim(),tel:gv(p+'-tel').trim(),info:gv(p+'-info').trim()};
}
async function klAdd(){
  if(!requireFields([['kl-orga','Organisation wählen'],['kl-name','Name eingeben']]))return;
  const v=klFormValues('kl');
  if(DB.kl.some(e=>e.orga===v.orga&&(e.name||'').toLowerCase()===v.name.toLowerCase())){
    fieldError('kl-name',`${v.name} ist in ${v.orga} bereits eingetragen`);return;
  }
  // "id" ist hier die Pass-ID (Altbestand) – der interne Schlüssel heißt "key"
  const entry={...v,key:uid('kl')};
  await cloudMutate('kl',list=>{
    if(list.some(e=>e.orga===v.orga&&(e.name||'').toLowerCase()===v.name.toLowerCase()))return undefined;
    list.push(entry);return list;
  });
  clearForm(['kl-name','kl-id','kl-rang','kl-tel','kl-info']);
  klSwitch(v.orga);
  showToast('Eintrag hinzugefügt');
}
// Klassifizierungs-Einträge nutzen "id" für die Pass-ID → eigener Schlüssel
function klKey(e){ return e.key||('h'+_hash(JSON.stringify(e,Object.keys(e||{}).sort()))); }
function klFind(list,k){ return list.find(e=>klKey(e)===k); }

async function klDel(k){
  let removed=null,index=-1;
  await cloudMutate('kl',list=>{
    index=list.findIndex(e=>klKey(e)===k);
    if(index<0)return undefined;
    removed=list.splice(index,1)[0];return list;
  });
  if(!removed)return;
  showToast(`${removed.name} gelöscht`,{action:{label:'Rückgängig',fn:()=>{
    cloudMutate('kl',list=>{ if(klFind(list,klKey(removed)))return undefined; list.splice(Math.min(index,list.length),0,removed); return list; })
      .then(()=>showToast('Wiederhergestellt')).catch(()=>{});
  }}});
}
function klSwitch(orga){
  KL_ORGA=orga;
  document.querySelectorAll('#kl-orga-tabs .orga-tab').forEach(t=>t.classList.toggle('act',t.dataset.orga===orga));
  klRender();
}
function klRender(){
  const data=DB.kl||[];
  const q=gv('kl-search').toLowerCase().trim();
  let list=KL_ORGA==='Alle'?data:data.filter(e=>e.orga===KL_ORGA);
  if(q)list=list.filter(e=>[e.name,e.id,e.rang,e.tel,e.info].join(' ').toLowerCase().includes(q));
  setOb('kl-list-title',KL_ORGA==='Alle'?'Alle Einträge':KL_ORGA);
  setOb('kl-count',list.length+' Einträge');
  fillTable('kl-body',list.map(e=>{
    const k=klKey(e);
    return`<tr draggable="true" data-key="${esc(k)}" class="drag-row">
      <td><span class="grip" title="Ziehen zum Sortieren">⠿</span>${orgaBadge(e.orga)}</td>
      <td class="strong">${esc(e.name)}</td>
      <td class="mono muted">${esc(e.id||'--')}</td>
      <td>${esc(e.rang||'--')}</td>
      <td class="info-text">${esc(e.tel||'--')}</td>
      <td class="muted small clip" title="${esc(e.info)}">${esc(e.info||'--')}</td>
      <td class="actions">
        <button class="btn sm icon" data-action="kl-copy-name" data-arg="${esc(k)}" title="Name kopieren"><i class="ti ti-copy"></i></button>
        <button class="btn sm icon" data-action="kl-edit" data-arg="${esc(k)}" title="Bearbeiten"><i class="ti ti-edit"></i></button>
        <button class="btn sm icon danger" data-action="kl-del" data-arg="${esc(k)}" title="Löschen"><i class="ti ti-trash"></i></button>
      </td>
    </tr>`;
  }).join(''),'kl-empty',!list.length);
  initDragSort('#kl-body .drag-row','key',klDrop);
  // Zähler an den Tabs
  document.querySelectorAll('#kl-orga-tabs .orga-tab').forEach(tab=>{
    const o=tab.dataset.orga;
    const n=o==='Alle'?data.length:data.filter(e=>e.orga===o).length;
    let b=tab.querySelector('.orga-cnt');
    if(n>0){ if(!b){b=document.createElement('span');b.className='orga-cnt';tab.appendChild(b);} b.textContent=n; }
    else if(b)b.remove();
  });
}
function klDrop(fromK,toK,after){
  cloudMutate('kl',list=>{
    const from=list.findIndex(e=>klKey(e)===fromK);if(from<0)return undefined;
    const item=list.splice(from,1)[0];
    const to=list.findIndex(e=>klKey(e)===toK);if(to<0)return undefined;
    list.splice(after?to+1:to,0,item);return list;
  }).catch(()=>{});
}
function klOpenEdit(k){
  const e=klFind(DB.kl,k);if(!e)return;
  _klEditKey=k;
  ['orga','name','id','rang','tel','info'].forEach(f=>{sv2('kl-edit-'+f,e[f]);clearFieldError($('kl-edit-'+f));});
  openModal('kl-modal');
}
async function klSaveModal(){
  if(!requireFields([['kl-edit-orga','Organisation wählen'],['kl-edit-name','Name eingeben']]))return;
  const v=klFormValues('kl-edit');
  const k=_klEditKey;
  let found=false;
  await cloudMutate('kl',list=>{
    const i=list.findIndex(e=>klKey(e)===k);
    if(i<0)return undefined;
    found=true;
    list[i]={...list[i],...v,key:list[i].key||uid('kl')};
    return list;
  });
  closeModalById('kl-modal');
  showToast(found?'Eintrag gespeichert':'Eintrag existiert nicht mehr',{type:found?'ok':'err'});
}
function klCopyList(){
  const list=KL_ORGA==='Alle'?DB.kl:DB.kl.filter(e=>e.orga===KL_ORGA);
  if(!list.length){showToast('Keine Einträge vorhanden',{type:'info'});return;}
  const mask=s=>(!s||s==='--')?'--':'||'+s+'||';
  const groups={};
  list.forEach(e=>{(groups[e.orga]=groups[e.orga]||[]).push(e);});
  const out=Object.keys(groups).map(org=>`${ORGA_EMOJI[org]||'⚪'} **${org}**\n`+groups[org].map(e=>
    `${e.name} | ${e.rang||'--'} | ID: ${mask(e.id)} | Tel: ${mask(e.tel)}${e.info?' | '+e.info:''}`).join('\n')).join('\n\n');
  copyText(out,'Liste für Discord kopiert');
}

Object.assign(ACTIONS,{
  'kl-add':klAdd,
  'kl-switch':klSwitch,
  'kl-del':klDel,
  'kl-edit':klOpenEdit,
  'kl-save':klSaveModal,
  'kl-copy-list':klCopyList,
  'kl-copy-name':(k)=>{const e=klFind(DB.kl,k);if(e)copyText(e.name,'Name kopiert: '+e.name);}
});
Object.assign(INPUTS,{'kl-search':klRender});
onStore('kl',klRender);
