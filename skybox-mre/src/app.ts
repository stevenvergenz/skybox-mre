import * as MRE from '@microsoft/mixed-reality-extension-sdk';

export default class App {
	public constructor(public context: MRE.Context, public params: MRE.ParameterSet) {
		this.context.onStarted(() => this.start());
	}

	private start() {

	}
}
