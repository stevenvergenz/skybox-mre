import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import App from './app';
import { Location } from './stellarium';
import { NumericField } from './numericField';
import { StringField } from './stringField';

function sum(total: number, value: number) {
	return total + value;
}

export default class Controls {
	public static ControlColor: MRE.Color3Like = { r: 0.5, g: 0, b: 0 };

	private latMagField: NumericField;
	private latDirField: StringField;
	private longMagField: NumericField;
	private longDirField: StringField;
	private altitudeField: NumericField;

	private yearField: NumericField;
	private monthField: NumericField;
	private dayField: NumericField;
	private hourField: NumericField;
	private tzField: NumericField;

	private lightPollutionField: NumericField;
	private planetLabelsField: StringField;
	private starLabelsField: StringField;
	private constellationLinesField: StringField;

	private _root: MRE.Actor;
	public get root() { return this._root; }

	public get location() {
		return {
			latitude: this.latMagField.value * (this.latDirField.value === 0 ? 1 : -1),
			longitude: this.longMagField.value * (this.longDirField.value === 1 ? 1 : -1),
			altitude: this.altitudeField.value
		} as Location;
	}

	public get time() {
		const year = this.yearField.updateLabel(),
			month = this.monthField.updateLabel(),
			day = this.dayField.updateLabel(),
			time = this.hourField.updateLabel(),
			tz = this.tzField.updateLabel();
		return new Date(`${year}${month}${day}T${time}${tz}`);
	}

	public get lightPollution() {
		return this.lightPollutionField.value;
	}

	public get planetLabels() {
		return this.planetLabelsField.value === 1;
	}

	public get starLabels() {
		return this.starLabelsField.value === 1;
	}

	public get constellationLines() {
		return this.constellationLinesField.value === 1;
	}

	public constructor(private app: App, actorInit: Partial<MRE.ActorLike>) {
		// create a new layout
		this._root = MRE.Actor.Create(this.app.context, { actor: {
			name: "Controls",
			...actorInit
		}});
		const rootLayout = new MRE.PlanarGridLayout(this.root,
			MRE.BoxAlignment.TopCenter, MRE.BoxAlignment.TopLeft);

		this.initLocationControls(rootLayout);
		this.initTimeControls(rootLayout);
		this.initMiscControls(rootLayout);

		rootLayout.applyLayout();

		// create apply button
		const apply = MRE.Actor.Create(this.app.context, { actor: {
			name: "ApplyButton",
			parentId: this.root.id,
			text: {
				contents: "APPLY",
				height: 0.4,
				anchor: MRE.TextAnchorLocation.MiddleCenter,
				color: Controls.ControlColor
			},
			collider: { geometry: { shape: MRE.ColliderType.Box, size: { x: 1.3, y: 0.5, z: 0.01 }}},
			transform: { local: { position: { y: -0.3 }}}
		}});
		apply.setBehavior(MRE.ButtonBehavior).onButton('pressed', user => {
			if (this.app.params["modlock"] && !user.groups.has("moderator")) return;
			this.app.refreshSky();
		});
	}

	private initLocationControls(rootLayout: MRE.PlanarGridLayout) {
		const locationRoot = MRE.Actor.Create(this.app.context, { actor: {
			name: "Location",
			parentId: this.root.id
		}});
		const locationLayout = new MRE.PlanarGridLayout(locationRoot,
			MRE.BoxAlignment.BottomRight, MRE.BoxAlignment.MiddleCenter);

		// generate location label
		const locationLabel = MRE.Actor.Create(this.app.context, { actor: {
			name: "LocationLabel",
			parentId: locationRoot.id,
			text: {
				contents: "Location:",
				height: 0.4,
				anchor: MRE.TextAnchorLocation.TopLeft,
				color: Controls.ControlColor
			}
		}});

		// generate location fields
		this.latMagField = new NumericField(this.app,
			{ maxValue: 90, initialValue: 45, incrementStep: 5, suffix: "\u00b0" },
			{ name: "LatitudeMagnitude", parentId: locationRoot.id });
		this.latDirField = new StringField(this.app,
			{ options: ["N", "S"], initialValue: 0, suffix: ",", wrap: true },
			{ name: "LatitudeDirection", parentId: locationRoot.id });

		this.longMagField = new NumericField(this.app,
			{ maxValue: 180, initialValue: 90, incrementStep: 5, suffix: "\u00b0"},
			{ name: "LongitudeMagnitude", parentId: locationRoot.id });
		this.longDirField = new StringField(this.app,
			{ options: ["W", "E"], initialValue: 0, suffix: ",", wrap: true },
			{ name: "LongitudeDirection", parentId: locationRoot.id });

		this.altitudeField = new NumericField(this.app,
			{ maxValue: 1000, initialValue: 20, incrementStep: 5, suffix: "m" },
			{ name: "Altitude", parentId: locationRoot.id });

		// lay out the location fields
		locationLayout.addCell({
			contents: locationLabel,
			row: 0, column: 0,
			width: 0, height: 0.5,
			alignment: MRE.BoxAlignment.TopLeft
		});

		locationLayout.addCell({
			contents: this.latMagField.root,
			row: 1, column: 0,
			width: 0.4, height: 0.6
		});
		locationLayout.addCell({
			contents: this.latDirField.root,
			row: 1, column: 1,
			width: 0.3, height: 0.6
		});

		locationLayout.addCell({
			contents: this.longMagField.root,
			row: 1, column: 2,
			width: 0.4, height: 0.6
		});
		locationLayout.addCell({
			contents: this.longDirField.root,
			row: 1, column: 3,
			width: 0.3, height: 0.6
		});

		locationLayout.addCell({
			contents: this.altitudeField.root,
			row: 1, column: 4,
			width: 0.5, height: 0.6
		});

		locationLayout.applyLayout();
		rootLayout.addCell({
			contents: locationRoot,
			row: 0, column: 0,
			width: locationLayout.getColumnWidths().reduce(sum, 0),
			height: locationLayout.getRowHeights().reduce(sum, 0) + 0.1
		});
	}

	private initTimeControls(rootLayout: MRE.PlanarGridLayout) {
		const timeRoot = MRE.Actor.Create(this.app.context, { actor: {
			name: "Time",
			parentId: this.root.id
		}});
		const timeLayout = new MRE.PlanarGridLayout(timeRoot,
			MRE.BoxAlignment.BottomRight, MRE.BoxAlignment.MiddleCenter);

		// generate time label
		const timeLabel = MRE.Actor.Create(this.app.context, { actor: {
			name: "TimeLabel",
			parentId: timeRoot.id,
			text: {
				contents: "Date/Time:",
				height: 0.4,
				anchor: MRE.TextAnchorLocation.TopLeft,
				color: Controls.ControlColor
			}
		}});

		// generate time fields
		const curTime = new Date();
		this.yearField = new NumericField(this.app,
			{ maxValue: 4000, initialValue: curTime.getUTCFullYear(), digits: 4, suffix: "-" },
			{ name: "Year", parentId: timeRoot.id });
		this.monthField = new NumericField(this.app,
			{ minValue: 1, maxValue: 12, initialValue: curTime.getUTCMonth() + 1, digits: 2, suffix: "-", wrap: true },
			{ name: "Month", parentId: timeRoot.id });
		this.dayField = new NumericField(this.app,
			{ minValue: 1, maxValue: 31, initialValue: curTime.getUTCDate(), digits: 2, wrap: true },
			{ name: "Day", parentId: timeRoot.id });
		this.hourField = new NumericField(this.app,
			{ maxValue: 23, initialValue: curTime.getUTCHours(), digits: 2, suffix: ":00", wrap: true },
			{ name: "Time", parentId: timeRoot.id });
		this.tzField = new NumericField(this.app,
			{ minValue: -1200, maxValue: 1200, incrementStep: 100, digits: 4, forceSign: true, wrap: true },
			{ name: "Timezone", parentId: timeRoot.id });

		// lay out the time fields
		timeLayout.addCell({
			contents: timeLabel,
			row: 0, column: 0,
			width: 0, height: 0.5,
			alignment: MRE.BoxAlignment.TopLeft
		});

		timeLayout.addCell({
			contents: this.yearField.root,
			row: 1, column: 0,
			width: 0.61, height: 0.6
		});
		timeLayout.addCell({
			contents: this.monthField.root,
			row: 1, column: 1,
			width: 0.3, height: 0.6
		});
		timeLayout.addCell({
			contents: this.dayField.root,
			row: 1, column: 2,
			width: 0.3, height: 0.6
		});
		timeLayout.addCell({
			contents: this.hourField.root,
			row: 1, column: 3,
			width: 0.6, height: 0.6
		});
		timeLayout.addCell({
			contents: this.tzField.root,
			row: 1, column: 4,
			width: 0.6, height: 0.6
		});

		timeLayout.applyLayout();
		rootLayout.addCell({
			contents: timeRoot,
			row: 1, column: 0,
			width: timeLayout.getColumnWidths().reduce(sum, 0),
			height: timeLayout.getRowHeights().reduce(sum, 0) + 0.1
		});
	}

	private initMiscControls(rootLayout: MRE.PlanarGridLayout) {
		const lightPollutionLabel = MRE.Actor.Create(this.app.context, { actor: {
			name: "PollutionLabel",
			parentId: this.root.id,
			text: {
				contents: "Light\nPollution:",
				height: 0.3,
				anchor: MRE.TextAnchorLocation.MiddleRight,
				justify: MRE.TextJustify.Right,
				color: Controls.ControlColor
			}
		}});
		this.lightPollutionField = new NumericField(this.app,
			{ minValue: 1, maxValue: 9, initialValue: 2 },
			{ name: "LightPollution", parentId: this.root.id });

		rootLayout.addCell({
			contents: lightPollutionLabel,
			row: 0, column: 2,
			width: 1.35, height: 0.6,
			alignment: MRE.BoxAlignment.MiddleRight
		});
		rootLayout.addCell({
			contents: this.lightPollutionField.root,
			row: 0, column: 3,
			width: 0.4, height: 0.6,
			alignment: MRE.BoxAlignment.MiddleCenter
		});

		const constellationLabel = MRE.Actor.Create(this.app.context, { actor: {
			name: "ConstellationLabel",
			parentId: this.root.id,
			text: {
				contents: "Constel-\nlations:",
				height: 0.3,
				anchor: MRE.TextAnchorLocation.MiddleRight,
				justify: MRE.TextJustify.Right,
				color: Controls.ControlColor
			}
		}});
		this.constellationLinesField = new StringField(this.app,
			{ options: ["false", "true"], wrap: true },
			{ name: "ConstellationField", parentId: this.root.id });

		rootLayout.addCell({
			contents: constellationLabel,
			row: 0, column: 4,
			width: 1.35, height: 0.6,
			alignment: MRE.BoxAlignment.MiddleRight
		});
		rootLayout.addCell({
			contents: this.constellationLinesField.root,
			row: 0, column: 5,
			width: 0.5, height: 0.6,
			alignment: MRE.BoxAlignment.MiddleCenter
		});

		const showPlanetLabel = MRE.Actor.Create(this.app.context, { actor: {
			name: "PlanetLabelsLabel",
			parentId: this.root.id,
			text: {
				contents: "Planet\nLabels:",
				height: 0.3,
				anchor: MRE.TextAnchorLocation.MiddleRight,
				justify: MRE.TextJustify.Right,
				color: Controls.ControlColor
			}
		}});
		this.planetLabelsField = new StringField(this.app,
			{ options: ["false", "true"], wrap: true },
			{ name: "PlanetLabels", parentId: this.root.id });

		rootLayout.addCell({
			contents: showPlanetLabel,
			row: 1, column: 2,
			width: 1, height: 0.6,
			alignment: MRE.BoxAlignment.MiddleRight
		});
		rootLayout.addCell({
			contents: this.planetLabelsField.root,
			row: 1, column: 3,
			width: 0.5, height: 0.6,
			alignment: MRE.BoxAlignment.MiddleCenter
		});

		const showStarLabels = MRE.Actor.Create(this.app.context, { actor: {
			name: "StarLabelsLabel",
			parentId: this.root.id,
			text: {
				contents: "Star\nLabels:",
				height: 0.3,
				anchor: MRE.TextAnchorLocation.MiddleRight,
				justify: MRE.TextJustify.Right,
				color: Controls.ControlColor
			}
		}});
		this.starLabelsField = new StringField(this.app,
			{ options: ["false", "true"], wrap: true },
			{ name: "StarLabels", parentId: this.root.id });

		rootLayout.addCell({
			contents: showStarLabels,
			row: 1, column: 4,
			width: 1.1, height: 0.6,
			alignment: MRE.BoxAlignment.MiddleRight
		});
		rootLayout.addCell({
			contents: this.starLabelsField.root,
			row: 1, column: 5,
			width: 0.5, height: 0.6,
			alignment: MRE.BoxAlignment.MiddleCenter
		});
	}
}
