import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import App from './app';
import { Field, FieldParams } from './field';
import Controls from './controls';
import { pad } from './utils';

export type NumericFieldParams = FieldParams & {
	minValue: number;
	maxValue: number;
	incrementStep: number;
	digits: number;
	forceSign: boolean;
}

export class NumericField extends Field {
	private params: NumericFieldParams;

	public constructor(app: App, params: Partial<NumericFieldParams>, actorProps: Partial<MRE.ActorLike>) {
		super(app, params, actorProps);

		// initialize parameters
		this.params = {
			...this.basicParams,
			minValue: 0,
			maxValue: 100,
			incrementStep: 1,
			digits: 0,
			forceSign: false,
			...params
		};

		this.params.incrementStep = Math.abs(this.params.incrementStep);
	}

	public updateLabel() {
		const sign = (this.params.forceSign && this.value >= 0) ? "+" : "";
		return this.params.prefix + sign + pad(this.value, this.params.digits) + this.params.suffix;
	}

	protected incrementValue(direction: number) {
		let newVal = this.value + direction * this.params.incrementStep;
		if (this.params.wrap && newVal > this.params.maxValue) {
			newVal = this.params.minValue;
		} else if (this.params.wrap && newVal < this.params.minValue) {
			newVal = this.params.maxValue;
		}
		this.value = Math.max(this.params.minValue, Math.min(this.params.maxValue, newVal));
	}
}
