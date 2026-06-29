/* ============================================================
   Home Page — Main Dashboard
   Shows greeting, progress ring, streak, highlights,
   quick actions, and recent activity.
   ============================================================ */

Router.register('home', async function (container) {

  // ── Current date helpers ──────────────────────────────────
  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth() + 1;        // 1-based
  const day   = now.getDate();

  // Format the date nicely (e.g. "Wednesday, 24 June 2026")
  const dateStr = now.toLocaleDateString(I18n.getLang() === 'bn' ? 'bn-BD' : 'en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  // ── Load data in parallel ─────────────────────────────────
  const [completionRate, streak, todayReport, recentReports] = await Promise.all([
    DB.getDayCompletionRate(year, month, day),
    DB.getStreak(),
    DB.getDailyReport(year, month, day),
    DB.getRecentReports(5),
  ]);

  // ── Today's highlights ────────────────────────────────────
  const quranStudy   = todayReport ? `${todayReport.quranS || 0} / ${todayReport.quranT || 0}` : '–';
  const salatJamat   = todayReport ? 
    ((todayReport.salatJamat !== undefined || todayReport.salatKaja !== undefined) 
      ? `${todayReport.salatJamat || 0}-${todayReport.salatKaja || 0}` 
      : '–') 
    : '–';
  const academic     = todayReport ? (todayReport.academic || '–') : '–';

  // Sum all contact fields
  const contactFields = ['contactM','contactA','contactW','contactS',
                         'contactF','contactMS','contactWW','contactR'];
  let totalContacts = 0;
  if (todayReport) {
    contactFields.forEach(f => {
      totalContacts += parseInt(todayReport[f], 10) || 0;
    });
  }
  const contactsDisplay = todayReport ? totalContacts : '–';

  // ── Progress ring maths ───────────────────────────────────
  const RADIUS        = 52;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ≈ 326.73
  const offset        = CIRCUMFERENCE * (1 - completionRate / 100);

  // ── Render HTML ───────────────────────────────────────────
  container.innerHTML = `
    <!-- ★ Greeting ★ -->
    <div class="home-greeting" style="position: relative; text-align:center; margin-bottom:var(--space-xl); padding-top: 4px;">
      <!-- Profile Button in Top Right Corner -->
      <button id="dashboard-profile-btn" style="position: absolute; right: 0; top: 0; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color); color: var(--text-primary); width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; box-shadow: var(--shadow-sm);" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='rgba(255,255,255,0.05)'" title="My Profile">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </button>

      <h2 style="font-size:1.25rem; font-weight:700; margin-bottom:4px;"
          data-i18n="home.greeting">${I18n.t('home.greeting')}</h2>
      <p style="font-size:0.8125rem; color:var(--text-muted);">${dateStr}</p>
    </div>

    <!-- ★ Progress Ring ★ -->
    <div class="glass-card" style="text-align:center; margin-bottom:var(--space-xl); padding-bottom:var(--space-lg);">
      <div class="section-header" style="justify-content:center;">
        <span class="section-title" data-i18n="home.todayProgress">${I18n.t('home.todayProgress')}</span>
      </div>

      <div class="progress-ring-container">
        <svg class="progress-ring" width="120" height="120" viewBox="0 0 120 120">
          <!-- Background track -->
          <circle cx="60" cy="60" r="${RADIUS}"
                  fill="none" stroke="var(--border-color)" stroke-width="8"/>
          <!-- Foreground arc -->
          <circle id="home-progress-arc" cx="60" cy="60" r="${RADIUS}"
                  fill="none" stroke="var(--color-primary)" stroke-width="8"
                  stroke-linecap="round"
                  stroke-dasharray="${CIRCUMFERENCE}"
                  stroke-dashoffset="${CIRCUMFERENCE}"
                  transform="rotate(-90 60 60)"
                  style="transition: stroke-dashoffset 0.8s ease;"/>
        </svg>
        <div class="progress-ring-text">
          <span class="progress-ring-value" id="home-progress-value">0%</span>
          <span class="progress-ring-label" data-i18n="home.completed">${I18n.t('home.completed')}</span>
        </div>
      </div>

      <!-- Streak badge -->
      <div class="streak-badge" style="margin:0 auto;">
        <span class="streak-fire">🔥</span>
        <span id="home-streak-count">${streak.current}</span>
        <span data-i18n="home.streak">${I18n.t('home.streak')}</span>
      </div>
    </div>

    <!-- ★ Today's Highlights ★ -->
    <div class="section-header">
      <div class="section-icon">📌</div>
      <span class="section-title" data-i18n="home.todayStats">${I18n.t('home.todayStats')}</span>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(16,185,129,0.12); color:var(--green-400);">📖</div>
        <div class="stat-value">${quranStudy}</div>
        <div class="stat-label" data-i18n="home.quranStudy">${I18n.t('home.quranStudy')}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(59,130,246,0.12); color:#60a5fa;">🕌</div>
        <div class="stat-value">${salatJamat}</div>
        <div class="stat-label" data-i18n="home.salatCompleted">${I18n.t('home.salatCompleted')}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(245,158,11,0.12); color:#fbbf24;">🎓</div>
        <div class="stat-value">${academic}</div>
        <div class="stat-label" data-i18n="home.academicHours">${I18n.t('home.academicHours')}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(139,92,246,0.12); color:#a78bfa;">👥</div>
        <div class="stat-value">${contactsDisplay}</div>
        <div class="stat-label" data-i18n="home.contacts">${I18n.t('home.contacts')}</div>
      </div>
    </div>

    <!-- ★ Quick Actions ★ -->
    <div class="section-header">
      <div class="section-icon">⚡</div>
      <span class="section-title" data-i18n="home.quickActions">${I18n.t('home.quickActions')}</span>
    </div>

    <div class="quick-actions">
      <button class="quick-action-card" data-nav="yearly-plan">
        <div class="quick-action-icon green">📋</div>
        <div class="quick-action-title" data-i18n="home.yearlyPlan">${I18n.t('home.yearlyPlan')}</div>
        <div class="quick-action-desc"  data-i18n="home.yearlyPlanDesc">${I18n.t('home.yearlyPlanDesc')}</div>
      </button>
      <button class="quick-action-card" data-nav="monthly-plan">
        <div class="quick-action-icon blue">📄</div>
        <div class="quick-action-title" data-i18n="home.monthlyPlan">${I18n.t('home.monthlyPlan')}</div>
        <div class="quick-action-desc"  data-i18n="home.monthlyPlanDesc">${I18n.t('home.monthlyPlanDesc')}</div>
      </button>
      <button class="quick-action-card" data-nav="daily-report">
        <div class="quick-action-icon amber">📊</div>
        <div class="quick-action-title" data-i18n="home.dailyReport">${I18n.t('home.dailyReport')}</div>
        <div class="quick-action-desc"  data-i18n="home.dailyReportDesc">${I18n.t('home.dailyReportDesc')}</div>
      </button>
      <button class="quick-action-card" data-nav="practical-page">
        <div class="quick-action-icon purple">📖</div>
        <div class="quick-action-title" data-i18n="home.practicalPage">${I18n.t('home.practicalPage')}</div>
        <div class="quick-action-desc"  data-i18n="home.practicalPageDesc">${I18n.t('home.practicalPageDesc')}</div>
      </button>
      <button class="quick-action-card" data-nav="salat">
        <div class="quick-action-icon green">🕌</div>
        <div class="quick-action-title" data-i18n="home.salatTimes">${I18n.t('home.salatTimes')}</div>
        <div class="quick-action-desc"  data-i18n="home.salatTimesDesc">${I18n.t('home.salatTimesDesc')}</div>
      </button>
      <a href="https://www.icsbook.info/" target="_blank" rel="noopener noreferrer" class="quick-action-card" style="text-decoration: none;">
        <div class="quick-action-icon blue">📚</div>
        <div class="quick-action-title" data-i18n="practical.libraryTitle" style="color: var(--text-primary);">${I18n.t('practical.libraryTitle')}</div>
        <div class="quick-action-desc"  data-i18n="practical.libraryDesc" style="color: var(--text-secondary); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; line-height: 1.4;">${I18n.t('practical.libraryDesc')}</div>
      </a>
    </div>

    <!-- ★ Recent Activity ★ -->
    <div class="section-header">
      <div class="section-icon">🕒</div>
      <span class="section-title" data-i18n="home.recentActivity">${I18n.t('home.recentActivity')}</span>
    </div>

    <div class="glass-card glass-card-compact" id="home-recent-list">
      ${buildRecentList(recentReports)}
    </div>
  `;

  // ── Animate progress ring after DOM paint ─────────────────
  requestAnimationFrame(() => {
    const arc   = document.getElementById('home-progress-arc');
    const label = document.getElementById('home-progress-value');
    if (arc)   arc.style.strokeDashoffset = offset;
    if (label) label.textContent = `${completionRate}%`;
  });

  // ── Wire up Quick-Action navigation ───────────────────────
  container.querySelectorAll('.quick-action-card[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      Router.navigate(btn.getAttribute('data-nav'));
    });
  });

  // ── Wire up dashboard profile button click ────────────────
  const dashboardProfileBtn = container.querySelector('#dashboard-profile-btn');
  if (dashboardProfileBtn) {
    dashboardProfileBtn.addEventListener('click', () => {
      Router.navigate('profile');
    });
  }

  // ── Wire up Recent-Activity row clicks → daily-report ─────
  container.querySelectorAll('.recent-item[data-date]').forEach(item => {
    item.addEventListener('click', () => {
      Router.navigate('daily-report');
    });
  });

  // ── Check for new Supervisor Feedback ──────────────────────
  async function checkForFeedback() {
    try {
      const submissions = await Sync.getMemberSubmissions();
      const reviewed = submissions.filter(s => s.status === 'reviewed');
      if (reviewed.length > 0) {
        const readFeedbackIds = JSON.parse(localStorage.getItem('perfbook_read_feedbacks') || '[]');
        
        // Find a review that has not been read (using ID + reviewedAt timestamp to handle updates)
        const unreadFeedback = reviewed.find(s => !readFeedbackIds.includes(`${s.id}_${s.reviewedAt || ''}`));
        
        if (unreadFeedback) {
          showFeedbackPopup(unreadFeedback, readFeedbackIds);
        }
      }
    } catch (err) {
      console.error("Failed to check supervisor feedback:", err);
    }
  }

  function showFeedbackPopup(feedback, readFeedbackIds) {
    const overlay = document.createElement('div');
    overlay.className = 'salat-modal-overlay';
    overlay.style.zIndex = '9999';
    
    const localizedMonth = App.getMonthName(feedback.month, I18n.getLang());
    
    const titleText = I18n.getLang() === 'bn' ? '📬 নতুন মূল্যায়ন নির্দেশনা!' : '📬 New Supervisor Assessment!';
    const subText = I18n.getLang() === 'bn' 
      ? `আপনার <strong>${localizedMonth} ${feedback.year}</strong> মাসের রিপোর্টটি সুপারভাইজার মূল্যায়ন করেছেন।`
      : `Your monthly report for <strong>${localizedMonth} ${feedback.year}</strong> has been reviewed by your supervisor.`;
    
    const commentsLabel = I18n.getLang() === 'bn' ? 'পরামর্শ ও নির্দেশনা:' : 'Comments & Guidance:';
    const closeBtnText = I18n.getLang() === 'bn' ? 'পড়েছি (বন্ধ করুন)' : 'Got it (Close)';
    
    overlay.innerHTML = `
      <div class="salat-modal-card" style="max-width: 450px; padding: var(--space-xl); border: 1.5px solid var(--color-primary); background: rgba(15, 23, 42, 0.95); text-align: center;">
        <div style="font-size: 3.5rem; margin-bottom: var(--space-md); animation: pulse 2s infinite;">📬</div>
        <h3 style="font-weight: 800; font-size: 1.3rem; margin-bottom: var(--space-sm); color: var(--text-primary);">${titleText}</h3>
        <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: var(--space-lg); line-height: 1.6;">${subText}</p>
        
        <div style="background: rgba(16, 185, 129, 0.05); border-left: 4px solid var(--color-primary); padding: var(--space-md); border-radius: var(--radius-sm); text-align: left; margin-bottom: var(--space-xl); max-height: 150px; overflow-y: auto;">
          <div style="font-size: 0.75rem; color: var(--color-primary); font-weight: 700; margin-bottom: var(--space-xs); text-transform: uppercase; letter-spacing: 0.5px;">${commentsLabel}</div>
          <div style="font-size: 0.85rem; color: var(--text-primary); line-height: 1.5; font-style: italic; white-space: pre-wrap;">${feedback.supervisorFeedback || 'No written comments.'}</div>
        </div>
        
        <button type="button" id="feedback-dismiss-btn" class="btn btn-primary" style="width: 100%; padding: 12px; font-weight: 700; font-size: 0.9rem; border-radius: 8px;">${closeBtnText}</button>
      </div>
    `;
    
    container.appendChild(overlay);
    
    // Trigger reflow & animate in
    overlay.offsetHeight;
    overlay.classList.add('active');
    
    overlay.querySelector('#feedback-dismiss-btn').addEventListener('click', () => {
      readFeedbackIds.push(`${feedback.id}_${feedback.reviewedAt || ''}`);
      localStorage.setItem('perfbook_read_feedbacks', JSON.stringify(readFeedbackIds));
      
      overlay.classList.remove('active');
      setTimeout(() => {
        overlay.remove();
      }, 250);
    });
  }

  // Trigger feedback check
  checkForFeedback();

  // Trigger background sync-down to pull changes updated from other devices/web
  if (typeof Sync !== 'undefined' && Sync.syncDownData) {
    Sync.syncDownData().then(hasChanges => {
      if (hasChanges) {
        console.log("New reports synced down from Firestore. Refreshing dashboard...");
        Router.navigate('home');
      }
    });
  }

  // ────────────────────────────────────────────────────────────
  // Helper: build the recent activity list HTML
  // ────────────────────────────────────────────────────────────
  function buildRecentList(reports) {
    if (!reports || reports.length === 0) {
      return `
        <div class="empty-state" style="padding:var(--space-xl) 0;">
          <div class="empty-state-icon">📝</div>
          <div class="empty-state-title" data-i18n="home.noActivity">${I18n.t('home.noActivity')}</div>
          <div class="empty-state-text" data-i18n="home.startTracking">${I18n.t('home.startTracking')}</div>
        </div>`;
    }

    return reports.map(r => {
      // Format the report date
      const rDate = new Date(r.year, r.month - 1, r.day);
      const rDateStr = rDate.toLocaleDateString(I18n.getLang() === 'bn' ? 'bn-BD' : 'en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
      });

      // Compute a quick completion rate for this entry
      const rate = computeCompletionRate(r);
      const badgeClass = rate >= 70 ? 'badge-green' : rate >= 40 ? 'badge-amber' : 'badge-red';

      return `
        <div class="recent-item" data-date="${r.year}-${r.month}-${r.day}"
             style="display:flex; align-items:center; justify-content:space-between;
                    padding:var(--space-md) 0; border-bottom:1px solid var(--border-color);
                    cursor:pointer;">
          <span style="font-size:0.8125rem; color:var(--text-primary);">${rDateStr}</span>
          <span class="badge ${badgeClass}">${rate}%</span>
        </div>`;
    }).join('');
  }

  // ────────────────────────────────────────────────────────────
  // Helper: lightweight completion-rate calculator (mirrors DB)
  // ────────────────────────────────────────────────────────────
  function computeCompletionRate(report) {
    if (!report) return 0;
    const fields = ['quranS','quranT','hadithNum','litI','litG','academic',
                    'classT','classA','salatJamat','salatKaja',
                    'contactM','contactA','contactW','contactS',
                    'contactF','contactMS','contactWW','contactR',
                    'dawah','orgWork','sleeping','socialMedia'];
    const checks = ['newsReading','exercise','selfEval'];
    let filled = 0, total = 0;

    fields.forEach(f => {
      total++;
      if (f === 'socialMedia') {
        if (report[f] && report[f] !== '') {
          let mins = 0;
          if (report[f].includes(':')) {
            const parts = report[f].split(':');
            mins = (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
          }
          const score = Math.max(0, 1 - mins / 120);
          filled += score;
        }
      } else {
        if (report[f] && report[f] !== '' && report[f] !== '0' && report[f] !== '00:00') filled++;
      }
    });
    checks.forEach(f => {
      total++;
      if (report[f]) filled++;
    });

    return total > 0 ? Math.round((filled / total) * 100) : 0;
  }

});
