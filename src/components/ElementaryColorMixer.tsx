'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Palette, Sparkles, Copy, Trash2, Plus } from 'lucide-react';
import { ColorInfo, MixedColor, ColorMixerProps } from '../types/color';
import { mixColors, mixMultipleColors, copyToClipboard, generateColorId } from '../utils/colorUtils';

export default function ElementaryColorMixer({ colors, onColorMixed, theme }: ColorMixerProps) {
  const [mixingColors, setMixingColors] = useState<ColorInfo[]>([]);
  const [mixedColor, setMixedColor] = useState<MixedColor | null>(null);
  const [sparkleEffect, setSparkleEffect] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [touchingColor, setTouchingColor] = useState<ColorInfo | null>(null);
  const mixerRef = useRef<HTMLDivElement>(null);
  const processingRef = useRef<boolean>(false);
  const lastMixedRef = useRef<string>(''); // 前回の混合結果を記録

  // 色をクリック（コピー機能）
  const handleColorClick = useCallback(async (color: ColorInfo) => {
    await copyToClipboard(color.hex);
    
    // コピー成功のキラキラエフェクト
    setSparkleEffect(`copy-${color.hex}`);
    setTimeout(() => setSparkleEffect(null), 800);
  }, []);

  // 混合処理を実行（重複防止あり）
  const performMixing = useCallback((colorsToMix: ColorInfo[]) => {
    if (colorsToMix.length < 2 || processingRef.current) return;
    
    // 同じ組み合わせの混合を防ぐ
    const colorKey = colorsToMix.map(c => c.hex).sort().join('-');
    if (lastMixedRef.current === colorKey) return;
    
    processingRef.current = true;
    setIsAnimating(true);
    
    setTimeout(() => {
      const mixed = mixMultipleColors(colorsToMix);
      setMixedColor(mixed);
      setIsAnimating(false);
      
      // 重複防止のため記録
      lastMixedRef.current = colorKey;
      
      // 親コンポーネントに通知
      onColorMixed(mixed);
      
      setTimeout(() => {
        processingRef.current = false;
      }, 100);
    }, 600);
  }, [onColorMixed]);

  // 色を混ぜる処理（メイン機能）- 先に定義
  const handleColorMix = useCallback((color: ColorInfo) => {
    setMixingColors(prevMixingColors => {
      // 同じ色は追加しない、最大3色まで
      const isDuplicate = prevMixingColors.some(c => c.hex === color.hex);
      if (isDuplicate || prevMixingColors.length >= 3) {
        return prevMixingColors;
      }

      const newMixingColors = [...prevMixingColors, color];
      
      // キラキラエフェクト
      setSparkleEffect(`mix-${color.hex}`);
      setTimeout(() => setSparkleEffect(null), 1000);
      
      // 触覚フィードバック
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
      
      // 2色以上になったら混合処理を実行
      if (newMixingColors.length >= 2) {
        setTimeout(() => performMixing(newMixingColors), 100);
      }
      
      return newMixingColors;
    });
  }, [performMixing]);

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
    
    if (element && mixerRef.current?.contains(element)) {
      setIsDragOver(true);
    } else {
      setIsDragOver(false);
    }
  }, []);

  // タッチ終了
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!touchingColor) return;
    
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (element && mixerRef.current?.contains(element)) {
      handleColorMix(touchingColor);
    }
    
    setTouchingColor(null);
    setIsDragOver(false);
  }, [touchingColor, handleColorMix]);

  // ドロップエリアにドラッグオーバー
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }, []);

  // ドロップエリアからドラッグアウト
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  // 色をドロップ（混ぜる機能）
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    try {
      const colorData = e.dataTransfer.getData('application/json');
      const color = JSON.parse(colorData) as ColorInfo;
      handleColorMix(color);
    } catch (error) {
      console.error('Color drop failed:', error);
    }
  }, [handleColorMix]);


  // 混ぜる色をクリア
  const handleClearMixer = useCallback(() => {
    processingRef.current = false;
    lastMixedRef.current = '';
    setMixingColors([]);
    setMixedColor(null);
    setIsAnimating(false);
  }, []);

  // 混ぜる色を個別削除
  const handleRemoveMixingColor = useCallback((colorToRemove: ColorInfo) => {
    setMixingColors(prevColors => {
      const newColors = prevColors.filter(c => c.hex !== colorToRemove.hex);
      
      // 削除後の処理
      if (newColors.length >= 2) {
        setTimeout(() => performMixing(newColors), 100);
      } else {
        setMixedColor(null);
        lastMixedRef.current = '';
      }
      
      return newColors;
    });
  }, [performMixing]);

  // 混合した色をコピー
  const handleCopyMixed = useCallback(async () => {
    if (!mixedColor) return;
    await copyToClipboard(mixedColor.hex);
    
    setSparkleEffect('mixed-copy');
    setTimeout(() => setSparkleEffect(null), 800);
  }, [mixedColor]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl border-4 border-yellow-300">
      {/* コンパクトなヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="p-2 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full mr-3">
            <Palette className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              🎨 いろまぜコーナー
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              クリック=コピー、ドラッグ=まぜる
            </p>
          </div>
        </div>
        
        {/* 混合結果をコンパクト表示 */}
        {mixedColor && (
          <div className="flex items-center space-x-3">
            <div
              className="w-16 h-16 rounded-full border-4 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform"
              style={{ backgroundColor: mixedColor.hex }}
              onClick={handleCopyMixed}
              title={`${mixedColor.name} (${mixedColor.hex}) - クリックでコピー`}
            >
              {sparkleEffect === 'mixed-copy' && (
                <div className="w-full h-full flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-yellow-300 animate-spin" />
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-white">できた！</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{mixedColor.hex}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側：選べる色 */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-bold mb-3 text-gray-700 dark:text-gray-300">
            🌈 色をえらんでね
          </h3>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
            {colors.map((color, index) => {
              const hasSparkle = sparkleEffect === `copy-${color.hex}`;
              
              return (
                <div
                  key={color.id || `${color.hex}-${index}`}
                  className={`relative aspect-square rounded-xl cursor-pointer transform transition-all duration-300 hover:scale-105 shadow-lg border-2 border-white select-none ${
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
                  
                  {/* コピーアイコン */}
                  <div className="absolute top-1 right-1 bg-white bg-opacity-80 rounded-full p-1">
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

        {/* 右側：まぜまぜエリア（高さを動的に調整） */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-bold mb-3 text-gray-700 dark:text-gray-300">
            🪄 まぜまぜエリア ({mixingColors.length}/3)
          </h3>
          
          <div
            ref={mixerRef}
            className={`${
              mixingColors.length >= 3 ? 'h-60' : mixingColors.length >= 2 ? 'h-52' : 'h-48'
            } border-4 border-dashed rounded-2xl p-4 text-center transition-all duration-300 ${
              isDragOver 
                ? 'border-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 scale-105' 
                : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30'
            } ${isAnimating ? 'animate-pulse' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {mixingColors.length > 0 ? (
              <div className="h-full flex flex-col justify-between">
                {/* 混ぜる色を表示（3色対応レイアウト） */}
                <div className="flex-1 flex flex-col items-center justify-center">
                  {mixingColors.length <= 2 ? (
                    // 2色以下の場合は縦配置
                    <div className="space-y-3">
                      {mixingColors.map((color, index) => (
                        <div key={`mixing-${color.hex}-${index}`} className="relative group flex flex-col items-center">
                          <div
                            className="w-12 h-12 rounded-full border-2 border-white shadow-md"
                            style={{ backgroundColor: color.hex }}
                            title={color.name}
                          />
                          <button
                            onClick={() => handleRemoveMixingColor(color)}
                            className="absolute -top-1 -right-1 bg-red-400 hover:bg-red-500 text-white rounded-full p-0.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            title="この色を削除"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                          {index < mixingColors.length - 1 && (
                            <div className="text-center text-lg mt-2">+</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    // 3色の場合は三角形配置
                    <div className="relative w-32 h-32">
                      {mixingColors.map((color, index) => {
                        const positions = [
                          { top: '0%', left: '50%', transform: 'translate(-50%, 0)' },      // 上
                          { top: '70%', left: '15%', transform: 'translate(-50%, -50%)' },  // 左下
                          { top: '70%', left: '85%', transform: 'translate(-50%, -50%)' }   // 右下
                        ];
                        
                        return (
                          <div 
                            key={`mixing-${color.hex}-${index}`} 
                            className="absolute group"
                            style={positions[index]}
                          >
                            <div
                              className="w-10 h-10 rounded-full border-2 border-white shadow-md"
                              style={{ backgroundColor: color.hex }}
                              title={color.name}
                            />
                            <button
                              onClick={() => handleRemoveMixingColor(color)}
                              className="absolute -top-1 -right-1 bg-red-400 hover:bg-red-500 text-white rounded-full p-0.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                              title="この色を削除"
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        );
                      })}
                      {/* 中央に + マーク */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl text-gray-400">
                        +
                      </div>
                    </div>
                  )}
                </div>
                
                {/* クリアボタン */}
                <button
                  onClick={handleClearMixer}
                  className="mt-2 px-3 py-1 bg-gray-400 hover:bg-gray-500 text-white text-xs rounded-full transition-colors"
                >
                  クリア
                </button>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center">
                <div className="text-4xl mb-2 animate-bounce">🎨</div>
                <p className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-1">
                  ここにドラッグ
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  2色以上で混ざるよ
                </p>
              </div>
            )}
          </div>
          
          {/* デバッグ情報（開発用） */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Debug: {mixingColors.length}色 [{mixingColors.map(c => c.hex).join(', ')}]
              <br />
              Processing: {processingRef.current ? 'Yes' : 'No'} | LastMixed: {lastMixedRef.current}
            </div>
          )}
        </div>
      </div>

      {/* コンパクトな説明 */}
      <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-3">
        <div className="flex justify-center space-x-6 text-sm">
          <div className="text-center">
            <div className="text-lg mb-1">👆</div>
            <span className="font-medium text-gray-700 dark:text-gray-300">クリック=コピー</span>
          </div>
          <div className="text-center">
            <div className="text-lg mb-1">🎯</div>
            <span className="font-medium text-gray-700 dark:text-gray-300">ドラッグ=まぜる</span>
          </div>
          <div className="text-center">
            <div className="text-lg mb-1">✨</div>
            <span className="font-medium text-gray-700 dark:text-gray-300">自動で完成</span>
          </div>
        </div>
      </div>
    </div>
  );
}
