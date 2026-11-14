// FIB Personalabteilung · Initialisierung
// ===================== INIT =====================
let MA=DEF.map(m=>({...m}));
let filtered=[...MA];
let maPage=1;
const PER=15;

try{const c=localStorage.getItem('fib_color');if(c){setCol(c);const cp=document.getElementById('colpick');if(cp)cp.value=c;}}catch(e){}
tick();setInterval(tick,1000);
fillSelects();
buildMA();
loadAbsIntoFields();
klRender();
[upAz,upRa,upEs,upKu,upSa,upPa].forEach(f=>f());
showTplTab('rang',document.querySelector('.tpl-tab'));

// Login-Enter-Taste
['login-email','login-pass'].forEach(id=>{
  const el=document.getElementById(id);
  if(el)el.addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});
});

let _dataStarted=false;
function startAppData(){
  if(_dataStarted)return;
  _dataStarted=true;
  // Startet Firebase Live-Listener — lädt KL/FC/CID-Daten initial und bei jeder Änderung automatisch
  cloudLoad();
  // Startet Google Sheet Live-Sync für Mitarbeiterliste (alle 30 Sek.)
  startSheetSync();
}

// Versuche gespeicherte Login-Session wiederherzustellen (Login selbst braucht kein Firebase).
// Firebase/Firestore wird weiterhin nur für den Cloud-Datenabgleich (KL/FC/CID) genutzt
// und erst gestartet, sobald jemand erfolgreich eingeloggt ist (siehe startAppData()).
tryRestoreSession();
