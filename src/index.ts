import type {
	OrderResponse,
	TickerResponse,
	AssetsResponse,
	PairsResponse,
} from "./types";

interface Env {
	BITBANK_API_KEY: string;
	BITBANK_API_SECRET: string;
	PURCHASE_AMOUNT_JPY: string;
}

const BITBANK_API_URL = "https://api.bitbank.cc/v1";
const BITBANK_PUBLIC_API_URL = "https://public.bitbank.cc";

async function createOrder(amount: string, env: Env): Promise<OrderResponse> {
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
	console.log("Order Detail: ", body);

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
	console.log("Order response:", response);

	if (!response.ok) {
		const errorBody = await response.text();
		throw new Error(
			`HTTP error! status: ${response.status}, message: ${errorBody}`,
		);
	}

	// OrderResponse に型変換して返す
	const orderResult: OrderResponse = await response.json();
	return orderResult;
}

async function createSignature(
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

async function getBitcoinPrice(): Promise<number> {
	const response = await fetch(`${BITBANK_PUBLIC_API_URL}/btc_jpy/ticker`);
	if (!response.ok) {
		const errorBody = await response.text();
		throw new Error(
			`Failed to fetch Bitcoin price: status ${response.status}, message: ${errorBody}`,
		);
	}
	console.log("Ticker response:", response);
	const data: TickerResponse = await response.json();
	return Number.parseFloat(data.data.last);
}

async function getBalance(env: Env): Promise<number> {
	const path = "/user/assets";
	const nonce = Math.floor(Date.now() / 1000).toString();
	const signature = await createSignature(
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
	console.log("Balance response:", response);

	if (!response.ok) {
		const errorBody = await response.text();
		throw new Error(
			`Failed to fetch balance: status ${response.status}, message: ${errorBody}`,
		);
	}
	const data: AssetsResponse = await response.json();
	if (data.success === 0) {
		throw new Error(`Failed to fetch balance: ${JSON.stringify(data)}`);
	}
	const jpyAsset = data.data.assets.find((asset) => asset.asset === "jpy");
	if (jpyAsset) {
		return Number.parseFloat(jpyAsset.onhand_amount);
	}
	return 0;
}

async function getPairInfo(): Promise<PairsResponse> {
	const response = await fetch(`${BITBANK_API_URL}/spot/pairs`);
	if (!response.ok) {
		const errorBody = await response.text();
		throw new Error(
			`Failed to fetch pair info: status ${response.status}, message: ${errorBody}`,
		);
	}
	console.log("Pairs response:", response);
	const data: PairsResponse = await response.json();

	return data;
}

export default {
	async scheduled(
		event: ScheduledEvent,
		env: Env,
		ctx: ExecutionContext,
	): Promise<void> {
		// event などでcron のどのタイミングで実行されるかを指定できたりする
		try {
			console.log("Starting Bitcoin purchase process...");
			const purchaseAmountJPY = Number.parseFloat(env.PURCHASE_AMOUNT_JPY);
			if (Number.isNaN(purchaseAmountJPY) || purchaseAmountJPY <= 0) {
				throw new Error(
					`Invalid PURCHASE_AMOUNT_JPY: ${env.PURCHASE_AMOUNT_JPY}`,
				);
			}
			console.log(`Your Order Amount: ${purchaseAmountJPY} JPY`);

			// jpy の残高を取得
			const balance = await getBalance(env);
			console.log(`Current balance: ${balance} JPY`);
			if (balance < purchaseAmountJPY) {
				console.error("Insufficient balance: ", balance);
				return;
			}

			// ペア情報を取得
			const pairInfo = await getPairInfo();
			// btc_jpy ペアを取得
			const btcJpyPair = pairInfo.data.pairs.find(
				(pair) => pair.name === "btc_jpy",
			);
			if (!btcJpyPair) {
				throw new Error("btc_jpy pair not found");
			}
			// name === "btc_jpy" のペアの最小・最大取引量を表示
			const unitAmount = btcJpyPair.unit_amount;
			const marketMaxAmount = btcJpyPair.market_max_amount;
			console.log(
				`btc_jpy pair amount range: ${unitAmount} ~ ${marketMaxAmount}`,
			);

			// 現在の Bitcoin の価格を取得
			const bitcoinPrice = await getBitcoinPrice();
			console.log(`Current Bitcoin price: ${bitcoinPrice} JPY`);

			// 購入する Bitcoin の量を計算
			const bitcoinAmount = purchaseAmountJPY / bitcoinPrice;
			console.log(
				`Attempting to purchase ${bitcoinAmount} BTC for ${purchaseAmountJPY} JPY`,
			);
			// 購入する Bitcoin の量が取引可能な範囲内かどうかを確認
			if (
				bitcoinAmount < Number.parseFloat(unitAmount) ||
				bitcoinAmount > Number.parseFloat(marketMaxAmount)
			) {
				throw new Error(
					`Invalid PURCHASE_AMOUNT_JPY: ${env.PURCHASE_AMOUNT_JPY}`,
				);
			}

			// 注文を作成
			const orderResponse = await createOrder(bitcoinAmount.toFixed(8), env);

			// 注文が成功したかどうかを確認
			if (orderResponse.success) {
				console.log("Order successfully placed:", orderResponse.data);
			} else {
				throw new Error(`Order failed: ${JSON.stringify(orderResponse)}`);
			}
			console.log("Bitcoin purchase process complete.");
			return;
		} catch (error) {
			console.error("Failed to purchase Bitcoin:", error);
			return;
		}
	},
};
