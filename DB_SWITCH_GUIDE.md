# データベース切り替えガイド

## 概要
このアプリは開発環境と本番環境で異なるデータベースを使用できます。

## DB種別

### 1. IndexedDB（ローカルストレージ）
**特徴：**
- ✅ ブラウザ内にデータを保存
- ✅ インターネット接続不要
- ✅ 高速動作
- ✅ Firebase設定不要
- ⚠️ ブラウザのデータクリアで消失
- ⚠️ デバイス間でデータ共有できない

**推奨環境：** 開発環境、個人利用

### 2. Firebase Realtime Database（クラウドDB）
**特徴：**
- ✅ サーバー側に永続保存
- ✅ 複数デバイスで共有可能
- ✅ リアルタイム同期
- ✅ チームでの利用に最適
- ⚠️ Firebase設定が必要
- ⚠️ インターネット接続必須

**推奨環境：** 本番環境、チーム利用

## 切り替え方法

### 方法1: .envファイルを編集

`.env`ファイルの`VITE_DB_TYPE`を変更：

```env
# IndexedDBを使用（開発環境）
VITE_DB_TYPE=indexeddb

# または

# Firebaseを使用（本番環境）
VITE_DB_TYPE=firebase
```

### 方法2: 環境ごとに異なる設定を使用

#### 開発環境（.env）
```env
VITE_DB_TYPE=indexeddb
```

#### 本番環境（.env.production）
```env
VITE_DB_TYPE=firebase
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
# その他のFirebase設定
```

## 実行方法

```bash
# 開発環境で起動（IndexedDB使用）
npm run dev

# 本番ビルド（Firebase使用）
npm run build
npm run preview
```

## コンソールメッセージ

アプリ起動時にコンソールで使用中のDBを確認できます：

```
💾 Using IndexedDB (Local Storage)
```

または

```
🔥 Using Firebase Realtime Database
```

## データ移行

IndexedDBからFirebaseへのデータ移行は現在自動化されていません。
必要に応じて手動でエクスポート/インポート機能を実装してください。

## トラブルシューティング

### Firebaseエラーが出る場合
1. `.env`ファイルのFirebase設定を確認
2. Firebase Consoleでプロジェクトが正しく設定されているか確認
3. `VITE_DB_TYPE=indexeddb`に変更してローカルで動作確認

### IndexedDBでデータが消える場合
- ブラウザの「閲覧データを消去」を実行するとIndexedDBも消去されます
- 重要なデータはFirebaseを使用することを推奨します
