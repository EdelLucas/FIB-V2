// FIB Personalabteilung · Start der Anwendung

buildTemplates();
renderColorPresets();
restoreNavGroups();
renderThemeButtons();
renderTplVars();
try{ const c=localStorage.getItem('fib_color'); if(c)setCol(c); }catch(e){}
tick(); setInterval(tick,1000);
loadAbsIntoFields();
updateAllPreviews();
fcPreview();
refreshDirectory();

let _dataStarted=false;
function startAppData(){
  if(_dataStarted)return;
  _dataStarted=true;
  startStore();      // Firestore-Live-Daten (nur Bereiche, die der Nutzer sehen darf)
  startSheetSync();  // Mitarbeiterverzeichnis aus dem Google Sheet (alle 30 Sek.)
}
function stopAppData(){
  _dataStarted=false;
  stopStore();
  stopSheetSync();
}

// Anmeldestatus überwachen – Firebase merkt sich die Sitzung selbst.
(async()=>{
  try{
    await initFirebase();
  }catch(e){
    $('boot-screen').hidden=true;
    $('login-screen').hidden=false;
    loginError('Server nicht erreichbar. Internetverbindung prüfen und Seite neu laden.');
    return;
  }
  FB.au.onAuthStateChanged(FB.auth,user=>{
    if(_bootstrapping)return;
    if(user){ handleSignedIn(user); }
    else if(currentUser){ doLogout(); }
    else { showLogin(); }
  });
})();
