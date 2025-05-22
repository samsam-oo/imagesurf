import { PhotonImage, resize, SamplingFilter } from '@cf-wasm/photon';
import { Datasource } from './datasource';

function getSize(first?: number, second?: number, third?: number): number {
	return Math.min(first || Number.MAX_SAFE_INTEGER, second || Number.MAX_SAFE_INTEGER, third || Number.MAX_SAFE_INTEGER);
}

export async function transform(
	env: Env,
	datasource: Datasource,
	props: { width?: number; height?: number; format?: string }
): Promise<Datasource> {
	const { width, height, format } = props;
	if (!width && !height && !format) return datasource;

	const bytes = new Uint8Array(datasource.data);
	let image = PhotonImage.new_from_byteslice(bytes);

	if (height || width) {
		const maxHeight = Number(env.MAX_HEIGHT) || 10240;
		const maxWidth = Number(env.MAX_WIDTH) || 10240;
		const calcHeight = getSize(maxHeight, image.get_height(), height);
		const calcWidth = getSize(maxWidth, image.get_width(), width);
		const resizedImage = resize(image, calcWidth, calcHeight, SamplingFilter.Nearest);

		image.free();
		image = resizedImage;
	}

	let outputBytes: Uint8Array;
	switch (format) {
		case 'png':
			outputBytes = image.get_bytes();
			break;
		case 'jpeg':
			outputBytes = image.get_bytes_jpeg(1);
			break;
		default:
			outputBytes = image.get_bytes_webp();
	}

	image.free();
	const contentType = format === 'png' ? 'image/png' : format === 'jpeg' ? 'image/jpeg' : 'image/webp';
	return {
		data: outputBytes,
		contentType,
	};
}
