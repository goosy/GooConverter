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
    parseToDOM
} from "./gooparse.js";

/**
 * 
 * @param {Object} tags 
 * @param {string} template 
 */
export function convert(tags, template) {
    return convert_dom(tags, parseToDOM(template));
}
/**
 * @param {Entry} entry 
 * @param {string | null} output output file pathname, or a null for output no file but only return a array of string. 
 * @return {Promise<string[]>} 
 */
export async function convert2file(entry, output) {
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
        let content = convert(rule.tags, template);
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
 * @param {Goonode} dom 
 */
function convert_dom(tags, dom) {
    let content = '';
    dom.contents.forEach(node => {
        if (node.type == "raw") content += node.text;
        if (node.type == "express") {
            let express = node.text;
            content += eval(replace_vars(tags, express));
        }
        if(node.type == "ifs"){
            let truenode = node.contents.find( node => {
                if (node.type == "if" || node.type == "elseif") { // node.text 转换求值后，决定是否呈现 if body
                    return eval(replace_vars(tags, node.text));
                }
                if (node.type == "else") return true;
                return false;
            });
            if (truenode) content += convert_dom(tags, truenode);
        }
        if (node.type == "for") {
            let [new_var, list] = node.text.split(/\s+in\s+/);
            if (/\s/.test(new_var) || !list) throw Error("wrong for statement!");
            let express = replace_vars(tags, list);
            for (let item of eval(express)) {
                content += convert_dom({
                    ...tags,
                    [new_var]: item
                }, node);
            }
        }
    })
    return content;
}
