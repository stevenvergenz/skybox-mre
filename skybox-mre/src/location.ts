export enum Planet {
	Earth = 'earth',
	Mars = 'mars'
}

export type Location = {
	latitude: number;
	longitude: number;
	altitude?: number;
	planet?: Planet;
};
