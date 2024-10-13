// ref: https://github.com/bitbankinc/bitbank-api-docs/tree/master

export interface OrderResponse {
	success: number;
	data: {
		order_id: number;
		pair: string;
		side: string;
		position_side: string | null;
		type: string;
		start_amount: string | null;
		remaining_amount: string | null;
		executed_amount: string;
		price: string | undefined;
		post_only: boolean | undefined;
		user_cancelable: boolean;
		average_price: string;
		ordered_at: number;
		expire_at: number | null;
		trigger_price: string | undefined;
		status: string;
	};
}

export interface TickerResponse {
	success: number;
	data: {
		sell: string;
		buy: string;
		high: string;
		low: string;
		open: string;
		last: string;
		vol: string;
		timestamp: number;
	};
}

export interface AssetsResponse {
	success: number;
	data: {
		assets: {
			asset: string;
			free_amount: string;
			amount_precision: number;
			onhand_amount: string;
			locked_amount: string;
			withdrawing_amount: string;
			withdrawal_fee:
				| {
						min: string;
						max: string;
				  }
				| {
						under: string;
						over: string;
						threshold: string;
				  };
			stop_deposit: boolean;
			stop_withdrawal: boolean;
			network_list: {
				asset: string;
				network: string;
				stop_deposit: boolean;
				stop_withdrawal: boolean;
				withdrawal_fee: string;
			}[];
			collateral_ratio: string;
		}[];
	};
}

//Name	Type	Description
// name	string	通貨ペア: ペア一覧
// base_asset	string	原資産
// quote_asset	string	クオート資産
// maker_fee_rate_base	string	メイカー手数料率(原資産)
// taker_fee_rate_base	string	テイカー手数料率(原資産)
// maker_fee_rate_quote	string	メイカー手数料率(クオート資産)
// taker_fee_rate_quote	string	テイカー手数料率(クオート資産)
// margin_open_maker_fee_rate_quote	string | null	新規建てmaker手数料率(クオート資産)
// margin_open_taker_fee_rate_quote	string | null	新規建てtaker手数料率(クオート資産)
// margin_close_maker_fee_rate_quote	string | null	決済maker手数料率(クオート資産)
// margin_close_taker_fee_rate_quote	string | null	決済maker手数料率(クオート資産)
// margin_long_interest	string | null	ロング利息率/日
// margin_short_interest	string | null	ショート利息率/日
// margin_current_individual_ratio	string | null	現在の個人のリスク想定比率
// margin_current_individual_until	number | null	現在の個人のリスク想定比率の適用終了日時（UnixTimeのミリ秒）
// margin_current_company_ratio	string | null	現在の法人のリスク想定比率
// margin_current_company_until	number | null	現在の法人のリスク想定比率の適用終了日時（UnixTimeのミリ秒）
// margin_next_individual_ratio	string | null	次の個人のリスク想定比率
// margin_next_individual_until	number | null	次の個人のリスク想定比率の適用終了日時（UnixTimeのミリ秒）
// margin_next_company_ratio	string | null	次の法人のリスク想定比率
// margin_next_company_until	number | null	次の法人のリスク想定比率の適用終了日時（UnixTimeのミリ秒）
// unit_amount	string	最小注文数量
// limit_max_amount	string	最大注文数量
// market_max_amount	string	成行注文時の最大数量
// market_allowance_rate	string	成行買注文時の余裕率
// price_digits	number	価格切り捨て対象桁数(0起点)
// amount_digits	number	数量切り捨て対象桁数(0起点)
// is_enabled	boolean	通貨ペアステータス(有効/無効)
// stop_order	boolean	注文停止ステータス
// stop_order_and_cancel	boolean	注文および注文キャンセル停止ステータス
// stop_market_order	boolean	成行注文停止ステータス
// stop_stop_order	boolean	逆指値(成行)注文停止ステータス
// stop_stop_limit_order	boolean	逆指値(指値)注文停止ステータス
// stop_margin_long_order	boolean	ロング新規建て注文停止ステータス
// stop_margin_short_order	boolean	ショート新規建て注文停止ステータス
// stop_buy_order	boolean	買い注文停止ステータス
// stop_sell_order	boolean	売り注文停止ステータス
// サンプルコード:

// Curl
// レスポンスのフォーマット:

// {
//   "success": 1,
//   "data": {
//     "pairs": [
//       {
//         "name": "string",
//         "base_asset": "string",
//         "maker_fee_rate_base": "string",
//         "taker_fee_rate_base": "string",
//         "maker_fee_rate_quote": "string",
//         "taker_fee_rate_quote": "string",
//         "margin_open_maker_fee_rate_quote": "string",
//         "margin_open_taker_fee_rate_quote": "string",
//         "margin_close_maker_fee_rate_quote": "string",
//         "margin_close_taker_fee_rate_quote": "string",
//         "margin_long_interest": "string",
//         "margin_short_interest": "string",
//         "margin_current_individual_ratio": "string",
//         "margin_current_individual_until": 0,
//         "margin_current_company_ratio": "string",
//         "margin_current_company_until": 0,
//         "margin_next_individual_ratio": "string",
//         "margin_next_individual_until": 0,
//         "margin_next_company_ratio": "string",
//         "margin_next_company_until": 0,
//         "unit_amount": "string",
//         "limit_max_amount": "string",
//         "market_max_amount": "string",
//         "market_allowance_rate": "string",
//         "price_digits": 0,
//         "amount_digits": 0,
//         "is_enabled": true,
//         "stop_order": false,
//         "stop_order_and_cancel": false,
//         "stop_market_order": false,
//         "stop_stop_order": false,
//         "stop_stop_limit_order": false,
//         "stop_margin_long_order": false,
//         "stop_margin_short_order": false,
//         "stop_buy_order": false,
//         "stop_sell_order": false
//       }
//     ]
//   }
// }
export interface PairsResponse {
	success: number;
	data: {
		pairs: Pair[];
	};
}

// pairs の中の型
interface Pair {
	name: string;
	base_asset: string;
	quote_asset: string;
	maker_fee_rate_base: string;
	taker_fee_rate_base: string;
	maker_fee_rate_quote: string;
	taker_fee_rate_quote: string;
	margin_open_maker_fee_rate_quote: string | null;
	margin_open_taker_fee_rate_quote: string | null;
	margin_close_maker_fee_rate_quote: string | null;
	margin_close_taker_fee_rate_quote: string | null;
	margin_long_interest: string | null;
	margin_short_interest: string | null;
	margin_current_individual_ratio: string | null;
	margin_current_individual_until: number | null;
	margin_current_company_ratio: string | null;
	margin_current_company_until: number | null;
	margin_next_individual_ratio: string | null;
	margin_next_individual_until: number | null;
	margin_next_company_ratio: string | null;
	margin_next_company_until: number | null;
	unit_amount: string;
	limit_max_amount: string;
	market_max_amount: string;
	market_allowance_rate: string;
	price_digits: number;
	amount_digits: number;
	is_enabled: boolean;
	stop_order: boolean;
	stop_order_and_cancel: boolean;
	stop_market_order: boolean;
	stop_stop_order: boolean;
	stop_stop_limit_order: boolean;
	stop_margin_long_order: boolean;
	stop_margin_short_order: boolean;
	stop_buy_order: boolean;
	stop_sell_order: boolean;
}
