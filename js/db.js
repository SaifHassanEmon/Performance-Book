/* ============================================================
   Database — IndexedDB via Dexie.js
   Local-first storage for all Performance Book data
   ============================================================ */

const DB = (() => {
  let db;

  function init() {
    db = new Dexie('PerformanceBookDB');
    
    db.version(2).stores({
      yearly_plans: '++id, year, createdAt',
      monthly_plans: '++id, year, month, createdAt, submitted',
      daily_reports: '++id, [year+month+day], year, month, day, createdAt',
      settings: 'key',
      streaks: '++id, type, date',
    });

    return db.open();
  }

  // ---- Yearly Plans ----
  async function saveYearlyPlan(data) {
    const existing = await db.yearly_plans.where('year').equals(data.year).first();
    if (existing) {
      return db.yearly_plans.update(existing.id, { ...data, updatedAt: new Date().toISOString() });
    }
    return db.yearly_plans.add({ ...data, createdAt: new Date().toISOString() });
  }

  async function getYearlyPlan(year) {
    return db.yearly_plans.where('year').equals(year).first();
  }

  async function getAllYearlyPlans() {
    return db.yearly_plans.orderBy('year').reverse().toArray();
  }

  // ---- Monthly Plans ----
  async function saveMonthlyPlan(data) {
    const all = await db.monthly_plans
      .filter(p => p.year === data.year && p.month === data.month)
      .first();
    
    if (all) {
      return db.monthly_plans.update(all.id, { ...data, updatedAt: new Date().toISOString() });
    }
    return db.monthly_plans.add({ ...data, createdAt: new Date().toISOString(), submitted: false });
  }

  async function getMonthlyPlan(year, month) {
    return db.monthly_plans
      .filter(p => p.year === year && p.month === month)
      .first();
  }

  async function markMonthlySubmitted(year, month) {
    const plan = await getMonthlyPlan(year, month);
    if (plan) {
      return db.monthly_plans.update(plan.id, { submitted: true, submittedAt: new Date().toISOString() });
    }
  }

  async function getAllMonthlyPlans() {
    return db.monthly_plans.orderBy('createdAt').reverse().toArray();
  }

  // ---- Daily Reports ----
  async function saveDailyReport(year, month, day, data) {
    const existing = await db.daily_reports
      .filter(r => r.year === year && r.month === month && r.day === day)
      .first();
    
    if (existing) {
      return db.daily_reports.update(existing.id, { ...data, year, month, day, updatedAt: new Date().toISOString() });
    }
    return db.daily_reports.add({ ...data, year, month, day, createdAt: new Date().toISOString() });
  }

  async function getDailyReport(year, month, day) {
    return db.daily_reports
      .filter(r => r.year === year && r.month === month && r.day === day)
      .first();
  }

  async function getMonthlyReports(year, month) {
    return db.daily_reports
      .filter(r => r.year === year && r.month === month)
      .toArray();
  }

  async function getAllDailyReports() {
    return db.daily_reports.orderBy('createdAt').reverse().toArray();
  }

  async function getRecentReports(limit = 7) {
    return db.daily_reports.orderBy('createdAt').reverse().limit(limit).toArray();
  }

  // ---- Settings ----
  async function setSetting(key, value) {
    return db.settings.put({ key, value });
  }

  async function getSetting(key) {
    const row = await db.settings.get(key);
    return row ? row.value : null;
  }

  // ---- Streak Tracking ----
  async function recordEntry(date) {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    const existing = await db.streaks.filter(s => s.date === dateStr).first();
    if (!existing) {
      return db.streaks.add({ type: 'daily', date: dateStr });
    }
  }

  async function getStreak() {
    const entries = await db.streaks.orderBy('date').reverse().toArray();
    if (entries.length === 0) return { current: 0, longest: 0, total: entries.length };

    let current = 0;
    let longest = 0;
    let tempStreak = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if today or yesterday has an entry
    const todayStr = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const hasToday = entries.some(e => e.date === todayStr);
    const hasYesterday = entries.some(e => e.date === yesterdayStr);

    if (!hasToday && !hasYesterday) {
      current = 0;
    } else {
      // Count current streak
      const startDate = hasToday ? today : yesterday;
      current = 1;
      let checkDate = new Date(startDate);
      
      for (let i = 1; i < 365; i++) {
        checkDate.setDate(checkDate.getDate() - 1);
        const checkStr = checkDate.toISOString().split('T')[0];
        if (entries.some(e => e.date === checkStr)) {
          current++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    const sortedDates = entries.map(e => e.date).sort();
    longest = 1;
    tempStreak = 1;
    
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        tempStreak++;
        longest = Math.max(longest, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    return { current, longest, total: entries.length };
  }

  // ---- Data Export / Import ----
  async function exportAllData() {
    const data = {
      yearly_plans: await db.yearly_plans.toArray(),
      monthly_plans: await db.monthly_plans.toArray(),
      daily_reports: await db.daily_reports.toArray(),
      settings: await db.settings.toArray(),
      streaks: await db.streaks.toArray(),
      exportedAt: new Date().toISOString(),
      version: 1,
    };
    return data;
  }

  async function importData(data) {
    if (!data || !data.version) throw new Error('Invalid backup file');
    
    await db.transaction('rw', 
      db.yearly_plans, db.monthly_plans, db.daily_reports, db.settings, db.streaks, 
      async () => {
        if (data.yearly_plans) {
          await db.yearly_plans.clear();
          await db.yearly_plans.bulkAdd(data.yearly_plans.map(d => { delete d.id; return d; }));
        }
        if (data.monthly_plans) {
          await db.monthly_plans.clear();
          await db.monthly_plans.bulkAdd(data.monthly_plans.map(d => { delete d.id; return d; }));
        }
        if (data.daily_reports) {
          await db.daily_reports.clear();
          await db.daily_reports.bulkAdd(data.daily_reports.map(d => { delete d.id; return d; }));
        }
        if (data.settings) {
          await db.settings.clear();
          await db.settings.bulkAdd(data.settings);
        }
        if (data.streaks) {
          await db.streaks.clear();
          await db.streaks.bulkAdd(data.streaks.map(d => { delete d.id; return d; }));
        }
      }
    );
  }

  async function clearAllData() {
    await db.yearly_plans.clear();
    await db.monthly_plans.clear();
    await db.daily_reports.clear();
    await db.streaks.clear();
    // Keep settings
  }

  // ---- Analytics Helpers ----
  async function getDayCompletionRate(year, month, day) {
    const report = await getDailyReport(year, month, day);
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
          const score = Math.max(0, 1 - mins / 120); // 0 mins = 100% score, >= 120 mins = 0% score
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

  return {
    init,
    saveYearlyPlan, getYearlyPlan, getAllYearlyPlans,
    saveMonthlyPlan, getMonthlyPlan, markMonthlySubmitted, getAllMonthlyPlans,
    saveDailyReport, getDailyReport, getMonthlyReports, getAllDailyReports, getRecentReports,
    setSetting, getSetting,
    recordEntry, getStreak,
    exportAllData, importData, clearAllData,
    getDayCompletionRate,
  };
})();
