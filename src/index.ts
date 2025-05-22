import { authorize } from './authorize';
import { getDatasource, uploadLocalDatasource } from './datasource';
import { transform } from './transformer';

const ignorePath = ['/favicon.ico', '/robots.txt'];
const resp = (body: any, status: number, headers?: Record<string, string>) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json', ...headers },
	});

export default {
	async fetch(req, env, ctx): Promise<Response> {
		const url = new URL(req.url);
		const pathname = decodeURIComponent(url.pathname);
		if (ignorePath.includes(pathname)) {
			return new Response(null, { status: 404 });
		}

		if (req.method === 'GET') {
			const width = Number(url.searchParams.get('width')) || undefined;
			const height = Number(url.searchParams.get('height')) || undefined;
			const format = url.searchParams.get('format') || undefined;
			if (!pathname) {
				return resp({ error: 'No target URL provided' }, 400);
			}

			if (format && !['avif', 'webp', 'png', 'jpeg'].includes(format)) {
				return resp({ error: 'Invalid format' }, 400);
			}

			const datasource = await getDatasource(env, pathname);
			if (!datasource) return resp({ error: 'image not found' }, 404);

			const transformed = await transform(env, datasource, { width, height, format });
			return new Response(transformed.data, {
				status: 200,
				headers: { 'Content-Type': transformed.contentType },
			});
		}

		if (req.method === 'POST') {
			const authorization = req.headers.get('Authorization');
			if (!authorization) return resp({ error: 'Unauthorized' }, 401);

			const [authType, token] = authorization.split(' ');
			if (authType !== 'Bearer') return resp({ error: 'Unauthorized' }, 401);

			const authorized = await authorize(env, pathname, token);
			if (!authorized) return resp({ error: 'Unauthorized' }, 401);

			const data = await req.arrayBuffer();
			const contentType = req.headers.get('Content-Type') || 'image/webp';
			const transformed = await transform(env, { data, contentType }, { format: 'webp' });
			await uploadLocalDatasource(env, pathname, {
				data: transformed.data,
				contentType: transformed.contentType,
			});

			return resp({ success: true }, 200);
		}

		return resp({ error: 'Method not allowed' }, 405);
	},
} satisfies ExportedHandler<Env>;
