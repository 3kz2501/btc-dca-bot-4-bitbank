# btc-dca-bot

# 使い方

## 環境

- node.js 22 以上(再現環境)
- npm 10.8 以上(再現環境)
- wrangler 3.78.8 以上(再現環境)

## 事前準備

- Bitbank 口座を作成し、APIキーを取得する
- Cloudflare アカウントを作成しておく
- ローカルにWrangler をインストールしておく

## Cloudflare の自身のアカウントに紐づける

- `wrangler login` でログインする
- `wrangler whoami` で自身のアカウントが表示されることを確認する

## シークレットの設定

- `wrangler secret put BITBANK_API_KEY` でAPIキーを登録する
- `wrangler secret put BITBANK_API_SECRET` でAPIシークレットを登録する

  こちらの値を絶対に他の人に漏らさないでください! 口座のAPI を悪用され不正な取引が行われる可能性があります

## Config の設定

- `wrangler.toml` の中の

```toml
[vars]
PURCHASE_AMOUNT_BTC = "0.00015" # 1回の購入金額, BTC 建てで入力. Bitbank 購入金額は0.0001 ~ 10.0 (BTC 建て), 換算はご自身でお願いします(https://osats.money/)

[triggers]
crons = ["0 1 * * *"]  # 毎日10:00 JSTに実行, 好きなタイミングに変更可能 (https://crontab.guru/)
```

上記2つの値をご自身の取引スタイルに合わせて変更してください

## Cloudflare へのデプロイ

- `wrangler deploy` でデプロイします

これでご自身のCloudflare アカウントにデプロイされ定期実行される用になります. うまく行かない場合はログに出力される内容を確認してみてください. 結構Bitbank API での認証エラーが出るときがあります..
