import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import App from './app';

function pad(value: number, digits: number) {
	let str = Math.round(value).toString(10);
	while (str.length < digits) {
		str = '0' + str;
	}
	return str;
}

export class Field {
	private incrementButton: MRE.ButtonBehavior;
	private decrementButton: MRE.ButtonBehavior;
	private label: MRE.Actor;
	private value: number;

	public get root() { return this.label; }

	public constructor(
		private app: App,
		private params: {
			minValue: number,
			maxValue: number,
			initialValue: number,
			incrementStep?: number,
			decrementStep?: number,
			digits?: number
		},
		actorProps: MRE.ActorLike
	) {
		this.label = MRE.Actor.Create(this.app.context, { actor: {
			...actorProps,
			text: {
				contents: pad(this.params.initialValue, this.params.digits),
				height: 0.2,
				color: { r: 0.15 }
			}
		}});
	}
}
