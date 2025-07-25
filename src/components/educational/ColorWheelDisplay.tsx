'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ColorInfo, ColorWheelProps } from '../../types/color';
import { enhanceColorWithEducationalInfo, getColorNameFromAngle } from '../../utils/educationalColorUtils';
import chroma from 'chroma-js';

export default function ColorWheelDisplay({
  selectedColor,
  onColorSelect,
  showHarmonyLines = true,
  showAngles = true,
  size = 300
}: ColorWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredAngle, setHoveredAngle] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // 🎨 色相環を描画
  const drawColorWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    // キャンバスをクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 🌈 色相環を描画（360度に分割）
    for (let angle = 0; angle < 360; angle += 1) {
      const startAngle = (angle - 90) * (Math.PI / 180); // 12時方向を0度とする
      const endAngle = (angle + 1 - 90) * (Math.PI / 180);

      // 彩度のグラデーションを描画
      for (let saturationStep = 0; saturationStep < 10; saturationStep++) {
        const saturation = (saturationStep + 1) / 10;
        const innerRadius = radius * 0.3 + (radius * 0.7 * saturationStep / 10);
        const outerRadius = radius * 0.3 + (radius * 0.7 * (saturationStep + 1) / 10);

        const color = chroma.hsl(angle, saturation, 0.6).hex();

        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
        ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
        ctx.closePath();

        ctx.fillStyle = color;
        ctx.fill();
      }
    }

    // 🎯 選択された色の位置を表示
    if (selectedColor) {
      const educationalColor = enhanceColorWithEducationalInfo(selectedColor);
      const angle = educationalColor.wheelPosition.angle;
      const saturation = educationalColor.wheelPosition.radius / 100;
      
      const positionRadius = radius * 0.3 + (radius * 0.7 * saturation);
      const angleRad = (angle - 90) * (Math.PI / 180);
      const x = centerX + positionRadius * Math.cos(angleRad);
      const y = centerY + positionRadius * Math.sin(angleRad);

      // 選択色の円
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fillStyle = selectedColor.hex;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // 外側に黒い境界線
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 🔗 調和色のライン表示
      if (showHarmonyLines && educationalColor.harmonyColors) {
        const drawHarmonyLine = (targetHex: string, lineStyle: string, opacity: number) => {
          try {
            const targetHsl = chroma(targetHex).hsl();
            const targetAngle = targetHsl[0] || 0;
            const targetSaturation = targetHsl[1] || 0;
            
            const targetRadius = radius * 0.3 + (radius * 0.7 * targetSaturation);
            const targetAngleRad = (targetAngle - 90) * (Math.PI / 180);
            const targetX = centerX + targetRadius * Math.cos(targetAngleRad);
            const targetY = centerY + targetRadius * Math.sin(targetAngleRad);

            ctx.save();
            ctx.globalAlpha = opacity;
            ctx.setLineDash(lineStyle === 'dashed' ? [5, 5] : []);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(targetX, targetY);
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // 調和色の点
            ctx.beginPath();
            ctx.arc(targetX, targetY, 4, 0, 2 * Math.PI);
            ctx.fillStyle = targetHex;
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
          } catch (error) {
            // 色変換エラーを無視
          }
        };

        // 補色
        drawHarmonyLine(educationalColor.harmonyColors.complementary, 'solid', 0.8);
        
        // 類似色
        educationalColor.harmonyColors.analogous.forEach(color => {
          drawHarmonyLine(color, 'dashed', 0.6);
        });
      }
    }

    // 🕐 角度の目盛りを表示
    if (showAngles) {
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let angle = 0; angle < 360; angle += 30) {
        const angleRad = (angle - 90) * (Math.PI / 180);
        const x = centerX + (radius + 20) * Math.cos(angleRad);
        const y = centerY + (radius + 20) * Math.sin(angleRad);

        ctx.fillStyle = '#666666';
        ctx.fillText(`${angle}°`, x, y);

        // 主要色名を表示
        if (angle % 60 === 0) {
          const colorName = getColorNameFromAngle(angle);
          ctx.font = '10px sans-serif';
          ctx.fillStyle = '#888888';
          ctx.fillText(colorName, x, y + 15);
          ctx.font = '12px sans-serif';
        }
      }
    }

    // ホバー位置の表示
    if (hoveredAngle !== null) {
      const angleRad = (hoveredAngle - 90) * (Math.PI / 180);
      const hoverRadius = radius * 0.8;
      const x = centerX + hoverRadius * Math.cos(angleRad);
      const y = centerY + hoverRadius * Math.sin(angleRad);

      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fill();
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 角度とカラー名を表示
      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = '#333333';
      ctx.fillText(`${Math.round(hoveredAngle)}°`, centerX, centerY - 30);
      ctx.font = '12px sans-serif';
      ctx.fillText(getColorNameFromAngle(hoveredAngle), centerX, centerY - 10);
    }

    // 中心の情報表示
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#333333';
    ctx.fillText('色相環', centerX, centerY + 5);
    
    if (selectedColor) {
      const educationalColor = enhanceColorWithEducationalInfo(selectedColor);
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#666666';
      ctx.fillText(`${educationalColor.wheelPosition.angle}° | ${educationalColor.wheelPosition.radius}%`, 
                  centerX, centerY + 20);
    }

  }, [selectedColor, showHarmonyLines, showAngles, hoveredAngle, size]);

  // 🖱️ マウス/タッチ操作
  const getAngleFromEvent = useCallback((event: MouseEvent | React.MouseEvent | TouchEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in event && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else if ('clientX' in event) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else {
      return null;
    }

    const x = clientX - rect.left - canvas.width / 2;
    const y = clientY - rect.top - canvas.height / 2;
    
    const distance = Math.sqrt(x * x + y * y);
    const minRadius = (Math.min(canvas.width, canvas.height) / 2) * 0.3;
    const maxRadius = (Math.min(canvas.width, canvas.height) / 2) - 10;

    // 色相環の範囲内かチェック
    if (distance < minRadius || distance > maxRadius) {
      return null;
    }

    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    if (angle >= 360) angle -= 360;

    return angle;
  }, []);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isDragging) {
      const angle = getAngleFromEvent(event);
      setHoveredAngle(angle);
    }
  }, [isDragging, getAngleFromEvent]);

  const handleMouseLeave = useCallback(() => {
    if (!isDragging) {
      setHoveredAngle(null);
    }
  }, [isDragging]);

  const handleClick = useCallback((event: React.MouseEvent) => {
    const angle = getAngleFromEvent(event);
    if (angle === null || !onColorSelect) return;

    // 角度から色を生成（彩度80%、明度60%）
    const color = chroma.hsl(angle, 0.8, 0.6);
    const [r, g, b] = color.rgb();

    const colorInfo: ColorInfo = {
      hex: color.hex(),
      rgb: { r: Math.round(r), g: Math.round(g), b: Math.round(b) },
      hsl: { h: Math.round(angle), s: 80, l: 60 },
      name: `${getColorNameFromAngle(angle)} (${Math.round(angle)}°)`,
      id: `wheel-${Math.round(angle)}-${Date.now()}`
    };

    onColorSelect(colorInfo);
  }, [getAngleFromEvent, onColorSelect]);

  // タッチ操作
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    event.preventDefault();
    setIsDragging(true);
    const angle = getAngleFromEvent(event);
    setHoveredAngle(angle);
  }, [getAngleFromEvent]);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    event.preventDefault();
    const angle = getAngleFromEvent(event);
    setHoveredAngle(angle);
  }, [getAngleFromEvent]);

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    event.preventDefault();
    setIsDragging(false);
    
    if (hoveredAngle !== null && onColorSelect) {
      const color = chroma.hsl(hoveredAngle, 0.8, 0.6);
      const [r, g, b] = color.rgb();

      const colorInfo: ColorInfo = {
        hex: color.hex(),
        rgb: { r: Math.round(r), g: Math.round(g), b: Math.round(b) },
        hsl: { h: Math.round(hoveredAngle), s: 80, l: 60 },
        name: `${getColorNameFromAngle(hoveredAngle)} (${Math.round(hoveredAngle)}°)`,
        id: `wheel-${Math.round(hoveredAngle)}-${Date.now()}`
      };

      onColorSelect(colorInfo);
    }
    setHoveredAngle(null);
  }, [hoveredAngle, onColorSelect]);

  // 描画更新
  useEffect(() => {
    drawColorWheel();
  }, [drawColorWheel]);

  // リサイズ対応
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        drawColorWheel();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawColorWheel]);

  return (
    <div className="flex flex-col items-center bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg">
      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center">
        🎡 インタラクティブ色相環
        {showAngles && <span className="ml-2 text-sm text-gray-500">（角度表示）</span>}
      </h3>
      
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="cursor-pointer border-2 border-gray-200 dark:border-gray-600 rounded-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'none' }}
      />

      {/* 🎓 説明パネル */}
      <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <div>
            <div className="font-bold mb-1">🎨 使い方</div>
            <p>クリック: 色を選択</p>
            <p>ホバー: 角度確認</p>
          </div>
          <div>
            <div className="font-bold mb-1">📐 角度系</div>
            <p>0° = 赤</p>
            <p>120° = 緑</p>
            <p>240° = 青</p>
          </div>
        </div>
        
        {showHarmonyLines && selectedColor && (
          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="font-bold text-blue-800 dark:text-blue-300">調和色表示</div>
            <div className="flex justify-center space-x-4 text-xs mt-1">
              <span>— 補色</span>
              <span>- - 類似色</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}