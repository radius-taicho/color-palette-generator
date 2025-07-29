'use client';

import React, { useState, useCallback } from 'react';
import { Download, Share2, Save, Palette, Sparkles, Copy, Heart, Trash2, X } from 'lucide-react';
import { PaletteDisplayProps, MixedColor } from '../types/color';
import { exportToCss, exportToJson, copyToClipboard, generateColorId } from '../utils/colorUtils';
import ElementaryColorMixer from './ElementaryColorMixer';

export default function ElementaryPaletteDisplay({ palette, onSave, onShare, theme }: PaletteDisplayProps) {
  const [mixedColors, setMixedColors] = useState<MixedColor[]>([]);
  const [sparkleColor, setSparkleColor] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [duplicateNotification, setDuplicateNotification] = useState<string | null>(null);

  // 色がクリックされたときのキラキラエフェクト＆コピー
  const handleColorClick = useCallback(async (colorHex: string) => {
    setSparkleColor(colorHex);
    await copyToClipboard(colorHex);
    
    setTimeout(() => setSparkleColor(null), 800);
  }, []);

  // 色混ぜの結果を処理（重複チェック付き）
  const handleColorMixed = useCallback((mixedColor: MixedColor) => {
    setMixedColors(prev => {
      // 同じ色（hex値）が既に存在するかチェック
      const isDuplicate = prev.some(existingColor => existingColor.hex === mixedColor.hex);
      
      if (isDuplicate) {
        // 重複している場合は通知を表示して追加しない
        setDuplicateNotification(`同じ色（${mixedColor.hex}）がすでにあるよ！`);
        setTimeout(() => setDuplicateNotification(null), 2000);
        return prev;
      }
      
      // 重複していない場合は追加（最新6個まで保存）
      return [mixedColor, ...prev].slice(0, 6);
    });
  }, []);

  // 混ぜた色を削除
  const handleRemoveMixedColor = useCallback((colorToRemove: MixedColor, index: number) => {
    setMixedColors(prev => prev.filter((_, i) => i !== index));
  }, []);

  // 全ての混ぜた色をクリア
  const handleClearAllMixedColors = useCallback(() => {
    setMixedColors([]);
  }, []);

  // エクスポート処理
  const handleExport = useCallback(async (format: string) => {
    const allColors = [...palette.colors, ...mixedColors];
    let exportData = '';
    let filename = `${palette.name || 'palette'}.${format}`;
    
    switch (format) {
      case 'css':
        exportData = exportToCss(allColors, palette.name);
        break;
      case 'json':
        exportData = exportToJson(allColors, palette.name);
        break;
      case 'text':
        exportData = allColors.map(color => color.hex).join('\n');
        filename = `${palette.name || 'palette'}.txt`;
        break;
    }
    
    const blob = new Blob([exportData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setShowExportMenu(false);
  }, [palette, mixedColors]);

  // 共有処理
  const handleShare = useCallback(() => {
    const allColors = [...palette.colors, ...mixedColors];
    if (navigator.share) {
      navigator.share({
        title: `🎨 ${palette.name}`,
        text: `すてきな色をみつけたよ！\n${allColors.map(c => c.hex).join(', ')}`,
        url: window.location.href
      });
    } else {
      copyToClipboard(window.location.href);
    }
    
    onShare?.();
  }, [palette, mixedColors, onShare]);

  // 混ぜた色も含めてすべての色を表示
  const allColors = [...palette.colors, ...mixedColors];

  return (
    <div className="w-full space-y-6">
      {/* コンパクトなヘッダー */}
      <div className="bg-gradient-to-r from-pink-200 to-purple-200 dark:from-pink-900/30 dark:to-purple-900/30 rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mr-3">
              <Palette className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                🌈 {palette.name || 'きれいな色たち'}
              </h1>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                クリックでコピー、ドラッグで混ぜよう！
              </p>
            </div>
          </div>
          
          {/* アクションボタン群 */}
          <div className="flex flex-wrap gap-2">
            {onSave && (
              <button
                onClick={onSave}
                className="px-4 py-2 bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 text-white font-bold rounded-full shadow-lg transform transition-all duration-300 hover:scale-105 text-sm"
              >
                <Heart className="h-4 w-4 mr-1 inline" />
                ほぞん
              </button>
            )}
            
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-4 py-2 bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white font-bold rounded-full shadow-lg transform transition-all duration-300 hover:scale-105 text-sm"
              >
                <Download className="h-4 w-4 mr-1 inline" />
                だうんろーど
              </button>
              
              {showExportMenu && (
                <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border-2 border-yellow-300 p-2 z-10 min-w-max">
                  <button
                    onClick={() => handleExport('css')}
                    className="block w-full text-left px-3 py-2 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded-lg text-sm font-medium"
                  >
                    🎨 CSS
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className="block w-full text-left px-3 py-2 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded-lg text-sm font-medium"
                  >
                    📄 JSON
                  </button>
                  <button
                    onClick={() => handleExport('text')}
                    className="block w-full text-left px-3 py-2 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded-lg text-sm font-medium"
                  >
                    📝 テキスト
                  </button>
                </div>
              )}
            </div>
            
            <button
              onClick={handleShare}
              className="px-4 py-2 bg-gradient-to-r from-blue-400 to-indigo-500 hover:from-blue-500 hover:to-indigo-600 text-white font-bold rounded-full shadow-lg transform transition-all duration-300 hover:scale-105 text-sm"
            >
              <Share2 className="h-4 w-4 mr-1 inline" />
              シェア
            </button>
          </div>
        </div>
      </div>

      {/* メイン：色混ぜ機能（統合版） */}
      <ElementaryColorMixer
        colors={palette.colors.map(c => ({ ...c, id: c.id || generateColorId() }))}
        onColorMixed={handleColorMixed}
        theme="elementary"
      />

      {/* 重複通知 */}
      {duplicateNotification && (
        <div className="bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500 p-4 rounded-lg mb-4">
          <div className="flex items-center">
            <div className="text-yellow-600 dark:text-yellow-400 mr-2">⚠️</div>
            <p className="text-yellow-700 dark:text-yellow-300 font-medium">
              {duplicateNotification}
            </p>
          </div>
        </div>
      )}

      {/* 作った色のギャラリー */}
      {mixedColors.length > 0 && (
        <div className="bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl p-4 shadow-xl border-2 border-green-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              ✨ つくった色のコレクション ({mixedColors.length}色)
            </h2>
            <button
              onClick={handleClearAllMixedColors}
              className="px-3 py-1 bg-red-400 hover:bg-red-500 text-white text-sm font-bold rounded-full transition-colors flex items-center"
              title="全ての混ぜた色を削除"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              全削除
            </button>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {mixedColors.map((color, index) => (
              <div
                key={`mixed-${color.hex}-${index}`}
                className="group relative transform transition-all duration-300 hover:scale-110"
              >
                {/* 削除ボタン */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveMixedColor(color, index);
                  }}
                  className="absolute -top-2 -right-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg"
                  title="この色を削除"
                >
                  <X className="h-3 w-3" />
                </button>
                
                <div
                  className={`aspect-square rounded-xl shadow-lg border-2 border-white relative overflow-hidden cursor-pointer ${
                    sparkleColor === color.hex ? 'animate-pulse ring-4 ring-yellow-400' : ''
                  }`}
                  style={{ backgroundColor: color.hex }}
                  onClick={() => handleColorClick(color.hex)}
                >
                  {/* 混合アイコン */}
                  <div className="absolute top-1 right-1 bg-yellow-400 rounded-full p-0.5">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                  
                  {/* キラキラエフェクト */}
                  {sparkleColor === color.hex && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-yellow-300 animate-spin" />
                    </div>
                  )}
                  
                  {/* ホバー時のコピーアイコン */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Copy className="h-4 w-4 text-white" />
                  </div>
                </div>
                
                {/* 色の情報 */}
                <div className="text-center mt-1">
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                    {color.hex}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* クイックプレビューストライプ */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
        <h3 className="text-sm font-bold text-center mb-2 text-gray-700 dark:text-gray-300">
          🌈 ぜんぶの色（{allColors.length}色）
        </h3>
        <div className="flex h-8 rounded-lg overflow-hidden shadow-lg">
          {allColors.map((color, index) => (
            <div
              key={`stripe-${color.hex}-${index}`}
              className="flex-1 cursor-pointer hover:opacity-80 transition-opacity"
              style={{ backgroundColor: color.hex }}
              onClick={() => handleColorClick(color.hex)}
              title={`${color.name} (${color.hex})`}
            />
          ))}
        </div>
        <p className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400">
          クリックで色をコピーできるよ！
        </p>
      </div>

      {/* 外部クリック時にメニューを閉じる */}
      {showExportMenu && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowExportMenu(false)}
        />
      )}
    </div>
  );
}
