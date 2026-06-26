/* ============================================================
   Practical Page (Legend & Reference)
   Displays full forms and explanations of tracking symbols.
   ============================================================ */

Router.register('practical-page', async function (container) {
  function renderPage() {
    container.innerHTML = `
      <div class="legend-grid" style="display: flex; flex-direction: column; gap: var(--space-lg); margin-bottom: var(--space-2xl);">
        
        <!-- Library & Resources Link -->
        <div class="glass-card legend-category" style="border: 1px solid var(--color-primary-glow); background: linear-gradient(135deg, rgba(16, 185, 129, 0.06), rgba(4, 120, 87, 0.02));">
          <div class="section-header legend-category-header" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <div style="display: flex; align-items: center; gap: var(--space-sm);">
              <div class="section-icon">📚</div>
              <div class="section-title" data-i18n="practical.libraryTitle" style="font-weight: 700;">${I18n.t('practical.libraryTitle')}</div>
            </div>
            <a href="https://www.icsbook.info/" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="padding: 6px 12px; font-size: 0.8rem; height: auto; text-decoration: none; border-radius: var(--radius-sm); font-weight: 600; display: inline-flex; align-items: center; gap: 4px; border: none; cursor: pointer; color: #fff; background: var(--color-primary);">
              <span data-i18n="practical.visitLibrary">${I18n.t('practical.visitLibrary')}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
            </a>
          </div>
          <div style="margin-top: var(--space-md);">
            <p data-i18n="practical.libraryDesc" style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.6; margin: 0;">
              ${I18n.t('practical.libraryDesc')}
            </p>
          </div>
        </div>

        <!-- Category 1: Holy Quran -->
        <div class="glass-card legend-category">
          <div class="section-header legend-category-header">
            <div class="section-icon">📖</div>
            <div class="section-title" data-i18n="practical.holyQuran">${I18n.t('practical.holyQuran')}</div>
          </div>
          <div class="legend-items" style="display: flex; flex-direction: column; gap: var(--space-md); margin-top: var(--space-md);">
            <div class="legend-item" style="display: flex; align-items: center; gap: var(--space-md);">
              <span class="legend-symbol" style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: rgba(16, 185, 129, 0.12); color: var(--green-400); border-radius: var(--radius-sm); font-weight: 700; font-size: 0.875rem;">S</span>
              <span data-i18n="practical.sDesc" style="font-size: 0.875rem; color: var(--text-secondary);">${I18n.t('practical.sDesc')}</span>
            </div>
            <div class="legend-item" style="display: flex; align-items: center; gap: var(--space-md);">
              <span class="legend-symbol" style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: rgba(16, 185, 129, 0.12); color: var(--green-400); border-radius: var(--radius-sm); font-weight: 700; font-size: 0.875rem;">T</span>
              <span data-i18n="practical.tDesc" style="font-size: 0.875rem; color: var(--text-secondary);">${I18n.t('practical.tDesc')}</span>
            </div>
          </div>
        </div>

        <!-- Category 2: Literature -->
        <div class="glass-card legend-category">
          <div class="section-header legend-category-header">
            <div class="section-icon">📕</div>
            <div class="section-title" data-i18n="practical.literature">${I18n.t('practical.literature')}</div>
          </div>
          <div class="legend-items" style="display: flex; flex-direction: column; gap: var(--space-md); margin-top: var(--space-md);">
            <div class="legend-item" style="display: flex; align-items: center; gap: var(--space-md);">
              <span class="legend-symbol" style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: rgba(59, 130, 246, 0.12); color: #60a5fa; border-radius: var(--radius-sm); font-weight: 700; font-size: 0.875rem;">I</span>
              <span data-i18n="practical.iDesc" style="font-size: 0.875rem; color: var(--text-secondary);">${I18n.t('practical.iDesc')}</span>
            </div>
            <div class="legend-item" style="display: flex; align-items: center; gap: var(--space-md);">
              <span class="legend-symbol" style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: rgba(59, 130, 246, 0.12); color: #60a5fa; border-radius: var(--radius-sm); font-weight: 700; font-size: 0.875rem;">G</span>
              <span data-i18n="practical.gDesc" style="font-size: 0.875rem; color: var(--text-secondary);">${I18n.t('practical.gDesc')}</span>
            </div>
          </div>
        </div>

        <!-- Category 3: Class -->
        <div class="glass-card legend-category">
          <div class="section-header legend-category-header">
            <div class="section-icon">🎓</div>
            <div class="section-title" data-i18n="practical.class">${I18n.t('practical.class')}</div>
          </div>
          <div class="legend-items" style="display: flex; flex-direction: column; gap: var(--space-md); margin-top: var(--space-md);">
            <div class="legend-item" style="display: flex; align-items: center; gap: var(--space-md);">
              <span class="legend-symbol" style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: rgba(245, 158, 11, 0.12); color: #fbbf24; border-radius: var(--radius-sm); font-weight: 700; font-size: 0.875rem;">T</span>
              <span data-i18n="practical.tClassDesc" style="font-size: 0.875rem; color: var(--text-secondary);">${I18n.t('practical.tClassDesc')}</span>
            </div>
            <div class="legend-item" style="display: flex; align-items: center; gap: var(--space-md);">
              <span class="legend-symbol" style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: rgba(245, 158, 11, 0.12); color: #fbbf24; border-radius: var(--radius-sm); font-weight: 700; font-size: 0.875rem;">A</span>
              <span data-i18n="practical.aClassDesc" style="font-size: 0.875rem; color: var(--text-secondary);">${I18n.t('practical.aClassDesc')}</span>
            </div>
          </div>
        </div>

        <!-- Category 4: Salat -->
        <div class="glass-card legend-category">
          <div class="section-header legend-category-header">
            <div class="section-icon">🕌</div>
            <div class="section-title" data-i18n="practical.salat">${I18n.t('practical.salat')}</div>
          </div>
          <div class="legend-items" style="display: flex; flex-direction: column; gap: var(--space-md); margin-top: var(--space-md);">
            <div class="legend-item" style="display: flex; align-items: center; gap: var(--space-md);">
              <span class="legend-symbol" style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: rgba(16, 185, 129, 0.12); color: var(--green-400); border-radius: var(--radius-sm); font-weight: 700; font-size: 0.875rem;">Jamat</span>
              <span data-i18n="practical.jamatDesc" style="font-size: 0.875rem; color: var(--text-secondary);">${I18n.t('practical.jamatDesc')}</span>
            </div>
            <div class="legend-item" style="display: flex; align-items: center; gap: var(--space-md);">
              <span class="legend-symbol" style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: rgba(239, 68, 68, 0.12); color: var(--color-error); border-radius: var(--radius-sm); font-weight: 700; font-size: 0.875rem;">Kaja</span>
              <span data-i18n="practical.kajaDesc" style="font-size: 0.875rem; color: var(--text-secondary);">${I18n.t('practical.kajaDesc')}</span>
            </div>
          </div>
        </div>

        <!-- Category 5: Contact (Group 1) -->
        <div class="glass-card legend-category">
          <div class="section-header legend-category-header">
            <div class="section-icon">👥</div>
            <div class="section-title" data-i18n="practical.contact1">${I18n.t('practical.contact1')}</div>
          </div>
          <div class="legend-items" style="display: flex; flex-direction: column; gap: var(--space-md); margin-top: var(--space-md);">
            <div class="legend-item" style="display: flex; align-items: center; gap: var(--space-md);">
              <span class="legend-symbol" style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: rgba(139, 92, 246, 0.12); color: #a78bfa; border-radius: var(--radius-sm); font-weight: 700; font-size: 0.875rem;">M</span>
              <span data-i18n="practical.mDesc" style="font-size: 0.875rem; color: var(--text-secondary);">${I18n.t('practical.mDesc')} (Member)</span>
            </div>
            <div class="legend-item" style="display: flex; align-items: center; gap: var(--space-md);">
              <span class="legend-symbol" style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: rgba(139, 92, 246, 0.12); color: #a78bfa; border-radius: var(--radius-sm); font-weight: 700; font-size: 0.875rem;">A</span>
              <span data-i18n="practical.aDesc" style="font-size: 0.875rem; color: var(--text-secondary);">${I18n.t('practical.aDesc')} (Associate)</span>
            </div>
            <div class="legend-item" style="display: flex; align-items: center; gap: var(--space-md);">
              <span class="legend-symbol" style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: rgba(139, 92, 246, 0.12); color: #a78bfa; border-radius: var(--radius-sm); font-weight: 700; font-size: 0.875rem;">W</span>
              <span data-i18n="practical.wDesc" style="font-size: 0.875rem; color: var(--text-secondary);">${I18n.t('practical.wDesc')} (Worker)</span>
            </div>
            <div class="legend-item" style="display: flex; align-items: center; gap: var(--space-md);">
              <span class="legend-symbol" style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: rgba(139, 92, 246, 0.12); color: #a78bfa; border-radius: var(--radius-sm); font-weight: 700; font-size: 0.875rem;">S</span>
              <span data-i18n="practical.sContactDesc" style="font-size: 0.875rem; color: var(--text-secondary);">${I18n.t('practical.sContactDesc')} (Supporter)</span>
            </div>
          </div>
        </div>

        <!-- Category 6: Contact (Group 2) -->
        <div class="glass-card legend-category">
          <div class="section-header legend-category-header">
            <div class="section-icon">💬</div>
            <div class="section-title" data-i18n="practical.contact2">${I18n.t('practical.contact2')}</div>
          </div>
          <div class="legend-items" style="display: flex; flex-direction: column; gap: var(--space-md); margin-top: var(--space-md);">
            <div class="legend-item" style="display: flex; align-items: center; gap: var(--space-md);">
              <span class="legend-symbol" style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: rgba(139, 92, 246, 0.12); color: #a78bfa; border-radius: var(--radius-sm); font-weight: 700; font-size: 0.875rem;">F</span>
              <span data-i18n="practical.fDesc" style="font-size: 0.875rem; color: var(--text-secondary);">${I18n.t('practical.fDesc')} (Friend)</span>
            </div>
            <div class="legend-item" style="display: flex; align-items: center; gap: var(--space-md);">
              <span class="legend-symbol" style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: rgba(139, 92, 246, 0.12); color: #a78bfa; border-radius: var(--radius-sm); font-weight: 700; font-size: 0.875rem;">MS</span>
              <span data-i18n="practical.msDesc" style="font-size: 0.875rem; color: var(--text-secondary);">${I18n.t('practical.msDesc')} (Meritorious Student)</span>
            </div>
            <div class="legend-item" style="display: flex; align-items: center; gap: var(--space-md);">
              <span class="legend-symbol" style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: rgba(139, 92, 246, 0.12); color: #a78bfa; border-radius: var(--radius-sm); font-weight: 700; font-size: 0.875rem;">WW</span>
              <span data-i18n="practical.wwDesc" style="font-size: 0.875rem; color: var(--text-secondary);">${I18n.t('practical.wwDesc')} (Well Wisher)</span>
            </div>
            <div class="legend-item" style="display: flex; align-items: center; gap: var(--space-md);">
              <span class="legend-symbol" style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: rgba(139, 92, 246, 0.12); color: #a78bfa; border-radius: var(--radius-sm); font-weight: 700; font-size: 0.875rem;">R</span>
              <span data-i18n="practical.rDesc" style="font-size: 0.875rem; color: var(--text-secondary);">${I18n.t('practical.rDesc')} (Reader)</span>
            </div>
          </div>
        </div>

        <!-- Category 7: Social Media Browsing -->
        <div class="glass-card legend-category">
          <div class="section-header legend-category-header">
            <div class="section-icon">📱</div>
            <div class="section-title" data-i18n="practical.socialMedia">${I18n.t('practical.socialMedia')}</div>
          </div>
          <div class="legend-items" style="margin-top: var(--space-md);">
            <p data-i18n="practical.socialMediaDesc" style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.6;">${I18n.t('practical.socialMediaDesc')}</p>
          </div>
        </div>

      </div>
    `;
    I18n.applyLanguage();
  }

  renderPage();
});
