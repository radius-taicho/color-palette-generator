import ColorThief from 'colorthief';
import { ColorInfo } from '../types/color';
import { createColorInfo } from './colorUtils';

/**
 * 画像から主要な色を抽出（改良版）
 */
export async function extractColorsFromImage(
  imageElement: HTMLImageElement,
  colorCount: number = 5
): Promise<ColorInfo[]> {
  return new Promise((resolve, reject) => {
    try {
      const colorThief = new ColorThief();
      
      // 画像が読み込まれていない場合は読み込み完了を待つ
      if (!imageElement.complete) {
        imageElement.onload = () => {
          extractColors();
        };
        imageElement.onerror = () => {
          reject(new Error('画像の読み込みに失敗しました'));
        };
      } else {
        extractColors();
      }
      
      function extractColors() {
        try {
          // ColorThiefで色を抽出
          const palette = colorThief.getPalette(imageElement, colorCount);
          let colors = palette.map(([r, g, b]: [number, number, number]) => 
            createColorInfo(r, g, b)
          );
          
          // 不足分の色を補完
          if (colors.length < colorCount) {
            const additionalColors = generateAdditionalColors(imageElement, colorCount - colors.length, colors);
            colors = [...colors, ...additionalColors];
          }
          
          resolve(colors);
        } catch (error) {
          // ColorThiefでエラーが発生した場合はCanvas方式にフォールバック
          try {
            const canvasColors = extractColorsFromCanvas(imageElement, colorCount);
            resolve(canvasColors);
          } catch (canvasError) {
            reject(new Error('色の抽出に失敗しました'));
          }
        }
      }
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 不足分の色を生成
 */
function generateAdditionalColors(
  imageElement: HTMLImageElement,
  neededCount: number,
  existingColors: ColorInfo[]
): ColorInfo[] {
  const additionalColors: ColorInfo[] = [];
  
  try {
    // Canvasを使用してより多くの色を抽出
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Canvas context の取得に失敗しました');
    }
    
    // 画像をCanvasに描画
    canvas.width = imageElement.naturalWidth;
    canvas.height = imageElement.naturalHeight;
    ctx.drawImage(imageElement, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // 色の頻度をカウント
    const colorMap = new Map<string, { count: number; r: number; g: number; b: number }>();
    
    // サンプリング間隔を調整して処理速度を向上
    const sampleRate = Math.max(1, Math.floor(data.length / 40000));
    
    for (let i = 0; i < data.length; i += 4 * sampleRate) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const alpha = data[i + 3];
      
      // 透明度が低い場合はスキップ
      if (alpha < 128) continue;
      
      // 色を16進数に変換してキーとして使用
      const colorKey = `${r},${g},${b}`;
      
      if (colorMap.has(colorKey)) {
        colorMap.get(colorKey)!.count++;
      } else {
        colorMap.set(colorKey, { count: 1, r, g, b });
      }
    }
    
    // 既存の色を除外
    const existingColorKeys = new Set(existingColors.map(c => `${c.rgb.r},${c.rgb.g},${c.rgb.b}`));
    
    // 頻度順でソートし、既存の色を除外
    const sortedColors = Array.from(colorMap.values())
      .filter(color => !existingColorKeys.has(`${color.r},${color.g},${color.b}`))
      .sort((a, b) => b.count - a.count);
    
    // 必要な数だけ色を追加
    for (let i = 0; i < Math.min(neededCount, sortedColors.length); i++) {
      const color = sortedColors[i];
      additionalColors.push(createColorInfo(color.r, color.g, color.b));
    }
    
    // まだ足りない場合は、既存の色のバリエーションを生成
    if (additionalColors.length < neededCount && existingColors.length > 0) {
      const remainingNeeded = neededCount - additionalColors.length;
      const variations = generateColorVariations(existingColors, remainingNeeded);
      additionalColors.push(...variations);
    }
    
  } catch (error) {
    console.warn('追加色の生成に失敗しました:', error);
    
    // フォールバック: 既存の色のバリエーションを生成
    if (existingColors.length > 0) {
      const variations = generateColorVariations(existingColors, neededCount);
      additionalColors.push(...variations);
    }
  }
  
  return additionalColors;
}

/**
 * 既存の色のバリエーションを生成
 */
function generateColorVariations(colors: ColorInfo[], count: number): ColorInfo[] {
  const variations: ColorInfo[] = [];
  
  for (let i = 0; i < count; i++) {
    const baseColor = colors[i % colors.length];
    const variation = generateColorVariation(baseColor, i);
    variations.push(variation);
  }
  
  return variations;
}

/**
 * 単一の色のバリエーションを生成
 */
function generateColorVariation(baseColor: ColorInfo, index: number): ColorInfo {
  const { r, g, b } = baseColor.rgb;
  
  // 色相、彩度、明度を微調整
  const adjustments = [
    { dr: 20, dg: 0, db: -20 },   // 暖色調
    { dr: -20, dg: 20, db: 0 },   // 寒色調
    { dr: 0, dg: -20, db: 20 },   // 青味
    { dr: 30, dg: 30, db: 30 },   // 明るく
    { dr: -30, dg: -30, db: -30 }, // 暗く
  ];
  
  const adjustment = adjustments[index % adjustments.length];
  
  const newR = Math.max(0, Math.min(255, r + adjustment.dr));
  const newG = Math.max(0, Math.min(255, g + adjustment.dg));
  const newB = Math.max(0, Math.min(255, b + adjustment.db));
  
  return createColorInfo(newR, newG, newB);
}

/**
 * 画像から最も支配的な色を抽出
 */
export async function extractDominantColor(
  imageElement: HTMLImageElement
): Promise<ColorInfo> {
  return new Promise((resolve, reject) => {
    try {
      const colorThief = new ColorThief();
      
      if (!imageElement.complete) {
        imageElement.onload = () => {
          extractColor();
        };
        imageElement.onerror = () => {
          reject(new Error('画像の読み込みに失敗しました'));
        };
      } else {
        extractColor();
      }
      
      function extractColor() {
        try {
          const [r, g, b] = colorThief.getColor(imageElement);
          const color = createColorInfo(r, g, b);
          resolve(color);
        } catch (error) {
          reject(new Error('支配的な色の抽出に失敗しました'));
        }
      }
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * File オブジェクトから画像要素を作成
 */
export function createImageElementFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        resolve(img);
      };
      
      img.onerror = () => {
        reject(new Error('画像の作成に失敗しました'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('ファイルの読み込みに失敗しました'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * 画像ファイルの検証
 */
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!validTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'JPEG、PNG、GIF、WebPファイルのみサポートされています'
    };
  }
  
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'ファイルサイズは10MB以下にしてください'
    };
  }
  
  return { isValid: true };
}

/**
 * 画像からカラーパレットを生成（メイン関数）
 */
export async function generatePaletteFromImage(
  file: File,
  colorCount: number = 5
): Promise<{
  colors: ColorInfo[];
  imageUrl: string;
}> {
  // ファイル検証
  const validation = validateImageFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }
  
  try {
    // 画像要素を作成
    const imageElement = await createImageElementFromFile(file);
    
    // 色を抽出
    const colors = await extractColorsFromImage(imageElement, colorCount);
    
    // 画像URLを作成
    const imageUrl = URL.createObjectURL(file);
    
    return {
      colors,
      imageUrl
    };
  } catch (error) {
    throw new Error(`カラーパレットの生成に失敗しました: ${error}`);
  }
}

/**
 * Canvas を使用してより精密な色抽出
 */
export function extractColorsFromCanvas(
  imageElement: HTMLImageElement,
  colorCount: number = 5
): ColorInfo[] {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Canvas context の取得に失敗しました');
  }
  
  // 画像をCanvasに描画
  canvas.width = imageElement.naturalWidth;
  canvas.height = imageElement.naturalHeight;
  ctx.drawImage(imageElement, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // 色の頻度をカウント
  const colorMap = new Map<string, { count: number; r: number; g: number; b: number }>();
  
  // サンプリング間隔を調整して処理速度を向上
  const sampleRate = Math.max(1, Math.floor(data.length / 40000));
  
  for (let i = 0; i < data.length; i += 4 * sampleRate) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const alpha = data[i + 3];
    
    // 透明度が低い場合はスキップ
    if (alpha < 128) continue;
    
    // 色を16進数に変換してキーとして使用
    const colorKey = `${r},${g},${b}`;
    
    if (colorMap.has(colorKey)) {
      colorMap.get(colorKey)!.count++;
    } else {
      colorMap.set(colorKey, { count: 1, r, g, b });
    }
  }
  
  // 頻度順でソート
  const sortedColors = Array.from(colorMap.values())
    .sort((a, b) => b.count - a.count);
  
  // 指定された数の色を取得
  const selectedColors = sortedColors.slice(0, colorCount);
  
  // 不足分を補完
  if (selectedColors.length < colorCount) {
    const additionalColors = generateColorVariations(
      selectedColors.map(c => createColorInfo(c.r, c.g, c.b)), 
      colorCount - selectedColors.length
    );
    const allColors = selectedColors.map(c => createColorInfo(c.r, c.g, c.b));
    allColors.push(...additionalColors);
    return allColors;
  }
  
  return selectedColors.map(color => createColorInfo(color.r, color.g, color.b));
}