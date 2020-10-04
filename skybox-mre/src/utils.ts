export function pad(value: number, digits: number) {
	const sign = value < 0 ? "-" : "";
	let str = Math.round(Math.abs(value)).toString(10);
	while (str.length < digits) {
		str = '0' + str;
	}
	return sign + str;
}
