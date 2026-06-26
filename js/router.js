/* ============================================================
   Router — Simple SPA Hash-based Router
   ============================================================ */

const Router = (() => {
  const routes = {};
  let currentPage = null;
  let previousPage = null;

  let beforeNavigateHook = null;
  let ignoreHashChange = false;

  function register(name, renderFn) {
    routes[name] = renderFn;
  }

  function registerBeforeNavigate(hookFn) {
    beforeNavigateHook = hookFn;
  }

  function clearBeforeNavigate() {
    beforeNavigateHook = null;
  }

  function navigate(page, opts = {}) {
    // Check navigation interception hook
    if (beforeNavigateHook && !opts.force) {
      const proceed = beforeNavigateHook(page);
      if (!proceed) {
        const hash = window.location.hash.replace('#', '') || 'home';
        if (hash !== currentPage) {
          ignoreHashChange = true;
          window.location.hash = currentPage;
        }
        return;
      }
    }

    // Route guards based on authentication and roles
    const user = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    
    if (!user) {
      if (page !== 'login') {
        page = 'login';
      }
    } else {
      if (page === 'login') {
        page = 'home';
      } else if (page === 'supervisor') {
        // Only supervisors or admins can view supervisor review page
        if (user.role !== 'supervisor' && user.role !== 'admin') {
          page = 'home';
        }
      } else if (page === 'admin') {
        // Only admins can view admin page
        if (user.role !== 'admin') {
          page = 'home';
        }
      }
    }

    if (currentPage === page && !opts.force) return;
    
    previousPage = currentPage;
    currentPage = page;
    
    // Update hash
    window.location.hash = page;
    
    render(opts);
  }

  function render(opts = {}) {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    const renderFn = routes[currentPage];
    if (!renderFn) {
      console.warn(`No route found for: ${currentPage}`);
      return;
    }

    // Page exit animation
    mainContent.classList.add('page-exit');
    
    setTimeout(() => {
      mainContent.classList.remove('page-exit');
      mainContent.innerHTML = '';
      mainContent.removeAttribute('style'); // Reset inline style overrides from other pages
      
      renderFn(mainContent, opts);
      
      // Page enter animation
      mainContent.classList.add('page-enter');
      setTimeout(() => mainContent.classList.remove('page-enter'), 300);

      // Update navigation
      updateNav();
      updateHeader();

      // Re-apply translations
      I18n.applyLanguage();

      // Scroll to top
      mainContent.scrollTop = 0;
      window.scrollTo(0, 0);
    }, 150);
  }

  function updateNav() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      const page = item.getAttribute('data-page');
      item.classList.toggle('active', page === currentPage);
    });

    // Show/hide bottom nav for sub-pages
    const bottomNav = document.getElementById('bottom-nav');
    const subPages = ['yearly-plan', 'practical-page', 'login', 'supervisor', 'admin', 'salat', 'profile'];
    if (bottomNav) {
      bottomNav.style.display = subPages.includes(currentPage) ? 'none' : '';
    }
  }

  function updateHeader() {
    const title = document.getElementById('header-title');
    const backBtn = document.getElementById('header-back-btn');
    const helpBtn = document.getElementById('header-help-btn');
    const supervisorBtn = document.getElementById('header-supervisor-btn');
    const adminBtn = document.getElementById('header-admin-btn');
    
    const pageTitles = {
      'home': 'header.title',
      'daily-report': 'daily.title',
      'monthly-plan': 'monthly.title',
      'yearly-plan': 'yearly.title',
      'analytics': 'analytics.title',
      'settings': 'settings.title',
      'practical-page': 'practical.title',
      'salat': 'salat.trackerTitle',
      'profile': 'profile.title',
      'supervisor': 'Supervisor View',
      'admin': 'Admin Panel'
    };

    if (title) {
      title.textContent = I18n.t(pageTitles[currentPage] || 'header.title');
    }

    // Show back button for sub-pages (not showing back btn for main dashboard links)
    const mainPages = ['home', 'daily-report', 'monthly-plan', 'analytics', 'settings', 'login'];
    if (backBtn) {
      backBtn.style.display = mainPages.includes(currentPage) ? 'none' : '';
    }
    if (helpBtn) {
      helpBtn.style.display = currentPage === 'daily-report' ? '' : 'none';
    }

    const user = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
    if (supervisorBtn) {
      supervisorBtn.style.display = (currentPage === 'home' && user && (user.role === 'supervisor' || user.role === 'admin')) ? '' : 'none';
    }
    if (adminBtn) {
      adminBtn.style.display = (currentPage === 'home' && user && user.role === 'admin') ? '' : 'none';
    }
  }

  function back() {
    if (previousPage) {
      navigate(previousPage);
    } else {
      navigate('home');
    }
  }

  function getCurrentPage() {
    return currentPage;
  }

  function init() {
    // Handle hash changes
    window.addEventListener('hashchange', () => {
      if (ignoreHashChange) {
        ignoreHashChange = false;
        return;
      }
      const hash = window.location.hash.replace('#', '') || 'home';
      if (hash !== currentPage) {
        navigate(hash);
      }
    });

    // Handle back button
    const backBtn = document.getElementById('header-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', back);
    }

    // Handle help button → practical page
    const helpBtn = document.getElementById('header-help-btn');
    if (helpBtn) {
      helpBtn.addEventListener('click', () => navigate('practical-page'));
    }

    // Handle supervisor view toggle button
    const supervisorBtn = document.getElementById('header-supervisor-btn');
    if (supervisorBtn) {
      supervisorBtn.addEventListener('click', () => navigate('supervisor'));
    }

    // Handle admin panel toggle button
    const adminBtn = document.getElementById('header-admin-btn');
    if (adminBtn) {
      adminBtn.addEventListener('click', () => navigate('admin'));
    }

    // Handle nav clicks
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const page = item.getAttribute('data-page');
        navigate(page);
      });
    });

    // Initial route
    const hash = window.location.hash.replace('#', '') || 'home';
    navigate(hash, { force: true });
  }

  return { register, navigate, back, getCurrentPage, init, registerBeforeNavigate, clearBeforeNavigate };
})();
