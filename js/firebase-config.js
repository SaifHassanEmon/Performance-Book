/* ============================================================
   Firebase Configuration
   Determines if Firebase is configured and initializes it.
   Falls back to local mock mode if config is not setup yet.
   ============================================================ */

let FirebaseAvailable = false;
let dbFirestore = null;

// User can replace these placeholder values with their real Firebase project details.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
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
    // Enable offline persistence in Firestore for better UX
    dbFirestore.enablePersistence().catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence failed: Multiple tabs open');
      } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence is not supported by this browser');
      }
    });
    FirebaseAvailable = true;
    console.log("Firebase initialized successfully in online mode.");
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
  console.log("Running in LOCAL-FIRST (Offline/Mock) mode. Configure Firebase in js/firebase-config.js to sync online.");
}
