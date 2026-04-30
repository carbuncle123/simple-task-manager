# Simple Task Manager

プロジェクトに紐づくタスクと、長期タスクを管理する Web アプリ。

## 機能

- **タスク**: プロジェクトごとにカラムを分け、タスクを積み上げ表示。状態 (対応前 / 対応中) のトグル、締切と残り日数の表示、インライン編集、プロジェクト跨ぎの D&D 並び替え
- **ガント**: プロジェクトごとに枠を区切り、各タスクのバーを表示領域の左端から締切まで描画。日 / 週スケール切替、今日線
- **長期**: カテゴリで折り畳めるタスク一覧
- **設定**: プロジェクトの追加 / 編集 / 削除 / 並び替え (削除時は配下タスクも自動削除)

## セットアップ

```bash
npm install
```

## 起動

```bash
npm run dev
```

サーバー (http://localhost:3001) とクライアント (http://localhost:5173) が同時に起動します。
初回起動時にSQLiteデータベースとテーブルが自動作成されます。

個別に起動する場合:

```bash
npm run dev:server  # サーバーのみ
npm run dev:client  # クライアントのみ
```

## 技術スタック

- **Frontend**: React (Vite) + TypeScript + Tailwind CSS v4 + shadcn/ui
- **Backend**: Hono + better-sqlite3 + Drizzle ORM
- **State**: TanStack Query
- **DnD**: @dnd-kit
