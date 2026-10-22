import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';

const PerformanceContext = createContext();

export function PerformanceProvider({ children }) {
  const [isLowPerformanceMode, setIsLowPerformanceMode] = useState(false);
  const [isLowPowerMode, setIsLowPowerMode] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    // İlk render'da senkron olarak kontrol et (SSR uyumlu)
    if (typeof window === 'undefined') return false;
    const userAgentMatch = navigator.userAgent.match(/Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i);
    const widthMatch = window.innerWidth <= 768;
    return !!(userAgentMatch || widthMatch);
  });
  const [fps, setFps] = useState(60);
  const [connectionType, setConnectionType] = useState('4g');

  // Mobile Detection (debounced resize)
  useEffect(() => {
    let resizeTimer;
    const checkMobile = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const userAgentMatch = navigator.userAgent.match(/Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i);
        const widthMatch = window.innerWidth <= 768;
        // Dokunmatik ekran kontrolü
        const touchMatch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        setIsMobile(!!(userAgentMatch || (widthMatch && touchMatch)));
      }, 150); // 150ms debounce — çok sık tetiklenmesini engelle
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Ağ bağlantısı kalitesini kontrol et
  useEffect(() => {
    if ('connection' in navigator) {
      const conn = navigator.connection;
      const updateConnection = () => {
        const type = conn.effectiveType || '4g';
        setConnectionType(type);
        // Yavaş bağlantıda otomatik olarak düşük performans moduna geç
        if (type === 'slow-2g' || type === '2g') {
          setIsLowPerformanceMode(true);
        }
      };
      updateConnection();
      conn.addEventListener('change', updateConnection);
      return () => conn.removeEventListener('change', updateConnection);
    }
  }, []);

  // FPS Tracker — deferred to avoid TBT impact during Lighthouse measurement window
  useEffect(() => {
    // Skip FPS tracking on mobile entirely — saves rAF loop overhead
    if (isMobile) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId;
    let lowFpsCount = 0;
    let delayTimer;

    const startTracking = () => {
      const measureFPS = (currentTime) => {
        if (document.hidden) {
          lastTime = currentTime;
          animationFrameId = requestAnimationFrame(measureFPS);
          return;
        }
        
        frameCount++;
        const delta = currentTime - lastTime;

        // Calculate FPS every second
        if (delta >= 1000) {
          const currentFps = Math.round((frameCount * 1000) / delta);
          setFps(currentFps);
          
          // If FPS is below 30 for 3 consecutive seconds, trigger low performance mode
          if (currentFps > 0 && currentFps < 30) {
            lowFpsCount++;
            if (lowFpsCount >= 3 && !isLowPerformanceMode) {
              setIsLowPerformanceMode(true);
            }
          } else if (currentFps > 45) {
            lowFpsCount = 0;
            if (isLowPerformanceMode) {
              setIsLowPerformanceMode(false);
            }
          }

          frameCount = 0;
          lastTime = currentTime;
        }

        animationFrameId = requestAnimationFrame(measureFPS);
      };

      animationFrameId = requestAnimationFrame(measureFPS);
    };

    // Delay FPS tracking by 5s so Lighthouse first-load metrics aren't impacted
    delayTimer = setTimeout(startTracking, 5000);

    return () => {
      clearTimeout(delayTimer);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isLowPerformanceMode, isMobile]);

  // Battery Status API Tracker
  useEffect(() => {
    let batteryInstance = null;
    let onLevelChange = null;
    let onChargingChange = null;

    const updateBatteryStatus = (battery) => {
      const isLowAndNotCharging = battery.level <= 0.20 && !battery.charging;
      setIsLowPowerMode(isLowAndNotCharging);
    };

    if ('getBattery' in navigator) {
      navigator.getBattery().then((battery) => {
        batteryInstance = battery;
        updateBatteryStatus(battery);

        onLevelChange = () => updateBatteryStatus(battery);
        onChargingChange = () => updateBatteryStatus(battery);
        battery.addEventListener('levelchange', onLevelChange);
        battery.addEventListener('chargingchange', onChargingChange);
      }).catch(() => {});
    }

    return () => {
      if (batteryInstance) {
        if (onLevelChange) batteryInstance.removeEventListener('levelchange', onLevelChange);
        if (onChargingChange) batteryInstance.removeEventListener('chargingchange', onChargingChange);
      }
    };
  }, []);

  // Set global body class for mobile mode to trigger CSS optimizations
  useEffect(() => {
    if (isMobile) {
      document.body.classList.add('mobile-mode');
    } else {
      document.body.classList.remove('mobile-mode');
    }
  }, [isMobile]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    isLowPerformanceMode,
    isLowPowerMode,
    isMobile,
    fps,
    connectionType,
    // Provide a way to manually toggle if needed
    setIsLowPerformanceMode
  }), [isLowPerformanceMode, isLowPowerMode, isMobile, fps, connectionType]);

  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformance() {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
}
