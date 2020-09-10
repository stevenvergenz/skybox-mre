import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import App from './app';
import { Location } from './stellarium';
import { Field } from './field';

export default class Controls {
	public static ControlColor: MRE.Color3Like = { r: 0.5, g: 0, b: 0 };

	private latMagField: Field;
	private latDirField: Field;
	private longMagField: Field;
	private longDirField: Field;
	private altitudeField: Field;

	private yearField: Field;
	private monthField: Field;
	private dayField: Field;
	private hourField: Field;
	private tzField: Field;

	private _root: MRE.Actor;
	public get root() { return this._root; }

	public get location() {
		return {
			latitude: this.latMagField.numberValue * (this.latDirField.stringValue === "N" ? 1 : -1),
			longitude: this.longMagField.numberValue * (this.longDirField.stringValue === "E" ? 1 : -1),
			altitude: this.altitudeField.numberValue
		} as Location;
	}

	public get time() {
		return new Date();
	}

	public constructor(private app: App, actorInit: Partial<MRE.ActorLike>) {
		this._root = MRE.Actor.Create(this.app.context, { actor: {
			name: "Controls",
			...actorInit
		}});

		// generate location label
		const locationLabel = MRE.Actor.Create(this.app.context, { actor: {
			name: "LocationLabel",
			parentId: this.root.id,
			text: {
				contents: "Location:",
				height: 0.4,
				anchor: MRE.TextAnchorLocation.BottomLeft,
				color: Controls.ControlColor
			}
		}});

		// generate location fields
		this.latMagField = new Field(this.app,
			{ type: "number", maxValue: 90, initialValue: 45, incrementStep: 5, decrementStep: 5, suffix: "\u00b0" },
			{ name: "LatitudeMagnitude", parentId: this.root.id });
		this.latDirField = new Field(this.app,
			{ type: "string", options: ["N", "S"], initialValue: 0, suffix: ",", wrap: true },
			{ name: "LatitudeDirection", parentId: this.root.id });

		this.longMagField = new Field(this.app,
			{ type: "number", maxValue: 180, initialValue: 90, incrementStep: 5, decrementStep: 5, suffix: "\u00b0"},
			{ name: "LongitudeMagnitude", parentId: this.root.id });
		this.longDirField = new Field(this.app,
			{ type: "string", options: ["W", "E"], initialValue: 0, suffix: ",", wrap: true },
			{ name: "LongitudeDirection", parentId: this.root.id });

		this.altitudeField = new Field(this.app,
			{ type: "number", maxValue: 1000, initialValue: 20, incrementStep: 5, decrementStep: 5, suffix: "m" },
			{ name: "Altitude", parentId: this.root.id });

		// generate time label
		const timeLabel = MRE.Actor.Create(this.app.context, { actor: {
			name: "TimeLabel",
			parentId: this.root.id,
			text: {
				contents: "Date/Time:",
				height: 0.4,
				anchor: MRE.TextAnchorLocation.BottomLeft,
				color: Controls.ControlColor
			}
		}});

		// generate time fields
		const curTime = new Date();
		this.yearField = new Field(this.app,
			{ type: "number", maxValue: 4000, initialValue: curTime.getUTCFullYear(), digits: 4, suffix: "-" },
			{ name: "Year", parentId: this.root.id });
		this.monthField = new Field(this.app,
			{ type: "number", maxValue: 12, initialValue: curTime.getUTCMonth(), digits: 2, suffix: "-"},
			{ name: "Month", parentId: this.root.id });
		this.dayField = new Field(this.app,
			{ type: "number", maxValue: 31, initialValue: curTime.getUTCDay(), digits: 2 },
			{ name: "Day", parentId: this.root.id });
		this.hourField = new Field(this.app,
			{ type: "number", maxValue: 23, initialValue: curTime.getUTCHours(), digits: 2, suffix: ":00"},
			{ name: "Time", parentId: this.root.id });
		this.tzField = new Field(this.app,
			{ type: "number", minValue: -1200, maxValue: 1200, initialValue: 0, incrementStep: 100, decrementStep: 100, digits: 4, forceSign: true },
			{ name: "Timezone", parentId: this.root.id });

		// create a new layout
		const layout = new MRE.PlanarGridLayout(this.root,
			MRE.BoxAlignment.MiddleCenter, MRE.BoxAlignment.MiddleCenter);

		// lay out the location fields
		layout.addCell({
			contents: locationLabel,
			row: 0, column: 0,
			width: 0, height: 0,
			alignment: MRE.BoxAlignment.BottomLeft
		});

		layout.addCell({
			contents: this.latMagField.root,
			row: 1, column: 0,
			width: 0.4, height: 0.6
		});
		layout.addCell({
			contents: this.latDirField.root,
			row: 1, column: 1,
			width: 0.3, height: 0.6
		});

		layout.addCell({
			contents: this.longMagField.root,
			row: 1, column: 2,
			width: 0.4, height: 0.6
		});
		layout.addCell({
			contents: this.longDirField.root,
			row: 1, column: 3,
			width: 0.3, height: 0.6
		});

		layout.addCell({
			contents: this.altitudeField.root,
			row: 1, column: 4,
			width: 0.5, height: 0.6
		});

		layout.applyLayout();
	}
}
