import { createCanvas, loadImage } from 'canvas';
import fetch from 'node-fetch';
import ethers from 'ethers';
import pinataSDK from '@pinata/sdk';
import FormData from 'form-data';


export default function(server, opts, done) {
	const pinata = pinataSDK(process.env.PINATA_KEY, process.env.PINATA_SECRET);

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

		const base64url = canvas.toDataURL();

		return {
			image: base64url,
			metadata: {
				name,
				description,
				attributes,
				image: base64url
			}
		}
	}

	const uploadIpfs = async(metadata) => {
		const { IpfsHash } = await pinata.pinJSONToIPFS(metadata, {
			pinataMetadata: {
				name: `ethNyc-${metadata.name}`
			}
		});

		const baseUri = "https://ipfs.io/ipfs/";
		return baseUri + IpfsHash

	}

	const signUriChange = async(wallet, tokens, uri) => {
		const provider  = new ethers.providers.InfuraProvider('homestead', process.env.INFURA_ID);
		const signer    = new ethers.Wallet(process.env.SIGNER_P_KEY, provider);

		const message   = [wallet, tokens, uri];

		console.log(message);
		const hash      = ethers.utils.solidityKeccak256(["address", "uint[]", "string"], message);
		const binary    = ethers.utils.arrayify(hash);
		const signature = await signer.signMessage(binary);

		return {
			tokens,
			uri,
			signature
		}
	}

	server.post('/finalize', async(request) => {
		const { image: imageBase64, metadata } = await draw(request.body.layers, request.body.name, request.body.description);

		const ipfs_uri = await uploadIpfs(metadata);
		const signArgs = await signUriChange(request.body.wallet, request.body.tokens, ipfs_uri);
		return { ...signArgs, imageBase64 };
	});

	server.post('/build', async(request) => {
		const { image: imageBase64, metadata } = await draw(request.body.layers);

		return {
			imageBase64,
			metadata
		};
	});

	done();
}