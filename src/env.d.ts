// wrangler secret で設定するシークレット（worker-configuration.d.ts には含まれない）
declare namespace Cloudflare {
	interface Env {
		BITBANK_API_KEY: string;
		BITBANK_API_SECRET: string;
	}
}
