// 🎯 **大人向け高度カラーパレットジェネレーター**

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  Settings, 
  Eye, 
  Download, 
  Share2, 
  FolderOpen, 
  Zap,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ColorInfo, ColorPalette } from '../types/color';
import { ColorProject, AdvancedColorInfo, BatchProcessingJob } from '../types/advanced';

// コンポーネントのインポート
import ColorPaletteGenerator from './ColorPaletteGenerator';
import PreciseColorAdjuster from './PreciseColorAdjuster';
import WCAGChecker from './WCAGChecker';
import ColorBlindnessTest from './ColorBlindnessTest';
import ProjectManager from './ProjectManager';
import BatchProcessor from './BatchProcessor';
import PaletteDisplay from './PaletteDisplay';

/**
 * 🎯 **大人向け高度カラーパレットジェネレーター**
 * 
 * プロフェッショナル向けの包括的なカラーパレット生成・管理システム
 * 
 * 主な機能：
 * - 🎨 精密色調整（HSL、LAB、LCH色空間）
 * - 📊 Delta E計算による色差測定
 * - ♿ WCAG準拠アクセシビリティチェック
 * - 👁️ カラーブラインドネステスト
 * - 💼 プロジェクト管理（複数パレット整理）
 * - ⚡ バッチ処理（複数画像からの一括色抽出）
 * 
 * @example
 * <AdvancedColorPaletteGenerator />
 */
export default function AdvancedColorPaletteGenerator() {
  // 🎨 **メイン状態管理**
  const [currentPalette, setCurrentPalette] = useState<ColorPalette | null>(null);
  const [selectedColor, setSelectedColor] = useState<ColorInfo | null>(null);
  const [currentProject, setCurrentProject] = useState<ColorProject | null>(null);
  const [activeTab, setActiveTab] = useState<'generator' | 'adjuster' | 'wcag' | 'colorblind' | 'project' | 'batch'>('generator');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [wcagResults, setWcagResults] = useState([]);
  const [colorBlindnessResults, setColorBlindnessResults] = useState(null);
  
  // 📱 **レスポンシブ表示制御**
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 🎨 **パレット生成ハンドラー**
  const handlePaletteGenerated = (palette: ColorPalette) => {
    setCurrentPalette(palette);
    
    // 🏠 **現在のプロジェクトがある場合は自動的に追加**
    if (currentProject) {
      // プロジェクトマネージャーを使用してパレットを追加
      // 実装では ProjectManager コンポーネント内で処理
    }
  };

  // 🎨 **色変更ハンドラー**
  const handleColorChange = (updatedColor: AdvancedColorInfo) => {
    if (!currentPalette || !selectedColor) return;
    
    const updatedColors = currentPalette.colors.map(color => 
      color.id === selectedColor.id ? updatedColor : color
    );
    
    setCurrentPalette({
      ...currentPalette,
      colors: updatedColors
    });
    
    setSelectedColor(updatedColor);
  };

  // 📊 **プロジェクト選択ハンドラー**
  const handleProjectSelect = (project: ColorProject) => {
    setCurrentProject(project);
    
    // 最新のパレットを選択
    if (project.palettes.length > 0) {
      setCurrentPalette(project.palettes[project.palettes.length - 1]);
    }
    
    setActiveTab('project');
  };

  // ⚡ **バッチジョブ完了ハンドラー**
  const handleBatchJobComplete = (job: BatchProcessingJob) => {
    // 最初の結果を現在のパレットとして設定
    if (job.results && job.results.length > 0) {
      setCurrentPalette(job.results[0].palette);
    }
    
    setActiveTab('generator');
  };

  // 📤 **パレットエクスポートハンドラー**
  const handleExportPalette = () => {
    if (!currentPalette) return;
    
    // JSON形式でエクスポート
    const exportData = {
      name: currentPalette.name,
      colors: currentPalette.colors,
      created: currentPalette.createdAt,
      wcag: wcagResults,
      colorBlindness: colorBlindnessResults
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentPalette.name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 🎨 **タブ情報**
  const tabs = [
    {
      id: 'generator',
      name: 'パレット生成',
      icon: <Palette className="w-4 h-4" />,
      description: '画像からカラーパレットを生成'
    },
    {
      id: 'adjuster',
      name: '精密調整',
      icon: <Settings className="w-4 h-4" />,
      description: 'HSL・LAB・LCH色空間での細密調整',
      disabled: !selectedColor
    },
    {
      id: 'wcag',
      name: 'WCAG準拠',
      icon: <Eye className="w-4 h-4" />,
      description: 'アクセシビリティチェック',
      disabled: !currentPalette || currentPalette.colors.length < 2
    },
    {
      id: 'colorblind',
      name: '色覚テスト',
      icon: <Eye className="w-4 h-4" />,
      description: '色覚多様性対応確認',
      disabled: !currentPalette || currentPalette.colors.length === 0
    },
    {
      id: 'project',
      name: 'プロジェクト',
      icon: <FolderOpen className="w-4 h-4" />,
      description: '複数パレットの管理'
    },
    {
      id: 'batch',
      name: 'バッチ処理',
      icon: <Zap className="w-4 h-4" />,
      description: '複数画像からの一括抽出'
    }
  ];

  // 🎨 **アクティブタブのコンテンツレンダリング**
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'generator':
        return (
          <ColorPaletteGenerator 
            onPaletteGenerated={handlePaletteGenerated}
          />
        );
        
      case 'adjuster':
        return selectedColor ? (
          <PreciseColorAdjuster
            color={selectedColor}
            onColorChange={handleColorChange}
            mode="hsl"
            showHistory={true}
          />
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <Settings className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
            <p className="text-yellow-800">
              精密調整を行うには、まずパレットから色を選択してください。
            </p>
          </div>
        );
        
      case 'wcag':
        return currentPalette && currentPalette.colors.length >= 2 ? (
          <WCAGChecker
            colors={currentPalette.colors}
            onResultsChange={setWcagResults}
            targetLevel="AA"
            showSuggestions={true}
          />
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <Eye className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
            <p className="text-yellow-800">
              WCAGチェックには最低2色が必要です。パレットを生成してください。
            </p>
          </div>
        );
        
      case 'colorblind':
        return currentPalette && currentPalette.colors.length > 0 ? (
          <ColorBlindnessTest
            colors={currentPalette.colors}
            onResultsChange={setColorBlindnessResults}
            showSimulation={true}
          />
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <Eye className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
            <p className="text-yellow-800">
              色覚テストを行うには、まずパレットを生成してください。
            </p>
          </div>
        );
        
      case 'project':
        return (
          <ProjectManager
            onProjectSelect={handleProjectSelect}
            onPaletteSelect={setCurrentPalette}
            currentProject={currentProject}
          />
        );
        
      case 'batch':
        return (
          <BatchProcessor
            onJobComplete={handleBatchJobComplete}
            onPaletteSelect={setCurrentPalette}
          />
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 🏷️ **ヘッダー** */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Palette className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  プロフェッショナル カラーパレットジェネレーター
                </h1>
                <p className="text-sm text-gray-600">
                  高度な色彩理論とアクセシビリティ機能を搭載
                </p>
              </div>
            </div>
            
            {/* 🔧 **ヘッダーアクション** */}
            <div className="flex items-center space-x-3">
              {currentPalette && (
                <>
                  <button
                    onClick={handleExportPalette}
                    className="flex items-center px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    エクスポート
                  </button>
                  
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: currentPalette.name,
                          text: `カラーパレット: ${currentPalette.colors.map(c => c.hex).join(', ')}`,
                          url: window.location.href
                        });
                      } else {
                        navigator.clipboard.writeText(
                          currentPalette.colors.map(c => c.hex).join(', ')
                        );
                        alert('パレットをクリップボードにコピーしました！');
                      }
                    }}
                    className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Share2 className="w-4 h-4 mr-1" />
                    共有
                  </button>
                </>
              )}
              
              {/* ℹ️ **情報ボタン** */}
              <button
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="高度な機能について"
              >
                <Info className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* ℹ️ **高度機能説明パネル** */}
      {showAdvancedOptions && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  🎯 プロフェッショナル機能について
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-blue-800">
                  <div>
                    <h4 className="font-medium mb-1">🔬 精密色調整</h4>
                    <p>HSL、LAB、LCH色空間での科学的な色調整。人間の視覚により近いLAB色空間で、知覚的に均等な色調整が可能。</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">📊 Delta E計算</h4>
                    <p>CIE2000アルゴリズムによる色の知覚差測定。1以下で人間には同じ色に見え、プロの色管理に必須。</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">♿ WCAG準拠チェック</h4>
                    <p>WebアクセシビリティガイドラインWCAG 2.1に基づくコントラスト比自動評価。AA/AAA基準対応。</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">👁️ 色覚多様性テスト</h4>
                    <p>1型・2型・3型色覚や全色盲での見え方をシミュレーション。約8%の男性、0.5%の女性に配慮。</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">💼 プロジェクト管理</h4>
                    <p>複数パレットの体系的管理、タグ機能、バージョン管理。チーム作業や大規模プロジェクトに対応。</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">⚡ バッチ処理</h4>
                    <p>複数画像からの一括カラー抽出。K-means、Median-Cut、Octreeアルゴリズム選択可能。</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowAdvancedOptions(false)}
                className="ml-4 p-1 text-blue-600 hover:text-blue-800"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 🎨 **現在のパレット表示** */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Palette className="w-5 h-5 mr-2" />
                現在のパレット
              </h3>
              
              {currentPalette ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-800">{currentPalette.name}</h4>
                    <p className="text-sm text-gray-600">
                      {currentPalette.colors.length} 色
                    </p>
                  </div>
                  
                  {/* 🎨 **カラーサンプル** */}
                  <div className="space-y-2">
                    {currentPalette.colors.map((color, index) => (
                      <div
                        key={color.id || index}
                        className={`flex items-center space-x-3 p-2 rounded cursor-pointer transition-colors ${
                          selectedColor?.id === color.id 
                            ? 'bg-blue-50 border-2 border-blue-300'
                            : 'hover:bg-gray-50 border-2 border-transparent'
                        }`}
                        onClick={() => setSelectedColor(color)}
                      >
                        <div 
                          className="w-8 h-8 rounded border border-gray-200 flex-shrink-0"
                          style={{ backgroundColor: color.hex }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {color.name}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">
                            {color.hex}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* 📊 **パレット統計** */}
                  <div className="pt-4 border-t border-gray-200 space-y-2 text-sm">
                    {wcagResults.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">WCAG AA準拠:</span>
                        <span className="font-medium">
                          {wcagResults.filter((r: any) => r.aaLevel.normal).length}/{wcagResults.length}
                        </span>
                      </div>
                    )}
                    
                    {colorBlindnessResults && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">色覚対応:</span>
                        <span className={`font-medium ${
                          (colorBlindnessResults as any).accessibility.isAccessible 
                            ? 'text-green-600' 
                            : 'text-yellow-600'
                        }`}>
                          {(colorBlindnessResults as any).accessibility.isAccessible ? '✓' : '△'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Palette className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    まだパレットが生成されていません
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    画像をアップロードして開始
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* 🎛️ **メインコンテンツエリア** */}
          <div className="lg:col-span-3">
            {/* 📑 **タブナビゲーション** */}
            <div className="bg-white rounded-lg shadow-lg mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                  {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const isDisabled = tab.disabled;
                    
                    return (
                      <button
                        key={tab.id}
                        onClick={() => !isDisabled && setActiveTab(tab.id as any)}
                        disabled={isDisabled}
                        className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                          isActive
                            ? 'border-blue-500 text-blue-600'
                            : isDisabled
                            ? 'border-transparent text-gray-400 cursor-not-allowed'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                        title={isDisabled ? '無効 - 前のステップを完了してください' : tab.description}
                      >
                        {tab.icon}
                        <span className="ml-2">{tab.name}</span>
                        {isDisabled && (
                          <span className="ml-1 text-xs">(!)</span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
              
              {/* 📝 **アクティブタブの説明** */}
              <div className="px-6 py-3 bg-gray-50">
                <p className="text-sm text-gray-600">
                  {tabs.find(tab => tab.id === activeTab)?.description}
                </p>
              </div>
            </div>
            
            {/* 🎯 **アクティブタブコンテンツ** */}
            <div className="space-y-6">
              {renderActiveTabContent()}
            </div>
          </div>
        </div>
      </div>
      
      {/* 🦶 **フッター** */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">🎨 色彩理論について</h4>
              <p className="text-sm text-gray-600">
                このツールは最新の色彩科学に基づき、CIE LAB色空間やDelta E 2000アルゴリズムを
                使用して、人間の視覚により近い色処理を実現しています。
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">♿ アクセシビリティ</h4>
              <p className="text-sm text-gray-600">
                WCAG 2.1ガイドラインに準拠し、色覚多様性を持つ約8.5%の人々にも
                配慮したデザインをサポートします。
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">🔬 技術仕様</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• CIE LAB/LCH色空間対応</li>
                <li>• Delta E 2000色差計算</li>
                <li>• K-means/Median-Cut/Octreeアルゴリズム</li>
                <li>• WCAG 2.1 AA/AAA準拠チェック</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              © 2024 プロフェッショナル カラーパレットジェネレーター - 
              科学的色彩理論とアクセシビリティを重視したカラーツール
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
