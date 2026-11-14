// FIB Personalabteilung · Mein Profil + Benutzerverwaltung (Admin)

// ===================== AUSBILDUNGEN ZUSAMMENFÜHREN =====================
// Sheet-Ausbildungen + zusätzlich von TD erfasste Einträge (DB.extraTrainings).
// TD-Einträge überschreiben bei gleichem Namen den Status, sonst kommen sie dazu.
function mergeTrainings(base,passId){
  const extra=(passId&&DB.extraTrainings[passId])||[];
  const merged=(base||[]).map(t=>({...t}));
  extra.forEach(t=>{
    const ex=merged.find(x=>x.name.toLowerCase()===t.name.toLowerCase());
    if(ex)ex.passed=t.passed;else merged.push({...t});
  });
  return merged;
}
function getTrainingsForId(passId){
  if(!passId)return[];
  const m=MA.find(x=>x.id===passId);
  return mergeTrainings(m?(m.trainings||[]):[],passId);
}
// Live-Daten aus dem Verzeichnis (Rang, Eintritt, Beförderung, Ausbildungen) – oder null
function liveDirectoryInfo(passId){
  const m=passId&&MA.find(x=>x.id===passId);
  if(!m)return null;
  return{position:m.rank||'',hireDate:dmyToIso(m.date),lastPromo:dmyToIso(m.lastPromo),trainings:getTrainingsForId(passId)};
}

// ===================== PROFIL-ANSICHT (eigene + Admin-Modal) =====================
function renderProfileInto(prefix,username,profile,roles,extraInfo){
  const p=profile||PROFILE_DEFAULTS;
  const live=liveDirectoryInfo(p.passId);
  const position=(live&&live.position)||p.position;
  const hire=(live&&live.hireDate)||p.hireDate;
  const promo=(live&&live.lastPromo)||p.lastPromo;
  const display=p.name||username;
  $(prefix+'-header').innerHTML=`
    ${avatarHtml(display,p.photo,'xl')}
    <div>
      <div class="profile-header-name">${esc(display)} ${p.passId?`<span class="muted">(ID: ${esc(p.passId)})</span>`:''}</div>
      <div class="profile-header-pos">${esc(position||'--')}${live?' <span class="live-tag">live</span>':''}</div>
    </div>
    <div class="profile-header-dates">
      <div><div class="v">${esc(fmtD(hire))}</div><div class="l">Eingestellt am</div></div>
      <div><div class="v">${esc(fmtD(promo))}</div><div class="l">Letzte Beförderung</div></div>
    </div>`;
  $(prefix+'-bio').textContent=p.bio||'Noch keine Beschreibung hinterlegt.';
  $(prefix+'-info').innerHTML=`
    <div class="profile-info-row"><i class="ti ti-at"></i> ${esc(username)}</div>
    <div class="profile-info-row"><i class="ti ti-phone"></i> ${esc(p.phone||'--')}</div>
    <div class="profile-info-row"><i class="ti ti-shield-lock"></i> ${esc(roleLabels(roles))}</div>
    ${extraInfo||''}`;
  const trains=(live&&live.trainings.length)?live.trainings:(p.trainings||[]);
  fillTable(prefix+'-trainings',trainRowsHtml(trains),prefix+'-trainings-empty',!trains.length);
  $(prefix+'-train-title').textContent=live?'Ausbildungen · live aus Verzeichnis':'Ausbildungen / Schulungen';
}
function renderMyProfile(){
  if(!currentUser)return;
  renderProfileInto('mp',currentUser,currentProfile,currentRoles);
}

// ===================== PROFIL SELBST BEARBEITEN =====================
let _sePhotoData='';
let _seImported=null;
function openSelfEdit(){
  const u=currentProfile||{};
  sv2('se-name',u.name);sv2('se-phone',u.phone);sv2('se-bio',u.bio);sv2('se-passid',u.passId);
  _seImported=null;
  const msg=$('se-lookup-msg');
  msg.textContent='Übernimmt Name, Rang, Eintrittsdatum und Ausbildungen aus dem Mitarbeiterverzeichnis.';msg.className='hint';
  _sePhotoData=safeImg(u.photo);
  renderSelfPhoto();
  $('se-msg').textContent='';
  openModal('selfedit-modal');
}
function renderSelfPhoto(){
  $('se-photo').innerHTML=avatarHtml(gv('se-name')||currentUser,_sePhotoData,'xl');
}
function lookupDirectoryForSelf(){
  const id=gv('se-passid').trim();
  const msg=$('se-lookup-msg');
  if(!id)return;
  const m=MA.find(x=>x.id===id);
  if(!m){msg.textContent='Keine Person mit dieser ID im Mitarbeiterverzeichnis gefunden.';msg.className='hint err-text';return;}
  sv2('se-name',m.name||gv('se-name'));
  const trains=getTrainingsForId(m.id);
  _seImported={passId:m.id,position:m.rank||'',hireDate:dmyToIso(m.date),lastPromo:dmyToIso(m.lastPromo),trainings:trains};
  msg.innerHTML=`Übernommen: <b>${esc(m.name)}</b> · ${esc(m.rank)} · ${trains.filter(t=>t.passed).length}/${trains.length} Ausbildungen bestanden. Jetzt „Speichern“ klicken.`;
  msg.className='hint ok-text';
  renderSelfPhoto();
}
function resizeImageToDataUrl(file,maxSize){
  return new Promise((resolve,reject)=>{
    if(!/^image\//.test(file.type)){reject(new Error('Keine Bilddatei'));return;}
    const reader=new FileReader();
    reader.onerror=reject;
    reader.onload=ev=>{
      const img=new Image();
      img.onerror=reject;
      img.onload=()=>{
        let w=img.width,h=img.height;
        if(w>h){if(w>maxSize){h=Math.round(h*maxSize/w);w=maxSize;}}else if(h>maxSize){w=Math.round(w*maxSize/h);h=maxSize;}
        const c=document.createElement('canvas');c.width=w;c.height=h;
        c.getContext('2d').drawImage(img,0,0,w,h);
        resolve(c.toDataURL('image/jpeg',0.75));
      };
      img.src=ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}
async function handleSelfPhotoUpload(_,input){
  const file=input.files&&input.files[0];
  if(!file)return;
  try{ _sePhotoData=await resizeImageToDataUrl(file,160); renderSelfPhoto(); }
  catch(e){ showToast('Bild konnte nicht geladen werden',{type:'err'}); }
}
async function saveSelfProfile(){
  const msg=$('se-msg');
  msg.textContent='Speichert …';msg.className='hint';
  const data={name:gv('se-name').trim(),phone:gv('se-phone').trim(),bio:gv('se-bio').trim(),photo:_sePhotoData||''};
  if(_seImported)Object.assign(data,_seImported);
  try{
    await saveProfile(currentUser,data);
    currentProfile={...currentProfile,...data};
    currentName=data.name||currentUser;
    applyRoleVisibility();
    renderMyProfile();
    closeModalById('selfedit-modal');
    showToast('Profil gespeichert');
  }catch(e){
    console.error('saveSelfProfile',e);
    msg.textContent='Fehler beim Speichern. Verbindung prüfen.';msg.className='hint err-text';
  }
}

// ===================== BENUTZERVERWALTUNG (Admin) =====================
let _accounts=[];      // [{username, roles, authKey, mustChange, passHash?}]
let _profiles={};
let _pmUser=null;      // im Profil-Fenster geöffneter Account

function isLegacyAccount(u){ return !u.authKey; }

async function renderUserList(){
  const box=$('adm-userlist');if(!box)return;
  box.innerHTML='<div class="empty">Lade Accounts …</div>';
  try{
    await initFirebase();
    const [us,ps]=await Promise.all([
      FB.fs.getDocs(FB.fs.collection(FB.db,'fib_users')),
      FB.fs.getDocs(FB.fs.collection(FB.db,'fib_profiles'))
    ]);
    _accounts=[];us.forEach(d=>_accounts.push({username:d.id,...d.data()}));
    _profiles={};ps.forEach(d=>{_profiles[d.id]={...PROFILE_DEFAULTS,...d.data()};});
  }catch(e){
    console.error('renderUserList',e);
    box.innerHTML='<div class="empty err-text">Accounts konnten nicht geladen werden.</div>';return;
  }
  _accounts.sort((a,b)=>Number(isLegacyAccount(b))-Number(isLegacyAccount(a))||a.username.localeCompare(b.username));
  const legacy=_accounts.filter(isLegacyAccount).length;
  show('adm-legacy-hint',legacy>0);
  $('adm-legacy-count').textContent=legacy;
  if(!_accounts.length){box.innerHTML='<div class="empty">Keine Accounts vorhanden.</div>';return;}
  box.innerHTML=_accounts.map(u=>{
    const p=_profiles[u.username]||PROFILE_DEFAULTS;
    const tags=(u.roles||[]).map(r=>`<span class="role-tag">${esc(r)}</span>`).join('')||'<span class="role-tag">--</span>';
    const state=isLegacyAccount(u)?'<span class="role-tag warn">alt · neu aktivieren</span>':(u.mustChange?'<span class="role-tag warn">temp. Passwort</span>':'');
    return`<button type="button" class="profile-card" data-action="open-profile" data-arg="${esc(u.username)}">
      ${avatarHtml(p.name||u.username,p.photo)}
      <div class="pc-body">
        <div class="pc-name">${esc(p.name||u.username)}</div>
        <div class="pc-pos">${esc(p.position||('@'+u.username))}</div>
        <div class="pc-roles">${tags}${state}</div>
      </div>
    </button>`;
  }).join('');
}

function openProfileModal(username){
  const u=_accounts.find(x=>x.username===username);if(!u)return;
  _pmUser=u;
  const p=_profiles[username]||PROFILE_DEFAULTS;
  let extra='';
  if(isLegacyAccount(u))extra='<div class="profile-info-row warn-text"><i class="ti ti-alert-triangle"></i> Alter Account – erst nach „Neues Passwort vergeben“ wieder nutzbar</div>';
  else if(u.mustChange)extra='<div class="profile-info-row warn-text"><i class="ti ti-alert-triangle"></i> Temporäres Passwort — noch nicht geändert</div>';
  renderProfileInto('pm',username,p,u.roles,extra);
  $('pm-temppass-label').textContent=isLegacyAccount(u)?'Account aktivieren (Passwort vergeben)':'Neues Passwort vergeben';
  show('pm-delete-btn',username!==currentUser);
  $('pm-codebox').innerHTML='';
  openModal('profile-modal');
}

// Neuen Firebase-Login anlegen (über die zweite App-Instanz, Admin bleibt angemeldet)
async function createAuthLogin(username,password){
  const key=newAuthKey();
  await FB.au.createUserWithEmailAndPassword(FB.secAuth,authMail(username,key),password);
  try{await FB.au.signOut(FB.secAuth);}catch(e){}
  return key;
}
function suggestPassword(){
  const chars='abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(10)),b=>chars[b%chars.length]).join('');
}

async function adminIssueTempPassword(){
  const u=_pmUser;if(!u)return;
  const pass=await uiPrompt(`Temporäres Passwort für „${u.username}“ (mind. 8 Zeichen). Die Person muss es beim nächsten Login ändern; ein bisheriger Login wird sofort ungültig.`,{title:'Neues Passwort vergeben',value:suggestPassword(),minLength:8,okText:'Vergeben'});
  if(pass===null)return;
  const box=$('pm-codebox');
  box.textContent='Speichert …';
  try{
    await initFirebase();
    const key=await createAuthLogin(u.username,pass);
    const b=FB.fs.writeBatch(FB.db);
    b.set(fbDoc('fib_users',u.username),{roles:u.roles||[],authKey:key,mustChange:true,passHash:FB.fs.deleteField()},{merge:true});
    b.set(fbDoc('fib_login',u.username),{key});
    await b.commit();
    box.innerHTML=`Temporäres Passwort: <code class="pw">${esc(pass)}</code> <button class="btn sm" data-action="copy-temp" data-arg="${esc(pass)}"><i class="ti ti-copy"></i> Kopieren</button><br>Gib es der Person – sie muss es beim nächsten Login ändern.`;
    showToast('Passwort vergeben');
    await renderUserList();
    _pmUser=_accounts.find(x=>x.username===u.username)||u;
  }catch(e){
    console.error('adminIssueTempPassword',e);
    box.innerHTML=`<span class="err-text">Fehler: ${esc(e.code||e.message)}</span>`;
  }
}

async function adminDeleteUser(){
  const u=_pmUser;if(!u)return;
  if(u.username===currentUser){showToast('Eigenen Account hier nicht löschbar',{type:'err'});return;}
  const ok=await uiConfirm(`Account „${u.username}“ inklusive Profil endgültig löschen? Der Login ist danach sofort gesperrt.`,{title:'Account löschen',okText:'Löschen',danger:true});
  if(!ok)return;
  try{
    const b=FB.fs.writeBatch(FB.db);
    b.delete(fbDoc('fib_users',u.username));
    b.delete(fbDoc('fib_login',u.username));
    b.delete(fbDoc('fib_profiles',u.username));
    await b.commit();
    closeModalById('profile-modal');
    showToast('Account gelöscht');
    renderUserList();
  }catch(e){console.error(e);showToast('Fehler beim Löschen',{type:'err'});}
}

// ---------- Account anlegen / Rollen ändern ----------
function openCreateUser(){
  $('ue-title').textContent='Account anlegen';
  sv2('ue-editing','');
  clearForm(['ue-username','ue-pass']);
  sv2('ue-pass',suggestPassword());
  $('ue-username').disabled=false;
  show('ue-pass-wrap',true);
  document.querySelectorAll('.ue-role').forEach(c=>c.checked=false);
  $('ue-msg').textContent='';
  openModal('useredit-modal');
}
function openEditRoles(){
  const u=_pmUser;if(!u)return;
  closeModalById('profile-modal');
  $('ue-title').textContent='Rollen ändern — '+u.username;
  sv2('ue-editing',u.username);
  sv2('ue-username',u.username);
  $('ue-username').disabled=true;
  show('ue-pass-wrap',false);
  document.querySelectorAll('.ue-role').forEach(c=>{c.checked=(u.roles||[]).includes(c.value);});
  $('ue-msg').textContent='';
  openModal('useredit-modal');
}
async function submitUserForm(){
  if(!hasRole('admin'))return;
  const editing=gv('ue-editing');
  const username=(editing||gv('ue-username').trim()).toLowerCase();
  const roles=Array.from(document.querySelectorAll('.ue-role:checked')).map(c=>c.value);
  const msg=$('ue-msg');msg.className='hint';
  if(!editing){
    if(!requireFields([['ue-username','Zugangskennung eingeben']]))return;
    if(!USERNAME_RE.test(username)){fieldError('ue-username','3–32 Zeichen: a–z, 0–9, Punkt, Minus, Unterstrich');return;}
    if(gv('ue-pass').length<8){fieldError('ue-pass','Mindestens 8 Zeichen');return;}
  }
  if(!roles.length){msg.textContent='Mindestens eine Rolle wählen.';msg.className='hint err-text';return;}
  if(editing===currentUser&&!roles.includes('admin')){
    const ok=await uiConfirm('Du entfernst dir selbst die Admin-Rolle und verlierst danach den Zugriff auf die Benutzerverwaltung. Fortfahren?',{danger:true,okText:'Fortfahren'});
    if(!ok)return;
  }
  msg.textContent='Speichert …';
  try{
    await initFirebase();
    if(editing){
      await FB.fs.updateDoc(fbDoc('fib_users',username),{roles});
      if(username===currentUser){currentRoles=roles;applyRoleVisibility();}
    }else{
      const exists=await FB.fs.getDoc(fbDoc('fib_users',username));
      if(exists.exists()){fieldError('ue-username','Zugangskennung bereits vergeben');msg.textContent='';return;}
      const pass=gv('ue-pass');
      const key=await createAuthLogin(username,pass);
      const b=FB.fs.writeBatch(FB.db);
      b.set(fbDoc('fib_users',username),{roles,authKey:key,mustChange:true});
      b.set(fbDoc('fib_login',username),{key});
      await b.commit();
      await uiAlert(`Account „${username}“ angelegt.\n\nTemporäres Passwort: ${pass}\n\nDie Person muss es beim ersten Login ändern.`,{title:'Account angelegt'});
    }
    closeModalById('useredit-modal');
    showToast(editing?'Rollen gespeichert':'Account angelegt');
    renderUserList();
  }catch(e){
    console.error('submitUserForm',e);
    msg.textContent='Fehler: '+(e.code||e.message);msg.className='hint err-text';
  }
}

// ---------- Offizielle Daten (Admin) ----------
let _oeTrainings=[];
let _oeUser=null;
function openOfficialEdit(){
  const u=_pmUser;if(!u)return;
  _oeUser=u.username;
  const p=_profiles[u.username]||PROFILE_DEFAULTS;
  closeModalById('profile-modal');
  $('oe-title').textContent='Offizielle Daten — '+u.username;
  sv2('oe-passid',p.passId);sv2('oe-position',p.position);
  sv2('oe-hiredate',p.hireDate);sv2('oe-lastpromo',p.lastPromo);
  _oeTrainings=(p.trainings||[]).map(t=>({...t}));
  renderOfficialTrainingList();
  $('oe-msg').textContent='';
  const m=$('oe-lookup-msg');m.textContent='Lupe: Rang, Eintrittsdatum und Ausbildungen aus dem Mitarbeiterverzeichnis übernehmen.';m.className='hint';
  openModal('officialedit-modal');
}
function lookupDirectoryForOfficial(){
  const id=gv('oe-passid').trim();
  const msg=$('oe-lookup-msg');
  if(!id)return;
  const m=MA.find(x=>x.id===id);
  if(!m){msg.textContent='Keine Person mit dieser ID im Mitarbeiterverzeichnis gefunden.';msg.className='hint err-text';return;}
  sv2('oe-position',m.rank);sv2('oe-hiredate',dmyToIso(m.date));sv2('oe-lastpromo',dmyToIso(m.lastPromo));
  const found=getTrainingsForId(m.id);
  found.forEach(t=>{
    const ex=_oeTrainings.find(x=>x.name.toLowerCase()===t.name.toLowerCase());
    if(ex)ex.passed=t.passed;else _oeTrainings.push({...t});
  });
  renderOfficialTrainingList();
  msg.innerHTML=`Übernommen: <b>${esc(m.name)}</b> · ${esc(m.rank)} · ${found.filter(t=>t.passed).length}/${found.length} Ausbildungen bestanden.`;
  msg.className='hint ok-text';
}
function addOfficialTrainingRow(){
  if(!requireFields([['oe-train-name','Name der Ausbildung']]))return;
  _oeTrainings.push({name:gv('oe-train-name').trim(),passed:gv('oe-train-status')==='1'});
  sv2('oe-train-name','');
  renderOfficialTrainingList();
}
function renderOfficialTrainingList(){
  const box=$('oe-train-list');
  if(!_oeTrainings.length){box.innerHTML='<div class="hint">Noch keine Schulungen hinzugefügt.</div>';return;}
  box.innerHTML=_oeTrainings.map((t,i)=>`<div class="train-row">
    <span class="grow">${esc(t.name)}</span>${trainBadge(t)}
    <button class="btn sm danger icon" data-action="oe-remove-training" data-arg="${i}" title="Entfernen"><i class="ti ti-x"></i></button>
  </div>`).join('');
}
async function saveOfficialProfile(){
  const msg=$('oe-msg');msg.textContent='Speichert …';msg.className='hint';
  const data={passId:gv('oe-passid').trim(),position:gv('oe-position').trim(),hireDate:gv('oe-hiredate'),lastPromo:gv('oe-lastpromo'),trainings:_oeTrainings};
  try{
    await saveProfile(_oeUser,data);
    if(_oeUser===currentUser){currentProfile={...currentProfile,...data};renderMyProfile();}
    closeModalById('officialedit-modal');
    showToast('Gespeichert');
    renderUserList();
  }catch(e){
    console.error('saveOfficialProfile',e);
    msg.textContent='Fehler beim Speichern. Verbindung prüfen.';msg.className='hint err-text';
  }
}

Object.assign(ACTIONS,{
  'self-edit':openSelfEdit,
  'self-lookup':lookupDirectoryForSelf,
  'self-save':saveSelfProfile,
  'open-profile':openProfileModal,
  'temp-password':adminIssueTempPassword,
  'delete-user':adminDeleteUser,
  'create-user':openCreateUser,
  'edit-roles':openEditRoles,
  'user-save':submitUserForm,
  'official-edit':openOfficialEdit,
  'official-lookup':lookupDirectoryForOfficial,
  'oe-add-training':addOfficialTrainingRow,
  'oe-remove-training':(i)=>{_oeTrainings.splice(+i,1);renderOfficialTrainingList();},
  'official-save':saveOfficialProfile,
  'copy-temp':(pw)=>copyText(pw,'Passwort kopiert')
});
Object.assign(CHANGES,{'self-photo':handleSelfPhotoUpload});
