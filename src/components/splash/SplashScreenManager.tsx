import { useState, useEffect } from "react";
import { SplashScreen } from "./SplashScreen";

interface SplashScreenManagerProps {
  children: React.ReactNode;
  duration?: number;
  showSplashOnMount?: boolean;
}

/**
 * SplashScreenManager
 * Manages the display of the splash screen on app boot
 * Shows splash for specified duration, then reveals the app
 * 
 * Props:
 *   - children: React components to render after splash
 *   - duration: How long to show splash (default 3000ms)
 *   - showSplashOnMount: Whether to show splash (default true)
 */
export const SplashScreenManager = ({
  children,
  duration = 3000,
  showSplashOnMount = true,
}: SplashScreenManagerProps) => {
  const [showSplash, setShowSplash] = useState(showSplashOnMount);

  useEffect(() => {
    // Only show splash if explicitly enabled and it hasn't been shown this session
    const splashShown = sessionStorage.getItem("splash-shown");
    if (splashShown) {
      setShowSplash(false);
      return;
    }

    if (showSplashOnMount) {
      const timer = setTimeout(() => {
        setShowSplash(false);
        // Mark splash as shown for this session
        sessionStorage.setItem("splash-shown", "true");
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [showSplashOnMount, duration]);

  return (
    <>
      {showSplash && (
        <SplashScreen
          duration={duration}
          onComplete={() => {
            setShowSplash(false);
            sessionStorage.setItem("splash-shown", "true");
          }}
        />
      )}
      {children}
    </>
  );
};
