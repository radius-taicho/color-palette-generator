'use client';

import React, { useRef, useEffect } from 'react';
import { Info, HelpCircle } from 'lucide-react';

interface SettingsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  colorCount: number;
  onColorCountChange: (count: number) => void;
  onShowHowToUse: () => void;
}

export default function SettingsDropdown({
  isOpen,
  onClose,
  colorCount,
  onColorCountChange,
  onShowHowToUse
}: SettingsDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
    >
      {/* 抽出色数設定 */}
      <div className="px-4 py-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          抽出する色の数
        </label>
        <select
          value={colorCount}
          onChange={(e) => onColorCountChange(parseInt(e.target.value))}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {[3, 4, 5, 6, 7, 8, 9, 10].map(num => (
            <option key={num} value={num}>{num}色</option>
          ))}
        </select>
        <div className="flex items-start space-x-2 mt-2 text-xs text-gray-600 dark:text-gray-400">
          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>多い色数ほど詳細な分析が可能ですが、処理時間が長くなります</span>
        </div>
      </div>

      {/* セクション区切り線 */}
      <div className="border-t border-gray-200 dark:border-gray-700"></div>

      {/* 使い方ボタン */}
      <div className="px-4 py-4">
        <button
          onClick={onShowHowToUse}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm font-medium"
        >
          <HelpCircle className="h-4 w-4" />
          <span>このアプリの使い方</span>
        </button>
      </div>
    </div>
  );
}
