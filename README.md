# 🎨 Color Palette Generator

**高度な色彩理論に基づくインテリジェントなカラーパレット生成ツール**

Next.js + TypeScript で構築された、教育からプロフェッショナル用途まで対応するカラーパレットジェネレーターです。

---

## ✨ 主な機能

### 🎯 **多様な利用シーン対応**
- **🧒 Elementary Mode**: 子供向けの直感的なインターフェース
- **👨‍💼 Middle School Mode**: 学習者向けのバランス型インターフェース  
- **🔬 Advanced Mode**: プロフェッショナル向け高機能インターフェース

### 🔬 **科学的色彩処理**
- **高精度Delta E計算**: CIE2000/CIE94アルゴリズム対応
- **多色空間対応**: RGB・HSL・LAB・LCH色空間での精密操作
- **色調和理論**: 補色・三色・四色・類似色の自動計算
- **リアルタイムプレビュー**: 変更内容の即座反映

### ♿ **アクセシビリティ対応**
- **WCAG 2.1準拠**: AA/AAA基準のコントラスト比チェック
- **色覚多様性対応**: 1型・2型・3型色覚、モノクロ視のシミュレーション
- **自動改善提案**: アクセシビリティ向上のための色調整案
- **包括的デザイン**: 全ての人が使いやすい色彩選択をサポート

### 📷 **画像解析機能**
- **色抽出**: 画像から支配的な色を自動抽出
- **複数アルゴリズム**: K-means、Median-Cut、Octree方式
- **ドラッグ&ドロップ**: 直感的な画像アップロード
- **フォーマット対応**: JPG・PNG・WebP・GIF

### 🎓 **教育機能**
- **色理論パネル**: インタラクティブな色彩学習
- **色相環表示**: 視覚的な色関係の理解促進
- **科学的解説**: 波長・輝度・色度座標の表示
- **心理効果説明**: 色が与える心理的影響の解説

---

## 🚀 セットアップ

### 前提条件
- Node.js 18.17.0 以上
- npm または yarn

### インストール手順

```bash
# リポジトリをクローン
git clone https://github.com/YersiniaPestis899/color-palette-generator.git

# プロジェクトディレクトリに移動
cd color-palette-generator

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスしてください。

### 本番ビルド

```bash
# プロジェクトをビルド
npm run build

# 本番サーバーを起動
npm start
```

---

## 💻 技術スタック

### フレームワーク・言語
- **Next.js 15.4.3**: React フレームワーク
- **TypeScript 5.2.2**: 静的型付け
- **Tailwind CSS 4.0.0**: ユーティリティファーストCSS

### 色彩処理ライブラリ
- **chroma-js 2.4.2**: 基本的な色変換・操作
- **culori 3.3.0**: 高度な色空間変換（LAB・LCH対応）
- **color-blind 0.1.3**: 色覚異常シミュレーション
- **colorthief 2.4.0**: 画像からの色抽出

### その他ライブラリ
- **jszip 3.10.1**: ファイル圧縮・展開
- **lucide-react 0.292.0**: アイコンライブラリ

---

## 📁 プロジェクト構造

```
src/
├── app/                      # Next.js App Router
│   ├── globals.css          # グローバルスタイル
│   ├── layout.tsx           # レイアウトコンポーネント
│   └── page.tsx             # メインページ
├── components/              # Reactコンポーネント
│   ├── ColorPaletteGenerator.tsx     # メインジェネレーター
│   ├── ElementaryColorMixer.tsx      # 子供向けカラーミキサー
│   ├── ImageUploader.tsx             # 画像アップロード
│   ├── PaletteDisplay.tsx            # パレット表示
│   ├── ElementaryPaletteDisplay.tsx  # 子供向けパレット表示
│   ├── MiddleSchoolPaletteDisplay.tsx # 学習者向けパレット表示
│   ├── ColorCard.tsx                 # 色カード
│   └── educational/                  # 教育機能
│       ├── ColorTheoryPanel.tsx      # 色理論パネル
│       ├── ColorWheelDisplay.tsx     # 色相環表示
│       └── MiddleSchoolColorMixer.tsx # 学習者向けミキサー
├── types/                   # TypeScript型定義
│   ├── color.ts            # 色関連の型
│   └── advanced.ts         # 高度機能の型
└── utils/                  # ユーティリティ関数
    ├── colorUtils.ts              # 基本色処理
    ├── advancedColorUtils.ts      # 高度色処理
    ├── educationalColorUtils.ts   # 教育機能処理
    └── imageUtils.ts              # 画像処理
```

---

## 🎨 使用方法

### 基本的な使い方

1. **モード選択**: 画面上部でElementary・Middle School・Advancedモードから選択
2. **画像アップロード**: ドラッグ&ドロップまたはクリックで画像をアップロード
3. **色抽出**: 自動的に画像から色が抽出され、パレットが生成されます
4. **色調整**: 各色をクリックして詳細調整（HSL・LAB・LCH色空間対応）
5. **アクセシビリティチェック**: WCAG準拠チェックと色覚多様性テスト
6. **エクスポート**: CSS・SCSS・JSON形式での出力

### 高度な機能

#### Delta E計算
```typescript
// 2つの色の知覚的な差を科学的に測定
const deltaE = calculateDeltaE2000('#FF0000', '#FE0000');
// 結果: 0.8 (人間にはほぼ同じ色に見える)
```

#### WCAG準拠チェック
```typescript
// アクセシビリティ基準に基づくコントラスト比評価
const wcag = checkWCAGCompliance('#000000', '#FFFFFF');
// 結果: { contrastRatio: 21, aaLevel: true, aaaLevel: true }
```

#### 色覚多様性シミュレーション
- 1型色覚（赤色弱）
- 2型色覚（緑色弱）  
- 3型色覚（青色弱）
- モノクロ視（全色盲）

---

## 🎓 色彩理論について

### LAB色空間の特徴
- **L (明度)**: 0-100 (黒から白)
- **a軸**: -128〜127 (緑から赤)  
- **b軸**: -128〜127 (青から黄)
- 人間の視覚に最も近い数値表現

### Delta E 2000の意味
| 値の範囲 | 知覚的な違い |
|---------|-------------|
| 0-1 | 人間には同じ色に見える |
| 1-2 | 訓練された目でやっと識別可能 |
| 2-10 | デザイナーが容易に識別可能 |
| 11-49 | 明確に異なる色として認識 |
| 50+ | 完全に異なる色 |

### WCAG 2.1 基準
- **AA基準**: 通常文字 4.5:1以上、大文字 3:1以上
- **AAA基準**: 通常文字 7:1以上、大文字 4.5:1以上

---

## 🛠️ 開発・貢献

### 開発環境
```bash
# リンター実行
npm run lint

# 型チェック
npx tsc --noEmit

# テスト実行（今後実装予定）
npm run test
```

### バグレポート・機能要望
GitHubのIssuesページでバグレポートや機能要望を受け付けています。

[GitHub Repository](https://github.com/YersiniaPestis899/color-palette-generator)

---

## 📜 ライセンス

MIT License - 商用・非商用問わず自由にご利用いただけます。

---

## 🙏 謝辞

このプロジェクトは以下のオープンソースライブラリによって支えられています：

- [Next.js](https://nextjs.org/) - Reactフレームワーク
- [chroma-js](https://gka.github.io/chroma.js/) - 色処理ライブラリ
- [culori](https://culorijs.org/) - 高度な色空間変換
- [Tailwind CSS](https://tailwindcss.com/) - CSSフレームワーク

---

**🎨 "Color is a power which directly influences the soul." - Wassily Kandinsky**

---

**最終更新**: 2025年7月26日  
**バージョン**: 2.0.0  
**開発者**: Karum
