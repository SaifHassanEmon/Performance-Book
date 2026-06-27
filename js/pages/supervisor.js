/* ============================================================
   Supervisor Dashboard Page
   Provides views for listing submissions, reviewing detailed monthly plans,
   and auditing detailed daily report grids.
   ============================================================ */

Router.register('supervisor', async function (container) {
  let activeView = 'list'; // list, detail, daily_logs
  let selectedSubmission = null;
  let memberDailyLogs = [];

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  async function renderDashboard() {
    const user = Auth.getCurrentUser();
    const isSuper = user && (user.isSupervisor || user.role === 'supervisor' || user.isAdmin || user.role === 'admin');
    if (!user || !isSuper) {
      container.innerHTML = `
        <div class="glass-card" style="text-align:center; padding:var(--space-2xl) var(--space-lg); margin-top:var(--space-xl);">
          <div style="font-size:3rem; margin-bottom:var(--space-md);">⚠️</div>
          <h3 style="font-weight:700;">Unauthorized Access</h3>
          <p style="color:var(--text-secondary); margin-top:var(--space-sm); font-size:0.875rem;">You need supervisor credentials to view this page.</p>
          <button id="super-back-login-btn" class="btn btn-primary" style="margin-top:var(--space-lg);">Back to Login</button>
        </div>
      `;
      container.querySelector('#super-back-login-btn').addEventListener('click', () => {
        Router.navigate('login');
      });
      return;
    }

    if (activeView === 'list') {
      await renderListView(user);
    } else if (activeView === 'detail') {
      renderDetailView();
    } else if (activeView === 'daily_logs') {
      renderDailyLogsView();
    }
  }

  // ────────────────────────────────────────────────────────
  // 1. LIST VIEW: Lists all submitted monthly reports
  // ────────────────────────────────────────────────────────

  async function renderListView(user) {
    container.removeAttribute('style'); // Clear any page-specific scrolling overrides
    
    let submissions = [];
    try {
      submissions = await Sync.getSubmittedReportsForSupervisor();
      // Filter submissions by supervisedUposakhas unless admin
      const isAdmin = user.isAdmin || user.role === 'admin';
      if (!isAdmin) {
        const supervised = user.supervisedUposakhas || [];
        submissions = submissions.filter(sub => supervised.includes(sub.memberUposakha));
      }
    } catch (e) {
      console.error(e);
      App.showToast("Failed to fetch submissions", "error");
    }

    let listHtml = '';
    if (submissions.length === 0) {
      listHtml = `
        <div style="text-align:center; padding:var(--space-2xl) 0; color:var(--text-secondary);">
          <div style="font-size:2.5rem; margin-bottom:var(--space-sm);">📬</div>
          <p style="font-size:0.875rem;">No monthly reports submitted for review yet.</p>
        </div>
      `;
    } else {
      submissions.forEach(sub => {
        const isReviewed = sub.status === 'reviewed';
        listHtml += `
          <div class="glass-card" style="margin-bottom:var(--space-md); padding:var(--space-lg);">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:var(--space-sm);">
              <div>
                <h4 style="font-size:0.95rem; font-weight:700; color:var(--text-primary);">${sub.memberName}</h4>
                <p style="font-size:0.75rem; color:var(--text-muted);">${sub.memberEmail} ${sub.memberUposakha ? `(${sub.memberUposakha})` : ''}</p>
              </div>
              <span class="badge ${isReviewed ? 'badge-green' : 'badge-amber'}">
                ${isReviewed ? 'Reviewed' : 'Pending'}
              </span>
            </div>
            
            <div style="margin-bottom:var(--space-md); font-size:0.8125rem; color:var(--text-secondary);">
              <div><strong>Report Month:</strong> ${monthNames[sub.month - 1]} ${sub.year}</div>
              <div style="font-size:0.7rem; color:var(--text-muted); margin-top:2px;">
                <strong>Submitted:</strong> ${new Date(sub.submittedAt).toLocaleString()}
              </div>
            </div>

            <div style="display:flex; gap:var(--space-sm);">
              <button class="btn btn-secondary btn-sm inspect-plan-btn" data-id="${sub.id}" style="flex:1;">Review Details</button>
              <button class="btn btn-secondary btn-sm inspect-logs-btn" data-id="${sub.id}" style="flex:1;">View Daily Grid</button>
            </div>
          </div>
        `;
      });
    }

    container.innerHTML = `
      <!-- Dashboard Header -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-xl); margin-top:var(--space-md);">
        <div>
          <h2 style="font-size:1.25rem; font-weight:800; color:var(--text-primary);">Supervisor Dashboard</h2>
          <p style="font-size:0.75rem; color:var(--text-muted);">Review submitted booklets & reports</p>
        </div>
      </div>

      <!-- List Container -->
      <div style="margin-bottom:var(--space-2xl);">
        <h3 class="settings-group-title" style="margin-bottom:var(--space-md);">Submitted Reports</h3>
        ${listHtml}
      </div>
    `;

    // Wire up events
    container.querySelectorAll('.inspect-plan-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        selectedSubmission = submissions.find(s => s.id === id);
        activeView = 'detail';
        renderDashboard();
      });
    });

    container.querySelectorAll('.inspect-logs-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        selectedSubmission = submissions.find(s => s.id === id);
        App.showToast("Loading member logs...", "info");
        try {
          memberDailyLogs = await Sync.getMemberDailyReports(selectedSubmission.uid, selectedSubmission.year, selectedSubmission.month);
          activeView = 'daily_logs';
          renderDashboard();
        } catch (e) {
          console.error(e);
          App.showToast("Failed to load logs", "error");
        }
      });
    });
  }

  // ────────────────────────────────────────────────────────
  // 2. DETAIL VIEW: Read-only Monthly Plan Inspection
  // ────────────────────────────────────────────────────────
  function renderDetailView() {
    container.removeAttribute('style'); // Clear any page-specific scrolling overrides
    const sub = selectedSubmission;
    
    // Quick helper to render a read-only label/value pair
    function renderField(label, val) {
      return `
        <div style="display:flex; justify-content:space-between; padding:var(--space-xs) 0; border-bottom:1px solid var(--border-color); font-size:0.8125rem;">
          <span style="color:var(--text-secondary); font-weight:500;">${label}</span>
          <span style="color:var(--text-primary); font-weight:600;">${val || '–'}</span>
        </div>
      `;
    }

    container.innerHTML = `
      <!-- Header -->
      <div style="display:flex; align-items:center; gap:var(--space-md); margin-bottom:var(--space-lg); margin-top:var(--space-md);">
        <button id="detail-back-btn" class="header-btn" style="color:var(--text-secondary);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <div>
          <h2 style="font-size:1.1rem; font-weight:800;">Reviewing Monthly Report</h2>
          <p style="font-size:0.75rem; color:var(--text-muted);">${sub.memberName} — ${monthNames[sub.month - 1]} ${sub.year}</p>
        </div>
      </div>

      <!-- Plan Details (Read Only) -->
      <div style="display:flex; flex-direction:column; gap:var(--space-lg); margin-bottom:var(--space-xl);">
        
        <!-- 1. The Holy Quran -->
        <div class="glass-card">
          <div class="section-header"><div class="section-icon">📖</div><span class="section-title">The Holy Quran (S/T)</span></div>
          ${renderField('Total Days', sub.mqTotalDays)}
          ${renderField('Average Ayah / Day', sub.mqAvgAyah)}
          ${renderField('Making Dars (Times)', sub.mqMakingDars)}
          ${renderField('Memorized Ayah Quantity', sub.mqMemorized)}
          ${renderField('Meaning Study (Surah)', sub.mqMeaning)}
        </div>

        <!-- 2. Studying Hadith -->
        <div class="glass-card">
          <div class="section-header"><div class="section-icon">📚</div><span class="section-title">Studying Hadith</span></div>
          ${renderField('Total Days', sub.mhTotalDays)}
          ${renderField('Daily Average Hadith', sub.mhAvg)}
          ${renderField('Masnun Dua Quantity', sub.mhMasnunDua)}
          ${renderField('Making Dars (Times)', sub.mhMakingDars)}
          ${renderField('Memorized Hadith', sub.mhMemorized)}
          ${renderField('Hadith Book & Subject Name', sub.mhSubject)}
        </div>

        <!-- 3. Reading Literature -->
        <div class="glass-card">
          <div class="section-header"><div class="section-icon">📕</div><span class="section-title">Reading Literature</span></div>
          ${renderField('Total Pages', sub.mlTotalPages)}
          ${renderField('Islamic Literature (Pages)', sub.mlIslamic)}
          ${renderField('General Literature (Pages)', sub.mlOthers)}
          ${renderField('Book Name', sub.mlBookName)}
          ${renderField('Book Note Quantity', sub.mlBookNote)}
          ${renderField('Discussion Note Quantity', sub.mlDiscussion)}
        </div>

        <!-- 4. Academic Study -->
        <div class="glass-card">
          <div class="section-header"><div class="section-icon">🎓</div><span class="section-title">Academic Study</span></div>
          ${renderField('Total Days', sub.maTotalDays)}
          ${renderField('Daily Average Hours', sub.maAvgHours)}
        </div>

        <!-- 5. Communication -->
        <div class="glass-card">
          <div class="section-header"><div class="section-icon">💬</div><span class="section-title">Communication</span></div>
          ${renderField('Member', sub.mcMember)}
          ${renderField('Associate', sub.mcAssociate)}
          ${renderField('Worker', sub.mcWorker)}
          ${renderField('Supporter', sub.mcSupporter)}
          ${renderField('Friends', sub.mcFriends)}
          ${renderField('Well Wisher', sub.mcWellWisher)}
          ${renderField('Meritorious Student', sub.mcMeritorious)}
          ${renderField('Teacher', sub.mcTeacher)}
          ${renderField('VIP', sub.mcVip)}
          ${renderField('Reader', sub.mcReader)}
        </div>

        <!-- 6. Dawah & Work -->
        <div class="glass-card">
          <div class="section-header"><div class="section-icon">🌍</div><span class="section-title">Dawah & Org Work</span></div>
          ${renderField('Dawah Days', sub.mdDay)}
          ${renderField('Dawah Avg Hours', sub.mdAvgHours)}
          ${renderField('Dawah Total Contacts', sub.mdTotalPerson)}
          ${renderField('Org Work Days', sub.moTotalDays)}
          ${renderField('Org Work Avg Hours', sub.moAvgHours)}
          ${renderField('Sleeping Avg Hours', sub.msAvgHours)}
        </div>

        <!-- 7. Baitulmal -->
        <div class="glass-card">
          <div class="section-header"><div class="section-icon">💰</div><span class="section-title">Baitulmal (Financials)</span></div>
          ${renderField('Personal Contribution (Taka)', sub.mbPersonal)}
          ${renderField('Student Welfare Contribution', sub.mbStudentWelfare)}
          ${renderField('S.W Box Collection (Taka)', sub.mbSwBox)}
          ${renderField('Total Collection Increase', sub.mbTotalIncrease)}
          ${renderField('Table Bank (Pieces)', sub.mbTableBank)}
          ${renderField('Others (Taka)', sub.mbOthers)}
        </div>

        <!-- 8. Supervisor Feedback Card -->
        <div class="glass-card" style="border:1.5px solid var(--color-primary); background:rgba(16,185,129,0.03);">
          <div class="section-header">
            <div class="section-icon" style="background:var(--color-primary);">💬</div>
            <span class="section-title">Supervisor Assessment</span>
          </div>
          
          <div class="form-group">
            <label class="form-label">Comments / Advice (পরামর্শ ও নির্দেশনা)</label>
            <textarea id="feedback-text" class="form-input" rows="4" placeholder="Enter comments or guidance for the member...">${sub.supervisorFeedback || ''}</textarea>
          </div>

          <div style="display:flex; gap:var(--space-md);">
            <button id="feedback-approve-btn" class="btn btn-primary" style="flex:1;">Mark Reviewed</button>
            <button id="feedback-cancel-btn" class="btn btn-secondary" style="flex:1;">Back</button>
          </div>
        </div>

      </div>
    `;

    // Wire events
    container.querySelector('#detail-back-btn').addEventListener('click', () => {
      activeView = 'list';
      renderDashboard();
    });

    container.querySelector('#feedback-cancel-btn').addEventListener('click', () => {
      activeView = 'list';
      renderDashboard();
    });

    container.querySelector('#feedback-approve-btn').addEventListener('click', async () => {
      const feedback = container.querySelector('#feedback-text').value;
      App.showToast("Saving feedback...", "info");
      try {
        await Sync.submitSupervisorFeedback(sub.id, 'reviewed', feedback);
        App.showToast("Report reviewed successfully!", "success");
        activeView = 'list';
        renderDashboard();
      } catch (err) {
        console.error(err);
        App.showToast("Failed to save feedback", "error");
      }
    });
  }

  // ────────────────────────────────────────────────────────
  // 3. DAILY LOGS VIEW: Read-only Daily Report Auditing Grid
  // ────────────────────────────────────────────────────────
  function renderDailyLogsView() {
    // Lock viewport size and prevent body scrolling on the daily logs audit page
    container.style.height = 'calc(100dvh - 128px)';
    container.style.overflow = 'hidden';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';

    const sub = selectedSubmission;
    const daysInMonth = App.getDaysInMonth(sub.year, sub.month);
    
    // Map member's daily logs by day
    const logsMap = {};
    memberDailyLogs.forEach(log => {
      logsMap[log.day] = log;
    });

    let tableRows = '';
    for (let day = 1; day <= daysInMonth; day++) {
      const log = logsMap[day] || {};
      tableRows += `
        <tr>
          <td class="date-col" style="font-weight:700;">${String(day).padStart(2, '0')}</td>
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

    container.innerHTML = `
      <!-- Header -->
      <div style="display:flex; align-items:center; gap:var(--space-md); margin-bottom:var(--space-lg); margin-top:var(--space-md);">
        <button id="logs-back-btn" class="header-btn" style="color:var(--text-secondary);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <div>
          <h2 style="font-size:1.1rem; font-weight:800;">Auditing Daily Logs</h2>
          <p style="font-size:0.75rem; color:var(--text-muted);">${sub.memberName} — ${monthNames[sub.month - 1]} ${sub.year}</p>
        </div>
      </div>

      <!-- Horizontal Scrollable Grid -->
      <div class="report-grid-wrapper" style="flex: 1; overflow: auto; margin-bottom: var(--space-lg);">
        <table class="report-grid">
          <thead>
            <tr>
              <th rowspan="2" class="date-col">Date</th>
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
            <tr>
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
    `;

    // Wire events
    container.querySelector('#logs-back-btn').addEventListener('click', () => {
      activeView = 'list';
      renderDashboard();
    });
  }

  await renderDashboard();
});
