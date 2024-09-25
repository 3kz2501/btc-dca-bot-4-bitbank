import { sendMail } from "./mailer";

interface Env {
	BITBANK_API_KEY: string;
	BITBANK_API_SECRET: string;
	PURCHASE_AMOUNT_JPY: string;
	DKIMPrivateKey: string;
}

const BITBANK_API_URL = "https://api.bitbank.cc/v1";
const BITBANK_PUBLIC_API_URL = "https://public.bitbank.cc";

async function createOrder(amount: string, env: Env): Promise<Response> {
	const path = "/user/spot/order";
	// Unix タイムスタンプを使用して nonce を生成
	const nonce = Math.floor(Date.now() / 1000).toString();
	console.log("Nonce:", nonce);
	const body = JSON.stringify({
		pair: "btc_jpy",
		amount: amount,
		side: "buy",
		type: "market",
	});
	console.log("Request body:", body);

	const signature = await createSignature(nonce, body, env.BITBANK_API_SECRET);

	const response = await fetch(`${BITBANK_API_URL}${path}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"ACCESS-KEY": env.BITBANK_API_KEY,
			"ACCESS-NONCE": nonce,
			"ACCESS-SIGNATURE": signature,
		},
		body: body,
	});

	if (!response.ok) {
		const errorBody = await response.text();
		throw new Error(
			`HTTP error! status: ${response.status}, message: ${errorBody}`,
		);
	}

	return response;
}

//署名作成は、以下の文字列を HMAC-SHA256 形式でAPIシークレットキーを使って署名した結果となります。
// ACCESS-NONCE方式の場合
// GETの場合: 「ACCESS-NONCE、リクエストのパス、クエリパラメータ」 を連結させたもの
// POSTの場合: 「ACCESS-NONCE、リクエストボディのJson文字列」 を連結させたもの
// 今回はPost
// 例↓
// export API_SECRET="hoge"
// export ACCESS_NONCE="1721121776490"
// export ACCESS_SIGNATURE="$(echo -n "$ACCESS_NONCE/v1/user/assets" | openssl dgst -sha256 -hmac "$API_SECRET")"

// echo $ACCESS_SIGNATURE
// f957817b95c3af6cf5e2e9dfe1503ea8088f46879d4ab73051467fd7b94f1aba
async function createSignature4Post(
	nonce: string,
	body: string,
	secret: string,
): Promise<string> {
	const message = `${nonce}${body}`;
	const encoder = new TextEncoder();
	const data = encoder.encode(message);
	const key = encoder.encode(secret);
	const signature = await crypto.subtle.importKey(
		"raw",
		key,
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const signatureBuffer = await crypto.subtle.sign("HMAC", signature, data);
	const signatureArray = Array.from(new Uint8Array(signatureBuffer));
	const signatureHex = signatureArray
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
	return signatureHex;
}

// export API_SECRET="hoge"
// export ACCESS_NONCE="1721121776490"
// export ACCESS_SIGNATURE="$(echo -n "$ACCESS_NONCE/v1/user/assets" | openssl dgst -sha256 -hmac "$API_SECRET")"

// echo $ACCESS_SIGNATURE
// f957817b95c3af6cf5e2e9dfe1503ea8088f46879d4ab73051467fd7b94f1aba
async function createSignature4Get(
	nonce: string,
	path: string,
	secret: string,
): Promise<string> {
	const message = `${nonce}${path}`;
	const encoder = new TextEncoder();
	const data = encoder.encode(message);
	const key = encoder.encode(secret);
	const signature = await crypto.subtle.importKey(
		"raw",
		key,
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const signatureBuffer = await crypto.subtle.sign("HMAC", signature, data);
	const signatureArray = Array.from(new Uint8Array(signatureBuffer));
	const signatureHex = signatureArray
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
	return signatureHex;
}

async function getBitcoinPrice(): Promise<number> {
	const response = await fetch(`${BITBANK_PUBLIC_API_URL}/btc_jpy/ticker`);
	if (!response.ok) {
		const errorBody = await response.text();
		throw new Error(
			`Failed to fetch Bitcoin price: status ${response.status}, message: ${errorBody}`,
		);
	}
	const data = await response.json();
	return parseFloat(data.data.last);
}

async function getBalance(env: Env): Promise<number> {
	const path = "/user/assets";
	const nonce = Math.floor(Date.now() / 1000).toString();
	const signature = await createSignature4Get(
		nonce,
		`/v1${path}`,
		env.BITBANK_API_SECRET,
	);

	const response = await fetch(`${BITBANK_API_URL}${path}`, {
		headers: {
			"ACCESS-KEY": env.BITBANK_API_KEY,
			"ACCESS-NONCE": nonce,
			"ACCESS-SIGNATURE": signature,
		},
	});

	if (!response.ok) {
		const errorBody = await response.text();
		throw new Error(
			`Failed to fetch balance: status ${response.status}, message: ${errorBody}`,
		);
	}

	const data = await response.json();
	const jpyAsset = data.data.assets.find((asset: any) => asset.asset == "jpy");
	if (jpyAsset) {
		return Number.parseFloat(jpyAsset.onhand_amount);
	} else {
		return 0;
	}
}

export default {
	async scheduled(
		event: ScheduledEvent,
		env: Env,
		ctx: ExecutionContext,
	): Promise<void> {
		try {
			console.log("Starting Bitcoin purchase process...");

			const balance = await getBalance(env);
			console.log(`Current balance: ${balance} JPY`);
			if (balance < Number.parseInt(env.PURCHASE_AMOUNT_JPY)) {
				console.log("Balance is insufficient. Sending notification email...");
				await sendMail(balance);
				return;
			}

			const bitcoinPrice = await getBitcoinPrice();
			console.log(`Current Bitcoin price: ${bitcoinPrice} JPY`);

			const purchaseAmountJPY = Number.parseFloat(env.PURCHASE_AMOUNT_JPY);
			if (Number.isNaN(purchaseAmountJPY) || purchaseAmountJPY <= 0) {
				throw new Error(
					`Invalid PURCHASE_AMOUNT_JPY: ${env.PURCHASE_AMOUNT_JPY}`,
				);
			}

			const bitcoinAmount = (purchaseAmountJPY / bitcoinPrice).toFixed(8);
			console.log(
				`Attempting to purchase ${bitcoinAmount} BTC for ${purchaseAmountJPY} JPY`,
			);

			const orderResponse = await createOrder(bitcoinAmount, env);
			const orderResult = await orderResponse.json();

			if (orderResult.success) {
				console.log("Order successfully placed:", orderResult.data);
			} else {
				throw new Error(`Order failed: ${JSON.stringify(orderResult)}`);
			}
		} catch (error) {
			console.error(
				"An error occurred during the Bitcoin purchase process:",
				error.message,
			);
			if (error instanceof Error) {
				console.error("Error details:", error.stack);
			}
			// ここで、エラー通知を送信するなどの追加のエラーハンドリングを行うことができます
		}
	},
};
