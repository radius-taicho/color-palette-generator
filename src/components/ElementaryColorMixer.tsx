"use client";

import React, { useState, useCallback, useRef } from "react";
import { Sparkles, Copy, Trash2, Heart, Download, Share2 } from "lucide-react";
import { ColorInfo, MixedColor, ColorMixerProps } from "../types/color";
import { mixMultipleColors, copyToClipboard } from "../utils/colorUtils";

export default function ElementaryColorMixer({
  colors,
  onColorMixed,
  onColorExtracted,
  onColorRemoved,
  extractedColors = [],
  onSave,
  onShare,
  onReset,
  showExportMenu = false,
  onToggleExportMenu,
  onExport,
}: ColorMixerProps) {
  // 3つのミキサー用の状態
  const [mixingColors1, setMixingColors1] = useState<ColorInfo[]>([]);
  const [mixingColors2, setMixingColors2] = useState<ColorInfo[]>([]);
  const [mixingColors3, setMixingColors3] = useState<ColorInfo[]>([]);
  const [mixedColor1, setMixedColor1] = useState<MixedColor | null>(null);
  const [mixedColor2, setMixedColor2] = useState<MixedColor | null>(null);
  const [mixedColor3, setMixedColor3] = useState<MixedColor | null>(null);
  const [sparkleEffect, setSparkleEffect] = useState<string | null>(null);
  const [dragOverMixer, setDragOverMixer] = useState<number | null>(null);
  const [dragOverExtracted, setDragOverExtracted] = useState<boolean>(false);
  const [animatingMixer, setAnimatingMixer] = useState<number | null>(null);
  const [hoveredColor, setHoveredColor] = useState<{
    hex: string;
    x: number;
    y: number;
  } | null>(null);

  const mixer1Ref = useRef<HTMLDivElement>(null);
  const mixer2Ref = useRef<HTMLDivElement>(null);
  const mixer3Ref = useRef<HTMLDivElement>(null);

  // 色の明度に基づいて適切な文字色を決定するヘルパー関数
  const getContrastTextColor = useCallback((hex: string): string => {
    // hex to rgb
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    // 明度を計算 (0-255)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    // 明度が128以下なら白文字、それ以上なら黒文字
    return brightness <= 128 ? "#ffffff" : "#000000";
  }, []);

  // ホバー時のツールチップ表示
  const handleColorHover = useCallback(
    (event: React.MouseEvent, hex: string) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top;
      setHoveredColor({ hex, x, y });
    },
    []
  );

  // ホバー終了時のツールチップ非表示
  const handleColorLeave = useCallback(() => {
    setHoveredColor(null);
  }, []);

  // ミキサーごとの状態を取得するヘルパー関数
  const getMixingColors = useCallback(
    (mixerIndex: number): ColorInfo[] => {
      switch (mixerIndex) {
        case 1:
          return mixingColors1;
        case 2:
          return mixingColors2;
        case 3:
          return mixingColors3;
        default:
          return [];
      }
    },
    [mixingColors1, mixingColors2, mixingColors3]
  );

  const setMixingColors = useCallback(
    (mixerIndex: number, colors: ColorInfo[]) => {
      switch (mixerIndex) {
        case 1:
          setMixingColors1(colors);
          break;
        case 2:
          setMixingColors2(colors);
          break;
        case 3:
          setMixingColors3(colors);
          break;
      }
    },
    []
  );

  const getMixedColor = useCallback(
    (mixerIndex: number): MixedColor | null => {
      switch (mixerIndex) {
        case 1:
          return mixedColor1;
        case 2:
          return mixedColor2;
        case 3:
          return mixedColor3;
        default:
          return null;
      }
    },
    [mixedColor1, mixedColor2, mixedColor3]
  );

  const setMixedColor = useCallback(
    (mixerIndex: number, color: MixedColor | null) => {
      switch (mixerIndex) {
        case 1:
          setMixedColor1(color);
          break;
        case 2:
          setMixedColor2(color);
          break;
        case 3:
          setMixedColor3(color);
          break;
      }
    },
    []
  );

  const getMixerRef = useCallback((mixerIndex: number) => {
    switch (mixerIndex) {
      case 1:
        return mixer1Ref;
      case 2:
        return mixer2Ref;
      case 3:
        return mixer3Ref;
      default:
        return mixer1Ref;
    }
  }, []);

  // 色をクリック（コピー機能）
  const handleColorClick = useCallback(async (color: ColorInfo) => {
    await copyToClipboard(color.hex);
    setSparkleEffect(`copy-${color.hex}`);
    setTimeout(() => setSparkleEffect(null), 800);
  }, []);

  // 色を混ぜる処理（制限なし）
  const handleColorMix = useCallback(
    (color: ColorInfo, mixerIndex: number) => {
      const currentMixingColors = getMixingColors(mixerIndex);
      const isDuplicate = currentMixingColors.some((c) => c.hex === color.hex);
      if (isDuplicate) return;

      const newMixingColors = [...currentMixingColors, color];
      setMixingColors(mixerIndex, newMixingColors);

      setSparkleEffect(`mix-${color.hex}`);
      setTimeout(() => setSparkleEffect(null), 1000);

      // 2色以上になったら混合処理を実行
      if (newMixingColors.length >= 2) {
        setTimeout(() => {
          const mixed = mixMultipleColors(newMixingColors);
          setMixedColor(mixerIndex, mixed);
          onColorMixed(mixed);
        }, 600);
      }
    },
    [getMixingColors, setMixingColors, setMixedColor, onColorMixed]
  );

  // ドラッグ開始
  const handleDragStart = useCallback(
    (e: React.DragEvent, color: ColorInfo) => {
      e.dataTransfer.setData("application/json", JSON.stringify(color));
      e.dataTransfer.effectAllowed = "copy";
    },
    []
  );

  // ドロップエリアにドラッグオーバー
  const handleDragOver = useCallback(
    (e: React.DragEvent, mixerIndex: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      setDragOverMixer(mixerIndex);
    },
    []
  );

  // ドロップエリアからドラッグアウト
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverMixer(null);
  }, []);

  // 色をドロップ（混ぜる機能）
  const handleDrop = useCallback(
    (e: React.DragEvent, mixerIndex: number) => {
      e.preventDefault();
      setDragOverMixer(null);

      try {
        const colorData = e.dataTransfer.getData("application/json");
        const color = JSON.parse(colorData) as ColorInfo;
        handleColorMix(color, mixerIndex);
      } catch (error) {
        console.error("Color drop failed:", error);
      }
    },
    [handleColorMix]
  );

  // 混ぜる色をクリア
  const handleClearMixer = useCallback(
    (mixerIndex: number) => {
      setMixingColors(mixerIndex, []);
      setMixedColor(mixerIndex, null);
    },
    [setMixingColors, setMixedColor]
  );

  return (
    <>
      {/* 🎨 カラーコードツールチップ */}
      {hoveredColor && (
        <div
          className="fixed z-50 pointer-events-none animate-in fade-in duration-200"
          style={{
            left: hoveredColor.x,
            top: hoveredColor.y - 45,
            transform: "translateX(-50%)",
          }}
        >
          <div
            className="px-3 py-2 rounded-lg shadow-lg text-xs font-mono font-bold relative"
            style={{
              backgroundColor: hoveredColor.hex,
              color: getContrastTextColor(hoveredColor.hex),
            }}
          >
            {hoveredColor.hex.toUpperCase()}
            {/* 吹き出しの尻尾（重なり調整） */}
            <div
              className="absolute left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent border-l-transparent border-r-transparent"
              style={{
                borderTopColor: hoveredColor.hex,
                top: "calc(100% - 2px)",
              }}
            />
          </div>
        </div>
      )}

      <div className="rounded-3xl shadow-2xl p-4 lg:p-6 theme-bg-mixer border-0 theme-elementary">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold theme-text-primary theme-elementary-heading">
            🎨 いろまぜコーナー
          </h2>

          {/* アクションボタン */}
          <div className="flex gap-2">
            {onSave && (
              <button
                onClick={onSave}
                className="px-3 py-2 theme-card theme-text-primary hover:!bg-pink-100 hover:!text-pink-600 dark:hover:!bg-pink-900 dark:hover:!text-pink-400 rounded-lg shadow-lg transition-all duration-300 flex items-center gap-1 cursor-pointer border theme-border"
              >
                <Heart className="h-4 w-4" />
                <span className="text-sm font-medium">ほぞん</span>
              </button>
            )}

            {onToggleExportMenu && (
              <div className="relative">
                <button
                  onClick={onToggleExportMenu}
                  className="px-3 py-2 theme-card theme-text-primary hover:!bg-blue-100 hover:!text-blue-600 dark:hover:!bg-blue-900 dark:hover:!text-blue-400 rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105 flex items-center gap-1 cursor-pointer border theme-border"
                  title="ダウンロード"
                >
                  <Download className="h-4 w-4" />
                  <span className="text-sm font-medium theme-elementary-button">
                    ダウンロード
                  </span>
                </button>

                {showExportMenu && onExport && (
                  <div className="absolute top-full right-0 mt-2 theme-dropdown rounded-xl shadow-xl border-2 theme-mixer-border p-2 z-10 min-w-max">
                    <button
                      onClick={() => onExport("css")}
                      className="block w-full text-left px-3 py-2 theme-mixer-accent-hover rounded-lg text-sm font-medium cursor-pointer"
                    >
                      🎨 CSS
                    </button>
                    <button
                      onClick={() => onExport("json")}
                      className="block w-full text-left px-3 py-2 theme-mixer-accent-hover rounded-lg text-sm font-medium cursor-pointer"
                    >
                      📄 JSON
                    </button>
                    <button
                      onClick={() => onExport("text")}
                      className="block w-full text-left px-3 py-2 theme-mixer-accent-hover rounded-lg text-sm font-medium cursor-pointer"
                    >
                      📝 テキスト
                    </button>
                  </div>
                )}
              </div>
            )}

            {onShare && (
              <button
                onClick={onShare}
                className="px-3 py-2 theme-card theme-text-primary hover:!bg-green-100 hover:!text-green-600 dark:hover:!bg-green-900 dark:hover:!text-green-400 rounded-lg shadow-lg transition-all duration-300 flex items-center gap-1 cursor-pointer border theme-border"
              >
                <Share2 className="h-4 w-4" />
                <span className="text-sm font-medium">シェア</span>
              </button>
            )}
            {onReset && (
              <button
                onClick={onReset}
                className="px-3 py-2 theme-card theme-text-primary hover:!bg-red-100 hover:!text-red-600 dark:hover:!bg-red-900 dark:hover:!text-red-400 rounded-lg shadow-lg transition-all duration-300 flex items-center gap-1 cursor-pointer border theme-border"
              >
                <Trash2 className="h-4 w-4" />
                <span className="text-sm font-medium">リセット</span>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* 元の色 */}
          <div>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-3">
              {colors.map((color, index) => {
                const hasSparkle = sparkleEffect === `copy-${color.hex}`;
                return (
                  <div
                    key={color.id || `${color.hex}-${index}`}
                    className={`group relative rounded-xl cursor-pointer transform transition-all duration-300 hover:scale-105 shadow-lg border-2 border-white select-none ${
                      hasSparkle ? "animate-pulse ring-4 ring-blue-400" : ""
                    }`}
                    style={{ backgroundColor: color.hex, aspectRatio: "3/2" }}
                    draggable
                    onClick={() => handleColorClick(color)}
                    onDragStart={(e) => handleDragStart(e, color)}
                    onMouseEnter={(e) => handleColorHover(e, color.hex)}
                    onMouseLeave={handleColorLeave}
                    title={`${color.name} - クリックでコピー、ドラッグで混ぜる`}
                  >
                    {hasSparkle && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="h-6 w-6 text-yellow-300 animate-spin" />
                      </div>
                    )}
                    <div className="absolute top-1 right-1 bg-white bg-opacity-80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Copy className="h-3 w-3 text-gray-600" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* お気に入りパレット */}
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold theme-text-primary theme-elementary-heading">
                🎨 お気に入りパレット
              </h3>
              {extractedColors.length > 0 && (
                <button
                  onClick={() => {
                    // すべての抽出色を削除
                    extractedColors.forEach((color) => {
                      if (onColorRemoved) onColorRemoved(color);
                    });
                  }}
                  className="px-3 py-2 theme-card theme-text-primary hover:!bg-red-100 hover:!text-red-600 dark:hover:!bg-red-900 dark:hover:!text-red-400 rounded-lg shadow-lg transition-all duration-300 flex items-center gap-1 cursor-pointer border theme-border"
                  title="お気に入りパレットの色をすべて削除"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="text-sm font-medium">すべて消す</span>
                </button>
              )}
            </div>

            {extractedColors.length > 0 ? (
              <div
                className="relative"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "copy";
                  setDragOverExtracted(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setDragOverExtracted(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverExtracted(false);
                  try {
                    const colorData =
                      e.dataTransfer.getData("application/json");
                    const color = JSON.parse(colorData) as ColorInfo;
                    if (onColorExtracted) {
                      onColorExtracted(color);
                      setSparkleEffect(`extracted-${color.hex}`);
                      setTimeout(() => setSparkleEffect(null), 1000);
                    }
                  } catch (error) {
                    console.error("Color drop to palette failed:", error);
                  }
                }}
              >
                {/* 🎨 フラットな色パレット */}
                <div className="theme-section rounded-2xl p-4 relative transition-all duration-300 hover:shadow-lg">
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                    {extractedColors.map((color, index) => {
                      return (
                        <div
                          key={`palette-${color.id || color.hex}-${index}`}
                          className="group relative z-10"
                        >
                          {/* 🎨 フラットな色パレット */}
                          <div
                            className="w-16 h-16 rounded-full cursor-pointer transform transition-all duration-300 hover:scale-105 relative"
                            style={{
                              backgroundColor: color.hex,
                              border: "2px solid rgba(226, 232, 240, 0.6)",
                            }}
                            draggable
                            onClick={() => handleColorClick(color)}
                            onDragStart={(e) => handleDragStart(e, color)}
                            onMouseEnter={(e) => handleColorHover(e, color.hex)}
                            onMouseLeave={handleColorLeave}
                            title={`${color.name} - パレットの色`}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onColorRemoved) onColorRemoved(color);
                              }}
                              className="absolute -top-2 -right-2 z-50 theme-card theme-text-primary hover:!bg-red-100 hover:!text-red-600 dark:hover:!bg-red-900 dark:hover:!text-red-400 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer border theme-border shadow-lg"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 🎆 フラットなドロップオーバーインジケーター */}
                {dragOverExtracted && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl z-30 theme-mixer-dragover">
                    <div className="text-center animate-pulse theme-card rounded-2xl p-4 shadow-lg border theme-border">
                      <div className="text-4xl mb-2 animate-bounce">✨</div>
                      <p className="text-lg font-bold theme-text-primary">
                        パレットに追加します！
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                className={`p-4 text-center theme-section rounded-2xl border-2 border-dashed transition-all duration-500 ${
                  dragOverExtracted
                    ? "ring-4 ring-blue-400 scale-105 shadow-2xl"
                    : "hover:shadow-lg"
                } ${dragOverExtracted ? "theme-mixer-dragover" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "copy";
                  setDragOverExtracted(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setDragOverExtracted(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverExtracted(false);
                  try {
                    const colorData =
                      e.dataTransfer.getData("application/json");
                    const color = JSON.parse(colorData) as ColorInfo;
                    if (onColorExtracted) {
                      onColorExtracted(color);
                      setSparkleEffect(`extracted-${color.hex}`);
                      setTimeout(() => setSparkleEffect(null), 1000);
                    }
                  } catch (error) {
                    console.error("Color drop to palette failed:", error);
                  }
                }}
              >
                <div
                  className={`text-4xl mb-3 transition-all duration-300 ${
                    dragOverExtracted
                      ? "animate-bounce scale-110"
                      : "animate-pulse"
                  }`}
                >
                  🎨
                </div>

                {/* 空の穴のプレビュー（フラット風） */}
                <div className="flex justify-center mb-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full border-2 border-dashed theme-border opacity-50 transition-all duration-300"
                      style={{
                        animationDelay: `${i * 100}ms`,
                      }}
                    />
                  ))}
                </div>
                <p className="text-lg font-bold theme-text-secondary mb-2 theme-elementary-text">
                  お気に入りパレット
                </p>
                <p className="text-sm theme-text-muted theme-elementary-text">
                  ここに色をドラッグして絵の具パレットを作ろう！
                </p>
              </div>
            )}
          </div>

          {/* まぜまぜエリア */}
          <div>
            <h3 className="text-lg font-bold mb-3 theme-text-primary theme-elementary-heading">
              🪄 まぜまぜエリア
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((mixerIndex) => {
                const mixingColors = getMixingColors(mixerIndex);
                const mixerRef = getMixerRef(mixerIndex);

                return (
                  <div
                    key={`mixer-${mixerIndex}`}
                    ref={mixerRef}
                    className={`h-64 border-4 border-dashed rounded-2xl p-4 text-center transition-all duration-300 ${
                      dragOverMixer === mixerIndex
                        ? "theme-mixer-dragover scale-105"
                        : "theme-border theme-section"
                    } ${animatingMixer === mixerIndex ? "animate-pulse" : ""}`}
                    onDragOver={(e) => handleDragOver(e, mixerIndex)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, mixerIndex)}
                  >
                    {mixingColors.length > 0 ? (
                      <div className="h-full flex flex-col">
                        {getMixedColor(mixerIndex) ? (
                          <div
                            className="group flex-1 rounded-xl m-1 cursor-grab active:cursor-grabbing transform transition-all duration-300 hover:scale-105 relative"
                            style={{
                              backgroundColor: getMixedColor(mixerIndex)?.hex,
                            }}
                            draggable
                            onDragStart={(e) => {
                              const mixedColor = getMixedColor(mixerIndex);
                              if (mixedColor) {
                                const colorInfo: ColorInfo = {
                                  hex: mixedColor.hex,
                                  rgb: mixedColor.rgb,
                                  hsl: mixedColor.hsl,
                                  name: mixedColor.name,
                                  id: mixedColor.id,
                                };
                                e.dataTransfer.setData(
                                  "application/json",
                                  JSON.stringify(colorInfo)
                                );
                                e.dataTransfer.effectAllowed = "copy";
                              }
                            }}
                            onClick={() => {
                              const mixedColor = getMixedColor(mixerIndex);
                              if (mixedColor && onColorExtracted) {
                                const colorInfo: ColorInfo = {
                                  hex: mixedColor.hex,
                                  rgb: mixedColor.rgb,
                                  hsl: mixedColor.hsl,
                                  name: mixedColor.name,
                                  id: mixedColor.id,
                                };
                                onColorExtracted(colorInfo);
                                setSparkleEffect(`extracted-${colorInfo.hex}`);
                                setTimeout(() => setSparkleEffect(null), 1000);
                              }
                            }}
                            onMouseEnter={(e) => {
                              const mixedColor = getMixedColor(mixerIndex);
                              if (mixedColor) {
                                handleColorHover(e, mixedColor.hex);
                              }
                            }}
                            onMouseLeave={() => {
                              handleColorLeave();
                            }}
                            title={`${getMixedColor(mixerIndex)?.name} (${
                              getMixedColor(mixerIndex)?.hex
                            }) - クリックで抽出色に追加`}
                          >
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <div className="bg-white bg-opacity-80 rounded-full p-2">
                                <div className="text-gray-600 text-lg">↗</div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center justify-center">
                            <div className="text-center theme-text-secondary">
                              <div className="flex justify-center mb-2 gap-1">
                                {mixingColors.slice(0, 3).map((color, idx) => (
                                  <div
                                    key={idx}
                                    className="w-6 h-6 rounded-full border theme-border"
                                    style={{ backgroundColor: color.hex }}
                                  />
                                ))}
                                {mixingColors.length > 3 && (
                                  <div className="w-6 h-6 rounded-full border theme-border bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                    <span className="text-xs font-bold">
                                      +{mixingColors.length - 3}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <p className="text-sm font-bold theme-elementary-text">
                                {mixingColors.length}色を混ぜています
                              </p>
                              <p className="text-xs theme-text-muted theme-elementary-text mt-1">
                                色を追加してね！
                              </p>
                            </div>
                          </div>
                        )}
                        <button
                          onClick={() => handleClearMixer(mixerIndex)}
                          className="mt-2 px-2 py-1 theme-card theme-text-primary hover:bg-gray-100 dark:hover:bg-gray-700 text-xs rounded-full transition-colors cursor-pointer border theme-border theme-elementary-button"
                        >
                          クリア
                        </button>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center">
                        <div className="text-3xl mb-2 animate-bounce">🎨</div>
                        <p className="text-sm font-bold mb-1 theme-text-secondary theme-elementary-text">
                          まぜまぜ{mixerIndex}
                        </p>
                        <p className="text-xs theme-text-muted theme-elementary-text">
                          色をドラッグしてね
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
