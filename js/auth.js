// FIB Personalabteilung · Anmeldung über Firebase Authentication, Rollen, Topbar
//
// Ablauf:
//   fib_login/<kennung>    {key}                    öffentlich lesbar (nur einzeln, keine Liste)
//   fib_users/<kennung>    {roles, authKey, mustChange}   nur für sich selbst + Admins
//   fib_profiles/<kennung> {name, photo, ...}             für angemeldete Nutzer
//   fib_meta/bootstrap     existiert, sobald der erste Admin eingerichtet ist
//
// Die Passwörter verwaltet ausschließlich Firebase (sicher gehasht, mit Schutz gegen
// Durchprobieren). Im Code und in Firestore steht kein Passwort und kein Hash mehr.
// Wird einer Person ein neues Passwort vergeben, bekommt sie einen neuen "authKey" –
// der alte Login ist damit sofort ungültig.

let currentUser=null;      // Kennung (string)
let currentRoles=[];
let currentName='';
let currentProfile={};
let currentAccount=null;
let _authMode='login';     // login | bootstrap
let _bootstrapping=false;  // unterdrückt den Auth-Listener während der Ersteinrichtung
const PROFILE_DEFAULTS={name:'',photo:'',passId:'',phone:'',position:'',hireDate:'',lastPromo:'',bio:'',trainings:[],themeColor:''};
const USERNAME_RE=/^[a-z0-9._-]{3,32}$/;

function hasRole(r){
  if(!currentRoles)return false;
  if(currentRoles.includes('admin'))return true;
  if(currentRoles.includes('leader')&&r!=='admin')return true;
  return currentRoles.includes(r);
}

// ---------- Firestore-Zugriffe ----------
async function loadAccount(username){
  await initFirebase();
  const snap=await FB.fs.getDoc(fbDoc('fib_users',username));
  return snap.exists()?{username,...snap.data()}:null;
}
async function loadProfile(username){
  try{
    await initFirebase();
    const snap=await FB.fs.getDoc(fbDoc('fib_profiles',username));
    return snap.exists()?{...PROFILE_DEFAULTS,...snap.data()}:{...PROFILE_DEFAULTS};
  }catch(e){console.error('loadProfile',e);return{...PROFILE_DEFAULTS};}
}
async function saveProfile(username,data){
  await initFirebase();
  await FB.fs.setDoc(fbDoc('fib_profiles',username),data,{merge:true});
}

// ---------- Login-Bildschirm ----------
function setLoginBusy(busy,label){
  const btn=$('login-btn');
  btn.disabled=busy;
  btn.innerHTML=busy?`<span class="spinner"></span> ${esc(label||'Bitte warten …')}`:(_authMode==='bootstrap'?'<i class="ti ti-shield-check"></i> ADMIN EINRICHTEN':'<i class="ti ti-login"></i> ANMELDEN');
}
function loginError(msg){ $('login-err').textContent=msg||''; }

async function prepareLoginScreen(){
  // Prüfen, ob schon ein Admin eingerichtet wurde – sonst Ersteinrichtung anzeigen
  try{
    await initFirebase();
    const snap=await FB.fs.getDoc(fbDoc('fib_meta','bootstrap'));
    setAuthMode(snap.exists()?'login':'bootstrap');
  }catch(e){
    console.error(e);
    setAuthMode('login');
    loginError('Server nicht erreichbar. Internetverbindung prüfen und Seite neu laden.');
  }
}
function setAuthMode(mode){
  _authMode=mode;
  const boot=mode==='bootstrap';
  show('login-bootstrap',boot);
  $('login-sub').textContent=boot?'ERSTEINRICHTUNG · ERSTEN ADMIN ANLEGEN':'GRANDRP DE01 · ZUGANG ERFORDERLICH';
  $('login-pass').autocomplete=boot?'new-password':'current-password';
  setLoginBusy(false);
}

async function doLogin(){
  loginError('');
  const user=gv('login-user').trim().toLowerCase();
  const pass=gv('login-pass');
  if(!requireFields([['login-user','Zugangskennung eingeben'],['login-pass','Passwort eingeben']]))return;
  if(_authMode==='bootstrap')return doBootstrap(user,pass);
  setLoginBusy(true,'Anmelden …');
  try{
    await initFirebase();
    const loginSnap=await FB.fs.getDoc(fbDoc('fib_login',user));
    if(!loginSnap.exists()){
      loginError('Zugangskennung oder Passwort falsch. Bestehende alte Accounts müssen vom Admin einmal neu aktiviert werden.');
      return;
    }
    await FB.au.signInWithEmailAndPassword(FB.auth,authMail(user,loginSnap.data().key),pass);
    // Rest übernimmt onAuthStateChanged -> handleSignedIn
  }catch(e){
    console.warn('Login fehlgeschlagen',e.code||e);
    if(e.code==='auth/too-many-requests') loginError('Zu viele Fehlversuche. Bitte später erneut versuchen.');
    else if(e.code==='auth/network-request-failed') loginError('Keine Verbindung zum Server.');
    else loginError('Zugangskennung oder Passwort falsch.');
  }finally{ setLoginBusy(false); }
}

// Ersteinrichtung: erster Admin. Zur Absicherung muss das bisherige Admin-Passwort
// (aus der alten Version) angegeben werden – das prüfen die Firestore-Regeln.
async function doBootstrap(user,pass){
  if(!USERNAME_RE.test(user)){fieldError('login-user','3–32 Zeichen: a–z, 0–9, Punkt, Minus, Unterstrich');return;}
  if(pass.length<8){fieldError('login-pass','Mindestens 8 Zeichen');return;}
  if(!requireFields([['login-pass2','Passwort wiederholen'],['login-proof','Bisheriges Admin-Passwort eingeben']]))return;
  if(gv('login-pass2')!==pass){fieldError('login-pass2','Passwörter stimmen nicht überein');return;}
  setLoginBusy(true,'Richte ein …');
  _bootstrapping=true;
  const key=newAuthKey();
  let cred=null;
  try{
    // Nachweis zuerst ablegen (nicht lesbar), danach Admin + Bootstrap-Marker gemeinsam schreiben
    await FB.fs.setDoc(fbDoc('fib_meta','bootstrap_proof'),{p:gv('login-proof')});
    cred=await FB.au.createUserWithEmailAndPassword(FB.auth,authMail(user,key),pass);
    const b=FB.fs.writeBatch(FB.db);
    b.set(fbDoc('fib_users',user),{roles:['admin'],authKey:key,mustChange:false});
    b.set(fbDoc('fib_login',user),{key});
    b.set(fbDoc('fib_meta','bootstrap'),{by:user,at:Date.now()});
    await b.commit();
    showToast('Admin eingerichtet');
    _bootstrapping=false;
    handleSignedIn(cred.user);
  }catch(e){
    console.error('Bootstrap',e);
    if(cred){ try{await cred.user.delete();}catch(_){} }
    try{await FB.au.signOut(FB.auth);}catch(_){}
    if(isPermissionError(e)) loginError('Einrichtung abgelehnt: Bisheriges Admin-Passwort falsch oder bereits eingerichtet.');
    else if(e.code==='auth/operation-not-allowed') loginError('In Firebase ist "E-Mail/Passwort"-Anmeldung noch nicht aktiviert (siehe SETUP.md).');
    else loginError('Einrichtung fehlgeschlagen: '+(e.code||e.message));
    prepareLoginScreen();
  }finally{ _bootstrapping=false; setLoginBusy(false); }
}

let _handlingSignIn=false;
async function handleSignedIn(fbUser){
  if(_handlingSignIn)return;
  _handlingSignIn=true;
  try{
    const {username,key}=usernameFromAuth(fbUser);
    let acc=null;
    try{ acc=await loadAccount(username); }catch(e){ acc=null; }
    if(!acc||acc.authKey!==key||acc.disabled){
      await FB.au.signOut(FB.auth);
      loginError('Dieser Zugang ist nicht mehr gültig. Bitte mit dem aktuellen Passwort anmelden.');
      showLogin();
      return;
    }
    currentAccount=acc;
    currentUser=username;
    currentRoles=acc.roles||[];
    if(acc.mustChange){ showPwChange(); return; }
    await completeLogin();
  }finally{ _handlingSignIn=false; }
}
async function completeLogin(){
  currentProfile=await loadProfile(currentUser);
  currentName=currentProfile.name||currentUser;
  if(currentProfile.themeColor){ setCol(currentProfile.themeColor); sv2('colpick',currentProfile.themeColor); }
  showApp();
}

function showLogin(){
  $('boot-screen').hidden=true;
  $('app-root').hidden=true;
  $('pwchange-screen').hidden=true;
  $('login-screen').hidden=false;
  sv2('login-pass','');sv2('login-pass2','');sv2('login-proof','');
  prepareLoginScreen();
}
function showPwChange(){
  $('boot-screen').hidden=true;
  $('login-screen').hidden=true;
  $('app-root').hidden=true;
  $('pwchange-screen').hidden=false;
  sv2('pwchange-new','');sv2('pwchange-confirm','');
  $('pwchange-err').textContent='';
  setTimeout(()=>$('pwchange-new').focus(),50);
}
function showApp(){
  $('boot-screen').hidden=true;
  $('login-screen').hidden=true;
  $('pwchange-screen').hidden=true;
  $('app-root').hidden=false;
  applyRoleVisibility();
  startAppData();
  sv('dash');
}

async function doLogout(){
  closeUserDropdown();
  stopAppData();
  currentUser=null;currentRoles=[];currentName='';currentProfile={};currentAccount=null;
  try{ await FB.au.signOut(FB.auth); }catch(e){}
  showLogin();
}
// Wird aufgerufen, wenn Firestore plötzlich den Zugriff verweigert
// (z. B. Passwort wurde vom Admin zurückgesetzt oder Account gelöscht)
let _lostAccessShown=false;
async function handleLostAccess(){
  if(_lostAccessShown||!currentUser)return;
  _lostAccessShown=true;
  await doLogout();
  loginError('Deine Sitzung ist nicht mehr gültig. Bitte neu anmelden.');
  _lostAccessShown=false;
}

// Pflicht-Passwortwechsel bei temporärem Passwort
async function submitPasswordChange(){
  const p1=gv('pwchange-new'),p2=gv('pwchange-confirm');
  const errEl=$('pwchange-err');errEl.textContent='';
  if(p1.length<8){fieldError('pwchange-new','Mindestens 8 Zeichen');return;}
  if(p1!==p2){fieldError('pwchange-confirm','Passwörter stimmen nicht überein');return;}
  const btn=$('pwchange-btn');btn.disabled=true;
  try{
    await FB.au.updatePassword(FB.auth.currentUser,p1);
    await FB.fs.updateDoc(fbDoc('fib_users',currentUser),{mustChange:false});
    currentAccount.mustChange=false;
    showToast('Passwort geändert');
    await completeLogin();
  }catch(e){
    console.error('submitPasswordChange',e);
    if(e.code==='auth/requires-recent-login'){errEl.textContent='Sitzung abgelaufen – bitte erneut mit dem temporären Passwort anmelden.';setTimeout(doLogout,2500);}
    else errEl.textContent='Fehler beim Speichern: '+(e.code||e.message);
  }finally{ btn.disabled=false; }
}

// Eigenes Passwort ändern (Mein Profil)
async function changeOwnPassword(){
  const cur=await uiPrompt('Aktuelles Passwort eingeben:',{title:'Passwort ändern',inputType:'password',okText:'Weiter'});
  if(cur===null)return;
  const nw=await uiPrompt('Neues Passwort (mindestens 8 Zeichen):',{title:'Passwort ändern',inputType:'password',minLength:8,okText:'Weiter'});
  if(nw===null)return;
  const nw2=await uiPrompt('Neues Passwort wiederholen:',{title:'Passwort ändern',inputType:'password',okText:'Speichern'});
  if(nw2===null)return;
  if(nw!==nw2){uiAlert('Die Passwörter stimmen nicht überein.');return;}
  try{
    const u=FB.auth.currentUser;
    await FB.au.reauthenticateWithCredential(u,FB.au.EmailAuthProvider.credential(u.email,cur));
    await FB.au.updatePassword(u,nw);
    showToast('Passwort geändert');
  }catch(e){
    console.error(e);
    uiAlert(e.code==='auth/wrong-password'||e.code==='auth/invalid-credential'?'Das aktuelle Passwort ist falsch.':'Passwort konnte nicht geändert werden ('+(e.code||e.message)+').');
  }
}

// ---------- Topbar / Rollen ----------
function toggleUserDropdown(){
  const dd=$('user-dropdown');
  if(dd.hidden) populateUserDropdown();
  dd.hidden=!dd.hidden;
}
function closeUserDropdown(){ const dd=$('user-dropdown'); if(dd)dd.hidden=true; }
function populateUserDropdown(){
  $('ud-avatar').innerHTML=avatarHtml(currentName||currentUser,currentProfile.photo,'mini lg');
  $('ud-name').textContent=currentName||currentUser||'';
  $('ud-roles').textContent=roleLabels(currentRoles);
}
document.addEventListener('click',e=>{
  const wrap=$('user-menu-wrap'),dd=$('user-dropdown');
  if(wrap&&dd&&!dd.hidden&&!wrap.contains(e.target)) closeUserDropdown();
});
function roleLabels(roles){
  const map=Object.fromEntries(ROLES);
  return (roles||[]).map(r=>map[r]||r).join(', ')||'--';
}
function applyRoleVisibility(){
  document.querySelectorAll('[data-roles]').forEach(el=>{ el.hidden=!hasRole(el.dataset.roles); });
  $('user-chip').textContent=currentName||currentUser||'';
  setOb('dash-user',currentName||currentUser||'--');
  setOb('dash-roles',roleLabels(currentRoles));
  updateTopbarAvatar();
}
function updateTopbarAvatar(){
  $('user-avatar-wrap').innerHTML=avatarHtml(currentName||currentUser,currentProfile.photo,'mini');
}
function initials(name){
  if(!name)return'?';
  return name.trim().split(/\s+/).slice(0,2).map(p=>p[0]).join('').toUpperCase();
}
// size: '' (normal), 'mini', 'mini lg'
function avatarHtml(name,photo,size){
  const src=safeImg(photo);
  const cls=size?'avatar '+size:'avatar';
  return src?`<img src="${esc(src)}" class="${cls}" alt="">`:`<span class="${cls} ph">${esc(initials(name))}</span>`;
}
function trainRowsHtml(trainings){
  return (trainings||[]).map(t=>`<tr><td>${esc(t.name)}</td><td class="right">${trainBadge(t)}</td></tr>`).join('');
}
function trainBadge(t,extra){
  return `<span class="train-badge ${t.passed?'train-pass':'train-fail'}">${extra||(t.passed?'BESTANDEN':'NICHT ABSOLVIERT')}</span>`;
}

Object.assign(ACTIONS,{
  'login':doLogin,
  'logout':doLogout,
  'pw-change':submitPasswordChange,
  'own-password':changeOwnPassword,
  'user-menu':(a,el,e)=>{e.stopPropagation();toggleUserDropdown();},
  'my-profile':()=>{closeUserDropdown();sv('profil');}
});
