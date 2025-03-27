import { useState, useEffect } from 'react';

interface UseLoadingDotsOptions {
  count?: number;
  interval?: number;
}

export function useLoadingDots({ count = 3, interval = 300 }: UseLoadingDotsOptions = {}) {
  const [dots, setDots] = useState<number[]>(Array(count).fill(0));
  
  useEffect(() => {
    let currentIndex = 0;
    
    const intervalId = setInterval(() => {
      setDots(prev => {
        const newDots = Array(count).fill(0);
        newDots[currentIndex] = 1;
        return newDots;
      });
      
      currentIndex = (currentIndex + 1) % count;
    }, interval);
    
    return () => clearInterval(intervalId);
  }, [count, interval]);
  
  return dots;
} 