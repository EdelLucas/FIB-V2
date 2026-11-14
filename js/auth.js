// FIB Personalabteilung · Accounts, Login/Logout, Rollen, Topbar-Avatar
// ===================== ACCOUNTS =====================
// Zugangsdaten (Zugangskennung/Passwort-Hash/Rollen) UND Profil-Daten (Foto, Name,
// Telefon, Bio, Position, Schulungen ...) liegen beide in Firestore und werden
// automatisch gespeichert -- kein Code-Edit, kein GitHub-Commit noetig.
//   Collection "fib_users"     -> Zugangsdaten (Dokument-ID = Zugangskennung)
//   Collection "fib_profiles"  -> Profil-Daten (Dokument-ID = Zugangskennung)
//
// Jede Person pflegt Foto/Name/Telefon/Bio selbst unter "Mein Profil". Admins legen
// Accounts an und pflegen Rollen/Position/Eintrittsdatum/Beförderung/Schulungen unter
// "Benutzerverwaltung" -- alles speichert sofort für alle sichtbar.
//
// Achtung: Wer die Firebase-Keys im Quelltext kennt (stehen offen da), koennte
// theoretisch direkt auf die Firestore-Collections zugreifen. Das reicht als
// Zugangshuerde (Link/Repo nicht oeffentlich bekannt), ist aber KEINE belastbare
// Sicherheit fuer wirklich sensible Daten.
//
// NOTFALL-ZUGANG: Dieser eine Account ist fest im Code hinterlegt und funktioniert
// IMMER, selbst wenn Firestore mal nicht erreichbar ist oder noch leer ist (Bootstrap).
// Sobald du für "admin" einen echten Account in der Benutzerverwaltung anlegst/speicherst,
// hat der Firestore-Eintrag automatisch Vorrang vor diesem Notfall-Zugang.
// Passwort ändern: Browser-Konsole (F12) -> fibHash('DeinPasswort').then(h=>console.log(h))
// -> Hash unten einsetzen.
const FALLBACK_ADMIN = {
  username:'admin', roles:['admin'], mustChange:false,
  passHash:'15221d5e748afa63d8ad7b6110dba4b9fbf27f995b25964abb0f5ae1d889d478' // Standard: "fib2026" -- BITTE AENDERN!
};

let currentUser = null;     // Username (string) des eingeloggten Nutzers
let currentRoles = [];      // z.B. ['hr','fibco']
let currentName = '';       // aus dem Firestore-Profil geladen
let currentProfile = {};    // komplettes Firestore-Profil des eingeloggten Nutzers
let _pendingLoginUser = null; // Account-Objekt, das gerade durch den Pflicht-Passwortwechsel muss
const PROFILE_DEFAULTS = {name:'',photo:'',passId:'',phone:'',position:'',hireDate:'',lastPromo:'',bio:'',trainings:[],themeColor:''};

async function fibHash(str){
  const enc=new TextEncoder().encode(str);
  const buf=await crypto.subtle.digest('SHA-256',enc);
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}
window.fibHash = fibHash; // damit man es bei Bedarf in der Browser-Konsole nutzen kann

// --- Firestore: Zugangsdaten laden/speichern ---
async function loadAccount(username){
  username=(username||'').toLowerCase();
  if(!username)return null;
  try{
    if(!fbReady) await initFirebase();
    if(!fbReady) throw new Error('init-failed');
    const snap=await window._fbGet(window._fbDocFn('fib_users',username));
    if(snap.exists()) return {username,...snap.data()};
  }catch(e){console.error('loadAccount error',e);}
  if(username===FALLBACK_ADMIN.username) return {...FALLBACK_ADMIN};
  return null;
}
async function loadAllAccounts(){
  const list=[];
  try{
    if(!fbReady) await initFirebase();
    if(!fbReady) throw new Error('init-failed');
    const snap=await window._fbGetDocs(window._fbCollection(db,'fib_users'));
    snap.forEach(d=>list.push({username:d.id,...d.data()}));
  }catch(e){console.error('loadAllAccounts error',e);}
  if(!list.find(u=>u.username.toLowerCase()===FALLBACK_ADMIN.username)) list.unshift({...FALLBACK_ADMIN});
  return list;
}
async function saveAccount(username,data){
  if(!fbReady) await initFirebase();
  if(!fbReady) throw new Error('init-failed');
  await window._fbSet(window._fbDocFn('fib_users',username.toLowerCase()),data,{merge:true});
}
async function deleteAccount(username){
  if(!fbReady) await initFirebase();
  if(!fbReady) throw new Error('init-failed');
  await window._fbDeleteDoc(window._fbDocFn('fib_users',username.toLowerCase()));
}

// --- Firestore: Profil-Daten laden/speichern ---
async function loadProfile(username){
  try{
    if(!fbReady) await initFirebase();
    if(!fbReady) throw new Error('init-failed');
    const snap=await window._fbGet(window._fbDocFn('fib_profiles',username.toLowerCase()));
    if(snap.exists()) return {...PROFILE_DEFAULTS,...snap.data()};
    return {...PROFILE_DEFAULTS};
  }catch(e){
    console.error('loadProfile error',e);
    return {...PROFILE_DEFAULTS};
  }
}
async function loadAllProfiles(){
  const map={};
  try{
    if(!fbReady) await initFirebase();
    if(!fbReady) throw new Error('init-failed');
    const snap=await window._fbGetDocs(window._fbCollection(db,'fib_profiles'));
    snap.forEach(d=>{map[d.id]={...PROFILE_DEFAULTS,...d.data()};});
  }catch(e){console.error('loadAllProfiles error',e);}
  return map;
}
async function saveProfile(username,data){
  if(!fbReady) await initFirebase();
  if(!fbReady) throw new Error('init-failed');
  await window._fbSet(window._fbDocFn('fib_profiles',username.toLowerCase()),data,{merge:true});
}

// --- LOGIN / LOGOUT ---
async function doLogin(){
  const user=gv('login-email').trim().toLowerCase();
  const pass=gv('login-pass');
  const errEl=document.getElementById('login-err');
  const btn=document.getElementById('login-btn');
  errEl.textContent='';
  if(!user||!pass){errEl.textContent='Bitte Zugangskennung und Passwort eingeben.';return;}
  btn.disabled=true;btn.textContent='Anmelden ...';
  const found=await loadAccount(user);
  if(!found){btn.disabled=false;btn.innerHTML='<i class="ti ti-login"></i> ANMELDEN';errEl.textContent='Zugangskennung oder Passwort falsch.';return;}
  const hash=await fibHash(pass);
  btn.disabled=false;btn.innerHTML='<i class="ti ti-login"></i> ANMELDEN';
  if(hash!==found.passHash){errEl.textContent='Zugangskennung oder Passwort falsch.';return;}
  if(found.mustChange){
    _pendingLoginUser=found;
    document.getElementById('login-screen').classList.add('hide');
    document.getElementById('pwchange-screen').classList.add('show');
    return;
  }
  await completeLogin(found);
}
async function completeLogin(found){
  currentUser=found.username;currentRoles=found.roles||[];
  currentProfile=await loadProfile(found.username);
  currentName=currentProfile.name||found.username;
  try{localStorage.setItem('fib_session',JSON.stringify({u:found.username}));}catch(e){}
  if(currentProfile.themeColor){
    setCol(currentProfile.themeColor);
    const cp=document.getElementById('colpick');if(cp)cp.value=currentProfile.themeColor;
  }
  showApp();
}
function doLogout(){
  currentUser=null;currentRoles=[];currentName='';currentProfile={};
  try{localStorage.removeItem('fib_session');}catch(e){}
  document.getElementById('app-root').classList.add('hide');
  document.getElementById('login-screen').classList.remove('hide');
  sv2('login-pass','');
}
async function tryRestoreSession(){
  try{
    const raw=localStorage.getItem('fib_session');
    if(!raw)return false;
    const s=JSON.parse(raw);
    const found=await loadAccount(s.u);
    if(!found){try{localStorage.removeItem('fib_session');}catch(e){}return false;}
    if(found.mustChange)return false; // zur Sicherheit erneut einloggen lassen
    await completeLogin(found);
    return true;
  }catch(e){return false;}
}
function showApp(){
  document.getElementById('login-screen').classList.add('hide');
  document.getElementById('pwchange-screen').classList.remove('show');
  document.getElementById('app-root').classList.remove('hide');
  applyRoleVisibility();
  startAppData();
  sv('dash',null);
}

// Pflicht-Passwortwechsel abschicken (bei temporaerem Passwort) -- speichert jetzt
// direkt in Firestore, kein Umweg mehr noetig.
async function submitPasswordChange(){
  const p1=gv('pwchange-new'),p2=gv('pwchange-confirm');
  const errEl=document.getElementById('pwchange-err');
  errEl.textContent='';
  if(!p1||p1.length<6){errEl.textContent='Mindestens 6 Zeichen verwenden.';return;}
  if(p1!==p2){errEl.textContent='Passwörter stimmen nicht überein.';return;}
  const found=_pendingLoginUser;
  if(!found){errEl.textContent='Fehler — bitte neu anmelden.';return;}
  const hash=await fibHash(p1);
  try{
    await saveAccount(found.username,{passHash:hash,mustChange:false,roles:found.roles||[]});
  }catch(e){
    console.error('submitPasswordChange error',e);
    errEl.textContent='Fehler beim Speichern. Verbindung prüfen.';
    return;
  }
  found.passHash=hash;found.mustChange=false;
  await completeLogin(found);
  showToast('Passwort geändert und gespeichert');
}

function hasRole(r){
  if(!currentRoles)return false;
  if(currentRoles.includes('admin'))return true;
  if(currentRoles.includes('leader') && r!=='admin')return true;
  return currentRoles.includes(r);
}

// Von der Topbar-Anzeige ("Name · Rollen") direkt zum eigenen Profil springen
function goToAccountSystem(){
  sv('profil',null);
}

function toggleUserDropdown(e){
  if(e) e.stopPropagation();
  const dd=document.getElementById('user-dropdown');
  if(!dd)return;
  const willShow = dd.style.display==='none' || !dd.style.display;
  if(willShow) populateUserDropdown();
  dd.style.display = willShow ? 'block' : 'none';
}
function closeUserDropdown(){
  const dd=document.getElementById('user-dropdown');
  if(dd) dd.style.display='none';
}
function populateUserDropdown(){
  const name=currentName||currentUser||'';
  const photo=(currentProfile&&currentProfile.photo)||'';
  const avEl=document.getElementById('ud-avatar');
  if(avEl) avEl.innerHTML = photo ? `<img src="${photo}" class="avatar-mini" style="width:30px;height:30px;">` : `<span class="avatar-mini-ph" style="width:30px;height:30px;font-size:11px;">${initials(name)}</span>`;
  const nameEl=document.getElementById('ud-name'); if(nameEl) nameEl.textContent=name;
  const rolesEl=document.getElementById('ud-roles'); if(rolesEl) rolesEl.textContent=(currentRoles||[]).join(', ')||'--';
}
// Dropdown schliessen, wenn irgendwo anders hin geklickt wird
document.addEventListener('click', function(e){
  const wrap=document.getElementById('user-menu-wrap');
  const dd=document.getElementById('user-dropdown');
  if(!wrap||!dd||dd.style.display==='none')return;
  if(!wrap.contains(e.target)) closeUserDropdown();
});

// Sidebar + Module nach Rolle ein-/ausblenden
function applyRoleVisibility(){
  document.querySelectorAll('.ni[data-roles]').forEach(el=>{
    const need=el.getAttribute('data-roles');
    el.style.display = hasRole(need) ? '' : 'none';
  });
  const chip=document.getElementById('user-chip');
  if(chip) chip.textContent=(currentName||currentUser||'')+' · '+(currentRoles.join(', ')||'--');
  updateTopbarAvatar();
  const tdPanel=document.getElementById('td-corrections-panel');
  if(tdPanel){
    tdPanel.style.display = hasRole('admin') ? 'block' : 'none';
    if(hasRole('admin')) renderTdCorrections();
  }
}
function updateTopbarAvatar(){
  const wrap=document.getElementById('user-avatar-wrap');
  if(!wrap)return;
  const name=currentName||currentUser||'';
  const photo=(currentProfile&&currentProfile.photo)||'';
  wrap.innerHTML = photo
    ? `<img src="${photo}" class="avatar-mini">`
    : `<span class="avatar-mini-ph">${initials(name)}</span>`;
}

function initials(name){
  if(!name)return'?';
  return name.trim().split(/\s+/).slice(0,2).map(p=>p[0]).join('').toUpperCase();
}
function avatarHtml(name,photo){
  if(photo) return `<img src="${photo}" class="avatar">`;
  return `<div class="avatar-ph">${initials(name)}</div>`;
}
function trainRowsHtml(trainings){
  if(!trainings||!trainings.length) return '';
  return trainings.map(t=>`<tr><td>${t.name}</td><td style="text-align:right"><span class="train-badge ${t.passed?'train-pass':'train-fail'}">${t.passed?'BESTANDEN':'NICHT ABSOLVIERT'}</span></td></tr>`).join('');
}

