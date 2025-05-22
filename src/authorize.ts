import * as jose from 'jose';

export async function authorize(env: Env, pathname: string, authorization: string) {
	const secret = env.JWT_SECRET;
	if (!secret) return true;

	const secretKey = new TextEncoder().encode(secret);
	const token = await jose.jwtVerify(authorization, secretKey);
	if (token.payload.sub !== pathname) return false;
	return true;
}
