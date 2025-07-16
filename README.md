# 🎨 Color Palette Generator

画像から美しいカラーパレットを自動生成するモダンなWebアプリケーションです。

## ✨ 特徴

- **画像アップロード**: ドラッグ&ドロップまたはクリックで簡単にアップロード
- **AI色抽出**: ColorThief.jsを使用した高精度な色抽出
- **リアルタイム処理**: 素早い色分析と結果表示
- **多様な出力形式**: HEX、RGB、HSL値をサポート
- **エクスポート機能**: CSS、JSON、テキスト形式で出力
- **レスポンシブデザイン**: すべてのデバイスで最適表示
- **ダークモードサポート**: 目に優しいダークテーマ
- **アクセシビリティ**: コントラスト比の自動計算

## 🚀 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **色処理**: ColorThief.js, Chroma.js
- **アイコン**: Lucide React
- **デプロイ**: Vercel

## 📦 インストール

```bash
# 依存関係をインストール
npm install

# または
yarn install
```

## 🛠️ 開発

```bash
# 開発サーバーを起動
npm run dev

# または
yarn dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションを表示します。

## 🏗️ ビルド

```bash
# プロダクションビルド
npm run build

# または
yarn build
```

## 📱 使い方

1. **画像をアップロード**: 対応形式（JPEG、PNG、GIF、WebP）の画像をアップロード
2. **色数設定**: 抽出したい色の数を3〜10色で設定
3. **色を抽出**: AIが自動的に主要な色を分析・抽出
4. **結果を活用**: 
   - 各色の詳細情報（HEX、RGB、HSL）を表示
   - ワンクリックでクリップボードにコピー
   - CSS、JSON、テキスト形式でエクスポート
   - SNSなどでパレットを共有

## 🎯 主要機能

### 色情報表示
- HEX値（#FF5733）
- RGB値（rgb(255, 87, 51)）
- HSL値（hsl(9, 100%, 60%)）
- 色の日本語名（自動生成）

### エクスポート形式
- **CSS Variables**: CSS カスタムプロパティ形式
- **JSON**: 構造化データ形式
- **テキスト**: シンプルなHEX値リスト

### アクセシビリティ
- コントラスト比の自動計算
- AA/AAA準拠チェック
- 色弱対応の考慮

## 🔧 プロジェクト構造

```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ColorCard.tsx
│   ├── ColorPaletteGenerator.tsx
│   ├── ImageUploader.tsx
│   └── PaletteDisplay.tsx
├── types/
│   └── color.ts
└── utils/
    ├── colorUtils.ts
    └── imageUtils.ts
```

## 🌟 今後の機能予定

- [ ] カラーハーモニー生成（補色、類似色）
- [ ] パレット編集機能
- [ ] ユーザーアカウント機能
- [ ] パレットコレクション機能
- [ ] APIエンドポイント提供
- [ ] 高度な色分析機能

## 🤝 貢献

プルリクエストやイシューの報告を歓迎します！

## 📄 ライセンス

MIT License

## 👨‍💻 開発者

Created by Karum with ❤️

---

**🎨 Creative. 🚀 Fast. 💡 Intuitive.**

美しいカラーパレットで、あなたのデザインを次のレベルへ！
