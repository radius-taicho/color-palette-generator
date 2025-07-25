// 🎯 **大人向け高度機能の型定義**

import { ColorInfo, ColorPalette } from './color';

// LAB色空間の型定義
export interface LABColor {
  l: number; // 明度 (0-100)
  a: number; // 緑-赤軸 (-128 to 127)
  b: number; // 青-黄軸 (-128 to 127)
}

// 拡張されたカラー情報（大人向け）
export interface AdvancedColorInfo extends ColorInfo {
  lab: LABColor;
  lch: {
    l: number; // 明度
    c: number; // 彩度
    h: number; // 色相
  };
  wcag: {
    level: 'AA' | 'AAA' | 'FAIL';
    contrastRatio: number;
  };
  deltaE?: number; // 基準色との知覚差
}

// プロジェクト管理の型定義
export interface ColorProject {
  id: string;
  name: string;
  description?: string;
  palettes: ColorPalette[];
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  isPublic: boolean;
}

// WCAGアクセシビリティチェック結果
export interface WCAGResult {
  foreground: string;
  background: string;
  contrastRatio: number;
  aaLevel: {
    normal: boolean;
    large: boolean;
  };
  aaaLevel: {
    normal: boolean;
    large: boolean;
  };
  suggestions?: {
    lightVersion: string;
    darkVersion: string;
  };
}

// カラーブラインドネステスト結果
export interface ColorBlindnessResult {
  original: ColorInfo[];
  protanomaly: ColorInfo[]; // 1型色覚異常
  deuteranomaly: ColorInfo[]; // 2型色覚異常
  tritanomaly: ColorInfo[]; // 3型色覚異常
  monochromacy: ColorInfo[]; // 1色型色覚
  accessibility: {
    isAccessible: boolean;
    issues: string[];
    recommendations: string[];
  };
}

// バッチ処理用の型定義
export interface BatchProcessingJob {
  id: string;
  name: string;
  images: File[];
  options: {
    paletteSize: number;
    algorithm: 'kmeans' | 'median-cut' | 'octree';
    includeWCAG: boolean;
    includeColorBlindness: boolean;
  };
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  results?: {
    imageUrl: string;
    palette: ColorPalette;
    wcag?: WCAGResult[];
    colorBlindness?: ColorBlindnessResult;
  }[];
  createdAt: Date;
}

// 精密色調整用のインターフェース
export interface PreciseColorAdjustment {
  mode: 'hsl' | 'lab' | 'lch';
  adjustments: {
    [key: string]: number; // 'h', 's', 'l', 'a', 'b', 'c' など
  };
  preview: ColorInfo;
  history: {
    before: ColorInfo;
    after: ColorInfo;
    timestamp: Date;
    adjustment: string;
  }[];
}

// エクスポート設定の拡張
export interface AdvancedExportOptions {
  format: 'hex' | 'rgb' | 'hsl' | 'lab' | 'lch';
  includeNames: boolean;
  fileType: 'json' | 'css' | 'scss' | 'text' | 'ase' | 'aco';
  includeWCAG: boolean;
  includeColorBlindness: boolean;
  includeLAB: boolean;
  compression: 'none' | 'zip';
  naming: 'auto' | 'custom';
  customNames?: string[];
}

// コンポーネントのProps型定義
export interface PreciseColorAdjusterProps {
  color: ColorInfo;
  onColorChange: (color: AdvancedColorInfo) => void;
  mode?: 'hsl' | 'lab' | 'lch';
  showHistory?: boolean;
}

export interface WCAGCheckerProps {
  colors: ColorInfo[];
  onResultsChange: (results: WCAGResult[]) => void;
  targetLevel?: 'AA' | 'AAA';
  showSuggestions?: boolean;
}

export interface ColorBlindnessTestProps {
  colors: ColorInfo[];
  onResultsChange: (results: ColorBlindnessResult) => void;
  showSimulation?: boolean;
}

export interface ProjectManagerProps {
  onProjectSelect: (project: ColorProject) => void;
  onPaletteSelect: (palette: ColorPalette) => void;
  currentProject: ColorProject | null;
}

export interface BatchProcessorProps {
  onJobComplete: (job: BatchProcessingJob) => void;
  onPaletteSelect: (palette: ColorPalette) => void;
}
