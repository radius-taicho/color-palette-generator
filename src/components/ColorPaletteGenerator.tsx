'use client';

import React, { useState, useCallback } from 'react';
import { Palette, Settings, Info, Sparkles, Briefcase } from 'lucide-react';
import { ColorPalette, PaletteTheme, PaletteGeneratorProps } from '../types/color';
import { generatePaletteFromImage } from '../utils/imageUtils';
import ImageUploader from './ImageUploader';
import ElementaryPaletteDisplay from './ElementaryPaletteDisplay';
import MiddleSchoolPaletteDisplay from './MiddleSchoolPaletteDisplay';

export default function ColorPaletteGenerator({ onPaletteGenerated }: PaletteGeneratorProps) {
  const [currentPalette, setCurrentPalette] = useState<ColorPalette | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [colorCount, setColorCount] = useState(5);
  const [savedPalettes, setSavedPalettes] = useState<ColorPalette[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paletteTheme, setPaletteTheme] = useState<PaletteTheme>('elementary');

  // ユニークIDを生成するヘルパー関数
  const generateUniqueId = useCallback(() => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substr(2, 9);
    const randomNumber = Math.floor(Math.random() * 1000000);
    const performanceNow = Math.floor(performance.now() * 1000);
    return `palette_${timestamp}_${randomString}_${randomNumber}_${performanceNow}`;
  }, []);

  const handleImageUploaded = useCallback(async (imageUrl: string, file: File) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const { colors, imageUrl: processedImageUrl } = await generatePaletteFromImage(file, colorCount);
      
      const palette: ColorPalette = {
        id: generateUniqueId(),
        name: `${file.name.split('.')[0]} の色`,
        colors,
        createdAt: new Date(),
        imageUrl: processedImageUrl
      };
      
      setCurrentPalette(palette);
      
      // 親コンポーネントに生成されたパレットを通知
      onPaletteGenerated(palette);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'パレットの生成に失敗しました');
    } finally {
      setIsGenerating(false);
    }
  }, [colorCount, onPaletteGenerated, generateUniqueId]);

  const handleSavePalette = useCallback(() => {
    if (!currentPalette) return;
    
    // 既に保存済みかチェック（IDで比較）
    const isAlreadySaved = savedPalettes.some(palette => palette.id === currentPalette.id);
    if (isAlreadySaved) {
      console.log('パレットは既に保存済みです:', currentPalette.id);
      return;
    }
    
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
    console.log('パレットを共有しました:', currentPalette);
  }, [currentPalette]);

  const handleReset = useCallback(() => {
    setCurrentPalette(null);
    setError(null);
  }, []);

  // テーマ情報
  const themeInfo = {
    elementary: {
      name: '🎨 子供向け',
      description: 'おおきくて楽しいパレット',
      color: 'from-pink-400 to-purple-400',
      icon: Sparkles
    },
    middle: {
      name: '💼 大人向け',
      description: 'プロ向け高機能パレット',
      color: 'from-blue-400 to-green-400',
      icon: Briefcase
    }
  };

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

  // テーマに応じてパレット表示コンポーネントを選択
  const renderPaletteDisplay = () => {
    if (!currentPalette) return null;

    const commonProps = {
      palette: currentPalette,
      onSave: handleSavePalette,
      onShare: handleSharePalette,
      theme: paletteTheme
    };

    switch (paletteTheme) {
      case 'elementary':
        return <ElementaryPaletteDisplay {...commonProps} />;
      case 'middle':
      default:
        return <MiddleSchoolPaletteDisplay {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* ヘッダー */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex items-center justify-between h-16 lg:h-20 xl:h-24">
            <div className="flex items-center space-x-3 lg:space-x-6">
              <div className={`p-3 lg:p-4 xl:p-5 bg-gradient-to-r ${themeInfo[paletteTheme].color} rounded-lg lg:rounded-xl`}>
                <Palette className="h-8 w-8 lg:h-10 lg:w-10 xl:h-12 xl:w-12 text-white" />
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl xl:text-3xl font-bold text-gray-800 dark:text-white">
                  Color Palette Generator
                </h1>
                <p className="text-sm lg:text-base xl:text-lg text-gray-600 dark:text-gray-400">
                  画像から美しいカラーパレットを生成
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 lg:space-x-6">
              {/* 設定ボタン */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-3 lg:p-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                title="設定"
              >
                <Settings className="h-6 w-6 lg:h-8 lg:w-8 xl:h-10 xl:w-10" />
              </button>
              
              {/* リセットボタン */}
              {currentPalette && (
                <button
                  onClick={handleReset}
                  className="px-6 py-3 lg:px-8 lg:py-4 text-base lg:text-lg xl:text-xl bg-gray-500 hover:bg-gray-600 text-white rounded-lg lg:rounded-xl transition-colors duration-200 font-medium"
                >
                  リセット
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* パレットテーマ選択 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-4 lg:py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 lg:gap-8">
            <h2 className="text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-800 dark:text-white">
              🎯 パレットのスタイルを選択
            </h2>
            <div className="flex gap-3 lg:gap-4">
              {(Object.keys(themeInfo) as PaletteTheme[]).map((theme) => {
                const info = themeInfo[theme];
                const Icon = info.icon;
                return (
                  <button
                    key={theme}
                    onClick={() => setPaletteTheme(theme)}
                    className={`flex items-center space-x-2 lg:space-x-3 px-4 py-2 lg:px-6 lg:py-3 xl:px-8 xl:py-4 text-base lg:text-lg xl:text-xl rounded-lg lg:rounded-xl font-medium transition-all duration-200 ${
                      paletteTheme === theme
                        ? `bg-gradient-to-r ${info.color} text-white shadow-lg scale-105`
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Icon className="h-6 w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8" />
                    <span>{info.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <p className="text-base lg:text-lg xl:text-xl text-gray-600 dark:text-gray-400 mt-3 lg:mt-4 text-center">
            {themeInfo[paletteTheme].description}
          </p>
        </div>
      </div>

      {/* 設定パネル */}
      {showSettings && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-4 lg:py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 lg:space-x-10">
              <div className="flex items-center space-x-3 lg:space-x-4">
                <label className="text-base lg:text-lg xl:text-xl font-medium text-gray-700 dark:text-gray-300">
                  抽出する色の数:
                </label>
                <select
                  value={colorCount}
                  onChange={(e) => setColorCount(parseInt(e.target.value))}
                  className="px-4 py-2 lg:px-6 lg:py-3 text-base lg:text-lg border border-gray-300 dark:border-gray-600 rounded-md lg:rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <option key={num} value={num}>{num}色</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center space-x-2 lg:space-x-3 text-base lg:text-lg text-gray-600 dark:text-gray-400">
                <Info className="h-5 w-5 lg:h-6 lg:w-6" />
                <span>多い色数ほど詳細な分析が可能ですが、処理時間が長くなります</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* メインコンテンツ */}
      <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-8 lg:py-12">
        {/* エラー表示 */}
        {error && (
          <div className="mb-6 lg:mb-8 p-4 lg:p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg lg:rounded-xl">
            <div className="flex items-center space-x-2 lg:space-x-3">
              <div className="w-3 h-3 lg:w-4 lg:h-4 bg-red-500 rounded-full"></div>
              <span className="text-red-700 dark:text-red-300 font-medium text-base lg:text-lg xl:text-xl">エラー</span>
            </div>
            <p className="text-red-600 dark:text-red-400 mt-2 lg:mt-3 text-base lg:text-lg">{error}</p>
          </div>
        )}

        {/* パレット表示またはアップロード */}
        {currentPalette ? (
          renderPaletteDisplay()
        ) : (
          <div className="space-y-8">
            {/* 画像アップロード */}
            <div className="text-center">
              <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-800 dark:text-white mb-6 lg:mb-8">
                🎨 画像から色を抽出しましょう
              </h2>
              <p className="text-lg lg:text-xl xl:text-2xl text-gray-600 dark:text-gray-400 mb-8 lg:mb-12 max-w-4xl mx-auto">
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
                            key={`${palette.id}-color-${index}`}
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
                    色を混ぜたり、CSS・JSON形式でエクスポートしてデザインプロジェクトで活用
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* フッター */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16 lg:mt-24">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-8 lg:py-12">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p className="text-base lg:text-lg xl:text-xl">
              💡 Created with ❤️ using Next.js, TypeScript, and Tailwind CSS
            </p>
            <p className="text-sm lg:text-base xl:text-lg mt-3 lg:mt-4">
              © 2024 Color Palette Generator. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
