# デプロイメントガイド / Deployment Guide

このガイドでは、ソフトボール成績管理アプリをGitHub Pagesに公開する手順を説明します。

## 前提条件

- GitHubアカウント
- Firebaseプロジェクトの作成とRealtime Databaseの設定が完了していること
  - 詳細は[README.md](./README.md)の「Firebase設定」セクションを参照

## デプロイ手順

### 1. GitHub Secretsの設定

GitHub ActionsがFirebaseに接続するために、環境変数をGitHub Secretsとして設定する必要があります。

1. GitHubでリポジトリページを開く
   ```
   https://github.com/zensan0303/softball_seiseki
   ```

2. **Settings** タブをクリック

3. 左サイドバーから **Secrets and variables** > **Actions** を選択

4. **New repository secret** ボタンをクリックして、以下の7つのSecretを追加：

   | Secret名 | 値（Firebaseコンソールから取得） |
   |---------|--------------------------------|
   | `VITE_FIREBASE_API_KEY` | FirebaseのAPI Key |
   | `VITE_FIREBASE_AUTH_DOMAIN` | `your-project-id.firebaseapp.com` |
   | `VITE_FIREBASE_DATABASE_URL` | `https://your-project-id-default-rtdb.firebaseio.com` |
   | `VITE_FIREBASE_PROJECT_ID` | FirebaseのプロジェクトID |
   | `VITE_FIREBASE_STORAGE_BUCKET` | `your-project-id.appspot.com` |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | Messaging Sender ID |
   | `VITE_FIREBASE_APP_ID` | Firebase App ID |

   **注意**: Secretの追加後、値は非表示になります（セキュリティのため）。

### 2. GitHub Pagesの有効化

1. リポジトリの **Settings** タブを開く

2. 左サイドバーから **Pages** を選択

3. **Source** セクションで以下を設定：
   - **Source**: ドロップダウンから `GitHub Actions` を選択
   
   これにより、GitHub Actionsワークフローを使用した自動デプロイが有効になります。

### 3. mainブランチへのマージとデプロイ

1. このPull Request（PR）をmainブランチにマージします

2. マージ後、GitHub Actionsが自動的に実行されます
   - リポジトリの **Actions** タブで進行状況を確認できます
   - ワークフロー名: "Deploy to GitHub Pages"

3. デプロイが完了すると、以下のURLでサイトにアクセスできます：
   ```
   https://zensan0303.github.io/softball_seiseki/
   ```

### 4. デプロイの確認

デプロイが成功したか確認する方法：

1. **Actionsタブでの確認**
   - リポジトリの **Actions** タブを開く
   - "Deploy to GitHub Pages" ワークフローの最新の実行を確認
   - 緑のチェックマーク ✓ が表示されていれば成功

2. **Pagesでの確認**
   - **Settings** > **Pages** を開く
   - "Your site is live at https://zensan0303.github.io/softball_seiseki/" というメッセージが表示されます
   - URLをクリックしてサイトにアクセス

3. **サイトの動作確認**
   - ブラウザでサイトを開く
   - 選手の追加/編集/削除が正常に動作するか確認
   - Firebaseとの連携が正常に動作するか確認

## トラブルシューティング

### デプロイが失敗する場合

1. **Secretsの確認**
   - すべてのFirebase環境変数が正しく設定されているか確認
   - 値にタイプミスがないか確認

2. **ワークフローログの確認**
   - Actions タブで失敗したワークフローをクリック
   - エラーメッセージを確認
   - ビルドエラーの場合、ローカルで `npm run build` を実行して問題を特定

3. **Pages設定の確認**
   - Settings > Pages で Source が "GitHub Actions" に設定されているか確認

### サイトは表示されるがFirebaseに接続できない場合

1. **Firebaseコンソールの確認**
   - Firebase Realtime Databaseが有効になっているか確認
   - セキュリティルールが適切に設定されているか確認

2. **ブラウザの開発者ツールで確認**
   - Console タブでエラーメッセージを確認
   - Network タブでFirebaseへのリクエストが成功しているか確認

## 更新方法

サイトを更新する場合：

1. コードを修正
2. mainブランチにプッシュ（またはPRをマージ）
3. GitHub Actionsが自動的に再ビルドとデプロイを実行

約2-3分でサイトが更新されます。

## 注意事項

- GitHub Pagesは公開サイトなので、誰でもアクセスできます
- Firebase Realtime Databaseのセキュリティルールを適切に設定してください
- 現在の設定では、誰でもデータを読み書きできる状態です（テストモード）
- 本番環境では、Firebase Authenticationの導入を推奨します
