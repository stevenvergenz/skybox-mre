import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import App from './app';
import Controls from './controls';

export type FieldParams = {
	initialValue: number;
	prefix: string;
	suffix: string;
	wrap: boolean;
};

export abstract class Field {
	protected static Assets: {[session: string]: MRE.AssetContainer} = {};
	protected static AssetsReady: {[session: string]: Promise<MRE.Asset[]>} = {};
	protected static ModLockGroup: {[session: string]: MRE.GroupMask} = {};

	protected get assets() {
		if (!Field.Assets[this.app.context.sessionId]) {
			Field.Assets[this.app.context.sessionId] = new MRE.AssetContainer(this.app.context);
			this.app.context.onStopped(() => {
				Field.Assets[this.app.context.sessionId].unload();
				delete Field.Assets[this.app.context.sessionId];
			});
		}
		return Field.Assets[this.app.context.sessionId];
	}

	protected get assetsReady() {
		if (!Field.AssetsReady[this.app.context.sessionId]) {
			Field.AssetsReady[this.app.context.sessionId] = this.assets.loadGltf('icons.glb');
			this.app.context.onStopped(() => {
				delete Field.AssetsReady[this.app.context.sessionId];
			});
		}
		return Field.AssetsReady[this.app.context.sessionId];
	}

	protected get modLockGroup() {
		if (!Field.ModLockGroup[this.app.context.sessionId]) {
			Field.ModLockGroup[this.app.context.sessionId] = new MRE.GroupMask(this.app.context,
				this.app.params["modlock"] ? ["moderator"] : ["moderator", "default"]);
			this.app.context.onStopped(() => {
				delete Field.ModLockGroup[this.app.context.sessionId];
			});
		}
		return Field.ModLockGroup[this.app.context.sessionId];
	}

	private _value: number;
	public get value() {
		return this._value;
	}
	public set value(val: number) {
		this._value = val;
		const str = this.updateLabel();
		if (this.root) {
			this.root.text.contents = str;
		}
	}

	private _root: MRE.Actor;
	public get root() { return this._root; }

	protected incrementActor: MRE.Actor;
	protected decrementActor: MRE.Actor;

	protected basicParams: FieldParams;

	protected constructor(protected app: App, params: Partial<FieldParams>, actorProps: Partial<MRE.ActorLike>) {
		this.basicParams = {
			initialValue: 0,
			prefix: "",
			suffix: "",
			wrap: false,
			...params
		};

		this.value = this.basicParams.initialValue;

		// create label
		this._root = MRE.Actor.Create(this.app.context, { actor: {
			...actorProps,
			text: {
				contents: this.updateLabel(),
				height: 0.2,
				color: Controls.ControlColor,
				anchor: MRE.TextAnchorLocation.MiddleCenter
			}
		}});

		this.assetsReady.then(a => this.initWithAssets(a)).catch(e => MRE.log.error('app', e));
	}

	private async initWithAssets(assets: MRE.Asset[]) {
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
		this.incrementActor = MRE.Actor.Create(this.app.context, { actor: {
			name: "Increment",
			parentId: this.root.id,
			appearance: { enabled: this.modLockGroup, meshId: arrowMesh.id, materialId: arrowMat.id },
			collider: { geometry: { shape: MRE.ColliderType.Auto }},
			transform: { local: {
				position: { y: 0.2 },
				rotation: MRE.Quaternion.FromEulerAngles(0, 0, Math.PI / 3)
			}},
		}});
		this.decrementActor = MRE.Actor.Create(this.app.context, { actor: {
			name: "Decrement",
			parentId: this.root.id,
			appearance: { enabled: this.modLockGroup, meshId: arrowMesh.id, materialId: arrowMat.id },
			collider: { geometry: { shape: MRE.ColliderType.Auto }},
			transform: { local: { position: { y: -0.2 }}},
		}});

		// create click handlers
		this.incrementActor.setBehavior(MRE.ButtonBehavior)
		.onButton('pressed', user => {
			if (this.app.params["modlock"] && !user.groups.has("moderator")) return;
			this.incrementValue(1);
		});
		this.decrementActor.setBehavior(MRE.ButtonBehavior)
		.onButton('pressed', user => {
			if (this.app.params["modlock"] && !user.groups.has("moderator")) return;
			this.incrementValue(-1);
		});
	}

	/** Update the label text and return the new text */
	public abstract updateLabel(): string;

	protected abstract incrementValue(direction: number): void;
}
