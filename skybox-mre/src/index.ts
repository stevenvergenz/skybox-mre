import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import * as Restify from 'restify';
import { resolve } from 'path';

import App from './app';

process.on('uncaughtException', err => console.error(err));
process.on('unhandledRejection', err => console.error(err));

const server = new MRE.WebHost({
	baseDir: resolve(__dirname, "../public")
});

setTimeout(() => {
	server.adapter.server.get('/skies/*', Restify.plugins.serveStaticFiles(process.env.STEL_OUTDIR));
}, 1000);

server.adapter.onConnection((context, params) => new App(context, params));
