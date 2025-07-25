'use client';

import React, { useState, useCallback } from 'react';
import { 
  Download, 
  Share2, 
  Save, 
  BookOpen, 
  RotateCcw, 
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ColorPalette, PaletteDisplayProps, EducationalMixingResult } from '../types/color';
import { exportToCss, exportToJson, copyToClipboard } from '../utils/colorUtils';

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

  // パネル切り替えボタン
  const panelButtons = [
    { key: 'mixer', label: '🧪 ミキサー', icon: '🧪' },
    { key: 'wheel', label: '🎡 色相環', icon: '🎡' },
    { key: 'theory', label: '📚 理論', icon: '📚' }
  ] as const;

  return (
    <div className="space-y-6">
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
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
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

        {/* 🎨 元画像とパレット表示 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* 元画像 */}
          {palette.imageUrl && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
              <h3 className="font-bold text-gray-800 dark:text-white mb-3">📸 元画像</h3>
              <img 
                src={palette.imageUrl} 
                alt={palette.name}
                className="w-full h-48 object-cover rounded-lg shadow-md"
              />
            </div>
          )}

          {/* 抽出された色 */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
            <h3 className="font-bold text-gray-800 dark:text-white mb-3">🎨 抽出色 ({palette.colors.length}色)</h3>
            <div className="grid grid-cols-5 gap-2">
              {palette.colors.map((color, index) => (
                <button
                  key={index}
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
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* アクション */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
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
    </div>
  );
}
