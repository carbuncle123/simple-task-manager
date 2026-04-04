# タスク管理アプリ 設計書

## 概要
短期・中期・長期の3種類のタスクを管理するWebアプリ。それぞれ異なるUI・フィールドを持ち、個人利用を想定したシンプルな構成。

## 技術スタック
| レイヤー | 技術 |
|---------|------|
| Frontend | React (Vite) + TypeScript |
| Backend | Hono + @hono/node-server |
| DB | SQLite (better-sqlite3 + Drizzle ORM) |
| UI | shadcn/ui + Tailwind CSS v4 |
| DnD | @dnd-kit |
| State | TanStack Query (optimistic updates対応) |
| Validation | Zod (shared) |
| Date | date-fns |

## プロジェクト構成

npm workspacesによるmonorepo構成。

```
simple-task-manager/
├── package.json              # workspaces: ["packages/*", "server", "client"]
├── tsconfig.base.json
├── packages/shared/          # 共有型定義 + Zodスキーマ
│   └── src/types.ts
├── server/
│   ├── src/
│   │   ├── index.ts          # Honoエントリポイント
│   │   ├── db/
│   │   │   ├── schema.ts     # Drizzleスキーマ
│   │   │   └── index.ts      # DB接続
│   │   └── routes/
│   │       ├── short-term.ts
│   │       ├── mid-term.ts
│   │       └── long-term.ts
│   └── data/tasks.db          # SQLiteファイル (gitignore)
└── client/
    ├── src/
    │   ├── App.tsx
    │   ├── lib/api.ts         # fetchラッパー
    │   ├── hooks/             # useShortTermTasks等
    │   └── components/
    │       ├── ui/            # shadcn/ui
    │       ├── layout/        # AppShell, TabNavigation
    │       ├── combined/      # CombinedView (統合ビュー)
    │       ├── short-term/    # ShortTermPanel, TaskCard, TaskList, AddTaskForm
    │       ├── mid-term/      # MidTermPanel, KanbanBoard, KanbanColumn, KanbanCard
    │       ├── gantt/         # GanttChart, GanttToolbar, GanttHeader, GanttBar
    │       └── long-term/     # CategoryGroup, TaskItem
    └── vite.config.ts         # proxy: /api → localhost:3001
```

### 設計意図
- **monorepo**: フロントエンドとバックエンドでTypeScriptの型を共有するため
- **packages/shared**: Zodスキーマを共有し、サーバーのバリデーションとクライアントのフォームバリデーションを一元管理
- **npm workspaces**: プロジェクト規模に対してTurborepo等は過剰なため、シンプルなworkspacesで十分

---

## DBスキーマ

タスクタイプごとにフィールドが異なるため、3テーブルに分離。1テーブルにまとめるとnullable列が多くなり、クエリが複雑化する。

### short_term_tasks
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | autoIncrement |
| name | TEXT NOT NULL | タスク名 |
| description | TEXT | 説明 |
| status | TEXT | "todo" / "done" |
| display_order | INTEGER | D&D並び替え用 |
| created_at | TEXT | ISO 8601 |
| updated_at | TEXT | ISO 8601 |

### mid_term_tasks
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | autoIncrement |
| name | TEXT NOT NULL | タスク名 |
| category | TEXT | カテゴリ |
| start_date | TEXT | 開始日 (ISO date, nullable。ガントチャートの左端に使用。nullの場合は表示範囲の左端から描画) |
| deadline | TEXT | 締切 (ISO date, nullable) |
| status | TEXT | "todo" / "in-progress" / "done" |
| memo | TEXT | メモ |
| display_order | INTEGER | カンバンカラム内の順序 |
| created_at | TEXT | ISO 8601 |
| updated_at | TEXT | ISO 8601 |

### long_term_tasks
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | autoIncrement |
| name | TEXT NOT NULL | タスク名 |
| category | TEXT | カテゴリ (デフォルト: "未分類") |
| memo | TEXT | メモ |
| created_at | TEXT | ISO 8601 |
| updated_at | TEXT | ISO 8601 |

### 設計意図
- **日付はTEXT型**: SQLiteにはネイティブな日付型がないため、ISO 8601文字列を使用。ソート可能で、JSでのパースも容易
- **display_order**: D&Dによる並び替えをDB側で保持。短期タスクはリスト内、中期タスクはカンバンカラム内の順序を管理
- **long_term_tasksにdisplay_orderなし**: カテゴリ→作成日のソートで十分なため不要

---

## API設計

RESTful API。Honoのルートグループで3つのリソースに分割。

### 短期タスク `/api/short-term`

| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/` | — | 全件取得 (displayOrder順) |
| POST | `/` | `{ name, description? }` | タスク作成 |
| PATCH | `/:id` | `{ name?, description?, status? }` | タスク更新 |
| PATCH | `/:id/toggle` | — | ステータス切替 (todo↔done) |
| PUT | `/reorder` | `{ orderedIds: number[] }` | 並び替え |
| DELETE | `/:id` | — | タスク削除 |

### 中期タスク `/api/mid-term`

| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/` | — | 全件取得 |
| POST | `/` | `{ name, category?, start_date?, deadline?, memo? }` | タスク作成 |
| PATCH | `/:id` | `{ name?, category?, start_date?, deadline?, status?, memo? }` | タスク更新 |
| PUT | `/reorder` | `{ items: { id, status, displayOrder }[] }` | カンバン並び替え |
| DELETE | `/:id` | — | タスク削除 |

### 長期タスク `/api/long-term`

| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/` | — | 全件取得 (カテゴリ→作成日順) |
| GET | `/categories` | — | カテゴリ一覧 |
| POST | `/` | `{ name, category?, memo? }` | タスク作成 |
| PATCH | `/:id` | `{ name?, category?, memo? }` | タスク更新 |
| DELETE | `/:id` | — | タスク削除 |

### 設計意図
- **PUT /reorder**: ID配列を一括送信し、1トランザクションで全display_orderを更新。個別PATCHよりアトミックで競合しにくい
- **PATCH /:id/toggle (短期のみ)**: 頻繁に使う操作のため専用エンドポイントを用意
- **GET /categories (長期のみ)**: オートコンプリート用に既存カテゴリを返す

---

## UIコンポーネント設計

### 全体レイアウト

2タブ構成。メインタブで短期+中期を統合表示し、長期タスクは別タブ。

```
App
└── AppShell
    ├── TabNavigation  (shadcn Tabs: "タスク" | "長期")
    └── <選択中のページ>
```

### メインビュー（短期 + 中期 統合）

左右分割レイアウト。左1/3に短期タスク、右2/3に中期タスク。
左パネルはトグルボタンで開閉可能（閉じると中期タスクが全幅表示）。

```
CombinedView
├── ShortTermPanel       左1/3、開閉可能
│   ├── ToggleButton     "今すぐやる" クリックで開閉（アニメーション付き）
│   ├── AddTaskForm      インライン入力 (Enter で即追加)
│   └── TaskList         @dnd-kit/sortable で縦並びD&D
│       └── TaskCard[]   チェックボックス + ドラッグハンドル
│
└── MidTermPanel         右2/3（左パネル閉じ時は全幅）
    ├── ToggleButton     左パネルが閉じているときに表示
    ├── ViewToggle       "カンバン" | "ガントチャート" 切替
    ├── MidTermTaskDialog     shadcn Dialog。追加/編集兼用。カレンダーで開始日・締切選択
    │
    ├── [カンバン表示]
    │   KanbanBoard      @dnd-kit DndContext
    │   ├── KanbanColumn (todo)
    │   │   └── KanbanCard[]
    │   ├── KanbanColumn (in-progress)
    │   │   └── KanbanCard[]
    │   └── KanbanColumn (done)
    │       └── KanbanCard[]
    │
    └── [ガントチャート表示]
        GanttChart
        ├── GanttToolbar ◀/▶ナビ、「今日」ボタン、日/週スケール切替
        ├── GanttHeader  月ラベル + 日付/週カラム（土日グレー表示）
        ├── GanttBar[]   タスクごとのバー
        │                  - start_dateあり: start_date〜deadline
        │                  - start_dateなし: 表示範囲左端〜deadline
        │                  - 色: todo=グレー, 進行中=青, 完了=緑, 期限切れ=赤
        └── TodayLine    赤い縦線で今日を表示
```

- 左パネル: カードが優先度順に縦に並ぶ。D&Dで並び替え、チェックボックスでtodo/done切替
  - タスク追加: タイトルのみ入力してEnterで即追加（スピード重視）
  - 説明の編集: カードをクリックするとインラインで説明入力欄が展開される
- カンバン: JIRA風。カード型でステータスカラム間をD&Dで移動。カードクリックで編集ダイアログを開く
- ガントチャート: CSS Grid + date-fnsで自前実装
  - ドラッグで横スクロール
  - ◀/▶ボタンで表示期間を移動（日: 1週間ずつ、週: 4週間ずつ）
  - 「今日」ボタンで現在位置に戻る
  - 日単位/週単位の表示スケール切替

### 長期タスク

```
LongTermView
├── AddLongTermTaskDialog カテゴリはオートコンプリート
└── CategoryGroup[]       shadcn Collapsible で折りたたみ
    └── TaskItem[]        タスク名・メモプレビュー・編集/削除
```

- カテゴリごとにグルーピング
- 折りたたみ可能なセクション
- 期日なし。考えを整理するためのリスト

---

## 将来の拡張方針

中期タスクについて、将来的に「個人用 / プロジェクト用」の分離、およびプロジェクト用にはstory→taskの階層関係を導入する可能性がある。現設計はこれらの拡張を阻害しない。

### 拡張時の変更イメージ

**テーブル追加:**
```
projects:    id, name, description, created_at, updated_at
```

**mid_term_tasks へのカラム追加:**
```
+ project_id  INTEGER  nullable, FK → projects.id  (null = 個人タスク)
+ parent_id   INTEGER  nullable, FK → mid_term_tasks.id  (story→task の自己参照)
+ type        TEXT     "task" / "story"  (デフォルト: "task")
```

**APIの拡張:**
- `GET /api/mid-term?project_id=xxx` でプロジェクトフィルタ
- `GET /api/mid-term?parent_id=xxx` でサブタスク取得
- `GET /api/projects` 等の新規ルートグループ追加

### 現設計で意識している点
- `mid_term_tasks` はフラットな1テーブルのため、カラム追加のみで拡張可能（テーブル分割不要）
- `category` は個人タスクのグルーピングとして残し、プロジェクトタスクでは `project_id` で代替
- `display_order` は将来的にプロジェクトごとにスコープする必要がある（マイグレーションで対応可能）
- コンポーネントは hooks 層でデータをフィルタするため、UI側の構造変更は最小限

---

## 実装順序

### Phase 1: プロジェクト構築
1. ルート `package.json` + workspaces設定
2. `packages/shared` — 共有型 + Zodスキーマ
3. `server/` — Hono + Drizzle + SQLite 初期化、マイグレーション実行
4. `client/` — Vite + React + Tailwind + shadcn/ui 初期化
5. Vite proxy設定、CORS設定、疎通確認

### Phase 2: レイアウト + 統合ビュー骨格
1. AppShell + TabNavigation (shadcn Tabs: "タスク" | "長期")
2. CombinedView の左右分割レイアウト
3. 左パネルのトグル開閉（アニメーション付き）

### Phase 3: 短期タスク (フルスタック)
1. サーバー: CRUD + reorder ルート実装
2. クライアント: AddTaskForm → TaskCard → TaskList (まずD&Dなし)
3. @dnd-kit sortable追加 + reorder API連携
4. TanStack Query + optimistic updates

### Phase 4: 中期タスク - カンバン
1. サーバー: CRUD + reorder ルート
2. KanbanColumn + KanbanCard
3. KanbanBoard + @dnd-kit マルチコンテナD&D
4. AddMidTermTaskDialog (開始日・締切の日付ピッカー付き)

### Phase 5: ガントチャート
1. GanttToolbar (ナビゲーション、スケール切替)
2. GanttHeader (月ラベル + 日付/週カラム)
3. GanttBar (start_date/deadline からGrid位置計算)
4. ドラッグスクロール + 今日ライン
5. ViewToggle でカンバン/ガント切替

### Phase 6: 長期タスク (フルスタック)
1. サーバー: CRUD + categories ルート
2. クライアント: CategoryGroup + TaskItem + AddDialog

### Phase 7: 仕上げ
1. ローディング状態 (shadcn Skeleton)
2. 空状態の表示
3. エラーハンドリング (shadcn Toast)
4. レスポンシブ対応

---

## 検証方法
1. `npm run dev` でserver + clientを同時起動
2. 各タスクタイプでCRUD操作を確認
3. 短期タスクのD&D並び替え → リロード後も順序維持を確認
4. 中期タスクのカンバンD&D → ステータス変更を確認
5. ガントチャートで締切の表示位置を確認
6. ブラウザリロード後にデータが永続化されていることを確認
