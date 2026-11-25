const encoder = new TextEncoder();

export type ChatStreamClaims = {
	conversationId: string;
	userId: string | null;
	sessionKey: string | null;
	expiresAt: number;
};

function encode(bytes: Uint8Array) {
	let binary = "";
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary)
		.replaceAll("+", "-")
		.replaceAll("/", "_")
		.replace(/=+$/, "");
}

function decode(value: string) {
	const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
	const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
	return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function signingKey(secret: string) {
	return crypto.subtle.importKey(
		"raw",
		encoder.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign", "verify"],
	);
}

export async function createChatStreamTicket(
	secret: string,
	claims: ChatStreamClaims,
) {
	const payload = encode(encoder.encode(JSON.stringify(claims)));
	const signature = await crypto.subtle.sign(
		"HMAC",
		await signingKey(secret),
		encoder.encode(payload),
	);
	return `${payload}.${encode(new Uint8Array(signature))}`;
}

export async function verifyChatStreamTicket(secret: string, ticket: string) {
	const [payload, signature, extra] = ticket.split(".");
	if (!payload || !signature || extra) return null;

	const valid = await crypto.subtle.verify(
		"HMAC",
		await signingKey(secret),
		decode(signature),
		encoder.encode(payload),
	);
	if (!valid) return null;

	try {
		const claims = JSON.parse(
			new TextDecoder().decode(decode(payload)),
		) as ChatStreamClaims;
		if (
			!claims.conversationId ||
			(!claims.userId && !claims.sessionKey) ||
			(claims.userId !== null && claims.sessionKey !== null) ||
			claims.expiresAt <= Date.now()
		) {
			return null;
		}
		return claims;
	} catch {
		return null;
	}
}
