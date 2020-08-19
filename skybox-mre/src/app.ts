import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import * as Stellarium from './stellarium';

export default class App {
	private assets: MRE.AssetContainer;
	private skyboxAssets: MRE.AssetContainer;

	public constructor(public context: MRE.Context, public params: MRE.ParameterSet) {
		this.context.onStarted(() => this.start());
	}

	private async start() {
		this.assets = new MRE.AssetContainer(this.context);
		this.skyboxAssets = new MRE.AssetContainer(this.context);

		const [cube, skybox] = await Promise.all([
			this.assets.loadGltf('cubemap.glb'),
			Stellarium.takeSkybox(
				{ latitude: 47.60621, longitude: -122.33207 },
				new Date(),
				this.context.sessionId
			)]);

		for (const mat of this.assets.materials) {
			if (mat.name === 'north') {
				mat.emissiveTexture = this.skyboxAssets.createTexture('north', {
					uri: skybox.n,
					wrapU: MRE.TextureWrapMode.Clamp,
					wrapV: MRE.TextureWrapMode.Clamp
				} );
			} else if (mat.name === 'south') {
				mat.emissiveTexture = this.skyboxAssets.createTexture('south', {
					uri: skybox.s,
					wrapU: MRE.TextureWrapMode.Clamp,
					wrapV: MRE.TextureWrapMode.Clamp
				} );
			} else if (mat.name === 'east') {
				mat.emissiveTexture = this.skyboxAssets.createTexture('east', {
					uri: skybox.e,
					wrapU: MRE.TextureWrapMode.Clamp,
					wrapV: MRE.TextureWrapMode.Clamp
				} );
			} else if (mat.name === 'west') {
				mat.emissiveTexture = this.skyboxAssets.createTexture('west', {
					uri: skybox.w,
					wrapU: MRE.TextureWrapMode.Clamp,
					wrapV: MRE.TextureWrapMode.Clamp
				} );
			} else if (mat.name === 'up') {
				mat.emissiveTexture = this.skyboxAssets.createTexture('up', {
					uri: skybox.u,
					wrapU: MRE.TextureWrapMode.Clamp,
					wrapV: MRE.TextureWrapMode.Clamp
				});
			}
		}

		// don't spawn prefab until materials are updated
		await Promise.all(this.skyboxAssets.textures.map(t => t.created));

		const actor = MRE.Actor.CreateFromPrefab(this.context, {
			firstPrefabFrom: cube,
			actor: {
				name: "skybox",
				transform: { local: { scale: { x: 1000, y: 1000, z: 1000 } } }
			}
		});
	}
}
