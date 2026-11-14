// FIB Personalabteilung · Cloud-Sync (Firestore) + Google-Sheet-Sync
// Einmaliges Laden + danach Live-Listener starten
async function cloudLoad() {
  setCloudStatus('loading');
  try {
    if (!fbReady) await initFirebase();
    if (!fbReady) throw new Error('Firebase nicht bereit');

    // Stoppe alten Listener falls vorhanden
    if (_unsubscribe) { _unsubscribe(); _unsubscribe = null; }

    // Live-Listener starten — feuert sofort einmal (initialer Load)
    // und danach bei jeder Änderung durch andere Nutzer
    _unsubscribe = window._fbListen(window._fbDoc(), (snap) => {
      if (_isPushing) return;
      if (snap.exists()) {
        const d = snap.data();
        if (Array.isArray(d.kl))  KL_DATA  = d.kl;
        if (Array.isArray(d.fc))  FC_DATA  = d.fc;
        if (Array.isArray(d.cid)) CID_DATA = d.cid;
        if (d.extraTrainings && typeof d.extraTrainings==='object') EXTRA_TRAININGS = d.extraTrainings;
        if (Array.isArray(d.cirgEvents)) CIRG_EVENTS = d.cirgEvents;
        if (Array.isArray(d.cirgLogs))   CIRG_LOGS   = d.cirgLogs;
        if (Array.isArray(d.lawCases))   LAW_CASES   = d.lawCases;
        if (Array.isArray(d.maOrder))    MA_ORDER    = d.maOrder;
      }
      klRender();
      fcRender();
      cidRender();
      if(typeof tdRenderList==='function') tdRenderList();
      if(typeof cirgRenderEvents==='function') cirgRenderEvents();
      if(typeof cirgRenderLogs==='function') cirgRenderLogs();
      if(typeof lawRender==='function') lawRender();
      if(typeof applyMaOrder==='function'){applyMaOrder();filterMA();}
      else buildMA();
      setCloudStatus('ok');
    }, (err) => {
      console.error('onSnapshot error:', err);
      setCloudStatus('err');
    });

    return true;
  } catch(e) {
    console.error('cloudLoad error:', e);
    try { const s = localStorage.getItem('fib_ma'); if (s) MA = JSON.parse(s); } catch(e2) {}
    try { const s = localStorage.getItem('fib_kl'); if (s) KL_DATA = JSON.parse(s); } catch(e2) {}
    setCloudStatus('err');
    return false;
  }
}

async function cloudPush() {
  try {
    if (!fbReady) await initFirebase();
    if (!fbReady) throw new Error('Firebase nicht bereit');
    _isPushing = true;
    setCloudStatus('saving');
    await window._fbSet(window._fbDoc(), {
      kl: KL_DATA, fc: FC_DATA, cid: CID_DATA,
      extraTrainings: EXTRA_TRAININGS, cirgEvents: CIRG_EVENTS, cirgLogs: CIRG_LOGS, lawCases: LAW_CASES, maOrder: MA_ORDER
    });
    setCloudStatus('ok');
    setTimeout(() => { _isPushing = false; }, 500);
  } catch(e) {
    console.error('cloudPush error:', e);
    _isPushing = false;
    try { localStorage.setItem('fib_ma', JSON.stringify(MA)); } catch(e2) {}
    try { localStorage.setItem('fib_kl', JSON.stringify(KL_DATA)); } catch(e2) {}
    setCloudStatus('err');
  }
}

function setCloudStatus(s) {
  const map = {
    ok:      ['var(--gr)', 'ONLINE — Verbunden', 4],
    err:     ['var(--re)', 'FEHLER — Verbindung prüfen', 1],
    loading: ['var(--wa)',   'Lade ...', 2],
    saving:  ['var(--wa)',   'Speichert ...', 3],
    off:     ['var(--mu)', 'OFFLINE', 0]
  };
  const [col, txt, bars] = map[s] || ['var(--mu)', s, 0];
  const el  = document.getElementById('cloud-status');
  const dot = document.getElementById('cloud-dot');
  const el2 = document.getElementById('cloud-status-cfg');
  if (el)  { el.style.color  = col; el.textContent  = txt; }
  if (dot) {
    const sigBars = dot.querySelectorAll('.sig-bar');
    sigBars.forEach((b,i)=>{ b.style.background = i < bars ? col : 'var(--bd)'; });
  }
  if (el2) { el2.style.color = col; el2.textContent = txt; }
}

// Kein saveCloudCfg / loadCloudCfgFields mehr nötig — Firebase ist fest eingebaut
function saveCloudCfg() { showToast('Firebase ist bereits eingebaut — kein Setup nötig!'); }
function loadCloudCfgFields() {}

// ===================== GOOGLE SHEETS LIVE SYNC =====================
const SHEET_ID = '1uzAA-_O2JtDBs3bpRG9Mqbva67dqh45LPDjPEf8-njQ';
const SHEET_GID = '1591796957';
let sheetSyncInterval = null;

function parseCSVLine(line) {
  const cols = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQ = !inQ; }
    else if (c === ',' && !inQ) { cols.push(cur.trim().replace(/^"|"$/g,'')); cur = ''; }
    else { cur += c; }
  }
  cols.push(cur.trim().replace(/^"|"$/g,''));
  return cols;
}

async function syncFromSheet() {
  const ss = document.getElementById('sheet-status');
  try {
    if(ss){ ss.textContent='Sheet: Lade ...'; ss.style.color='var(--wa)'; }
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Sheet nicht erreichbar');
    const csv = await res.text();
    const rows = csv.split('\n');

    // Spalten laut Sheet (0-basiert, Buchstabe → Index) -- verifiziert anhand des echten Sheets:
    // A=0,B=1,C=2,D=3,E=4,F=5,G=6,H=7,I=8,J=9,K=10,L=11,M=12,N=13,O=14,P=15,Q=16,R=17,S=18
    // B=ID(1), C=Name(2), D=Ranks(3), F=DN(5), I=Division's(8), K=Strike(10),
    // M=Invite Date(12), N=Last Rank(13) -- ist ein DATUM (letzte Beförderung, nicht Text!),
    // Q=Abt1(16), R=Abt2(17)
    // Schulungs-Hakchen (T=19,U=20,W=22,X=23,Y=24,Z=25,AA=26,AB=27; V=21 ist eine versteckte Spalte):
    // T=GA, U=EVS, W=AKS, X=TST, Y=VHF/EL, Z=JUR, AA=UC, AB=FTK

    const TRAIN_COLS = [
      {idx:19, name:'GA'},
      {idx:20, name:'EVS'},
      {idx:22, name:'AKS'},
      {idx:23, name:'TST'},
      {idx:24, name:'VHF/EL'},
      {idx:25, name:'JUR'},
      {idx:26, name:'UC'},
      {idx:27, name:'FTK'},
    ];
    function isChecked(val){
      if(!val)return false;
      const v=val.trim().toUpperCase();
      return v==='TRUE'||v==='WAHR'||v==='JA'||v==='X'||v==='1';
    }

    // Header steht in Zeile 9 (Index 8), Daten ab Zeile 10 (Index 9)
    // Wir suchen die Header-Zeile dynamisch (enthält "ID" und "Name")
    let dataStart = 9; // Standard: Zeile 10 (0-basiert = 9)
    for (let i = 0; i < Math.min(rows.length, 15); i++) {
      const r = parseCSVLine(rows[i]);
      if (r.some(c => c.trim().toUpperCase() === 'ID') && r.some(c => c.trim().toUpperCase() === 'NAME')) {
        dataStart = i + 1; // Daten fangen eine Zeile nach dem Header an
        break;
      }
    }

    const newMA = [];
    for (let i = dataStart; i < rows.length; i++) {
      if (!rows[i] || !rows[i].trim()) continue;
      const r = parseCSVLine(rows[i]);

      const id   = (r[1]||'').trim();
      const name = (r[2]||'').trim();
      if (!id && !name) continue; // Leere Zeile überspringen

      const abt1 = (r[16]||'').trim();
      const abt2 = (r[17]||'').trim();
      const abt  = [abt1, abt2].filter(Boolean).join(' | ');
      const trainings = TRAIN_COLS.map(tc => ({name:tc.name, passed:isChecked(r[tc.idx])}));

      newMA.push({
        id,
        name,
        rank:     (r[3] ||'').trim(),
        dn:       (r[5] ||'').trim(),
        div:      (r[8] ||'').trim(),
        strike:   (r[10]||'0/3').trim(),
        date:     (r[12]||'').trim(),  // Invite Date -> Eintrittsdatum
        lastPromo:(r[13]||'').trim(),  // Last Rank -> Datum der letzten Beförderung
        ausb:     '',
        trainings,
        abt,
        status: 'Aktiv',
        notes:  ''
      });
    }

    if (newMA.length > 0) {
      MA = newMA;
      applyMaOrder();
      filtered = [...MA];
      buildMA();
      if(typeof renderDeptMembers==='function'){
        ['fibco','cid','td','cirg','law'].forEach(p=>renderDeptMembers(p,p.toUpperCase()));
      }
      const dc = document.getElementById('dash-count'); if(dc) animateCount(dc, MA.length);
      const cc = document.getElementById('cfg-count');  if(cc) cc.textContent = MA.length;
      const b  = document.getElementById('ma-badge');   if(b)  b.textContent  = MA.length + ' AGENTEN';
      if(ss){
        const now = new Date();
        const t = [now.getHours(),now.getMinutes(),now.getSeconds()].map(n=>String(n).padStart(2,'0')).join(':');
        ss.textContent = 'Sheet: ✓ ' + t;
        ss.style.color = 'var(--gr)';
      }
    }
  } catch(e) {
    console.warn('Sheet sync error:', e);
    if(ss){ ss.textContent='Sheet: ✗ Fehler'; ss.style.color='var(--re)'; }
  }
}

function startSheetSync() {
  syncFromSheet();
  if (sheetSyncInterval) clearInterval(sheetSyncInterval);
  sheetSyncInterval = setInterval(syncFromSheet, 30000);
}

function saveMA() { /* MA kommt nur vom Google Sheet */ }
function resetData(){
  if(!confirm('Mitarbeiterliste vom Sheet neu laden?'))return;
  syncFromSheet();
  showToast('Sheet wird neu geladen...');
}

