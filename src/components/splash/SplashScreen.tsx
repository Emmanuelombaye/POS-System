import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import "./SplashScreen.css";

interface SplashScreenProps {
  onComplete?: () => void;
  duration?: number; // milliseconds before auto-transition
}

export const SplashScreen = ({ onComplete, duration = 3000 }: SplashScreenProps) => {
  const [isComplete, setIsComplete] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsComplete(true);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <div className={`splash-container ${isComplete ? "splash-exit" : ""}`}>
      {/* Background with gradient */}
      <div className="splash-background">
        <div className="splash-gradient-overlay"></div>
      </div>

      {/* Main content */}
      <div className="splash-content">
        {/* Logo with fade-in and scale animation */}
        <motion.div
          className="splash-logo-wrapper"
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 1.2,
            ease: "easeOut",
            type: "spring",
            stiffness: 50,
            damping: 15,
          }}
        >
          {logoLoaded && (
            <img
              src="/logo.png"
              alt="Eden Drop Butchery Logo"
              className="splash-logo"
              onError={(e) => {
                console.error('Logo failed to load:', e);
                setLogoLoaded(false);
              }}
              onLoad={() => setLogoLoaded(true)}
            />
          )}
          {!logoLoaded && (
            <div className="splash-logo-fallback">
              <span className="splash-logo-text">E</span>
            </div>
          )}
          {/* Glow effect */}
          <div className="splash-logo-glow"></div>
        </motion.div>

        {/* Animated EdenDrop001 text */}
        <motion.div
          className="splash-title-wrapper"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.5,
            ease: "easeOut",
          }}
        >
          <h1 className="splash-title">
            <span className="title-eden">Eden</span>
            <span className="title-drop">Drop</span>
            <span className="title-zero">001</span>
          </h1>
          <p className="splash-subtitle">Premium Butchery POS</p>
        </motion.div>

        {/* Animated loading dots */}
        <motion.div
          className="splash-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.8,
            delay: 1,
            ease: "easeOut",
          }}
        >
          <span className="loader-dot"></span>
          <span className="loader-dot"></span>
          <span className="loader-dot"></span>
        </motion.div>
      </div>

      {/* Bottom tagline */}
      <motion.div
        className="splash-footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{
          duration: 1,
          delay: 1.5,
        }}
      >
        <p className="splash-tagline">Booting up...</p>
      </motion.div>
    </div>
  );
};
