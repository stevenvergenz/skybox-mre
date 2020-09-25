import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import App from './app';
import Controls from './controls';

function pad(value: number, digits: number) {
	const sign = value < 0 ? "-" : "";
	let str = Math.round(Math.abs(value)).toString(10);
	while (str.length < digits) {
		str = '0' + str;
	}
	return sign + str;
}

type FieldParams = {
	initialValue: number;
	prefix: string;
	suffix: string;
	wrap: boolean;
};

export type NumberFieldValueChangedCallback = (oldVal: number, newVal: number) => void;
export type NumericFieldParams = FieldParams & {
	type: "number";
	minValue: number;
	maxValue: number;
	incrementStep: number;
	decrementStep: number;
	digits: number;
	forceSign: boolean;
}

export type StringFieldValueChangedCallback = (oldVal: string, newVal: string) => void;
export type StringFieldParams = FieldParams & {
	type: "string";
	options: string[];
}

export class Field {
	private static Assets: {[session: string]: MRE.AssetContainer} = {};

	private params: NumericFieldParams | StringFieldParams;

	private incrementButton: MRE.ButtonBehavior;
	private decrementButton: MRE.ButtonBehavior;
	private label: MRE.Actor;

	private _numberValue: number;
	public get numberValue() { return this._numberValue; }
	public set numberValue(newVal: number) {
		this._numberValue = newVal;
		if (this.label) {
			this.label.text.contents = this.stringValue;
		}
	}

	public get stringValue() {
		if (this.params.type === "number") {
			const sign = (this.params.forceSign && this.numberValue >= 0) ? "+" : "";
			return this.params.prefix + sign + pad(this.numberValue, this.params.digits) + this.params.suffix;
		}
		else if (this.params.type === "string") {
			return this.params.prefix + this.params.options[this.numberValue] + this.params.suffix;
		}
	}

	private get assets() {
		if (!Field.Assets[this.app.context.sessionId]) {
			Field.Assets[this.app.context.sessionId] = new MRE.AssetContainer(this.app.context);
			this.app.context.onStopped(() => {
				Field.Assets[this.app.context.sessionId].unload();
				Field.Assets[this.app.context.sessionId] = null;
			});
		}
		return Field.Assets[this.app.context.sessionId];
	}

	public get root() { return this.label; }

	public constructor(
		private app: App,
		params: Partial<NumericFieldParams | StringFieldParams>,
		actorProps: Partial<MRE.ActorLike>
	) {
		// initialize parameters
		if (params.type === "number") {
			this.params = {
				type: "number",
				minValue: 0,
				maxValue: 100,
				initialValue: 0,
				incrementStep: 1,
				decrementStep: 1,
				digits: 0,
				forceSign: false,
				prefix: "",
				suffix: "",
				wrap: false,
				...params
			};
			this.numberValue = this.params.initialValue;
			this.params.incrementStep = Math.abs(this.params.incrementStep);
			this.params.decrementStep = Math.abs(this.params.decrementStep);
		}
		else if (params.type === "string") {
			this.params = {
				type: "string",
				options: ["A", "B", "C"],
				initialValue: 0,
				prefix: "",
				suffix: "",
				wrap: false,
				...params
			};
			this.numberValue = this.params.initialValue;
		}
		else {
			throw new Error("Invalid field params");
		}

		// create label
		this.label = MRE.Actor.Create(this.app.context, { actor: {
			...actorProps,
			text: {
				contents: this.stringValue,
				height: 0.2,
				color: Controls.ControlColor,
				anchor: MRE.TextAnchorLocation.MiddleCenter
			}
		}});

		// generate button assets
		let arrowMesh = this.assets.meshes.find(m => m.name === "arrow");
		if (!arrowMesh) {
			arrowMesh = this.assets.createCylinderMesh("arrow", 0.01, 0.1, "z", 3);
		}
		let arrowMat = this.assets.materials.find(m => m.name === "arrow");
		if (!arrowMat) {
			arrowMat = this.assets.createMaterial("arrow", {
				color: MRE.Color3.Black(),
				emissiveColor: Controls.ControlColor
			});
		}

		// create button actors
		const incrActor = MRE.Actor.Create(this.app.context, { actor: {
			name: "Increment",
			parentId: this.label.id,
			appearance: { meshId: arrowMesh.id, materialId: arrowMat.id },
			collider: { geometry: { shape: MRE.ColliderType.Auto }},
			transform: { local: {
				position: { y: 0.2 },
				rotation: MRE.Quaternion.FromEulerAngles(0, 0, Math.PI / 3)
			}},
		}});
		const decrActor = MRE.Actor.Create(this.app.context, { actor: {
			name: "Decrement",
			parentId: this.label.id,
			appearance: { meshId: arrowMesh.id, materialId: arrowMat.id },
			collider: { geometry: { shape: MRE.ColliderType.Auto }},
			transform: { local: { position: { y: -0.2 }}},
		}});

		// create button behaviors
		this.incrementButton = incrActor.setBehavior(MRE.ButtonBehavior);
		this.decrementButton = decrActor.setBehavior(MRE.ButtonBehavior);

		// create click handlers
		this.incrementButton.onButton('pressed', () => {
			if (this.params.type === "number") {
				let newVal = this.numberValue + this.params.incrementStep;
				if (this.params.wrap && newVal > this.params.maxValue) {
					newVal = this.params.minValue;
				}
				this.numberValue = Math.max(this.params.minValue, Math.min(this.params.maxValue, newVal));
			}
			else if (this.params.type === "string") {
				let newVal = this.numberValue + 1;
				if (this.params.wrap && newVal > this.params.options.length - 1) {
					newVal = 0;
				}
				this.numberValue = Math.max(0, Math.min(this.params.options.length - 1, newVal));
			}
		});
		this.decrementButton.onButton('pressed', () => {
			if (this.params.type === "number") {
				let newVal = this.numberValue - this.params.decrementStep;
				if (this.params.wrap && newVal < this.params.minValue) {
					newVal = this.params.maxValue;
				}
				this.numberValue = Math.max(this.params.minValue, Math.min(this.params.maxValue, newVal));
			}
			else if (this.params.type === "string") {
				let newVal = this.numberValue - 1;
				if (this.params.wrap && newVal < 0) {
					newVal = this.params.options.length - 1;
				}
				this.numberValue = Math.max(0, Math.min(this.params.options.length - 1, newVal));
			}
		});
	}
}
