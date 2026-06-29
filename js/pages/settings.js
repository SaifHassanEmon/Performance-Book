/* ============================================================
   Settings Page
   Handles dark theme, language settings, notification setups,
   and data export/import management.
   ============================================================ */

Router.register('settings', async function (container) {
  // Load saved settings
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const currentLang = I18n.getLang();
  
  const salatReminder = await DB.getSetting('salatReminder') ?? false;
  const dailyReminder = await DB.getSetting('dailyReminder') ?? false;

  function renderPage() {
    const user = Auth.getCurrentUser();
    let profileHtml = '';
    if (user) {
      let capRole = user.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Member';
      const isSuper = user.isSupervisor || user.role === 'supervisor';
      const isAdmin = user.isAdmin || user.role === 'admin';
      if (isAdmin) {
        capRole = capRole === 'Admin' ? 'Admin' : `${capRole} (Admin)`;
      } else if (isSuper) {
        capRole = capRole === 'Supervisor' ? 'Supervisor' : `${capRole} (Supervisor)`;
      }
      profileHtml = `
        <!-- Account & Profile Section -->
        <div class="settings-group" style="margin-top: 0;">
          <div class="settings-group-title">Account & Profile</div>
          <div class="settings-item" style="cursor: pointer;" id="settings-profile-btn">
            <div class="settings-item-left">
              <div class="settings-item-icon" style="background: rgba(16, 185, 129, 0.12); color: var(--green-400);">👤</div>
              <div>
                <div class="settings-item-label">${user.displayName}</div>
                <div class="settings-item-desc">Role: ${capRole}</div>
              </div>
            </div>
            <span style="font-size: 1.25rem; color: var(--text-muted);">❯</span>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div style="margin-top: var(--space-md); margin-bottom: var(--space-2xl);">
        ${profileHtml}
        
        <!-- 1. Appearance Section -->
        <div class="settings-group">
          <div class="settings-group-title" data-i18n="settings.appearance">${I18n.t('settings.appearance')}</div>
          
          <!-- Dark Mode Toggle -->
          <div class="settings-item">
            <div class="settings-item-left">
              <div class="settings-item-icon" style="background: rgba(59, 130, 246, 0.12); color: #60a5fa;">🌙</div>
              <div>
                <div class="settings-item-label" data-i18n="settings.darkMode">${I18n.t('settings.darkMode')}</div>
                <div class="settings-item-desc" data-i18n="settings.darkModeDesc">${I18n.t('settings.darkModeDesc')}</div>
              </div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="settings-dark-mode" ${currentTheme === 'dark' ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
          
          <!-- Language Selector -->
          <div class="settings-item">
            <div class="settings-item-left">
              <div class="settings-item-icon" style="background: rgba(16, 185, 129, 0.12); color: var(--green-400);">🌐</div>
              <div>
                <div class="settings-item-label" data-i18n="settings.language">${I18n.t('settings.language')}</div>
                <div class="settings-item-desc" data-i18n="settings.languageDesc">${I18n.t('settings.languageDesc')}</div>
              </div>
            </div>
            <div class="tabs" style="margin-bottom: 0; width: 170px;">
              <button class="tab-btn ${currentLang === 'en' ? 'active' : ''}" id="lang-en-btn" data-i18n="settings.english">${I18n.t('settings.english')}</button>
              <button class="tab-btn ${currentLang === 'bn' ? 'active' : ''}" id="lang-bn-btn" data-i18n="settings.bengali">${I18n.t('settings.bengali')}</button>
            </div>
          </div>
        </div>

        <!-- 2. Notifications Section -->
        <div class="settings-group">
          <div class="settings-group-title" data-i18n="settings.notifications">${I18n.t('settings.notifications')}</div>
          
          <!-- Salat Reminder -->
          <div class="settings-item">
            <div class="settings-item-left">
              <div class="settings-item-icon" style="background: rgba(245, 158, 11, 0.12); color: #fbbf24;">🕌</div>
              <div>
                <div class="settings-item-label" data-i18n="settings.salatReminder">${I18n.t('settings.salatReminder')}</div>
                <div class="settings-item-desc" data-i18n="settings.salatReminderDesc">${I18n.t('settings.salatReminderDesc')}</div>
              </div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="settings-salat-reminder" ${salatReminder ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
          
          <!-- Daily Fill Reminder -->
          <div class="settings-item">
            <div class="settings-item-left">
              <div class="settings-item-icon" style="background: rgba(139, 92, 246, 0.12); color: #a78bfa;">🔔</div>
              <div>
                <div class="settings-item-label" data-i18n="settings.dailyReminder">${I18n.t('settings.dailyReminder')}</div>
                <div class="settings-item-desc" data-i18n="settings.dailyReminderDesc">${I18n.t('settings.dailyReminderDesc')}</div>
              </div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="settings-daily-reminder" ${dailyReminder ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>

        <!-- 3. Data Management Section -->
        <div class="settings-group">
          <div class="settings-group-title" data-i18n="settings.data">${I18n.t('settings.data')}</div>
          
          <!-- Export -->
          <div class="settings-item" style="cursor: pointer;" id="settings-export-btn">
            <div class="settings-item-left">
              <div class="settings-item-icon" style="background: rgba(16, 185, 129, 0.12); color: var(--green-400);">📤</div>
              <div>
                <div class="settings-item-label" data-i18n="settings.export">${I18n.t('settings.export')}</div>
                <div class="settings-item-desc" data-i18n="settings.exportDesc">${I18n.t('settings.exportDesc')}</div>
              </div>
            </div>
            <span style="font-size: 1.25rem; color: var(--text-muted);">❯</span>
          </div>
          
          <!-- Import -->
          <div class="settings-item" style="cursor: pointer;" id="settings-import-btn">
            <div class="settings-item-left">
              <div class="settings-item-icon" style="background: rgba(59, 130, 246, 0.12); color: #60a5fa;">📥</div>
              <div>
                <div class="settings-item-label" data-i18n="settings.import">${I18n.t('settings.import')}</div>
                <div class="settings-item-desc" data-i18n="settings.importDesc">${I18n.t('settings.importDesc')}</div>
              </div>
            </div>
            <span style="font-size: 1.25rem; color: var(--text-muted);">❯</span>
            <input type="file" id="settings-import-file" style="display: none;" accept=".json">
          </div>
          
          <!-- Clear Data -->
          <div class="settings-item" style="cursor: pointer;" id="settings-clear-btn">
            <div class="settings-item-left">
              <div class="settings-item-icon" style="background: rgba(239, 68, 68, 0.12); color: var(--color-error);">🗑️</div>
              <div>
                <div class="settings-item-label" data-i18n="settings.clearData" style="color: var(--color-error);">${I18n.t('settings.clearData')}</div>
                <div class="settings-item-desc" data-i18n="settings.clearDataDesc">${I18n.t('settings.clearDataDesc')}</div>
              </div>
            </div>
            <span style="font-size: 1.25rem; color: var(--text-muted);">❯</span>
          </div>
        </div>

        <!-- 3.5 Cloud Sync Diagnostics Section -->
        <div class="settings-group" id="diagnostics-section" style="${typeof FirebaseAvailable !== 'undefined' && FirebaseAvailable ? '' : 'display: none;'}">
          <div class="settings-group-title">Cloud Sync Diagnostics</div>
          
          <div class="settings-item">
            <div class="settings-item-left">
              <div class="settings-item-icon" style="background: rgba(16, 185, 129, 0.12); color: var(--green-400);">🔄</div>
              <div>
                <div class="settings-item-label">Sync Status</div>
                <div class="settings-item-desc" id="diag-sync-status">Loading...</div>
              </div>
            </div>
          </div>
          
          <div class="settings-item">
            <div class="settings-item-left">
              <div class="settings-item-icon" style="background: rgba(59, 130, 246, 0.12); color: #60a5fa;">🕒</div>
              <div>
                <div class="settings-item-label">Last Sync Attempt</div>
                <div class="settings-item-desc" id="diag-sync-time">Loading...</div>
              </div>
            </div>
          </div>

          <div style="display: flex; gap: var(--space-sm); padding: var(--space-md) var(--space-lg);">
            <button type="button" class="btn btn-primary" id="diag-sync-btn" style="flex: 1; padding: 10px; font-weight: 600; font-size: 0.85rem; border-radius: 6px;">Sync Now</button>
            <button type="button" class="btn btn-secondary" id="diag-test-btn" style="flex: 1; padding: 10px; font-weight: 600; font-size: 0.85rem; border-radius: 6px; border: 1px solid var(--border-color); background: transparent; color: var(--text-primary);">Test Firestore</button>
          </div>
          
          <div id="diag-results-card" class="glass-card" style="margin: 0 var(--space-lg) var(--space-md); padding: var(--space-md); display: none; background: rgba(255,255,255,0.01); border-radius: 8px; border: 1px solid var(--border-color);">
            <div style="font-weight: 700; font-size: 0.8rem; color: var(--color-primary); margin-bottom: var(--space-xs);">Test Results:</div>
            <div id="diag-results-text" style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4; word-break: break-all; white-space: pre-wrap;"></div>
          </div>
        </div>

        <!-- 4. About Section -->
        <div class="settings-group">
          <div class="settings-group-title" data-i18n="settings.about">${I18n.t('settings.about')}</div>
          
          <div class="settings-item">
            <div class="settings-item-left">
              <div class="settings-item-icon" style="background: rgba(148, 163, 184, 0.12); color: var(--text-secondary);">ℹ️</div>
              <div>
                <div class="settings-item-label" data-i18n="settings.appName">${I18n.t('settings.appName')}</div>
                <div class="settings-item-desc"><span data-i18n="settings.version">${I18n.t('settings.version')}</span> 1.0.0</div>
              </div>
            </div>
          </div>

          <!-- Developer Info -->
          <div class="settings-item" style="align-items: flex-start; padding: var(--space-md) var(--space-lg);">
            <div class="settings-item-left">
              <div class="settings-item-icon" style="background: rgba(16, 185, 129, 0.12); color: var(--green-400); margin-top: 2px;">💻</div>
              <div>
                <div class="settings-item-label" style="font-weight: 700; color: var(--text-primary);" data-i18n="settings.developerTitle">${I18n.t('settings.developerTitle')}</div>
                <div class="settings-item-desc" style="color: var(--text-secondary); margin-top: 4px; line-height: 1.4; font-size: 0.75rem;">
                  <strong style="color: var(--green-400);" data-i18n="settings.developerName">${I18n.t('settings.developerName')}</strong><br>
                  <span data-i18n="settings.developerDept">${I18n.t('settings.developerDept')}</span><br>
                  <span data-i18n="settings.developerVarsity">${I18n.t('settings.developerVarsity')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    `;

    wireEvents();
    updateSyncDiagnosticsUI();
    I18n.applyLanguage();
  }

  function updateSyncDiagnosticsUI() {
    const statusEl = container.querySelector('#diag-sync-status');
    const timeEl = container.querySelector('#diag-sync-time');
    if (statusEl) statusEl.textContent = localStorage.getItem('perfbook_last_sync_status') || 'Never synced';
    if (timeEl) timeEl.textContent = localStorage.getItem('perfbook_last_sync_time') || 'N/A';
  }

  function wireEvents() {
    // Cloud Diagnostics events
    const syncNowBtn = container.querySelector('#diag-sync-btn');
    const testFirestoreBtn = container.querySelector('#diag-test-btn');
    const resultsCard = container.querySelector('#diag-results-card');
    const resultsText = container.querySelector('#diag-results-text');

    if (syncNowBtn) {
      syncNowBtn.addEventListener('click', async () => {
        syncNowBtn.disabled = true;
        syncNowBtn.textContent = 'Syncing...';
        App.showToast('Starting synchronization...', 'info');
        try {
          const hasChanges = await Sync.syncDownData();
          updateSyncDiagnosticsUI();
          if (hasChanges) {
            App.showToast('Sync successful! Pulling new data...', 'success');
          } else {
            App.showToast('Sync complete. No new data found.', 'success');
          }
        } catch (err) {
          console.error(err);
          updateSyncDiagnosticsUI();
          App.showToast('Sync failed!', 'error');
        } finally {
          syncNowBtn.disabled = false;
          syncNowBtn.textContent = 'Sync Now';
        }
      });
    }

    if (testFirestoreBtn) {
      testFirestoreBtn.addEventListener('click', async () => {
        if (!testFirestoreBtn) return;
        testFirestoreBtn.disabled = true;
        testFirestoreBtn.textContent = 'Testing...';
        if (resultsCard) resultsCard.style.display = 'block';
        if (resultsText) resultsText.textContent = 'Running connection tests...\n';
        
        try {
          const user = Auth.getCurrentUser();
          if (!user) throw new Error('Not logged in to Performance Book.');
          
          if (resultsText) resultsText.textContent += `Logged in as: ${user.email} (${user.uid})\n`;
          if (resultsText) resultsText.textContent += `Firebase available: ${FirebaseAvailable}\n`;
          
          if (!FirebaseAvailable || !dbFirestore) {
            throw new Error('Firebase is not configured or disabled.');
          }

          if (resultsText) resultsText.textContent += 'Attempting to write test doc to "users" collection...\n';
          const testRef = dbFirestore.collection('users').doc(user.uid);
          await testRef.set({ lastActiveTest: new Date().toISOString() }, { merge: true });
          if (resultsText) resultsText.textContent += '✓ Write test successful!\n';

          if (resultsText) resultsText.textContent += 'Attempting to read test doc...\n';
          const snap = await testRef.get();
          if (resultsText) resultsText.textContent += `✓ Read test successful! (data: ${JSON.stringify(snap.data())})\n`;
          
          if (resultsText) resultsText.textContent += '\nTest Result: ALL TESTS PASSED! Connection is fully working.';
        } catch (err) {
          console.error(err);
          if (resultsText) resultsText.textContent += `\n❌ TEST FAILED: ${err.message || err}\n`;
          if (resultsText) resultsText.textContent += `Check browser dev tools console for more info.`;
        } finally {
          testFirestoreBtn.disabled = false;
          testFirestoreBtn.textContent = 'Test Firestore';
        }
      });
    }

    // Theme Toggle
    const themeToggle = container.querySelector('#settings-dark-mode');
    if (themeToggle) {
      themeToggle.addEventListener('change', async (e) => {
        const val = e.target.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', val);
        localStorage.setItem('perfbook_theme', val);
        await DB.setSetting('theme', val);
        App.showToast(I18n.t('common.success'), 'success');
      });
    }

    // Language Toggles
    const langEnBtn = container.querySelector('#lang-en-btn');
    const langBnBtn = container.querySelector('#lang-bn-btn');
    if (langEnBtn) {
      langEnBtn.addEventListener('click', () => {
        I18n.setLanguage('en');
        Router.navigate('settings', { force: true });
      });
    }
    if (langBnBtn) {
      langBnBtn.addEventListener('click', () => {
        I18n.setLanguage('bn');
        Router.navigate('settings', { force: true });
      });
    }

    // Salat Reminder
    const salatToggle = container.querySelector('#settings-salat-reminder');
    if (salatToggle) {
      salatToggle.addEventListener('change', async (e) => {
        if (e.target.checked) {
          const granted = await Notifications.requestPermission();
          if (!granted) {
            App.showToast(I18n.t('settings.notificationWarning'), 'info', 5000);
          }
        }
        await DB.setSetting('salatReminder', e.target.checked);
        App.showToast(I18n.t('common.success'), 'success');
      });
    }

    // Daily Reminder
    const dailyToggle = container.querySelector('#settings-daily-reminder');
    if (dailyToggle) {
      dailyToggle.addEventListener('change', async (e) => {
        if (e.target.checked) {
          const granted = await Notifications.requestPermission();
          if (!granted) {
            App.showToast(I18n.t('settings.notificationWarning'), 'info', 5000);
          }
        }
        await DB.setSetting('dailyReminder', e.target.checked);
        App.showToast(I18n.t('common.success'), 'success');
      });
    }

    // Export Button
    const exportBtn = container.querySelector('#settings-export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', async () => {
        try {
          const data = await DB.exportAllData();
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'performance-book-backup.json';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          App.showToast(I18n.t('common.success'), 'success');
        } catch (err) {
          console.error(err);
          App.showToast(I18n.t('common.error'), 'error');
        }
      });
    }

    // Import Button & Hidden File Input
    const importBtn = container.querySelector('#settings-import-btn');
    const fileInput = container.querySelector('#settings-import-file');
    if (importBtn && fileInput) {
      importBtn.addEventListener('click', () => {
        fileInput.click();
      });

      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
          try {
            const data = JSON.parse(evt.target.result);
            await DB.importData(data);
            App.showToast(I18n.t('common.success'), 'success');
            // Force navigate to home dashboard to reload the app with new data
            Router.navigate('home', { force: true });
          } catch (err) {
            console.error(err);
            App.showToast(I18n.t('common.error'), 'error');
          }
        };
        reader.readAsText(file);
      });
    }

    // Clear Data
    const clearBtn = container.querySelector('#settings-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', async () => {
        const confirmMsg = I18n.getLang() === 'bn' 
          ? 'আপনি কি নিশ্চিত যে সমস্ত ডেটা মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।'
          : 'Are you sure you want to clear all data? This action cannot be undone.';
        
        if (confirm(confirmMsg)) {
          try {
            await DB.clearAllData();
            App.showToast(I18n.t('common.success'), 'success');
            Router.navigate('home', { force: true });
          } catch (err) {
            console.error(err);
            App.showToast(I18n.t('common.error'), 'error');
          }
        }
      });
    }

    // Profile button click
    const profileBtn = container.querySelector('#settings-profile-btn');
    if (profileBtn) {
      profileBtn.addEventListener('click', () => {
        Router.navigate('profile');
      });
    }
  }

  renderPage();
});
