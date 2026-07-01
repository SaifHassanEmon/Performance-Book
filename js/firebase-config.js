/* ============================================================
   Firebase Configuration
   Determines if Firebase is configured and initializes it.
   Falls back to local mock mode if config is not setup yet.
   ============================================================ */

let FirebaseAvailable = false;
let dbFirestore = null;

// User can replace these placeholder values with their real Firebase project details.
const firebaseConfig = {
  apiKey: "AIzaSyCnScI6UqBYwwuLkk9OEv0ZRcxu6c9OijQ",
  authDomain: "performance-book.firebaseapp.com",
  projectId: "performance-book",
  storageBucket: "performance-book.firebasestorage.app",
  messagingSenderId: "849707090155",
  appId: "1:849707090155:web:2f5cef4b22c29324a67eae"
};

// Check if the user has plugged in their real credentials
const isConfigured = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "YOUR_API_KEY" && 
  firebaseConfig.projectId && 
  firebaseConfig.projectId !== "YOUR_PROJECT_ID";

if (isConfigured && typeof firebase !== 'undefined') {
  try {
    localStorage.removeItem('perfbook_firebase_error');
    firebase.initializeApp(firebaseConfig);
    dbFirestore = firebase.firestore();
    FirebaseAvailable = true;
    console.log("Firebase initialized successfully in online mode.");

    // Enable offline persistence in Firestore for better UX
    try {
      dbFirestore.enablePersistence().catch((err) => {
        console.warn('Firestore persistence failed:', err);
        localStorage.setItem('perfbook_firebase_persist_error', err.message || String(err));
      });
    } catch (persistErr) {
      console.warn("Firestore offline persistence failed to initialize:", persistErr);
      localStorage.setItem('perfbook_firebase_persist_error', persistErr.message || String(persistErr));
    }
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    localStorage.setItem('perfbook_firebase_error', error.message || String(error));
  }
} else {
  const reason = typeof firebase === 'undefined' ? 'firebase SDK not loaded/undefined' : 'Firebase not configured in config file';
  console.log("Running in LOCAL-FIRST (Offline/Mock) mode. Reason: " + reason);
  localStorage.setItem('perfbook_firebase_error', reason);
}
