// Service Worker for Sakhi push notifications

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

const REMINDER_MESSAGES = [
  "Hey! 👋 Don't forget to log your day. Your future self will thank you! 🌟",
  "✨ Daily check-in time! What did you crush today?",
  "🔥 Streak alert! Log your tasks to keep the fire burning.",
  "Your journal misses you! 📖 Take 2 minutes to reflect.",
  "🎯 Every day logged is a step toward your best year ever!",
  "Psst... your productivity companion is waiting! 💪",
  "One small log, one giant leap for your goals! 🚀",
  "🌙 Day's almost over — capture it before it fades!",
  "Don't break the chain! ⛓️ Log today's wins now.",
  "You showed up today. Now let's make it official! ✅",
];

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    scheduleNightlyCheck();
  }
  if (event.data && event.data.type === 'CHECK_AND_NOTIFY') {
    // triggered from the page
    const msg = REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];
    self.registration.showNotification('Sakhi 📓', {
      body: msg,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'daily-reminder',
      requireInteraction: false,
    });
  }
});

function scheduleNightlyCheck() {
  // No-op in SW; scheduling done in main thread via setInterval/timeout
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      if (clients.length > 0) {
        clients[0].focus();
      } else {
        self.clients.openWindow('/');
      }
    })
  );
});
