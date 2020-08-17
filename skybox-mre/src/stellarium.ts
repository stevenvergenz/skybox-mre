import { resolve } from 'path';
import { rename as cbRename } from 'fs';
import { promisify } from 'util';
const rename = promisify(cbRename);
import { toJulianDay } from 'julian';
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
	await setFOV(60);
	const isShowing = await toggleUI();
	if (isShowing) {
		await toggleUI();
	}
	return null as Cube;
}

/** @returns The URL to the screenshot */
export function takeSkybox(place: Location, time: Date, outName: string) {
	return stelReady = stelReady.then(() => _takeSkybox(place, time, outName));
}

async function _takeSkybox(place: Location, time: Date, outName: string) {
	return {} as Cube;
}

async function takeScreenshot(place: Location, time: Date, direction: CubeFace, outName: string): Promise<string> {
	const result = await fetch(`${stelUrl}/api/stelaction/do?id=actionSave_Screenshot_Global`, { method: 'POST'});
	const text = await result.text();
	if (text !== 'ok') {
		throw new Error(text);
	}

	const outfile = resolve(stelOutdir, outName + '.png');
	await rename(resolve(stelOutdir, 'stellarium-000.png'), outfile);
	return `/skies/${outName}`;
}

async function toggleUI() {
	const result = await fetch(`${stelUrl}/api/stelaction/do?id=actionToggle_GuiHidden_Global`, { method: 'POST' });
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
			altitude = 0.5 * Math.PI;
			break;
		case 'd':
			altitude = 1.5 * Math.PI;
			break;
	}

	const result = await fetch(`${stelUrl}/api/main/view?az=${azumith}&alt=${altitude}`, { method: 'POST' });
	const text = await result.text();
	if (text !== 'ok') {
		throw new Error(text);
	}
}

async function setTime(time: Date) {
	const julianDay = toJulianDay(time);
	const result = await fetch(`${stelUrl}/api/main/time?time=${julianDay}`, { method: 'POST' });
	const text = await result.text();
	if (text !== 'ok') {
		throw new Error(text);
	}
}

async function setLocation(place: Location) {
	const result = await fetch(`${stelUrl}/api/location/setlocationfields`
		+ `?latitude=${place.latitude}&longitude=${place.longitude}&altitude=${place.altitude}&planet=${place.planet}`,
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
