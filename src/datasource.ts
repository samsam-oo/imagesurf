export type Datasource = { data: ArrayBuffer; contentType: string };

export async function getDatasource(env: Env, url: string): Promise<Datasource | null> {
	if (url.startsWith('/http')) {
		return getForeignDatasource(env, url.slice(1));
	}

	return getLocalDatasource(env, url);
}

export async function getForeignDatasource(env: Env, url: string): Promise<Datasource | null> {
	try {
		const allowedUrls = env.ALLOWED_URLS.split(',');
		const isAllowedUrl = allowedUrls.some((allowedUrl) => url.startsWith(allowedUrl));
		if (!isAllowedUrl) return null;

		const options: RequestInit = {
			signal: AbortSignal.timeout(5_000),
			redirect: 'follow',
		};

		const resp = await fetch(url, options);
		if (!resp.ok) return null;

		return {
			data: await resp.arrayBuffer(),
			contentType: resp.headers.get('content-type') || 'image/webp',
		};
	} catch (error) {
		return null;
	}
}

export async function getLocalDatasource(env: Env, key: string): Promise<Datasource | null> {
	const resp = await env.bucket.get(key);
	if (!resp) return null;

	return {
		data: await resp.arrayBuffer(),
		contentType: resp.httpMetadata?.contentType || 'image/webp',
	};
}

export async function uploadLocalDatasource(env: Env, key: string, datasource: Datasource) {
	await env.bucket.put(key, datasource.data, {
		httpMetadata: { contentType: datasource.contentType },
	});
}
