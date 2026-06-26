/* ============================================================
   Analytics Page
   Displays streak stats and habit completion charts using Chart.js
   ============================================================ */

Router.register('analytics', async function (container) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Local helper to compute completion rate of a single report object
  function calculateCompletionRate(report) {
    if (!report) return 0;
    let filled = 0;
    let total = 0;
    const fields = ['quranS', 'quranT', 'hadithNum', 'litI', 'litG', 'academic', 
                     'classT', 'classA', 'salatJamat', 'salatKaja',
                     'contactM', 'contactA', 'contactW', 'contactS',
                     'contactF', 'contactMS', 'contactWW', 'contactR',
                     'dawah', 'orgWork', 'sleeping', 'socialMedia'];
    const checkFields = ['newsReading', 'exercise', 'selfEval'];

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
    checkFields.forEach(f => {
      total++;
      if (report[f]) filled++;
    });

    return total > 0 ? Math.round((filled / total) * 100) : 0;
  }

  async function renderPage() {
    const [streak, allReports, monthlyReports] = await Promise.all([
      DB.getStreak(),
      DB.getAllDailyReports(),
      DB.getMonthlyReports(currentYear, currentMonth),
    ]);

    // If there is no data at all, render an empty state
    if (allReports.length === 0) {
      container.innerHTML = `
        <div class="glass-card" style="text-align:center; padding:var(--space-2xl) var(--space-lg); margin-top:var(--space-xl);">
          <div style="font-size:3.5rem; margin-bottom:var(--space-md); filter:drop-shadow(0 4px 12px rgba(16,185,129,0.3));">📊</div>
          <h3 data-i18n="analytics.noData" style="font-weight:700; font-size:1.25rem;">${I18n.t('analytics.noData')}</h3>
          <p data-i18n="analytics.startFilling" style="color:var(--text-secondary); margin-top:var(--space-sm); font-size:0.875rem;">${I18n.t('analytics.startFilling')}</p>
        </div>
      `;
      I18n.applyLanguage();
      return;
    }

    // Calculate Avg Completion Rate across all logs
    let totalRate = 0;
    allReports.forEach(r => {
      totalRate += calculateCompletionRate(r);
    });
    const avgCompletion = Math.round(totalRate / allReports.length);

    container.innerHTML = `
      <!-- Streak Stats Cards -->
      <div class="stats-grid" style="margin-top:var(--space-md); margin-bottom:var(--space-lg);">
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(245,158,11,0.12); color:#fbbf24;">🔥</div>
          <div class="stat-value">${streak.current}</div>
          <div class="stat-label" data-i18n="analytics.currentStreak">${I18n.t('analytics.currentStreak')}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(16,185,129,0.12); color:var(--green-400);">🏆</div>
          <div class="stat-value">${streak.longest}</div>
          <div class="stat-label" data-i18n="analytics.longestStreak">${I18n.t('analytics.longestStreak')}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(59,130,246,0.12); color:#60a5fa;">📝</div>
          <div class="stat-value">${streak.total}</div>
          <div class="stat-label" data-i18n="analytics.totalEntries">${I18n.t('analytics.totalEntries')}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(139,92,246,0.12); color:#a78bfa;">📊</div>
          <div class="stat-value">${avgCompletion}%</div>
          <div class="stat-label" data-i18n="analytics.avgCompletion">${I18n.t('analytics.avgCompletion')}</div>
        </div>
      </div>

      <!-- Weekly Progress Bar Chart -->
      <div class="glass-card" style="margin-bottom:var(--space-lg)">
        <div class="section-header">
          <div class="section-icon">📈</div>
          <div class="section-title" data-i18n="analytics.weeklyProgress">${I18n.t('analytics.weeklyProgress')}</div>
        </div>
        <div style="position:relative; height:240px; margin-top:var(--space-md);">
          <canvas id="weeklyProgressChart"></canvas>
        </div>
      </div>

      <!-- Monthly Trends Line Chart -->
      <div class="glass-card" style="margin-bottom:var(--space-lg)">
        <div class="section-header">
          <div class="section-icon">🗓️</div>
          <div class="section-title" data-i18n="analytics.monthlyTrends">${I18n.t('analytics.monthlyTrends')}</div>
        </div>
        <div style="position:relative; height:260px; margin-top:var(--space-md);">
          <canvas id="monthlyTrendsChart"></canvas>
        </div>
      </div>

      <!-- Time Category Breakdown Doughnut Chart -->
      <div class="glass-card" style="margin-bottom:var(--space-xl)">
        <div class="section-header">
          <div class="section-icon">🕒</div>
          <div class="section-title" data-i18n="analytics.categoryBreakdown">${I18n.t('analytics.categoryBreakdown')}</div>
        </div>
        <div style="position:relative; height:260px; margin-top:var(--space-md); display:flex; justify-content:center;">
          <canvas id="categoryBreakdownChart" style="max-width:260px; max-height:260px;"></canvas>
        </div>
      </div>
    `;

    I18n.applyLanguage();

    // Render charts if Chart.js is loaded
    if (typeof Chart !== 'undefined') {
      await renderCharts(monthlyReports);
    } else {
      console.warn('Chart.js library is not loaded.');
    }
  }

  async function renderCharts(monthlyReports) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#94a3b8' : '#475569';
    const gridColor = isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(0, 0, 0, 0.05)';

    // Global Chart.js styling settings
    Chart.defaults.color = textColor;
    Chart.defaults.font.family     // ────────────────────────────────────────────────────────
    // 1. Weekly Progress Chart Data
    // ────────────────────────────────────────────────────────
    const weeklyLabels = [];
    const weeklyRates = [];
    const today = new Date();
    
    // Fetch last 7 days of completion rates
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const dayVal = d.getDate();

      const rate = await DB.getDayCompletionRate(y, m, dayVal);
      weeklyRates.push(rate);

      const label = d.toLocaleDateString(I18n.getLang() === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short' });
      weeklyLabels.push(label);
    }

    const ctxWeekly = document.getElementById('weeklyProgressChart').getContext('2d');
    const gradWeekly = ctxWeekly.createLinearGradient(0, 0, 0, 200);
    gradWeekly.addColorStop(0, '#10b981');
    gradWeekly.addColorStop(1, 'rgba(16, 185, 129, 0.08)');

    new Chart(ctxWeekly, {
      type: 'bar',
      data: {
        labels: weeklyLabels,
        datasets: [{
          label: I18n.getLang() === 'bn' ? 'অগ্রগতি %' : 'Progress %',
          data: weeklyRates,
          backgroundColor: gradWeekly,
          hoverBackgroundColor: '#10b981',
          borderRadius: 8,
          borderWidth: 0,
          barPercentage: 0.55,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)',
            titleColor: isDark ? '#f8fafc' : '#0f172a',
            bodyColor: isDark ? '#cbd5e1' : '#334155',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            boxWidth: 8,
            boxHeight: 8,
            usePointStyle: true,
            callbacks: {
              label: (context) => ` ${context.dataset.label}: ${context.raw}%`
            }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            grid: { color: gridColor },
            min: 0,
            max: 100,
            ticks: { callback: value => value + '%' }
          }
        }
      }
    });

    // ────────────────────────────────────────────────────────
    // 2. Monthly Trends Line Chart Data
    // ────────────────────────────────────────────────────────
    const daysInMonth = App.getDaysInMonth(currentYear, currentMonth);
    const monthlyLabels = Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, '0'));
    
    // Map monthly reports by day
    const reportsMap = {};
    monthlyReports.forEach(r => { reportsMap[r.day] = r; });

    const quranData = [];
    const hadithData = [];
    const salatData = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const rep = reportsMap[d] || {};
      const qVal = (parseInt(rep.quranS, 10) || 0) + (parseInt(rep.quranT, 10) || 0);
      const hVal = parseInt(rep.hadithNum, 10) || 0;
      const sVal = parseInt(rep.salatJamat, 10) || 0;

      quranData.push(qVal);
      hadithData.push(hVal);
      salatData.push(sVal);
    }

    const ctxMonthly = document.getElementById('monthlyTrendsChart').getContext('2d');
    
    const gradQuran = ctxMonthly.createLinearGradient(0, 0, 0, 240);
    gradQuran.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
    gradQuran.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
    
    const gradHadith = ctxMonthly.createLinearGradient(0, 0, 0, 240);
    gradHadith.addColorStop(0, 'rgba(59, 130, 246, 0.25)');
    gradHadith.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
    
    const gradSalat = ctxMonthly.createLinearGradient(0, 0, 0, 240);
    gradSalat.addColorStop(0, 'rgba(245, 158, 11, 0.25)');
    gradSalat.addColorStop(1, 'rgba(245, 158, 11, 0.0)');

    new Chart(ctxMonthly, {
      type: 'line',
      data: {
        labels: monthlyLabels,
        datasets: [
          {
            label: I18n.getLang() === 'bn' ? 'কুরআন (S+T)' : 'Quran (S+T)',
            data: quranData,
            borderColor: '#10b981',
            backgroundColor: gradQuran,
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointRadius: 2,
            pointBackgroundColor: '#10b981',
            pointHoverRadius: 6,
            pointHoverBorderWidth: 2,
          },
          {
            label: I18n.getLang() === 'bn' ? 'হাদিস' : 'Hadith',
            data: hadithData,
            borderColor: '#3b82f6',
            backgroundColor: gradHadith,
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointRadius: 2,
            pointBackgroundColor: '#3b82f6',
            pointHoverRadius: 6,
            pointHoverBorderWidth: 2,
          },
          {
            label: I18n.getLang() === 'bn' ? 'সালাত (জামাত)' : 'Salat (Jamat)',
            data: salatData,
            borderColor: '#f59e0b',
            backgroundColor: gradSalat,
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointRadius: 2,
            pointBackgroundColor: '#f59e0b',
            pointHoverRadius: 6,
            pointHoverBorderWidth: 2,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12, boxHeight: 12, padding: 16 } },
          tooltip: {
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)',
            titleColor: isDark ? '#f8fafc' : '#0f172a',
            bodyColor: isDark ? '#cbd5e1' : '#334155',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            boxWidth: 8,
            boxHeight: 8,
            usePointStyle: true,
          }
        },
        interaction: {
          intersect: false,
          mode: 'index',
        },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: gridColor, drawTicks: false } }
        }
      }
    });

    // ────────────────────────────────────────────────────────
    // 3. Category Breakdown Doughnut Chart Data
    // ────────────────────────────────────────────────────────
    let academicMins = 0;
    let dawahMins = 0;
    let orgMins = 0;
    let sleepMins = 0;
    let socialMins = 0;

    monthlyReports.forEach(r => {
      academicMins += App.timeToMinutes(r.academic);
      dawahMins += App.timeToMinutes(r.dawah);
      orgMins += App.timeToMinutes(r.orgWork);
      sleepMins += App.timeToMinutes(r.sleeping);
      socialMins += App.timeToMinutes(r.socialMedia);
    });

    const academicHours = Math.round((academicMins / 60) * 10) / 10;
    const dawahHours = Math.round((dawahMins / 60) * 10) / 10;
    const orgHours = Math.round((orgMins / 60) * 10) / 10;
    const sleepHours = Math.round((sleepMins / 60) * 10) / 10;
    const socialHours = Math.round((socialMins / 60) * 10) / 10;
    const totalHours = Math.round((academicHours + dawahHours + orgHours + sleepHours + socialHours) * 10) / 10;

    const doughnutLabels = I18n.getLang() === 'bn' 
      ? ['একাডেমিক', 'দাওয়াহ', 'সাংগঠনিক', 'ঘুম', 'সোশ্যাল মিডিয়া']
      : ['Academic', 'Dawah', 'Org. Work', 'Sleep', 'Social Media'];

    const centerTextPlugin = {
      id: 'centerText',
      afterDraw: function(chart) {
        const { ctx, width, height } = chart;
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw label
        ctx.font = "500 0.8rem 'Inter', sans-serif";
        ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
        ctx.fillText(I18n.getLang() === 'bn' ? 'মোট সময়' : 'TOTAL TIME', width / 2, (height / 2) - 10);
        
        // Draw total value
        ctx.font = "800 1.5rem 'Inter', sans-serif";
        ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
        ctx.fillText(totalHours + 'h', width / 2, (height / 2) + 12);
        
        ctx.restore();
      }
    };

    new Chart(document.getElementById('categoryBreakdownChart'), {
      type: 'doughnut',
      data: {
        labels: doughnutLabels,
        datasets: [{
          data: [academicHours, dawahHours, orgHours, sleepHours, socialHours],
          backgroundColor: [
            '#3b82f6', // blue
            '#8b5cf6', // purple
            '#fbbf24', // amber
            '#10b981', // green
            '#ef4444'  // red
          ],
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, padding: 12 } },
          tooltip: {
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)',
            titleColor: isDark ? '#f8fafc' : '#0f172a',
            bodyColor: isDark ? '#cbd5e1' : '#334155',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            boxWidth: 8,
            boxHeight: 8,
            usePointStyle: true,
            callbacks: {
              label: function (context) {
                return ` ${context.label}: ${context.raw} hrs`;
              }
            }
          }
        },
        cutout: '72%',
      },
      plugins: [centerTextPlugin]
    });
  }

  await renderPage();
});
