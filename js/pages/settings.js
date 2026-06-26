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
      const capRole = user.role.charAt(0).toUpperCase() + user.role.slice(1);
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
    I18n.applyLanguage();
  }

  function wireEvents() {
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
