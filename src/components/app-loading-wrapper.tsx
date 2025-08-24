"use client";

import { useEffect, useState } from 'react';
import LoadingSpinner from './loading-spinner';

interface AppLoadingWrapperProps {
  children: React.ReactNode;
}

export default function AppLoadingWrapper({ children }: AppLoadingWrapperProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    // Simulate app loading process
    const simulateLoading = () => {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setIsLoading(false);
            }, 500);
            return 100;
          }
          return prev + Math.random() * 20;
        });
      }, 150);

      return () => clearInterval(interval);
    };

    // Start loading simulation
    simulateLoading();

    // Also check if the app is actually ready
    const checkAppReady = () => {
      // Check if key components are loaded
      if (document.readyState === 'complete') {
        setTimeout(() => {
          setIsLoading(false);
        }, 1000);
      }
    };

    // Listen for app ready events
    window.addEventListener('load', checkAppReady);
    document.addEventListener('DOMContentLoaded', checkAppReady);

    // Fallback: hide spinner after 3 seconds max
    const fallbackTimer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => {
      window.removeEventListener('load', checkAppReady);
      document.removeEventListener('DOMContentLoaded', checkAppReady);
      clearTimeout(fallbackTimer);
    };
  }, []);

  if (isLoading) {
    return <LoadingSpinner isLoading={true} />;
  }

  return <>{children}</>;
}
