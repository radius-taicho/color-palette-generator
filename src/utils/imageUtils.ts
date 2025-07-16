import ColorThief from 'colorthief';
import { ColorInfo } from '../types/color';
import { createColorInfo } from './colorUtils';

/**
 * 画像から主要な色を抽出
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
          const palette = colorThief.getPalette(imageElement, colorCount);
          const colors = palette.map(([r, g, b]: [number, number, number]) => 
            createColorInfo(r, g, b)
          );
          resolve(colors);
        } catch (error) {
          reject(new Error('色の抽出に失敗しました'));
        }
      }
    } catch (error) {
      reject(error);
    }
  });
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
  canvas: HTMLCanvasElement,
  colorCount: number = 5
): ColorInfo[] {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas context の取得に失敗しました');
  }
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // 色の頻度をカウント
  const colorMap = new Map<string, { count: number; r: number; g: number; b: number }>();
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const alpha = data[i + 3];
    
    // 透明度が低い場合はスキップ
    if (alpha < 128) continue;
    
    // 色ぢ16進数に変換してキーとして使用
    const colorKey = `${r},${g},${b}`;
    
    if (colorMap.has(colorKey)) {
      colorMap.get(colorKey)!.count++;
    } else {
      colorMap.set(colorKey, { count: 1, r, g, b });
    }
  }
  
  // 頻度順でソート
  const sortedColors = Array.from(colorMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, colorCount);
  
  return sortedColors.map(color => createColorInfo(color.r, color.g, color.b));
}