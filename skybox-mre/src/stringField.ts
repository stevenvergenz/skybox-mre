import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import App from './app';
import { Field, FieldParams } from './field';

export type StringFieldParams = FieldParams & {
	options: string[];
}

export class StringField extends Field {
	private params: StringFieldParams;

	public constructor(app: App, params: Partial<StringFieldParams>, actorProps: Partial<MRE.ActorLike>) {
		super(app, params, actorProps);

		this.params = {
			...this.basicParams,
			options: ["A", "B", "C"],
			...params
		};
	}

	public updateLabel() {
		return this.params.prefix + this.params.options[this.value] + this.params.suffix;
	}

	protected incrementValue(direction: number) {
		let newVal = this.value + direction;
		if (this.params.wrap && newVal > this.params.options.length - 1) {
			newVal = 0;
		}
		this.value = Math.max(0, Math.min(this.params.options.length - 1, newVal));
	}
}
