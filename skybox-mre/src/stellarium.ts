import { resolve } from 'path';
import { rename as cbRename } from 'fs';
import { promisify } from 'util';
const rename = promisify(cbRename);
import julian from 'julian';
import fetch from 'node-fetch';

import { Location } from './location';

export type CubeFace
	= 'north'
	| 'south'
	| 'east'
	| 'west'
	| 'up'
	| 'down';

export type Cube = { [face: string]: string };

const stelUrl = process.env.STEL_URL ?? 'http://localhost:8090';
const stelOutdir = process.env.STEL_OUTDIR ?? resolve(__dirname, "./screenshots");
let stelReady: Promise<Cube> = setup();

async function setup() {
	// give it some time to finish booting
	// await sleep(10000);

	// wait for startup
	do {
		try {
			const res = await fetch(`${stelUrl}/api/main/plugins`);
			if (res.ok) {
				const status = await res.json();
				if (Object.keys(status).every(plugin => status[plugin].loaded === status[plugin].loadAtStartup)) {
					break;
				} else {
					console.log("Stellarium starting up");
					await sleep(2000);
				}
			} else {
				console.log(res.url, res.statusText);
				await sleep(2000);
			}
		} catch (e) {
			console.log("Stellarium offline");
			await sleep(2000);
		}
	} while(1);

	console.log("Stellarium found, initializing");

	// set initial props
	await disableUI();
	return null as Cube;
}

function sleep(duration: number) {
	return new Promise((resolve, reject) => {
		setTimeout(resolve, duration);
	});
}

/** @returns The URL to the screenshot */
export function takeSkybox(place: Location, time: Date, outName: string) {
	return stelReady = stelReady.then(() => _takeSkybox(place, time, outName));
}

async function _takeSkybox(place: Location, time: Date, outName: string) {
	await setLocation(place);
	await setTime(time, 0);

	// the ground takes ~1s to fade in, and I can't find a setting to reduce it
	//await setStelProperty("actionShow_Ground", true);
	//await sleep(1000);
	
	await setDirection('north');
	const north = await takeScreenshot(outName + '-n');

	await setDirection('east');
	const east = await takeScreenshot(outName + '-e');

	await setDirection('south');
	const south = await takeScreenshot(outName + '-s');

	await setDirection('west');
	const west = await takeScreenshot(outName + '-w');

	await setDirection('up');
	const up = await takeScreenshot(outName + '-u');

	return {
		north,
		east,
		south,
		west,
		up
	} as Cube;
}

async function takeScreenshot(outName: string): Promise<string> {
	await runStelAction("actionSave_Screenshot_Global");

	const outfile = resolve(stelOutdir, outName + '.png');
	await rename(resolve(stelOutdir, 'stellarium-000.png'), outfile);
	return `skies/${outName}.png`;
	
	/*await sleep(700);
	return `${__dirname}/../../test/testbed-e.png`;*/
}

async function disableUI() {
	await setStelProperty("NebulaMgr.labelsAmount", 0);
	await setStelProperty("SolarSystem.labelsDisplayed", false);
	await setStelProperty("actionToggle_GuiHidden_Global", false);
}

/*async function setFOV(fov: number) {
	const result = await fetch(`${stelUrl}/api/main/fov?fov=${fov}`, { method: 'POST' });
	const text = await result.text();
	if (text !== 'ok') {
		throw new Error(text);
	}
}*/

async function setDirection(direction: CubeFace) {
	let azumith = 0, altitude = 0;
	switch (direction) {
		case 'north':
			azumith = Math.PI;
			break;
		case 'east':
			azumith = 0.5 * Math.PI;
			break;
		case 'west':
			azumith = 1.5 * Math.PI;
			break;
		case 'up':
			// not exactly up to prevent gimbal issues
			altitude = 0.5 * Math.PI - 0.000001;
			break;
		case 'down':
			altitude = 1.5 * Math.PI - 0.000001;
			break;
	}

	const result = await fetch(`${stelUrl}/api/main/view?az=${azumith}&alt=${altitude}`, { method: 'POST' });
	const text = await result.text();
	if (text !== 'ok') {
		throw new Error(text);
	}
}

async function setTime(time: Date, timerate: number) {
	const julianDay = julian(time);
	const result = await fetch(`${stelUrl}/api/main/time?time=${julianDay}&timerate=${timerate}`, { method: 'POST' });
	const text = await result.text();
	if (text !== 'ok') {
		throw new Error(text);
	}
}

async function setLocation(place: Location) {
	const result = await fetch(`${stelUrl}/api/location/setlocationfields`
		+ `?latitude=${place.latitude}`
		+ `&longitude=${place.longitude}`
		+ `&altitude=${place.altitude ?? 0}`
		+ `&planet=${place.planet ?? 'earth'}`,
		{ method: 'POST' });
	const text = await result.text();
	if (text !== 'ok') {
		throw new Error(text);
	}
}

async function setLightPollution(bortleScaleIndex: number) {
	await setStelProperty("StelSkyDrawer.bortleScaleIndex", bortleScaleIndex);
}

async function setStelProperty(propId: string, value: any) {
	let result = await fetch(
		`${stelUrl}/api/stelproperty/set?id=${propId}&value=${value}`,
		{ method: 'POST' });
	let text = await result.text();
	if (text !== 'ok') {
		throw new Error(text);
	}
}

async function runStelActionResponse(actionId: string) {
	const result = await fetch(`${stelUrl}/api/stelaction/do?id=${actionId}`, { method: 'POST'});
	return await result.text();
}
async function runStelAction(actionId: string) {
	const text = await runStelActionResponse(actionId);
	if (text !== 'ok') {
		throw new Error(text);
	}
}
