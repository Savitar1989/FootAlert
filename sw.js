
/* eslint-disable no-restricted-globals */

// This Service Worker handles Push Notifications even when the app is closed.

self.addEventListener('install', (event) => {
  self.skipWaiting();
  console.log('FootAlert Service Worker Installed');
});

self.addEventListener('activate', (event) => {
  console.log('FootAlert Service Worker Activated');
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const title = data.title || 'FootAlert Hit!';
  const options = {
    body: data.body || 'A strategy condition has been met.',
    icon: 'https://cdn-icons-png.flaticon.com/512/53/53283.png', // Soccer ball icon
    badge: 'https://cdn-icons-png.flaticon.com/512/53/53283.png',
    data: {
      url: data.url || '/'
    },
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // If a window is already open, focus it.
      for (let client of windowClients) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window.
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
