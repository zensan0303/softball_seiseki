# softball_seiseki

ソフトボールチームの成績管理アプリケーション

## 機能

- 選手管理（追加・削除・編集）
- 試合管理（カレンダー表示、試合記録）
- 詳細な成績記録（打席ごとの記録）
- 月間・年間・全試合の統計表示
- 打率、打点、OPSなどの各種ランキング
- **Firebaseを使用したリアルタイムデータ共有**

## セットアップ

### 1. 依存パッケージのインストール

```bash
cd softball-stats-app
npm install
```

### 2. Firebase設定

#### 2.1 Firebaseプロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力（例: softball-stats-app）
4. Google Analyticsは任意で設定
5. プロジェクトを作成

#### 2.2 Realtime Databaseの有効化

1. Firebaseコンソールの左メニューから「Realtime Database」を選択
2. 「データベースを作成」をクリック
3. ロケーションを選択（asia-northeast1を推奨）
4. セキュリティルールは「テストモードで開始」を選択（後で変更可能）
5. 「有効にする」をクリック

#### 2.3 Firebase設定情報の取得

1. プロジェクト設定（歯車アイコン）→「プロジェクトの設定」を開く
2. 「マイアプリ」セクションでウェブアプリを追加（</> アイコンをクリック）
3. アプリのニックネームを入力（例: Web App）
4. 表示されるfirebaseConfigの情報をコピー

#### 2.4 環境変数の設定

1. `softball-stats-app/.env.example`を`softball-stats-app/.env`にコピー
   ```bash
   cp softball-stats-app/.env.example softball-stats-app/.env
   ```

2. `.env`ファイルを開いて、Firebase設定情報を入力
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

### 3. アプリケーションの起動

```bash
npm run dev
```

ブラウザで http://localhost:5173 にアクセス

### 4. ビルド（本番環境用）

```bash
npm run build
```

ビルドされたファイルは`dist/`フォルダに出力されます。

## GitHub Pagesへのデプロイ

このアプリケーションはGitHub Pagesに自動デプロイされます。

### デプロイ設定

1. **GitHub Secretsの設定**
   
   GitHubリポジトリの Settings > Secrets and variables > Actions で以下のSecretsを設定してください：
   
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_DATABASE_URL`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

2. **GitHub Pagesの有効化**
   
   GitHubリポジトリの Settings > Pages で以下を設定：
   - Source: "GitHub Actions" を選択

3. **デプロイ**
   
   `main`ブランチにプッシュすると、GitHub Actionsが自動的にビルドとデプロイを実行します。
   デプロイが完了すると、以下のURLでアプリケーションにアクセスできます：
   
   ```
   https://zensan0303.github.io/softball_seiseki/
   ```

### デプロイの確認

GitHub Actionsのワークフロー実行状況は以下で確認できます：
- リポジトリの「Actions」タブ
- デプロイ完了後、「Settings」>「Pages」にサイトのURLが表示されます

## Firebase セキュリティルールの設定（推奨）

テストモードのセキュリティルールは誰でもデータを読み書きできるため、本番環境では以下のようなルールに変更することを推奨します：

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

より厳密なセキュリティを設定する場合は、Firebase Authenticationを統合し、認証されたユーザーのみがデータを操作できるようにすることをお勧めします。

## データ共有

このアプリケーションはFirebase Realtime Databaseを使用しているため、同じFirebaseプロジェクトを設定したすべてのユーザー間でデータがリアルタイムに同期されます。

## 技術スタック

- React 19
- TypeScript
- Vite
- Firebase Realtime Database
- CSS

## ライセンス

MIT
