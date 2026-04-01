import type {
	OrderResponse,
	TickerResponse,
	AssetsResponse,
	PairsResponse,
} from "./types";

const BITBANK_API_URL = "https://api.bitbank.cc/v1";
const BITBANK_PUBLIC_API_URL = "https://public.bitbank.cc";

async function createSignature(
	nonce: string,
	body: string,
	secret: string,
): Promise<string> {
	const message = `${nonce}${body}`;
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
	const signatureArray = Array.from(new Uint8Array(signatureBuffer));
	return signatureArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function createOrder(amount: string, env: Env): Promise<OrderResponse> {
	const path = "/user/spot/order";
	const nonce = Math.floor(Date.now() / 1000).toString();
	const body = JSON.stringify({
		pair: "btc_jpy",
		amount: amount,
		side: "buy",
		type: "market",
	});
	console.log("Order request:", { nonce, body });

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
		throw new Error(`HTTP error! status: ${response.status}, message: ${errorBody}`);
	}

	return (await response.json()) as OrderResponse;
}

async function getBitcoinPrice(): Promise<number> {
	const response = await fetch(`${BITBANK_PUBLIC_API_URL}/btc_jpy/ticker`);
	if (!response.ok) {
		const errorBody = await response.text();
		throw new Error(`Failed to fetch Bitcoin price: status ${response.status}, message: ${errorBody}`);
	}
	const data = (await response.json()) as TickerResponse;
	return Number.parseFloat(data.data.last);
}

async function getBalance(env: Env): Promise<number> {
	const path = "/user/assets";
	const nonce = Math.floor(Date.now() / 1000).toString();
	const signature = await createSignature(nonce, `/v1${path}`, env.BITBANK_API_SECRET);

	const response = await fetch(`${BITBANK_API_URL}${path}`, {
		headers: {
			"ACCESS-KEY": env.BITBANK_API_KEY,
			"ACCESS-NONCE": nonce,
			"ACCESS-SIGNATURE": signature,
		},
	});

	if (!response.ok) {
		const errorBody = await response.text();
		throw new Error(`Failed to fetch balance: status ${response.status}, message: ${errorBody}`);
	}
	const data = (await response.json()) as AssetsResponse;
	if (data.success === 0) {
		throw new Error(`Failed to fetch balance: ${JSON.stringify(data)}`);
	}
	const jpyAsset = data.data.assets.find((asset) => asset.asset === "jpy");
	return jpyAsset ? Number.parseFloat(jpyAsset.onhand_amount) : 0;
}

async function getPairInfo(): Promise<PairsResponse> {
	const response = await fetch(`${BITBANK_API_URL}/spot/pairs`);
	if (!response.ok) {
		const errorBody = await response.text();
		throw new Error(`Failed to fetch pair info: status ${response.status}, message: ${errorBody}`);
	}
	return (await response.json()) as PairsResponse;
}

export default {
	async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
		try {
			console.log("Starting Bitcoin purchase process...");

			const pairInfo = await getPairInfo();
			const btcJpyPair = pairInfo.data.pairs.find((pair) => pair.name === "btc_jpy");
			if (!btcJpyPair) {
				throw new Error("btc_jpy pair not found");
			}

			const unitAmount = btcJpyPair.unit_amount;
			const marketMaxAmount = btcJpyPair.market_max_amount;
			console.log(`btc_jpy pair amount range: ${unitAmount} ~ ${marketMaxAmount}`);

			const purchaseAmountBtc = Number.parseFloat(env.PURCHASE_AMOUNT_BTC);
			if (
				Number.isNaN(purchaseAmountBtc) ||
				purchaseAmountBtc < Number.parseFloat(unitAmount) ||
				purchaseAmountBtc >= Number.parseFloat(marketMaxAmount)
			) {
				throw new Error(`Invalid PURCHASE_AMOUNT_BTC: ${env.PURCHASE_AMOUNT_BTC}`);
			}

			const bitcoinPrice = await getBitcoinPrice();
			console.log(`Current Bitcoin price: ${bitcoinPrice} JPY`);

			const balance = await getBalance(env);
			console.log(`Current balance: ${balance} JPY`);

			const purchaseAmountJpy = purchaseAmountBtc * bitcoinPrice;
			if (balance < purchaseAmountJpy) {
				throw new Error(`Insufficient balance: ${balance} JPY < ${purchaseAmountJpy} JPY`);
			}

			const orderResponse = await createOrder(purchaseAmountBtc.toFixed(8), env);

			if (orderResponse.success) {
				console.log("Order successfully placed:", orderResponse.data);
			} else {
				throw new Error(`Order failed: ${JSON.stringify(orderResponse)}`);
			}
			console.log("Bitcoin purchase process complete.");
		} catch (error) {
			console.error("Failed to purchase Bitcoin:", error);
		}
	},
};
