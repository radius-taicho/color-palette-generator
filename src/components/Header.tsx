'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Palette, Settings, Sparkles, Briefcase } from 'lucide-react';
import { PaletteTheme } from '../types/color';
import SettingsDropdown from './SettingsDropdown';

interface HeaderProps {
  paletteTheme: PaletteTheme;
  onThemeChange: (theme: PaletteTheme) => void;
  showSettings: boolean;
  onToggleSettings: () => void;
  currentPalette: any;
  colorCount: number;
  onColorCountChange: (count: number) => void;
  onShowHowToUse: () => void;
}

export default function Header({
  paletteTheme,
  onThemeChange,
  showSettings,
  onToggleSettings,
  currentPalette,
  colorCount,
  onColorCountChange,
  onShowHowToUse
}: HeaderProps) {
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
  // テーマ情報
  const themeInfo = {
    elementary: {
      name: '子供向け',
      description: 'おおきくて楽しいパレット',
      color: 'from-pink-400 to-purple-400',
      icon: Sparkles
    },
    middle: {
      name: '大人向け',
      description: 'プロ向け高機能パレット',
      color: 'from-blue-400 to-green-400',
      icon: Briefcase
    }
  };

  return (
    <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div 
        className="w-full"
        style={{
          paddingLeft: currentPadding,
          paddingRight: currentPadding
        }}
      >
        <div className="flex items-center justify-between h-16 lg:h-20 xl:h-24">
          <div className="flex items-center space-x-3 lg:space-x-6">
            <div className={`p-3 lg:p-4 xl:p-5 bg-gradient-to-r ${themeInfo[paletteTheme].color} rounded-lg lg:rounded-xl`}>
              <Palette className="h-8 w-8 lg:h-10 lg:w-10 xl:h-12 xl:w-12 text-white" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl xl:text-3xl font-bold text-gray-800 dark:text-white">
                Color Palette Generator
              </h1>
              <p className="text-sm lg:text-base xl:text-lg text-gray-600 dark:text-gray-400">
                画像から美しいカラーパレットを生成
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 lg:space-x-6">
            {/* パレットスタイル切り替え */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {(Object.keys(themeInfo) as PaletteTheme[]).map((theme) => {
                const info = themeInfo[theme];
                const Icon = info.icon;
                return (
                  <button
                    key={theme}
                    onClick={() => onThemeChange(theme)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md font-medium transition-all duration-200 text-sm cursor-pointer ${
                      paletteTheme === theme
                        ? `bg-gradient-to-r ${info.color} text-white shadow-md`
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
                    }`}
                    title={info.description}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{info.name}</span>
                  </button>
                );
              })}
            </div>

            {/* 設定ボタンとドロップダウン */}
            <div className="relative">
              <button
                onClick={onToggleSettings}
                className="p-3 lg:p-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors cursor-pointer"
                title="設定"
              >
                <Settings className="h-6 w-6 lg:h-8 lg:w-8 xl:h-10 xl:w-10" />
              </button>
              
              <SettingsDropdown
                isOpen={showSettings}
                onClose={onToggleSettings}
                colorCount={colorCount}
                onColorCountChange={onColorCountChange}
                onShowHowToUse={onShowHowToUse}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
