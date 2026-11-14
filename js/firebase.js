// FIB Personalabteilung · Firebase (Firestore + Authentication)
//
// Hinweis: Die Firebase-Konfiguration ist absichtlich öffentlich – das ist bei
// Web-Apps normal. Geschützt werden die Daten durch Firebase Authentication +
// die Firestore-Sicherheitsregeln (Datei firestore.rules, siehe SETUP.md).

const FB_CFG = {
  apiKey: "AIzaSyCjEshCZt8zXldiTfGiiCOz_mtRE30UGOY",
  authDomain: "fib-lst-d75cd.firebaseapp.com",
  projectId: "fib-lst-d75cd",
  storageBucket: "fib-lst-d75cd.firebasestorage.app",
  messagingSenderId: "293546236665",
  appId: "1:293546236665:web:cb2599998ef01ef6a2a028"
};
const FB_VERSION = '10.12.0';
// Interne Login-Adressen: <kennung>+<schlüssel>@<domain>. Niemand muss eine
// echte E-Mail haben – angemeldet wird weiterhin nur mit Kennung + Passwort.
const AUTH_MAIL_DOMAIN = 'fib-lst-d75cd.firebaseapp.com';

const FB = { ready:false, app:null, db:null, auth:null, fs:{}, au:{} };
let _fbInitPromise = null;

function initFirebase(){
  if(_fbInitPromise) return _fbInitPromise;
  _fbInitPromise = (async()=>{
    const base=`https://www.gstatic.com/firebasejs/${FB_VERSION}`;
    const [appMod, fsMod, authMod] = await Promise.all([
      import(`${base}/firebase-app.js`),
      import(`${base}/firebase-firestore.js`),
      import(`${base}/firebase-auth.js`)
    ]);
    FB.app  = appMod.initializeApp(FB_CFG);
    FB.db   = fsMod.getFirestore(FB.app);
    FB.auth = authMod.getAuth(FB.app);
    FB.fs = {
      doc:fsMod.doc, getDoc:fsMod.getDoc, setDoc:fsMod.setDoc, updateDoc:fsMod.updateDoc,
      deleteDoc:fsMod.deleteDoc, onSnapshot:fsMod.onSnapshot, collection:fsMod.collection,
      getDocs:fsMod.getDocs, runTransaction:fsMod.runTransaction, writeBatch:fsMod.writeBatch,
      deleteField:fsMod.deleteField
    };
    FB.au = authMod;
    // Zweite App-Instanz NUR zum Anlegen fremder Accounts durch Admins –
    // sonst würde der Admin beim Anlegen selbst abgemeldet.
    const sec = appMod.initializeApp(FB_CFG,'account-creator');
    FB.secAuth = authMod.initializeAuth(sec,{persistence:authMod.inMemoryPersistence});
    FB.ready = true;
    return true;
  })().catch(e=>{
    console.error('Firebase init error:',e);
    _fbInitPromise=null;
    throw e;
  });
  return _fbInitPromise;
}

function fbDoc(col,id){ return FB.fs.doc(FB.db,col,id); }
function authMail(username,key){ return `${username}+${key}@${AUTH_MAIL_DOMAIN}`; }
// Kennung aus der Login-Adresse des angemeldeten Firebase-Users ermitteln
function usernameFromAuth(user){
  const mail=(user&&user.email)||'';
  const local=mail.split('@')[0]||'';
  const [name,key]=local.split('+');
  return {username:(name||'').toLowerCase(), key:key||''};
}
function newAuthKey(){
  return Array.from(crypto.getRandomValues(new Uint8Array(8)),b=>b.toString(16).padStart(2,'0')).join('');
}
function isPermissionError(e){ return e && (e.code==='permission-denied' || /permission/i.test(e.message||'')); }
