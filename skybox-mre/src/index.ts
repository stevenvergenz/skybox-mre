import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import * as Restify from 'restify';
import { resolve } from 'path';

import App from './app';
import * as Stellarium from './stellarium';

process.on('uncaughtException', err => console.error(err));
process.on('unhandledRejection', err => console.error(err));

Stellarium.takeSkybox(
	{ latitude: 47.60621, longitude: -122.33207 },
	new Date(),
	"skybox"
);

const server = new MRE.WebHost({
	baseDir: resolve(__dirname, "./public"),
	optionalPermissions: [MRE.Permissions.UserInteraction]
});

setTimeout(() => {
	server.adapter.server.get('/skies/*', Restify.plugins.serveStaticFiles(process.env.STEL_OUTDIR));
}, 1000);

server.adapter.onConnection((context, params) => new App(context, params));
