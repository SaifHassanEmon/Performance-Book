/* ============================================================
   Admin Panel Page
   Provides views for listing all registered users, promoting roles,
   and assigning supervised Uposakhas to supervisors.
   ============================================================ */

Router.register('admin', async function (container) {
  let usersList = [];
  let searchQuery = '';

  async function renderPage() {
    const user = Auth.getCurrentUser();
    const isAdmin = user && (user.isAdmin || user.role === 'admin');
    if (!user || !isAdmin) {
      container.innerHTML = `
        <div class="glass-card" style="text-align:center; padding:var(--space-2xl) var(--space-lg); margin-top:var(--space-xl);">
          <div style="font-size:3rem; margin-bottom:var(--space-md);">⚠️</div>
          <h3 style="font-weight:700;">Unauthorized Access</h3>
          <p style="color:var(--text-secondary); margin-top:var(--space-sm); font-size:0.875rem;">You need Administrator credentials to view this page.</p>
          <button id="admin-back-login-btn" class="btn btn-primary" style="margin-top:var(--space-lg);">Back to Login</button>
        </div>
      `;
      container.querySelector('#admin-back-login-btn').addEventListener('click', () => {
        Router.navigate('login');
      });
      return;
    }

    container.removeAttribute('style'); // Clear any page-specific scrolling overrides
    
    try {
      usersList = await Sync.getAllUsers();
    } catch (e) {
      console.error(e);
      App.showToast("Failed to load user information", "error");
    }

    renderContent();
  }

  function renderContent() {
    // Filter users based on search
    const filteredUsers = usersList.filter(u => {
      const q = searchQuery.toLowerCase();
      return (
        (u.displayName || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.mobile || '').toLowerCase().includes(q) ||
        (u.university || '').toLowerCase().includes(q) ||
        (u.uposakha || '').toLowerCase().includes(q)
      );
    });

    let usersHtml = '';
    if (filteredUsers.length === 0) {
      usersHtml = `
        <div class="empty-state" style="padding: var(--space-2xl) 0;">
          <div class="empty-state-icon">👥</div>
          <div class="empty-state-title">No Users Found</div>
          <div class="empty-state-text">No registered users matched your search criteria.</div>
        </div>
      `;
    } else {
      filteredUsers.forEach(u => {
        const isSuper = u.isSupervisor || u.role === 'supervisor';
        const supervised = u.supervisedUposakhas || [];
        
        usersHtml += `
          <div class="glass-card" style="margin-bottom: var(--space-md); padding: var(--space-lg); display: flex; flex-direction: column; gap: var(--space-sm);">
            
            <!-- User Basic Info Header -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px;">
              <div>
                <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--green-400);">${u.displayName || 'Unnamed User'}</h4>
                <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">${u.email}</p>
                ${u.mobile ? `<p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 1px;">📞 ${u.mobile}</p>` : ''}
              </div>
              <div style="display: flex; flex-direction: column; gap: var(--space-xs); align-items: flex-end;">
                <!-- Membership Select -->
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Membership:</span>
                  <select class="form-input admin-role-select" data-uid="${u.uid}" style="width: 120px; padding: 4px 8px; font-size: 0.8125rem; border-radius: 6px; cursor: pointer; border: 1px solid var(--border-color); background: rgba(0,0,0,0.2); color: var(--text-primary);">
                    <option value="member" ${u.role === 'member' || !u.role || u.role === 'supervisor' || u.role === 'admin' ? 'selected' : ''} style="background-color: #1f2937; color: var(--text-primary);">Member</option>
                    <option value="Associate" ${u.role === 'Associate' ? 'selected' : ''} style="background-color: #1f2937; color: var(--text-primary);">Associate</option>
                    <option value="worker" ${u.role === 'worker' ? 'selected' : ''} style="background-color: #1f2937; color: var(--text-primary);">Worker</option>
                    <option value="Supporter" ${u.role === 'Supporter' ? 'selected' : ''} style="background-color: #1f2937; color: var(--text-primary);">Supporter</option>
                  </select>
                </div>

                <!-- Role Options (Supervisor / Admin Checkboxes) -->
                <div style="display: flex; gap: 12px; margin-top: 4px;">
                  <label style="display: flex; align-items: center; gap: 4px; font-size: 0.75rem; cursor: pointer; color: var(--text-primary); font-weight: 600;">
                    <input type="checkbox" class="admin-supervisor-check" data-uid="${u.uid}" ${u.isSupervisor || u.role === 'supervisor' ? 'checked' : ''} style="accent-color: var(--color-primary);"> Supervisor
                  </label>
                  <label style="display: flex; align-items: center; gap: 4px; font-size: 0.75rem; cursor: pointer; color: var(--text-primary); font-weight: 600;">
                    <input type="checkbox" class="admin-admin-check" data-uid="${u.uid}" ${u.isAdmin || u.role === 'admin' ? 'checked' : ''} style="accent-color: var(--color-primary);"> Admin
                  </label>
                </div>
              </div>
            </div>

            <!-- Profile Info Grid -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; margin-top: var(--space-xs); padding-top: var(--space-sm); border-top: 1px solid var(--border-color); font-size: 0.75rem; color: var(--text-secondary);">
              <div><strong>University:</strong> ${u.university || '–'}</div>
              <div><strong>Blood Group:</strong> <span style="color: var(--color-error); font-weight: 700;">${u.bloodGroup || '–'}</span></div>
              
              <!-- Sakha Select -->
              <div style="display: flex; align-items: center; gap: 4px;">
                <span style="font-weight: bold;">Sakha:</span>
                <select class="form-input admin-sakha-select" data-uid="${u.uid}" style="width: 110px; padding: 2px 4px; font-size: 0.75rem; border-radius: 4px; cursor: pointer; border: 1px solid var(--border-color); background: rgba(0,0,0,0.2); color: var(--text-primary);">
                  <option value="" ${!u.sakha ? 'selected' : ''} style="background-color: #1f2937; color: var(--text-primary);">–</option>
                  <option value="Private University" ${u.sakha === 'Private University' ? 'selected' : ''} style="background-color: #1f2937; color: var(--text-primary);">Private University</option>
                  <option value="West" ${u.sakha === 'West' ? 'selected' : ''} style="background-color: #1f2937; color: var(--text-primary);">West</option>
                </select>
              </div>

              <!-- Thana Select -->
              <div style="display: flex; align-items: center; gap: 4px;">
                <span style="font-weight: bold;">Thana:</span>
                <select class="form-input admin-thana-select" data-uid="${u.uid}" style="width: 100px; padding: 2px 4px; font-size: 0.75rem; border-radius: 4px; cursor: pointer; border: 1px solid var(--border-color); background: rgba(0,0,0,0.2); color: var(--text-primary);">
                  <option value="" ${!u.thana ? 'selected' : ''} style="background-color: #1f2937; color: var(--text-primary);">–</option>
                  <option value="DCS" ${u.thana === 'DCS' ? 'selected' : ''} style="background-color: #1f2937; color: var(--text-primary);">DCS</option>
                  <option value="Software" ${u.thana === 'Software' ? 'selected' : ''} style="background-color: #1f2937; color: var(--text-primary);">Software</option>
                  <option value="Engineering" ${u.thana === 'Engineering' ? 'selected' : ''} style="background-color: #1f2937; color: var(--text-primary);">Engineering</option>
                </select>
              </div>

              <!-- Uposakha Select -->
              <div style="display: flex; align-items: center; gap: 4px;">
                <span style="font-weight: bold;">Uposakha:</span>
                <select class="form-input admin-uposakha-select" data-uid="${u.uid}" style="width: 100px; padding: 2px 4px; font-size: 0.75rem; border-radius: 4px; cursor: pointer; border: 1px solid var(--border-color); background: rgba(0,0,0,0.2); color: var(--text-primary);">
                  <option value="" ${!u.uposakha ? 'selected' : ''} style="background-color: #1f2937; color: var(--text-primary);">–</option>
                  <option value="Safa" ${u.uposakha === 'Safa' ? 'selected' : ''} style="background-color: #1f2937; color: var(--text-primary);">Safa</option>
                  <option value="Marwa" ${u.uposakha === 'Marwa' ? 'selected' : ''} style="background-color: #1f2937; color: var(--text-primary);">Marwa</option>
                  <option value="Jabale Arafa" ${u.uposakha === 'Jabale Arafa' ? 'selected' : ''} style="background-color: #1f2937; color: var(--text-primary);">Jabale Arafa</option>
                </select>
              </div>
            </div>

            <!-- Supervised Uposakhas selection (rendered only if role is supervisor) -->
            <div class="supervised-section" id="super-section-${u.uid}" style="display: ${isSuper ? 'block' : 'none'}; margin-top: var(--space-xs); padding: var(--space-sm); background: rgba(16, 185, 129, 0.04); border-radius: 6px; border: 1px dashed rgba(16, 185, 129, 0.15);">
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--green-400); margin-bottom: 6px;">Supervised Uposakhas:</div>
              <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                <label style="display: flex; align-items: center; gap: 4px; font-size: 0.75rem; cursor: pointer; color: var(--text-primary);">
                  <input type="checkbox" class="super-uposakha-check" data-uid="${u.uid}" value="Safa" ${supervised.includes('Safa') ? 'checked' : ''} style="accent-color: var(--color-primary);"> Safa
                </label>
                <label style="display: flex; align-items: center; gap: 4px; font-size: 0.75rem; cursor: pointer; color: var(--text-primary);">
                  <input type="checkbox" class="super-uposakha-check" data-uid="${u.uid}" value="Marwa" ${supervised.includes('Marwa') ? 'checked' : ''} style="accent-color: var(--color-primary);"> Marwa
                </label>
                <label style="display: flex; align-items: center; gap: 4px; font-size: 0.75rem; cursor: pointer; color: var(--text-primary);">
                  <input type="checkbox" class="super-uposakha-check" data-uid="${u.uid}" value="Jabale Arafa" ${supervised.includes('Jabale Arafa') ? 'checked' : ''} style="accent-color: var(--color-primary);"> Jabale Arafa
                </label>
              </div>
            </div>

          </div>
        `;
      });
    }

    container.innerHTML = `
      <!-- Admin Header -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-lg); margin-top:var(--space-md);">
        <div>
          <h2 style="font-size:1.25rem; font-weight:800; color:var(--text-primary);" data-i18n="admin.title">${I18n.t('admin.title')}</h2>
          <p style="font-size:0.75rem; color:var(--text-muted);" data-i18n="admin.subtitle">${I18n.t('admin.subtitle')}</p>
        </div>
        <button id="admin-logout-btn" class="btn" style="background: rgba(239, 68, 68, 0.1); color: var(--color-error); border: 1px solid rgba(239, 68, 68, 0.2); padding: 6px 12px; font-size: 0.8125rem; font-weight: 600; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
          <span>Logout</span>
        </button>
      </div>

      <!-- Search Box -->
      <div class="form-group" style="margin-bottom: var(--space-lg);">
        <input type="text" id="admin-search-input" class="form-input" placeholder="Search by name, email, university, uposakha..." value="${searchQuery}">
      </div>

      <!-- User List Container -->
      <div style="margin-bottom: var(--space-2xl);">
        <h3 class="settings-group-title" style="margin-bottom: var(--space-md);">All Registered Profiles</h3>
        ${usersHtml}
      </div>
    `;

    wireEvents();
  }

  function wireEvents() {
    // Logout button click
    const logoutBtn = container.querySelector('#admin-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        if (confirm("Are you sure you want to log out?")) {
          try {
            await Auth.logout();
            App.showToast("Logged out successfully", "success");
            Router.navigate('login');
          } catch (e) {
            console.error(e);
            App.showToast("Failed to log out", "error");
          }
        }
      });
    }

    // Search input
    const searchInput = container.querySelector('#admin-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        // Re-render only list part to avoid losing focus if user is typing
        renderContent();
        // Refocus and place cursor at the end
        const newSearchInput = container.querySelector('#admin-search-input');
        if (newSearchInput) {
          newSearchInput.focus();
          newSearchInput.setSelectionRange(searchQuery.length, searchQuery.length);
        }
      });
    }

    // Membership Select
    container.querySelectorAll('.admin-role-select').forEach(select => {
      select.addEventListener('change', async () => {
        const uid = select.getAttribute('data-uid');
        const newRole = select.value;
        const targetUser = usersList.find(u => u.uid === uid);
        if (!targetUser) return;

        App.showToast("Updating membership...", "info");
        try {
          await Sync.adminUpdateUser(uid, { role: newRole });
          targetUser.role = newRole;
          App.showToast(`${targetUser.displayName}'s membership updated to ${newRole}!`, "success");
        } catch (err) {
          console.error(err);
          App.showToast("Failed to update membership", "error");
        }
      });
    });

    // Supervisor toggle
    container.querySelectorAll('.admin-supervisor-check').forEach(check => {
      check.addEventListener('change', async () => {
        const uid = check.getAttribute('data-uid');
        const isSupervisor = check.checked;
        const targetUser = usersList.find(u => u.uid === uid);
        if (!targetUser) return;

        App.showToast(isSupervisor ? "Promoting to Supervisor..." : "Demoting from Supervisor...", "info");
        try {
          const updates = { isSupervisor };
          if (!isSupervisor && targetUser.role === 'supervisor') {
            updates.role = 'member';
            targetUser.role = 'member';
          }
          if (isSupervisor && !targetUser.supervisedUposakhas) {
            updates.supervisedUposakhas = [];
            targetUser.supervisedUposakhas = [];
          }
          await Sync.adminUpdateUser(uid, updates);
          targetUser.isSupervisor = isSupervisor;

          App.showToast(isSupervisor ? "Promoted to Supervisor successfully!" : "Supervisor privileges removed.", "success");
          
          // Show or hide uposakha select section
          const superSection = container.querySelector(`#super-section-${uid}`);
          if (superSection) {
            superSection.style.display = isSupervisor ? 'block' : 'none';
          }
        } catch (err) {
          console.error(err);
          App.showToast("Failed to update Supervisor privileges", "error");
          check.checked = !isSupervisor; // Revert
        }
      });
    });

    // Admin toggle
    container.querySelectorAll('.admin-admin-check').forEach(check => {
      check.addEventListener('change', async () => {
        const uid = check.getAttribute('data-uid');
        const isAdmin = check.checked;
        const targetUser = usersList.find(u => u.uid === uid);
        if (!targetUser) return;

        const confirmMsg = isAdmin 
          ? `Are you sure you want to make ${targetUser.displayName} an Admin? Admins have full access to all system data and roles.`
          : `Are you sure you want to remove Admin privileges from ${targetUser.displayName}?`;
        
        if (!confirm(confirmMsg)) {
          check.checked = !isAdmin; // Revert checkbox without saving
          return;
        }

        App.showToast(isAdmin ? "Promoting to Admin..." : "Demoting from Admin...", "info");
        try {
          const updates = { isAdmin };
          if (!isAdmin && targetUser.role === 'admin') {
            updates.role = 'member';
            targetUser.role = 'member';
          }
          await Sync.adminUpdateUser(uid, updates);
          targetUser.isAdmin = isAdmin;

          App.showToast(isAdmin ? "Promoted to Admin successfully!" : "Admin privileges removed.", "success");
        } catch (err) {
          console.error(err);
          App.showToast("Failed to update Admin privileges", "error");
          check.checked = !isAdmin; // Revert
        }
      });
    });

    // Checkbox changes for supervised uposakhas
    container.querySelectorAll('.super-uposakha-check').forEach(check => {
      check.addEventListener('change', async () => {
        const uid = check.getAttribute('data-uid');
        const targetUser = usersList.find(u => u.uid === uid);
        if (!targetUser) return;

        const checks = container.querySelectorAll(`.super-uposakha-check[data-uid="${uid}"]`);
        const selectedUposakhas = [];
        checks.forEach(c => {
          if (c.checked) {
            selectedUposakhas.push(c.value);
          }
        });

        App.showToast("Saving assignments...", "info");
        try {
          await Sync.adminUpdateUser(uid, { supervisedUposakhas: selectedUposakhas });
          targetUser.supervisedUposakhas = selectedUposakhas;
          App.showToast("Supervised Uposakhas updated!", "success");
        } catch (err) {
          console.error(err);
          App.showToast("Failed to update Uposakhas", "error");
          check.checked = !check.checked; // Revert
        }
      });
    });

    // Sakha selection
    container.querySelectorAll('.admin-sakha-select').forEach(select => {
      select.addEventListener('change', async () => {
        const uid = select.getAttribute('data-uid');
        const val = select.value;
        App.showToast("Updating Sakha...", "info");
        try {
          await Sync.adminUpdateUser(uid, { sakha: val });
          const target = usersList.find(u => u.uid === uid);
          if (target) target.sakha = val;
          App.showToast("Sakha updated successfully!", "success");
        } catch (err) {
          console.error(err);
          App.showToast("Failed to update Sakha", "error");
        }
      });
    });

    // Thana selection
    container.querySelectorAll('.admin-thana-select').forEach(select => {
      select.addEventListener('change', async () => {
        const uid = select.getAttribute('data-uid');
        const val = select.value;
        App.showToast("Updating Thana...", "info");
        try {
          await Sync.adminUpdateUser(uid, { thana: val });
          const target = usersList.find(u => u.uid === uid);
          if (target) target.thana = val;
          App.showToast("Thana updated successfully!", "success");
        } catch (err) {
          console.error(err);
          App.showToast("Failed to update Thana", "error");
        }
      });
    });

    // Uposakha selection
    container.querySelectorAll('.admin-uposakha-select').forEach(select => {
      select.addEventListener('change', async () => {
        const uid = select.getAttribute('data-uid');
        const val = select.value;
        App.showToast("Updating Uposakha...", "info");
        try {
          await Sync.adminUpdateUser(uid, { uposakha: val });
          const target = usersList.find(u => u.uid === uid);
          if (target) target.uposakha = val;
          App.showToast("Uposakha updated successfully!", "success");
        } catch (err) {
          console.error(err);
          App.showToast("Failed to update Uposakha", "error");
        }
      });
    });
  }

  await renderPage();
});
