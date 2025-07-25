import chroma from 'chroma-js';
import { ColorInfo, MixedColor } from '../types/color';

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
export function createColorInfo(r: number, g: number, b: number, id?: string): ColorInfo {
  const hex = rgbToHex(r, g, b);
  const rgb = { r, g, b };
  const hsl = rgbToHsl(r, g, b);
  const name = getColorName(hex);
  
  return { hex, rgb, hsl, name, id: id || generateColorId() };
}

/**
 * カラーIDを生成
 */
export function generateColorId(): string {
  return 'color_' + Math.random().toString(36).substr(2, 9);
}

/**
 * 2つの色を混合する
 */
export function mixColors(color1: ColorInfo, color2: ColorInfo, ratio: number = 0.5): MixedColor {
  const mixed = chroma.mix(color1.hex, color2.hex, ratio);
  const [r, g, b] = mixed.rgb();
  
  const mixedColorInfo = createColorInfo(Math.round(r), Math.round(g), Math.round(b));
  
  return {
    ...mixedColorInfo,
    parentColors: [color1.id!, color2.id!],
    ratio: [1 - ratio, ratio],
    name: `${color1.name} × ${color2.name}`
  };
}

/**
 * 複数の色を混合する
 */
export function mixMultipleColors(colors: ColorInfo[], ratios?: number[]): MixedColor {
  if (colors.length < 2) throw new Error('最低2色必要です');
  
  const equalRatio = 1 / colors.length;
  const finalRatios = ratios || colors.map(() => equalRatio);
  
  // 最初の2色から始めて、順次混合
  let result = mixColors(colors[0], colors[1], finalRatios[1] / (finalRatios[0] + finalRatios[1]));
  
  // 3色目以降を順次混合
  for (let i = 2; i < colors.length; i++) {
    const currentRatio = finalRatios[i] / finalRatios.slice(0, i + 1).reduce((a, b) => a + b, 0);
    result = mixColors(
      { ...result, id: 'temp_mixed' },
      colors[i],
      currentRatio
    );
  }
  
  return {
    ...result,
    parentColors: colors.map(c => c.id!),
    ratio: finalRatios,
    name: colors.map(c => c.name).join(' × ')
  };
}

/**
 * ランダムな色を生成
 */
export function generateRandomColor(): ColorInfo {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return createColorInfo(r, g, b);
}

/**
 * 色の距離を計算（Delta E 2000）
 */
export function getColorDistance(color1: string, color2: string): number {
  return chroma.deltaE(color1, color2);
}

/**
 * 色の温度を取得（暖色/寒色の判定）
 */
export function getColorTemperature(hex: string): 'warm' | 'cool' | 'neutral' {
  const hsl = chroma(hex).hsl();
  const hue = hsl[0] || 0;
  
  if (hue >= 45 && hue <= 135) return 'cool'; // 青〜緑
  if (hue >= 225 && hue <= 315) return 'cool'; // 青〜紫
  if ((hue >= 315 && hue <= 360) || (hue >= 0 && hue <= 45)) return 'warm'; // 赤〜オレンジ
  if (hue >= 135 && hue <= 225) return 'warm'; // 黄〜オレンジ
  
  return 'neutral';
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
