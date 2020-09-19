import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import * as Stellarium from './stellarium';
import Controls from './controls';

export default class App {
	private staticAssets: MRE.AssetContainer;
	private skyboxAssets: MRE.AssetContainer;
	private skyAssets: MRE.AssetContainer = null;
	private skybox: MRE.Actor = null;

	private controls: Controls;

	public constructor(public context: MRE.Context, public params: MRE.ParameterSet) {
		this.context.onStarted(() => this.start());
	}

	private async start() {
		// load static assets
		this.staticAssets = new MRE.AssetContainer(this.context);
		MRE.Actor.CreateFromGltf(this.staticAssets, { uri: 'compass.glb' });

		// spawn controls
		this.controls = new Controls(this, {
			transform: { local: {
				position: { y: 0.3, z: 2 },
				rotation: MRE.Quaternion.FromEulerAngles(Math.PI / 4, 0, 0),
				scale: { x: 0.7, y: 0.7, z: 0.7 }
			}}
		});

		// spawn placeholder sky
		this.skyboxAssets = new MRE.AssetContainer(this.context);
		await this.skyboxAssets.loadGltf('cubemap.glb');
		this.skybox = MRE.Actor.CreateFromPrefab(this.context, {
			prefab: this.skyboxAssets.prefabs[0],
			actor: {
				name: "skybox",
				transform: { local: { position: { y: 1.5 }, scale: { x: 1000, y: 1000, z: 1000 } } }
			}
		});
	}

	public async refreshSky() {
		// generate the skybox textures
		const skybox = await Stellarium.takeSkybox({
			place: this.controls.location,
			time: this.controls.time,
			outName: this.context.sessionId,
			lightPollution: this.controls.lightPollution,
			planetLabels: this.controls.planetLabels,
			starLabels: this.controls.starLabels,
			constellationLines: this.controls.constellationLines
		});

		// blank out the sky before unloading
		for (const mat of this.skyboxAssets.materials) {
			mat.emissiveColor = MRE.Color3.Black();
		}

		// unload previous skybox
		if (this.skyAssets) {
			this.skyAssets.unload();
		}
		this.skyAssets = new MRE.AssetContainer(this.context);

		// load the new skybox
		const texBox: { [dir: string]: MRE.Texture } = {};
		for (const dir in skybox) {
			texBox[dir] = this.skyAssets.createTexture(dir, {
				uri: skybox[dir],
				wrapU: MRE.TextureWrapMode.Clamp,
				wrapV: MRE.TextureWrapMode.Clamp
			});
		}
		await Promise.all(this.skyAssets.textures.map(t => t.created));

		// assign generated textures to the prefab
		for (const mat of this.skyboxAssets.materials) {
			mat.emissiveTexture = texBox[mat.name];
			mat.emissiveColor = MRE.Color3.White();
		}

		// needed for the material changes to propagate to the prefab before we instantiate it.
		// ideally the actor would refer back to the prefab and take the changes too, but it doesn't.
		await this.context.internal.nextUpdate();

		// spawn the sky cubemap
		if (this.skybox) {
			this.skybox.destroy();
		}
		this.skybox = MRE.Actor.CreateFromPrefab(this.context, {
			prefab: this.skyboxAssets.prefabs[0],
			actor: {
				name: "skybox",
				transform: { local: { position: { y: 1.5 }, scale: { x: 1000, y: 1000, z: 1000 } } }
			}
		});
	}
}
