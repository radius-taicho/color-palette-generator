'use client';

import React from 'react';
import { X, Info, HelpCircle } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  colorCount: number;
  onColorCountChange: (count: number) => void;
  onShowHowToUse: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  colorCount,
  onColorCountChange,
  onShowHowToUse
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* オーバーレイ */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      ></div>
      
      {/* モーダル */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 lg:p-8 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl lg:text-2xl font-bold text-gray-800 dark:text-white">
            ⚙️ 設定
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 設定内容 */}
        <div className="space-y-6">
          {/* 抽出色数設定 */}
          <div>
            <label className="block text-base lg:text-lg font-medium text-gray-700 dark:text-gray-300 mb-3">
              抽出する色の数
            </label>
            <select
              value={colorCount}
              onChange={(e) => onColorCountChange(parseInt(e.target.value))}
              className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <option key={num} value={num}>{num}色</option>
              ))}
            </select>
            <div className="flex items-start space-x-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>多い色数ほど詳細な分析が可能ですが、処理時間が長くなります</span>
            </div>
          </div>

          {/* 使い方ボタン */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onShowHowToUse}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <HelpCircle className="h-5 w-5" />
              <span className="font-medium">このアプリの使い方</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
