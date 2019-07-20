/**
 * @file 实现基于转换规则和模板转换
 * @author goosy.jo@gmail.com
 * @typedef {{rules:Rule[], template:string}} Entry rules：转换规则 template：带指令的模板
 * @typedef {{name:string, output_file:string?, tags:Object} Rule 
 */
import {
    promises as fs
} from "fs";
import {
    join
} from "path";
import {
    separate
} from "./separate.js";

/**
 * @param {Entry} entry 
 * @param {string | null} output output file pathname, or a null for output no file but only return a array of string. 
 * @return {Promise<string[]>} 
 */
export async function converter(entry, output) {
    let savetofile = !!output;
    let resultList = [];
    let rules = entry.rules;
    let template = entry.template;
    let output_file;
    for (let rule of rules) { // for-of 实现异步顺序执行
        if (savetofile) output_file = join(output, `./${rule.output_file}`);
        let option = {
            "encoding": "utf8",
            ...rule.option,
        };
        let content = conveter_tags(rule.tags, separate(template));
        resultList.push(content);
        if (savetofile) await fs.writeFile(output_file, content, option);
    }
    return resultList;
}

function replace_vars(tags, express) {
    for (let key in tags) {
        let reg = new RegExp(`(?=\\W|^)${key}(?=\\W|$)`, 'g')
        express = express.replace(reg, `tags["${key}"]`);
    }
    return express;
}
/**
 * 
 * @param {Object} tags 
 * @param {Goonode[]} nodes 
 */
function conveter_tags(tags, nodes) {
    let content = '';
    nodes.forEach(node => {
        if (node.type == "raw") content += node.text;
        if (node.type == "express") {
            let express = node.text;
            content += eval(replace_vars(tags, express));
        }
        if (node.type == "if") { // node.text 转换求值后，决定是否呈现 if body
            let express = replace_vars(tags, node.text);
            if (eval(express)) content += conveter_tags(tags, node.children);
        }
        if (node.type == "for") {
            let [new_var, list] = node.text.split(/\s+in\s+/);
            if (/\s/.test(new_var) || !list) throw Error("wrong for statement!");
            let express = replace_vars(tags, list);
            for (let item of eval(express)) {
                content += convert_dom({
                    ...tags,
                    [new_var]: item
                }, node.children);
            }
        }
    })
    return content;
}

export function numberBytes(num) {
    let numstr = num.toString(16);
    let result = [];
    while (numstr.length > 2) {
        result.push(numstr.slice(-2));
        numstr = numstr.slice(0, -2);
    }
    if (numstr.length > 0) result.push(numstr);
    return result;
}