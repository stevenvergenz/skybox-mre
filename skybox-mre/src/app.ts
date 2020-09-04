import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import * as Stellarium from './stellarium';

export default class App {
	private cubeAssets: MRE.AssetContainer;
	private skyboxAssets: MRE.AssetContainer;

	public constructor(public context: MRE.Context, public params: MRE.ParameterSet) {
		this.context.onStarted(() => this.start());
	}

	private async start() {
		this.cubeAssets = new MRE.AssetContainer(this.context);
		this.skyboxAssets = new MRE.AssetContainer(this.context);

		const [_, skybox] = await Promise.all([
			// load the skybox mesh
			this.cubeAssets.loadGltf('cubemap.glb'),

			// generate the skybox textures
			Stellarium.takeSkybox(
				{ latitude: 47.60621, longitude: -122.33207 },
				new Date(),
				this.context.sessionId
			)
			// and load them
			.then(async (skybox) => {
				const texBox: { [dir: string]: MRE.Texture } = {};
				for (const dir in skybox) {
					texBox[dir] = this.skyboxAssets.createTexture(dir, {
						uri: skybox[dir],
						wrapU: MRE.TextureWrapMode.Clamp,
						wrapV: MRE.TextureWrapMode.Clamp
					});
				}
				await Promise.all(this.skyboxAssets.textures.map(t => t.created));
				return texBox;
			})]);
			
		// assign generated textures to the prefab
		for (const mat of this.cubeAssets.materials) {
			mat.emissiveTexture = skybox[mat.name];
		}

		// delay is necessary due to a bug in the asset cache
		setTimeout(() => {
			// spawn the sky cubemap
			const actor = MRE.Actor.CreateFromPrefab(this.context, {
				prefab: this.cubeAssets.prefabs[0],
				actor: {
					name: "skybox",
					transform: { local: { scale: { x: 1000, y: 1000, z: 1000 } } }
				}
			});
		}, 1000);
	}
}
