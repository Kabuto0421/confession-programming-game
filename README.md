# 告白したらプログラミングが始まるゲーム

短時間で遊べるWebミニゲームです。告白をきっかけに恋愛ADV風の画面がコード修正画面へ切り替わり、プレイヤーは心理的な選択肢を選びながら感情コードを修正します。

## Features

- タイトル、会話、コンパイル、リザルトの4画面構成
- 告白ボタン押下後のグリッチ遷移
- 現在のエラー対象コード行の強調表示
- 選択後の `PATCH APPLIED` / `BAD PATCH` 演出
- PC/スマホ対応
- 2種類のBGMと複数の効果音

## Tech Stack

- Vite
- TypeScript
- HTML/CSS

## Getting Started

```bash
npm install
npm run dev
```

開発サーバー起動後、表示されたローカルURLをブラウザで開きます。

## Build

```bash
npm run build
```

ビルド成果物は `dist/` に生成されます。

## Deploying to Vercel

VercelでこのリポジトリをImportし、以下の設定でデプロイできます。

- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

## Assets

このプロトタイプでは、KenneyおよびOpenGameArtのCC0素材を使用しています。詳細は素材管理メモを参照してください。
