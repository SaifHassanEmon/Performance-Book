/* ============================================================
   Salat Times Page
   Calculates and displays daily, Nafl, and forbidden salat times
   based on geolocation or Dhaka defaults, offline-cached.
   ============================================================ */

Router.register('salat', async function (container) {

  // Current date helpers
  const now = new Date();
  const dateStr = now.toLocaleDateString(I18n.getLang() === 'bn' ? 'bn-BD' : 'en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  // Base layout structure
  container.innerHTML = `
    <!-- Header/Greeting replacement inside page context -->
    <div class="salat-tracker-section" style="margin-top: var(--space-md);">
      <div id="salat-tracker-root">
        <div class="salat-card-green" style="display: flex; align-items: center; justify-content: center; min-height: 140px;">
          <div style="color: white; font-weight: 600; font-size: 0.9rem; display: flex; align-items: center; gap: 8px;">
            <svg class="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" stroke-dasharray="8"></circle><path d="M4 12a8 8 0 0 1 8-8" stroke="white"></path></svg>
            <span>Loading timings...</span>
          </div>
        </div>
      </div>
    </div>
  `;

  // Salat Tracker Helper Functions
  function getCoordinates() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ lat: 23.8103, lon: 90.4125, isDefault: true });
        return;
      }
      
      let resolved = false;
      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve({ lat: 23.8103, lon: 90.4125, isDefault: true });
        }
      }, 3000);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, isDefault: false });
          }
        },
        (err) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            resolve({ lat: 23.8103, lon: 90.4125, isDefault: true });
          }
        },
        { enableHighAccuracy: false, timeout: 3000, maximumAge: 300000 }
      );
    });
  }

  async function getSalatTimings(lat, lon) {
    const todayKey = new Date().toISOString().split('T')[0];
    const cacheKey = `salat_timings_${todayKey}_${lat.toFixed(3)}_${lon.toFixed(3)}`;
    
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }
    
    try {
      const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=1&school=1`);
      if (!res.ok) throw new Error('API response not ok');
      const json = await res.json();
      if (json && json.data) {
        localStorage.setItem(cacheKey, JSON.stringify(json.data));
        return json.data;
      }
    } catch (err) {
      console.warn('Failed to fetch salat timings online, using offline defaults:', err);
    }
    
    return getOfflineDhakaDefaults();
  }

  function getOfflineDhakaDefaults() {
    return {
      timings: {
        Fajr: "03:45",
        Sunrise: "05:13",
        Dhuhr: "12:01",
        Asr: "16:41",
        Sunset: "18:49",
        Maghrib: "18:49",
        Isha: "20:17",
        Imsak: "03:35",
        Midnight: "00:01"
      },
      date: {
        hijri: {
          day: "10",
          month: {
            number: 1
          },
          year: "1448"
        }
      },
      meta: {
        timezone: "Asia/Dhaka"
      }
    };
  }

  function getLocationName(timezone, isDefault) {
    if (isDefault || !timezone) return I18n.t('salat.locationDefault');
    const parts = timezone.split('/');
    if (parts.length > 1) {
      return parts[1].replace(/_/g, ' ');
    }
    return I18n.t('salat.locationDefault');
  }

  function translateDigits(str, lang) {
    if (lang !== 'bn' || !str) return str;
    const digits = {
      '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
      '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
    };
    return str.replace(/[0-9]/g, m => digits[m]);
  }

  function getCurrentInterval(now, timings) {
    const parseTime = (timeStr, isNextDay = false) => {
      const [h, m] = timeStr.split(':').map(Number);
      const d = new Date(now);
      d.setHours(h, m, 0, 0);
      if (isNextDay) d.setDate(d.getDate() + 1);
      return d;
    };
    
    const parsePrevTime = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      const d = new Date(now);
      d.setDate(d.getDate() - 1);
      d.setHours(h, m, 0, 0);
      return d;
    };

    const times = {
      fajr: parseTime(timings.Fajr),
      sunrise: parseTime(timings.Sunrise),
      dhuhr: parseTime(timings.Dhuhr),
      asr: parseTime(timings.Asr),
      maghrib: parseTime(timings.Sunset),
      isha: parseTime(timings.Isha),
      fajrNext: parseTime(timings.Fajr, true),
      ishaPrev: parsePrevTime(timings.Isha)
    };

    if (now >= times.fajr && now < times.sunrise) {
      return { name: 'fajr', start: times.fajr, end: times.sunrise };
    } else if (now >= times.sunrise && now < times.dhuhr) {
      return { name: 'sunrise', start: times.sunrise, end: times.dhuhr };
    } else if (now >= times.dhuhr && now < times.asr) {
      return { name: 'zuhr', start: times.dhuhr, end: times.asr };
    } else if (now >= times.asr && now < times.maghrib) {
      return { name: 'asr', start: times.asr, end: times.maghrib };
    } else if (now >= times.maghrib && now < times.isha) {
      return { name: 'maghrib', start: times.maghrib, end: times.isha };
    } else if (now >= times.isha && now < times.fajrNext) {
      return { name: 'isha', start: times.isha, end: times.fajrNext };
    } else {
      return { name: 'isha', start: times.ishaPrev, end: times.fajr };
    }
  }

  function calculateTahajjud(timings) {
    const now = new Date();
    const [sh, sm] = timings.Sunset.split(':').map(Number);
    const [fh, fm] = timings.Fajr.split(':').map(Number);
    
    const sunset = new Date(now);
    sunset.setHours(sh, sm, 0, 0);
    
    const fajrNext = new Date(now);
    fajrNext.setDate(fajrNext.getDate() + 1);
    fajrNext.setHours(fh, fm, 0, 0);
    
    const nightMs = fajrNext - sunset;
    const thirdMs = nightMs / 3;
    
    const tahajjudStart = new Date(fajrNext - thirdMs);
    const h = tahajjudStart.getHours();
    const m = tahajjudStart.getMinutes();
    
    return {
      start: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      end: timings.Fajr
    };
  }

  function format12h(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const h12 = h % 12 || 12;
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  function formatDiff(diffMs, lang) {
    if (diffMs < 0) return lang === 'bn' ? '০ মিনিট' : '0m';
    const diffMins = Math.ceil(diffMs / 60000);
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    if (lang === 'bn') {
      if (hrs > 0) {
        return `${translateDigits(String(hrs), 'bn')} ঘণ্টা ${translateDigits(String(mins), 'bn')} মিনিট`;
      }
      return `${translateDigits(String(mins), 'bn')} মিনিট`;
    } else {
      if (hrs > 0) {
        return `${hrs}h ${mins}m`;
      }
      return `${mins}m`;
    }
  }

  async function loadSalatTracker() {
    const root = container.querySelector('#salat-tracker-root');
    if (!root) return;

    const coords = await getCoordinates();
    const salatData = await getSalatTimings(coords.lat, coords.lon);
    
    if (!salatData) {
      root.innerHTML = '';
      return;
    }

    const timings = salatData.timings;
    const dateInfo = salatData.date;
    const timezone = salatData.meta.timezone;
    const locationName = getLocationName(timezone, coords.isDefault);
    
    const lang = I18n.getLang();
    const convertDigits = (str) => translateDigits(str, lang);
    
    const hijriMonthsBn = {
      1: "মুহররম", 2: "সফর", 3: "রবিউল আউয়াল", 4: "রবিউস সানি",
      5: "জমাদিউল আউয়াল", 6: "জমাদিউস সানি", 7: "রজব", 8: "শাবান",
      9: "রমজান", 10: "শাওয়াল", 11: "জিলকদ", 12: "জিলহজ্জ"
    };

    const hijriMonthsEn = {
      1: "Muharram", 2: "Safar", 3: "Rabi' al-Awwal", 4: "Rabi' ath-Thani",
      5: "Jumada al-Ula", 6: "Jumada al-Akhirah", 7: "Rajab", 8: "Sha'ban",
      9: "Ramadan", 10: "Shawwal", 11: "Dhu al-Qada", 12: "Dhu al-Hijjah"
    };

    const dayNum = parseInt(dateInfo.hijri.day, 10);
    const monthNum = parseInt(dateInfo.hijri.month.number, 10);
    const yearNum = parseInt(dateInfo.hijri.year, 10);

    const hijriMonth = lang === 'bn' ? hijriMonthsBn[monthNum] : hijriMonthsEn[monthNum];
    const arabicDateStr = lang === 'bn'
      ? `${convertDigits(String(dayNum))}-${hijriMonth}, ${convertDigits(String(yearNum))} হিজরি`
      : `${dayNum} ${hijriMonth}, ${yearNum} ${I18n.t('salat.hijriSuffix')}`;

    const parseTime = (timeStr, isNextDay = false) => {
      const [h, m] = timeStr.split(':').map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      if (isNextDay) d.setDate(d.getDate() + 1);
      return d;
    };

    const addMins = (timeStr, mins) => {
      const [h, m] = timeStr.split(':').map(Number);
      const d = new Date();
      d.setHours(h, m + mins, 0, 0);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    const currentTime = new Date();
    const currentInterval = getCurrentInterval(currentTime, timings);
    
    let prayerKey = currentInterval.name;
    let targetName = '';
    let diffMs = 0;
    let pct = 0;
    
    if (prayerKey === 'sunrise') {
      targetName = I18n.t('salat.zuhrLong');
      diffMs = parseTime(timings.Dhuhr) - currentTime;
      const total = parseTime(timings.Dhuhr) - parseTime(timings.Sunrise);
      const elapsed = currentTime - parseTime(timings.Sunrise);
      pct = Math.max(0, Math.min(100, (elapsed / total) * 100));
    } else {
      targetName = I18n.t('salat.' + prayerKey + 'Long');
      diffMs = currentInterval.end - currentTime;
      const total = currentInterval.end - currentInterval.start;
      const elapsed = currentTime - currentInterval.start;
      pct = Math.max(0, Math.min(100, (elapsed / total) * 100));
    }

    const remainingText = formatDiff(diffMs, lang);
    const format12 = (tStr) => convertDigits(format12h(tStr));
    
    const sunriseDisplay = format12(timings.Sunrise);
    const sunsetDisplay = format12(timings.Sunset);
    const sahriDisplay = format12(timings.Fajr);
    const iftarDisplay = format12(timings.Sunset);

    const tahajjudTimes = calculateTahajjud(timings);
    
    const nafl = {
      tahajjud: { start: tahajjudTimes.start, end: tahajjudTimes.end },
      ishrak: { start: addMins(timings.Sunrise, 15), end: addMins(timings.Sunrise, 45) },
      chasht: { start: addMins(timings.Sunrise, 180), end: addMins(timings.Dhuhr, -15) },
      awabin: { start: addMins(timings.Sunset, 10), end: timings.Isha }
    };

    const forbidden = {
      sunrise: { start: timings.Sunrise, end: addMins(timings.Sunrise, 15) },
      zawal: { start: addMins(timings.Dhuhr, -10), end: timings.Dhuhr },
      sunset: { start: addMins(timings.Sunset, -15), end: timings.Sunset }
    };

    root.innerHTML = `
      <div class="salat-location-header">
        <div class="salat-location-info">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span style="font-weight: 800;">${locationName}</span>
        </div>
      </div>

      <div class="salat-card-green">
        <div class="salat-card-bg"></div>
        
        <!-- Circle progress -->
        <div class="salat-circle-container">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="6"></circle>
            <circle cx="50" cy="50" r="42" fill="none" stroke="#a7f3d0" stroke-width="6" stroke-linecap="round" stroke-dasharray="263.89" stroke-dashoffset="${263.89 * (1 - pct / 100)}" transform="rotate(-90 50 50)" style="transition: stroke-dashoffset 0.8s ease;"></circle>
          </svg>
          <div class="salat-circle-text">
            <div class="salat-circle-name">${targetName}</div>
            <div class="salat-circle-remaining">${remainingText}</div>
            <div class="salat-circle-label">${I18n.t('salat.remaining')}</div>
          </div>
        </div>

        <!-- Info right -->
        <div class="salat-info-right">
          <div class="salat-hijri-date">${arabicDateStr}</div>
          <div class="salat-timings-mini-grid">
            <div class="salat-mini-item">
              <span>🌅</span>
              <span style="opacity: 0.85; margin: 0 3px;">${I18n.t('salat.sunrise')}:</span>
              <strong>${sunriseDisplay}</strong>
            </div>
            <div class="salat-mini-item">
              <span>🌇</span>
              <span style="opacity: 0.85; margin: 0 3px;">${I18n.t('salat.sunset')}:</span>
              <strong>${sunsetDisplay}</strong>
            </div>
            <div class="salat-mini-item">
              <span>🍲</span>
              <span style="opacity: 0.85; margin: 0 3px;">${I18n.t('salat.sahriLast')}:</span>
              <strong>${sahriDisplay}</strong>
            </div>
            <div class="salat-mini-item">
              <span>🕌</span>
              <span style="opacity: 0.85; margin: 0 3px;">${I18n.t('salat.iftarTime')}:</span>
              <strong>${iftarDisplay}</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="salat-tabs">
        <button class="salat-tab-btn active" data-tab="waktu">${I18n.t('salat.tabWaktu')}</button>
        <button class="salat-tab-btn" data-tab="nafl">${I18n.t('salat.tabNafl')}</button>
        <button class="salat-tab-btn" data-tab="forbidden">${I18n.t('salat.tabForbidden')}</button>
      </div>

      <!-- Lists -->
      <div class="salat-list-wrapper">
        <!-- 1. Waktu list -->
        <div id="salat-waktu-list" class="salat-list-container">
          ${renderWaktRow(I18n.t('salat.fajrLong'), '🌅', timings.Fajr, timings.Sunrise, prayerKey === 'fajr')}
          ${renderWaktRow(I18n.t('salat.zuhrLong'), '☀️', timings.Dhuhr, timings.Asr, prayerKey === 'zuhr')}
          ${renderWaktRow(I18n.t('salat.asrLong'), '🌤️', timings.Asr, timings.Sunset, prayerKey === 'asr')}
          ${renderWaktRow(I18n.t('salat.maghribLong'), '🌇', timings.Sunset, timings.Isha, prayerKey === 'maghrib')}
          ${renderWaktRow(I18n.t('salat.ishaLong'), '🌙', timings.Isha, "23:45", prayerKey === 'isha')}
        </div>

        <!-- 2. Nafl list -->
        <div id="salat-nafl-list" class="salat-list-container" style="display: none;">
          ${renderWaktRow(I18n.t('salat.tahajjud'), '✨', nafl.tahajjud.start, nafl.tahajjud.end, false)}
          ${renderWaktRow(I18n.t('salat.ishrak'), '🌤️', nafl.ishrak.start, nafl.ishrak.end, false)}
          ${renderWaktRow(I18n.t('salat.chasht'), '☀️', nafl.chasht.start, nafl.chasht.end, false)}
          ${renderWaktRow(I18n.t('salat.awabin'), '✨', nafl.awabin.start, nafl.awabin.end, false)}
        </div>

        <!-- 3. Forbidden list -->
        <div id="salat-forbidden-list" class="salat-list-container" style="display: none;">
          ${renderWaktRow(I18n.t('salat.forbiddenSunrise'), '🚫', forbidden.sunrise.start, forbidden.sunrise.end, false)}
          ${renderWaktRow(I18n.t('salat.forbiddenZawal'), '🚫', forbidden.zawal.start, forbidden.zawal.end, false)}
          ${renderWaktRow(I18n.t('salat.forbiddenSunset'), '🚫', forbidden.sunset.start, forbidden.sunset.end, false)}
        </div>
      </div>
    `;

    const tabBtns = root.querySelectorAll('.salat-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const tabName = btn.getAttribute('data-tab');
        root.querySelectorAll('.salat-list-container').forEach(list => {
          list.style.display = 'none';
        });
        root.querySelector(`#salat-${tabName}-list`).style.display = 'block';
      });
    });

    function renderWaktRow(name, icon, start, end, isActive) {
      return `
        <div class="salat-row ${isActive ? 'active' : ''}">
          <div class="salat-row-left">
            <span class="salat-row-icon">${icon}</span>
            <span class="salat-row-name">${name}</span>
          </div>
          <div class="salat-row-right">
            <span>${format12(start)}</span>
            <span class="salat-row-dash">—</span>
            <span>${format12(end)}</span>
          </div>
        </div>
      `;
    }
  }

  // Load the widget
  loadSalatTracker();
});
