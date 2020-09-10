import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import App from './app';

function pad(value: number, digits: number) {
	let str = Math.round(value).toString(10);
	while (str.length < digits) {
		str = '0' + str;
	}
	return str;
}

type FieldParams = {
	initialValue: number;
	prefix: string;
	suffix: string;
};

export type NumberFieldValueChangedCallback = (oldVal: number, newVal: number) => void;
export type NumericFieldParams = FieldParams & {
	type: "number";
	minValue: number;
	maxValue: number;
	incrementStep: number;
	decrementStep: number;
	digits: number;
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

	private numberValueChangedCallbacks: Set<NumberFieldValueChangedCallback>
		= new Set<NumberFieldValueChangedCallback>();
	private _numberValue: number;
	private get numberValue() { return this._numberValue; }
	private set numberValue(newVal: number) {
		const oldVal = this._numberValue;
		this._numberValue = newVal;
		this.updateLabel();

		for (const cb of this.numberValueChangedCallbacks) {
			try {
				cb(oldVal, newVal);
			}
			catch { }
		}

		if (this.params.type === "string") {
			for (const cb of this.stringValueChangedCallbacks) {
				try {
					cb(this.params.options[oldVal], this.params.options[newVal]);
				}
				catch { }
			}
		}
	}

	private stringValueChangedCallbacks: Set<StringFieldValueChangedCallback>
		= new Set<StringFieldValueChangedCallback>();
	private get stringValue() {
		if (this.params.type === "string") {
			return this.params.prefix + this.params.options[this.numberValue] + this.params.suffix;
		}
	}

	private get assets() { return Field.Assets[this.app.context.sessionId]; }
	private set assets(value) { Field.Assets[this.app.context.sessionId] = value; }

	public get root() { return this.label; }

	public constructor(
		private app: App,
		params: Partial<NumericFieldParams | StringFieldParams>,
		actorProps: MRE.ActorLike
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
				prefix: "",
				suffix: "",
				...params
			};
			this.numberValue = this.params.initialValue;
		} else if (params.type === "string") {
			this.params = {
				type: "string",
				options: ["A", "B", "C"],
				initialValue: 0,
				prefix: "",
				suffix: "",
				...params
			};
			this.numberValue = this.params.initialValue;
		} else {
			throw new Error("Invalid field params");
		}

		// create label
		this.label = MRE.Actor.Create(this.app.context, { actor: {
			...actorProps,
			text: {
				height: 0.2,
				color: { r: 0.15 },
				anchor: MRE.TextAnchorLocation.MiddleCenter
			}
		}});
		this.updateLabel();

		// generate button assets
		if (this.assets) {
			this.assets = new MRE.AssetContainer(this.app.context);
		}
		let arrowMesh = this.assets.meshes.find(m => m.name === "arrow");
		if (!arrowMesh) {
			arrowMesh = this.assets.createCylinderMesh("arrow", 0.01, 0.1, "z", 3);
		}
		let arrowMat = this.assets.materials.find(m => m.name === "arrow");
		if (!arrowMat) {
			arrowMat = this.assets.createMaterial("arrow", {
				color: MRE.Color3.Black(),
				emissiveColor: new MRE.Color3(0.15, 0, 0)
			});
		}

		// create button actors
		const incrActor = MRE.Actor.Create(this.app.context, { actor: {
			name: "Increment",
			parentId: this.label.id,
			appearance: { meshId: arrowMesh.id, materialId: arrowMat.id },
			collider: { geometry: { shape: MRE.ColliderType.Auto }},
			transform: { local: { position: { y: 0.2 }}},
		}});
		const decrActor = MRE.Actor.Create(this.app.context, { actor: {
			name: "Decrement",
			parentId: this.label.id,
			appearance: { meshId: arrowMesh.id, materialId: arrowMat.id },
			collider: { geometry: { shape: MRE.ColliderType.Auto }},
			transform: { local: {
				position: { y: -0.2 },
				rotation: incrActor.transform.local.rotation.add(new MRE.Quaternion(0,0,1,0))
			}},
		}});

		// create button behaviors
		this.incrementButton = incrActor.setBehavior(MRE.ButtonBehavior);
		this.decrementButton = decrActor.setBehavior(MRE.ButtonBehavior);

		// create click handlers
		this.incrementButton.onClick(() => {
			if (this.params.type === "number")
				this.numberValue += Math.abs(this.params.incrementStep);
			else if (this.params.type === "string")
				this.numberValue = Math.max(0, Math.min(this.params.options.length, this.numberValue + 1));
		});
		this.decrementButton.onClick(() => {
			if (this.params.type === "number")
				this.numberValue -= Math.abs(this.params.decrementStep);
			else if (this.params.type === "string")
				this.numberValue = Math.max(0, Math.min(this.params.options.length, this.numberValue - 1));
		})
	}

	public onNumberValueChanged(cb: NumberFieldValueChangedCallback) {
		this.numberValueChangedCallbacks.add(cb);
	}

	public offNumberValueChanged(cb: NumberFieldValueChangedCallback) {
		this.numberValueChangedCallbacks.delete(cb);
	}

	public onStringValueChanged(cb: StringFieldValueChangedCallback) {
		this.stringValueChangedCallbacks.add(cb);
	}

	public offStringValueChanged(cb: StringFieldValueChangedCallback) {
		this.stringValueChangedCallbacks.delete(cb);
	}

	private updateLabel() {
		if (this.params.type === "number") {
			return this.label.text.contents = 
				this.params.prefix
				+ pad(this.numberValue, this.params.digits)
				+ this.params.suffix;
		} else if (this.params.type === "string") {
			return this.label.text.contents =
				this.params.prefix
				+ this.params.options[this.numberValue]
				+ this.params.suffix;
		}
	}
}
