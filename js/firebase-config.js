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
    firebase.initializeApp(firebaseConfig);
    dbFirestore = firebase.firestore();
    FirebaseAvailable = true;
    console.log("Firebase initialized successfully in online mode.");

    // Enable offline persistence in Firestore for better UX
    try {
      dbFirestore.enablePersistence().catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('Firestore persistence failed: Multiple tabs open');
        } else if (err.code === 'unimplemented') {
          console.warn('Firestore persistence is not supported by this browser');
        }
      });
    } catch (persistErr) {
      console.warn("Firestore offline persistence failed to initialize:", persistErr);
    }
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
  console.log("Running in LOCAL-FIRST (Offline/Mock) mode. Configure Firebase in js/firebase-config.js to sync online.");
}
