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

export interface PairsResponse {
	success: number;
	data: {
		pairs: Pair[];
	};
}

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
