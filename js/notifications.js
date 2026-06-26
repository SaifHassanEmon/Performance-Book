/* ============================================================
   Notifications Module
   Provides local browser push notifications for daily report reminders
   and prayer times, checking user settings stored in Dexie/IndexedDB.
   ============================================================ */

const Notifications = (() => {

  // Mock standard prayer times (normally obtained via GPS & API, fall back to these)
  const defaultPrayerTimes = [
    { name: 'Fajr', time: '04:30' },
    { name: 'Dhuhr', time: '12:30' },
    { name: 'Asr', time: '16:30' },
    { name: 'Maghrib', time: '18:45' },
    { name: 'Isha', time: '20:15' }
  ];

  let checkInterval = null;
  let lastCheckedDate = '';

  // Initialize notifications module
  async function init() {
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notifications');
      return;
    }

    // Run check once on start
    checkReminders();

    // Set interval to check every minute
    checkInterval = setInterval(checkReminders, 60000);
  }

  // Request browser notification permissions
  async function requestPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  // Main scheduler checks
  async function checkReminders() {
    const now = new Date();
    const currentHourStr = String(now.getHours()).padStart(2, '0');
    const currentMinStr = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${currentHourStr}:${currentMinStr}`;
    const todayDateStr = now.toISOString().split('T')[0];

    const salatEnabled = await DB.getSetting('salatReminder') ?? false;
    const dailyEnabled = await DB.getSetting('dailyReminder') ?? false;

    // 1. Salat Reminders
    if (salatEnabled && Notification.permission === 'granted') {
      const match = defaultPrayerTimes.find(pt => pt.time === currentTime);
      if (match) {
        showNotification(
          `Time for ${match.name}`,
          `Assalamu Alaikum! It is time to perform ${match.name} prayer.`
        );
      }
    }

    // 2. Daily Report Reminders (fired at 9:00 PM if today's log is empty)
    if (dailyEnabled && currentTime === '21:00' && todayDateStr !== lastCheckedDate && Notification.permission === 'granted') {
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const day = now.getDate();

      const rate = await DB.getDayCompletionRate(year, month, day);
      if (rate === 0) {
        showNotification(
          "Performance Book Reminder",
          "Assalamu Alaikum! Please don't forget to fill out your daily tracking logs for today."
        );
        lastCheckedDate = todayDateStr; // Avoid double triggering within the same minute
      }
    }
  }

  // Display the notification card
  function showNotification(title, body) {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body: body,
        icon: 'icons/icon-192.png'
      });
    }
  }

  return {
    init,
    requestPermission,
    showNotification
  };
})();

// Notifications module is exported globally. It will be initialized in app.js after DB init.
