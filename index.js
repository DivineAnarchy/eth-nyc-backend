import 'make-promises-safe';
import dotenv from 'dotenv';
import Fastify from 'fastify';
import { Mix } from './routes/export.js';

dotenv.config();

const server = Fastify({ logger: true });
server.register(Mix, { prefix: '/mix' });

const start = async() => {
	try {
		const instance = await server.listen({ port: process.env.PORT });

		console.log(instance);
	} catch(err) {
		console.log(err);
		server.log.error(err);
		process.exit(1);
	}
}
start();