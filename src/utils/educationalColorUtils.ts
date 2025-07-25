import chroma from 'chroma-js';
import { 
  ColorInfo, 
  EducationalColorInfo, 
  ColorScience, 
  ColorTheoryExplanation,
  EducationalMixingResult 
} from '../types/color';

/**
 * 🎓 中高生向け教育的色彩ユーティリティ
 */

/**
 * 色の科学的情報を生成
 */
export function generateColorScience(color: ColorInfo): ColorScience {
  const chromaColor = chroma(color.hex);
  const hsl = chromaColor.hsl();

  // 波長の概算（可視光線 380-750nm）
  const getWavelength = (hue: number): number | undefined => {
    if (isNaN(hue)) return undefined;
    
    // 色相から波長を概算（非線形変換）
    if (hue >= 0 && hue < 60) {
      // 赤 → 橙
      return 700 - (hue / 60) * 75; // 700-625nm
    } else if (hue >= 60 && hue < 120) {
      // 橙 → 黄 → 緑
      return 625 - ((hue - 60) / 60) * 95; // 625-530nm
    } else if (hue >= 120 && hue < 180) {
      // 緑 → シアン
      return 530 - ((hue - 120) / 60) * 30; // 530-500nm
    } else if (hue >= 180 && hue < 240) {
      // シアン → 青
      return 500 - ((hue - 180) / 60) * 25; // 500-475nm
    } else if (hue >= 240 && hue < 300) {
      // 青 → 紫
      return 475 - ((hue - 240) / 60) * 65; // 475-410nm
    } else {
      // 紫 → 赤
      return 410 - ((hue - 300) / 60) * 30; // 410-380nm
    }
  };

  // CIE xy色度座標（簡易計算）
  const getChromaticity = (rgb: number[]): { x: number; y: number } => {
    // RGB to XYZ (sRGB)
    const [r, g, b] = rgb.map(val => {
      val = val / 255;
      if (val > 0.04045) {
        val = Math.pow((val + 0.055) / 1.055, 2.4);
      } else {
        val = val / 12.92;
      }
      return val * 100;
    });

    const X = r * 0.4124 + g * 0.3576 + b * 0.1805;
    const Y = r * 0.2126 + g * 0.7152 + b * 0.0722;
    const Z = r * 0.0193 + g * 0.1192 + b * 0.9505;

    const sum = X + Y + Z;
    if (sum === 0) return { x: 0, y: 0 };

    return {
      x: Math.round((X / sum) * 10000) / 10000,
      y: Math.round((Y / sum) * 10000) / 10000
    };
  };

  const [r, g, b] = chromaColor.rgb();
  const hue = hsl[0] || 0;

  return {
    wavelength: getWavelength(hue),
    luminance: Math.round(chromaColor.luminance() * 10000) / 10000,
    chromaticity: getChromaticity([r, g, b])
  };
}

/**
 * 色相環上の位置を計算
 */
export function calculateWheelPosition(color: ColorInfo): { angle: number; radius: number } {
  const hsl = chroma(color.hex).hsl();
  
  return {
    angle: Math.round(hsl[0] || 0), // 色相角度
    radius: Math.round((hsl[1] || 0) * 100) // 彩度（半径）
  };
}

/**
 * 色彩心理効果を取得
 */
export function getColorPsychologyEffects(color: ColorInfo): string[] {
  const hsl = chroma(color.hex).hsl();
  const hue = hsl[0] || 0;
  const saturation = hsl[1] || 0;
  const lightness = hsl[2] || 0;

  const effects: string[] = [];

  // 色相による心理効果
  if (hue >= 345 || hue < 15) {
    effects.push('情熱的', '活力', '興奮', '注意喚起');
  } else if (hue < 45) {
    effects.push('暖かさ', '親しみやすさ', '創造性', '活発さ');
  } else if (hue < 75) {
    effects.push('明るさ', '楽観的', '注意', '知性');
  } else if (hue < 150) {
    effects.push('自然', '安らぎ', '成長', 'バランス');
  } else if (hue < 180) {
    effects.push('爽快感', '清潔感', 'リフレッシュ');
  } else if (hue < 250) {
    effects.push('冷静', '信頼', '安定', '集中');
  } else if (hue < 290) {
    effects.push('神秘的', '高貴', '創造的', '想像力');
  } else {
    effects.push('優雅', 'ロマンチック', '愛情', '柔らかさ');
  }

  // 彩度と明度による調整
  if (saturation < 0.3) {
    effects.push('落ち着いた', '上品な');
  } else if (saturation > 0.7) {
    effects.push('鮮やか', 'インパクトのある');
  }

  if (lightness < 0.3) {
    effects.push('重厚感', '安定感');
  } else if (lightness > 0.7) {
    effects.push('軽やか', '清潔感');
  }

  return effects.slice(0, 6); // 最大6個に制限
}

/**
 * 色の調和色を計算
 */
export function calculateHarmonyColors(color: ColorInfo) {
  const hsl = chroma(color.hex).hsl();
  const hue = hsl[0] || 0;
  const saturation = hsl[1] || 0;
  const lightness = hsl[2] || 0;

  return {
    complementary: chroma.hsl((hue + 180) % 360, saturation, lightness).hex(),
    analogous: [
      chroma.hsl((hue - 30 + 360) % 360, saturation, lightness).hex(),
      chroma.hsl((hue + 30) % 360, saturation, lightness).hex()
    ],
    triadic: [
      chroma.hsl((hue + 120) % 360, saturation, lightness).hex(),
      chroma.hsl((hue + 240) % 360, saturation, lightness).hex()
    ],
    tetradic: [
      chroma.hsl((hue + 90) % 360, saturation, lightness).hex(),
      chroma.hsl((hue + 180) % 360, saturation, lightness).hex(),
      chroma.hsl((hue + 270) % 360, saturation, lightness).hex()
    ]
  };
}

/**
 * ColorInfoからEducationalColorInfoに変換
 */
export function enhanceColorWithEducationalInfo(color: ColorInfo): EducationalColorInfo {
  return {
    ...color,
    science: generateColorScience(color),
    wheelPosition: calculateWheelPosition(color),
    psychologyEffects: getColorPsychologyEffects(color),
    harmonyColors: calculateHarmonyColors(color)
  };
}

/**
 * 混色の理論説明を生成
 */
export function generateMixingTheory(colors: ColorInfo[], result: ColorInfo): ColorTheoryExplanation {
  const isAdditive = colors.length <= 3; // 光の三原色的な混合かどうか
  
  if (isAdditive) {
    return {
      title: '加法混色の原理',
      description: '光の三原色（赤・緑・青）を組み合わせて新しい色を作ります。スクリーンやディスプレイで使われる原理です。',
      principles: [
        '赤（R）+ 緑（G）= 黄色',
        '緑（G）+ 青（B）= シアン',
        '青（B）+ 赤（R）= マゼンタ',
        '赤 + 緑 + 青 = 白色'
      ],
      examples: [
        {
          before: colors,
          after: result,
          explanation: `${colors.map(c => c.name).join(' + ')} = ${result.name}`
        }
      ]
    };
  } else {
    return {
      title: '減法混色の原理',
      description: '絵の具やインクのように、色を混ぜるほど暗くなる原理です。物体の表面で光が反射・吸収される現象です。',
      principles: [
        'シアン + マゼンタ = 青紫',
        'マゼンタ + イエロー = 赤',
        'イエロー + シアン = 緑',
        'シアン + マゼンタ + イエロー = 黒'
      ],
      examples: [
        {
          before: colors,
          after: result,
          explanation: `${colors.map(c => c.name).join(' + ')} = ${result.name}`
        }
      ]
    };
  }
}

/**
 * 教育的混色結果を生成
 */
export function createEducationalMixingResult(
  colors: ColorInfo[], 
  result: ColorInfo, 
  ratio: number[]
): EducationalMixingResult {
  const theory = generateMixingTheory(colors, result);
  const mixingType = colors.length <= 3 ? 'additive' : 'subtractive';
  
  // 科学的説明を生成
  const scientificExplanation = mixingType === 'additive' 
    ? `光の波長が重ね合わされ、眼の錐体細胞が異なる刺激を受けることで新しい色が知覚されます。混合比率は ${ratio.map(r => Math.round(r * 100)).join(':')}% です。`
    : `各色素が特定の波長を吸収し、反射された光の組み合わせが新しい色として見えます。混合比率は ${ratio.map(r => Math.round(r * 100)).join(':')}% です。`;

  // 実世界での応用例
  const realWorldApplications = mixingType === 'additive'
    ? ['テレビ・モニター画面', 'スマートフォンディスプレイ', 'LEDライト', '舞台照明']
    : ['絵の具・水彩画', '印刷（CMYK）', '染料・顔料', '化粧品'];

  return {
    hex: result.hex,
    rgb: result.rgb,
    hsl: result.hsl,
    name: result.name,
    id: result.id,
    parentColors: colors.map(c => c.id!),
    ratio,
    theory,
    mixingType,
    scientificExplanation,
    realWorldApplications
  };
}



/**
 * 色の波長から見える色の説明を取得
 */
export function getWavelengthDescription(wavelength: number): string {
  if (wavelength < 380) {
    return '紫外線領域（人間の目には見えません）';
  } else if (wavelength < 450) {
    return '紫色（最も波長の短い可視光線）';
  } else if (wavelength < 495) {
    return '青色（空や海の色）';
  } else if (wavelength < 570) {
    return '緑色（自然界で最も多く見られる色）';
  } else if (wavelength < 590) {
    return '黄色（太陽光の主成分）';
  } else if (wavelength < 620) {
    return 'オレンジ色（夕日や火の色）';
  } else if (wavelength < 750) {
    return '赤色（最も波長の長い可視光線）';
  } else {
    return '赤外線領域（人間の目には見えません）';
  }
}

/**
 * 色相環上の角度から色名を取得
 */
export function getColorNameFromAngle(angle: number): string {
  const normalizedAngle = ((angle % 360) + 360) % 360;
  
  if (normalizedAngle < 15 || normalizedAngle >= 345) return '赤';
  if (normalizedAngle < 45) return '赤オレンジ';
  if (normalizedAngle < 75) return 'オレンジ';
  if (normalizedAngle < 105) return '黄オレンジ';
  if (normalizedAngle < 135) return '黄';
  if (normalizedAngle < 165) return '黄緑';
  if (normalizedAngle < 195) return '緑';
  if (normalizedAngle < 225) return '青緑';
  if (normalizedAngle < 255) return '青';
  if (normalizedAngle < 285) return '青紫';
  if (normalizedAngle < 315) return '紫';
  return '赤紫';
}
