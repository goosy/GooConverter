import { promises as fs } from "fs";
import { join } from "path";

export async function converter(rules, template, dir = '.'){
	for(let rule of rules){ // for-of 实现异步顺序执行
		let vars = rule.vars;
		let content = template;
		let outfile = join(dir, `./${rule.outfile}`);
		let option = {"encoding":"utf8"};
		option.flag = rule.append ? 'a' : 'w';
		content = content.replace(/\{\{(.*)?\}\}/g, (_, express)=>{
			for(let key in vars){
				let reg = new RegExp(`(?=\\W|^)${key}(?=\\W|$)`, 'g')
				express = express.replace(reg,`vars["${key}"]`); 
			}
			return eval(express);
		}); 
		await fs.writeFile(outfile, content, option);
	}
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