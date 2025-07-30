'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Palette, Sparkles, Copy, Trash2, Plus, Droplets, Heart, Download, Share2 } from 'lucide-react';
import { ColorInfo, MixedColor, ColorMixerProps } from '../types/color';
import { mixColors, mixMultipleColors, copyToClipboard, generateColorId } from '../utils/colorUtils';

export default function ElementaryColorMixer({ 
  colors, 
  onColorMixed, 
  theme, 
  extractedColors = [],
  onSave,
  onShare,
  onReset,
  showExportMenu = false,
  onToggleExportMenu,
  onExport
}: ColorMixerProps) {
  // 3つのミキサー用の状態
  const [mixingColors1, setMixingColors1] = useState<ColorInfo[]>([]);
  const [mixingColors2, setMixingColors2] = useState<ColorInfo[]>([]);
  const [mixingColors3, setMixingColors3] = useState<ColorInfo[]>([]);
  const [mixedColor1, setMixedColor1] = useState<MixedColor | null>(null);
  const [mixedColor2, setMixedColor2] = useState<MixedColor | null>(null);
  const [mixedColor3, setMixedColor3] = useState<MixedColor | null>(null);
  const [sparkleEffect, setSparkleEffect] = useState<string | null>(null);
  const [dragOverMixer, setDragOverMixer] = useState<number | null>(null);
  const [animatingMixer, setAnimatingMixer] = useState<number | null>(null);
  const [touchingColor, setTouchingColor] = useState<ColorInfo | null>(null);
  const [activeMixer, setActiveMixer] = useState<number | null>(null); // どのミキサーがアクティブか
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const mixer1Ref = useRef<HTMLDivElement>(null);
  const mixer2Ref = useRef<HTMLDivElement>(null);
  const mixer3Ref = useRef<HTMLDivElement>(null);
  const processingRef = useRef<{[key: number]: boolean}>({1: false, 2: false, 3: false});
  const lastMixedRef = useRef<{[key: number]: string}>({1: '', 2: '', 3: ''}); // 各ミキサーごとの前回の混合結果を記録

  // ダークモード検出
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark') || 
                     window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDark);
    };
    
    checkDarkMode();
    
    // ダークモードの変更を監視
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addListener(checkDarkMode);
    
    return () => {
      observer.disconnect();
      mediaQuery.removeListener(checkDarkMode);
    };
  }, []);

  // ミキサーごとの状態を取得するヘルパー関数
  const getMixingColors = useCallback((mixerIndex: number): ColorInfo[] => {
    switch (mixerIndex) {
      case 1: return mixingColors1;
      case 2: return mixingColors2;
      case 3: return mixingColors3;
      default: return [];
    }
  }, [mixingColors1, mixingColors2, mixingColors3]);

  const setMixingColors = useCallback((mixerIndex: number, colors: ColorInfo[]) => {
    switch (mixerIndex) {
      case 1: setMixingColors1(colors); break;
      case 2: setMixingColors2(colors); break;
      case 3: setMixingColors3(colors); break;
    }
  }, []);

  const getMixedColor = useCallback((mixerIndex: number): MixedColor | null => {
    switch (mixerIndex) {
      case 1: return mixedColor1;
      case 2: return mixedColor2;
      case 3: return mixedColor3;
      default: return null;
    }
  }, [mixedColor1, mixedColor2, mixedColor3]);

  const setMixedColor = useCallback((mixerIndex: number, color: MixedColor | null) => {
    switch (mixerIndex) {
      case 1: setMixedColor1(color); break;
      case 2: setMixedColor2(color); break;
      case 3: setMixedColor3(color); break;
    }
  }, []);

  const getMixerRef = useCallback((mixerIndex: number) => {
    switch (mixerIndex) {
      case 1: return mixer1Ref;
      case 2: return mixer2Ref;
      case 3: return mixer3Ref;
      default: return mixer1Ref;
    }
  }, []);

  // 色をクリック（コピー機能）
  const handleColorClick = useCallback(async (color: ColorInfo) => {
    await copyToClipboard(color.hex);
    
    // コピー成功のキラキラエフェクト
    setSparkleEffect(`copy-${color.hex}`);
    setTimeout(() => setSparkleEffect(null), 800);
  }, []);

  // 混合処理を実行（重複防止あり）
  const performMixing = useCallback((colorsToMix: ColorInfo[], mixerIndex: number) => {
    if (colorsToMix.length < 2 || processingRef.current[mixerIndex]) return;
    
    // 同じ組み合わせの混合を防ぐ
    const colorKey = colorsToMix.map(c => c.hex).sort().join('-');
    if (lastMixedRef.current[mixerIndex] === colorKey) return;
    
    processingRef.current[mixerIndex] = true;
    setAnimatingMixer(mixerIndex);
    
    setTimeout(() => {
      const mixed = mixMultipleColors(colorsToMix);
      setMixedColor(mixerIndex, mixed);
      setAnimatingMixer(null);
      
      // 重複防止のため記録
      lastMixedRef.current[mixerIndex] = colorKey;
      
      // 親コンポーネントに通知
      onColorMixed(mixed);
      
      setTimeout(() => {
        processingRef.current[mixerIndex] = false;
      }, 100);
    }, 600);
  }, [onColorMixed, setMixedColor]);

  // 色を混ぜる処理（メイン機能）- 特定のミキサーに追加
  const handleColorMix = useCallback((color: ColorInfo, mixerIndex: number) => {
    const currentMixingColors = getMixingColors(mixerIndex);
    
    // 同じ色は追加しない、最大3色まで
    const isDuplicate = currentMixingColors.some(c => c.hex === color.hex);
    if (isDuplicate || currentMixingColors.length >= 3) {
      return;
    }

    const newMixingColors = [...currentMixingColors, color];
    setMixingColors(mixerIndex, newMixingColors);
    
    // キラキラエフェクト
    setSparkleEffect(`mix-${color.hex}`);
    setTimeout(() => setSparkleEffect(null), 1000);
    
    // 触覚フィードバック
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
    
    // 2色以上になったら混合処理を実行
    if (newMixingColors.length >= 2) {
      setTimeout(() => performMixing(newMixingColors, mixerIndex), 100);
    }
  }, [getMixingColors, setMixingColors, performMixing]);

  // ドラッグ開始
  const handleDragStart = useCallback((e: React.DragEvent, color: ColorInfo) => {
    e.dataTransfer.setData('application/json', JSON.stringify(color));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  // タッチ開始（スマホ対応）
  const handleTouchStart = useCallback((e: React.TouchEvent, color: ColorInfo) => {
    e.preventDefault();
    setTouchingColor(color);
    
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }, []);

  // タッチ移動中
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    // どのミキサーの上にいるか判定
    let hoveringMixer = null;
    if (element && mixer1Ref.current?.contains(element)) hoveringMixer = 1;
    else if (element && mixer2Ref.current?.contains(element)) hoveringMixer = 2;
    else if (element && mixer3Ref.current?.contains(element)) hoveringMixer = 3;
    
    setDragOverMixer(hoveringMixer);
  }, []);

  // タッチ終了
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!touchingColor) return;
    
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    // どのミキサーにドロップされたか判定
    let targetMixer = null;
    if (element && mixer1Ref.current?.contains(element)) targetMixer = 1;
    else if (element && mixer2Ref.current?.contains(element)) targetMixer = 2;
    else if (element && mixer3Ref.current?.contains(element)) targetMixer = 3;
    
    if (targetMixer) {
      handleColorMix(touchingColor, targetMixer);
      setActiveMixer(targetMixer);
    }
    
    setTouchingColor(null);
    setDragOverMixer(null);
  }, [touchingColor, handleColorMix]);

  // ドロップエリアにドラッグオーバー
  const handleDragOver = useCallback((e: React.DragEvent, mixerIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverMixer(mixerIndex);
  }, []);

  // ドロップエリアからドラッグアウト
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverMixer(null);
  }, []);

  // 色をドロップ（混ぜる機能）
  const handleDrop = useCallback((e: React.DragEvent, mixerIndex: number) => {
    e.preventDefault();
    setDragOverMixer(null);
    
    try {
      const colorData = e.dataTransfer.getData('application/json');
      const color = JSON.parse(colorData) as ColorInfo;
      handleColorMix(color, mixerIndex);
      setActiveMixer(mixerIndex);
    } catch (error) {
      console.error('Color drop failed:', error);
    }
  }, [handleColorMix]);

  // 混ぜる色をクリア（特定のミキサー）
  const handleClearMixer = useCallback((mixerIndex: number) => {
    processingRef.current[mixerIndex] = false;
    lastMixedRef.current[mixerIndex] = '';
    setMixingColors(mixerIndex, []);
    setMixedColor(mixerIndex, null);
    if (animatingMixer === mixerIndex) {
      setAnimatingMixer(null);
    }
  }, [animatingMixer, setMixingColors, setMixedColor]);

  // 混ぜる色を個別削除（特定のミキサー）
  const handleRemoveMixingColor = useCallback((colorToRemove: ColorInfo, mixerIndex: number) => {
    const currentColors = getMixingColors(mixerIndex);
    const newColors = currentColors.filter(c => c.hex !== colorToRemove.hex);
    
    setMixingColors(mixerIndex, newColors);
    
    // 削除後の処理（混合処理は行わない）
    setMixedColor(mixerIndex, null);
    lastMixedRef.current[mixerIndex] = '';
  }, [getMixingColors, setMixingColors, setMixedColor]);

  // 混合した色をコピー（特定のミキサー）
  const handleCopyMixed = useCallback(async (mixerIndex: number) => {
    const mixedColor = getMixedColor(mixerIndex);
    if (!mixedColor) return;
    
    await copyToClipboard(mixedColor.hex);
    
    setSparkleEffect(`mixed-copy-${mixerIndex}`);
    setTimeout(() => setSparkleEffect(null), 800);
  }, [getMixedColor]);

  return (
    <div 
      className="rounded-3xl shadow-2xl p-4 lg:p-6 theme-bg-mixer border-4 border-yellow-300"
      style={{
        margin: '0',
        boxSizing: 'border-box'
      }}
    >
      {/* コンパクトなヘッダー */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <div>
            <h2 className="text-2xl font-bold theme-text-primary">
              🎨 いろまぜコーナー
            </h2>
          </div>
        </div>
        
        {/* アクションボタン群（右寄せ） */}
        <div className="flex justify-end">
          <div className="flex gap-2">
            {onSave && (
              <button
                onClick={onSave}
                className="px-3 py-2 bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 text-white rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105 flex items-center gap-1 cursor-pointer"
                title="ほぞん"
              >
                <Heart className="h-4 w-4" />
                <span className="text-sm font-medium">ほぞん</span>
              </button>
            )}
            
            {onToggleExportMenu && (
              <div className="relative">
                <button
                  onClick={onToggleExportMenu}
                  className="px-3 py-2 bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105 flex items-center gap-1 cursor-pointer"
                  title="だうんろーど"
                >
                  <Download className="h-4 w-4" />
                  <span className="text-sm font-medium">だうんろーど</span>
                </button>
                
                {showExportMenu && onExport && (
                  <div className="absolute top-full right-0 mt-2 theme-dropdown rounded-xl shadow-xl border-2 border-yellow-300 p-2 z-10 min-w-max">
                    <button
                      onClick={() => onExport('css')}
                      className="block w-full text-left px-3 py-2 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded-lg text-sm font-medium cursor-pointer"
                    >
                      🎨 CSS
                    </button>
                    <button
                      onClick={() => onExport('json')}
                      className="block w-full text-left px-3 py-2 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded-lg text-sm font-medium cursor-pointer"
                    >
                      📄 JSON
                    </button>
                    <button
                      onClick={() => onExport('text')}
                      className="block w-full text-left px-3 py-2 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded-lg text-sm font-medium cursor-pointer"
                    >
                      📝 テキスト
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {onShare && (
              <button
                onClick={onShare}
                className="px-3 py-2 bg-gradient-to-r from-blue-400 to-indigo-500 hover:from-blue-500 hover:to-indigo-600 text-white rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105 flex items-center gap-1 cursor-pointer"
                title="シェア"
              >
                <Share2 className="h-4 w-4" />
                <span className="text-sm font-medium">シェア</span>
              </button>
            )}
            
            {onReset && (
              <button
                onClick={onReset}
                className="px-3 py-2 bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105 flex items-center gap-1 cursor-pointer"
                title="リセット"
              >
                <Trash2 className="h-4 w-4" />
                <span className="text-sm font-medium">リセット</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 混合結果をコンパクト表示 - 3つのミキサーすべて */}
      {[1, 2, 3].some(mixerIndex => getMixedColor(mixerIndex)) && (
        <div className="mb-6">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((mixerIndex) => {
              const mixedColor = getMixedColor(mixerIndex);
              if (!mixedColor) return null;
              
              return (
                <div key={`mixed-result-${mixerIndex}`} className="flex items-center space-x-2">
                  <div
                    className="w-12 h-12 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform"
                    style={{ backgroundColor: mixedColor.hex }}
                    onClick={() => handleCopyMixed(mixerIndex)}
                    title={`${mixedColor.name} (${mixedColor.hex}) - クリックでコピー`}
                  >
                    {sparkleEffect === `mixed-copy-${mixerIndex}` && (
                      <div className="w-full h-full flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-yellow-300 animate-spin" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold theme-text-primary">できた{mixerIndex}!</p>
                    <p className="text-xs theme-text-secondary">{mixedColor.hex}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* 元の色 */}
        <div>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
            {colors.map((color, index) => {
              const hasSparkle = sparkleEffect === `copy-${color.hex}`;
              
              return (
                <div
                  key={color.id || `${color.hex}-${index}`}
                  className={`group relative aspect-square rounded-xl cursor-pointer transform transition-all duration-300 hover:scale-105 shadow-lg border-2 border-white select-none ${
                    hasSparkle ? 'animate-pulse ring-4 ring-yellow-400' : ''
                  } ${touchingColor?.hex === color.hex ? 'scale-105 ring-2 ring-blue-400' : ''}`}
                  style={{ backgroundColor: color.hex }}
                  draggable
                  onClick={() => handleColorClick(color)}
                  onDragStart={(e) => handleDragStart(e, color)}
                  onTouchStart={(e) => handleTouchStart(e, color)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  title={`${color.name} - クリックでコピー、ドラッグで混ぜる`}
                >
                  {/* キラキラエフェクト */}
                  {hasSparkle && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-yellow-300 animate-spin" />
                    </div>
                  )}
                  
                  {/* コピーアイコン（ホバー時のみ表示） */}
                  <div className="absolute top-1 right-1 bg-white bg-opacity-80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Copy className="h-3 w-3 text-gray-600" />
                  </div>
                  
                  {/* 色の名前 */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-xl text-center">
                    {color.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* 🔍 スポイトでとった色 */}
        {extractedColors.length > 0 && (
          <div>
            <h3 className="text-lg font-bold mb-3 theme-text-primary">
              🔍 とった色 ({extractedColors.length}色)
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {extractedColors.map((color, index) => {
                const hasSparkle = sparkleEffect === `copy-${color.hex}`;
                
                return (
                  <div
                    key={`extracted-${color.id || color.hex}-${index}`}
                    className={`group relative aspect-square rounded-xl cursor-pointer transform transition-all duration-300 hover:scale-105 shadow-lg border-2 border-yellow-300 select-none ${
                      hasSparkle ? 'animate-pulse ring-4 ring-yellow-400' : ''
                    } ${touchingColor?.hex === color.hex ? 'scale-105 ring-2 ring-blue-400' : ''}`}
                    style={{ backgroundColor: color.hex }}
                    draggable
                    onClick={() => handleColorClick(color)}
                    onDragStart={(e) => handleDragStart(e, color)}
                    onTouchStart={(e) => handleTouchStart(e, color)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    title={`${color.name} - スポイトでとった色`}
                  >
                    {/* キラキラエフェクト */}
                    {hasSparkle && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="h-6 w-6 text-yellow-300 animate-spin" />
                      </div>
                    )}
                    
                    {/* コピーアイコン（ホバー時のみ表示） */}
                    <div className="absolute top-1 left-1 bg-white bg-opacity-80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Copy className="h-3 w-3 text-gray-600" />
                    </div>
                    
                    {/* スポイトアイコン（常時表示） */}
                    <div className="absolute top-1 right-1 bg-orange-400 rounded-full p-1">
                      <Droplets className="h-3 w-3 text-white" />
                    </div>
                    
                    {/* 色の名前 */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-xl text-center">
                      {color.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 🪄 まぜまぜエリア */}
        <div>
          <h3 className="text-lg font-bold mb-3 theme-text-primary">
            🪄 まぜまぜエリア
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((mixerIndex) => {
              const mixingColors = getMixingColors(mixerIndex);
              const mixerRef = getMixerRef(mixerIndex);
              
              return (
                <div
                  key={`mixer-${mixerIndex}`}
                  ref={mixerRef}
                  className={`h-48 border-4 border-dashed rounded-2xl p-4 text-center transition-all duration-300 ${
                    dragOverMixer === mixerIndex
                      ? 'border-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 scale-105' 
                      : activeMixer === mixerIndex
                      ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                      : 'theme-border theme-section'
                  } ${animatingMixer === mixerIndex ? 'animate-pulse' : ''}`}
                  onDragOver={(e) => handleDragOver(e, mixerIndex)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, mixerIndex)}
                >
                  {mixingColors.length > 0 ? (
                    <div className="h-full flex flex-col justify-between">
                      {/* 混ぜる色を表示 */}
                      <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="space-y-2">
                          {mixingColors.map((color, index) => (
                            <div key={`mixing-${mixerIndex}-${color.hex}-${index}`} className="relative group flex flex-col items-center">
                              <div
                                className="w-10 h-10 rounded-full border-2 border-white shadow-md"
                                style={{ backgroundColor: color.hex }}
                                title={color.name}
                              />
                              <button
                              onClick={() => handleRemoveMixingColor(color, mixerIndex)}
                              className="absolute -top-1 -right-1 bg-red-400 hover:bg-red-500 text-white rounded-full p-0.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              title="この色を削除"
                              >
                                <Trash2 className="h-2 w-2" />
                              </button>
                              {index < mixingColors.length - 1 && (
                                <div className="text-center text-sm mt-1">+</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* クリアボタン */}
                      <button
                        onClick={() => handleClearMixer(mixerIndex)}
                        className="mt-2 px-2 py-1 bg-gray-400 hover:bg-gray-500 text-white text-xs rounded-full transition-colors cursor-pointer"
                      >
                        クリア
                      </button>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center">
                      <div className="text-3xl mb-2 animate-bounce">🎨</div>
                      <p className="text-sm font-bold mb-1 theme-text-secondary">
                        まぜまぜ{mixerIndex}
                      </p>
                      <p className="text-xs theme-text-muted">
                        色をドラッグしてね
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
