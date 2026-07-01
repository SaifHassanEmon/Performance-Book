/* ============================================================
   Profile Page
   Displays user name, email, verification state, and supervisor role.
   ============================================================ */

Router.register('profile', async function (container) {
  const user = Auth.getCurrentUser();
  if (!user) {
    Router.navigate('login');
    return;
  }

  function renderView() {
    const isMock = !FirebaseAvailable;
    const isVerified = isMock ? true : (firebase.auth().currentUser?.emailVerified || false);
    let capRole = user.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Member';
    const isSuper = user.isSupervisor || user.role === 'supervisor';
    const isAdmin = user.isAdmin || user.role === 'admin';
    if (isAdmin) {
      capRole = capRole === 'Admin' ? 'Admin' : `${capRole} (Admin)`;
    } else if (isSuper) {
      capRole = capRole === 'Supervisor' ? 'Supervisor' : `${capRole} (Supervisor)`;
    }
    
    container.innerHTML = `
      <!-- Back button and title -->
      <div style="display:flex; align-items:center; gap:var(--space-md); margin-bottom:var(--space-lg); margin-top:var(--space-md);">
        <button id="profile-back-btn" class="header-btn" style="color:var(--text-secondary); background: none; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 4px;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <div>
          <h2 style="font-size:1.1rem; font-weight:800;" data-i18n="profile.title">${I18n.t('profile.title')}</h2>
          <p style="font-size:0.75rem; color:var(--text-muted);">Manage your personal account info</p>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: var(--space-lg); margin-bottom: var(--space-xl);">
        
        <!-- Profile Card -->
        <div class="glass-card" style="text-align: center; padding: var(--space-xl);">
          <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, var(--green-500), var(--green-300)); color: white; font-size: 2.25rem; font-weight: 800; display: flex; align-items: center; justify-content: center; margin: 0 auto var(--space-md) auto; border: 3px solid rgba(255,255,255,0.1); filter: drop-shadow(0 4px 10px rgba(16,185,129,0.25));">
            ${user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
          </div>
          <h3 style="font-weight: 700; font-size: 1.15rem; color: var(--text-primary); margin-bottom: 2px;">${user.displayName}</h3>
          <p style="font-size: 0.8125rem; color: var(--text-secondary);">${user.email}</p>
        </div>

        <!-- Details List -->
        <div class="glass-card" style="padding: var(--space-lg);">
          
          <!-- Full Name -->
          <div style="display:flex; justify-content:space-between; padding:var(--space-md) 0; border-bottom:1px solid var(--border-color); font-size:0.875rem;">
            <span style="color:var(--text-secondary);" data-i18n="profile.name">${I18n.t('profile.name')}</span>
            <span style="color:var(--text-primary); font-weight:600;">${user.displayName}</span>
          </div>

          <!-- Email Address -->
          <div style="display:flex; justify-content:space-between; padding:var(--space-md) 0; border-bottom:1px solid var(--border-color); font-size:0.875rem;">
            <span style="color:var(--text-secondary);" data-i18n="profile.email">${I18n.t('profile.email')}</span>
            <span style="color:var(--text-primary); font-weight:600;">${user.email}</span>
          </div>

          <!-- Mobile Number -->
          <div style="display:flex; justify-content:space-between; padding:var(--space-md) 0; border-bottom:1px solid var(--border-color); font-size:0.875rem;">
            <span style="color:var(--text-secondary);">Mobile Number</span>
            <span style="color:var(--text-primary); font-weight:600;">${user.mobile || '–'}</span>
          </div>

          <!-- University -->
          <div style="display:flex; justify-content:space-between; padding:var(--space-md) 0; border-bottom:1px solid var(--border-color); font-size:0.875rem;">
            <span style="color:var(--text-secondary);">University</span>
            <span style="color:var(--text-primary); font-weight:600;">${user.university || '–'}</span>
          </div>

          <!-- Blood Group -->
          <div style="display:flex; justify-content:space-between; padding:var(--space-md) 0; border-bottom:1px solid var(--border-color); font-size:0.875rem;">
            <span style="color:var(--text-secondary);">Blood Group</span>
            <span style="color:var(--color-error); font-weight:700;">${user.bloodGroup || '–'}</span>
          </div>

          <!-- Sakha -->
          ${user.sakha ? `
          <div style="display:flex; justify-content:space-between; padding:var(--space-md) 0; border-bottom:1px solid var(--border-color); font-size:0.875rem;">
            <span style="color:var(--text-secondary);">Sakha</span>
            <span style="color:var(--text-primary); font-weight:600;">${user.sakha}</span>
          </div>
          ` : ''}

          <!-- Thana -->
          ${user.thana ? `
          <div style="display:flex; justify-content:space-between; padding:var(--space-md) 0; border-bottom:1px solid var(--border-color); font-size:0.875rem;">
            <span style="color:var(--text-secondary);">Thana</span>
            <span style="color:var(--text-primary); font-weight:600;">${user.thana}</span>
          </div>
          ` : ''}

          <!-- Ward -->
          ${user.ward ? `
          <div style="display:flex; justify-content:space-between; padding:var(--space-md) 0; border-bottom:1px solid var(--border-color); font-size:0.875rem;">
            <span style="color:var(--text-secondary);">Ward</span>
            <span style="color:var(--text-primary); font-weight:600;">${user.ward}</span>
          </div>
          ` : ''}

          <!-- Uposakha -->
          ${user.uposakha ? `
          <div style="display:flex; justify-content:space-between; padding:var(--space-md) 0; border-bottom:1px solid var(--border-color); font-size:0.875rem;">
            <span style="color:var(--text-secondary);">Uposakha</span>
            <span style="color:var(--green-400); font-weight:700;">${user.uposakha}</span>
          </div>
          ` : ''}

          <!-- Supervised Uposakhas (if supervisor) -->
          ${(user.isSupervisor || user.role === 'supervisor') ? `
          <div style="display:flex; justify-content:space-between; padding:var(--space-md) 0; border-bottom:1px solid var(--border-color); font-size:0.875rem;">
            <span style="color:var(--text-secondary);">Supervised Uposakhas</span>
            <span style="color:var(--green-400); font-weight:700; text-align: right;">${(user.supervisedUposakhas || []).join(', ') || 'None'}</span>
          </div>
          ` : ''}

          <!-- Assigned Role -->
          <div style="display:flex; justify-content:space-between; padding:var(--space-md) 0; border-bottom:1px solid var(--border-color); font-size:0.875rem;">
            <span style="color:var(--text-secondary);" data-i18n="profile.role">${I18n.t('profile.role')}</span>
            <div style="text-align: right;">
              <span style="color:var(--color-primary); font-weight:700;">${capRole}</span>
              <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 2px;" data-i18n="profile.assignedBy">${I18n.t('profile.assignedBy')}</div>
            </div>
          </div>

          <!-- Account Status -->
          <div style="display:flex; justify-content:space-between; padding:var(--space-md) 0; font-size:0.875rem;">
            <span style="color:var(--text-secondary);" data-i18n="profile.status">${I18n.t('profile.status')}</span>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="badge ${isVerified ? 'badge-green' : 'badge-amber'}" data-i18n="${isVerified ? 'profile.verified' : 'profile.unverified'}">
                ${I18n.t(isVerified ? 'profile.verified' : 'profile.unverified')}
              </span>
              ${(!isVerified && !isMock) ? `<button id="profile-resend-verification-btn" style="border: none; background: none; color: var(--color-primary); font-size: 0.75rem; font-weight: 600; cursor: pointer; text-decoration: underline; padding: 2px;">Resend Email</button>` : ''}
            </div>
          </div>

        </div>

        <!-- Thana Dashboard Button (if co-admin) -->
        ${(user.isCoAdmin || user.role === 'co-admin') ? `
        <button id="profile-thana-btn" class="btn btn-primary" style="width: 100%; padding: 12px; font-weight: 700; border-radius: 8px; cursor: pointer; margin-bottom: var(--space-sm);">
          View Thana Dashboard
        </button>
        ` : ''}

        <!-- Admin Panel Button (if admin) -->
        ${(user.isAdmin || user.role === 'admin') ? `
        <button id="profile-admin-btn" class="btn btn-primary" style="width: 100%; padding: 12px; font-weight: 700; border-radius: 8px; cursor: pointer; margin-bottom: var(--space-sm);">
          View Admin Panel
        </button>
        ` : ''}

        <!-- Log Out Button -->
        <button id="profile-logout-btn" class="btn" style="width: 100%; padding: 12px; border: 1px solid rgba(239,68,68,0.25); background: rgba(239,68,68,0.03); color: var(--color-error); font-weight: 700; border-radius: 8px; cursor: pointer;" data-i18n="profile.signOut">
          ${I18n.t('profile.signOut')}
        </button>

      </div>
    `;

    wireEvents();
    I18n.applyLanguage();
  }

  function wireEvents() {
    // Back click
    const backBtn = container.querySelector('#profile-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        Router.navigate('settings');
      });
    }

    // Thana / Admin Dashboard clicks
    const thanaBtn = container.querySelector('#profile-thana-btn');
    if (thanaBtn) {
      thanaBtn.addEventListener('click', () => {
        Router.navigate('admin');
      });
    }
    const adminBtn = container.querySelector('#profile-admin-btn');
    if (adminBtn) {
      adminBtn.addEventListener('click', () => {
        Router.navigate('admin');
      });
    }

    // Logout click
    const logoutBtn = container.querySelector('#profile-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        App.showToast("Logging out...", "info");
        await Auth.logout();
        Router.navigate('login');
      });
    }

    // Resend verification click
    const resendBtn = container.querySelector('#profile-resend-verification-btn');
    if (resendBtn) {
      resendBtn.addEventListener('click', async () => {
        resendBtn.disabled = true;
        try {
          const firebaseUser = firebase.auth().currentUser;
          if (firebaseUser) {
            await firebaseUser.sendEmailVerification();
            App.showToast("Verification link sent! Check your inbox.", "success");
          }
        } catch (e) {
          console.error(e);
          App.showToast(e.message || "Failed to send verification link", "error");
          resendBtn.disabled = false;
        }
      });
    }
  }

  renderView();
});
