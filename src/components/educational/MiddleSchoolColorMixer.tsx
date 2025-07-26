'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Palette, 
  Sparkles, 
  Copy, 
  Trash2, 
  BookOpen, 
  RotateCcw,
  Eye,
  Lightbulb,
  Atom,
  Settings
} from 'lucide-react';
import { 
  ColorInfo, 
  MixedColor, 
  MiddleSchoolColorMixerProps,
  EducationalMixingResult,
  EducationalColorInfo
  // LearningMode は削除 - 常に全機能有効
} from '../../types/color';
import { 
  mixColors, 
  mixMultipleColors, 
  copyToClipboard, 
  generateColorId 
} from '../../utils/colorUtils';
import { 
  enhanceColorWithEducationalInfo,
  createEducationalMixingResult,
  getWavelengthDescription,
  getColorNameFromAngle
} from '../../utils/educationalColorUtils';

// 子コンポーネントのインポート（後で作成）
// import ColorWheelDisplay from './ColorWheelDisplay';
// import ColorTemperatureScale from './ColorTemperatureScale';
// import ColorTheoryPanel from './ColorTheoryPanel';

export default function MiddleSchoolColorMixer({ 
  colors, 
  onColorMixed, 
  onEducationalMixingResult,
  theme,
  showTheory = true,
  showColorWheel = true
  // learningMode は削除 - 常に全機能有効
}: MiddleSchoolColorMixerProps) {
  const [mixingColors, setMixingColors] = useState<ColorInfo[]>([]);
  const [mixedColor, setMixedColor] = useState<MixedColor | null>(null);
  const [educationalResult, setEducationalResult] = useState<EducationalMixingResult | null>(null);
  const [sparkleEffect, setSparkleEffect] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [touchingColor, setTouchingColor] = useState<ColorInfo | null>(null);
  const [selectedColor, setSelectedColor] = useState<EducationalColorInfo | null>(null);
  const [showExplanations, setShowExplanations] = useState(true);
  const [activePanel, setActivePanel] = useState<'theory' | 'wheel' | 'temperature' | null>('theory');
  
  const mixerRef = useRef<HTMLDivElement>(null);
  const processingRef = useRef<boolean>(false);
  const lastMixedRef = useRef<string>('');

  // learningModeConfig は削除 - 常に高度モード固定

  // 色をクリック（詳細情報表示 + コピー機能）
  const handleColorClick = useCallback(async (color: ColorInfo) => {
    // 教育的情報を付加
    const educationalColor = enhanceColorWithEducationalInfo(color);
    setSelectedColor(educationalColor);
    
    // コピー機能も保持
    await copyToClipboard(color.hex);
    
    setSparkleEffect(`copy-${color.hex}`);
    setTimeout(() => setSparkleEffect(null), 800);
  }, []);

  // 混合処理を実行（教育的情報付き）
  const performMixing = useCallback((colorsToMix: ColorInfo[]) => {
    if (colorsToMix.length < 2 || processingRef.current) return;
    
    const colorKey = colorsToMix.map(c => c.hex).sort().join('-');
    if (lastMixedRef.current === colorKey) return;
    
    processingRef.current = true;
    setIsAnimating(true);
    
    setTimeout(() => {
      // 基本的な混合結果
      const mixed = mixMultipleColors(colorsToMix);
      setMixedColor(mixed);
      
      // 教育的混合結果を生成
      const equalRatio = colorsToMix.map(() => 1 / colorsToMix.length);
      const educationalMixed = createEducationalMixingResult(
        colorsToMix, 
        mixed, 
        equalRatio
      );
      setEducationalResult(educationalMixed);
      
      setIsAnimating(false);
      lastMixedRef.current = colorKey;
      
      // 親コンポーネントに通知
      onColorMixed(mixed);
      if (onEducationalMixingResult) {
        onEducationalMixingResult(educationalMixed);
      }
      
      setTimeout(() => {
        processingRef.current = false;
      }, 100);
    }, 600);
  }, [onColorMixed, onEducationalMixingResult]);

  // 色を混ぜる処理（先に定義）
  const handleColorMix = useCallback((color: ColorInfo) => {
    setMixingColors(prevMixingColors => {
      const isDuplicate = prevMixingColors.some(c => c.hex === color.hex);
      if (isDuplicate || prevMixingColors.length >= 3) {
        return prevMixingColors;
      }

      const newMixingColors = [...prevMixingColors, color];
      
      setSparkleEffect(`mix-${color.hex}`);
      setTimeout(() => setSparkleEffect(null), 1000);
      
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
      
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

  // タッチ操作（スマホ対応）
  const handleTouchStart = useCallback((e: React.TouchEvent, color: ColorInfo) => {
    e.preventDefault();
    setTouchingColor(color);
    
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }, []);

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

  // ドロップエリア操作
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

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


  // ミキサーをクリア
  const handleClearMixer = useCallback(() => {
    processingRef.current = false;
    lastMixedRef.current = '';
    setMixingColors([]);
    setMixedColor(null);
    setEducationalResult(null);
    setIsAnimating(false);
  }, []);

  // 混ぜる色を個別削除
  const handleRemoveMixingColor = useCallback((colorToRemove: ColorInfo) => {
    setMixingColors(prevColors => {
      const newColors = prevColors.filter(c => c.hex !== colorToRemove.hex);
      
      if (newColors.length >= 2) {
        setTimeout(() => performMixing(newColors), 100);
      } else {
        setMixedColor(null);
        setEducationalResult(null);
        lastMixedRef.current = '';
      }
      
      return newColors;
    });
  }, [performMixing]);

  // 混合結果をコピー
  const handleCopyMixed = useCallback(async () => {
    if (!mixedColor) return;
    await copyToClipboard(mixedColor.hex);
    
    setSparkleEffect('mixed-copy');
    setTimeout(() => setSparkleEffect(null), 800);
  }, [mixedColor]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl border-4 border-indigo-300">
      {/* 🎓 ヘッダー - シンプル表示 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="p-2 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full mr-3">
            <Palette className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              🧪 科学的色彩ミキサー
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              混色の科学を学ぼう！全機能開放モード
            </p>
          </div>
        </div>
        
        {/* モード選択は削除 - 常に全機能有効 */}
      </div>

      {/* メインコンテンツ */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* 🎨 色選択エリア */}
        <div className="xl:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">
              🌈 色を選択してください
            </h3>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span>👆 クリック=詳細</span>
              <span>🎯 ドラッグ=混合</span>
            </div>
          </div>
          
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
            {colors.map((color, index) => {
              const hasSparkle = sparkleEffect === `copy-${color.hex}`;
              const educationalColor = enhanceColorWithEducationalInfo(color);
              
              return (
                <div
                  key={color.id || `${color.hex}-${index}`}
                  className={`relative group aspect-square rounded-xl cursor-pointer transform transition-all duration-300 hover:scale-105 shadow-lg border-2 border-white select-none ${
                    hasSparkle ? 'animate-pulse ring-4 ring-yellow-400' : ''
                  } ${
                    selectedColor?.hex === color.hex ? 'ring-2 ring-indigo-400' : ''
                  } ${
                    touchingColor?.hex === color.hex ? 'scale-105 ring-2 ring-blue-400' : ''
                  }`}
                  style={{ backgroundColor: color.hex }}
                  draggable
                  onClick={() => handleColorClick(color)}
                  onDragStart={(e) => handleDragStart(e, color)}
                  onTouchStart={(e) => handleTouchStart(e, color)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  title={`${color.name} - クリック:詳細, ドラッグ:混合`}
                >
                  {/* キラキラエフェクト */}
                  {hasSparkle && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-yellow-300 animate-spin" />
                    </div>
                  )}
                  
                  {/* 🎓 科学的情報（常に表示） */}
                  <div className="absolute top-1 left-1 bg-white bg-opacity-90 rounded-full p-1">
                    <div className="text-xs font-bold text-gray-800">
                      {educationalColor.wheelPosition.angle}°
                    </div>
                  </div>
                  
                  {/* コピーアイコン */}
                  <div className="absolute top-1 right-1 bg-white bg-opacity-80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
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

        {/* 🪄 混合エリア */}
        <div className="xl:col-span-1">
          <h3 className="text-lg font-bold mb-3 text-gray-700 dark:text-gray-300">
            🪄 混合エリア ({mixingColors.length}/3)
          </h3>
          
          <div
            ref={mixerRef}
            className={`h-64 border-4 border-dashed rounded-2xl p-4 text-center transition-all duration-300 ${
              isDragOver 
                ? 'border-indigo-400 bg-indigo-100 dark:bg-indigo-900/30 scale-105' 
                : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30'
            } ${isAnimating ? 'animate-pulse' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {mixingColors.length > 0 ? (
              <div className="h-full flex flex-col justify-between">
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="space-y-2">
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
                          title="削除"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                        {index < mixingColors.length - 1 && (
                          <div className="text-center text-lg mt-1">+</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={handleClearMixer}
                  className="px-3 py-1 bg-gray-400 hover:bg-gray-500 text-white text-xs rounded-full transition-colors"
                >
                  クリア
                </button>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center">
                <div className="text-4xl mb-2 animate-bounce">🎨</div>
                <p className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-1">
                  色をドラッグ
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  2色以上で混色開始
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 📊 結果・学習エリア */}
        <div className="xl:col-span-1">
          {mixedColor ? (
            <div className="space-y-4">
              {/* 混色結果 */}
              <div className="text-center">
                <h3 className="text-lg font-bold mb-2 text-gray-700 dark:text-gray-300">
                  ✨ 混色結果
                </h3>
                <div
                  className="w-20 h-20 mx-auto rounded-full border-4 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: mixedColor.hex }}
                  onClick={handleCopyMixed}
                  title={`${mixedColor.name} (${mixedColor.hex}) - クリックでコピー`}
                >
                  {sparkleEffect === 'mixed-copy' && (
                    <div className="w-full h-full flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-yellow-300 animate-spin" />
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <p className="font-bold text-sm text-gray-800 dark:text-white">
                    {mixedColor.name}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {mixedColor.hex}
                  </p>
                </div>
              </div>

              {/* 🎓 教育的情報パネル */}
              {educationalResult && showExplanations && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-indigo-800 dark:text-indigo-300 text-sm">
                      📚 {educationalResult.theory.title}
                    </h4>
                    <div className={`px-2 py-1 rounded-full text-xs text-white ${
                      educationalResult.mixingType === 'additive' ? 'bg-green-500' : 'bg-blue-500'
                    }`}>
                      {educationalResult.mixingType === 'additive' ? '加法' : '減法'}
                    </div>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 mb-2 text-xs leading-relaxed">
                    {educationalResult.scientificExplanation}
                  </p>
                  
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    <strong>応用例:</strong> 
                    {educationalResult.realWorldApplications.slice(0, 2).join(', ')}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-2">🔬</div>
              <p className="text-sm">色を混ぜて科学を学ぼう！</p>
            </div>
          )}
        </div>
      </div>

      {/* 🎓 詳細な色情報表示（選択された色） - 常に表示 */}
      {selectedColor && (
        <div className="mt-6 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-indigo-800 dark:text-indigo-300">
              🔍 色の科学的情報: {selectedColor.name}
            </h3>
            <button
              onClick={() => setSelectedColor(null)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            {/* 色相環情報 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3">
              <div className="flex items-center mb-2">
                <RotateCcw className="h-4 w-4 text-blue-500 mr-2" />
                <span className="font-bold">色相環</span>
              </div>
              <p>角度: <strong>{selectedColor.wheelPosition.angle}°</strong></p>
              <p>位置: <strong>{getColorNameFromAngle(selectedColor.wheelPosition.angle)}</strong></p>
              <p>彩度: <strong>{selectedColor.wheelPosition.radius}%</strong></p>
            </div>
            

            
            {/* 波長情報 */}
            {selectedColor.science.wavelength && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-3">
                <div className="flex items-center mb-2">
                  <Eye className="h-4 w-4 text-green-500 mr-2" />
                  <span className="font-bold">波長</span>
                </div>
                <p>波長: <strong>{Math.round(selectedColor.science.wavelength)}nm</strong></p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {getWavelengthDescription(selectedColor.science.wavelength)}
                </p>
              </div>
            )}
            
            {/* 心理効果 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3">
              <div className="flex items-center mb-2">
                <Lightbulb className="h-4 w-4 text-yellow-500 mr-2" />
                <span className="font-bold">心理効果</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedColor.psychologyEffects.slice(0, 3).map((effect, index) => (
                  <span key={index} className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs rounded-full">
                    {effect}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 💡 学習ヒント */}
      <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-3">
        <div className="flex justify-center space-x-6 text-sm">
          <div className="text-center">
            <div className="text-lg mb-1">👆</div>
            <span className="font-medium text-gray-700 dark:text-gray-300">クリック=色の詳細</span>
          </div>
          <div className="text-center">
            <div className="text-lg mb-1">🎯</div>
            <span className="font-medium text-gray-700 dark:text-gray-300">ドラッグ=科学的混色</span>
          </div>
          <div className="text-center">
            <div className="text-lg mb-1">🧪</div>
            <span className="font-medium text-gray-700 dark:text-gray-300">結果=理論説明</span>
          </div>
          <div className="text-center">
            <div className="text-lg mb-1">🎓</div>
            <span className="font-medium text-gray-700 dark:text-gray-300">モード=学習深度</span>
          </div>
        </div>
      </div>
    </div>
  );
}
