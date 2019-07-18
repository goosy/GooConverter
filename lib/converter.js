/**
 * @file 实现基于转换规则和模板转换
 * @author goosy.jo@gmail.com
 */
import { promises as fs } from "fs";
import { join } from "path";

/**
 * @typedef {{rules:Object[], template:string}} Entry rules：转换规则 template：带指令的模板
 * @param {Entry} entry 
 * @param {string | null} output output file pathname, or a null for output no file but only return a array of string. 
 */
export async function converter(entry, output) {
    let savetofile = !!output;
    let resultList = [];
    let rules = entry.rules;
    let template = entry.template;
    for(let rule of rules){ // for-of 实现异步顺序执行
        let tags = rule.tags;
        let content = template;
        let output_file;
        if (savetofile) output_file = join(output, `./${rule.output_file}`);
        let option = {
            "encoding":"utf8",
            "append": 'w',
            ...rule.option,
        };
        content = content.replace(/\{\{(.*)?\}\}/g, (_, express)=>{
            for(let key in tags){
                let reg = new RegExp(`(?=\\W|^)${key}(?=\\W|$)`, 'g')
                express = express.replace(reg,`tags["${key}"]`); 
            }
            return eval(express);
        }); 
        resultList.push(content);
        if (savetofile) await fs.writeFile(output_file, content, option);
    }
    return resultList;
}

export function numberBytes(num){
    let numstr = num.toString(16);
    let result = [];
    while (numstr.length>2) {
        result.push(numstr.slice(-2));
        numstr = numstr.slice(0, -2);
    }
    if (numstr.length>0) result.push(numstr);
    return result;
}