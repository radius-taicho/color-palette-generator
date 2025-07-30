'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Download, Share2, Save, Palette, Sparkles, Copy, Heart, Trash2, X, Droplets, Eye, EyeOff } from 'lucide-react';
import { PaletteDisplayProps, MixedColor, ColorInfo } from '../types/color';
import { exportToCss, exportToJson, copyToClipboard, generateColorId } from '../utils/colorUtils';
import { handleImageEyedropper } from '../utils/imageUtils';
import ElementaryColorMixer from './ElementaryColorMixer';

export default function ElementaryPaletteDisplay({ palette, onSave, onShare, onReset, theme }: PaletteDisplayProps) {
  const [mixedColors, setMixedColors] = useState<MixedColor[]>([]);
  const [sparkleColor, setSparkleColor] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [duplicateNotification, setDuplicateNotification] = useState<string | null>(null);
  const [extractedColors, setExtractedColors] = useState<ColorInfo[]>([]);
  const [isEyedropperMode, setIsEyedropperMode] = useState(false);
  const [previewColor, setPreviewColor] = useState<{ hex: string; x: number; y: number } | null>(null);
  const [magnifiedPreview, setMagnifiedPreview] = useState<{ imageData: string; x: number; y: number } | null>(null);
  const [showImage, setShowImage] = useState(true); // 画像表示状態を管理
  const imageRef = useRef<HTMLImageElement>(null);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // 🎨 スポイト機能：画像から色を抽出
  const handleImageClick = useCallback(async (event: React.MouseEvent<HTMLImageElement>) => {
    if (!isEyedropperMode || !imageRef.current) return;
    
    try {
      const extractedColor = await handleImageEyedropper(event, imageRef.current);
      
      // 重複チェック
      const allColors = [...palette.colors, ...extractedColors, ...mixedColors];
      const isDuplicate = allColors.some(color => color.hex === extractedColor.hex);
      
      if (isDuplicate) {
        setDuplicateNotification(`おなじ色（${extractedColor.hex}）があるよ！`);
        setTimeout(() => setDuplicateNotification(null), 2000);
        return;
      }
      
      // 抽出した色を追加
      setExtractedColors(prev => [extractedColor, ...prev].slice(0, 8)); // 最大8個まで
      
      // キラキラエフェクト
      setSparkleColor(extractedColor.hex);
      setTimeout(() => setSparkleColor(null), 800);
      
      // プレビューを非表示
      setPreviewColor(null);
      setMagnifiedPreview(null);
      
    } catch (error) {
      console.error('色の抽出に失敗しました:', error);
    }
  }, [isEyedropperMode, palette.colors, extractedColors, mixedColors]);

  // 🔍 拡大プレビューを生成
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
    const cropSize = 40; // 40x40ピクセルの範囲を拡大
    const displaySize = 120; // 120x120ピクセルで表示（約3倍拡大）
    
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
      ctx.imageSmoothingEnabled = false; // ピクセルアート風に
      ctx.drawImage(
        img,
        sourceX, sourceY, sourceWidth, sourceHeight,
        0, 0, displaySize, displaySize
      );
      
      // 中央に十字線を描画（スポイト位置表示）
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 2;
      
      const center = displaySize / 2;
      const crossSize = 8;
      
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
      
      return canvas.toDataURL();
    } catch (error) {
      console.error('拡大プレビューの生成に失敗:', error);
      return null;
    }
  }, []);

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
        
        // 🎯 正確なマウス位置を取得（スクロール位置を考慮）
        const mouseX = event.clientX;
        const mouseY = event.clientY;
        
        // 色プレビューを設定
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
    }, 50); // 50msのデバウンス
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
    setExtractedColors(prev => prev.filter((_, i) => i !== index));
  }, []);

  // スポイトモードの切り替え
  const toggleEyedropperMode = useCallback(() => {
    setIsEyedropperMode(prev => !prev);
  }, []);

  // 画像表示の切り替え
  const toggleImageDisplay = useCallback(() => {
    setShowImage(prev => !prev);
    // 画像を非表示にしたときはスポイトモードをオフ
    if (showImage) {
      setIsEyedropperMode(false);
      setPreviewColor(null);
      setMagnifiedPreview(null);
    }
  }, [showImage]);

  // 🧹 クリーンアップ処理
  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
    };
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

  // 混ぜた色とスポイトでとった色も含めてすべての色を表示
  const allColors = [...palette.colors, ...extractedColors, ...mixedColors];

  return (
    <div className="w-full space-y-6">

      {/* 🎨 スマート拡大プレビュー（カーソルの右上に統合表示） */}
      {previewColor && magnifiedPreview && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: previewColor.x + 20,
            top: previewColor.y - 80,
            transform: 'translateZ(0)' // GPUアクセラレーションでスムーズに
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-yellow-400 p-3">
            {/* カラーコード表示 */}
            <div className="text-center mb-2">
              <div className="flex items-center justify-center space-x-2">
                <div
                  className="w-4 h-4 rounded border border-gray-300 dark:border-gray-500"
                  style={{ backgroundColor: previewColor.hex }}
                />
                <span className="text-sm font-mono font-bold text-gray-800 dark:text-gray-200">
                  {previewColor.hex.toUpperCase()}
                </span>
              </div>
            </div>
            
            {/* 拡大プレビュー画像 */}
            <img
              src={magnifiedPreview.imageData}
              alt="Magnified preview"
              className="w-28 h-28 border-2 border-gray-200 dark:border-gray-600 rounded-lg"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          
          {/* 三角形の矢印（左上から伸びる） */}
          <div className="absolute bottom-2 left-2 w-0 h-0 border-r-[8px] border-t-[8px] border-transparent border-r-white dark:border-r-gray-800 border-t-white dark:border-t-gray-800 transform rotate-45"></div>
        </div>
      )}

      {/* メイン2カラムレイアウト：左側=画像（さらに小）、右側=色混ぜコーナー（さらに大） */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* 左側：📸🖼️ 元画像表示（1/4幅） */}
        {showImage && palette.imageUrl && (
          <div className="order-2 lg:order-1 lg:col-span-3">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-4 relative">
              {/* 画像表示切り替えボタン（右上） */}
              <button
                onClick={toggleImageDisplay}
                className="absolute top-3 right-3 z-10 p-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
                title="画像を非表示にする"
              >
                <EyeOff className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
              {/* ファイル名表示 */}
              {palette.fileName && (
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4 text-center truncate">
                  {palette.fileName}
                </p>
              )}
              
              {isEyedropperMode && (
                <div className="bg-yellow-100 dark:bg-yellow-900/20 border-2 border-yellow-400 rounded-lg p-3 mb-4">
                  <p className="text-yellow-800 dark:text-yellow-200 font-bold text-center text-sm">
                    🔍 写真をクリックして色をとりだそう！
                  </p>
                </div>
              )}
              
              <div className="relative flex justify-center items-center min-h-[180px] lg:min-h-[240px] bg-gray-100 dark:bg-gray-800 rounded-xl">
                <img 
                  ref={imageRef}
                  src={palette.imageUrl} 
                  alt={palette.name}
                  onClick={handleImageClick}
                  onMouseMove={handleImageMouseMove}
                  onMouseLeave={handleImageMouseLeave}
                  className={`max-w-full max-h-48 lg:max-h-64 object-contain rounded-xl transition-all duration-300 ${
                    isEyedropperMode 
                      ? 'cursor-crosshair border-4 border-yellow-400 shadow-lg' 
                      : 'shadow-lg'
                  }`}
                />
                {isEyedropperMode && (
                  <div className="absolute top-2 right-2 bg-yellow-400 text-white p-2 rounded-full">
                    <Droplets className="h-4 w-4" />
                  </div>
                )}
              </div>
              
              {/* 🎨 スポイトボタン（写真セクションの下部右側） */}
              <div className="flex justify-end mt-3">
                <button
                  onClick={toggleEyedropperMode}
                  className={`px-3 py-2 font-bold rounded-full shadow-lg transform transition-all duration-300 hover:scale-105 text-sm flex items-center space-x-1 ${
                    isEyedropperMode
                      ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white ring-2 ring-yellow-300'
                      : 'bg-gradient-to-r from-gray-300 to-gray-400 hover:from-yellow-400 hover:to-orange-500 text-gray-700 hover:text-white'
                  }`}
                >
                  <Droplets className="h-4 w-4" />
                  <span>スポイト</span>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* 左側：画像非表示時のプレースホルダー（１/４幅） */}
        {!showImage && palette.imageUrl && (
          <div className="order-2 lg:order-1 lg:col-span-2">
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-3 min-h-[120px] lg:min-h-[150px] flex flex-col items-center justify-center relative">
              {/* 画像表示ボタン */}
              <button
                onClick={toggleImageDisplay}
                className="p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 rounded-full shadow-lg transition-all duration-300 hover:scale-110 mb-2"
                title="画像を表示する"
              >
                <Eye className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                画像が非表示中
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-1">
                目のアイコンで表示
              </p>
            </div>
          </div>
        )}
        
        {/* 右側：🎨 色混ぜコーナー（3/4幅） */}
        <div className={`order-1 lg:order-2 ${
          showImage && palette.imageUrl 
            ? 'lg:col-span-9' 
            : palette.imageUrl 
            ? 'lg:col-span-10'
            : 'lg:col-span-12'
        }`}>
          <div className="bg-gradient-to-br from-pink-50 to-yellow-50 dark:from-pink-900/20 dark:to-yellow-900/20 rounded-2xl">
            <ElementaryColorMixer
              colors={palette.colors.map(c => ({ ...c, id: c.id || generateColorId() }))}
              extractedColors={extractedColors}
              onColorMixed={handleColorMixed}
              theme="elementary"
              onSave={onSave}
              onShare={handleShare}
              onReset={onReset}
              showExportMenu={showExportMenu}
              onToggleExportMenu={() => setShowExportMenu(!showExportMenu)}
              onExport={handleExport}
            />
          </div>
        </div>
      </div>

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
