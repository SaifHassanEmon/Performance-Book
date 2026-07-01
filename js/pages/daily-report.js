/* ============================================================
   Daily Report Page
   Interactive daily tracking grid (horizontally scrollable)
   ============================================================ */

Router.register('daily-report', async function (container) {
  const now = new Date();
  let currentMonth = now.getMonth() + 1; // 1-12
  let currentYear = now.getFullYear();

  const modifiedDays = new Set();

  function markModified(day) {
    modifiedDays.add(day);
    const saveBtn = container.querySelector('#dr-save-changes-btn');
    if (saveBtn) {
      saveBtn.style.display = 'block';
    }
    Router.registerBeforeNavigate(handleBeforeNavigate);
    window.addEventListener('beforeunload', handleBeforeUnload);
    updateTotals();
  }

  function handleBeforeNavigate(targetPage) {
    if (modifiedDays.size > 0) {
      showUnsavedDialog(() => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        Router.navigate(targetPage, { force: true });
      });
      return false;
    }
    window.removeEventListener('beforeunload', handleBeforeUnload);
    return true;
  }

  function handleBeforeUnload(e) {
    if (modifiedDays.size > 0) {
      e.preventDefault();
      e.returnValue = '';
    }
  }

  async function saveAllChanges() {
    const promises = [];
    const modifiedDaysList = Array.from(modifiedDays);
    modifiedDays.forEach(day => {
      promises.push(saveDay(day));
    });
    await Promise.all(promises);
    modifiedDays.clear();
    const saveBtn = container.querySelector('#dr-save-changes-btn');
    if (saveBtn) {
      saveBtn.style.display = 'none';
    }
    App.showToast(I18n.t('daily.saved'), 'success');

    // Auto-sync daily reports to Firestore in the background
    if (typeof FirebaseAvailable !== 'undefined' && FirebaseAvailable) {
      const savedReports = [];
      for (const day of modifiedDaysList) {
        const report = await DB.getDailyReport(currentYear, currentMonth, day);
        if (report) savedReports.push(report);
      }
      if (savedReports.length > 0) {
        Sync.uploadDailyReports(savedReports).catch(err => {
          console.warn("Background daily reports upload failed:", err);
        });
      }
    }
  }

  function showUnsavedDialog(proceedCallback) {
    const overlay = document.createElement('div');
    overlay.className = 'salat-modal-overlay active';
    overlay.style.zIndex = '9999';
    overlay.innerHTML = `
      <div class="salat-modal-card" style="max-width: 400px; text-align: center; padding: var(--space-xl);">
        <div style="font-size: 3rem; margin-bottom: var(--space-md);">💾</div>
        <h3 style="font-weight: 700; font-size: 1.2rem; margin-bottom: var(--space-sm); color: var(--text-primary);" data-i18n="daily.unsavedTitle">${I18n.t('daily.unsavedTitle')}</h3>
        <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: var(--space-lg); line-height: 1.5;" data-i18n="daily.unsavedMessage">${I18n.t('daily.unsavedMessage')}</p>
        
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <button type="button" id="unsaved-save-btn" class="btn btn-success" style="width: 100%; padding: 10px; font-weight: 600;" data-i18n="daily.save">${I18n.t('daily.save')}</button>
          <button type="button" id="unsaved-discard-btn" class="btn" style="width: 100%; padding: 10px; border: 1px solid var(--border-color); background: transparent; color: var(--text-secondary); font-weight: 600;" data-i18n="daily.discard">${I18n.t('daily.discard')}</button>
          <button type="button" id="unsaved-cancel-btn" class="btn" style="width: 100%; padding: 10px; background: rgba(0,0,0,0.05); color: var(--text-muted); border: none;" data-i18n="daily.cancel">${I18n.t('daily.cancel')}</button>
        </div>
      </div>
    `;
    container.appendChild(overlay);
    
    // Save button click
    overlay.querySelector('#unsaved-save-btn').addEventListener('click', async () => {
      await saveAllChanges();
      overlay.remove();
      Router.clearBeforeNavigate();
      proceedCallback();
    });
    
    // Discard button click
    overlay.querySelector('#unsaved-discard-btn').addEventListener('click', () => {
      modifiedDays.clear();
      overlay.remove();
      Router.clearBeforeNavigate();
      proceedCallback();
    });
    
    // Cancel button click
    overlay.querySelector('#unsaved-cancel-btn').addEventListener('click', () => {
      overlay.remove();
    });
  }

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  function renderDurationPicker(day, field, value, isFuture) {
    let hr = 0;
    let min = 0;
    if (value && value.includes(':')) {
      const parts = value.split(':');
      hr = parseInt(parts[0], 10) || 0;
      min = parseInt(parts[1], 10) || 0;
    }
    
    let hrOptions = '';
    for (let h = 0; h <= 24; h++) {
      hrOptions += `<option value="${h}" ${h === hr ? 'selected' : ''} style="background-color: var(--bg-secondary); color: var(--text-primary);">${h}</option>`;
    }
    
    let minOptions = '';
    for (let m = 0; m <= 59; m++) {
      const mStr = String(m).padStart(2, '0');
      minOptions += `<option value="${m}" ${m === min ? 'selected' : ''} style="background-color: var(--bg-secondary); color: var(--text-primary);">${mStr}</option>`;
    }
    
    return `
      <div class="duration-picker-container">
        <select class="duration-select hr-select" ${isFuture ? 'disabled' : ''}>
          ${hrOptions}
        </select>
        <span class="duration-separator">:</span>
        <select class="duration-select min-select" ${isFuture ? 'disabled' : ''}>
          ${minOptions}
        </select>
        <input type="hidden" data-day="${day}" data-field="${field}" value="${value || ''}">
      </div>
    `;
  }

  async function renderPage() {
    // Lock viewport size and prevent body scrolling on the daily report grid page
    container.style.height = 'calc(100dvh - 128px)';
    container.style.overflow = 'hidden';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';

    const daysInMonth = App.getDaysInMonth(currentYear, currentMonth);
    const reports = await DB.getMonthlyReports(currentYear, currentMonth);
    
    // Map reports by day for fast lookup
    const reportsMap = {};
    reports.forEach(r => {
      reportsMap[r.day] = r;
    });

    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth() + 1;
    const todayDay = now.getDate();
    const isCurrentMonth = (currentYear === todayYear && currentMonth === todayMonth);

    // Build the grid header and body HTML
    let tableBodyHtml = '';
    for (let day = 1; day <= 31; day++) {
      const isToday = isCurrentMonth && (day === todayDay);
      const isHidden = day > daysInMonth;
      const isFuture = (currentYear > todayYear) || 
                       (currentYear === todayYear && currentMonth > todayMonth) || 
                       (currentYear === todayYear && currentMonth === todayMonth && day > todayDay);
      const report = reportsMap[day] || {};

      tableBodyHtml += `
        <tr data-day-row="${day}" style="${isHidden ? 'display:none;' : ''} ${isFuture ? 'opacity: 0.4; pointer-events: none;' : ''}">
          <td class="date-col" style="${isToday ? 'border-left: 3px solid var(--color-success); font-weight: 800;' : ''}">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
              <span>${String(day).padStart(2, '0')}</span>
              ${day > 1 && !isFuture ? `<button class="quick-fill-btn" data-day="${day}" title="${I18n.t('daily.quickFill')}" style="cursor: pointer; border: none; background: none; font-size: 0.75rem; padding: 2px; line-height: 1; color: var(--color-warning);">⚡</button>` : ''}
            </div>
          </td>
          <td><input type="number" class="grid-input grid-num" min="0" inputmode="numeric" data-day="${day}" data-field="quranS" value="${report.quranS || ''}" ${isFuture ? 'disabled' : ''}></td>
          <td><input type="number" class="grid-input grid-num" min="0" inputmode="numeric" data-day="${day}" data-field="quranT" value="${report.quranT || ''}" ${isFuture ? 'disabled' : ''}></td>
          <td><input type="number" class="grid-input grid-num" min="0" inputmode="numeric" data-day="${day}" data-field="hadithNum" value="${report.hadithNum || ''}" ${isFuture ? 'disabled' : ''}></td>
          <td><input type="number" class="grid-input grid-num" min="0" inputmode="numeric" data-day="${day}" data-field="litI" value="${report.litI || ''}" ${isFuture ? 'disabled' : ''}></td>
          <td><input type="number" class="grid-input grid-num" min="0" inputmode="numeric" data-day="${day}" data-field="litG" value="${report.litG || ''}" ${isFuture ? 'disabled' : ''}></td>
          <td>${renderDurationPicker(day, 'academic', report.academic, isFuture)}</td>
          <td><input type="number" class="grid-input grid-num" min="0" inputmode="numeric" data-day="${day}" data-field="classT" value="${report.classT || ''}" ${isFuture ? 'disabled' : ''}></td>
          <td><input type="number" class="grid-input grid-num" min="0" inputmode="numeric" data-day="${day}" data-field="classA" value="${report.classA || ''}" ${isFuture ? 'disabled' : ''}></td>
          <td class="salat-col">
            <button type="button" class="grid-salat-btn" data-day="${day}" ${isFuture ? 'disabled style="opacity: 0.5; pointer-events: none;"' : ''}>
              ${report.salatJamat !== undefined || report.salatKaja !== undefined ? `${report.salatJamat || 0}-${report.salatKaja || 0}` : ''}
            </button>
            <input type="hidden" data-day="${day}" data-field="salatJamat" value="${report.salatJamat !== undefined ? report.salatJamat : ''}">
            <input type="hidden" data-day="${day}" data-field="salatKaja" value="${report.salatKaja !== undefined ? report.salatKaja : ''}">
            <input type="hidden" data-day="${day}" data-field="salatDetails" value="${encodeURIComponent(JSON.stringify(report.salatDetails || {}))}">
          </td>
          <td><input type="number" class="grid-input grid-num" min="0" inputmode="numeric" data-day="${day}" data-field="contactM" value="${report.contactM || ''}" ${isFuture ? 'disabled' : ''}></td>
          <td><input type="number" class="grid-input grid-num" min="0" inputmode="numeric" data-day="${day}" data-field="contactA" value="${report.contactA || ''}" ${isFuture ? 'disabled' : ''}></td>
          <td><input type="number" class="grid-input grid-num" min="0" inputmode="numeric" data-day="${day}" data-field="contactW" value="${report.contactW || ''}" ${isFuture ? 'disabled' : ''}></td>
          <td><input type="number" class="grid-input grid-num" min="0" inputmode="numeric" data-day="${day}" data-field="contactS" value="${report.contactS || ''}" ${isFuture ? 'disabled' : ''}></td>
          <td><input type="number" class="grid-input grid-num" min="0" inputmode="numeric" data-day="${day}" data-field="contactF" value="${report.contactF || ''}" ${isFuture ? 'disabled' : ''}></td>
          <td><input type="number" class="grid-input grid-num" min="0" inputmode="numeric" data-day="${day}" data-field="contactMS" value="${report.contactMS || ''}" ${isFuture ? 'disabled' : ''}></td>
          <td><input type="number" class="grid-input grid-num" min="0" inputmode="numeric" data-day="${day}" data-field="contactWW" value="${report.contactWW || ''}" ${isFuture ? 'disabled' : ''}></td>
          <td><input type="number" class="grid-input grid-num" min="0" inputmode="numeric" data-day="${day}" data-field="contactR" value="${report.contactR || ''}" ${isFuture ? 'disabled' : ''}></td>
          <td>${renderDurationPicker(day, 'dawah', report.dawah, isFuture)}</td>
          <td>${renderDurationPicker(day, 'orgWork', report.orgWork, isFuture)}</td>
          <td>${renderDurationPicker(day, 'sleeping', report.sleeping, isFuture)}</td>
          <td>${renderDurationPicker(day, 'socialMedia', report.socialMedia, isFuture)}</td>
          <td><input type="checkbox" class="grid-checkbox" data-day="${day}" data-field="newsReading" ${report.newsReading ? 'checked' : ''} ${isFuture ? 'disabled' : ''}></td>
          <td><input type="checkbox" class="grid-checkbox" data-day="${day}" data-field="exercise" ${report.exercise ? 'checked' : ''} ${isFuture ? 'disabled' : ''}></td>
          <td><input type="checkbox" class="grid-checkbox" data-day="${day}" data-field="selfEval" ${report.selfEval ? 'checked' : ''} ${isFuture ? 'disabled' : ''}></td>
        </tr>
      `;
    }

    container.innerHTML = `
      <!-- Month Selector Wrapper -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg); gap: var(--space-md); flex-wrap: wrap;">
        <div class="month-selector" style="margin-bottom: 0; flex: 1; justify-content: flex-start;">
          <button id="dr-prev-month" class="month-selector-btn" aria-label="Previous month">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <span id="dr-month-label" class="month-selector-label">${monthNames[currentMonth - 1]} ${currentYear}</span>
          <button id="dr-next-month" class="month-selector-btn" aria-label="Next month">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
        <div style="display: flex; gap: var(--space-sm);">
          <button id="dr-save-changes-btn" class="btn btn-success" style="padding: 8px 16px; font-size: 0.85rem; border-radius: 6px; display: none; font-weight: 600; cursor: pointer; border: none; background-color: var(--color-success); color: white;" data-i18n="daily.saveChanges">${I18n.t('daily.saveChanges')}</button>
          <button id="dr-view-report-btn" class="btn btn-secondary" style="padding: 8px 16px; font-size: 0.85rem; border-radius: 6px; font-weight: 600; cursor: pointer; border: 1px solid var(--border-color); background-color: rgba(255,255,255,0.03); color: var(--text-primary);">View Report</button>
          <button id="dr-submit-btn" class="btn btn-primary" style="padding: 8px 16px; font-size: 0.85rem; border-radius: 6px; font-weight: 600; cursor: pointer; border: none; background-color: var(--color-primary); color: white;" data-i18n="daily.submit">${I18n.t('daily.submit')}</button>
        </div>
      </div>

      <!-- Scrollable Grid Wrapper -->
      <div class="report-grid-wrapper" style="flex: 1; overflow: auto; margin-bottom: var(--space-lg);">
        <table class="report-grid">
          <thead>
            <!-- Main category header -->
            <tr>
              <th rowspan="2" class="date-col" data-i18n="daily.date">${I18n.t('daily.date')}</th>
              <th colspan="2" data-i18n="daily.holyQuran">${I18n.t('daily.holyQuran')}</th>
              <th rowspan="2" data-i18n="daily.holyHadith">${I18n.t('daily.holyHadith')}</th>
              <th colspan="2" data-i18n="daily.litStudy">${I18n.t('daily.litStudy')}</th>
              <th rowspan="2" data-i18n="daily.academicStudy">${I18n.t('daily.academicStudy')}</th>
              <th colspan="2" data-i18n="daily.class">${I18n.t('daily.class')}</th>
              <th rowspan="2" data-i18n="daily.salat">${I18n.t('daily.salat')}</th>
              <th colspan="4" data-i18n="daily.contact1">${I18n.t('daily.contact1')} 1</th>
              <th colspan="4" data-i18n="daily.contact2">${I18n.t('daily.contact2')} 2</th>
              <th rowspan="2" data-i18n="daily.dawahWork">${I18n.t('daily.dawahWork')}</th>
              <th rowspan="2" data-i18n="daily.orgWork">${I18n.t('daily.orgWork')}</th>
              <th rowspan="2" data-i18n="daily.sleepingHours">${I18n.t('daily.sleepingHours')}</th>
              <th rowspan="2" data-i18n="daily.socialMedia">${I18n.t('daily.socialMedia')}</th>
              <th rowspan="2" data-i18n="daily.newsReading">${I18n.t('daily.newsReading')}</th>
              <th rowspan="2" data-i18n="daily.physicalExercise">${I18n.t('daily.physicalExercise')}</th>
              <th rowspan="2" data-i18n="daily.selfEvaluation">${I18n.t('daily.selfEvaluation')}</th>
            </tr>
            <!-- Sub header columns -->
            <tr>
              <th class="sub-header" data-i18n="daily.studyTafsir">${I18n.t('daily.studyTafsir')}</th>
              <th class="sub-header" data-i18n="daily.onlyTelawat">${I18n.t('daily.onlyTelawat')}</th>
              <th class="sub-header" data-i18n="daily.islamicLit">${I18n.t('daily.islamicLit')}</th>
              <th class="sub-header" data-i18n="daily.generalLit">${I18n.t('daily.generalLit')}</th>
              <th class="sub-header" data-i18n="daily.totalClass">${I18n.t('daily.totalClass')}</th>
              <th class="sub-header" data-i18n="daily.attended">${I18n.t('daily.attended')}</th>
              <th class="sub-header" data-i18n="daily.contactM">${I18n.t('daily.contactM')}</th>
              <th class="sub-header" data-i18n="daily.contactA">${I18n.t('daily.contactA')}</th>
              <th class="sub-header" data-i18n="daily.contactW">${I18n.t('daily.contactW')}</th>
              <th class="sub-header" data-i18n="daily.contactS">${I18n.t('daily.contactS')}</th>
              <th class="sub-header" data-i18n="daily.contactF">${I18n.t('daily.contactF')}</th>
              <th class="sub-header" data-i18n="daily.contactMS">${I18n.t('daily.contactMS')}</th>
              <th class="sub-header" data-i18n="daily.contactWW">${I18n.t('daily.contactWW')}</th>
              <th class="sub-header" data-i18n="daily.contactR">${I18n.t('daily.contactR')}</th>
            </tr>
          </thead>
          <tbody>
            ${tableBodyHtml}
            <!-- Totals row -->
            <tr class="totals-row">
              <td class="date-col" data-i18n="daily.total">${I18n.t('daily.total')}</td>
              <td id="total-quranS">0</td>
              <td id="total-quranT">0</td>
              <td id="total-hadithNum">0</td>
              <td id="total-litI">0</td>
              <td id="total-litG">0</td>
              <td id="total-academic">00:00</td>
              <td id="total-classT">0</td>
              <td id="total-classA">0</td>
              <td id="total-salat">0-0</td>
              <td id="total-contactM">0</td>
              <td id="total-contactA">0</td>
              <td id="total-contactW">0</td>
              <td id="total-contactS">0</td>
              <td id="total-contactF">0</td>
              <td id="total-contactMS">0</td>
              <td id="total-contactWW">0</td>
              <td id="total-contactR">0</td>
              <td id="total-dawah">00:00</td>
              <td id="total-orgWork">00:00</td>
              <td id="total-sleeping">00:00</td>
              <td id="total-socialMedia">00:00</td>
              <td id="total-newsReading">0</td>
              <td id="total-exercise">0</td>
              <td id="total-selfEval">0</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

    wireEvents();
    updateTotals();
    I18n.applyLanguage();

    // Scroll to today's row on load if current month
    if (isCurrentMonth) {
      setTimeout(() => {
        const todayRow = container.querySelector(`tr[data-day-row="${todayDay}"]`);
        if (todayRow) {
          todayRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }

  function wireEvents() {
    // Save changes button click
    const saveChangesBtn = container.querySelector('#dr-save-changes-btn');
    if (saveChangesBtn) {
      saveChangesBtn.addEventListener('click', async () => {
        await saveAllChanges();
        Router.clearBeforeNavigate();
      });
    }

    // View report button click
    const viewReportBtn = container.querySelector('#dr-view-report-btn');
    if (viewReportBtn) {
      viewReportBtn.addEventListener('click', () => {
        showReportModal();
      });
    }

    // Submit button click
    const submitBtn = container.querySelector('#dr-submit-btn');
    if (submitBtn) {
      submitBtn.addEventListener('click', async () => {
        if (modifiedDays.size > 0) {
          App.showToast("Please save your changes first!", "error");
          return;
        }
        
        submitBtn.disabled = true;
        const originalText = submitBtn.textContent;
        submitBtn.textContent = "Submitting...";
        
        try {
          await Sync.submitDailyReports(currentYear, currentMonth);
          App.showToast("Daily reports submitted successfully!", "success");
        } catch (err) {
          console.error(err);
          App.showToast(err.message || "Submission failed!", "error");
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      });
    }

    // Month selector navigation
    const prevBtn = container.querySelector('#dr-prev-month');
    const nextBtn = container.querySelector('#dr-next-month');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const action = () => {
          currentMonth--;
          if (currentMonth < 1) {
            currentMonth = 12;
            currentYear--;
          }
          modifiedDays.clear();
          Router.clearBeforeNavigate();
          renderPage();
        };
        if (modifiedDays.size > 0) {
          showUnsavedDialog(action);
        } else {
          action();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const action = () => {
          currentMonth++;
          if (currentMonth > 12) {
            currentMonth = 1;
            currentYear++;
          }
          modifiedDays.clear();
          Router.clearBeforeNavigate();
          renderPage();
        };
        if (modifiedDays.size > 0) {
          showUnsavedDialog(action);
        } else {
          action();
        }
      });
    }

    // Event delegation for inputs and checkboxes (extremely performant)
    const table = container.querySelector('.report-grid');
    if (table) {
      table.addEventListener('change', async (e) => {
        const target = e.target;
        if (target.classList.contains('duration-select')) {
          const pickerContainer = target.closest('.duration-picker-container');
          if (pickerContainer) {
            const hrSelect = pickerContainer.querySelector('.hr-select');
            const minSelect = pickerContainer.querySelector('.min-select');
            const hiddenInput = pickerContainer.querySelector('input[type="hidden"]');
            
            const hr = String(hrSelect.value).padStart(2, '0');
            const min = String(minSelect.value).padStart(2, '0');
            hiddenInput.value = `${hr}:${min}`;
            
            const day = parseInt(hiddenInput.getAttribute('data-day'), 10);
            if (day) {
              markModified(day);
            }
          }
        } else if (target.classList.contains('grid-input') || target.classList.contains('grid-checkbox')) {
          const day = parseInt(target.getAttribute('data-day'), 10);
          const field = target.getAttribute('data-field');
          if (day && field) {
            markModified(day);
          }
        }
      });
      table.addEventListener('blur', async (e) => {
        const target = e.target;
        if (target.classList.contains('grid-input') && target.type !== 'checkbox') {
          const day = parseInt(target.getAttribute('data-day'), 10);
          const field = target.getAttribute('data-field');
          if (day && field) {
            markModified(day);
          }
        }
      }, true); // Use capturing phase to catch blur events on inputs

      table.addEventListener('click', (e) => {
        const btn = e.target.closest('.grid-salat-btn');
        if (btn) {
          const day = parseInt(btn.getAttribute('data-day'), 10);
          if (day) {
            openSalatModal(day);
          }
        }
      });
    }

    // Quick fill handlers
    container.querySelectorAll('.quick-fill-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const day = parseInt(btn.getAttribute('data-day'), 10);
        if (day > 1) {
          await quickFill(day);
        }
      });
    });
  }

  function gatherDayData(day) {
    const row = container.querySelector(`tr[data-day-row="${day}"]`);
    if (!row) return {};
    const data = {};
    const inputs = row.querySelectorAll('[data-field]');
    inputs.forEach(input => {
      const fieldName = input.getAttribute('data-field');
      if (input.type === 'checkbox') {
        data[fieldName] = input.checked;
      } else {
        if (fieldName === 'salatDetails') {
          try {
            data[fieldName] = JSON.parse(decodeURIComponent(input.value || '{}'));
          } catch(e) {
            data[fieldName] = {};
          }
        } else if (fieldName === 'salatJamat' || fieldName === 'salatKaja') {
          data[fieldName] = input.value === '' ? '' : parseInt(input.value, 10);
        } else {
          data[fieldName] = input.value;
        }
      }
    });
    return data;
  }

  function openSalatModal(day) {
    const row = container.querySelector(`tr[data-day-row="${day}"]`);
    if (!row) return;

    const detailsInput = row.querySelector('[data-field="salatDetails"]');
    let details = {};
    if (detailsInput && detailsInput.value) {
      try {
        details = JSON.parse(decodeURIComponent(detailsInput.value));
      } catch (e) {
        details = {};
      }
    }

    const overlay = document.createElement('div');
    overlay.className = 'salat-modal-overlay';
    overlay.innerHTML = `
      <div class="salat-modal-card">
        <div class="salat-modal-header">
          <h3 class="salat-modal-title">${I18n.t('salat.popupTitle')} ${String(day).padStart(2, '0')}</h3>
          <button type="button" class="salat-modal-close-btn" aria-label="Close modal">&times;</button>
        </div>
        <div class="salat-wakto-list">
          ${['fajr', 'zuhr', 'asr', 'maghrib', 'isha'].map(w => {
            const currentVal = details[w] || '';
            return `
              <div class="salat-wakto-row" data-wakto="${w}">
                <div class="salat-wakto-label">
                  <span>${I18n.t('salat.' + w)}</span>
                </div>
                <div class="salat-pill-group">
                  <button type="button" class="salat-pill-btn ${currentVal === 'jamat' ? 'selected' : ''}" data-val="jamat">${I18n.t('salat.jamat')}</button>
                  <button type="button" class="salat-pill-btn ${currentVal === 'alone' ? 'selected' : ''}" data-val="alone">${I18n.t('salat.alone')}</button>
                  <button type="button" class="salat-pill-btn ${currentVal === 'kaja' ? 'selected' : ''}" data-val="kaja">${I18n.t('salat.kaja')}</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
        <div class="salat-modal-footer">
          <button type="button" class="salat-modal-cancel-btn" data-i18n="common.cancel">${I18n.t('common.cancel')}</button>
          <button type="button" class="salat-modal-save-btn" data-i18n="salat.save">${I18n.t('salat.save')}</button>
        </div>
      </div>
    `;

    container.appendChild(overlay);

    // Trigger reflow & animate in
    overlay.offsetHeight;
    overlay.classList.add('active');

    const closeModal = () => {
      overlay.classList.remove('active');
      setTimeout(() => {
        overlay.remove();
      }, 250);
    };

    // Close handlers
    overlay.querySelector('.salat-modal-close-btn').addEventListener('click', closeModal);
    overlay.querySelector('.salat-modal-cancel-btn').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    // Pill selection logic
    const waktoRows = overlay.querySelectorAll('.salat-wakto-row');
    waktoRows.forEach(wRow => {
      const pills = wRow.querySelectorAll('.salat-pill-btn');
      pills.forEach(pill => {
        pill.addEventListener('click', () => {
          const wasSelected = pill.classList.contains('selected');
          pills.forEach(p => p.classList.remove('selected'));
          if (!wasSelected) {
            pill.classList.add('selected');
          }
        });
      });
    });

    // Save handler
    overlay.querySelector('.salat-modal-save-btn').addEventListener('click', async () => {
      const newDetails = {};
      let jamatCount = 0;
      let kajaCount = 0;

      waktoRows.forEach(wRow => {
        const w = wRow.getAttribute('data-wakto');
        const selectedPill = wRow.querySelector('.salat-pill-btn.selected');
        if (selectedPill) {
          const val = selectedPill.getAttribute('data-val');
          newDetails[w] = val;
          if (val === 'jamat') jamatCount++;
          if (val === 'kaja') kajaCount++;
        }
      });

      // Update hidden inputs
      const jamatInput = row.querySelector('[data-field="salatJamat"]');
      const kajaInput = row.querySelector('[data-field="salatKaja"]');
      const detailsInput = row.querySelector('[data-field="salatDetails"]');

      if (jamatInput) jamatInput.value = jamatCount;
      if (kajaInput) kajaInput.value = kajaCount;
      if (detailsInput) detailsInput.value = encodeURIComponent(JSON.stringify(newDetails));

      // Update button text
      const btn = row.querySelector('.grid-salat-btn');
      if (btn) {
        btn.textContent = `${jamatCount}-${kajaCount}`;
      }

      markModified(day);
      closeModal();
    });
  }

  async function saveDay(day) {
    const data = gatherDayData(day);
    await DB.saveDailyReport(currentYear, currentMonth, day, data);
    
    // Format date string for streak recording: YYYY-MM-DD
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    await DB.recordEntry(dateStr);
    
    updateTotals();
  }

  async function quickFill(day) {
    const prevData = gatherDayData(day - 1);
    const row = container.querySelector(`tr[data-day-row="${day}"]`);
    if (!row) return;

    const inputs = row.querySelectorAll('[data-field]');
    inputs.forEach(input => {
      const fieldName = input.getAttribute('data-field');
      if (fieldName) {
        if (input.type === 'checkbox') {
          input.checked = !!prevData[fieldName];
        } else if (fieldName === 'salatDetails') {
          input.value = encodeURIComponent(JSON.stringify(prevData[fieldName] || {}));
        } else {
          input.value = prevData[fieldName] !== undefined ? prevData[fieldName] : '';
          
          // If this is a duration picker, update the visible select elements to match the new value
          const pickerContainer = input.closest('.duration-picker-container');
          if (pickerContainer) {
            let hr = 0;
            let min = 0;
            if (input.value && input.value.includes(':')) {
              const parts = input.value.split(':');
              hr = parseInt(parts[0], 10) || 0;
              min = parseInt(parts[1], 10) || 0;
            }
            pickerContainer.querySelector('.hr-select').value = hr;
            pickerContainer.querySelector('.min-select').value = min;
          }
        }
      }
    });

    // Update the button text
    const btn = row.querySelector('.grid-salat-btn');
    if (btn) {
      const jamat = prevData['salatJamat'] !== undefined ? prevData['salatJamat'] : 0;
      const kaja = prevData['salatKaja'] !== undefined ? prevData['salatKaja'] : 0;
      btn.textContent = (prevData['salatJamat'] !== undefined || prevData['salatKaja'] !== undefined) ? `${jamat}-${kaja}` : '';
    }

    markModified(day);
  }

  function updateTotals() {
    const daysInMonth = App.getDaysInMonth(currentYear, currentMonth);
    
    // Initial totals structures
    const numFields = ['quranS', 'quranT', 'hadithNum', 'litI', 'litG', 'classT', 'classA', 'salatJamat', 'salatKaja',
                       'contactM', 'contactA', 'contactW', 'contactS', 'contactF', 'contactMS', 'contactWW', 'contactR'];
    const timeFields = ['academic', 'dawah', 'orgWork', 'sleeping', 'socialMedia'];
    const checkFields = ['newsReading', 'exercise', 'selfEval'];

    const totals = {};
    numFields.forEach(f => totals[f] = 0);
    timeFields.forEach(f => totals[f] = 0); // stored as minutes
    checkFields.forEach(f => totals[f] = 0);

    // Accumulate values
    for (let day = 1; day <= daysInMonth; day++) {
      const row = container.querySelector(`tr[data-day-row="${day}"]`);
      if (!row) continue;

      numFields.forEach(f => {
        const input = row.querySelector(`[data-field="${f}"]`);
        if (input) {
          totals[f] += parseInt(input.value, 10) || 0;
        }
      });

      timeFields.forEach(f => {
        const input = row.querySelector(`[data-field="${f}"]`);
        if (input && input.value) {
          totals[f] += App.timeToMinutes(input.value);
        }
      });

      checkFields.forEach(f => {
        const input = row.querySelector(`[data-field="${f}"]`);
        if (input && input.checked) {
          totals[f]++;
        }
      });
    }

    // Write totals to DOM
    numFields.forEach(f => {
      if (f === 'salatJamat' || f === 'salatKaja') return; // Skip writing individually
      const el = container.querySelector(`#total-${f}`);
      if (el) el.textContent = totals[f];
    });

    const totalSalatEl = container.querySelector('#total-salat');
    if (totalSalatEl) {
      totalSalatEl.textContent = `${totals['salatJamat']}-${totals['salatKaja']}`;
    }

    timeFields.forEach(f => {
      const el = container.querySelector(`#total-${f}`);
      if (el) el.textContent = App.minutesToTime(totals[f]);
    });

    checkFields.forEach(f => {
      const el = container.querySelector(`#total-${f}`);
      if (el) el.textContent = totals[f];
    });
  }

  function calculateCurrentSummary() {
    const daysInMonth = App.getDaysInMonth(currentYear, currentMonth);
    
    let mqStudyTotalDays = 0;
    let mqStudyAvgSum = 0;
    let mqTelawatTotalDays = 0;
    let mqTelawatAvgSum = 0;
    
    let mhTotalDays = 0;
    let mhAvgSum = 0;
    
    let mlTotalPages = 0;
    let mlIslamic = 0;
    let mlOthers = 0;
    
    let maTotalDays = 0;
    let maTotalMinutes = 0;
    
    let mcMember = 0;
    let mcAssociate = 0;
    let mcWorker = 0;
    let mcSupporter = 0;
    let mcFriends = 0;
    let mcWellWisher = 0;
    let mcMeritorious = 0;
    let mcReader = 0;
    
    let mdDay = 0;
    let mdTotalMinutes = 0;
    
    let moTotalDays = 0;
    let moTotalMinutes = 0;
    
    let msDays = 0;
    let msTotalMinutes = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const row = container.querySelector(`tr[data-day-row="${day}"]`);
      if (!row) continue;

      // Quran
      const qsInput = row.querySelector('[data-field="quranS"]');
      const qtInput = row.querySelector('[data-field="quranT"]');
      const qs = qsInput ? parseInt(qsInput.value, 10) || 0 : 0;
      const qt = qtInput ? parseInt(qtInput.value, 10) || 0 : 0;
      if (qs > 0) {
        mqStudyTotalDays++;
        mqStudyAvgSum += qs;
      }
      if (qt > 0) {
        mqTelawatTotalDays++;
        mqTelawatAvgSum += qt;
      }

      // Hadith
      const hnInput = row.querySelector('[data-field="hadithNum"]');
      const hn = hnInput ? parseInt(hnInput.value, 10) || 0 : 0;
      if (hn > 0) {
        mhTotalDays++;
        mhAvgSum += hn;
      }

      // Literature
      const liInput = row.querySelector('[data-field="litI"]');
      const lgInput = row.querySelector('[data-field="litG"]');
      const li = liInput ? parseInt(liInput.value, 10) || 0 : 0;
      const lg = lgInput ? parseInt(lgInput.value, 10) || 0 : 0;
      mlIslamic += li;
      mlOthers += lg;
      mlTotalPages += (li + lg);

      // Academic
      const acadInput = row.querySelector('[data-field="academic"]');
      const acadMins = acadInput ? App.timeToMinutes(acadInput.value) : 0;
      if (acadMins > 0) {
        maTotalDays++;
        maTotalMinutes += acadMins;
      }

      // Contacts
      const cmInput = row.querySelector('[data-field="contactM"]');
      const caInput = row.querySelector('[data-field="contactA"]');
      const cwInput = row.querySelector('[data-field="contactW"]');
      const csInput = row.querySelector('[data-field="contactS"]');
      const cfInput = row.querySelector('[data-field="contactF"]');
      const cwwInput = row.querySelector('[data-field="contactWW"]');
      const cmsInput = row.querySelector('[data-field="contactMS"]');
      const crInput = row.querySelector('[data-field="contactR"]');

      mcMember += cmInput ? parseInt(cmInput.value, 10) || 0 : 0;
      mcAssociate += caInput ? parseInt(caInput.value, 10) || 0 : 0;
      mcWorker += cwInput ? parseInt(cwInput.value, 10) || 0 : 0;
      mcSupporter += csInput ? parseInt(csInput.value, 10) || 0 : 0;
      mcFriends += cfInput ? parseInt(cfInput.value, 10) || 0 : 0;
      mcWellWisher += cwwInput ? parseInt(cwwInput.value, 10) || 0 : 0;
      mcMeritorious += cmsInput ? parseInt(cmsInput.value, 10) || 0 : 0;
      mcReader += crInput ? parseInt(crInput.value, 10) || 0 : 0;

      // Dawah
      const dawahInput = row.querySelector('[data-field="dawah"]');
      const dawahMins = dawahInput ? App.timeToMinutes(dawahInput.value) : 0;
      if (dawahMins > 0) {
        mdDay++;
        mdTotalMinutes += dawahMins;
      }

      // Org Work
      const orgInput = row.querySelector('[data-field="orgWork"]');
      const orgMins = orgInput ? App.timeToMinutes(orgInput.value) : 0;
      if (orgMins > 0) {
        moTotalDays++;
        moTotalMinutes += orgMins;
      }

      // Sleeping
      const sleepInput = row.querySelector('[data-field="sleeping"]');
      const sleepMins = sleepInput ? App.timeToMinutes(sleepInput.value) : 0;
      if (sleepMins > 0) {
        msDays++;
        msTotalMinutes += sleepMins;
      }
    }

    const mqStudyAvgAyah = mqStudyTotalDays > 0 ? Math.round(mqStudyAvgSum / mqStudyTotalDays) : 0;
    const mqTelawatAvgAyah = mqTelawatTotalDays > 0 ? Math.round(mqTelawatAvgSum / mqTelawatTotalDays) : 0;
    const mhAvg = mhTotalDays > 0 ? Math.round(mhAvgSum / mhTotalDays) : 0;
    const maAvgHours = maTotalDays > 0 ? parseFloat((maTotalMinutes / maTotalDays / 60).toFixed(1)) : 0;
    const mdAvgHours = mdDay > 0 ? parseFloat((mdTotalMinutes / mdDay / 60).toFixed(1)) : 0;
    const moAvgHours = moTotalDays > 0 ? parseFloat((moTotalMinutes / moTotalDays / 60).toFixed(1)) : 0;
    const msAvgHours = msDays > 0 ? parseFloat((msTotalMinutes / msDays / 60).toFixed(1)) : 0;

    return {
      mqStudyTotalDays, mqStudyAvgAyah,
      mqTelawatTotalDays, mqTelawatAvgAyah,
      mhTotalDays, mhAvg,
      mlTotalPages, mlIslamic, mlOthers,
      maTotalDays, maAvgHours,
      mdDay, mdAvgHours,
      moTotalDays, moAvgHours,
      msAvgHours,
      mcMember, mcAssociate, mcWorker, mcSupporter,
      mcFriends, mcWellWisher, mcMeritorious, mcReader
    };
  }

  function showReportModal() {
    const summary = calculateCurrentSummary();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    function renderModalRow(label, val) {
      return `
        <div style="display:flex; justify-content:space-between; padding: 8px 0; border-bottom:1px solid var(--border-color); font-size:0.875rem;">
          <span style="color:var(--text-secondary); font-weight:500;">${label}</span>
          <span style="color:var(--text-primary); font-weight:600;">${val}</span>
        </div>
      `;
    }

    const overlay = document.createElement('div');
    overlay.className = 'salat-modal-overlay active';
    overlay.style.zIndex = '9999';
    overlay.innerHTML = `
      <div class="salat-modal-card" style="max-width: 450px; max-height: 80vh; overflow-y: auto; text-align: left; padding: var(--space-xl); display: flex; flex-direction: column; border-radius: 12px; background: rgba(17, 24, 39, 0.95); border: 1px solid var(--border-color); backdrop-filter: blur(10px);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-md); border-bottom: 1px solid var(--border-color); padding-bottom: var(--space-sm);">
          <div>
            <h3 style="font-weight: 800; font-size: 1.15rem; color: var(--text-primary);">Monthly Summary Report</h3>
            <p style="font-size: 0.75rem; color: var(--text-muted);">${monthNames[currentMonth - 1]} ${currentYear}</p>
          </div>
          <button type="button" id="summary-modal-close-btn" style="background: none; border: none; font-size: 1.5rem; color: var(--text-muted); cursor: pointer; padding: 4px; display: flex; align-items: center; justify-content: center;">&times;</button>
        </div>

        <div style="flex: 1; overflow-y: auto; margin-bottom: var(--space-lg); display: flex; flex-direction: column; gap: var(--space-md); padding-right: 4px;">
          <!-- Quran -->
          <div class="glass-card" style="padding: var(--space-md); background: rgba(255,255,255,0.01); border-radius: 8px;">
            <div style="font-weight: 700; font-size: 0.85rem; color: var(--color-primary); margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
              <span>📖</span> The Holy Quran
            </div>
            <div style="font-size: 0.75rem; color: var(--color-primary); font-weight: 700; margin-top: var(--space-xs); margin-bottom: 2px;">Study with Tafsir (তাফসীরসহ অধ্যয়ন)</div>
            ${renderModalRow('Total Days Studied', summary.mqStudyTotalDays)}
            ${renderModalRow('Average Ayah / Day', summary.mqStudyAvgAyah)}
            
            <div style="font-size: 0.75rem; color: var(--color-primary); font-weight: 700; margin-top: var(--space-md); margin-bottom: 2px;">Only Telawat (শুধুমাত্র তিলাওয়াত)</div>
            ${renderModalRow('Total Days Recited', summary.mqTelawatTotalDays)}
            ${renderModalRow('Average Ayah / Day', summary.mqTelawatAvgAyah)}
          </div>

          <!-- Hadith -->
          <div class="glass-card" style="padding: var(--space-md); background: rgba(255,255,255,0.01); border-radius: 8px;">
            <div style="font-weight: 700; font-size: 0.85rem; color: var(--color-primary); margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
              <span>📚</span> Hadith Study
            </div>
            ${renderModalRow('Total Days Hadith Study', summary.mhTotalDays)}
            ${renderModalRow('Daily Average Hadith', summary.mhAvg)}
          </div>

          <!-- Literature -->
          <div class="glass-card" style="padding: var(--space-md); background: rgba(255,255,255,0.01); border-radius: 8px;">
            <div style="font-weight: 700; font-size: 0.85rem; color: var(--color-primary); margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
              <span>📕</span> Reading Literature
            </div>
            ${renderModalRow('Islamic Literature (Pages)', summary.mlIslamic)}
            ${renderModalRow('General Literature (Pages)', summary.mlOthers)}
            ${renderModalRow('Total Pages Read', summary.mlTotalPages)}
          </div>

          <!-- Academic Study -->
          <div class="glass-card" style="padding: var(--space-md); background: rgba(255,255,255,0.01); border-radius: 8px;">
            <div style="font-weight: 700; font-size: 0.85rem; color: var(--color-primary); margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
              <span>🎓</span> Academic Study
            </div>
            ${renderModalRow('Total Days Studied', summary.maTotalDays)}
            ${renderModalRow('Daily Average Hours', `${summary.maAvgHours}h`)}
          </div>

          <!-- Dawah & Activities -->
          <div class="glass-card" style="padding: var(--space-md); background: rgba(255,255,255,0.01); border-radius: 8px;">
            <div style="font-weight: 700; font-size: 0.85rem; color: var(--color-primary); margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
              <span>⚙️</span> Activities
            </div>
            ${renderModalRow('Dawah Work Days', summary.mdDay)}
            ${renderModalRow('Dawah Average Hours / Day', `${summary.mdAvgHours}h`)}
            ${renderModalRow('Organizational Work Days', summary.moTotalDays)}
            ${renderModalRow('Organizational Average Hours / Day', `${summary.moAvgHours}h`)}
            ${renderModalRow('Average Sleeping Hours', `${summary.msAvgHours}h`)}
          </div>

          <!-- Personal Contacts -->
          <div class="glass-card" style="padding: var(--space-md); background: rgba(255,255,255,0.01); border-radius: 8px;">
            <div style="font-weight: 700; font-size: 0.85rem; color: var(--color-primary); margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
              <span>👥</span> Personal Contacts
            </div>
            ${renderModalRow('Member (সদস্য)', summary.mcMember)}
            ${renderModalRow('Associate (সাথী)', summary.mcAssociate)}
            ${renderModalRow('Worker (কর্মী)', summary.mcWorker)}
            ${renderModalRow('Supporter (সমর্থক)', summary.mcSupporter)}
            ${renderModalRow('Friends (বন্ধু)', summary.mcFriends)}
            ${renderModalRow('Well Wisher (শুভাকাঙ্ক্ষী)', summary.mcWellWisher)}
            ${renderModalRow('Meritorious (মেধাবী ছাত্র)', summary.mcMeritorious)}
            ${renderModalRow('Reader (পাঠক)', summary.mcReader)}
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; border-top: 1px solid var(--border-color); padding-top: var(--space-sm);">
          <button type="button" id="summary-modal-ok-btn" class="btn btn-primary" style="padding: 8px 24px; font-weight: 600; border-radius: 6px;">Close</button>
        </div>
      </div>
    `;

    container.appendChild(overlay);

    const closeBtn = overlay.querySelector('#summary-modal-close-btn');
    const okBtn = overlay.querySelector('#summary-modal-ok-btn');

    const dismissModal = () => {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 200);
    };

    closeBtn.addEventListener('click', dismissModal);
    okBtn.addEventListener('click', dismissModal);
  }

  // (formatDurationInput is no longer needed since we use native dropdown selectors for choosing hours/minutes)

  // Sync down latest data from Firestore before rendering so grid is always up-to-date across devices
  if (typeof FirebaseAvailable !== 'undefined' && FirebaseAvailable && typeof Sync !== 'undefined' && typeof Sync.syncDownData === 'function') {
    try {
      await Sync.syncDownData();
    } catch (err) {
      console.warn('Daily report page: sync-down before render failed:', err);
    }
  }

  await renderPage();
});
