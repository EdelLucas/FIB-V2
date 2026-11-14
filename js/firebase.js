// FIB Personalabteilung · Firebase / Firestore Initialisierung
// ===================== MITARBEITER =====================
// Cloud-Storage via Firebase Firestore
// Konfiguration fest eingebaut — jeder der die Seite öffnet sieht dieselben Daten

const FB_CFG = {
  apiKey: "AIzaSyCjEshCZt8zXldiTfGiiCOz_mtRE30UGOY",
  authDomain: "fib-lst-d75cd.firebaseapp.com",
  projectId: "fib-lst-d75cd",
  storageBucket: "fib-lst-d75cd.firebasestorage.app",
  messagingSenderId: "293546236665",
  appId: "1:293546236665:web:cb2599998ef01ef6a2a028"
};

// Firebase über CDN laden
let db = null;
let fbReady = false;
let _unsubscribe = null; // Live-Listener stoppen falls nötig
let _isPushing = false;  // Verhindert eigene Änderungen als "extern" zu behandeln

async function initFirebase() {
  try {
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    const { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, getDocs, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    const app = initializeApp(FB_CFG);
    db = getFirestore(app);
    window._fbDoc  = () => doc(db, 'fib', 'data');
    window._fbDocFn = (col, id) => doc(db, col, id);
    window._fbSet  = setDoc;
    window._fbGet  = getDoc;
    window._fbListen = onSnapshot;
    window._fbCollection = collection;
    window._fbGetDocs = getDocs;
    window._fbDeleteDoc = deleteDoc;
    fbReady = true;
    return true;
  } catch(e) {
    console.error('Firebase init error:', e);
    return false;
  }
}

