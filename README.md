# Simple Task Manager

短期・中期・長期の3種類のタスクを管理するWebアプリ。

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
