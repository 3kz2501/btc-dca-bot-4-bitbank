interface EmailAddress {
	email: string;
	name?: string;
}

interface Personalization {
	to: [EmailAddress, ...EmailAddress[]];
	from?: EmailAddress;
	dkim_domain?: string;
	dkim_private_key?: string;
	dkim_selector?: string;
	reply_to?: EmailAddress;
	cc?: EmailAddress[];
	bcc?: EmailAddress[];
	subject?: string;
	headers?: Record<string, string>;
}

interface ContentItem {
	type: string;
	value: string;
}

export async function sendMail(balance: number): Promise<void> {
	const response = await fetch("https://api.mailchannels.net/tx/v1/send", {
		method: "POST",
		headers: {
			"content-type": "application/json",
		},
		// body: JSON.stringify(payload),
		body: JSON.stringify({
			personalizations: [
				{
					to: [{ email: "nlnl.dev@pm.me" }],
				},
			],
			from: { email: "noreplay@nilnull.xyz", name: "btc_dca_bot-Notification" },
			subject: "btc_dca_bot: Insufficient balance",
			content: [
				{
					type: "text/plain",
					value: `残高が不足しています。現在の残高: ${balance} JPY\n\nこのメールは btc_dca_bot によって自動送信されています。`,
				},
			],
		}),
	});
	if (!response.ok) {
		const errorBody = await response.text();
		throw new Error(
			`HTTP error! status: ${response.status}, message: ${errorBody}`,
		);
	}
	console.log("Done", response.status);
}
