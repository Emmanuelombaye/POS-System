/**
 * PWA Auto-Update & Versioning System
 * 
 * Features:
 * - Automatic service worker updates
 * - Version checking on app load
 * - User notification for updates
 * - Zero-downtime deployment
 * - Cache busting and cleanup
 */

// Version file that gets updated during deployment
export const APP_VERSION = "2.0.2";
export const BUILD_DATE = "2026-02-06";

// Check for updates on app load
export async function checkForUpdates() {
  try {
    // Fetch version info from server
    const response = await fetch("/version.json", {
      cache: "no-store", // Always get fresh version
    });

    if (!response.ok) {
      console.log("[UPDATE] version.json not found - development mode");
      return { hasUpdate: false };
    }

    const versionData = await response.json();
    const currentVersion = APP_VERSION;
    const latestVersion = versionData.version;

    console.log(`[UPDATE] Current: ${currentVersion}, Latest: ${latestVersion}`);

    if (latestVersion !== currentVersion) {
      return {
        hasUpdate: true,
        currentVersion,
        latestVersion,
        buildDate: versionData.buildDate,
        changelog: versionData.changelog || "New version available",
      };
    }

    return { hasUpdate: false };
  } catch (error) {
    console.warn("[UPDATE] Failed to check for updates:", error);
    return { hasUpdate: false };
  }
}

// Register service worker with update checking
export async function registerServiceWorkerWithUpdates() {
  if (!("serviceWorker" in navigator)) {
    console.log("[PWA] Service Worker not supported");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(`/service-worker.js?v=${APP_VERSION}`, {
      scope: "/",
      type: "module",
    });

    console.log("[PWA] Service Worker registered successfully");

    // Check for updates on a regular interval
    setInterval(async () => {
      console.log("[PWA] Checking for service worker updates...");
      await registration.update();
    }, 60000); // Check every 1 minute

    // Listen for service worker updates
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;

      newWorker?.addEventListener("statechange", () => {
        if (newWorker.state === "activated") {
          // New service worker activated
          console.log("[PWA] New service worker activated!");
          notifyUpdateAvailable();
        }
      });
    });

    // Handle controller change (new version active)
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      console.log("[PWA] New service worker is now controlling the page");
      notifyAppUpdated();
    });

    return registration;
  } catch (error) {
    console.error("[PWA] Service Worker registration failed:", error);
    return null;
  }
}

// Notify user that update is available
export function notifyUpdateAvailable() {
  // Create notification UI
  const notificationBar = document.createElement("div");
  notificationBar.id = "update-notification";
  notificationBar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-weight: 500;
    gap: 16px;
  `;

  notificationBar.innerHTML = `
    <span style="flex: 1;">
      🎉 <strong>New version available!</strong> Refresh to update.
    </span>
    <button id="update-refresh" style="
      background: white;
      color: #667eea;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      font-size: 14px;
    ">Refresh Now</button>
    <button id="update-dismiss" style="
      background: rgba(255,255,255,0.2);
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    ">Later</button>
  `;

  document.body.insertBefore(notificationBar, document.body.firstChild);

  // Handle refresh button
  document.getElementById("update-refresh")?.addEventListener("click", () => {
    window.location.reload();
  });

  // Handle dismiss button
  document.getElementById("update-dismiss")?.addEventListener("click", () => {
    notificationBar.remove();
  });

  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    if (notificationBar.parentElement) {
      notificationBar.remove();
    }
  }, 10000);
}

// Notify that app was updated
export function notifyAppUpdated() {
  // Show success message
  const successBar = document.createElement("div");
  successBar.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: #10b981;
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    z-index: 10001;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-weight: 500;
  `;

  successBar.innerHTML = `✅ App updated successfully!`;

  document.body.appendChild(successBar);

  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    successBar.remove();
  }, 3000);
}

// Force immediate update
export async function forceUpdate() {
  if (!("serviceWorker" in navigator)) {
    console.log("[UPDATE] Service Worker not supported");
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();

    for (const registration of registrations) {
      // Request update
      await registration.update();

      // If new version waiting, skip waiting
      if (registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }
    }

    // Reload after a brief delay
    setTimeout(() => {
      window.location.reload();
    }, 500);
  } catch (error) {
    console.error("[UPDATE] Failed to force update:", error);
  }
}

// Get current app version
export function getAppVersion(): string {
  return APP_VERSION;
}

// Check if running PWA
export function isPWA(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes("android-app://")
  );
}

// Initialize auto-update on app load
export async function initializeAutoUpdate() {
  console.log("[UPDATE] Initializing auto-update system...");

  // Register service worker
  await registerServiceWorkerWithUpdates();

  // Check for updates on load
  const updateStatus = await checkForUpdates();

  if (updateStatus.hasUpdate) {
    console.log(
      `[UPDATE] Update available: ${updateStatus.currentVersion} -> ${updateStatus.latestVersion}`
    );
  } else {
    console.log("[UPDATE] App is up to date");
  }

  // Store version info
  sessionStorage.setItem("appVersion", APP_VERSION);
  localStorage.setItem("lastVersionCheck", new Date().toISOString());
}

// Version file generator (run during build)
export function generateVersionFile(
  version: string,
  changelog: string
): string {
  return JSON.stringify(
    {
      version,
      buildDate: new Date().toISOString(),
      changelog,
      features: ["Auto-update", "Offline support", "Real-time sync"],
    },
    null,
    2
  );
}
