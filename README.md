# Event Manager C

C向けの研修用イベント管理サイトです。A/Bより一段実務寄りで、以下を備えています。

- ログイン / ログアウト
- ロール別UI（管理者 / 一般ユーザー）
- イベント一覧、詳細
- イベント作成 / 編集 / 削除（管理者）
- イベント参加 / 参加キャンセル（一般ユーザー）
- マイイベント
- 管理ダッシュボード
- 監査ログ表示
- CSVエクスポート
- 重複参加防止
- 定員超過防止
- Playwright テスト雛形
- GitHub Actions CI 雛形

## デモアカウント

- 管理者: `admin / admin123`
- 一般ユーザー: `user1 / user123`
- 一般ユーザー: `user2 / user123`

## 起動方法

```bash
npm install
npm run dev
```

開く URL:

```text
http://localhost:5173
```

## 本番ビルド確認

```bash
npm run build
npm run preview
```

## Playwright テスト

```bash
npx playwright install chromium
npm run test:e2e
```

## GitHub Pages / Vercel

静的ファイルで動くため、GitHub Pages や Vercel に公開できます。

### GitHub Pages の例

```bash
git init
git add .
git commit -m "Initial commit for Event Manager C"
git branch -M main
git remote add origin https://github.com/<GitHubユーザー名>/event-manager-c.git
git push -u origin main
```

GitHub 側で `Settings > Pages > Deploy from a branch > main / root` を選択します。

公開 URL 例:

```text
https://<GitHubユーザー名>.github.io/event-manager-c/
```

## 研修観点

- ロール制御の考え方を学べる
- 監査ログの重要性を体験できる
- UIだけでなく業務ルールをコードで守る意識がつく
- CI とテストの雛形を確認できる
