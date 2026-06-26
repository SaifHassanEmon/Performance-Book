/* ============================================================
   Monthly Plan Page
   Comprehensive monthly planning form with 14 sections
   ============================================================ */

Router.register('monthly-plan', async function (container) {
  // ---- Current month/year state ----
  const now = new Date();
  let currentMonth = now.getMonth() + 1; // 1-12
  let currentYear = now.getFullYear();

  // Month names for the selector label
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // ---- Render the page ----
  async function renderPage() {
    // Load existing data for current month
    const existing = await DB.getMonthlyPlan(currentYear, currentMonth) || {};

    let feedbackHtml = '';
    if (existing.supervisorFeedback) {
      const feedbackTitle = I18n.getLang() === 'bn' ? '📋 সুপারভাইজার মূল্যায়ন ও পরামর্শ' : '📋 Supervisor Assessment & Guidance';
      const statusLabel = I18n.getLang() === 'bn' ? 'অবস্থা:' : 'Status:';
      const statusValue = existing.status === 'reviewed' 
        ? (I18n.getLang() === 'bn' ? 'মূল্যায়িত' : 'Reviewed')
        : (I18n.getLang() === 'bn' ? 'অপেক্ষমান' : 'Pending');
      
      feedbackHtml = `
        <div class="glass-card" style="margin-bottom: var(--space-lg); border: 1.5px solid var(--color-primary); background: rgba(16, 185, 129, 0.05); padding: var(--space-lg);">
          <h3 style="font-size: 0.95rem; font-weight: 800; color: var(--color-primary); margin-bottom: var(--space-sm); display: flex; align-items: center; gap: 6px;">
            ${feedbackTitle}
          </h3>
          <p style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: var(--space-md); line-height: 1.5; font-style: italic; white-space: pre-wrap;">
            "${existing.supervisorFeedback}"
          </p>
          <div style="font-size: 0.75rem; color: var(--text-muted);">
            <strong>${statusLabel}</strong> <span class="badge ${existing.status === 'reviewed' ? 'badge-green' : 'badge-amber'}" style="display: inline-block; vertical-align: middle; margin-left: 4px;">${statusValue}</span>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <!-- Month Selector -->
      <div class="month-selector">
        <button id="mp-prev-month" class="month-selector-btn" aria-label="Previous month">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <span id="mp-month-label" class="month-selector-label">${monthNames[currentMonth - 1]} ${currentYear}</span>
        <button id="mp-next-month" class="month-selector-btn" aria-label="Next month">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>

      <!-- Supervisor Feedback -->
      ${feedbackHtml}

      <!-- 1. The Holy Quran -->
      <div class="glass-card" style="margin-bottom:var(--space-lg)">
        <div class="section-header">
          <div class="section-icon">📖</div>
          <div>
            <div class="section-title" data-i18n="monthly.holyQuran">${I18n.t('monthly.holyQuran')}</div>
          </div>
        </div>
        <div class="form-row" style="margin-bottom:var(--space-md)">
          <div class="form-group">
            <label class="form-label" data-i18n="monthly.totalDays">${I18n.t('monthly.totalDays')}</label>
            <input type="number" class="form-input mp-field" data-field="mqTotalDays" value="${existing.mqTotalDays || ''}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="monthly.avgAyah">${I18n.t('monthly.avgAyah')}</label>
            <input type="number" class="form-input mp-field" data-field="mqAvgAyah" value="${existing.mqAvgAyah || ''}" inputmode="numeric">
          </div>
        </div>
        <div class="form-row" style="margin-bottom:var(--space-md)">
          <div class="form-group">
            <label class="form-label" data-i18n="monthly.makingDars">${I18n.t('monthly.makingDars')}</label>
            <input type="number" class="form-input mp-field" data-field="mqMakingDars" value="${existing.mqMakingDars || ''}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="monthly.memorizedAyah">${I18n.t('monthly.memorizedAyah')}</label>
            <input type="number" class="form-input mp-field" data-field="mqMemorized" value="${existing.mqMemorized || ''}" inputmode="numeric">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" data-i18n="monthly.meaningWithSurah">${I18n.t('monthly.meaningWithSurah')}</label>
          <input type="text" class="form-input mp-field" data-field="mqMeaning" value="${existing.mqMeaning || ''}">
        </div>
      </div>

      <!-- 2. Studying Hadith -->
      <div class="glass-card" style="margin-bottom:var(--space-lg)">
        <div class="section-header">
          <div class="section-icon">📚</div>
          <div>
            <div class="section-title" data-i18n="monthly.studyingHadith">${I18n.t('monthly.studyingHadith')}</div>
          </div>
        </div>
        <div class="form-row" style="margin-bottom:var(--space-md)">
          <div class="form-group">
            <label class="form-label" data-i18n="monthly.totalDays">${I18n.t('monthly.totalDays')}</label>
            <input type="number" class="form-input mp-field" data-field="mhTotalDays" value="${existing.mhTotalDays || ''}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="monthly.avgHadith">${I18n.t('monthly.avgHadith')}</label>
            <input type="number" class="form-input mp-field" data-field="mhAvg" value="${existing.mhAvg || ''}" inputmode="numeric">
          </div>
        </div>
        <div class="form-row" style="margin-bottom:var(--space-md)">
          <div class="form-group">
            <label class="form-label" data-i18n="monthly.masnunDua">${I18n.t('monthly.masnunDua')}</label>
            <input type="number" class="form-input mp-field" data-field="mhMasnunDua" value="${existing.mhMasnunDua || ''}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="monthly.makingDarsH">${I18n.t('monthly.makingDarsH')}</label>
            <input type="number" class="form-input mp-field" data-field="mhMakingDars" value="${existing.mhMakingDars || ''}" inputmode="numeric">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" data-i18n="monthly.memorized">${I18n.t('monthly.memorized')}</label>
            <input type="number" class="form-input mp-field" data-field="mhMemorized" value="${existing.mhMemorized || ''}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="monthly.subject">${I18n.t('monthly.subject')}</label>
            <input type="text" class="form-input mp-field" data-field="mhSubject" value="${existing.mhSubject || ''}">
          </div>
        </div>
      </div>

      <!-- 3. Reading Literature -->
      <div class="glass-card" style="margin-bottom:var(--space-lg)">
        <div class="section-header">
          <div class="section-icon">📕</div>
          <div>
            <div class="section-title" data-i18n="monthly.readingLiterature">${I18n.t('monthly.readingLiterature')}</div>
          </div>
        </div>
        <div class="form-row form-row-3" style="margin-bottom:var(--space-md)">
          <div class="form-group">
            <label class="form-label" data-i18n="monthly.totalPages">${I18n.t('monthly.totalPages')}</label>
            <input type="number" class="form-input mp-field" data-field="mlTotalPages" value="${existing.mlTotalPages || ''}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="monthly.islamic">${I18n.t('monthly.islamic')}</label>
            <input type="number" class="form-input mp-field" data-field="mlIslamic" value="${existing.mlIslamic || ''}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="monthly.othersLit">${I18n.t('monthly.othersLit')}</label>
            <input type="number" class="form-input mp-field" data-field="mlOthers" value="${existing.mlOthers || ''}" inputmode="numeric">
          </div>
        </div>
        <div class="form-group" style="margin-bottom:var(--space-md)">
          <label class="form-label" data-i18n="monthly.nameOfBook">${I18n.t('monthly.nameOfBook')}</label>
          <input type="text" class="form-input mp-field" data-field="mlBookName" value="${existing.mlBookName || ''}">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" data-i18n="monthly.bookNote">${I18n.t('monthly.bookNote')}</label>
            <input type="number" class="form-input mp-field" data-field="mlBookNote" value="${existing.mlBookNote || ''}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="monthly.discussionNote">${I18n.t('monthly.discussionNote')}</label>
            <input type="number" class="form-input mp-field" data-field="mlDiscussion" value="${existing.mlDiscussion || ''}" inputmode="numeric">
          </div>
        </div>
      </div>

      <!-- 4. Academic Study -->
      <div class="glass-card" style="margin-bottom:var(--space-lg)">
        <div class="section-header">
          <div class="section-icon">🎓</div>
          <div>
            <div class="section-title" data-i18n="monthly.academicStudy">${I18n.t('monthly.academicStudy')}</div>
          </div>
        </div>
        <div class="form-row" style="margin-bottom:var(--space-md)">
          <div class="form-group">
            <label class="form-label" data-i18n="monthly.totalDays">${I18n.t('monthly.totalDays')}</label>
            <input type="number" class="form-input mp-field" data-field="maTotalDays" value="${existing.maTotalDays || ''}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="monthly.avgHours">${I18n.t('monthly.avgHours')}</label>
            <input type="number" class="form-input mp-field" data-field="maAvgHours" value="${existing.maAvgHours || ''}" inputmode="numeric">
          </div>
        </div>
        <p style="font-style:italic; color:var(--text-secondary); font-size:0.8125rem;" data-i18n="monthly.attendClass">${I18n.t('monthly.attendClass')}</p>
      </div>

      <!-- 5. Salat -->
      <div class="glass-card" style="margin-bottom:var(--space-lg)">
        <div class="section-header">
          <div class="section-icon">🕌</div>
          <div>
            <div class="section-title" data-i18n="monthly.salat">${I18n.t('monthly.salat')}</div>
          </div>
        </div>
        <div style="padding:var(--space-md) var(--space-lg); background:rgba(16,185,129,0.06); border-left:3px solid var(--color-primary); border-radius:var(--radius-sm); margin-bottom:var(--space-md); font-size:0.8125rem; color:var(--text-secondary); font-style:italic;" data-i18n="monthly.salatJamat">${I18n.t('monthly.salatJamat')}</div>
        <div style="padding:var(--space-md) var(--space-lg); background:rgba(16,185,129,0.06); border-left:3px solid var(--color-primary); border-radius:var(--radius-sm); font-size:0.8125rem; color:var(--text-secondary); font-style:italic;" data-i18n="monthly.nafalPrayer">${I18n.t('monthly.nafalPrayer')}</div>
      </div>

      <!-- 6. Communication -->
      <div class="glass-card" style="margin-bottom:var(--space-lg)">
        <div class="section-header">
          <div class="section-icon">💬</div>
          <div>
            <div class="section-title" data-i18n="monthly.communication">${I18n.t('monthly.communication')}</div>
          </div>
        </div>
        <div class="form-row" style="margin-bottom:var(--space-md)">
          <div class="form-group">
            <label class="form-label" data-i18n="monthly.member">${I18n.t('monthly.member')}</label>
            <input type="number" class="form-input mp-field" data-field="mcMember" value="${existing.mcMember || ''}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="monthly.associate">${I18n.t('monthly.associate')}</label>
            <input type="number" class="form-input mp-field" data-field="mcAssociate" value="${existing.mcAssociate || ''}" inputmode="numeric">
          </div>
        </div>
        <div class="form-row" style="margin-bottom:var(--space-md)">
          <div class="form-group">
            <label class="form-label" data-i18n="monthly.worker">${I18n.t('monthly.worker')}</label>
            <input type="number" class="form-input mp-field" data-field="mcWorker" value="${existing.mcWorker || ''}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="monthly.supporter">${I18n.t('monthly.supporter')}</label>
            <input type="number" class="form-input mp-field" data-field="mcSupporter" value="${existing.mcSupporter || ''}" inputmode="numeric">
          </div>
        </div>
        <div class="form-row" style="margin-bottom:var(--space-md)">
          <div class="form-group">
            <label class="form-label" data-i18n="monthly.friends">${I18n.t('monthly.friends')}</label>
            <input type="number" class="form-input mp-field" data-field="mcFriends" value="${existing.mcFriends || ''}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="monthly.wellWisher">${I18n.t('monthly.wellWisher')}</label>
            <input type="number" class="form-input mp-field" data-field="mcWellWisher" value="${existing.mcWellWisher || ''}" inputmode="numeric">
          </div>
        </div>
        <div class="form-row" style="margin-bottom:var(--space-md)">
          <div class="form-group">
            <label class="form-label" data-i18n="monthly.meritoriousStudent">${I18n.t('monthly.meritoriousStudent')}</label>
            <input type="number" class="form-input mp-field" data-field="mcMeritorious" value="${existing.mcMeritorious || ''}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="monthly.teacher">${I18n.t('monthly.teacher')}</label>
            <input type="number" class="form-input mp-field" data-field="mcTeacher" value="${existing.mcTeacher || ''}" inputmode="numeric">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" data-i18n="monthly.vip">${I18n.t('monthly.vip')}</label>
            <input type="number" class="form-input mp-field" data-field="mcVip" value="${existing.mcVip || ''}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="monthly.reader">${I18n.t('monthly.reader')}</label>
            <input type="number" class="form-input mp-field" data-field="mcReader" value="${existing.mcReader || ''}" inputmode="numeric">
          </div>
        </div>
      </div>

      <!-- 7. Dawah -->
      <div class="glass-card" style="margin-bottom:var(--space-lg)">
        <div class="section-header">
          <div class="section-icon">🌍</div>
          <div>
            <div class="section-title" data-i18n="monthly.dawah">${I18n.t('monthly.dawah')}</div>
          </div>
        </div>
        <div class="form-row form-row-3">
          <div class="form-group">
            <label class="form-label" data-i18n="monthly.day">${I18n.t('monthly.day')}</label>
            <input type="number" class="form-input mp-field" data-field="mdDay" value="${existing.mdDay || ''}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="monthly.avgHoursD">${I18n.t('monthly.avgHoursD')}</label>
            <input type="number" class="form-input mp-field" data-field="mdAvgHours" value="${existing.mdAvgHours || ''}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="monthly.totalPerson">${I18n.t('monthly.totalPerson')}</label>
            <input type="number" class="form-input mp-field" data-field="mdTotalPerson" value="${existing.mdTotalPerson || ''}" inputmode="numeric">
          </div>
        </div>
      </div>

      <!-- 8. Organization Work -->
      <div class="glass-card" style="margin-bottom:var(--space-lg)">
        <div class="section-header">
          <div class="section-icon">🏢</div>
          <div>
            <div class="section-title" data-i18n="monthly.orgWork">${I18n.t('monthly.orgWork')}</div>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" data-i18n="monthly.totalDays">${I18n.t('monthly.totalDays')}</label>
            <input type="number" class="form-input mp-field" data-field="moTotalDays" value="${existing.moTotalDays || ''}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="monthly.avgHours">${I18n.t('monthly.avgHours')}</label>
            <input type="number" class="form-input mp-field" data-field="moAvgHours" value="${existing.moAvgHours || ''}" inputmode="numeric">
          </div>
        </div>
      </div>

      <!-- 9. Sleeping Hours -->
      <div class="glass-card" style="margin-bottom:var(--space-lg)">
        <div class="section-header">
          <div class="section-icon">😴</div>
          <div>
            <div class="section-title" data-i18n="monthly.sleepingHours">${I18n.t('monthly.sleepingHours')}</div>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" data-i18n="monthly.totalDays">${I18n.t('monthly.totalDays')}</label>
            <input type="number" class="form-input mp-field" data-field="msTotalDays" value="${existing.msTotalDays || ''}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="monthly.avgHours">${I18n.t('monthly.avgHours')}</label>
            <input type="number" class="form-input mp-field" data-field="msAvgHours" value="${existing.msAvgHours || ''}" inputmode="numeric">
          </div>
        </div>
      </div>

      <!-- 10. Social Media Browsing -->
      <div class="glass-card" style="margin-bottom:var(--space-lg)">
        <div class="section-header">
          <div class="section-icon">📱</div>
          <div>
            <div class="section-title" data-i18n="monthly.socialMedia">${I18n.t('monthly.socialMedia')}</div>
          </div>
        </div>
        <div class="form-row" style="margin-bottom:var(--space-md)">
          <div class="form-group">
            <label class="form-label" data-i18n="monthly.totalDays">${I18n.t('monthly.totalDays')}</label>
            <input type="number" class="form-input mp-field" data-field="msmTotalDays" value="${existing.msmTotalDays || ''}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="monthly.avgHours">${I18n.t('monthly.avgHours')}</label>
            <input type="number" class="form-input mp-field" data-field="msmAvgHours" value="${existing.msmAvgHours || ''}" inputmode="numeric">
          </div>
        </div>
        <p style="font-style:italic; color:var(--text-secondary); font-size:0.8125rem;" data-i18n="monthly.socialMediaPledge">${I18n.t('monthly.socialMediaPledge')}</p>
      </div>

      <!-- 11. Distribution -->
      <div class="glass-card" style="margin-bottom:var(--space-lg)">
        <div class="section-header">
          <div class="section-icon">📦</div>
          <div>
            <div class="section-title" data-i18n="monthly.distribution">${I18n.t('monthly.distribution')}</div>
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
            ${buildDistRow('yearly.literature', 'mdistLiterature', existing)}
            ${buildDistRow('yearly.cm', 'mdistCM', existing)}
            ${buildDistRow('yearly.pp', 'mdistPP', existing)}
            ${buildDistRow('yearly.p', 'mdistP', existing)}
            ${buildDistRow('yearly.kk', 'mdistKK', existing)}
            ${buildDistRow('yearly.kp', 'mdistKP', existing)}
            ${buildDistRow('yearly.gift', 'mdistGift', existing)}
            ${buildDistRow('yearly.stickerCard', 'mdistStickerCard', existing)}
            ${buildDistRow('yearly.cdVcd', 'mdistCdVcd', existing)}
            ${buildDistRow('yearly.sm', 'mdistSM', existing)}
            ${buildDistRow('yearly.newYearWishing', 'mdistNewYear', existing)}
            ${buildDistRow('yearly.others', 'mdistOthers', existing)}
          </tbody>
        </table>
      </div>

      <!-- 12. Increase -->
      <div class="glass-card" style="margin-bottom:var(--space-lg)">
        <div class="section-header">
          <div class="section-icon">📈</div>
          <div>
            <div class="section-title" data-i18n="monthly.increase">${I18n.t('monthly.increase')}</div>
          </div>
        </div>
        <table class="increase-table">
          <tbody>
            ${buildIncRow('monthly.memberInc', 'miMember', 'monthly.workerInc', 'miWorker', existing)}
            ${buildIncRow('monthly.memberCandidate', 'miMemberCandidate', 'monthly.supporterInc', 'miSupporter', existing)}
            ${buildIncRow('monthly.associateInc', 'miAssociate', 'monthly.friendsInc', 'miFriends', existing)}
            ${buildIncRow('monthly.associateCandidate', 'miAssociateCandidate', 'monthly.wellWisherInc', 'miWellWisher', existing)}
          </tbody>
        </table>
      </div>

      <!-- 13. Baitulmal -->
      <div class="glass-card" style="margin-bottom:var(--space-lg)">
        <div class="section-header">
          <div class="section-icon">💰</div>
          <div>
            <div class="section-title" data-i18n="monthly.baitulmal">${I18n.t('monthly.baitulmal')}</div>
          </div>
        </div>
        <div class="form-row form-row-3" style="margin-bottom:var(--space-md)">
          <div class="form-group">
            <label class="form-label"><span data-i18n="monthly.personalIncrease">${I18n.t('monthly.personalIncrease')}</span> (<span data-i18n="monthly.taka">${I18n.t('monthly.taka')}</span>)</label>
            <input type="number" class="form-input mp-field" data-field="mbPersonal" value="${existing.mbPersonal || ''}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label"><span data-i18n="monthly.studentWelfare">${I18n.t('monthly.studentWelfare')}</span> (<span data-i18n="monthly.taka">${I18n.t('monthly.taka')}</span>)</label>
            <input type="number" class="form-input mp-field" data-field="mbStudentWelfare" value="${existing.mbStudentWelfare || ''}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label"><span data-i18n="monthly.swBox">${I18n.t('monthly.swBox')}</span> (<span data-i18n="monthly.taka">${I18n.t('monthly.taka')}</span>)</label>
            <input type="number" class="form-input mp-field" data-field="mbSwBox" value="${existing.mbSwBox || ''}" inputmode="numeric">
          </div>
        </div>
        <div class="form-row form-row-3">
          <div class="form-group">
            <label class="form-label"><span data-i18n="monthly.totalIncrease">${I18n.t('monthly.totalIncrease')}</span> (<span data-i18n="monthly.taka">${I18n.t('monthly.taka')}</span>)</label>
            <input type="number" class="form-input mp-field" data-field="mbTotalIncrease" value="${existing.mbTotalIncrease || ''}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label"><span data-i18n="monthly.tableBank">${I18n.t('monthly.tableBank')}</span> (<span data-i18n="monthly.pcs">${I18n.t('monthly.pcs')}</span>)</label>
            <input type="number" class="form-input mp-field" data-field="mbTableBank" value="${existing.mbTableBank || ''}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label"><span data-i18n="monthly.othersFin">${I18n.t('monthly.othersFin')}</span> (<span data-i18n="monthly.taka">${I18n.t('monthly.taka')}</span>)</label>
            <input type="number" class="form-input mp-field" data-field="mbOthers" value="${existing.mbOthers || ''}" inputmode="numeric">
          </div>
        </div>
      </div>

      <!-- 14. Others -->
      <div class="glass-card" style="margin-bottom:var(--space-lg)">
        <div class="section-header">
          <div class="section-icon">📋</div>
          <div>
            <div class="section-title" data-i18n="monthly.othersSection">${I18n.t('monthly.othersSection')}</div>
          </div>
        </div>

        <!-- Row 1: Self evaluation / Physical exercise -->
        <div class="form-row" style="margin-bottom:var(--space-md)">
          <div class="form-group">
            <label class="form-label"><span data-i18n="monthly.selfEvaluation">${I18n.t('monthly.selfEvaluation')}</span> (<span data-i18n="monthly.days">${I18n.t('monthly.days')}</span>)</label>
            <input type="number" class="form-input mp-field" data-field="moSelfEval" value="${existing.moSelfEval || ''}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label"><span data-i18n="monthly.physicalExercise">${I18n.t('monthly.physicalExercise')}</span> (<span data-i18n="monthly.days">${I18n.t('monthly.days')}</span>)</label>
            <input type="number" class="form-input mp-field" data-field="moExercise" value="${existing.moExercise || ''}" inputmode="numeric">
          </div>
        </div>

        <!-- Row 2: Reading news / Work with Muharroma -->
        <div class="form-row" style="margin-bottom:var(--space-md)">
          <div class="form-group">
            <label class="form-label"><span data-i18n="monthly.readingNews">${I18n.t('monthly.readingNews')}</span> (<span data-i18n="monthly.days">${I18n.t('monthly.days')}</span>)</label>
            <input type="number" class="form-input mp-field" data-field="moNews" value="${existing.moNews || ''}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label"><span data-i18n="monthly.workWithMuharroma">${I18n.t('monthly.workWithMuharroma')}</span> (<span data-i18n="monthly.person">${I18n.t('monthly.person')}</span>)</label>
            <input type="number" class="form-input mp-field" data-field="moMuharroma" value="${existing.moMuharroma || ''}" inputmode="numeric">
          </div>
        </div>

        <!-- Row 3: Group dawah / Dawah SMS -->
        <div class="form-row" style="margin-bottom:var(--space-md)">
          <div class="form-group">
            <label class="form-label" data-i18n="monthly.groupDawahWork">${I18n.t('monthly.groupDawahWork')}</label>
            <input type="number" class="form-input mp-field" data-field="moGroupDawah" value="${existing.moGroupDawah || ''}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label"><span data-i18n="monthly.dawahSMS">${I18n.t('monthly.dawahSMS')}</span> (<span data-i18n="monthly.piece">${I18n.t('monthly.piece')}</span>)</label>
            <input type="number" class="form-input mp-field" data-field="moDawahSMS" value="${existing.moDawahSMS || ''}" inputmode="numeric">
          </div>
        </div>

        <!-- Row 4: E-mail / Work with non-Muslim -->
        <div class="form-row" style="margin-bottom:var(--space-md)">
          <div class="form-group">
            <label class="form-label" data-i18n="monthly.email">${I18n.t('monthly.email')}</label>
            <input type="number" class="form-input mp-field" data-field="moEmail" value="${existing.moEmail || ''}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="monthly.workNonMuslim">${I18n.t('monthly.workNonMuslim')}</label>
            <input type="number" class="form-input mp-field" data-field="moNonMuslim" value="${existing.moNonMuslim || ''}" inputmode="numeric">
          </div>
        </div>

        <!-- Row 5: Teaching computer / Teaching language -->
        <div class="form-row" style="margin-bottom:var(--space-md)">
          <div class="form-group">
            <label class="form-label"><span data-i18n="monthly.academicWork">${I18n.t('monthly.academicWork')}</span> (<span data-i18n="monthly.days">${I18n.t('monthly.days')}</span>)</label>
            <input type="number" class="form-input mp-field" data-field="moTeachComp" value="${existing.moTeachComp || ''}" inputmode="numeric">
          </div>
          <div class="form-group">
            <label class="form-label" data-i18n="monthly.teachingLanguage">${I18n.t('monthly.teachingLanguage')}</label>
            <input type="number" class="form-input mp-field" data-field="moTeachLang" value="${existing.moTeachLang || ''}" inputmode="numeric">
          </div>
        </div>

        <div class="divider"></div>

        <!-- Report + Signature section -->
        <div class="form-group" style="margin-bottom:var(--space-md)">
          <label class="form-label"><span data-i18n="monthly.reportShown">${I18n.t('monthly.reportShown')}</span>. <span data-i18n="monthly.date">${I18n.t('monthly.date')}</span>:</label>
          <input type="date" class="form-input mp-field" data-field="moReportDate" value="${existing.moReportDate || ''}">
        </div>
        <div class="form-group" style="margin-bottom:var(--space-md)">
          <label class="form-label" data-i18n="monthly.responsibleAdvice">${I18n.t('monthly.responsibleAdvice')}</label>
          <textarea class="form-input mp-field" data-field="moResponsibleAdvice" rows="3">${existing.moResponsibleAdvice || ''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label" data-i18n="monthly.plannerSignature">${I18n.t('monthly.plannerSignature')}</label>
          <textarea class="form-input mp-field" data-field="moPlannerSignature" rows="3">${existing.moPlannerSignature || ''}</textarea>
        </div>
      </div>

      <!-- Action Buttons -->
      <div style="display:flex; flex-direction:column; gap:var(--space-md); margin-bottom:var(--space-xl);">
        <button id="mp-save-btn" class="btn btn-primary btn-block" data-i18n="monthly.save">${I18n.t('monthly.save')}</button>
        <button id="mp-submit-btn" class="btn btn-secondary btn-block" data-i18n="monthly.submit">${I18n.t('monthly.submit')}</button>
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
        <td><input type="number" class="dist-input mp-field" data-field="${fieldName}" value="${data[fieldName] || ''}" inputmode="numeric"></td>
      </tr>
    `;
  }

  // ---- Helper: Build an increase-table row (2 label/input pairs) ----
  function buildIncRow(label1Key, field1, label2Key, field2, data) {
    return `
      <tr>
        <td class="inc-label" data-i18n="${label1Key}">${I18n.t(label1Key)}</td>
        <td><input type="number" class="inc-input mp-field" data-field="${field1}" value="${data[field1] || ''}" inputmode="numeric"></td>
        <td class="inc-label" data-i18n="${label2Key}">${I18n.t(label2Key)}</td>
        <td><input type="number" class="inc-input mp-field" data-field="${field2}" value="${data[field2] || ''}" inputmode="numeric"></td>
      </tr>
    `;
  }
  // ---- Wire all event listeners ----
  let isModified = false;

  function markModified() {
    isModified = true;
    const saveBtn = container.querySelector('#mp-save-btn');
    if (saveBtn) {
      saveBtn.style.backgroundColor = 'var(--color-success)';
      saveBtn.style.color = 'white';
      saveBtn.style.boxShadow = '0 0 12px rgba(16,185,129,0.3)';
    }
    Router.registerBeforeNavigate(handleBeforeNavigate);
    window.addEventListener('beforeunload', handleBeforeUnload);
  }

  function handleBeforeNavigate(targetPage) {
    if (isModified) {
      showUnsavedDialog(() => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        isModified = false;
        Router.navigate(targetPage, { force: true });
      });
      return false;
    }
    window.removeEventListener('beforeunload', handleBeforeUnload);
    return true;
  }

  function handleBeforeUnload(e) {
    if (isModified) {
      e.preventDefault();
      e.returnValue = '';
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
        <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: var(--space-lg); line-height: 1.5;">
          ${I18n.getLang() === 'bn' 
            ? 'আপনার মাসিক পরিকল্পনায় অসংরক্ষিত তথ্য রয়েছে। চলে যাওয়ার আগে কি সংরক্ষণ করতে চান?' 
            : 'You have unsaved changes in your Monthly Plan. Would you like to save them before leaving?'}
        </p>
        
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
      await savePlan();
      overlay.remove();
      Router.clearBeforeNavigate();
      proceedCallback();
    });
    
    // Discard button click
    overlay.querySelector('#unsaved-discard-btn').addEventListener('click', () => {
      overlay.remove();
      Router.clearBeforeNavigate();
      proceedCallback();
    });
    
    // Cancel button click
    overlay.querySelector('#unsaved-cancel-btn').addEventListener('click', () => {
      overlay.remove();
    });
  }

  function wireEvents() {
    // Month navigation
    const prevBtn = container.querySelector('#mp-prev-month');
    const nextBtn = container.querySelector('#mp-next-month');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const action = () => {
          currentMonth--;
          if (currentMonth < 1) {
            currentMonth = 12;
            currentYear--;
          }
          isModified = false;
          Router.clearBeforeNavigate();
          renderPage();
        };
        if (isModified) {
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
          isModified = false;
          Router.clearBeforeNavigate();
          renderPage();
        };
        if (isModified) {
          showUnsavedDialog(action);
        } else {
          action();
        }
      });
    }

    // Mark modified on input or change for all form fields
    const allFields = container.querySelectorAll('.mp-field');
    allFields.forEach(field => {
      field.addEventListener('input', () => markModified());
      field.addEventListener('change', () => markModified());
    });

    // Save button
    const saveBtn = container.querySelector('#mp-save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        await savePlan();
        isModified = false;
        Router.clearBeforeNavigate();
        window.removeEventListener('beforeunload', handleBeforeUnload);
        saveBtn.removeAttribute('style'); // Restore style
        App.showToast(I18n.t('monthly.saved'), 'success');
      });
    }

    // Submit button
    const submitBtn = container.querySelector('#mp-submit-btn');
    if (submitBtn) {
      submitBtn.addEventListener('click', async () => {
        const data = collectFormData();
        await DB.saveMonthlyPlan(data);
        await DB.markMonthlySubmitted(currentYear, currentMonth);
        try {
          await Sync.submitMonthlyReport(data);
          isModified = false;
          Router.clearBeforeNavigate();
          window.removeEventListener('beforeunload', handleBeforeUnload);
          if (saveBtn) saveBtn.removeAttribute('style');
          App.showToast(I18n.t('monthly.submitted'), 'success');
        } catch (err) {
          console.error("Submission failed:", err);
          App.showToast('Submission failed! Make sure you are logged in.', 'error');
        }
      });
    }
  }

  // ---- Collect all field values from the DOM ----
  function collectFormData() {
    const data = {
      year: currentYear,
      month: currentMonth,
    };
    const allFields = container.querySelectorAll('.mp-field');
    allFields.forEach(field => {
      const key = field.getAttribute('data-field');
      if (key) {
        data[key] = field.value;
      }
    });
    return data;
  }

  // ---- Save plan to IndexedDB ----
  async function savePlan() {
    const data = collectFormData();
    await DB.saveMonthlyPlan(data);
  }

  // ---- Initial render ----
  await renderPage();
});
