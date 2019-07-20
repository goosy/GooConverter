import {
    parseToDOM
} from "./gooparse.js";

import {
    convert,
    convert2file
} from "./converter.js";

function numberBytes(num) {
    let numstr = num.toString(16);
    let result = [];
    while (numstr.length > 2) {
        result.push(numstr.slice(-2));
        numstr = numstr.slice(0, -2);
    }
    if (numstr.length > 0) result.push(numstr);
    return result;
}

export {
    parseToDOM,
    convert,
    convert2file,
    numberBytes
}