// FIB Personalabteilung · Mein Profil, Abteilungs-Mitglieder, Benutzerverwaltung
// ===================== MEIN PROFIL =====================
// Führt Sheet-Ausbildungen (m.trainings/ausb) mit den zusaetzlich von TD erfassten
// Eintraegen (EXTRA_TRAININGS) zusammen. TD-Eintraege ueberschreiben den Status bei
// gleichem Namen, oder werden als neue Zeile ergaenzt.
function mergeTrainings(base, passId){
  const extra=(passId && EXTRA_TRAININGS[passId])?EXTRA_TRAININGS[passId]:[];
  if(!extra.length)return base;
  const merged=(base||[]).map(t=>({...t}));
  extra.forEach(t=>{
    const existing=merged.find(x=>x.name.toLowerCase()===t.name.toLowerCase());
    if(existing) existing.passed=t.passed; else merged.push({...t});
  });
  return merged;
}
function getTrainingsForId(passId){
  if(!passId)return [];
  const m=MA.find(x=>x.id===passId);
  const base=m?((m.trainings&&m.trainings.length)?m.trainings:parseAusbList(m.ausb).map(n=>({name:n,passed:true}))):[];
  return mergeTrainings(base,passId);
}

// ===================== ABTEILUNGS-MITGLIEDERLISTEN =====================
// Findet alle Personen aus dem Mitarbeiterverzeichnis, deren "Abteilungen"-Feld den
// gegebenen Abteilungs-Code enthaelt (z.B. "FIBCO", "CID", "TD", "CIRG", "LAW").
// Wortgrenzen-Suche, damit "TD" nicht faelschlich in anderen Wortern anschlagt.
function deptMembers(code){
  const re=new RegExp('\\b'+code.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b','i');
  return MA.filter(m=>m.abt && re.test(m.abt));
}
let DEPT_SHOW_ALL={}; // {fibco:false, cid:false, ...} -- Umschalter "Alle Mitarbeiter anzeigen" je Abteilung
function deptToggleAll(prefix, code){
  DEPT_SHOW_ALL[prefix]=!DEPT_SHOW_ALL[prefix];
  renderDeptMembers(prefix, code);
}
function renderDeptMembers(prefix, code){
  const body=document.getElementById('dm-'+prefix+'-body');
  const empty=document.getElementById('dm-'+prefix+'-empty');
  const count=document.getElementById('dm-'+prefix+'-count');
  const toggleBtn=document.getElementById('dm-'+prefix+'-toggle');
  if(!body)return;
  const showAll=!!DEPT_SHOW_ALL[prefix];
  if(toggleBtn) toggleBtn.textContent = showAll ? 'Nur Abteilung anzeigen' : 'Alle Mitarbeiter anzeigen';
  const list=showAll ? MA : deptMembers(code);
  if(count) count.textContent=list.length+(showAll?' Mitarbeiter (alle)':' Mitglieder');
  if(!list.length){body.innerHTML='';if(empty)empty.style.display='block';return;}
  if(empty)empty.style.display='none';
  body.innerHTML=list.map(m=>`<tr>
    <td style="color:var(--mu);font-size:11px">${m.id}</td>
    <td style="font-weight:bold">${m.name}</td>
    <td><span class="rb ${rankCls(m.rank)}">${m.rank}</span></td>
    <td style="color:var(--g)">${m.dn||'--'}</td>
    <td style="color:var(--mu);font-size:11px">${m.abt||'--'}</td>
  </tr>`).join('');
}
function liveTrainingsFromDirectory(passId){
  if(!passId)return null;
  const m=MA.find(x=>x.id===passId);
  if(!m)return null;
  return getTrainingsForId(passId);
}
// Liefert Position + Eintrittsdatum live aus dem Verzeichnis (wie bei Trainings) -- oder null wenn keine ID / kein Treffer
function liveDirectoryInfo(passId){
  if(!passId)return null;
  const m=MA.find(x=>x.id===passId);
  if(!m)return null;
  return {position:m.rank||'', hireDate:dmyToIso(m.date), lastPromo:dmyToIso(m.lastPromo)};
}

async function renderMyProfile(){
  if(!currentUser)return;
  const u=currentProfile||{};
  const liveInfo=liveDirectoryInfo(u.passId);
  const position=(liveInfo&&liveInfo.position)||u.position||'';
  const hireDate=(liveInfo&&liveInfo.hireDate)||u.hireDate||'';
  const lastPromo=(liveInfo&&liveInfo.lastPromo)||u.lastPromo||'';
  document.getElementById('mp-header').innerHTML=`
    ${avatarHtml(u.name||currentUser,u.photo)}
    <div>
      <div class="profile-header-name">${u.name||currentUser} ${u.passId?`(ID: ${u.passId})`:''}</div>
      <div class="profile-header-pos">${position||'--'}${liveInfo?' <span style="font-size:9px;color:var(--g)">(live)</span>':''}</div>
    </div>
    <div class="profile-header-dates">
      <div><div class="v">${fmtD(hireDate)||'--'}</div><div class="l">Eingestellt am</div></div>
      <div><div class="v">${fmtD(lastPromo)||'--'}</div><div class="l">Letzte Beförderung</div></div>
    </div>`;
  document.getElementById('mp-bio').textContent=u.bio||'Noch keine Beschreibung — klick auf "Bearbeiten".';
  document.getElementById('mp-info').innerHTML=`
    <div class="profile-info-row"><i class="ti ti-id-badge"></i> @${currentUser}</div>
    <div class="profile-info-row"><i class="ti ti-phone"></i> ${u.phone||'--'}</div>
    <div class="profile-info-row"><i class="ti ti-shield-lock"></i> ${(currentRoles||[]).join(', ')||'--'}</div>`;
  const liveTrains=liveTrainingsFromDirectory(u.passId);
  const trains=liveTrains||u.trainings||[];
  document.getElementById('mp-trainings').innerHTML=trainRowsHtml(trains);
  document.getElementById('mp-trainings-empty').style.display=trains.length?'none':'block';
  const titleEl=document.getElementById('mp-train-title');
  if(titleEl) titleEl.textContent = liveTrains ? '[ Ausbildungen / Schulungen — live aus Verzeichnis ]' : '[ Ausbildungen / Schulungen ]';
}

let _sePhotoData='';
let _seImportedExtra=null; // {passId,position,hireDate,trainings} aus Verzeichnis-Lookup
function openSelfEdit(){
  const u=currentProfile||{};
  sv2('se-name',u.name||'');
  sv2('se-phone',u.phone||'');
  sv2('se-bio',u.bio||'');
  sv2('se-passid',u.passId||'');
  _seImportedExtra=null;
  document.getElementById('se-lookup-msg').textContent='Füllt Name, Rang, Eintrittsdatum und Ausbildungen automatisch aus dem Mitarbeiterverzeichnis.';
  document.getElementById('se-lookup-msg').style.color='var(--mu)';
  _sePhotoData=u.photo||'';
  if(_sePhotoData){
    document.getElementById('se-photo-preview').src=_sePhotoData;
    document.getElementById('se-photo-preview').style.display='block';
    document.getElementById('se-photo-ph').style.display='none';
  } else {
    document.getElementById('se-photo-preview').style.display='none';
    document.getElementById('se-photo-ph').style.display='flex';
    document.getElementById('se-photo-ph').textContent=initials(u.name||currentUser);
  }
  document.getElementById('se-msg').textContent='';
  document.getElementById('selfedit-modal').classList.add('show');
}
function closeSelfEdit(){document.getElementById('selfedit-modal').classList.remove('show');}

function dmyToIso(str){
  if(!str)return'';
  if(str.includes('.'))return str.split('.').reverse().join('-');
  return str;
}

function lookupDirectoryForSelf(){
  const id=gv('se-passid').trim();
  const msgEl=document.getElementById('se-lookup-msg');
  if(!id)return; // leeres Feld beim Verlassen -> kein Fehler, einfach nichts tun
  const m=MA.find(x=>x.id===id);
  if(!m){msgEl.textContent='Keine Person mit dieser ID im Mitarbeiterverzeichnis gefunden.';msgEl.style.color='var(--re)';return;}
  sv2('se-name',m.name||gv('se-name'));
  const trains=(m.trainings&&m.trainings.length)?m.trainings.map(t=>({...t})):parseAusbList(m.ausb).map(n=>({name:n,passed:true}));
  _seImportedExtra={
    passId:m.id,
    position:m.rank||'',
    hireDate:dmyToIso(m.date),
    lastPromo:dmyToIso(m.lastPromo),
    trainings:trains
  };
  const passCount=trains.filter(t=>t.passed).length;
  msgEl.innerHTML=`Ubernommen: <b style="color:var(--tx)">${m.name}</b> · ${m.rank} · ${passCount}/${trains.length} Ausbildungen bestanden. Jetzt "Speichern" klicken.`;
  msgEl.style.color='var(--gr)';
}

function resizeImageToDataUrl(file,maxSize,cb){
  const reader=new FileReader();
  reader.onload=function(ev){
    const img=new Image();
    img.onload=function(){
      let w=img.width,h=img.height;
      if(w>h){if(w>maxSize){h=Math.round(h*maxSize/w);w=maxSize;}}else{if(h>maxSize){w=Math.round(w*maxSize/h);h=maxSize;}}
      const canvas=document.createElement('canvas');
      canvas.width=w;canvas.height=h;
      canvas.getContext('2d').drawImage(img,0,0,w,h);
      cb(canvas.toDataURL('image/jpeg',0.7));
    };
    img.src=ev.target.result;
  };
  reader.readAsDataURL(file);
}
function handleSelfPhotoUpload(input){
  const file=input.files&&input.files[0];
  if(!file)return;
  resizeImageToDataUrl(file,120,(dataUrl)=>{
    _sePhotoData=dataUrl;
    document.getElementById('se-photo-preview').src=dataUrl;
    document.getElementById('se-photo-preview').style.display='block';
    document.getElementById('se-photo-ph').style.display='none';
  });
}

async function saveSelfProfile(){
  const msgEl=document.getElementById('se-msg');
  msgEl.textContent='Speichert ...';msgEl.style.color='var(--mu)';
  try{
    const data={name:gv('se-name').trim(),phone:gv('se-phone').trim(),bio:gv('se-bio').trim(),photo:_sePhotoData||''};
    if(_seImportedExtra){
      data.passId=_seImportedExtra.passId;
      data.position=_seImportedExtra.position;
      data.hireDate=_seImportedExtra.hireDate;
      data.lastPromo=_seImportedExtra.lastPromo;
      data.trainings=_seImportedExtra.trainings;
    }
    await saveProfile(currentUser,data);
    currentProfile={...currentProfile,...data};
    currentName=data.name||currentUser;
    applyRoleVisibility();
    renderMyProfile();
    closeSelfEdit();
    showToast('Profil gespeichert');
  }catch(e){
    console.error('saveSelfProfile error',e);
    msgEl.textContent='Fehler beim Speichern. Verbindung prüfen.';msgEl.style.color='var(--re)';
  }
}

// ===================== BENUTZERVERWALTUNG (Admin) =====================
let _allAccountsCache=[];
let _allProfilesCache={};

async function renderUserList(){
  const box=document.getElementById('adm-userlist');
  if(!box)return;
  box.innerHTML='<div class="kl-empty">Lade Accounts ...</div>';
  [_allAccountsCache,_allProfilesCache]=await Promise.all([loadAllAccounts(),loadAllProfiles()]);
  if(!_allAccountsCache.length){box.innerHTML='<div class="kl-empty">Keine Accounts vorhanden.</div>';return;}
  box.innerHTML=_allAccountsCache.map(u=>{
    const p=_allProfilesCache[u.username.toLowerCase()]||PROFILE_DEFAULTS;
    return `<div class="profile-card" onclick="openProfileModal('${u.username}')">
      ${avatarHtml(p.name||u.username,p.photo)}
      <div>
        <div class="pc-name">${p.name||u.username}</div>
        <div class="pc-pos">${p.position||('@'+u.username)}</div>
        <div class="pc-roles">${(u.roles||[]).map(r=>`<span class="role-tag">${r}</span>`).join('')||'<span class="role-tag">--</span>'}${u.mustChange?'<span class="role-tag" style="color:var(--wa);border-color:var(--wa)">temp.</span>':''}</div>
      </div>
    </div>`;
  }).join('');
}

async function openProfileModal(username){
  const u=_allAccountsCache.find(x=>x.username.toLowerCase()===username.toLowerCase()) || await loadAccount(username);
  if(!u)return;
  document.getElementById('profile-modal').dataset.username=username;
  const p=_allProfilesCache[username.toLowerCase()] || await loadProfile(username);
  _allProfilesCache[username.toLowerCase()]=p;
  const liveInfo=liveDirectoryInfo(p.passId);
  const position=(liveInfo&&liveInfo.position)||p.position||'';
  const hireDate=(liveInfo&&liveInfo.hireDate)||p.hireDate||'';
  const lastPromo=(liveInfo&&liveInfo.lastPromo)||p.lastPromo||'';
  document.getElementById('pm-header').innerHTML=`
    ${avatarHtml(p.name||u.username,p.photo)}
    <div>
      <div class="profile-header-name">${p.name||u.username} ${p.passId?`(ID: ${p.passId})`:''}</div>
      <div class="profile-header-pos">${position||'--'}${liveInfo?' <span style="font-size:9px;color:var(--g)">(live)</span>':''}</div>
    </div>
    <div class="profile-header-dates">
      <div><div class="v">${fmtD(hireDate)||'--'}</div><div class="l">Eingestellt am</div></div>
      <div><div class="v">${fmtD(lastPromo)||'--'}</div><div class="l">Letzte Beförderung</div></div>
    </div>`;
  document.getElementById('pm-bio').textContent=p.bio||'Noch keine Beschreibung hinterlegt.';
  document.getElementById('pm-info').innerHTML=`
    <div class="profile-info-row"><i class="ti ti-id-badge"></i> @${u.username}</div>
    <div class="profile-info-row"><i class="ti ti-phone"></i> ${p.phone||'--'}</div>
    <div class="profile-info-row"><i class="ti ti-shield-lock"></i> ${(u.roles||[]).join(', ')||'--'}</div>
    ${u.mustChange?'<div class="profile-info-row" style="color:var(--wa)"><i class="ti ti-alert-triangle" style="color:var(--wa)"></i> Temporäres Passwort — noch nicht geändert</div>':''}`;
  const liveTrains=liveTrainingsFromDirectory(p.passId);
  const trains=liveTrains||p.trainings||[];
  const tbody=document.getElementById('pm-trainings');
  const empty=document.getElementById('pm-trainings-empty');
  if(!trains.length){tbody.innerHTML='';empty.style.display='block';}
  else{empty.style.display='none';tbody.innerHTML=trainRowsHtml(trains);}
  const pmTitleEl=document.getElementById('pm-train-title');
  if(pmTitleEl) pmTitleEl.textContent = liveTrains ? '[ Ausbildungen / Schulungen — live aus Verzeichnis ]' : '[ Ausbildungen / Schulungen ]';
  document.getElementById('pm-codebox').innerHTML='';
  document.getElementById('profile-modal').classList.add('show');
}
function closeProfileModal(){document.getElementById('profile-modal').classList.remove('show');}
document.getElementById('profile-modal').addEventListener('click',function(e){if(e.target===this)closeProfileModal();});
document.getElementById('useredit-modal').addEventListener('click',function(e){if(e.target===this)closeEditUserModal();});
document.getElementById('selfedit-modal').addEventListener('click',function(e){if(e.target===this)closeSelfEdit();});
document.getElementById('officialedit-modal').addEventListener('click',function(e){if(e.target===this)closeOfficialEdit();});

// --- TEMPORAERES PASSWORT VERGEBEN (Admin) -- speichert sofort, kein Code mehr ---
async function adminIssueTempPassword(){
  const username=document.getElementById('profile-modal').dataset.username;
  const u=_allAccountsCache.find(x=>x.username.toLowerCase()===username.toLowerCase());
  if(!u)return;
  const newPass=prompt('Temporäres Passwort für "'+username+'" eingeben (min. 6 Zeichen):');
  if(newPass===null)return;
  if(newPass.length<6){showToast('Passwort zu kurz (min. 6 Zeichen)');return;}
  const box=document.getElementById('pm-codebox');
  try{
    const hash=await fibHash(newPass);
    await saveAccount(username,{passHash:hash,mustChange:true,roles:u.roles||[]});
    box.innerHTML='Temporäres Passwort: <b style="color:var(--g)">'+newPass+'</b> — gib es der Person, sie muss es beim nächsten Login ändern. Bereits gespeichert, sofort aktiv.';
    showToast('Temporäres Passwort gespeichert');
    renderUserList();
  }catch(e){
    console.error('adminIssueTempPassword error',e);
    box.innerHTML='<span style="color:var(--re)">Fehler beim Speichern. Verbindung prüfen.</span>';
  }
}

async function adminDeleteUserPrompt(){
  const username=document.getElementById('profile-modal').dataset.username;
  if(username===currentUser){showToast('Du kannst deinen eigenen Account hier nicht löschen');return;}
  if(username.toLowerCase()===FALLBACK_ADMIN.username && !_allAccountsCache.find(x=>x.username.toLowerCase()===username.toLowerCase()&&x.passHash!==FALLBACK_ADMIN.passHash)){
    if(!confirm('"admin" ist der im Code hinterlegte Notfall-Zugang. Es gibt nichts in der Cloud zu löschen. Trotzdem fortfahren?'))return;
  } else if(!confirm('Account "'+username+'" wirklich vollständig löschen?'))return;
  try{
    await deleteAccount(username);
    await window._fbDeleteDoc(window._fbDocFn('fib_profiles',username.toLowerCase())).catch(()=>{});
    showToast('Account gelöscht');
    closeProfileModal();
    renderUserList();
  }catch(e){
    console.error('adminDeleteUserPrompt error',e);
    showToast('Fehler beim Löschen');
  }
}

// ===================== ZUGANGSDATEN ANLEGEN / BEARBEITEN (Firestore, automatisch) =====================
function openCreateUser(){
  document.getElementById('ue-title').textContent='Account anlegen';
  document.getElementById('ue-editing-username').value='';
  sv2('ue-username','');sv2('ue-pass','');
  document.querySelectorAll('.ue-role').forEach(c=>c.checked=false);
  document.getElementById('ue-mustchange').checked=true; // sinnvoller Standard: neuer Account startet mit Temp-Passwort
  document.getElementById('ue-username').disabled=false;
  document.getElementById('ue-pass-req').textContent='*';
  document.getElementById('ue-pass').placeholder='min. 6 Zeichen';
  document.getElementById('ue-msg').textContent='';
  document.getElementById('useredit-modal').classList.add('show');
}
async function openEditUser(username){
  username=username||document.getElementById('profile-modal').dataset.username;
  const u=_allAccountsCache.find(x=>x.username.toLowerCase()===username.toLowerCase()) || await loadAccount(username);
  if(!u)return;
  closeProfileModal();
  document.getElementById('ue-title').textContent='Zugangsdaten ändern — '+u.username;
  document.getElementById('ue-editing-username').value=u.username;
  sv2('ue-username',u.username);
  document.getElementById('ue-username').disabled=true;
  sv2('ue-pass','');
  document.getElementById('ue-pass-req').textContent='(leer lassen = unverandert)';
  document.getElementById('ue-pass').placeholder='nur ausfüllen zum Ändern';
  document.querySelectorAll('.ue-role').forEach(c=>{c.checked=(u.roles||[]).includes(c.value);});
  document.getElementById('ue-mustchange').checked=!!u.mustChange;
  document.getElementById('ue-msg').textContent='';
  document.getElementById('useredit-modal').classList.add('show');
}
function closeEditUserModal(){document.getElementById('useredit-modal').classList.remove('show');}

async function submitUserForm(){
  if(!hasRole('admin')){showToast('Keine Berechtigung');return;}
  const editingUsername=gv('ue-editing-username');
  const isEdit=!!editingUsername;
  const username=isEdit?editingUsername:gv('ue-username').trim();
  const pass=gv('ue-pass');
  const roles=Array.from(document.querySelectorAll('.ue-role:checked')).map(c=>c.value);
  const mustChange=document.getElementById('ue-mustchange').checked;
  const msgEl=document.getElementById('ue-msg');
  if(!username){msgEl.textContent='Zugangskennung ist Pflicht.';msgEl.style.color='var(--re)';return;}
  if(!roles.length){msgEl.textContent='Mindestens eine Rolle wählen.';msgEl.style.color='var(--re)';return;}
  if(!isEdit && (!pass||pass.length<6)){msgEl.textContent='Passwort: min. 6 Zeichen.';msgEl.style.color='var(--re)';return;}
  if(isEdit && pass && pass.length<6){msgEl.textContent='Neues Passwort: min. 6 Zeichen (oder Feld leer lassen).';msgEl.style.color='var(--re)';return;}
  msgEl.textContent='Speichert ...';msgEl.style.color='var(--mu)';
  try{
    if(!isEdit){
      const existing=await loadAccount(username);
      if(existing){msgEl.textContent='Zugangskennung bereits vergeben.';msgEl.style.color='var(--re)';return;}
    }
    let passHash;
    if(isEdit){
      const existing=await loadAccount(username);
      passHash = pass ? await fibHash(pass) : existing.passHash;
    } else {
      passHash = await fibHash(pass);
    }
    await saveAccount(username,{roles,passHash,mustChange});
    msgEl.textContent='Gespeichert — Account ist sofort aktiv.';msgEl.style.color='var(--gr)';
    showToast(isEdit?'Zugangsdaten aktualisiert':'Account angelegt');
    setTimeout(()=>{closeEditUserModal();renderUserList();},700);
  }catch(e){
    console.error('submitUserForm error',e);
    msgEl.textContent='Fehler beim Speichern. Verbindung prüfen.';msgEl.style.color='var(--re)';
  }
}

// ===================== OFFIZIELLE DATEN BEARBEITEN (Admin, automatisch in Firestore) =====================
let _oeTrainings=[];
function openOfficialEdit(username){
  username=username||document.getElementById('profile-modal').dataset.username;
  const p=_allProfilesCache[username.toLowerCase()]||PROFILE_DEFAULTS;
  closeProfileModal();
  document.getElementById('oe-title').textContent='Offizielle Daten — '+username;
  document.getElementById('oe-username').value=username;
  sv2('oe-passid',p.passId||'');
  sv2('oe-position',p.position||'');
  document.getElementById('oe-hiredate').value=p.hireDate||'';
  document.getElementById('oe-lastpromo').value=p.lastPromo||'';
  _oeTrainings=(p.trainings||[]).map(t=>({...t}));
  renderOfficialTrainingList();
  document.getElementById('oe-msg').textContent='';
  document.getElementById('oe-lookup-msg').textContent='Lupe klicken um Rang, Eintrittsdatum und Ausbildungen aus dem Mitarbeiterverzeichnis zu übernehmen.';
  document.getElementById('oe-lookup-msg').style.color='var(--mu)';
  document.getElementById('officialedit-modal').classList.add('show');
}
function closeOfficialEdit(){document.getElementById('officialedit-modal').classList.remove('show');}

function lookupDirectoryForOfficial(){
  const id=gv('oe-passid').trim();
  const msgEl=document.getElementById('oe-lookup-msg');
  if(!id)return; // leeres Feld beim Verlassen -> kein Fehler, einfach nichts tun
  const m=MA.find(x=>x.id===id);
  if(!m){msgEl.textContent='Keine Person mit dieser ID im Mitarbeiterverzeichnis gefunden.';msgEl.style.color='var(--re)';return;}
  sv2('oe-position',m.rank||'');
  document.getElementById('oe-hiredate').value=dmyToIso(m.date);
  document.getElementById('oe-lastpromo').value=dmyToIso(m.lastPromo);
  const found=(m.trainings&&m.trainings.length)?m.trainings:parseAusbList(m.ausb).map(n=>({name:n,passed:true}));
  found.forEach(t=>{
    const existing=_oeTrainings.find(x=>x.name.toLowerCase()===t.name.toLowerCase());
    if(existing) existing.passed=t.passed; else _oeTrainings.push({...t});
  });
  renderOfficialTrainingList();
  const passCount=found.filter(t=>t.passed).length;
  msgEl.innerHTML=`Ubernommen: <b style="color:var(--tx)">${m.name}</b> · ${m.rank} · ${passCount}/${found.length} Ausbildungen bestanden.`;
  msgEl.style.color='var(--gr)';
}

function addOfficialTrainingRow(){
  const name=gv('oe-train-name').trim();
  if(!name){showToast('Trainingsname eingeben');return;}
  const passed=gv('oe-train-status')==='1';
  _oeTrainings.push({name,passed});
  sv2('oe-train-name','');
  renderOfficialTrainingList();
}
function removeOfficialTrainingRow(i){_oeTrainings.splice(i,1);renderOfficialTrainingList();}
function renderOfficialTrainingList(){
  const box=document.getElementById('oe-train-list');
  if(!_oeTrainings.length){box.innerHTML='<div class="hint">Noch keine Schulungen hinzugefügt.</div>';return;}
  box.innerHTML=_oeTrainings.map((t,i)=>`<div class="train-row-input">
    <span style="flex:1;font-size:11px;">${t.name}</span>
    <span class="train-badge ${t.passed?'train-pass':'train-fail'}">${t.passed?'BESTANDEN':'NICHT ABSOLVIERT'}</span>
    <button class="btn sm ng" onclick="removeOfficialTrainingRow(${i})"><i class="ti ti-x"></i></button>
  </div>`).join('');
}

async function saveOfficialProfile(){
  const username=gv('oe-username');
  const msgEl=document.getElementById('oe-msg');
  msgEl.textContent='Speichert ...';msgEl.style.color='var(--mu)';
  try{
    const data={
      passId:gv('oe-passid').trim(),
      position:gv('oe-position').trim(),
      hireDate:document.getElementById('oe-hiredate').value||'',
      lastPromo:document.getElementById('oe-lastpromo').value||'',
      trainings:_oeTrainings
    };
    await saveProfile(username,data);
    _allProfilesCache[username.toLowerCase()]={..._allProfilesCache[username.toLowerCase()],...data};
    if(username.toLowerCase()===(currentUser||'').toLowerCase()){currentProfile={...currentProfile,...data};renderMyProfile();}
    closeOfficialEdit();
    showToast('Gespeichert');
    renderUserList();
  }catch(e){
    console.error('saveOfficialProfile error',e);
    msgEl.textContent='Fehler beim Speichern. Verbindung prüfen.';msgEl.style.color='var(--re)';
  }
}

