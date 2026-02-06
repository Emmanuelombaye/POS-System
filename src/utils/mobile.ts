/**
 * Mobile & Touch Optimization Utilities
 * Enhances UX for mobile and tablet devices
 */

/**
 * Detect if device is mobile
 */
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

/**
 * Detect if device is tablet
 */
export const isTablet = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  return /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent);
};

/**
 * Detect if device is iOS
 */
export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

/**
 * Detect if device is Android
 */
export const isAndroid = () => {
  return /Android/i.test(navigator.userAgent);
};

/**
 * Check if device supports touch
 */
export const isTouchDevice = () => {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
};

/**
 * Get device info
 */
export const getDeviceInfo = () => {
  return {
    isMobile: isMobile(),
    isTablet: isTablet(),
    isIOS: isIOS(),
    isAndroid: isAndroid(),
    isTouch: isTouchDevice(),
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
  };
};

/**
 * Prevent pull-to-refresh on mobile
 */
export const preventPullToRefresh = () => {
  let lastTouchY = 0;
  
  document.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    lastTouchY = e.touches[0].clientY;
  }, { passive: false });

  document.addEventListener('touchmove', (e) => {
    const touchY = e.touches[0].clientY;
    const touchYDelta = touchY - lastTouchY;
    lastTouchY = touchY;

    if (window.scrollY === 0 && touchYDelta > 0) {
      e.preventDefault();
    }
  }, { passive: false });
};

/**
 * Prevent zoom on double-tap (for specific elements)
 */
export const preventDoubleTapZoom = (element: HTMLElement) => {
  let lastTap = 0;
  element.addEventListener('touchend', (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    if (tapLength < 500 && tapLength > 0) {
      e.preventDefault();
    }
    lastTap = currentTime;
  });
};

/**
 * Vibrate device (if supported)
 */
export const vibrate = (pattern: number | number[] = 50) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

/**
 * Request fullscreen mode
 */
export const requestFullscreen = async (element: HTMLElement = document.documentElement) => {
  try {
    if (element.requestFullscreen) {
      await element.requestFullscreen();
    } else if ((element as any).webkitRequestFullscreen) {
      await (element as any).webkitRequestFullscreen();
    } else if ((element as any).msRequestFullscreen) {
      await (element as any).msRequestFullscreen();
    }
    return true;
  } catch (error) {
    console.error('Fullscreen request failed:', error);
    return false;
  }
};

/**
 * Exit fullscreen mode
 */
export const exitFullscreen = async () => {
  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      await (document as any).webkitExitFullscreen();
    } else if ((document as any).msExitFullscreen) {
      await (document as any).msExitFullscreen();
    }
    return true;
  } catch (error) {
    console.error('Exit fullscreen failed:', error);
    return false;
  }
};

/**
 * Lock screen orientation (mobile)
 */
export const lockOrientation = async (orientation: 'portrait' | 'landscape' = 'portrait') => {
  try {
    if ('orientation' in screen && 'lock' in (screen as any).orientation) {
      await (screen as any).orientation.lock(orientation);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Orientation lock failed:', error);
    return false;
  }
};

/**
 * Keep screen awake (prevent sleep)
 */
export const requestWakeLock = async () => {
  try {
    if ('wakeLock' in navigator) {
      const wakeLock = await (navigator as any).wakeLock.request('screen');
      console.log('Screen wake lock acquired');
      return wakeLock;
    }
    return null;
  } catch (error) {
    console.error('Wake lock request failed:', error);
    return null;
  }
};
