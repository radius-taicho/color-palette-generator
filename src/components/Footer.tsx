'use client';

import React, { useState, useCallback, useEffect } from 'react';

export default function Footer() {
  // レスポンシブpadding計算
  const getResponsivePadding = useCallback(() => {
    if (typeof window === 'undefined') return '32px';
    
    const width = window.innerWidth;
    if (width >= 1280) return '80px'; // xl以上
    if (width >= 1024) return '64px'; // lg以上
    if (width >= 640) return '40px';  // sm以上
    return '32px'; // デフォルト
  }, []);

  const [currentPadding, setCurrentPadding] = useState('32px');

  useEffect(() => {
    const updatePadding = () => {
      setCurrentPadding(getResponsivePadding());
    };
    
    updatePadding();
    window.addEventListener('resize', updatePadding);
    
    return () => window.removeEventListener('resize', updatePadding);
  }, [getResponsivePadding]);
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div 
        className="w-full py-8 lg:py-12"
        style={{
          paddingLeft: currentPadding,
          paddingRight: currentPadding
        }}
      >
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p className="text-sm lg:text-base xl:text-lg">
            © 2025 Color Palette Generator. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
