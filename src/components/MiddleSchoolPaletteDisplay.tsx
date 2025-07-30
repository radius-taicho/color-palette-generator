'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Download, 
  Share2, 
  Save, 
  BookOpen, 
  RotateCcw, 
  Settings,
  ChevronDown,
  ChevronUp,
  Droplets,
  X,
  Trash2
} from 'lucide-react';
import { ColorPalette, PaletteDisplayProps, EducationalMixingResult, ColorInfo } from '../types/color';
import { exportToCss, exportToJson, copyToClipboard } from '../utils/colorUtils';
import { handleImageEyedropper } from '../utils/imageUtils';

// 教育的コンポーネントをインポート
import MiddleSchoolColorMixer from './educational/MiddleSchoolColorMixer';
import ColorWheelDisplay from './educational/ColorWheelDisplay';
import ColorTheoryPanel from './educational/ColorTheoryPanel';

export default function MiddleSchoolPaletteDisplay({ 
  palette, 
  onSave, 
  onShare, 
  theme 
}: PaletteDisplayProps) {
  const [selectedColor, setSelectedColor] = useState(palette.colors[0] || null);
  const [educationalResult, setEducationalResult] = useState<EducationalMixingResult | null>(null);
  // learningMode は削除 - 常に全機能有効
  const [activePanel, setActivePanel] = useState<'mixer' | 'wheel' | 'theory'>('mixer');
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);
  const [exportFormat, setExportFormat] = useState<'css' | 'json'>('css');
  const [extractedColors, setExtractedColors] = useState<ColorInfo[]>([]);
  const [isEyedropperMode, setIsEyedropperMode] = useState(false);
  const [previewColor, setPreviewColor] = useState<{ hex: string; x: number; y: number } | null>(null);
  const [magnifiedPreview, setMagnifiedPreview] = useState<{ imageData: string; x: number; y: number } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // learningModeConfig は削除 - 常に全機能有効

  // エクスポート処理
  const handleExport = useCallback(async () => {
    let content: string;
    let filename: string;
    
    if (exportFormat === 'css') {
      content = exportToCss(palette.colors, palette.name);
      filename = `${palette.name}.css`;
    } else {
      content = exportToJson(palette.colors, palette.name);
      filename = `${palette.name}.json`;
    }

    // ファイルダウンロード
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [palette, exportFormat]);

  // 色選択ハンドラー
  const handleColorSelect = useCallback((color: any) => {
    setSelectedColor(color);
  }, []);

  // 教育的混色結果ハンドラー
  const handleEducationalMixingResult = useCallback((result: EducationalMixingResult) => {
    setEducationalResult(result);
  }, []);

  // 🔍 拡大プレビューを生成（高品質版）
  const generateMagnifiedPreview = useCallback(async (event: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current) return null;
    
    const img = imageRef.current;
    const rect = img.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // 画像の実際のサイズと表示サイズの比率を計算
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;
    
    // 拡大範囲のサイズ（実際のピクセル単位）
    const cropSize = 50; // 50x50ピクセルの範囲を拡大
    const displaySize = 150; // 150x150ピクセルで表示（約3倍拡大）
    
    // 実際の画像座標
    const actualX = x * scaleX;
    const actualY = y * scaleY;
    
    // キャンバスを作成
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    canvas.width = displaySize;
    canvas.height = displaySize;
    
    // 画像の一部を拡大して描画
    const sourceX = Math.max(0, actualX - cropSize / 2);
    const sourceY = Math.max(0, actualY - cropSize / 2);
    const sourceWidth = Math.min(cropSize, img.naturalWidth - sourceX);
    const sourceHeight = Math.min(cropSize, img.naturalHeight - sourceY);
    
    try {
      // 高品質レンダリング
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(
        img,
        sourceX, sourceY, sourceWidth, sourceHeight,
        0, 0, displaySize, displaySize
      );
      
      // 中央に精密な十字線を描画
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(255,255,255,0.8)';
      ctx.shadowBlur = 1;
      
      const center = displaySize / 2;
      const crossSize = 10;
      
      // 縦線
      ctx.beginPath();
      ctx.moveTo(center, center - crossSize);
      ctx.lineTo(center, center + crossSize);
      ctx.stroke();
      
      // 横線
      ctx.beginPath();
      ctx.moveTo(center - crossSize, center);
      ctx.lineTo(center + crossSize, center);
      ctx.stroke();
      
      // 中央点
      ctx.fillStyle = '#3B82F6';
      ctx.shadowBlur = 2;
      ctx.beginPath();
      ctx.arc(center, center, 2, 0, 2 * Math.PI);
      ctx.fill();
      
      return canvas.toDataURL();
    } catch (error) {
      console.error('拡大プレビューの生成に失敗:', error);
      return null;
    }
  }, []);

  // 🔬 スポイト機能：画像から色を抽出
  const handleImageClick = useCallback(async (event: React.MouseEvent<HTMLImageElement>) => {
    if (!isEyedropperMode || !imageRef.current) return;
    
    try {
      const extractedColor = await handleImageEyedropper(event, imageRef.current);
      
      // 重複チェック
      const allColors = [...palette.colors, ...extractedColors];
      const isDuplicate = allColors.some(color => color.hex === extractedColor.hex);
      
      if (isDuplicate) {
        // 大人向けはエラーを表示しないで、静かに無視
        return;
      }
      
      // 抽出した色を追加（最大8個まで）
      setExtractedColors(prev => [extractedColor, ...prev].slice(0, 8));
      
      // 選択色も更新
      setSelectedColor(extractedColor);
      
      // プレビューを非表示
      setPreviewColor(null);
      setMagnifiedPreview(null);
      
    } catch (error) {
      console.error('色の抽出に失敗しました:', error);
    }
  }, [isEyedropperMode, palette.colors, extractedColors]);

  // 🔍 リアルタイムプレビュー機能
  const handleImageMouseMove = useCallback(async (event: React.MouseEvent<HTMLImageElement>) => {
    if (!isEyedropperMode || !imageRef.current) return;
    
    // 連続したイベントを抑制するためのスロットリング
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
    }
    
    previewTimeoutRef.current = setTimeout(async () => {
      try {
        const extractedColor = await handleImageEyedropper(event, imageRef.current!);
        
        // 🎯 正確なマウス位置を取得（スクロール位置は既に考慮済み）
        const mouseX = event.clientX;
        const mouseY = event.clientY;
        
        setPreviewColor({
          hex: extractedColor.hex,
          x: mouseX,
          y: mouseY
        });
        
        // 拡大プレビューを生成
        const magnifiedData = await generateMagnifiedPreview(event);
        if (magnifiedData) {
          setMagnifiedPreview({
            imageData: magnifiedData,
            x: mouseX,
            y: mouseY
          });
        }
      } catch (error) {
        // エラーは無視してプレビューを非表示
        setPreviewColor(null);
        setMagnifiedPreview(null);
      }
    }, 30); // 30msのデバウンス（大人向けは少し高速）
  }, [isEyedropperMode, generateMagnifiedPreview]);

  // マウスが画像から離れたときにプレビューを非表示
  const handleImageMouseLeave = useCallback(() => {
    setPreviewColor(null);
    setMagnifiedPreview(null);
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }
  }, []);

  // 抽出した色を削除
  const handleRemoveExtractedColor = useCallback((colorToRemove: ColorInfo, index: number) => {
    setExtractedColors(prev => {
      const newColors = prev.filter((_, i) => i !== index);
      // 削除した色が選択中の場合、別の色を選択
      if (selectedColor?.hex === colorToRemove.hex) {
        setSelectedColor(newColors[0] || palette.colors[0] || null);
      }
      return newColors;
    });
  }, [selectedColor, palette.colors]);

  // スポイトモードの切り替え
  const toggleEyedropperMode = useCallback(() => {
    setIsEyedropperMode(prev => !prev);
  }, []);

  // 🧹 クリーンアップ処理
  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
  }, []);

  // パネル切り替えボタン
  const panelButtons = [
    { key: 'mixer', label: '🧪 ミキサー', icon: '🧪' },
    { key: 'wheel', label: '🎡 色相環', icon: '🎡' },
    { key: 'theory', label: '📚 理論', icon: '📚' }
  ] as const;

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8">
      {/* 🎓 教育モード ヘッダー */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl border-4 border-indigo-300">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mr-4">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                🎓 {palette.name} - 科学的分析
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                色彩の科学を探求し、混色実験を通して学習しましょう
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* モード選択は削除 - 常に全機能有効 */}

            {/* 高度な機能切り替え */}
            <button
              onClick={() => setShowAdvancedFeatures(!showAdvancedFeatures)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors cursor-pointer"
            >
              <Settings className="h-4 w-4" />
              <span className="text-sm">高度な機能</span>
              {showAdvancedFeatures ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* 🎨 元画像とパレット表示（パレット主役レイアウト） */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
          {/* 元画像（1/5幅） */}
          {palette.imageUrl && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 lg:col-span-1">
              {/* ファイル名表示 */}
              {palette.fileName && (
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-3 text-center truncate">
                  {palette.fileName}
                </p>
              )}
              
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800 dark:text-white">📸 元画像</h3>
              </div>
              
              {isEyedropperMode && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2 mb-3">
                  <p className="text-blue-800 dark:text-blue-200 text-sm font-medium">
                    🔍 画像をクリックして色を抽出
                  </p>
                </div>
              )}
              
              <div className="relative flex justify-center items-center min-h-[180px] bg-gray-100 dark:bg-gray-700 rounded-lg">
                <img 
                  ref={imageRef}
                  src={palette.imageUrl} 
                  alt={palette.name}
                  onClick={handleImageClick}
                  onMouseMove={handleImageMouseMove}
                  onMouseLeave={handleImageMouseLeave}
                  className={`max-w-full max-h-48 object-contain rounded-lg shadow-md transition-all duration-300 ${
                    isEyedropperMode 
                      ? 'cursor-crosshair border-2 border-blue-400' 
                      : ''
                  }`}
                />
                {isEyedropperMode && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white p-1.5 rounded-full shadow-lg">
                    <Droplets className="h-3 w-3" />
                  </div>
                )}
              </div>
              
              {/* 🔬 スポイトボタン（写真セクションの下部右側） */}
              <div className="flex justify-end mt-3">
                <button
                  onClick={toggleEyedropperMode}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm shadow-md hover:shadow-lg transform hover:scale-105 ${
                    isEyedropperMode
                      ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-blue-500 hover:text-white'
                  }`}
                >
                  <Droplets className="h-4 w-4" />
                  <span>Eyedropper</span>
                </button>
              </div>
            </div>
          )}

          {/* 抽出された色（3/5幅） */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 lg:col-span-3">
            <h3 className="font-bold text-gray-800 dark:text-white mb-3">
              🎨 抽出色 ({palette.colors.length + extractedColors.length}色)
            </h3>
            
            {/* オリジナル抽出色 */}
            <div className="mb-4">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">• 自動抽出 ({palette.colors.length}色)</p>
              <div className="grid grid-cols-5 gap-2">
                {palette.colors.map((color, index) => (
                  <button
                    key={`original-${index}`}
                    onClick={() => setSelectedColor(color)}
                    className={`aspect-square rounded-lg transition-all duration-200 hover:scale-105 shadow-md border-2 ${
                      selectedColor?.hex === color.hex 
                        ? 'border-indigo-400 scale-105 ring-2 ring-indigo-300' 
                        : 'border-white dark:border-gray-600'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={`${color.name} (${color.hex})`}
                  />
                ))}
              </div>
            </div>
            
            {/* スポイト抽出色 */}
            {extractedColors.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">• スポイト抽出 ({extractedColors.length}色)</p>
                  <button
                    onClick={() => setExtractedColors([])}
                    className="flex items-center space-x-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded text-xs font-medium transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>全削除</span>
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {extractedColors.map((color, index) => (
                    <div key={`extracted-${index}`} className="relative group">
                      <button
                        onClick={() => setSelectedColor(color)}
                        className={`w-full aspect-square rounded-lg transition-all duration-200 hover:scale-105 shadow-md border-2 ${
                          selectedColor?.hex === color.hex 
                            ? 'border-blue-400 scale-105 ring-2 ring-blue-300' 
                            : 'border-white dark:border-gray-600'
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={`${color.name} (${color.hex})`}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveExtractedColor(color, index);
                        }}
                        className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg"
                        title="この色を削除"
                      >
                        <X className="h-2 w-2" />
                      </button>
                      <div className="absolute bottom-0 right-0 bg-blue-400 rounded-full p-0.5">
                        <Droplets className="h-2 w-2 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 選択色の詳細 */}
            {selectedColor && (
              <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: selectedColor.hex }}
                  />
                  <div>
                    <p className="font-bold text-sm text-gray-800 dark:text-white">
                      {selectedColor.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {selectedColor.hex} | RGB({selectedColor.rgb.r}, {selectedColor.rgb.g}, {selectedColor.rgb.b})
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      HSL({selectedColor.hsl.h}°, {selectedColor.hsl.s}%, {selectedColor.hsl.l}%)
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* アクション（1/5幅） */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 lg:col-span-1">
            <h3 className="font-bold text-gray-800 dark:text-white mb-3">⚡ アクション</h3>
            <div className="space-y-3">
              <button
                onClick={onSave}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>パレットを保存</span>
              </button>

              <div className="flex space-x-2">
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as 'css' | 'json')}
                  className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                >
                  <option value="css">CSS形式</option>
                  <option value="json">JSON形式</option>
                </select>
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  title="エクスポート"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={onShare}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
              >
                <Share2 className="h-4 w-4" />
                <span>共有する</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 📚 学習パネル切り替え */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg">
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {panelButtons.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActivePanel(key)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activePanel === key
                  ? 'bg-indigo-500 text-white shadow-lg scale-105'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span>{icon}</span>
              <span className="text-sm">{label}</span>
            </button>
          ))}
        </div>

        {/* アクティブなパネルを表示 */}
        <div className="min-h-[400px]">
          {activePanel === 'mixer' && (
            <MiddleSchoolColorMixer
              colors={palette.colors}
              onColorMixed={() => {}} // 既存の色配列は変更しない
              onEducationalMixingResult={handleEducationalMixingResult}
              theme={theme}
              showTheory={true}
              showColorWheel={true}
              // learningMode は削除 - 常に全機能有効
            />
          )}

          {activePanel === 'wheel' && (
            <ColorWheelDisplay
              selectedColor={selectedColor}
              onColorSelect={handleColorSelect}
              showHarmonyLines={true} // 常に表示
              showAngles={true} // 常に表示
              size={showAdvancedFeatures ? 400 : 300}
            />
          )}

          {activePanel === 'theory' && (
            <ColorTheoryPanel
              mixingResult={educationalResult}
              selectedColors={selectedColor ? [selectedColor] : palette.colors.slice(0, 3)}
              showDetailedExplanations={true} // 常に詳細表示
              learningLevel="advanced" // 常に高度レベル
            />
          )}
        </div>
      </div>

      {/* 🔬 高度な機能（展開時のみ表示） */}
      {showAdvancedFeatures && (
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center">
            🔬 高度な分析機能
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 統計情報 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
              <h4 className="font-bold text-gray-800 dark:text-white mb-3">📊 色彩統計</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">色数:</span>
                  <span className="font-medium">{palette.colors.length}色</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">色相範囲:</span>
                  <span className="font-medium">
                    {Math.min(...palette.colors.map(c => c.hsl.h))}° - {Math.max(...palette.colors.map(c => c.hsl.h))}°
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">平均彩度:</span>
                  <span className="font-medium">
                    {Math.round(palette.colors.reduce((sum, c) => sum + c.hsl.s, 0) / palette.colors.length)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">平均明度:</span>
                  <span className="font-medium">
                    {Math.round(palette.colors.reduce((sum, c) => sum + c.hsl.l, 0) / palette.colors.length)}%
                  </span>
                </div>
              </div>
            </div>

            {/* 推奨用途 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
              <h4 className="font-bold text-gray-800 dark:text-white mb-3">💡 推奨用途</h4>
              <div className="space-y-2">
                {/* 簡易的な用途推定 */}
                {palette.colors.some(c => c.hsl.h >= 0 && c.hsl.h <= 30) && (
                  <div className="px-3 py-2 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded-lg text-sm">
                    🔴 エネルギッシュなデザイン
                  </div>
                )}
                {palette.colors.some(c => c.hsl.h >= 200 && c.hsl.h <= 240) && (
                  <div className="px-3 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-lg text-sm">
                    🔵 信頼感のあるデザイン
                  </div>
                )}
                {palette.colors.some(c => c.hsl.h >= 90 && c.hsl.h <= 150) && (
                  <div className="px-3 py-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-lg text-sm">
                    🟢 自然・環境系デザイン
                  </div>
                )}
                {palette.colors.every(c => c.hsl.s < 30) && (
                  <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-lg text-sm">
                    ⚫ ミニマル・モダンデザイン
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 💡 学習のヒント */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl p-4">
        <div className="flex items-center mb-3">
          <div className="p-2 bg-yellow-400 rounded-full mr-3">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          <h3 className="font-bold text-yellow-800 dark:text-yellow-300">
            💡 学習のヒント
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-800 dark:text-yellow-300">
          <div>
            <p className="font-medium mb-1">🎨 色の混合実験をしてみよう</p>
            <p>異なる色を組み合わせて、加法混色と減法混色の違いを体験できます。</p>
          </div>
          <div>
            <p className="font-medium mb-1">🔬 科学的に色を理解しよう</p>
            <p>色温度や波長など、色の科学的側面を学んで理解を深めましょう。</p>
          </div>
          <div>
            <p className="font-medium mb-1">🎡 色相環で関係性を学ぼう</p>
            <p>補色や類似色など、色同士の関係性を色相環で視覚的に確認できます。</p>
          </div>
          <div>
            <p className="font-medium mb-1">📚 理論と実践を組み合わせよう</p>
            <p>学んだ理論を実際のデザインプロジェクトで活用してみましょう。</p>
          </div>
        </div>
      </div>
      
      {/* 🔬 スマート拡大プレビュー（カーソルの右上に統合表示） */}
      {previewColor && magnifiedPreview && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: previewColor.x + 25,
            top: previewColor.y - 90,
            transform: 'translateZ(0)' // GPUアクセラレーションでスムーズに
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-blue-400 p-4">
            {/* カラーコード表示 */}
            <div className="text-center mb-3">
              <div className="flex items-center justify-center space-x-3">
                <div
                  className="w-5 h-5 rounded border border-gray-300 dark:border-gray-500 shadow-sm"
                  style={{ backgroundColor: previewColor.hex }}
                />
                <div className="text-left">
                  <div className="text-sm font-mono font-bold text-gray-800 dark:text-gray-200">
                    {previewColor.hex.toUpperCase()}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    High Precision Preview
                  </div>
                </div>
              </div>
            </div>
            
            {/* 拡大プレビュー画像 */}
            <img
              src={magnifiedPreview.imageData}
              alt="Magnified preview"
              className="w-36 h-36 border-2 border-gray-200 dark:border-gray-600 rounded-lg shadow-inner"
            />
          </div>
          
          {/* 三角形の矢印（左上から伸びる） */}
          <div className="absolute bottom-3 left-3 w-0 h-0 border-r-[10px] border-t-[10px] border-transparent border-r-white dark:border-r-gray-800 border-t-white dark:border-t-gray-800 transform rotate-45"></div>
        </div>
      )}
    </div>
  );
}
