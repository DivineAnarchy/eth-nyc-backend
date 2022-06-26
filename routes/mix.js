import { createCanvas, loadImage } from 'canvas';

export default function(server, opts, done) {
	const draw = async(layers, name = "{some user set name}", description = "{some user set description}") => {
		const width  = parseInt(process.env.MIXER_WIDTH);
		const height = parseInt(process.env.MIXER_HEIGHT);
		const canvas = createCanvas(width, height);
		const ctx    = canvas.getContext("2d");

		const attributes = [];
		for(const { group, trait } of layers) {
			const layerPath = `layers/${group}/${trait}`;
			const layer     = await loadImage(layerPath);

			ctx.drawImage(layer, 0, 0, width, height);
			attributes.push({
				trait_type: group,
				value: trait.split('.')[0]
			});
		}

		return {
			image: canvas.toDataURL(),
			metadata: {
				name,
				description,
				attributes
			}
		}
	}

	server.post('/build', async(request) => {
		const { image: imageBase64, metadata } = await draw(request.body.layers);

		return {
			imageBase64,
			metadata
		};
	});

	done();
}