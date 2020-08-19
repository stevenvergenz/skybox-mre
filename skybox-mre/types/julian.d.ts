declare function julian(date: Date): string;

declare module 'julian' {
	export = julian;
	function toJulianDay(date: Date): number;
	function toMillisecondsInJulianDay(date: Date): number;
}
