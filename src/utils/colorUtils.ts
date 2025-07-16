import chroma from 'chroma-js';
import { ColorInfo } from '../types/color';

/**
 * RGB値をHEXに変換
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return chroma(r, g, b).hex();
}

/**
 * HEX値をRGBに変換
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const color = chroma(hex);
  const [r, g, b] = color.rgb();
  return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
}

/**
 * RGB値をHSLに変換
 */
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const color = chroma(r, g, b);
  const [h, s, l] = color.hsl();
  return { 
    h: Math.round(h || 0), 
    s: Math.round(s * 100), 
    l: Math.round(l * 100) 
  };
}

/**
 * RGB値からColorInfoオブジェクトを作成
 */
export function createColorInfo(r: number, g: number, b: number): ColorInfo {
  const hex = rgbToHex(r, g, b);
  const rgb = { r, g, b };
  const hsl = rgbToHsl(r, g, b);
  const name = getColorName(hex);
  
  return { hex, rgb, hsl, name };
}

/**
 * 色の名前を取得（簡易版）
 */
export function getColorName(hex: string): string {
  const colorNames: { [key: string]: string } = {
    '#FF0000': 'レッド',
    '#00FF00': 'グリーン',
    '#0000FF': 'ブルー',
    '#FFFF00': 'イエロー',
    '#FF00FF': 'マゼンタ',
    '#00FFFF': 'シアン',
    '#000000': 'ブラック',
    '#FFFFFF': 'ホワイト',
    '#808080': 'グレー',
    '#FFA500': 'オレンジ',
    '#800080': 'パープル',
    '#FFC0CB': 'ピンク',
    '#A52A2A': 'ブラウン',
    '#008000': 'ダークグリーン',
    '#000080': 'ネイビー',
  };

  // 完全一致をチェック
  if (colorNames[hex.toUpperCase()]) {
    return colorNames[hex.toUpperCase()];
  }

  // 近似色を検索
  const color = chroma(hex);
  const hsl = color.hsl();
  const h = hsl[0] || 0;
  const s = hsl[1] || 0;
  const l = hsl[2] || 0;

  if (s < 0.1) {
    if (l < 0.2) return 'ダークグレー';
    if (l < 0.5) return 'グレー';
    if (l < 0.8) return 'ライトグレー';
    return 'ホワイト';
  }

  if (l < 0.15) return 'ダーク';
  if (l > 0.85) return 'ライト';

  if (h < 15 || h > 345) return 'レッド系';
  if (h < 45) return 'オレンジ系';
  if (h < 75) return 'イエロー系';
  if (h < 150) return 'グリーン系';
  if (h < 180) return 'シアン系';
  if (h < 250) return 'ブルー系';
  if (h < 290) return 'パープル系';
  if (h < 345) return 'ピンク系';

  return 'カスタム';
}

/**
 * 色のコントラスト比を計算
 */
export function getContrastRatio(color1: string, color2: string): number {
  return chroma.contrast(color1, color2);
}

/**
 * 色が明るいかどうかを判定
 */
export function isLightColor(hex: string): boolean {
  return chroma(hex).luminance() > 0.5;
}

/**
 * 色を明るくする
 */
export function lightenColor(hex: string, amount: number): string {
  return chroma(hex).brighten(amount).hex();
}

/**
 * 色を暗くする
 */
export function darkenColor(hex: string, amount: number): string {
  return chroma(hex).darken(amount).hex();
}

/**
 * 補色を取得
 */
export function getComplementaryColor(hex: string): string {
  const hsl = chroma(hex).hsl();
  const complementaryHue = ((hsl[0] || 0) + 180) % 360;
  return chroma.hsl(complementaryHue, hsl[1], hsl[2]).hex();
}

/**
 * 類似色を生成
 */
export function getAnalogousColors(hex: string, count: number = 5): string[] {
  const hsl = chroma(hex).hsl();
  const baseHue = hsl[0] || 0;
  const colors: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const hue = (baseHue + (i - Math.floor(count / 2)) * 30) % 360;
    colors.push(chroma.hsl(hue, hsl[1], hsl[2]).hex());
  }
  
  return colors;
}

/**
 * カラーパレットをCSS形式でエクスポート
 */
export function exportToCss(colors: ColorInfo[], paletteName: string): string {
  const cssVars = colors.map((color, index) => 
    `  --color-${index + 1}: ${color.hex};`
  ).join('\n');
  
  return `:root {\n${cssVars}\n}\n\n/* ${paletteName} */`;
}

/**
 * カラーパレットをJSON形式でエクスポート
 */
export function exportToJson(colors: ColorInfo[], paletteName: string): string {
  const palette = {
    name: paletteName,
    colors: colors.map(color => ({
      hex: color.hex,
      rgb: color.rgb,
      hsl: color.hsl,
      name: color.name
    }))
  };
  
  return JSON.stringify(palette, null, 2);
}

/**
 * クリップボードにコピー
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('クリップボードへのコピーに失敗しました:', err);
    return false;
  }
}