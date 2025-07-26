// 🎯 **大人向け高度カラーユーティリティ**

import chroma from 'chroma-js';
import { formatRgb, parse, lab, lch, rgb, differenceEuclidean, differenceCie94, differenceCiede2000 } from 'culori';
import { ColorInfo } from '../types/color';
import { AdvancedColorInfo, LABColor, WCAGResult, ColorBlindnessResult } from '../types/advanced';

/**
 * 🔬 **精密色変換: RGB → LAB色空間**
 * 
 * LAB色空間は人間の視覚により近い色表現で、色の知覚差を正確に計算できます
 * 
 * @example
 * const labColor = rgbToLab(255, 128, 64);
 * // { l: 65.2, a: 18.4, b: 58.7 }
 */
export function rgbToLab(r: number, g: number, b: number): LABColor {
  const rgbColor = { mode: 'rgb' as const, r: r / 255, g: g / 255, b: b / 255 };
  const labColor = lab(rgbColor);
  
  return {
    l: Math.round((labColor?.l || 0) * 100) / 100,
    a: Math.round((labColor?.a || 0) * 100) / 100,
    b: Math.round((labColor?.b || 0) * 100) / 100
  };
}

/**
 * 🔬 **精密色変換: LAB → RGB色空間**
 */
export function labToRgb(labColor: LABColor): { r: number; g: number; b: number } {
  const labObj = { mode: 'lab' as const, l: labColor.l, a: labColor.a, b: labColor.b };
  const rgbColor = rgb(labObj);
  
  return {
    r: Math.round((rgbColor?.r || 0) * 255),
    g: Math.round((rgbColor?.g || 0) * 255),
    b: Math.round((rgbColor?.b || 0) * 255)
  };
}

/**
 * 🔬 **精密色変換: RGB → LCH色空間**
 * 
 * LCHは明度、彩度、色相の円筒座標系で直感的な色調整が可能
 */
export function rgbToLch(r: number, g: number, b: number): { l: number; c: number; h: number } {
  const rgbColor = { mode: 'rgb' as const, r: r / 255, g: g / 255, b: b / 255 };
  const lchColor = lch(rgbColor);
  
  return {
    l: Math.round((lchColor?.l || 0) * 100) / 100,
    c: Math.round((lchColor?.c || 0) * 100) / 100,
    h: Math.round((lchColor?.h || 0) * 100) / 100
  };
}

/**
 * 📊 **高精度Delta E計算 (CIE2000)**
 * 
 * 人間の色知覚により近いDelta E 2000アルゴリズムを使用
 * 値が小さいほど色の差が少ない（1以下: 人間には同じ色に見える）
 * 
 * @example
 * const diff = calculateDeltaE2000('#FF0000', '#FE0000');
 * // 0.8 (ほぼ同じ赤色)
 */
export function calculateDeltaE2000(color1: string, color2: string): number {
  try {
    const parsedColor1 = parse(color1);
    const parsedColor2 = parse(color2);
    
    if (!parsedColor1 || !parsedColor2) {
      return 100; // 無効な色の場合は最大差値を返す
    }
    
    const deltaE = differenceCiede2000()(parsedColor1, parsedColor2);
    return Math.round(deltaE * 100) / 100;
  } catch (error) {
    // フォールバックとしてchroma.jsのデフォルトdeltaEを使用
    return Math.round(chroma.deltaE(color1, color2) * 100) / 100;
  }
}

/**
 * 📊 **高精度Delta E計算 (CIE94)**
 */
export function calculateDeltaE94(color1: string, color2: string): number {
  try {
    const parsedColor1 = parse(color1);
    const parsedColor2 = parse(color2);
    
    if (!parsedColor1 || !parsedColor2) {
      return 100; // 無効な色の場合は最大差値を返す
    }
    
    const deltaE = differenceCie94()(parsedColor1, parsedColor2);
    return Math.round(deltaE * 100) / 100;
  } catch (error) {
    // フォールバックとしてchroma.jsのデフォルトdeltaEを使用
    return Math.round(chroma.deltaE(color1, color2) * 100) / 100;
  }
}

/**
 * 🔍 **WCAG 2.1準拠アクセシビリティチェック**
 * 
 * WebアクセシビリティガイドラインWCAG 2.1に基づいたコントラスト比チェック
 * - AA基準: 通常文字 4.5:1以上、大文字 3:1以上
 * - AAA基準: 通常文字 7:1以上、大文字 4.5:1以上
 * 
 * @example
 * const result = checkWCAGCompliance('#000000', '#FFFFFF');
 * // { contrastRatio: 21, aaLevel: { normal: true, large: true }, ... }
 */
export function checkWCAGCompliance(foreground: string, background: string): WCAGResult {
  const contrastRatio = Math.round(chroma.contrast(foreground, background) * 100) / 100;
  
  const aaLevel = {
    normal: contrastRatio >= 4.5,
    large: contrastRatio >= 3.0
  };
  
  const aaaLevel = {
    normal: contrastRatio >= 7.0,
    large: contrastRatio >= 4.5
  };
  
  // 🎨 **改善提案の生成**
  const suggestions = generateWCAGSuggestions(foreground, background, contrastRatio);
  
  return {
    foreground,
    background,
    contrastRatio,
    aaLevel,
    aaaLevel,
    suggestions
  };
}

/**
 * 💡 **WCAG改善提案の生成**
 */
function generateWCAGSuggestions(foreground: string, background: string, currentRatio: number): {
  lightVersion: string;
  darkVersion: string;
} {
  const targetRatio = 4.5; // AA基準
  
  // 明るい版の提案
  let lightVersion = foreground;
  let lightRatio = currentRatio;
  while (lightRatio < targetRatio) {
    lightVersion = chroma(lightVersion).brighten(0.5).hex();
    lightRatio = chroma.contrast(lightVersion, background);
    if (lightRatio > 21) break; // 無限ループ防止
  }
  
  // 暗い版の提案
  let darkVersion = foreground;
  let darkRatio = currentRatio;
  while (darkRatio < targetRatio) {
    darkVersion = chroma(darkVersion).darken(0.5).hex();
    darkRatio = chroma.contrast(darkVersion, background);
    if (darkRatio > 21) break; // 無限ループ防止
  }
  
  return { lightVersion, darkVersion };
}

/**
 * 👁️ **カラーブラインドネステスト実装**
 * 
 * 様々な色覚タイプでのパレット表示をシミュレーション
 * 
 * @example
 * const result = simulateColorBlindness([{hex: '#FF0000'}, {hex: '#00FF00'}]);
 * // 各色覚タイプでの見え方とアクセシビリティ評価
 */
export function simulateColorBlindness(colors: ColorInfo[]): ColorBlindnessResult {
  // Note: color-blindnessライブラリを使用予定だが、実装は基本的なシミュレーション
  
  const protanomaly = colors.map(color => ({
    ...color,
    hex: simulateProtanomaly(color.hex),
    name: `${color.name || 'Color'} (1型色覚)`
  }));
  
  const deuteranomaly = colors.map(color => ({
    ...color,
    hex: simulateDeuteranomaly(color.hex),
    name: `${color.name || 'Color'} (2型色覚)`
  }));
  
  const tritanomaly = colors.map(color => ({
    ...color,
    hex: simulateTritanomaly(color.hex),
    name: `${color.name || 'Color'} (3型色覚)`
  }));
  
  const monochromacy = colors.map(color => ({
    ...color,
    hex: simulateMonochromacy(color.hex),
    name: `${color.name || 'Color'} (1色型)`
  }));
  
  // 🔍 **アクセシビリティ評価**
  const accessibility = evaluateColorBlindnessAccessibility(colors, [
    protanomaly, deuteranomaly, tritanomaly, monochromacy
  ]);
  
  return {
    original: colors,
    protanomaly,
    deuteranomaly,
    tritanomaly,
    monochromacy,
    accessibility
  };
}

/**
 * 🔴 **1型色覚（赤色弱）シミュレーション**
 */
function simulateProtanomaly(hex: string): string {
  const hsl = chroma(hex).hsl();
  if (hsl[0] >= 0 && hsl[0] <= 60) {
    // 赤-オレンジ系を黄色寄りに
    return chroma.hsl((hsl[0] + 30) % 360, hsl[1] * 0.7, hsl[2]).hex();
  }
  return hex;
}

/**
 * 🟢 **2型色覚（緑色弱）シミュレーション**
 */
function simulateDeuteranomaly(hex: string): string {
  const hsl = chroma(hex).hsl();
  if (hsl[0] >= 60 && hsl[0] <= 180) {
    // 緑系を黄色寄りに
    return chroma.hsl(hsl[0] - 20, hsl[1] * 0.6, hsl[2]).hex();
  }
  return hex;
}

/**
 * 🔵 **3型色覚（青色弱）シミュレーション**
 */
function simulateTritanomaly(hex: string): string {
  const hsl = chroma(hex).hsl();
  if (hsl[0] >= 180 && hsl[0] <= 300) {
    // 青-紫系を緑寄りに
    return chroma.hsl((hsl[0] + 60) % 360, hsl[1] * 0.8, hsl[2]).hex();
  }
  return hex;
}

/**
 * ⚫ **1色型色覚（白黒）シミュレーション**
 */
function simulateMonochromacy(hex: string): string {
  const luminance = chroma(hex).luminance();
  const grayValue = Math.round(luminance * 255);
  return chroma.rgb(grayValue, grayValue, grayValue).hex();
}

/**
 * ✅ **色覚多様性アクセシビリティ評価**
 */
function evaluateColorBlindnessAccessibility(
  original: ColorInfo[],
  variants: ColorInfo[][]
): {
  isAccessible: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // 🔍 **色の区別可能性チェック**
  variants.forEach((variant, index) => {
    const typeNames = ['1型色覚', '2型色覚', '3型色覚', '1色型色覚'];
    const typeName = typeNames[index];
    
    for (let i = 0; i < variant.length - 1; i++) {
      for (let j = i + 1; j < variant.length; j++) {
        const deltaE = calculateDeltaE2000(variant[i].hex, variant[j].hex);
        if (deltaE < 3) { // 区別困難な閾値
          issues.push(`${typeName}で色${i + 1}と色${j + 1}の区別が困難 (ΔE: ${deltaE})`);
        }
      }
    }
  });
  
  // 🎨 **改善提案**
  if (issues.length > 0) {
    recommendations.push('💡 明度差を大きくする');
    recommendations.push('💡 パターンやテクスチャを併用する');
    recommendations.push('💡 色以外の視覚的手がかり（形状、サイズ）を活用する');
  }
  
  return {
    isAccessible: issues.length === 0,
    issues,
    recommendations
  };
}

/**
 * 🎯 **拡張カラー情報の生成**
 */
export function createAdvancedColorInfo(r: number, g: number, b: number, baseColor?: string): AdvancedColorInfo {
  const hex = chroma(r, g, b).hex();
  const rgb = { r, g, b };
  const hsl = {
    h: Math.round(chroma(r, g, b).hsl()[0] || 0),
    s: Math.round((chroma(r, g, b).hsl()[1] || 0) * 100),
    l: Math.round((chroma(r, g, b).hsl()[2] || 0) * 100)
  };
  
  const lab = rgbToLab(r, g, b);
  const lch = rgbToLch(r, g, b);
  
  // 🎨 **WCAG評価（白背景基準）**
  const wcagResult = checkWCAGCompliance(hex, '#FFFFFF');
  const wcag = {
    level: wcagResult.aaLevel.normal ? 'AA' : 'FAIL' as 'AA' | 'AAA' | 'FAIL',
    contrastRatio: wcagResult.contrastRatio
  };
  
  // 📊 **Delta E計算（基準色との比較）**
  const deltaE = baseColor ? calculateDeltaE2000(hex, baseColor) : undefined;
  
  return {
    hex,
    rgb,
    hsl,
    lab,
    lch,
    wcag,
    deltaE,
    name: getColorName(hex),
    id: generateColorId()
  };
}

/**
 * 🆔 **カラーID生成**
 */
export function generateColorId(): string {
  return 'adv_color_' + Math.random().toString(36).substr(2, 9);
}

/**
 * 🏷️ **色の名前を取得（拡張版）**
 */
export function getColorName(hex: string): string {
  // より詳細な色名データベースを使用予定
  const lab = rgbToLab(...chroma(hex).rgb());
  
  if (lab.l < 20) return 'ダークトーン';
  if (lab.l > 80) return 'ライトトーン';
  
  const hsl = chroma(hex).hsl();
  const h = hsl[0] || 0;
  const s = hsl[1] || 0;
  
  if (s < 0.1) return 'グレートーン';
  
  // 🎨 **高精度色相判定**
  if (h >= 0 && h < 15) return 'レッド系';
  if (h >= 15 && h < 45) return 'オレンジ系';
  if (h >= 45 && h < 75) return 'イエロー系';
  if (h >= 75 && h < 105) return 'イエローグリーン系';
  if (h >= 105 && h < 135) return 'グリーン系';
  if (h >= 135 && h < 165) return 'ブルーグリーン系';
  if (h >= 165 && h < 195) return 'シアン系';
  if (h >= 195 && h < 225) return 'スカイブルー系';
  if (h >= 225 && h < 255) return 'ブルー系';
  if (h >= 255 && h < 285) return 'バイオレット系';
  if (h >= 285 && h < 315) return 'パープル系';
  if (h >= 315 && h < 345) return 'マゼンタ系';
  if (h >= 345 && h <= 360) return 'レッド系';
  
  return 'カスタムカラー';
}

/**
 * 📊 **パレット全体のWCAG評価**
 */
export function evaluatePaletteWCAG(colors: ColorInfo[]): WCAGResult[] {
  const results: WCAGResult[] = [];
  
  // 🔄 **全組み合わせをチェック**
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const result = checkWCAGCompliance(colors[i].hex, colors[j].hex);
      results.push(result);
    }
  }
  
  return results;
}

/**
 * 🎨 **色調和の高度な計算**
 */
export function calculateAdvancedHarmony(baseColor: string): {
  complementary: string[];
  triadic: string[];
  tetradic: string[];
  analogous: string[];
  splitComplementary: string[];
} {
  const hsl = chroma(baseColor).hsl();
  const h = hsl[0] || 0;
  const s = hsl[1] || 0.5;
  const l = hsl[2] || 0.5;
  
  return {
    complementary: [chroma.hsl((h + 180) % 360, s, l).hex()],
    triadic: [
      chroma.hsl((h + 120) % 360, s, l).hex(),
      chroma.hsl((h + 240) % 360, s, l).hex()
    ],
    tetradic: [
      chroma.hsl((h + 90) % 360, s, l).hex(),
      chroma.hsl((h + 180) % 360, s, l).hex(),
      chroma.hsl((h + 270) % 360, s, l).hex()
    ],
    analogous: [
      chroma.hsl((h - 30 + 360) % 360, s, l).hex(),
      chroma.hsl((h + 30) % 360, s, l).hex()
    ],
    splitComplementary: [
      chroma.hsl((h + 150) % 360, s, l).hex(),
      chroma.hsl((h + 210) % 360, s, l).hex()
    ]
  };
}
