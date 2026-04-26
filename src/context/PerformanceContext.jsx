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
      frameCount++;
      const delta = currentTime - lastTime;

      // Calculate FPS every second
      if (delta >= 1000) {
        const currentFps = Math.round((frameCount * 1000) / delta);
        setFps(currentFps);
        
        // If FPS is below 30 for 3 consecutive seconds, trigger low performance mode
        if (currentFps < 30) {
          lowFpsCount++;
          if (lowFpsCount >= 3) {
            console.warn(`[Siber Performans] FPS ${currentFps} seviyesine düştü. Düşük Güç Modu Aktif Ediliyor (Efektler Hafifletilecek).`);
            setIsLowPerformanceMode(true);
          }
        } else if (currentFps > 45) {
          lowFpsCount = 0;
          setIsLowPerformanceMode(false);
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

    const updateBatteryStatus = (battery) => {
      const isLowAndNotCharging = battery.level <= 0.20 && !battery.charging;
      console.log(`[Siber Pil] Pil Seviyesi: %${Math.round(battery.level * 100)} - Şarj Oluyor mu: ${battery.charging}`);
      
      if (isLowAndNotCharging) {
        console.warn("[Siber Pil] Düşük pil tespit edildi. Pil Tasarruf Modu Mühürlendi!");
        setIsLowPowerMode(true);
      } else {
        setIsLowPowerMode(false);
      }
    };

    if ('getBattery' in navigator) {
      navigator.getBattery().then((battery) => {
        batteryInstance = battery;
        updateBatteryStatus(battery);

        // Listen for changes
        battery.addEventListener('levelchange', () => updateBatteryStatus(battery));
        battery.addEventListener('chargingchange', () => updateBatteryStatus(battery));
      }).catch(err => {
        console.warn("[Siber Pil] Pil API desteklenmiyor veya reddedildi:", err);
      });
    }

    return () => {
      if (batteryInstance) {
        batteryInstance.removeEventListener('levelchange', () => updateBatteryStatus(batteryInstance));
        batteryInstance.removeEventListener('chargingchange', () => updateBatteryStatus(batteryInstance));
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
