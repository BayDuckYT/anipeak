import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const PerformanceContext = createContext();

export function PerformanceProvider({ children }) {
  const [isLowPerformanceMode, setIsLowPerformanceMode] = useState(false);
  const [isLowPowerMode, setIsLowPowerMode] = useState(false);
  const [fps, setFps] = useState(60);

  // FPS Tracker
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId;
    let lowFpsCount = 0;

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

    return () => cancelAnimationFrame(animationFrameId);
  }, [isLowPerformanceMode]);

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

  const contextValue = {
    isLowPerformanceMode,
    isLowPowerMode,
    fps,
    // Provide a way to manually toggle if needed
    setIsLowPerformanceMode
  };

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
