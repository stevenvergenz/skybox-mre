import * as MRE from '@microsoft/mixed-reality-extension-sdk';

export default class App {
	private skyboxAssets: MRE.AssetContainer;

	public constructor(public context: MRE.Context, public params: MRE.ParameterSet) {
		this.context.onStarted(() => this.start());
	}

	private async start() {
		this.skyboxAssets = new MRE.AssetContainer(this.context);
		const cube = await this.skyboxAssets.loadGltf('cubemap.glb');
		MRE.Actor.CreateFromPrefab(this.context, {
			firstPrefabFrom: cube,
			actor: {
				name: "skybox",
				transform: { local: { scale: { x: 1000, y: 1000, z: 1000 } } }
			}
		});
	}
}
