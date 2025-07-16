export interface ColorInfo {
  hex: string;
  rgb: {
    r: number;
    g: number;
    b: number;
  };
  hsl: {
    h: number;
    s: number;
    l: number;
  };
  name?: string;
}

export interface ColorPalette {
  id: string;
  name: string;
  colors: ColorInfo[];
  createdAt: Date;
  imageUrl?: string;
}

export interface PaletteGeneratorProps {
  onPaletteGenerated: (palette: ColorPalette) => void;
}

export interface ColorCardProps {
  color: ColorInfo;
  onColorChange?: (newColor: ColorInfo) => void;
  onRemove?: () => void;
  showControls?: boolean;
}

export interface ImageUploaderProps {
  onImageUploaded: (imageUrl: string, file: File) => void;
  isLoading?: boolean;
}

export interface PaletteDisplayProps {
  palette: ColorPalette;
  onSave?: () => void;
  onShare?: () => void;
}

export type ColorFormat = 'hex' | 'rgb' | 'hsl';

export interface ColorExportOptions {
  format: ColorFormat;
  includeNames: boolean;
  fileType: 'json' | 'css' | 'scss' | 'text';
}