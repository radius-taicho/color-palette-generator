'use client';

import React, { useState, useCallback } from 'react';
import { Palette, Settings, Info } from 'lucide-react';
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

  const handleImageUploaded = useCallback(async (imageUrl: string, file: File) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const { colors, imageUrl: processedImageUrl } = await generatePaletteFromImage(file, colorCount);
      
      const palette: ColorPalette = {
        id: Date.now().toString(),
        name: `${file.name.split('.')[0]} の色`,
        colors,
        createdAt: new Date(),
        imageUrl: processedImageUrl
      };
      
      setCurrentPalette(palette);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'パレットの生成に失敗しました');
    } finally {
      setIsGenerating(false);
    }
  }, [colorCount]);

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
    setError(null);
  }, []);

  // 初期化時にローカルストレージからパレットを読み込み
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('colorPalettes');
      if (saved) {
        setSavedPalettes(JSON.parse(saved));
      }
    } catch (error) {
      console.error('保存済みパレットの読み込みに失敗しました:', error);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* ヘッダー */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                <Palette className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800 dark:text-white">
                  Color Palette Generator
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  画像から美しいカラーパレットを生成
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* 設定ボタン */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                title="設定"
              >
                <Settings className="h-5 w-5" />
              </button>
              
              {/* リセットボタン */}
              {currentPalette && (
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
                >
                  リセット
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 設定パネル */}
      {showSettings && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  抽出する色の数:
                </label>
                <select
                  value={colorCount}
                  onChange={(e) => setColorCount(parseInt(e.target.value))}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <option key={num} value={num}>{num}色</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Info className="h-4 w-4" />
                <span>多い色数ほど詳細な分析が可能ですが、処理時間が長くなります</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* エラー表示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-red-700 dark:text-red-300 font-medium">エラー</span>
            </div>
            <p className="text-red-600 dark:text-red-400 mt-1">{error}</p>
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
          <div className="space-y-8">
            {/* 画像アップロード */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                🎨 画像から色を抽出しましょう
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                お気に入りの画像をアップロードして、美しいカラーパレットを自動生成します
              </p>
              
              <ImageUploader 
                onImageUploaded={handleImageUploaded}
                isLoading={isGenerating}
              />
            </div>

            {/* 保存済みパレット */}
            {savedPalettes.length > 0 && (
              <div className="mt-12">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
                  📚 保存済みパレット
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedPalettes.slice(-6).map((palette) => (
                    <div
                      key={palette.id}
                      className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                      onClick={() => setCurrentPalette(palette)}
                    >
                      <h4 className="font-medium text-gray-800 dark:text-white mb-2">
                        {palette.name}
                      </h4>
                      <div className="flex h-6 rounded overflow-hidden">
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
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                🚀 使い方
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">1</span>
                  </div>
                  <h4 className="font-medium text-gray-800 dark:text-white mb-2">画像をアップロード</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    JPEG、PNG、GIFなどの画像ファイルをドラッグ&ドロップまたはクリックでアップロード
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-green-600 dark:text-green-400 font-bold">2</span>
                  </div>
                  <h4 className="font-medium text-gray-800 dark:text-white mb-2">色を抽出</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    AIが画像から主要な色を自動的に抽出し、美しいパレットを生成
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-purple-600 dark:text-purple-400 font-bold">3</span>
                  </div>
                  <h4 className="font-medium text-gray-800 dark:text-white mb-2">活用する</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    CSS、JSON形式でエクスポートしたり、デザインプロジェクトで活用
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* フッター */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p className="text-sm">
              💡 Created with ❤️ using Next.js, TypeScript, and Tailwind CSS
            </p>
            <p className="text-xs mt-2">
              © 2024 Color Palette Generator. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}