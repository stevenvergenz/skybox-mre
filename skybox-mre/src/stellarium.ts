import { resolve } from 'path';
import { rename as cbRename } from 'fs';
import { promisify } from 'util';
const rename = promisify(cbRename);
import julian from 'julian';
import fetch from 'node-fetch';

import { Location } from './location';

export type CubeFace
	= 'n'
	| 's'
	| 'e'
	| 'w'
	| 'u'
	| 'd';

export type Cube = { [face: string]: string };

const stelUrl = process.env.STEL_URL ?? 'http://localhost:8090/';
const stelOutdir = process.env.STEL_OUTDIR ?? resolve(__dirname, "./screenshots");
let stelReady: Promise<Cube> = setup();

async function setup() {
	// give it some time to finish booting
	// await sleep(10000);

	// wait for startup
	do {
		try {
			const res = await fetch(`${stelUrl}/api/main/status`);
			if (res.ok) {
				break;
			} else {
				console.log("Stellarium status: " + res.statusText);
				await sleep(2000);
			}
		} catch (e) {
			console.log("Stellarium offline");
			await sleep(2000);
		}
	} while(1);

	console.log("Stellarium found, initializing");

	// set initial props
	//await disableLandscape();
	const isShowing = await toggleUI();
	if (isShowing) {
		await toggleUI();
	}
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

	await setDirection('n');
	const north = await takeScreenshot(outName + '-n');

	await setDirection('e');
	const east = await takeScreenshot(outName + '-e');

	await setDirection('s');
	const south = await takeScreenshot(outName + '-s');

	await setDirection('w');
	const west = await takeScreenshot(outName + '-w');

	await setDirection('u');
	const up = await takeScreenshot(outName + '-u');

	return {
		n: north,
		e: east,
		s: south,
		w: west,
		u: up
	} as Cube;
}

async function takeScreenshot(outName: string): Promise<string> {
	const result = await fetch(`${stelUrl}/api/stelaction/do?id=actionSave_Screenshot_Global`, { method: 'POST'});
	const text = await result.text();
	if (text !== 'ok') {
		throw new Error(text);
	}

	const outfile = resolve(stelOutdir, outName + '.png');
	await rename(resolve(stelOutdir, 'stellarium-000.png'), outfile);
	return `skies/${outName}.png`;
}

async function toggleUI() {
	let result = await fetch(
		`${stelUrl}/api/stelproperty/set?id=NebulaMgr.labelsAmount&value=0`,
		{ method: 'POST' });
	let text = await result.text();
	if (text !== 'ok') {
		throw new Error(text);
	}
	
	result = await fetch(
		`${stelUrl}/api/stelproperty/set?id=SolarSystem.labelsDisplayed&value=false`,
		{ method: 'POST' });
	text = await result.text();
	if (text !== 'ok') {
		throw new Error(text);
	}
	
	result = await fetch(`${stelUrl}/api/stelaction/do?id=actionToggle_GuiHidden_Global`, { method: 'POST' });
	return (await result.text()) === 'true';
}

async function setFOV(fov: number) {
	const result = await fetch(`${stelUrl}/api/main/fov?fov=${fov}`, { method: 'POST' });
	const text = await result.text();
	if (text !== 'ok') {
		throw new Error(text);
	}
}

async function setDirection(direction: CubeFace) {
	let azumith = 0, altitude = 0;
	switch (direction) {
		case 'n':
			azumith = Math.PI;
			break;
		case 'e':
			azumith = 0.5 * Math.PI;
			break;
		case 'w':
			azumith = 1.5 * Math.PI;
			break;
		case 'u':
			// not exactly up to prevent gimbal issues
			altitude = 0.5 * Math.PI - 0.000001;
			break;
		case 'd':
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
	const result = await fetch(
		`${stelUrl}/api/stelproperty/set?id=StelSkyDrawer.bortleScaleIndex&value=${bortleScaleIndex}`,
		{ method: 'POST' });
	const text = await result.text();
	if (text !== 'ok') {
		throw new Error(text);
	}
}

async function disableLandscape() {
	let result = await fetch(
		`${stelUrl}/api/stelproperty/set?id=LandscapeMgr.landscapeDisplayed&value=false`,
		{ method: 'POST' });
	let text = await result.text();
	if (text !== 'ok') {
		throw new Error(text);
	}

	result = await fetch(
		`${stelUrl}/api/stelproperty/set?id=LandscapeMgr.flagEnvironmentAutoEnabling&value=false`,
		{ method: 'POST' });
	text = await result.text();
	if (text !== 'ok') {
		throw new Error(text);
	}
}
