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

function compute_expression(tags, expression) {
    // todo parse token include ""''
    for (let key in tags) {
        let reg = new RegExp(`\\b${key}\\b`, 'g');
        expression = expression.replace(reg, `tags["${key}"]`);
    }
    return eval(expression);
}

function do_for_expression(tags, node) {
    let [varstr, expression] = node.text.split(/\s+in\s+/);
    if (!expression) throw Error("wrong #for statement!");
    let varlist = varstr.split(",").map(str => str.trim());
    if (varlist.length > 2) throw Error('too many amount of comma in "#for key, value in expression"');
    expression = compute_expression(tags, expression);
    if (!expression) throw Error('wrong expression in "#for key, value in expression"');
    let [key, value] = varlist;
    let content = "";
    if(!value) {
        for (const item of expression) {
            content += convert_dom({
                ...tags,
                [key]: item
            }, node);
        }
    } else {
        for (const index in expression) {
            content += convert_dom({
                ...tags,
                [key]: index,
                [value]: expression[index]
            }, node);
        }
    }
    return content;
}

/**
 * 
 * @param {Object} tags 
 * @param {Goonode} dom 
 */
function convert_dom(tags, dom) {
    let content = '';
    dom.contents.forEach(node => {
        if (node.type == 'variable_declaration') {
            let index = node.text.indexOf('=');
            tags[node.text.substring(0, index)] = compute_expression(tags, node.text.substring(index+1));
            return;
        }
        if (node.type == "raw") {
            content += node.text;
            return;
        }
        if (node.type == "expression") {
            content += compute_expression(tags, node.text);
            return;
        }
        if(node.type == "ifs"){
            let truenode = node.contents.find( node => {
                if (node.type == "if" || node.type == "elseif") { // node.text 转换求值后，决定是否呈现 if body
                    return compute_expression(tags, node.text);
                }
                if (node.type == "else") return true;
                return false;
            });
            if (truenode) content += convert_dom({...tags}, truenode);
            return;
        }
        if (node.type == "for") {
            content += do_for_expression(tags, node);
            return;
        }
    })
    return content;
}
