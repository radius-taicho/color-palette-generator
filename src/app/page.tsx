'use client';

import ColorPaletteGenerator from '../components/ColorPaletteGenerator';

export default function Home() {
  return (
    <ColorPaletteGenerator 
      onPaletteGenerated={(palette) => {
        console.log('Generated palette:', palette);
      }}
    />
  );
}
