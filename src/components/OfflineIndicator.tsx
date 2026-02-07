import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Download, RefreshCw } from "lucide-react";
import { useOfflineStore } from "@/store/offlineStore";
import { useAppStore } from "@/store/appStore";
import { showInstallPrompt, isAppInstalled } from "@/utils/pwa";
import { Button } from "./ui/button";

export const OfflineIndicator = () => {
  const { isOnline, pendingTransactions } = useOfflineStore();
  const { currentUser, lastLoginMode } = useAppStore();
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    setInstalled(isAppInstalled());
    
    // Show install button if not installed and prompt is available
    const checkInstallable = () => {
      if (!isAppInstalled()) {
        setShowInstallButton(true);
      }
    };

    window.addEventListener('beforeinstallprompt', checkInstallable);
    return () => window.removeEventListener('beforeinstallprompt', checkInstallable);
  }, []);

  useEffect(() => {
    if (!isOnline) {
      setShowOfflineBanner(true);
      const timer = window.setTimeout(() => {
        setShowOfflineBanner(false);
      }, 2000);
      return () => window.clearTimeout(timer);
    }

    setShowOfflineBanner(false);
    return undefined;
  }, [isOnline]);

  const handleInstall = async () => {
    const accepted = await showInstallPrompt();
    if (accepted) {
      setShowInstallButton(false);
      setInstalled(true);
    }
  };

  return (
    <>
      {/* Offline/Online Status Bar */}
      <AnimatePresence>
        {showOfflineBanner && !isOnline && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[100] bg-red-600 text-white px-4 py-2 shadow-lg"
          >
            <div className="flex items-center justify-center gap-2 text-sm font-semibold">
              <WifiOff className="h-4 w-4 animate-pulse" />
              <span>You're offline - Changes will sync when connection returns</span>
              {pendingTransactions.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                  {pendingTransactions.length} pending
                </span>
              )}
            </div>
          </motion.div>
        )}

        {isOnline && pendingTransactions.length > 0 && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[100] bg-green-600 text-white px-4 py-2 shadow-lg"
          >
            <div className="flex items-center justify-center gap-2 text-sm font-semibold">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Syncing {pendingTransactions.length} transactions...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Install App Button (PWA) */}
      <AnimatePresence>
        {showInstallButton && !installed && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <Button
              onClick={handleInstall}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-2xl flex items-center gap-2 px-6 py-6 text-base font-bold"
            >
              <Download className="h-5 w-5" />
              Install App
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Offline Badge */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            className={`fixed z-50 ${showInstallButton && !installed ? "bottom-20 right-4" : "bottom-4 right-4"}`}
          >
            <div className="flex items-center gap-2 rounded-full bg-red-600 text-white px-3 py-1 text-xs font-semibold shadow-lg">
              <WifiOff className="h-3 w-3" />
              {currentUser && lastLoginMode === "offline" ? "Offline (local login)" : "Offline"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>


    </>
  );
};
