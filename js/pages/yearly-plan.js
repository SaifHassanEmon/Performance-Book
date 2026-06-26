/* ============================================================
   Yearly Plan Page
   Comprehensive yearly planning form with 7 sections
   ============================================================ */

Router.register('yearly-plan', async function (container) {
  // ---- Current year state ----
  let currentYear = new Date().getFullYear();

  // ---- Render the page ----
  async function renderPage() {
    // Load existing data for current year
    const existing = await DB.getYearlyPlan(currentYear) || {};

    container.innerHTML = `
      <!-- Year Selector -->
      <div class="month-selector">
        <button id="yp-prev-year" class="month-selector-btn" aria-label="Previous year">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <span id="yp-year-label" class="month-selector-label">${currentYear}</span>
        <button id="yp-next-year" class="month-selector-btn" aria-label="Next year">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>

      <!-- Section 1: Personal Info -->
      <div class="glass-card" style="margin-bottom:var(--space-lg)">
        <div class="section-header">
          <div class="section-icon">👤</div>
          <div>
            <div class="section-title" data-i18n="yearly.title">${I18n.t('yearly.title')}</div>
          </div>
        </div>
        <div class="form-row" style="margin-bottom:var(--space-md)">
          <div class="form-group">
            <label class="form-label" data-i18n="yearly.year">${I18n.t('yearly.year')}</label>
            <input type="number" id="year" class="form-input yp-field" data-field="year" value="${existing.year || currentYear}" inputmode="numeric" readonly>
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="yearly.month">${I18n.t('yearly.month')}</label>
            <input type="text" id="month" class="form-input yp-field" data-field="month" value="${existing.month || ''}">
          </div>
        </div>
        <div class="form-row" style="margin-bottom:var(--space-md)">
          <div class="form-group">
            <label class="form-label" data-i18n="yearly.name">${I18n.t('yearly.name')}</label>
            <input type="text" id="name" class="form-input yp-field" data-field="name" value="${existing.name || ''}">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="yearly.branch">${I18n.t('yearly.branch')}</label>
            <input type="text" id="branch" class="form-input yp-field" data-field="branch" value="${existing.branch || ''}">
          </div>
        </div>
        <div class="form-row" style="margin-bottom:var(--space-md)">
          <div class="form-group">
            <label class="form-label" data-i18n="yearly.institution">${I18n.t('yearly.institution')}</label>
            <input type="text" id="institution" class="form-input yp-field" data-field="institution" value="${existing.institution || ''}">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="yearly.responsibility">${I18n.t('yearly.responsibility')}</label>
            <input type="text" id="responsibility" class="form-input yp-field" data-field="responsibility" value="${existing.responsibility || ''}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" data-i18n="yearly.semester">${I18n.t('yearly.semester')}</label>
            <input type="text" id="semester" class="form-input yp-field" data-field="semester" value="${existing.semester || ''}">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="yearly.subject">${I18n.t('yearly.subject')}</label>
            <input type="text" id="subject" class="form-input yp-field" data-field="subject" value="${existing.subject || ''}">
          </div>
        </div>
      </div>

      <!-- Section 2: Recitation from the Holy Quran -->
      <div class="glass-card" style="margin-bottom:var(--space-lg)">
        <div class="section-header">
          <div class="section-icon">📖</div>
          <div>
            <div class="section-title" data-i18n="yearly.quranRecitation">${I18n.t('yearly.quranRecitation')}</div>
          </div>
        </div>
        <div class="form-row" style="margin-bottom:var(--space-md)">
          <div class="form-group">
            <label class="form-label" data-i18n="yearly.totalNights">${I18n.t('yearly.totalNights')}</label>
            <input type="number" id="quranTotalNights" class="form-input yp-field" data-field="quranTotalNights" value="${existing.quranTotalNights || ''}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="yearly.dailyAvgAyah">${I18n.t('yearly.dailyAvgAyah')}</label>
            <input type="number" id="quranDailyAvg" class="form-input yp-field" data-field="quranDailyAvg" value="${existing.quranDailyAvg || ''}" inputmode="numeric">
          </div>
        </div>
        <div class="form-group" style="margin-bottom:var(--space-md)">
          <label class="form-label" data-i18n="yearly.nameOfSurah">${I18n.t('yearly.nameOfSurah')}</label>
          <input type="text" id="quranSurahName" class="form-input yp-field" data-field="quranSurahName" value="${existing.quranSurahName || ''}">
        </div>
        <div class="form-row" style="margin-bottom:var(--space-md)">
          <div class="form-group">
            <label class="form-label" data-i18n="yearly.makingDars">${I18n.t('yearly.makingDars')} (${I18n.t('yearly.quantity')})</label>
            <input type="number" id="quranDarsQty" class="form-input yp-field" data-field="quranDarsQty" value="${existing.quranDarsQty || ''}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="yearly.subjectPart">${I18n.t('yearly.subjectPart')}</label>
            <input type="text" id="quranSubjectPart" class="form-input yp-field" data-field="quranSubjectPart" value="${existing.quranSubjectPart || ''}">
          </div>
        </div>
        <div class="form-group" style="margin-bottom:var(--space-md)">
          <label class="form-label" data-i18n="yearly.meaningWithSurah">${I18n.t('yearly.meaningWithSurah')}</label>
          <input type="text" id="quranMeaning" class="form-input yp-field" data-field="quranMeaning" value="${existing.quranMeaning || ''}">
        </div>
        <div class="form-group" style="margin-bottom:var(--space-md)">
          <label class="form-label" data-i18n="yearly.memorizedSubjectAyah">${I18n.t('yearly.memorizedSubjectAyah')}</label>
          <input type="text" id="quranMemorized" class="form-input yp-field" data-field="quranMemorized" value="${existing.quranMemorized || ''}">
        </div>
        <div style="padding:var(--space-md) var(--space-lg); background:rgba(16,185,129,0.06); border-left:3px solid var(--color-primary); border-radius:var(--radius-sm); font-size:0.8125rem; color:var(--text-secondary); font-style:italic;" data-i18n="yearly.quranPledge">${I18n.t('yearly.quranPledge')}</div>
      </div>

      <!-- Section 3: Studying Hadith -->
      <div class="glass-card" style="margin-bottom:var(--space-lg)">
        <div class="section-header">
          <div class="section-icon">📚</div>
          <div>
            <div class="section-title" data-i18n="yearly.studyingHadith">${I18n.t('yearly.studyingHadith')}</div>
          </div>
        </div>
        <div class="form-row" style="margin-bottom:var(--space-md)">
          <div class="form-group">
            <label class="form-label" data-i18n="yearly.totalHadith">${I18n.t('yearly.totalHadith')}</label>
            <input type="number" id="hadithTotal" class="form-input yp-field" data-field="hadithTotal" value="${existing.hadithTotal || ''}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="yearly.dailyAverage">${I18n.t('yearly.dailyAverage')}</label>
            <input type="number" id="hadithDailyAvg" class="form-input yp-field" data-field="hadithDailyAvg" value="${existing.hadithDailyAvg || ''}" inputmode="numeric">
          </div>
        </div>
        <div class="form-group" style="margin-bottom:var(--space-md)">
          <label class="form-label" data-i18n="yearly.bookOfHadith">${I18n.t('yearly.bookOfHadith')}</label>
          <input type="text" id="hadithBook" class="form-input yp-field" data-field="hadithBook" value="${existing.hadithBook || ''}">
        </div>
        <div class="form-row" style="margin-bottom:var(--space-md)">
          <div class="form-group">
            <label class="form-label" data-i18n="yearly.makingDars">${I18n.t('yearly.makingDars')} (${I18n.t('yearly.quantity')})</label>
            <input type="number" id="hadithDarsQty" class="form-input yp-field" data-field="hadithDarsQty" value="${existing.hadithDarsQty || ''}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="yearly.subjectPart">${I18n.t('yearly.subjectPart')}</label>
            <input type="text" id="hadithSubjectPart" class="form-input yp-field" data-field="hadithSubjectPart" value="${existing.hadithSubjectPart || ''}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" data-i18n="yearly.memorizedSubject">${I18n.t('yearly.memorizedSubject')}</label>
            <input type="text" id="hadithMemorized" class="form-input yp-field" data-field="hadithMemorized" value="${existing.hadithMemorized || ''}">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="yearly.masnunDua">${I18n.t('yearly.masnunDua')}</label>
            <input type="number" id="hadithMasnunDua" class="form-input yp-field" data-field="hadithMasnunDua" value="${existing.hadithMasnunDua || ''}" inputmode="numeric">
          </div>
        </div>
      </div>

      <!-- Section 4: Reading Islamic Literature -->
      <div class="glass-card" style="margin-bottom:var(--space-lg)">
        <div class="section-header">
          <div class="section-icon">📕</div>
          <div>
            <div class="section-title" data-i18n="yearly.readingLiterature">${I18n.t('yearly.readingLiterature')}</div>
          </div>
        </div>
        <div class="form-row form-row-3" style="margin-bottom:var(--space-md)">
          <div class="form-group">
            <label class="form-label" data-i18n="yearly.quantityTotalBook">${I18n.t('yearly.quantityTotalBook')}</label>
            <input type="number" id="litTotalBook" class="form-input yp-field" data-field="litTotalBook" value="${existing.litTotalBook || ''}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="yearly.dailyAverage">${I18n.t('yearly.dailyAverage')}</label>
            <input type="number" id="litDailyAvg" class="form-input yp-field" data-field="litDailyAvg" value="${existing.litDailyAvg || ''}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="yearly.pages">${I18n.t('yearly.pages')}</label>
            <input type="number" id="litPages" class="form-input yp-field" data-field="litPages" value="${existing.litPages || ''}" inputmode="numeric">
          </div>
        </div>
        <div class="form-group" style="margin-bottom:var(--space-md)">
          <label class="form-label" data-i18n="yearly.nameOfBook">${I18n.t('yearly.nameOfBook')}</label>
          <input type="text" id="litBookName" class="form-input yp-field" data-field="litBookName" value="${existing.litBookName || ''}">
        </div>
        <div class="form-group" style="margin-bottom:var(--space-md)">
          <label class="form-label" data-i18n="yearly.bookNote">${I18n.t('yearly.bookNote')}</label>
          <textarea id="litBookNote" class="form-input yp-field" data-field="litBookNote" rows="3">${existing.litBookNote || ''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label" data-i18n="yearly.discussionNote">${I18n.t('yearly.discussionNote')}</label>
          <textarea id="litDiscussionNote" class="form-input yp-field" data-field="litDiscussionNote" rows="3">${existing.litDiscussionNote || ''}</textarea>
        </div>
      </div>

      <!-- Section 5: Academic Study -->
      <div class="glass-card" style="margin-bottom:var(--space-lg)">
        <div class="section-header">
          <div class="section-icon">🎓</div>
          <div>
            <div class="section-title" data-i18n="yearly.academicStudy">${I18n.t('yearly.academicStudy')}</div>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" data-i18n="yearly.dailyAverage">${I18n.t('yearly.dailyAverage')} (${I18n.t('yearly.hours')})</label>
            <input type="number" id="academicDailyAvg" class="form-input yp-field" data-field="academicDailyAvg" value="${existing.academicDailyAvg || ''}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="yearly.regularParticipation">${I18n.t('yearly.regularParticipation')}</label>
            <input type="text" id="academicParticipation" class="form-input yp-field" data-field="academicParticipation" value="${existing.academicParticipation || ''}">
          </div>
        </div>
      </div>

      <!-- Section 6: Communication -->
      <div class="glass-card" style="margin-bottom:var(--space-lg)">
        <div class="section-header">
          <div class="section-icon">💬</div>
          <div>
            <div class="section-title" data-i18n="yearly.communication">${I18n.t('yearly.communication')}</div>
          </div>
        </div>
        <div class="form-row" style="margin-bottom:var(--space-md)">
          <div class="form-group">
            <label class="form-label" data-i18n="yearly.totalPerson">${I18n.t('yearly.totalPerson')}</label>
            <input type="number" id="commTotal" class="form-input yp-field" data-field="commTotal" value="${existing.commTotal || ''}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="yearly.avgEveryMonth">${I18n.t('yearly.avgEveryMonth')}</label>
            <input type="number" id="commAvgMonth" class="form-input yp-field" data-field="commAvgMonth" value="${existing.commAvgMonth || ''}" inputmode="numeric">
          </div>
        </div>
        <div class="form-row" style="margin-bottom:var(--space-md)">
          <div class="form-group">
            <label class="form-label" data-i18n="yearly.member">${I18n.t('yearly.member')}</label>
            <input type="number" id="commMember" class="form-input yp-field" data-field="commMember" value="${existing.commMember || ''}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="yearly.associate">${I18n.t('yearly.associate')}</label>
            <input type="number" id="commAssociate" class="form-input yp-field" data-field="commAssociate" value="${existing.commAssociate || ''}" inputmode="numeric">
          </div>
        </div>
        <div class="form-row" style="margin-bottom:var(--space-md)">
          <div class="form-group">
            <label class="form-label" data-i18n="yearly.worker">${I18n.t('yearly.worker')}</label>
            <input type="number" id="commWorker" class="form-input yp-field" data-field="commWorker" value="${existing.commWorker || ''}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="yearly.supporter">${I18n.t('yearly.supporter')}</label>
            <input type="number" id="commSupporter" class="form-input yp-field" data-field="commSupporter" value="${existing.commSupporter || ''}" inputmode="numeric">
          </div>
        </div>
        <div class="form-row" style="margin-bottom:var(--space-md)">
          <div class="form-group">
            <label class="form-label" data-i18n="yearly.friends">${I18n.t('yearly.friends')}</label>
            <input type="number" id="commFriends" class="form-input yp-field" data-field="commFriends" value="${existing.commFriends || ''}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="yearly.wellWisher">${I18n.t('yearly.wellWisher')}</label>
            <input type="number" id="commWellWisher" class="form-input yp-field" data-field="commWellWisher" value="${existing.commWellWisher || ''}" inputmode="numeric">
          </div>
        </div>
        <div class="form-row" style="margin-bottom:var(--space-md)">
          <div class="form-group">
            <label class="form-label" data-i18n="yearly.teacher">${I18n.t('yearly.teacher')}</label>
            <input type="number" id="commTeacher" class="form-input yp-field" data-field="commTeacher" value="${existing.commTeacher || ''}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="yearly.meritoriousStudent">${I18n.t('yearly.meritoriousStudent')}</label>
            <input type="number" id="commMeritorious" class="form-input yp-field" data-field="commMeritorious" value="${existing.commMeritorious || ''}" inputmode="numeric">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" data-i18n="yearly.vip">${I18n.t('yearly.vip')}</label>
            <input type="number" id="commVip" class="form-input yp-field" data-field="commVip" value="${existing.commVip || ''}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="yearly.readers">${I18n.t('yearly.readers')}</label>
            <input type="number" id="commReaders" class="form-input yp-field" data-field="commReaders" value="${existing.commReaders || ''}" inputmode="numeric">
          </div>
        </div>
      </div>

      <!-- Section 7: Distribution -->
      <div class="glass-card" style="margin-bottom:var(--space-lg)">
        <div class="section-header">
          <div class="section-icon">📦</div>
          <div>
            <div class="section-title" data-i18n="yearly.distribution">${I18n.t('yearly.distribution')}</div>
          </div>
        </div>
        <table class="dist-table">
          <thead>
            <tr>
              <th data-i18n="yearly.material">${I18n.t('yearly.material')}</th>
              <th data-i18n="yearly.amount">${I18n.t('yearly.amount')}</th>
            </tr>
          </thead>
          <tbody>
            ${buildDistRow('yearly.literature', 'distLiterature', existing)}
            ${buildDistRow('yearly.cm', 'distCM', existing)}
            ${buildDistRow('yearly.pp', 'distPP', existing)}
            ${buildDistRow('yearly.p', 'distP', existing)}
            ${buildDistRow('yearly.kk', 'distKK', existing)}
            ${buildDistRow('yearly.kp', 'distKP', existing)}
            ${buildDistRow('yearly.gift', 'distGift', existing)}
            ${buildDistRow('yearly.stickerCard', 'distStickerCard', existing)}
            ${buildDistRow('yearly.cdVcd', 'distCdVcd', existing)}
            ${buildDistRow('yearly.sm', 'distSM', existing)}
            ${buildDistRow('yearly.newYearWishing', 'distNewYear', existing)}
            ${buildDistRow('yearly.others', 'distOthers', existing)}
          </tbody>
        </table>
      </div>

      <!-- Save Button -->
      <div style="margin-bottom:var(--space-xl);">
        <button id="yp-save-btn" class="btn btn-primary btn-block" data-i18n="yearly.save">${I18n.t('yearly.save')}</button>
      </div>
    `;

    // ---- Wire up event listeners ----
    wireEvents();

    // Re-apply i18n translations
    I18n.applyLanguage();
  }

  // ---- Helper: Build a dist-table row ----
  function buildDistRow(labelKey, fieldName, data) {
    return `
      <tr>
        <td style="font-weight:600; color:var(--text-secondary);" data-i18n="${labelKey}">${I18n.t(labelKey)}</td>
        <td><input type="number" class="dist-input yp-field" data-field="${fieldName}" value="${data[fieldName] || ''}" inputmode="numeric"></td>
      </tr>
    `;
  }

  // ---- Wire all event listeners ----
  function wireEvents() {
    // Year navigation
    const prevBtn = container.querySelector('#yp-prev-year');
    const nextBtn = container.querySelector('#yp-next-year');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        currentYear--;
        renderPage();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        currentYear++;
        renderPage();
      });
    }

    // Auto-save on blur for all form fields
    const allFields = container.querySelectorAll('.yp-field');
    allFields.forEach(field => {
      field.addEventListener('blur', () => autoSave());
      field.addEventListener('change', () => autoSave());
    });

    // Save button
    const saveBtn = container.querySelector('#yp-save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        await saveForm();
        App.showToast(I18n.t('yearly.saved'), 'success');
      });
    }
  }

  // ---- Collect all field values from the DOM ----
  function collectFormData() {
    const data = {
      year: currentYear,
    };
    const allFields = container.querySelectorAll('.yp-field');
    allFields.forEach(field => {
      const key = field.getAttribute('data-field');
      if (key && key !== 'year') {
        data[key] = field.value;
      }
    });
    return data;
  }

  // ---- Save plan to IndexedDB ----
  async function saveForm() {
    const data = collectFormData();
    await DB.saveYearlyPlan(data);
  }

  // ---- Auto-save (debounced) ----
  let autoSaveTimer = null;
  function autoSave() {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(async () => {
      await saveForm();
    }, 800);
  }

  // ---- Initial render ----
  await renderPage();
});
