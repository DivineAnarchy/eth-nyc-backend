import fs from 'fs';
import { createCanvas, loadImage } from 'canvas';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
	createFolder('./Build');
	const groups = fs.readdirSync('layers').filter(v => !v.includes('.'));
	const width  = parseInt(process.env.MIXER_WIDTH);
	const height = parseInt(process.env.MIXER_HEIGHT);

	const name_to_id = {
		"Base - Fire Polly"    : 0,
		"Base - Water Polly"   : 1,
		"Head - Halo"          : 2,
		"Head - Horn"          : 3,
		"Head - Mask"          : 4,
		"Board - Skateboard"   : 5,
		"Board - Surfboard"    : 6,
		"Weapon - Buster Sword": 7,
		"Weapon - RPG"         : 8,
		"Background - Blue"    : 9,
		"Background - Cyan"    : 10,
		"Background - Green"   : 11,
		"Background - Orange"  : 12,
		"Background - Pink"    : 13,
		"Background - White"   : 14
	};

	for(const group of groups) {
		const layers = fs.readdirSync(`layers/${group}`);

		for(const layer of layers) {
			const cleanName  = layer.split('.')[0];
			const canvas     = createCanvas(width, height);
			const ctx        = canvas.getContext("2d");
			const layerImage = await loadImage(`layers/${group}/${layer}`);

			ctx.drawImage(layerImage, 0, 0, width, height);

			const token_type_id = name_to_id[`${group} - ${cleanName}`];
			const metadata = {
				name: `${group} - ${cleanName}`,
				description: "Official item for Pollymorph",
				attributes: [
					{ trait_type: "group", value: group },
					{ trait_type: "layer", value: cleanName }
				],
				token_type: token_type_id,
				image: canvas.toDataURL()
			};

			fs.writeFileSync(`./Build/${token_type_id}`, JSON.stringify(metadata, null, 2));
		}
	}
}

function createFolder(dir) {
	if(fs.existsSync(dir)) {
		fs.rmSync(dir, { recursive: true, force: true });
	}

	fs.mkdirSync(dir);
}

main().catch(err => {
	console.log(`Main function failed!\n\n`, err)
	process.exit();
});