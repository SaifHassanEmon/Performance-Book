/* ============================================================
   Admin Panel Page
   Provides views for listing and editing user profiles, promoting roles,
   inspecting monthly booklets/daily logs, and dynamically managing the
   organization structure (Thana -> Ward -> Uposakha).
   ============================================================ */

Router.register('admin', async function (container) {
  let usersList = [];
  let orgStructure = { thanas: [], wards: [], uposakhas: [] };
  let searchQuery = '';
  let activeTab = 'profiles'; // profiles, org_structure
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  async function renderPage() {
    const user = Auth.getCurrentUser();
    const isAdmin = user && (user.isAdmin || user.role === 'admin');
    const isCoAdmin = user && (user.isCoAdmin || user.role === 'co-admin');

    if (!user || (!isAdmin && !isCoAdmin)) {
      container.innerHTML = `
        <div class="glass-card" style="text-align:center; padding:var(--space-2xl) var(--space-lg); margin-top:var(--space-xl);">
          <div style="font-size:3rem; margin-bottom:var(--space-md);">⚠️</div>
          <h3 style="font-weight:700;">Unauthorized Access</h3>
          <p style="color:var(--text-secondary); margin-top:var(--space-sm); font-size:0.875rem;">You need Administrator or Co-admin credentials to view this page.</p>
          <button id="admin-back-login-btn" class="btn btn-primary" style="margin-top:var(--space-lg);">Back to Login</button>
        </div>
      `;
      container.querySelector('#admin-back-login-btn').addEventListener('click', () => {
        Router.navigate('login');
      });
      return;
    }

    container.removeAttribute('style'); // Clear page-specific styles
    
    try {
      usersList = await Sync.getAllUsers();
      orgStructure = await Sync.getOrgStructure();
    } catch (e) {
      console.error(e);
      App.showToast("Failed to load administration data", "error");
    }

    renderContent();
  }

  function renderContent() {
    const user = Auth.getCurrentUser();
    const isAdmin = user && (user.isAdmin || user.role === 'admin');
    const isCoAdmin = user && (user.isCoAdmin || user.role === 'co-admin');

    // Title / Subtitle based on role
    const titleText = isCoAdmin ? "Thana Dashboard" : "Admin Panel";
    const subtitleText = isCoAdmin 
      ? `View reports and manage Ward/Uposakha for Thana: <strong>${user.thana || 'N/A'}</strong>` 
      : "Manage all registered user profiles and dynamic organization structure";

    // Tab Headers HTML
    const tabsHtml = `
      <div class="salat-tabs" style="margin-bottom: var(--space-md);">
        <button class="salat-tab-btn ${activeTab === 'profiles' ? 'active' : ''}" data-tab="profiles">Profiles & Reports</button>
        <button class="salat-tab-btn ${activeTab === 'org_structure' ? 'active' : ''}" data-tab="org_structure">Org Structure</button>
      </div>
    `;

    // Tab 1: Profiles List HTML
    let tabContentHtml = '';
    if (activeTab === 'profiles') {
      const filteredUsers = usersList.filter(u => {
        const q = searchQuery.toLowerCase();
        return (
          (u.displayName || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q) ||
          (u.mobile || '').toLowerCase().includes(q) ||
          (u.university || '').toLowerCase().includes(q) ||
          (u.thana || '').toLowerCase().includes(q) ||
          (u.ward || '').toLowerCase().includes(q) ||
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
          const isUserCoAdmin = u.isCoAdmin || u.role === 'co-admin';
          const isUserAdmin = u.isAdmin || u.role === 'admin';
          const supervised = u.supervisedUposakhas || [];
          
          // Filter supervised options to only this user's Thana
          const uposakhasInThana = orgStructure.uposakhas.filter(up => up.thana === u.thana).map(up => up.name);

          usersHtml += `
            <div class="glass-card" style="margin-bottom: var(--space-md); padding: var(--space-lg); display: flex; flex-direction: column; gap: var(--space-sm);">
              
              <!-- User Basic Info Header -->
              <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px;">
                <div>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--green-400);">${u.displayName || 'Unnamed User'}</h4>
                    
                    ${isAdmin && u.uid !== 'hardcoded_admin_uid' && u.uid !== user.uid ? `
                      <button class="admin-remove-user-btn" data-uid="${u.uid}" data-name="${u.displayName || u.email}" style="background: rgba(239, 68, 68, 0.1); color: var(--color-error); border: 1px solid rgba(239, 68, 68, 0.25); padding: 3px 8px; font-size: 0.65rem; font-weight: 700; border-radius: 4px; cursor: pointer; transition: all 0.2s;">
                        Remove
                      </button>
                    ` : ''}

                    <button class="admin-view-reports-btn btn btn-secondary btn-sm" data-uid="${u.uid}" data-name="${u.displayName}" style="padding: 2px 8px; font-size: 0.7rem; font-weight: 600; border-radius: 4px; border: 1px solid var(--border-color); background: rgba(59, 130, 246, 0.1); color: #60a5fa;">
                      📎 View Reports
                    </button>
                  </div>
                  <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">${u.email}</p>
                  ${u.mobile ? `<p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 1px;">📞 ${u.mobile}</p>` : ''}
                </div>

                <!-- Admin-only Membership controls -->
                <div style="display: flex; flex-direction: column; gap: var(--space-xs); align-items: flex-end;">
                  ${isAdmin ? `
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <span style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Membership:</span>
                      <select class="form-input admin-role-select" data-uid="${u.uid}" style="width: 120px; padding: 4px 8px; font-size: 0.8125rem; border-radius: 6px; cursor: pointer; border: 1px solid var(--border-color); background: rgba(0,0,0,0.2); color: var(--text-primary);">
                        <option value="member" ${u.role === 'member' || !u.role || u.role === 'supervisor' || u.role === 'admin' || u.role === 'co-admin' ? 'selected' : ''} style="background-color: #1f2937; color: var(--text-primary);">Member</option>
                        <option value="Associate" ${u.role === 'Associate' ? 'selected' : ''} style="background-color: #1f2937; color: var(--text-primary);">Associate</option>
                        <option value="worker" ${u.role === 'worker' ? 'selected' : ''} style="background-color: #1f2937; color: var(--text-primary);">Worker</option>
                        <option value="Supporter" ${u.role === 'Supporter' ? 'selected' : ''} style="background-color: #1f2937; color: var(--text-primary);">Supporter</option>
                      </select>
                    </div>

                    <div style="display: flex; gap: 10px; margin-top: 4px;">
                      <label style="display: flex; align-items: center; gap: 4px; font-size: 0.7rem; cursor: pointer; color: var(--text-primary); font-weight: 600;">
                        <input type="checkbox" class="admin-supervisor-check" data-uid="${u.uid}" ${isSuper ? 'checked' : ''}> Supervisor
                      </label>
                      <label style="display: flex; align-items: center; gap: 4px; font-size: 0.7rem; cursor: pointer; color: var(--text-primary); font-weight: 600;">
                        <input type="checkbox" class="admin-coadmin-check" data-uid="${u.uid}" ${isUserCoAdmin ? 'checked' : ''}> Co-admin
                      </label>
                      <label style="display: flex; align-items: center; gap: 4px; font-size: 0.7rem; cursor: pointer; color: var(--text-primary); font-weight: 600;">
                        <input type="checkbox" class="admin-admin-check" data-uid="${u.uid}" ${isUserAdmin ? 'checked' : ''}> Admin
                      </label>
                    </div>
                  ` : `
                    <span class="badge badge-green" style="font-weight: 700;">${(u.role || 'Member').toUpperCase()}</span>
                  `}
                </div>
              </div>

              <!-- Profile Details Grid -->
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; margin-top: var(--space-xs); padding-top: var(--space-sm); border-top: 1px solid var(--border-color); font-size: 0.75rem; color: var(--text-secondary);">
                <div><strong>University:</strong> ${u.university || '–'}</div>
                <div><strong>Blood Group:</strong> <span style="color: var(--color-error); font-weight: 700;">${u.bloodGroup || '–'}</span></div>
                
                <!-- Sakha Select -->
                <div style="display: flex; align-items: center; gap: 4px;">
                  <span style="font-weight: bold;">Sakha:</span>
                  <select class="form-input admin-sakha-select" data-uid="${u.uid}" style="width: 100px; padding: 2px 4px; font-size: 0.75rem; border-radius: 4px; cursor: pointer; border: 1px solid var(--border-color); background: rgba(0,0,0,0.2); color: var(--text-primary);">
                    <option value="" ${!u.sakha ? 'selected' : ''} style="background-color: #1f2937; color: var(--text-primary);">–</option>
                    <option value="Private University" ${u.sakha === 'Private University' ? 'selected' : ''} style="background-color: #1f2937; color: var(--text-primary);">Private University</option>
                    <option value="West" ${u.sakha === 'West' ? 'selected' : ''} style="background-color: #1f2937; color: var(--text-primary);">West</option>
                  </select>
                </div>

                <!-- Thana Select -->
                <div style="display: flex; align-items: center; gap: 4px;">
                  <span style="font-weight: bold;">Thana:</span>
                  <select class="form-input admin-thana-select" data-uid="${u.uid}" ${isCoAdmin ? 'disabled' : ''} style="width: 100px; padding: 2px 4px; font-size: 0.75rem; border-radius: 4px; cursor: pointer; border: 1px solid var(--border-color); background: rgba(0,0,0,0.2); color: var(--text-primary);">
                    <option value="" ${!u.thana ? 'selected' : ''} style="background-color: #1f2937; color: var(--text-primary);">–</option>
                    ${orgStructure.thanas.map(t => `<option value="${t}" ${u.thana === t ? 'selected' : ''} style="background-color: #1f2937; color: var(--text-primary);">${t}</option>`).join('')}
                  </select>
                </div>

                <!-- Ward Select -->
                <div style="display: flex; align-items: center; gap: 4px;">
                  <span style="font-weight: bold;">Ward:</span>
                  <select class="form-input admin-ward-select" data-uid="${u.uid}" style="width: 100px; padding: 2px 4px; font-size: 0.75rem; border-radius: 4px; cursor: pointer; border: 1px solid var(--border-color); background: rgba(0,0,0,0.2); color: var(--text-primary);">
                    <option value="" ${!u.ward ? 'selected' : ''} style="background-color: #1f2937; color: var(--text-primary);">–</option>
                    ${orgStructure.wards.filter(w => w.thana === u.thana).map(w => `<option value="${w.name}" ${u.ward === w.name ? 'selected' : ''} style="background-color: #1f2937; color: var(--text-primary);">${w.name}</option>`).join('')}
                  </select>
                </div>

                <!-- Uposakha Select -->
                <div style="display: flex; align-items: center; gap: 4px;">
                  <span style="font-weight: bold;">Uposakha:</span>
                  <select class="form-input admin-uposakha-select" data-uid="${u.uid}" style="width: 100px; padding: 2px 4px; font-size: 0.75rem; border-radius: 4px; cursor: pointer; border: 1px solid var(--border-color); background: rgba(0,0,0,0.2); color: var(--text-primary);">
                    <option value="" ${!u.uposakha ? 'selected' : ''} style="background-color: #1f2937; color: var(--text-primary);">–</option>
                    ${orgStructure.uposakhas.filter(up => up.thana === u.thana && (u.ward ? up.ward === u.ward : true)).map(up => `<option value="${up.name}" ${u.uposakha === up.name ? 'selected' : ''} style="background-color: #1f2937; color: var(--text-primary);">${up.name}</option>`).join('')}
                  </select>
                </div>
              </div>

              <!-- Supervised Uposakhas section (rendered only if role is supervisor) -->
              <div class="supervised-section" id="super-section-${u.uid}" style="display: ${isSuper ? 'block' : 'none'}; margin-top: var(--space-xs); padding: var(--space-sm); background: rgba(16, 185, 129, 0.04); border-radius: 6px; border: 1px dashed rgba(16, 185, 129, 0.15);">
                <div style="font-size: 0.75rem; font-weight: 700; color: var(--green-400); margin-bottom: 6px;">Supervised Uposakhas (in Thana):</div>
                <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                  ${uposakhasInThana.length === 0 ? `
                    <div style="font-size: 0.7rem; color: var(--text-muted);">No Uposakhas added to this Thana yet.</div>
                  ` : uposakhasInThana.map(upName => `
                    <label style="display: flex; align-items: center; gap: 4px; font-size: 0.75rem; cursor: pointer; color: var(--text-primary);">
                      <input type="checkbox" class="super-uposakha-check" data-uid="${u.uid}" value="${upName}" ${supervised.includes(upName) ? 'checked' : ''} style="accent-color: var(--color-primary);"> ${upName}
                    </label>
                  `).join('')}
                </div>
              </div>

            </div>
          `;
        });
      }

      tabContentHtml = `
        <!-- Search Box -->
        <div class="form-group" style="margin-bottom: var(--space-lg);">
          <input type="text" id="admin-search-input" class="form-input" placeholder="Search by name, email, university, uposakha, thana..." value="${searchQuery}">
        </div>
        <!-- User List -->
        <div style="margin-bottom: var(--space-2xl);">
          <h3 class="settings-group-title" style="margin-bottom: var(--space-md);">Registered Thana Profiles</h3>
          ${usersHtml}
        </div>
      `;
    } else if (activeTab === 'org_structure') {
      // Tab 2: Org Structure Tree & Entity Form
      
      // Render dynamic org list
      let orgTreeHtml = '';
      if (orgStructure.thanas.length === 0) {
        orgTreeHtml = `<p style="font-size:0.8rem; color:var(--text-muted); padding:var(--space-md);">No organization units registered yet.</p>`;
      } else {
        const targetThanas = isCoAdmin ? orgStructure.thanas.filter(t => t === user.thana) : orgStructure.thanas;
        
        targetThanas.forEach(tName => {
          const wardsInThana = orgStructure.wards.filter(w => w.thana === tName);
          const uposakhasDirect = orgStructure.uposakhas.filter(up => up.thana === tName && !up.ward);
          
          let wardsTree = '';
          wardsInThana.forEach(w => {
            const uposakhasInWard = orgStructure.uposakhas.filter(up => up.thana === tName && up.ward === w.name);
            
            wardsTree += `
              <div style="margin-left: 20px; margin-top: 6px; padding-left: 10px; border-left: 1px dashed var(--border-color);">
                <div style="font-weight: 600; color: #60a5fa; font-size: 0.8rem;">📋 Ward: ${w.name}</div>
                ${uposakhasInWard.map(up => `
                  <div style="margin-left: 20px; font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">🕌 Uposakha: ${up.name}</div>
                `).join('')}
                ${uposakhasInWard.length === 0 ? `<div style="margin-left: 20px; font-size: 0.7rem; color: var(--text-muted); font-style: italic;">No Uposakhas</div>` : ''}
              </div>
            `;
          });

          orgTreeHtml += `
            <div class="glass-card" style="margin-bottom: var(--space-md); padding: var(--space-md); background: rgba(255,255,255,0.01);">
              <div style="font-weight: 700; color: var(--color-primary); font-size: 0.9rem;">🏢 Thana: ${tName}</div>
              
              <!-- Direct Uposakhas -->
              ${uposakhasDirect.length > 0 ? `
                <div style="margin-left: 20px; margin-top: 6px;">
                  <div style="font-size: 0.75rem; color: var(--text-muted); font-weight:600;">Direct Uposakhas:</div>
                  ${uposakhasDirect.map(up => `
                    <div style="margin-left: 20px; font-size: 0.75rem; color: var(--text-secondary); margin-top: 3px;">🕌 ${up.name}</div>
                  `).join('')}
                </div>
              ` : ''}

              <!-- Wards -->
              ${wardsTree}

              ${wardsInThana.length === 0 && uposakhasDirect.length === 0 ? `
                <div style="margin-left: 20px; font-size: 0.75rem; color: var(--text-muted); margin-top: 6px; font-style: italic;">No Wards or Uposakhas registered.</div>
              ` : ''}
            </div>
          `;
        });
      }

      // Add Org Entity Form
      const coAdminThana = user.thana || '';
      
      tabContentHtml = `
        <div style="display: grid; grid-template-columns: 1fr; gap: var(--space-lg); margin-bottom: var(--space-2xl);">
          
          <!-- Add Entity Form -->
          <div class="glass-card" style="padding: var(--space-lg);">
            <h3 class="settings-group-title" style="margin-bottom: var(--space-md); color: var(--green-400);">Add New Org Division</h3>
            <form id="org-entity-form" style="display: flex; flex-direction: column; gap: var(--space-md);">
              
              <div class="form-group">
                <label class="form-label">Type</label>
                <select id="entity-type" class="form-input" style="background: rgba(0,0,0,0.3); border-radius: 6px; border: 1px solid var(--border-color); color: var(--text-primary); cursor: pointer;">
                  ${isAdmin ? `<option value="thana">Thana</option>` : ''}
                  <option value="ward">Ward</option>
                  <option value="uposakha">Uposakha</option>
                </select>
              </div>

              <!-- Thana select (only for Ward/Uposakha, hidden for co-admin) -->
              <div class="form-group" id="entity-thana-group" style="display: ${isAdmin ? 'block' : 'none'};">
                <label class="form-label">Thana</label>
                <select id="entity-thana" class="form-input" style="background: rgba(0,0,0,0.3); border-radius: 6px; border: 1px solid var(--border-color); color: var(--text-primary); cursor: pointer;">
                  ${orgStructure.thanas.map(t => `<option value="${t}">${t}</option>`).join('')}
                </select>
              </div>

              <!-- Ward select (only for Uposakha, preloaded on Thana change) -->
              <div class="form-group" id="entity-ward-group" style="display: none;">
                <label class="form-label">Ward (Optional)</label>
                <select id="entity-ward" class="form-input" style="background: rgba(0,0,0,0.3); border-radius: 6px; border: 1px solid var(--border-color); color: var(--text-primary); cursor: pointer;">
                  <option value="">Directly under Thana</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" id="entity-name-label">Thana Name</label>
                <input type="text" id="entity-name" class="form-input" placeholder="e.g. DCS, Ward A, Safa" required>
              </div>

              <button type="submit" class="btn btn-primary" style="padding: 10px; border-radius: 6px; font-weight: 700; margin-top: var(--space-sm);">Create Division</button>
            </form>
          </div>

          <!-- Current Org Tree -->
          <div>
            <h3 class="settings-group-title" style="margin-bottom: var(--space-md);">Current Divisions Structure</h3>
            ${orgTreeHtml}
          </div>

        </div>
      `;
    }

    container.innerHTML = `
      <!-- Header -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-md); margin-top:var(--space-md);">
        <div>
          <h2 style="font-size:1.25rem; font-weight:800; color:var(--text-primary);">${titleText}</h2>
          <p style="font-size:0.75rem; color:var(--text-muted);">${subtitleText}</p>
        </div>
        <button id="admin-logout-btn" class="btn" style="background: rgba(239, 68, 68, 0.1); color: var(--color-error); border: 1px solid rgba(239, 68, 68, 0.2); padding: 6px 12px; font-size: 0.8125rem; font-weight: 600; border-radius: 6px; cursor: pointer; display: flex; align-items: center;">
          <span>Logout</span>
        </button>
      </div>

      <!-- Tab Switchers -->
      ${tabsHtml}

      <!-- Tab Content Area -->
      <div id="admin-tab-content">
        ${tabContentHtml}
      </div>
    `;

    wireEvents();
  }

  function wireEvents() {
    const user = Auth.getCurrentUser();
    const isAdmin = user && (user.isAdmin || user.role === 'admin');
    const isCoAdmin = user && (user.isCoAdmin || user.role === 'co-admin');

    // 1. Logout Action
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

    // 2. Tab Navigation clicks
    container.querySelectorAll('.salat-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.getAttribute('data-tab');
        renderContent();
      });
    });

    // 3. Search and user filtering (Profiles Tab)
    const searchInput = container.querySelector('#admin-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderContent();
        const newSearchInput = container.querySelector('#admin-search-input');
        if (newSearchInput) {
          newSearchInput.focus();
          newSearchInput.setSelectionRange(searchQuery.length, searchQuery.length);
        }
      });
    }

    // 4. Role Promotion Click (Admin Tab only)
    if (isAdmin) {
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
            App.showToast(`${targetUser.displayName}'s membership updated!`, "success");
          } catch (err) {
            console.error(err);
            App.showToast("Failed to update membership", "error");
          }
        });
      });

      // Supervisor check
      container.querySelectorAll('.admin-supervisor-check').forEach(check => {
        check.addEventListener('change', async () => {
          const uid = check.getAttribute('data-uid');
          const isSupervisor = check.checked;
          const targetUser = usersList.find(u => u.uid === uid);
          if (!targetUser) return;

          App.showToast("Updating Supervisor privileges...", "info");
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

            App.showToast("Supervisor role updated!", "success");
            renderContent();
          } catch (err) {
            console.error(err);
            App.showToast("Failed to update Supervisor privileges", "error");
            check.checked = !isSupervisor;
          }
        });
      });

      // Co-admin check
      container.querySelectorAll('.admin-coadmin-check').forEach(check => {
        check.addEventListener('change', async () => {
          const uid = check.getAttribute('data-uid');
          const isUserCoAdmin = check.checked;
          const targetUser = usersList.find(u => u.uid === uid);
          if (!targetUser) return;

          if (isUserCoAdmin && !targetUser.thana) {
            App.showToast("Cannot make Co-admin! Please assign a Thana to this user first.", "error");
            check.checked = false;
            return;
          }

          App.showToast("Updating Co-admin privileges...", "info");
          try {
            const updates = { isCoAdmin: isUserCoAdmin };
            if (isUserCoAdmin) {
              updates.role = 'co-admin';
              targetUser.role = 'co-admin';
            } else if (targetUser.role === 'co-admin') {
              updates.role = 'member';
              targetUser.role = 'member';
            }
            await Sync.adminUpdateUser(uid, updates);
            targetUser.isCoAdmin = isUserCoAdmin;

            App.showToast(isUserCoAdmin ? "Promoted to Co-admin!" : "Co-admin role removed.", "success");
            renderContent();
          } catch (err) {
            console.error(err);
            App.showToast("Failed to update Co-admin privileges", "error");
            check.checked = !isUserCoAdmin;
          }
        });
      });

      // Admin check
      container.querySelectorAll('.admin-admin-check').forEach(check => {
        check.addEventListener('change', async () => {
          const uid = check.getAttribute('data-uid');
          const isUserAdmin = check.checked;
          const targetUser = usersList.find(u => u.uid === uid);
          if (!targetUser) return;

          const confirmMsg = isUserAdmin 
            ? `Are you sure you want to make ${targetUser.displayName} an Admin?`
            : `Are you sure you want to remove Admin privileges from ${targetUser.displayName}?`;
          
          if (!confirm(confirmMsg)) {
            check.checked = !isUserAdmin;
            return;
          }

          App.showToast("Updating Admin privileges...", "info");
          try {
            const updates = { isAdmin: isUserAdmin };
            if (!isUserAdmin && targetUser.role === 'admin') {
              updates.role = 'member';
              targetUser.role = 'member';
            }
            await Sync.adminUpdateUser(uid, updates);
            targetUser.isAdmin = isUserAdmin;

            App.showToast("Admin privileges updated!", "success");
            renderContent();
          } catch (err) {
            console.error(err);
            App.showToast("Failed to update Admin privileges", "error");
            check.checked = !isUserAdmin;
          }
        });
      });
    }

    // 5. User profile Dropdowns (Thana, Ward, Uposakha, Sakha)
    container.querySelectorAll('.admin-sakha-select').forEach(select => {
      select.addEventListener('change', async () => {
        const uid = select.getAttribute('data-uid');
        const val = select.value;
        try {
          await Sync.adminUpdateUser(uid, { sakha: val });
          const target = usersList.find(u => u.uid === uid);
          if (target) target.sakha = val;
          App.showToast("Sakha updated!", "success");
        } catch (err) {
          console.error(err);
          App.showToast("Failed to update Sakha", "error");
        }
      });
    });

    container.querySelectorAll('.admin-thana-select').forEach(select => {
      select.addEventListener('change', async () => {
        const uid = select.getAttribute('data-uid');
        const val = select.value;
        App.showToast("Updating Thana...", "info");
        try {
          // Clear ward/uposakha upon Thana change to avoid inconsistency
          await Sync.adminUpdateUser(uid, { thana: val, ward: '', uposakha: '' });
          const target = usersList.find(u => u.uid === uid);
          if (target) {
            target.thana = val;
            target.ward = '';
            target.uposakha = '';
          }
          App.showToast("Thana updated!", "success");
          renderContent();
        } catch (err) {
          console.error(err);
          App.showToast("Failed to update Thana", "error");
        }
      });
    });

    container.querySelectorAll('.admin-ward-select').forEach(select => {
      select.addEventListener('change', async () => {
        const uid = select.getAttribute('data-uid');
        const val = select.value;
        App.showToast("Updating Ward...", "info");
        try {
          await Sync.adminUpdateUser(uid, { ward: val, uposakha: '' });
          const target = usersList.find(u => u.uid === uid);
          if (target) {
            target.ward = val;
            target.uposakha = '';
          }
          App.showToast("Ward updated!", "success");
          renderContent();
        } catch (err) {
          console.error(err);
          App.showToast("Failed to update Ward", "error");
        }
      });
    });

    container.querySelectorAll('.admin-uposakha-select').forEach(select => {
      select.addEventListener('change', async () => {
        const uid = select.getAttribute('data-uid');
        const val = select.value;
        App.showToast("Updating Uposakha...", "info");
        try {
          await Sync.adminUpdateUser(uid, { uposakha: val });
          const target = usersList.find(u => u.uid === uid);
          if (target) target.uposakha = val;
          App.showToast("Uposakha updated!", "success");
        } catch (err) {
          console.error(err);
          App.showToast("Failed to update Uposakha", "error");
        }
      });
    });

    // 6. Supervised Uposakhas checks
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

        App.showToast("Saving supervised uposakhas...", "info");
        try {
          await Sync.adminUpdateUser(uid, { supervisedUposakhas: selectedUposakhas });
          targetUser.supervisedUposakhas = selectedUposakhas;
          App.showToast("Supervised Uposakhas updated!", "success");
        } catch (err) {
          console.error(err);
          App.showToast("Failed to update Supervised Uposakhas", "error");
          check.checked = !check.checked;
        }
      });
    });

    // 7. Remove User Click (Admin only)
    if (isAdmin) {
      container.querySelectorAll('.admin-remove-user-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const uid = btn.getAttribute('data-uid');
          const name = btn.getAttribute('data-name');
          const confirmMsg = `Are you sure you want to permanently delete user "${name}"?\nThis removes all their booklets/reports.`;
          
          if (confirm(confirmMsg)) {
            App.showToast("Deleting user...", "info");
            try {
              await Sync.adminDeleteUser(uid);
              usersList = usersList.filter(u => u.uid !== uid);
              App.showToast(`User removed successfully.`, "success");
              renderContent();
            } catch (err) {
              console.error(err);
              App.showToast("Failed to delete user", "error");
            }
          }
        });
      });
    }

    // 8. Org Structure Form submit logic
    const orgForm = container.querySelector('#org-entity-form');
    if (orgForm) {
      const typeSelect = container.querySelector('#entity-type');
      const nameInput = container.querySelector('#entity-name');
      const thanaSelect = container.querySelector('#entity-thana');
      const thanaGroup = container.querySelector('#entity-thana-group');
      const wardSelect = container.querySelector('#entity-ward');
      const wardGroup = container.querySelector('#entity-ward-group');
      const label = container.querySelector('#entity-name-label');

      // Update Form fields based on selected Type
      const updateFormTypeLayout = () => {
        const type = typeSelect.value;
        label.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} Name`;
        
        if (type === 'thana') {
          if (thanaGroup) thanaGroup.style.display = 'none';
          if (wardGroup) wardGroup.style.display = 'none';
        } else if (type === 'ward') {
          if (isAdmin) {
            if (thanaGroup) thanaGroup.style.display = 'block';
          }
          if (wardGroup) wardGroup.style.display = 'none';
        } else if (type === 'uposakha') {
          if (isAdmin) {
            if (thanaGroup) thanaGroup.style.display = 'block';
          }
          if (wardGroup) {
            wardGroup.style.display = 'block';
            
            // Populate Ward Options filtered by Thana
            const activeThana = isAdmin ? thanaSelect.value : (user.thana || '');
            const filteredWards = orgStructure.wards.filter(w => w.thana === activeThana);
            
            wardSelect.innerHTML = `<option value="">Directly under Thana</option>` + 
              filteredWards.map(w => `<option value="${w.name}">${w.name}</option>`).join('');
          }
        }
      };

      if (typeSelect) {
        typeSelect.addEventListener('change', updateFormTypeLayout);
      }
      if (thanaSelect) {
        thanaSelect.addEventListener('change', updateFormTypeLayout);
      }

      // Initial type setup
      updateFormTypeLayout();

      orgForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const type = typeSelect.value;
        const name = nameInput.value.trim();
        const activeThana = isAdmin ? thanaSelect.value : (user.thana || '');
        const activeWard = wardSelect.value || '';

        if (!name) return;

        App.showToast("Saving organizational unit...", "info");
        try {
          if (type === 'thana') {
            if (!orgStructure.thanas.includes(name)) {
              orgStructure.thanas.push(name);
            }
          } else if (type === 'ward') {
            if (!orgStructure.wards.some(w => w.name === name && w.thana === activeThana)) {
              orgStructure.wards.push({ name, thana: activeThana });
            }
          } else if (type === 'uposakha') {
            if (!orgStructure.uposakhas.some(up => up.name === name && up.thana === activeThana && up.ward === activeWard)) {
              orgStructure.uposakhas.push({ name, thana: activeThana, ward: activeWard });
            }
          }

          await Sync.saveOrgStructure(orgStructure);
          App.showToast(`${type.toUpperCase()} created successfully!`, "success");
          
          nameInput.value = '';
          renderContent();
        } catch (err) {
          console.error(err);
          App.showToast("Failed to create org unit", "error");
        }
      });
    }

    // 9. View Reports Button click
    container.querySelectorAll('.admin-view-reports-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const uid = btn.getAttribute('data-uid');
        const name = btn.getAttribute('data-name');
        showReportMonthSelector(uid, name);
      });
    });
  }

  // ---- REPORT INSPECTOR MODALS FLOW ----
  
  function showReportMonthSelector(uid, userName) {
    const overlay = document.createElement('div');
    overlay.className = 'salat-modal-overlay active';
    overlay.style.zIndex = '9999';

    // Generates select choices for recent months (e.g. current year and 6 months back)
    const now = new Date();
    let monthChoicesHtml = '';
    
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      
      monthChoicesHtml += `
        <button class="inspect-month-choice-btn btn" data-uid="${uid}" data-year="${y}" data-month="${m}" style="width:100%; text-align:left; background:rgba(255,255,255,0.03); border:1px solid var(--border-color); padding:12px var(--space-lg); font-weight:600; border-radius:8px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; color:var(--text-primary); transition:all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.06)'" onmouseout="this.style.background='rgba(255,255,255,0.03)'">
          <span>${monthNames[m - 1]} ${y}</span>
          <span style="font-size:0.8rem; color:var(--text-muted);">Inspect ❯</span>
        </button>
      `;
    }

    overlay.innerHTML = `
      <div class="salat-modal-card" style="max-width:400px; padding:var(--space-xl); border:1.5px solid var(--color-primary); background:rgba(15, 23, 42, 0.98); border-radius:12px; display:flex; flex-direction:column; gap:var(--space-md);">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:8px;">
          <h3 style="font-weight:800; font-size:1.1rem; color:var(--green-400);">Select Month</h3>
          <button id="month-selector-close-btn" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:1.2rem; font-weight:bold;">&times;</button>
        </div>
        <p style="font-size:0.75rem; color:var(--text-secondary); margin-bottom:4px;">Viewing submissions for: <strong>${userName}</strong></p>
        
        <div style="display:flex; flex-direction:column; gap:8px; max-height:300px; overflow-y:auto; padding-right:4px;">
          ${monthChoicesHtml}
        </div>
      </div>
    `;

    container.appendChild(overlay);

    overlay.querySelector('#month-selector-close-btn').addEventListener('click', () => overlay.remove());

    overlay.querySelectorAll('.inspect-month-choice-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const year = btn.getAttribute('data-year');
        const month = btn.getAttribute('data-month');
        overlay.remove(); // Close selector
        
        App.showToast("Loading report...", "info");
        try {
          const report = await Sync.getMemberMonthlyReport(uid, year, month);
          if (!report) {
            App.showToast("No booklet submitted for this month.", "info");
            return;
          }
          showMonthlyReportDetailModal(uid, userName, year, month, report);
        } catch (err) {
          console.error(err);
          App.showToast("Failed to load user report", "error");
        }
      });
    });
  }

  function showMonthlyReportDetailModal(memberUid, userName, year, month, report) {
    const overlay = document.createElement('div');
    overlay.className = 'salat-modal-overlay active';
    overlay.style.zIndex = '9999';

    const sub = report;
    const subData = report.data || {};

    const renderField = (label, val) => `
      <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.06); font-size:0.8rem;">
        <span style="color:var(--text-secondary);">${label}</span>
        <span style="color:var(--text-primary); font-weight:600;">${val !== undefined && val !== null ? val : '–'}</span>
      </div>
    `;

    overlay.innerHTML = `
      <div class="salat-modal-card" style="max-width:550px; width:95%; height:90dvh; display:flex; flex-direction:column; padding:var(--space-xl); border:1.5px solid var(--color-primary); background:rgba(15, 23, 42, 0.98); border-radius:12px; gap:var(--space-md);">
        
        <!-- Header -->
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:8px; flex-shrink:0;">
          <div>
            <h3 style="font-weight:800; font-size:1.05rem; color:var(--green-400);">Monthly Booklet Summary</h3>
            <p style="font-size:0.75rem; color:var(--text-secondary);">${userName} — ${monthNames[month - 1]} ${year}</p>
          </div>
          <div style="display:flex; gap:10px;">
            <button id="inspect-view-daily-grid-btn" class="btn btn-secondary btn-sm" style="padding: 6px 12px; font-weight: 600; font-size: 0.75rem;">View Daily Grid</button>
            <button id="inspect-detail-close-btn" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:1.5rem; font-weight:bold; line-height:1;">&times;</button>
          </div>
        </div>

        <!-- Scrollable content -->
        <div style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:var(--space-md); padding-right:6px;">
          
          <!-- Quran -->
          <div class="glass-card" style="padding:var(--space-md); background:rgba(255,255,255,0.01);">
            <div style="font-weight:700; color:var(--color-primary); font-size:0.8rem; margin-bottom:6px;">📖 The Holy Quran (S/T)</div>
            ${renderField('Total Days', subData.mqTotalDays)}
            ${renderField('Average Ayah / Day', subData.mqAvgAyah)}
            ${renderField('Making Dars (Times)', subData.mqMakingDars)}
            ${renderField('Memorized Ayah Quantity', subData.mqMemorized)}
            ${renderField('Meaning Study (Surah)', subData.mqMeaning)}
          </div>

          <!-- Hadith -->
          <div class="glass-card" style="padding:var(--space-md); background:rgba(255,255,255,0.01);">
            <div style="font-weight:700; color:var(--color-primary); font-size:0.8rem; margin-bottom:6px;">📚 Studying Hadith</div>
            ${renderField('Total Days', subData.mhTotalDays)}
            ${renderField('Daily Average Hadith', subData.mhAvg)}
            ${renderField('Masnun Dua Quantity', subData.mhMasnunDua)}
            ${renderField('Making Dars (Times)', subData.mhMakingDars)}
            ${renderField('Memorized Hadith', subData.mhMemorized)}
            ${renderField('Hadith Book & Subject Name', subData.mhSubject)}
          </div>

          <!-- Literature -->
          <div class="glass-card" style="padding:var(--space-md); background:rgba(255,255,255,0.01);">
            <div style="font-weight:700; color:var(--color-primary); font-size:0.8rem; margin-bottom:6px;">📕 Reading Literature</div>
            ${renderField('Total Pages', subData.mlTotalPages)}
            ${renderField('Islamic Literature (Pages)', subData.mlIslamic)}
            ${renderField('General Literature (Pages)', subData.mlOthers)}
            ${renderField('Book Name', subData.mlBookName)}
            ${renderField('Book Note Quantity', subData.mlBookNote)}
            ${renderField('Discussion Note Quantity', subData.mlDiscussion)}
          </div>

          <!-- Academic -->
          <div class="glass-card" style="padding:var(--space-md); background:rgba(255,255,255,0.01);">
            <div style="font-weight:700; color:var(--color-primary); font-size:0.8rem; margin-bottom:6px;">🎓 Academic Study</div>
            ${renderField('Total Days', subData.maTotalDays)}
            ${renderField('Daily Average Hours', subData.maAvgHours)}
          </div>

          <!-- Contacts -->
          <div class="glass-card" style="padding:var(--space-md); background:rgba(255,255,255,0.01);">
            <div style="font-weight:700; color:var(--color-primary); font-size:0.8rem; margin-bottom:6px;">👥 Communication</div>
            ${renderField('Member', subData.mcMember)}
            ${renderField('Associate', subData.mcAssociate)}
            ${renderField('Worker', subData.mcWorker)}
            ${renderField('Supporter', subData.mcSupporter)}
            ${renderField('Friends', subData.mcFriends)}
            ${renderField('Well Wisher', subData.mcWellWisher)}
            ${renderField('Meritorious Student', subData.mcMeritorious)}
            ${renderField('Reader', subData.mcReader)}
          </div>

          <!-- Dawah -->
          <div class="glass-card" style="padding:var(--space-md); background:rgba(255,255,255,0.01);">
            <div style="font-weight:700; color:var(--color-primary); font-size:0.8rem; margin-bottom:6px;">🌍 Dawah & Org Work</div>
            ${renderField('Dawah Days', subData.mdDay)}
            ${renderField('Dawah Avg Hours', subData.mdAvgHours)}
            ${renderField('Dawah Total Contacts', subData.mdTotalPerson)}
            ${renderField('Org Work Days', subData.moTotalDays)}
            ${renderField('Org Work Avg Hours', subData.moAvgHours)}
            ${renderField('Sleeping Avg Hours', subData.msAvgHours)}
          </div>

          <!-- Financials -->
          <div class="glass-card" style="padding:var(--space-md); background:rgba(255,255,255,0.01);">
            <div style="font-weight:700; color:var(--color-primary); font-size:0.8rem; margin-bottom:6px;">💰 Baitulmal (Financials)</div>
            ${renderField('Personal Contribution (Taka)', subData.mbPersonal)}
            ${renderField('Student Welfare Contribution', subData.mbStudentWelfare)}
            ${renderField('S.W Box Collection (Taka)', subData.mbSwBox)}
            ${renderField('Total Collection Increase', subData.mbTotalIncrease)}
            ${renderField('Table Bank (Pieces)', subData.mbTableBank)}
            ${renderField('Others (Taka)', subData.mbOthers)}
          </div>

          <!-- Assessment -->
          <div class="glass-card" style="padding:var(--space-md); background:rgba(255,255,255,0.01); border: 1.5px solid rgba(16, 185, 129, 0.15); background: rgba(16, 185, 129, 0.02);">
            <div style="font-weight:700; color:var(--green-400); font-size:0.8rem; margin-bottom:6px;">💬 Supervisor Assessment</div>
            <div style="font-size:0.75rem; color:var(--text-secondary); white-space:pre-wrap; line-height:1.4;">${sub.supervisorFeedback || 'No supervisor feedback provided.'}</div>
          </div>

        </div>
      </div>
    `;

    container.appendChild(overlay);

    overlay.querySelector('#inspect-detail-close-btn').addEventListener('click', () => overlay.remove());

    overlay.querySelector('#inspect-view-daily-grid-btn').addEventListener('click', async () => {
      App.showToast("Loading daily reports...", "info");
      try {
        const dailyReports = await Sync.getMemberDailyReports(memberUid, year, month);
        showDailyGridModal(userName, year, month, dailyReports);
      } catch (err) {
        console.error(err);
        App.showToast("Failed to load daily logs", "error");
      }
    });
  }

  function showDailyGridModal(userName, year, month, dailyReports) {
    const overlay = document.createElement('div');
    overlay.className = 'salat-modal-overlay active';
    overlay.style.zIndex = '10000'; // Make sure it renders on top of the detail modal

    const daysInMonth = App.getDaysInMonth(year, month);
    const logsMap = {};
    dailyReports.forEach(log => {
      logsMap[log.day] = log;
    });

    let tableRows = '';
    for (let day = 1; day <= daysInMonth; day++) {
      const log = logsMap[day] || {};
      tableRows += `
        <tr>
          <td class="date-col" style="font-weight:700; position: sticky; left: 0; background: #0f172a; z-index: 2;">${String(day).padStart(2, '0')}</td>
          <td>${log.quranS || '–'}</td>
          <td>${log.quranT || '–'}</td>
          <td>${log.hadithNum || '–'}</td>
          <td>${log.litI || '–'}</td>
          <td>${log.litG || '–'}</td>
          <td>${log.academic || '–'}</td>
          <td>${log.classT || '–'}</td>
          <td>${log.classA || '–'}</td>
          <td>${log.salatJamat !== undefined || log.salatKaja !== undefined ? `${log.salatJamat || 0}-${log.salatKaja || 0}` : '–'}</td>
          <td>${log.contactM || '–'}</td>
          <td>${log.contactA || '–'}</td>
          <td>${log.contactW || '–'}</td>
          <td>${log.contactS || '–'}</td>
          <td>${log.contactF || '–'}</td>
          <td>${log.contactMS || '–'}</td>
          <td>${log.contactWW || '–'}</td>
          <td>${log.contactR || '–'}</td>
          <td>${log.dawah || '–'}</td>
          <td>${log.orgWork || '–'}</td>
          <td>${log.sleeping || '–'}</td>
          <td>${log.socialMedia || '–'}</td>
          <td>${log.newsReading ? '✓' : '✗'}</td>
          <td>${log.exercise ? '✓' : '✗'}</td>
          <td>${log.selfEval ? '✓' : '✗'}</td>
        </tr>
      `;
    }

    overlay.innerHTML = `
      <div class="salat-modal-card" style="max-width:95%; width:95%; height:90dvh; display:flex; flex-direction:column; padding:var(--space-xl); border:1.5px solid var(--color-primary); background:rgba(15, 23, 42, 0.98); border-radius:12px; gap:var(--space-md);">
        
        <!-- Header -->
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:8px; flex-shrink:0;">
          <div>
            <h3 style="font-weight:800; font-size:1.05rem; color:var(--green-400);">Daily Logs Audit Grid</h3>
            <p style="font-size:0.75rem; color:var(--text-secondary);">${userName} — ${monthNames[month - 1]} ${year}</p>
          </div>
          <button id="inspect-daily-close-btn" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:1.5rem; font-weight:bold; line-height:1;">&times;</button>
        </div>

        <!-- Scrollable Table -->
        <div class="report-grid-wrapper" style="flex: 1; overflow: auto; margin-bottom: var(--space-md); border-radius: 8px; border: 1px solid var(--border-color);">
          <table class="report-grid" style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: rgba(16, 185, 129, 0.05);">
                <th rowspan="2" class="date-col" style="position: sticky; left: 0; background: #0f172a; z-index: 3;">Date</th>
                <th colspan="2">Holy Quran</th>
                <th rowspan="2">Hadith</th>
                <th colspan="2">Literature</th>
                <th rowspan="2">Academic</th>
                <th colspan="2">Class</th>
                <th rowspan="2">Salat</th>
                <th colspan="4">Contact 1</th>
                <th colspan="4">Contact 2</th>
                <th rowspan="2">Dawah</th>
                <th rowspan="2">Org Work</th>
                <th rowspan="2">Sleep</th>
                <th rowspan="2">Soc Media</th>
                <th rowspan="2">News</th>
                <th rowspan="2">Exercise</th>
                <th rowspan="2">Self Eval</th>
              </tr>
              <tr style="background: rgba(16, 185, 129, 0.03);">
                <th class="sub-header">S</th>
                <th class="sub-header">T</th>
                <th class="sub-header">I</th>
                <th class="sub-header">G</th>
                <th class="sub-header">T</th>
                <th class="sub-header">A</th>
                <th class="sub-header">M</th>
                <th class="sub-header">A</th>
                <th class="sub-header">W</th>
                <th class="sub-header">S</th>
                <th class="sub-header">F</th>
                <th class="sub-header">MS</th>
                <th class="sub-header">WW</th>
                <th class="sub-header">R</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>

      </div>
    `;

    container.appendChild(overlay);

    overlay.querySelector('#inspect-daily-close-btn').addEventListener('click', () => overlay.remove());
  }

  await renderPage();
});
