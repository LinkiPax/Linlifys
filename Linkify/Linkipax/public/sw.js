// Improved service worker with better lifecycle management
const CACHE_NAME = 'push-notifications-v1';
const DEFAULT_ICON = '/icons/notification-icon-192x192.png';
const DEFAULT_BADGE = '/icons/badge-72x72.png';

// Install event - Cache important assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll([
        DEFAULT_ICON,
        DEFAULT_BADGE,
        '/',
        '/notifications'
      ]))
      .then(() => self.skipWaiting()) // Force activation
  );
});

// Activate event - Clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      console.log('Service worker activated and ready to handle push events');
      return self.clients.claim();
    })
  );
});

// Push event handler with better error handling and notification management
self.addEventListener('push', (event) => {
  console.log('Push event received', event);
  
  // Ensure the event.waitUntil promise chain is properly maintained
  event.waitUntil(
    (async () => {
      let notificationData;
      
      try {
        notificationData = event.data?.json() || {
          title: 'New Notification',
          body: 'You have a new notification'
        };
      } catch (e) {
        console.warn('Failed to parse push data:', e);
        notificationData = {
          title: 'Notification',
          body: event.data?.text() || 'New update available'
        };
      }

      // Create a unique tag for each notification to prevent duplicates
      const tag = notificationData.tag || `notif-${Date.now()}`;
      
      const notificationOptions = {
        body: notificationData.body || notificationData.message,
        icon: notificationData.icon || DEFAULT_ICON,
        badge: notificationData.badge || DEFAULT_BADGE,
        image: notificationData.image,
        vibrate: notificationData.vibrate || [200, 100, 200],
        requireInteraction: !!notificationData.requireInteraction,
        tag: tag, // Important for notification grouping/replacement
        renotify: true, // Allow updating existing notifications
        data: {
          url: notificationData.url || '/notifications',
          notificationId: notificationData.notificationId || tag,
          clickTimestamp: Date.now()
        },
        actions: notificationData.actions || []
      };

      try {
        await self.registration.showNotification(
          notificationData.title || 'New Notification',
          notificationOptions
        );
        console.log('Notification shown successfully');
      } catch (err) {
        console.error('Failed to show notification:', err);
        // Fallback to simpler notification if the first attempt fails
        await self.registration.showNotification('New Notification', {
          body: notificationData.body || 'You have a new notification',
          icon: DEFAULT_ICON
        });
      }
    })()
  );
});

// Enhanced notification click handler with analytics
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.notification);
  event.notification.close();
  
  // Extract URL from notification data or use default
  const urlToOpen = new URL(
    event.notification.data?.url || '/notifications',
    self.location.origin
  );
  
  // Add click timestamp to URL for tracking
  urlToOpen.searchParams.set('notificationClickTime', event.notification.data.clickTimestamp);
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(windowClients => {
      // Check if there's already a matching window
      const matchingClient = windowClients.find(client => {
        const clientUrl = new URL(client.url);
        return clientUrl.pathname === urlToOpen.pathname;
      });

      if (matchingClient) {
        // Focus existing window
        return matchingClient.focus().then(() => {
          // Optionally post a message to the client
          matchingClient.postMessage({
            type: 'NOTIFICATION_CLICK',
            notificationId: event.notification.data.notificationId
          });
        });
      } else {
        // Open new window if no match found
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background sync or periodic sync can be added here for better reliability