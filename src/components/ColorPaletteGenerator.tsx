'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Palette, Settings, Info, RefreshCw, X } from 'lucide-react';
import { ColorPalette } from '../types/color';
import { generatePaletteFromImage } from '../utils/imageUtils';
import ImageUploader from './ImageUploader';
import PaletteDisplay from './PaletteDisplay';

export default function ColorPaletteGenerator() {
  const [currentPalette, setCurrentPalette] = useState<ColorPalette | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [colorCount, setColorCount] = useState(5);
  const [savedPalettes, setSavedPalettes] = useState<ColorPalette[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUploadedFile, setLastUploadedFile] = useState<File | null>(null);

  // 設定変更時の処理を改善
  const handleColorCountChange = useCallback((newCount: number) => {
    console.log('Color count changed to:', newCount); // デバッグ用
    setColorCount(newCount);
    
    // 既存のパレットがある場合は新しい設定で再生成
    if (currentPalette && lastUploadedFile) {
      // 少し遅延を入れて状態が確実に更新されるようにする
      setTimeout(async () => {
        setIsGenerating(true);
        setError(null);
        
        try {
          const { colors, imageUrl: processedImageUrl } = await generatePaletteFromImage(lastUploadedFile, newCount);
          
          const updatedPalette: ColorPalette = {
            ...currentPalette,
            colors,
            name: `${lastUploadedFile.name.split('.')[0]} の色 (${newCount}色)`,
            imageUrl: processedImageUrl
          };
          
          setCurrentPalette(updatedPalette);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'パレットの再生成に失敗しました');
        } finally {
          setIsGenerating(false);
        }
      }, 100);
    }
  }, [currentPalette, lastUploadedFile]);

  // 画像アップロード処理を改善
  const handleImageUploaded = useCallback(async (imageUrl: string, file: File) => {
    // 現在のcolorCountの値を確実に使用するために、最新の状態を取得
    const currentColorCount = colorCount;
    console.log('Image uploaded with colorCount:', currentColorCount); // デバッグ用
    
    setIsGenerating(true);
    setError(null);
    setLastUploadedFile(file);
    
    try {
      const { colors, imageUrl: processedImageUrl } = await generatePaletteFromImage(file, currentColorCount);
      
      const palette: ColorPalette = {
        id: Date.now().toString(),
        name: `${file.name.split('.')[0]} の色 (${currentColorCount}色)`,
        colors,
        createdAt: new Date(),
        imageUrl: processedImageUrl
      };
      
      setCurrentPalette(palette);
      // 設定パネルを自動で閉じる
      setShowSettings(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'パレットの生成に失敗しました');
    } finally {
      setIsGenerating(false);
    }
  }, [colorCount]); // colorCountを依存関係に追加

  const handleSavePalette = useCallback(() => {
    if (!currentPalette) return;
    
    const updated = [...savedPalettes, currentPalette];
    setSavedPalettes(updated);
    
    // ローカルストレージに保存
    try {
      localStorage.setItem('colorPalettes', JSON.stringify(updated));
    } catch (error) {
      console.error('パレットの保存に失敗しました:', error);
    }
  }, [currentPalette, savedPalettes]);

  const handleSharePalette = useCallback(() => {
    // 共有処理のログ
    console.log('パレットを共有しました:', currentPalette);
  }, [currentPalette]);

  const handleReset = useCallback(() => {
    setCurrentPalette(null);
    setLastUploadedFile(null);
    setError(null);
  }, []);

  const handleRegenerateWithNewSettings = useCallback(async () => {
    if (!lastUploadedFile) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const { colors, imageUrl: processedImageUrl } = await generatePaletteFromImage(lastUploadedFile, colorCount);
      
      const palette: ColorPalette = {
        id: Date.now().toString(),
        name: `${lastUploadedFile.name.split('.')[0]} の色 (${colorCount}色)`,
        colors,
        createdAt: new Date(),
        imageUrl: processedImageUrl
      };
      
      setCurrentPalette(palette);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'パレットの再生成に失敗しました');
    } finally {
      setIsGenerating(false);
    }
  }, [lastUploadedFile, colorCount]);

  // 初期化時にローカルストレージからパレットを読み込み
  useEffect(() => {
    try {
      const saved = localStorage.getItem('colorPalettes');
      if (saved) {
        setSavedPalettes(JSON.parse(saved));
      }
    } catch (error) {
      console.error('保存済みパレットの読み込みに失敗しました:', error);
    }
  }, []);

  // デバッグ用: colorCountの変更を監視
  useEffect(() => {
    console.log('Current colorCount:', colorCount);
  }, [colorCount]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* ヘッダー */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex-shrink-0">
                <Palette className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-xl font-bold text-gray-800 dark:text-white truncate">
                  Color Palette Generator
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">
                  画像から美しいカラーパレットを生成
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              {/* 現在の設定表示 - より目立つように */}
              <div className="flex items-center space-x-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="whitespace-nowrap font-medium text-blue-700 dark:text-blue-300">{colorCount}色</span>
              </div>
              
              {/* 設定ボタン */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-1.5 sm:p-2 transition-colors ${
                  showSettings 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
                title="設定"
              >
                <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              
              {/* 再生成ボタン */}
              {currentPalette && lastUploadedFile && (
                <button
                  onClick={handleRegenerateWithNewSettings}
                  disabled={isGenerating}
                  className="p-1.5 sm:p-2 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors disabled:opacity-50"
                  title="現在の設定で再生成"
                >
                  <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 ${isGenerating ? 'animate-spin' : ''}`} />
                </button>
              )}
              
              {/* リセットボタン - モバイルでは省略形 */}
              {currentPalette && (
                <button
                  onClick={handleReset}
                  className="px-2 py-1 sm:px-4 sm:py-2 bg-gray-500 hover:bg-gray-600 text-white rounded text-xs sm:text-sm transition-colors duration-200"
                >
                  <span className="hidden sm:inline">リセット</span>
                  <span className="sm:hidden">×</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 設定パネル */}
      {showSettings && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-6">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    抽出する色の数:
                  </label>
                  <select
                    value={colorCount}
                    onChange={(e) => {
                      const newCount = parseInt(e.target.value);
                      console.log('Select changed to:', newCount); // デバッグ用
                      handleColorCountChange(newCount);
                    }}
                    className="px-2 py-1 sm:px-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[80px]"
                  >
                    {[3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <option key={num} value={num}>{num}色</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  <Info className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">設定を変更すると即座に反映されます</span>
                </div>
              </div>
              
              {/* 設定パネル閉じるボタン */}
              <button
                onClick={() => setShowSettings(false)}
                className="self-end sm:self-auto p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="設定パネルを閉じる"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
            
            {/* 設定変更時の説明 */}
            {currentPalette && (
              <div className="mt-3 sm:mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center space-x-2 text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                  <span>設定を変更すると、既存のパレットが新しい設定で自動再生成されます</span>
                </div>
              </div>
            )}
            
            {/* デバッグ情報 - 開発時のみ表示 */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs">
                <span className="text-yellow-700 dark:text-yellow-300">
                  デバッグ: 現在の色数設定 = {colorCount}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* エラー表示 */}
        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-red-700 dark:text-red-300 font-medium text-sm">エラー</span>
            </div>
            <p className="text-red-600 dark:text-red-400 mt-1 text-sm">{error}</p>
          </div>
        )}

        {/* パレット表示またはアップロード */}
        {currentPalette ? (
          <PaletteDisplay
            palette={currentPalette}
            onSave={handleSavePalette}
            onShare={handleSharePalette}
          />
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {/* 画像アップロード */}
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-3 sm:mb-4">
                🎨 画像から色を抽出しましょう
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 px-4">
                お気に入りの画像をアップロードして、美しいカラーパレットを自動生成します
              </p>
              
              {/* 現在の設定表示 */}
              <div className="mb-4 sm:mb-6">
                <div className="inline-flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                    現在の設定: {colorCount}色で抽出
                  </span>
                </div>
              </div>
              
              <ImageUploader 
                onImageUploaded={handleImageUploaded}
                isLoading={isGenerating}
              />
            </div>

            {/* 保存済みパレット */}
            {savedPalettes.length > 0 && (
              <div className="mt-8 sm:mt-12">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-4 sm:mb-6">
                  📚 保存済みパレット
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {savedPalettes.slice(-6).map((palette) => (
                    <div
                      key={palette.id}
                      className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                      onClick={() => setCurrentPalette(palette)}
                    >
                      <h4 className="font-medium text-gray-800 dark:text-white mb-2 text-sm sm:text-base truncate">
                        {palette.name}
                      </h4>
                      <div className="flex h-4 sm:h-6 rounded overflow-hidden">
                        {palette.colors.map((color, index) => (
                          <div
                            key={index}
                            className="flex-1"
                            style={{ backgroundColor: color.hex }}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {new Date(palette.createdAt).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 使い方説明 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-lg">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800 dark:text-white">
                🚀 使い方
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <span className="text-blue-600 dark:text-blue-400 font-bold text-sm sm:text-base">1</span>
                  </div>
                  <h4 className="font-medium text-gray-800 dark:text-white mb-1 sm:mb-2 text-sm sm:text-base">設定を調整</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                    歯車アイコンから抽出する色の数を3-10色で設定
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <span className="text-green-600 dark:text-green-400 font-bold text-sm sm:text-base">2</span>
                  </div>
                  <h4 className="font-medium text-gray-800 dark:text-white mb-1 sm:mb-2 text-sm sm:text-base">画像をアップロード</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                    JPEG、PNG、GIFなどの画像ファイルをドラッグ&ドロップまたはクリックでアップロード
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <span className="text-purple-600 dark:text-purple-400 font-bold text-sm sm:text-base">3</span>
                  </div>
                  <h4 className="font-medium text-gray-800 dark:text-white mb-1 sm:mb-2 text-sm sm:text-base">活用する</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                    CSS、JSON形式でエクスポートしたり、デザインプロジェクトで活用
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* フッター */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-8 sm:mt-16">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p className="text-xs sm:text-sm">
              💡 Created with ❤️ using Next.js, TypeScript, and Tailwind CSS
            </p>
            <p className="text-xs mt-1 sm:mt-2">
              © 2024 Color Palette Generator. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}