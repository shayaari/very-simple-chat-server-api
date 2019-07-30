/**
 * some useful functions
 */

const hashCode = string => {
	let outputKey = '';
	for (let i = 0; i < string.length; i++) {
		outputKey += string[i].charCodeAt(0);
	}
	return outputKey;
}


export default {
	hashCode
}