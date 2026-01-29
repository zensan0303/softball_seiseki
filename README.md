# ソフトボール成績管理アプリ

## 概要
ソフトボールチームの成績を管理するWebアプリケーション。試合ごとの打撃成績、打球方向を記録し、選手ごとの統計を自動計算します。

## 機能
- 選手管理（追加・編集・削除・打順設定）
- 試合管理（日程・対戦相手）
- 回ごとの詳細な成績入力
- 打球方向の記録と分析
- 打率・長打率・出塁率・OPSの自動計算
- 引っ張り傾向・流し打ち傾向の分析

## データベース設定

このアプリは2種類のデータベースに対応しています：

### 1. IndexedDB（ローカルストレージ）
- ブラウザ内にデータを保存
- オフラインで動作可能
- 開発環境推奨

### 2. Firebase Realtime Database（クラウドDB）
- サーバー側にデータを保存
- リアルタイム同期
- 複数デバイスでのデータ共有
- 本番環境推奨

## 環境設定

### 開発環境（IndexedDB使用）

`.env`ファイルを作成：
```env
VITE_DB_TYPE=indexeddb
```

### 本番環境（Firebase使用）

`.env.production`ファイルを作成：
```env
VITE_DB_TYPE=firebase

VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動（IndexedDB使用）
npm run dev

# 本番ビルド（Firebase使用）
npm run build
```

## DBの切り替え方法

.envファイルの`VITE_DB_TYPE`を変更：

```env
# IndexedDBを使用
VITE_DB_TYPE=indexeddb

# Firebaseを使用
VITE_DB_TYPE=firebase
```

変更後、サーバーを再起動してください。

## 技術スタック

- React + TypeScript
- Vite
- Firebase Realtime Database
- IndexedDB API

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
