/* ============================================================
   App — Main Application Entry Point
   Performance Book PWA
   ============================================================ */

const App = (() => {

  async function init() {
    try {
      // Initialize database
      await DB.init();

      // Initialize i18n
      I18n.init();

      // Load saved theme
      const savedTheme = localStorage.getItem('perfbook_theme') || 'dark';
      document.documentElement.setAttribute('data-theme', savedTheme);

      // Register service worker
      registerSW();

      // Initialize router (registers hash listener + nav clicks)
      Router.init();

      // Native Android hardware back button handler
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
        const CapApp = window.Capacitor.Plugins.App;
        CapApp.addListener('backButton', () => {
          const page = Router.getCurrentPage();
          if (page === 'home' || page === 'login') {
            const confirmMsg = I18n.getLang() === 'bn'
              ? 'আপনি কি অ্যাপ্লিকেশন বন্ধ করতে চান?'
              : 'Are you sure you want to exit the app?';
            if (confirm(confirmMsg)) {
              CapApp.exitApp();
            }
          } else {
            Router.navigate('home');
          }
        });
      }

      // Initialize notifications
      if (typeof Notifications !== 'undefined') {
        Notifications.init();
      }

      // Enforce route guards dynamically on auth state change
      Auth.onAuthStateChanged(async (user) => {
        const page = Router.getCurrentPage();
        if (!user) {
          if (page !== 'login') {
            Router.navigate('login');
          }
        } else {
          if (page === 'login') {
            Router.navigate('home');
          } else {
            Router.navigate(page, { force: true });
          }

          // Sync down data from Firestore after login so all devices stay in sync
          if (typeof Sync !== 'undefined' && typeof Sync.syncDownData === 'function') {
            try {
              const hasChanges = await Sync.syncDownData();
              if (hasChanges) {
                console.log('Synced down new data from Firestore after auth state change.');
                // Re-render current page to reflect synced data
                const currentPage = Router.getCurrentPage();
                if (currentPage && currentPage !== 'login') {
                  Router.navigate(currentPage, { force: true });
                }
              }
            } catch (err) {
              console.warn('Background sync-down after login failed:', err);
            }
          }
        }
      });

      // Hide splash, show app
      setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        const app = document.getElementById('app');
        if (splash) {
          splash.classList.add('fade-out');
          setTimeout(() => splash.remove(), 500);
        }
        if (app) app.style.display = '';
      }, 800);

      // Online/offline listeners
      window.addEventListener('online', async () => {
        showToast(I18n.t('common.online'), 'success');
        // Sync down data when coming back online
        if (typeof Sync !== 'undefined' && typeof Sync.syncDownData === 'function') {
          try {
            const hasChanges = await Sync.syncDownData();
            if (hasChanges) {
              const currentPage = Router.getCurrentPage();
              if (currentPage && currentPage !== 'login') {
                Router.navigate(currentPage, { force: true });
              }
            }
          } catch (err) {
            console.warn('Sync-down on reconnect failed:', err);
          }
        }
      });
      window.addEventListener('offline', () => {
        showToast(I18n.t('common.offline'), 'info');
      });

      // Sync down data when the app tab regains focus (handles switching between devices/tabs)
      document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible') {
          const user = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
          if (user && typeof Sync !== 'undefined' && typeof Sync.syncDownData === 'function') {
            try {
              const hasChanges = await Sync.syncDownData();
              if (hasChanges) {
                const currentPage = Router.getCurrentPage();
                if (currentPage && currentPage !== 'login') {
                  Router.navigate(currentPage, { force: true });
                }
              }
            } catch (err) {
              console.warn('Sync-down on visibility change failed:', err);
            }
          }
        }
      });

    } catch (err) {
      console.error('App init error:', err);
      // Still show app even if DB fails
      const splash = document.getElementById('splash-screen');
      const app = document.getElementById('app');
      if (splash) splash.remove();
      if (app) app.style.display = '';
    }
  }

  function registerSW() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => {
          console.log('SW registered:', reg.scope);

          // Check if there is an update waiting or a new worker installs
          if (reg.waiting) {
            showUpdateToast();
          }

          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    showUpdateToast();
                  }
                }
              };
            }
          };
        })
        .catch(err => {
          console.warn('SW registration failed:', err);
        });
    }
  }

  function showUpdateToast() {
    const container = document.getElementById('toast-container');
    if (!container) return;

    // Check if update toast is already showing
    if (document.getElementById('pwa-update-toast')) return;

    const toast = document.createElement('div');
    toast.id = 'pwa-update-toast';
    toast.className = 'toast toast-info';
    toast.style.cursor = 'pointer';
    toast.style.background = 'var(--color-primary)';
    toast.style.color = '#fff';
    toast.style.border = '1px solid rgba(255,255,255,0.2)';
    toast.style.fontWeight = '600';
    toast.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3)';

    const isBn = typeof I18n !== 'undefined' && I18n.getLang() === 'bn';
    const message = isBn
      ? 'নতুন সংস্করণ উপলব্ধ! আপডেট করতে এখানে ক্লিক করুন।'
      : 'New version available! Click here to update now.';

    toast.innerHTML = `
      <span style="font-size:1.1rem;font-weight:700;margin-right:8px;">🔄</span>
      <span>${message}</span>
    `;

    toast.addEventListener('click', () => {
      window.location.reload();
    });

    container.appendChild(toast);
  }

  // ---- Toast Notifications ----
  function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
      success: '✓',
      error: '✗',
      info: 'ℹ',
    };

    toast.innerHTML = `
      <span style="font-size:1.1rem;font-weight:700;">${icons[type] || 'ℹ'}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // ---- Utility: Format Date ----
  function formatDate(date, lang) {
    const d = new Date(date);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const locale = lang === 'bn' ? 'bn-BD' : 'en-US';
    try {
      return d.toLocaleDateString(locale, options);
    } catch {
      return d.toLocaleDateString('en-US', options);
    }
  }

  // ---- Utility: Get Month Name ----
  function getMonthName(month, lang) {
    const date = new Date(2000, month - 1, 1);
    const locale = lang === 'bn' ? 'bn-BD' : 'en-US';
    try {
      return date.toLocaleDateString(locale, { month: 'long' });
    } catch {
      return date.toLocaleDateString('en-US', { month: 'long' });
    }
  }

  // ---- Utility: Days in Month ----
  function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
  }

  // ---- Utility: Parse time string "HH:MM" to minutes ----
  function timeToMinutes(timeStr) {
    if (!timeStr || timeStr === '') return 0;
    const parts = timeStr.split(':');
    return (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
  }

  // ---- Utility: Minutes to "HH:MM" ----
  function minutesToTime(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  return {
    init,
    showToast,
    formatDate,
    getMonthName,
    getDaysInMonth,
    timeToMinutes,
    minutesToTime,
  };
})();

// Boot the app when DOM is ready
document.addEventListener('DOMContentLoaded', App.init);
