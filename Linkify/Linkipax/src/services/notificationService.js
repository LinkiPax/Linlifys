import axios from "axios";

const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

class NotificationService {
  constructor() {
    this.registration = null;
    this.subscription = null;
    this.isSupported =
      "serviceWorker" in navigator && // Fixed typo here
      "PushManager" in window &&
      "Notification" in window;
    this.subscriptionCheckInterval = null;
  }

  /**
   * Initialize the service worker and set up periodic checks
   */
  async init() {
    if (!this.isSupported) {
      console.warn("Push notifications not supported in this browser");
      return false;
    }

    try {
      // Clear any existing service workers
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let registration of registrations) {
        await registration.unregister();
      }

      // Register new service worker
      this.registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      console.log("Service Worker registered:", this.registration);

      // Set up periodic subscription checks (every hour)
      this.subscriptionCheckInterval = setInterval(
        () => this.checkAndRenewSubscription(),
        3600000
      );

      return true;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      return false;
    }
  }

  /**
   * Check current subscription status and renew if needed
   */
  async checkAndRenewSubscription() {
    if (!this.isSupported) return false;

    try {
      this.subscription = await this.registration.pushManager.getSubscription();

      if (!this.subscription) {
        console.log("No active subscription found");
        return false;
      }

      // Check if subscription is expired or about to expire
      const expirationTime = this.subscription.expirationTime;
      if (expirationTime && Date.now() > expirationTime - 86400000) {
        // 1 day before expiration
        console.log("Subscription nearing expiration, renewing...");
        await this.unsubscribe();
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error checking subscription:", error);
      return false;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(userId) {
    if (!this.isSupported) {
      console.warn("Push notifications not supported");
      return false;
    }

    if (!publicVapidKey) {
      console.error("VAPID public key is not defined");
      return false;
    }

    if (!this.registration) {
      const initSuccess = await this.init();
      if (!initSuccess) return false;
    }

    try {
      // Verify notification permission
      if (Notification.permission !== "granted") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.warn("Notification permission denied");
          return false;
        }
      }

      // Convert VAPID key
      const applicationServerKey = this.urlBase64ToUint8Array(publicVapidKey);

      // Subscribe to push service
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      // Send subscription to backend
      const apiUrl = import.meta.env.VITE_API_URL || "";
      await axios.post(
        `${apiUrl}/api/notifications/subscribe`,
        {
          userId,
          subscription: this.subscription,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Successfully subscribed to push notifications");
      return this.subscription;
    } catch (error) {
      console.error("Subscription failed:", error);

      // Handle specific error cases
      if (error.message.includes("subscription failed")) {
        console.error("Possible VAPID key mismatch");
      } else if (error.response?.status === 401) {
        console.error("Authentication failed");
      }

      return false;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe() {
    if (!this.isSupported || !this.subscription) {
      return false;
    }

    try {
      // Unsubscribe from push service
      const success = await this.subscription.unsubscribe();
      if (!success) {
        console.warn("Unsubscribe returned false");
      }

      // Inform backend about unsubscription
      const apiUrl = import.meta.env.VITE_API_URL || "";
      await axios.post(
        `${apiUrl}/api/notifications/unsubscribe`,
        {
          subscription: this.subscription,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      this.subscription = null;
      return true;
    } catch (error) {
      console.error("Unsubscription failed:", error);
      return false;
    }
  }

  /**
   * Convert VAPID key from URL-safe base64 to Uint8Array
   */
  urlBase64ToUint8Array(base64String) {
    if (!base64String) {
      throw new Error("Base64 string is required for VAPID key conversion");
    }

    // Validate key format
    if (!base64String.match(/^[A-Za-z0-9_-]+$/)) {
      throw new Error("Invalid VAPID public key format");
    }

    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.subscriptionCheckInterval) {
      clearInterval(this.subscriptionCheckInterval);
    }
  }

  // Debugging helpers
  logSubscriptionDetails() {
    if (!this.subscription) {
      console.log("No active subscription");
      return;
    }

    console.log("Subscription details:", {
      endpoint: this.subscription.endpoint,
      expirationTime: this.subscription.expirationTime,
      keys: this.subscription.options.applicationServerKey,
    });
  }

  checkPermission() {
    return Notification.permission;
  }
}

// Export as singleton instance
const notificationService = new NotificationService();
export default notificationService;