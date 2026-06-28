/* ============================================================
   Authentication Layer
   Supports Firebase Authentication + Firestore (for real cloud deployment)
   and localStorage-based mock Auth (for instant local testing).
   ============================================================ */

const Auth = (() => {
  let authCallbacks = [];
  let currentUser = null;

  // Initialize Auth module
  function init() {
    // Check for hardcoded supervisor session
    const isSupervisorSession = localStorage.getItem('perfbook_supervisor_session') === 'true';
    if (isSupervisorSession) {
      currentUser = {
        uid: 'hardcoded_supervisor_uid',
        email: 'supervisor@icsbook.info',
        displayName: 'Supervisor',
        role: 'supervisor',
        supervisedUposakhas: ['Safa', 'Marwa', 'Jabale Arafa']
      };
      setTimeout(() => triggerCallbacks(), 100);
      return;
    }

    // Check for hardcoded admin session
    const isAdminSession = localStorage.getItem('perfbook_admin_session') === 'true';
    if (isAdminSession) {
      currentUser = {
        uid: 'hardcoded_admin_uid',
        email: 'admin@icsbook.info',
        displayName: 'Admin',
        role: 'admin'
      };
      setTimeout(() => triggerCallbacks(), 100);
      return;
    }

    if (FirebaseAvailable) {
      // Listen to real Firebase auth changes
      firebase.auth().onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser && firebaseUser.emailVerified) {
          try {
            // Get user role/profile from Firestore
            const doc = await dbFirestore.collection('users').doc(firebaseUser.uid).get();
            if (doc.exists) {
              const profile = doc.data();
              currentUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: profile.displayName || firebaseUser.displayName || 'User',
                role: profile.role || 'member',
                ...profile
              };
            } else {
              // Fallback if document not created yet
              currentUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName || 'User',
                role: 'member'
              };
            }
          } catch (e) {
            console.error("Error fetching Firestore user profile:", e);
            currentUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || 'User',
              role: 'member'
            };
          }
        } else {
          currentUser = null;
        }
        triggerCallbacks();
      });
    } else {
      // Initialize default mock users if none exist or merge missing seeds in localStorage
      let users = JSON.parse(localStorage.getItem('perfbook_mock_users') || '[]');
      
      const seedUsers = [
        {
          uid: 'mock_uid_supervisor',
          email: 'supervisor@icsbook.info',
          password: 'supervisor123',
          displayName: 'Saif Hassan Emon',
          role: 'supervisor',
          mobile: '01711223344',
          university: 'Daffodil International University',
          sakha: 'Private University',
          thana: 'Software',
          uposakha: 'Marwa',
          supervisedUposakhas: ['Marwa', 'Safa', 'Jabale Arafa'],
          createdAt: new Date().toISOString()
        },
        {
          uid: 'mock_uid_safa_member',
          email: 'safa_member@icsbook.info',
          password: 'member123',
          displayName: 'Safa Member One',
          role: 'member',
          mobile: '01999887766',
          university: 'Dhaka University',
          sakha: 'West',
          thana: 'DCS',
          uposakha: 'Safa',
          supervisedUposakhas: [],
          createdAt: new Date().toISOString()
        },
        {
          uid: 'mock_uid_marwa_member',
          email: 'marwa_member@icsbook.info',
          password: 'member123',
          displayName: 'Marwa Member One',
          role: 'member',
          mobile: '01888776655',
          university: 'Daffodil International University',
          sakha: 'Private University',
          thana: 'Software',
          uposakha: 'Marwa',
          supervisedUposakhas: [],
          createdAt: new Date().toISOString()
        },
        {
          uid: 'mock_uid_arafa_member',
          email: 'arafa_member@icsbook.info',
          password: 'member123',
          displayName: 'Jabale Arafa Member One',
          role: 'member',
          mobile: '01555443322',
          university: 'Chittagong University',
          sakha: 'East',
          thana: 'Engineering',
          uposakha: 'Jabale Arafa',
          supervisedUposakhas: [],
          createdAt: new Date().toISOString()
        }
      ];

      let updated = false;
      seedUsers.forEach(su => {
        const existingIdx = users.findIndex(u => u.uid === su.uid);
        if (existingIdx === -1) {
          users.push(su);
          updated = true;
        } else {
          if (su.uid === 'mock_uid_supervisor' && (!users[existingIdx].supervisedUposakhas || users[existingIdx].supervisedUposakhas.length < 3)) {
            users[existingIdx].supervisedUposakhas = su.supervisedUposakhas;
            updated = true;
          }
        }
      });

      if (updated || users.length === 0) {
        localStorage.setItem('perfbook_mock_users', JSON.stringify(users));
      }

      // Mock Auth initialization using localStorage
      const session = localStorage.getItem('perfbook_mock_session');
      if (session) {
        try {
          const parsed = JSON.parse(session);
          const latestUser = users.find(u => u.uid === parsed.uid);
          if (latestUser) {
            currentUser = { ...latestUser };
            delete currentUser.password;
            localStorage.setItem('perfbook_mock_session', JSON.stringify(currentUser));
          } else {
            currentUser = parsed;
          }
        } catch {
          currentUser = null;
        }
      } else {
        currentUser = null;
      }
      // Delay slightly to match async firebase load behavior
      setTimeout(() => triggerCallbacks(), 100);
    }
  }

  // Register state change listener
  function onAuthStateChanged(callback) {
    authCallbacks.push(callback);
    // Trigger immediately with current state if loaded
    callback(currentUser);
    return () => {
      authCallbacks = authCallbacks.filter(cb => cb !== callback);
    };
  }

  function triggerCallbacks() {
    authCallbacks.forEach(cb => cb(currentUser));
  }

  // Get currently logged-in user
  function getCurrentUser() {
    return currentUser;
  }

  // ---- Login ----
  async function login(email, password) {
    // Hardcoded admin login
    if (email.toLowerCase() === 'admin@icsbook.info' && password === 'admin123') {
      currentUser = {
        uid: 'hardcoded_admin_uid',
        email: 'admin@icsbook.info',
        displayName: 'Admin',
        role: 'admin'
      };
      localStorage.setItem('perfbook_admin_session', 'true');
      triggerCallbacks();
      return currentUser;
    }

    // Hardcoded supervisor login
    if (email.toLowerCase() === 'supervisor@icsbook.info' && password === 'supervisor123') {
      currentUser = {
        uid: 'hardcoded_supervisor_uid',
        email: 'supervisor@icsbook.info',
        displayName: 'Supervisor',
        role: 'supervisor',
        supervisedUposakhas: ['Safa', 'Marwa', 'Jabale Arafa']
      };
      localStorage.setItem('perfbook_supervisor_session', 'true');
      triggerCallbacks();
      return currentUser;
    }

    if (FirebaseAvailable) {
      const cred = await firebase.auth().signInWithEmailAndPassword(email, password);
      // Ensure email is verified
      if (!cred.user.emailVerified) {
        await firebase.auth().signOut();
        throw new Error("Your email address is not verified. Please check your inbox or spam folder for the verification link.");
      }
      return cred.user;
    } else {
      // Mock Login
      const users = JSON.parse(localStorage.getItem('perfbook_mock_users') || '[]');
      const user = users.find(u => u.email === email && u.password === password);
      if (!user) {
        throw new Error("Invalid email or password");
      }
      currentUser = { ...user };
      delete currentUser.password;
      localStorage.setItem('perfbook_mock_session', JSON.stringify(currentUser));
      triggerCallbacks();
      return currentUser;
    }
  }

  // ---- Login with Google ----
  async function loginWithGoogle() {
    if (FirebaseAvailable) {
      const provider = new firebase.auth.GoogleAuthProvider();
      const cred = await firebase.auth().signInWithPopup(provider);
      
      // Google accounts are pre-verified. Check/create user profile in Firestore
      const doc = await dbFirestore.collection('users').doc(cred.user.uid).get();
      let role = 'member';
      let profile = {};
      if (doc.exists) {
        profile = doc.data();
        role = profile.role || 'member';
      } else {
        profile = {
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: cred.user.displayName || 'Google User',
          role: 'member',
          createdAt: new Date().toISOString(),
          mobile: '',
          university: '',
          bloodGroup: '',
          sakha: '',
          thana: '',
          uposakha: '',
          supervisedUposakhas: []
        };
        await dbFirestore.collection('users').doc(cred.user.uid).set(profile);
      }

      currentUser = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName || 'Google User',
        role: role,
        ...profile
      };
      triggerCallbacks();
      return cred.user;
    } else {
      // Mock Google Login
      const mockUid = 'mock_google_uid';
      const mockEmail = 'googleuser@gmail.com';
      const mockName = 'Google User';
      
      const users = JSON.parse(localStorage.getItem('perfbook_mock_users') || '[]');
      let existingUser = users.find(u => u.email === mockEmail);
      if (!existingUser) {
        existingUser = {
          uid: mockUid,
          email: mockEmail,
          displayName: mockName,
          role: 'member',
          createdAt: new Date().toISOString(),
          mobile: '',
          university: '',
          bloodGroup: '',
          sakha: '',
          thana: '',
          uposakha: '',
          supervisedUposakhas: []
        };
        users.push(existingUser);
        localStorage.setItem('perfbook_mock_users', JSON.stringify(users));
      }
      
      currentUser = { ...existingUser };
      delete currentUser.password;
      localStorage.setItem('perfbook_mock_session', JSON.stringify(currentUser));
      triggerCallbacks();
      return currentUser;
    }
  }

  // ---- Register ----
  async function register(email, password, displayName, additionalData = {}) {
    if (FirebaseAvailable) {
      // Create user auth account
      const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
      
      // Update display name
      await cred.user.updateProfile({ displayName });

      // Save user profile & default role 'member' to Firestore
      const userProfile = {
        uid: cred.user.uid,
        email,
        displayName,
        role: 'member',
        createdAt: new Date().toISOString(),
        mobile: additionalData.mobile || '',
        university: additionalData.university || '',
        bloodGroup: additionalData.bloodGroup || '',
        sakha: '',
        thana: '',
        uposakha: '',
        supervisedUposakhas: []
      };
      await dbFirestore.collection('users').doc(cred.user.uid).set(userProfile);
      
      // Send verification email
      await cred.user.sendEmailVerification();

      // Sign out immediately so they must verify first before they can log in
      await firebase.auth().signOut();
      
      return cred.user;
    } else {
      // Mock Register
      const users = JSON.parse(localStorage.getItem('perfbook_mock_users') || '[]');
      if (users.some(u => u.email === email)) {
        throw new Error("Email already registered");
      }

      const newUser = {
        uid: 'mock_uid_' + Math.random().toString(36).substr(2, 9),
        email,
        password,
        displayName,
        role: 'member',
        createdAt: new Date().toISOString(),
        mobile: additionalData.mobile || '',
        university: additionalData.university || '',
        bloodGroup: additionalData.bloodGroup || '',
        sakha: '',
        thana: '',
        uposakha: '',
        supervisedUposakhas: []
      };
      
      users.push(newUser);
      localStorage.setItem('perfbook_mock_users', JSON.stringify(users));

      // We do not auto-login in mock mode to simulate needing to log in next
      return newUser;
    }
  }

  // ---- Logout ----
  async function logout() {
    localStorage.removeItem('perfbook_supervisor_session');
    localStorage.removeItem('perfbook_admin_session');
    if (FirebaseAvailable) {
      await firebase.auth().signOut();
    } else {
      currentUser = null;
      localStorage.removeItem('perfbook_mock_session');
      triggerCallbacks();
    }
  }

  return {
    init,
    onAuthStateChanged,
    getCurrentUser,
    login,
    loginWithGoogle,
    register,
    logout
  };
})();

// Initialize Auth module right away
Auth.init();
