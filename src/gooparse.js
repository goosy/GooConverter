/**
 * @file 拆分模板为语法树
 * @author 'goosy.jo@gmail.com'
 */

/**
 * @typedef {{type:string, text:string, contents:Goonode[]}} Goonode
 */

/**
 * @type {Goonode} document
 */
let document;
/**
 * @type {Goonode} current_node
 */
let current_node;

/**
 * 分析precode, 归类为 if endif for endfor raw let comment  的一个
 * @param {string} precode 
 * @return {Goonode}
 */
function parse_code(precode) { 
    let contents = [],
        text;

    // meet {{#if expression }}
    text = precode.replace(/^\s*#if/,'');
    if(text != precode){
        let condition = /\s+([\s\S]*)$/.exec(text)[1].replace(/[\r\n]+/g, '').trim();
        if (!condition) throw Error("#if must be followed a space and an expression!");
        return {
            "type": "ifs",
            "text": "queue of if",
            "contents": [ // must be [ if, elseif... elseif, else]
                {
                    "type": "if",
                    "text": condition,
                    contents
                },
            ]
        }
    }

    // meet {{#elseif expression }}
    text = precode.replace(/^\s*#elseif/,'');
    if (text != precode) {
        let condition = /\s+([\s\S]*)$/.exec(text)[1].replace(/[\r\n]+/g, '').trim();
        if (!condition) throw Error("#esleif must be followed a space and an expression!");
        return {
            "type": "elseif",
            "text": condition,
            contents
        }
    }

    // meet {{#else }}
    text = precode.replace(/^\s*#else/,'');
    if(text != precode){
        if(!/^(\s|$)/.test(text)) throw Error("#esle must be followed a space or nothing!");
        let comment = text.trim();
        return {
            "type": "else",
            "text": comment,
            contents
        }
    }

    // meet {{#endif}}
    text = precode.replace(/^\s*#endif/,'');
    if (text != precode) {
        if (!/^(\s|$)/.test(text)) throw Error("#endif must be followed a space or nothing!");
        let comment = text.trim();
        return {
            "type": "endif",
            "text": comment,
        }
    }

    // meet {{#for expression}}
    text = precode.replace(/^\s*#for/,'');
    if(text != precode){
        let expression = /\s+([\s\S]*)$/.exec(text)[1].replace(/[\r\n]+/g, '').trim();
        if (!expression) throw Error("#esleif must be followed a space and an expression!");
        return {
            "type": "for",
            "text": expression,
            contents
        }
    }

    // meet {{#endfor}}
    text = precode.replace(/^\s*#endfor/,'');
    if (text != precode) {
        if (!/^(\s|$)/.test(text)) throw Error("#endfor must be followed a space or nothing!");
        let comment = text.trim();
        return {
            "type": "endfor",
            "text": comment,
        }
    }

    // meet {{#let}}
    text = precode.replace(/^\s*#let/,'');
    if(text != precode){
        let match = /\s+(\w+)\s*=\s*([\s\S]+)$/.exec(text);
        let varname = match[1].trim();
        let expression = match[2].replace(/[\r\n]+/g, '').trim();
        if (!varname || !expression) throw Error("#let must be followed a space and an assignment expression!");
        return {
            "type": "variable_declaration",
            "text": `${varname}=${expression}`,
        }
    }

    // meet {{#}}
    text = precode.replace(/^\s*#/,'');
    if(text != precode){
        return {
            "type": "comment",
            "text": text.trim(),
        }
    }

    // meet {{expression}}
    return {
        "type": "expression",
        "text": precode,
        contents
    }
}

function stack_push(code) { 
    code.parents = current_node;
    current_node.contents.push(code);
    current_node = code;
    if (code.type == "ifs") { 
        current_node.contents[0].parents = current_node;
        current_node = current_node.contents[0];
    }
}

function stack_pop() {
    current_node = current_node.parents;
}
/**
 * 
 * @param {Goonode} code 
 */

function gen_tree(code) { 
    if (code.type == "ifs") {
        // *node[...]
        stack_push(code); // node[... ifs[...*if[] ] ]
        return;
    }
    if (code.type == "elseif" || code.type == "else") {
        // ifs[...*if|elseif[...]]
        
        // 不能和上一个 {{#if}} 或 {{#elseif}} 匹配，报错
        let type = current_node.type;
        if (type != "if" && type != "elseif") throw Error("wrong pair of IF!");
        
        // 出栈
        stack_pop(); // *ifs[...if|elseif[...]]
        
        // 重新入栈
        stack_push(code);// ifs[...if|elseif[...], *elseif|else[] ] 
        
        return;
    }
    if (code.type == "endif") {
        // node[...ifs[...*if|elseif|else[...]]]
        
        // 不能和上一个 {{#if}} 或 {{#elseif}} 或 {{#else}} 匹配，报错
        let type = current_node.type;
        if (type != "if" && type != "elseif" && type != "else") throw Error("wrong pair of IF!");
        
        // 出栈，如不在 ifs 队列中，报错
        stack_pop(); // node[...*ifs[...if|elseif|else[...]]]
        if (current_node.type != "ifs") throw Error("wrong pair of IF!");

        // 再次出栈
        stack_pop(); // *node[...ifs[...if|elseif|else[...]]]
        return;
    }
    if (code.type == "for") {
        // *node[...]
        stack_push(code); // node[...*for[]]
        return;
    }

    if (code.type == "endfor") {
        // node[...*for[...]]
        if (current_node.type != "for") throw Error("wrong pair of FOR!");
        stack_pop(); // *node[...for[...]]
        return;
    }
    if (code.type == "expression" || code.type == "raw") {
        // *node[...]
        current_node.contents.push(code); // *node[...*expression|raw[] ]
        return;
    }
    if (code.type == "variable_declaration") {
        current_node.contents.push(code);
        return;
    }
    if (code.type == "comment") {
        return;
    }
    throw Error("wrong node");
}

/**
 * 
 * @param {string} template
 */
export function parseToDOM(template) {

    // init document
    current_node = document = {
        type:"root",
        text: "",
        contents:[]
    };
    let reg_left = /\{\{/g; // 寻找 '{{' 
    let reg_right = /\}\}/g; // 寻找 '{{' 
    let current_index = 0;

    // 寻找{{.*}}直至完成。当正则式搜索不到匹配时，lastIndex会重新变成0
    // eslint-disable-next-line no-constant-condition
    while (true) {
        let match = reg_left.exec(template);
        if (!match) break;
        if (reg_left.lastIndex < current_index) throw Error("tags mark wrong!");
        gen_tree({
            "type": 'raw',
            "text": template.substring(current_index, match.index),
            "contents": []
        });
        current_index = reg_left.lastIndex;

        match = reg_right.exec(template);
        if (reg_right.lastIndex < current_index) throw Error("tags mark wrong!");
        gen_tree(parse_code(template.substring(current_index, match.index)));
        current_index = reg_right.lastIndex;
    }

    if (template.length > current_index) current_node.contents.push({
        "type": "raw",
        "text": template.substring(current_index, template.length),
        "contents": []
    });

    if (current_node != document) {
        throw Error(`${current_node.type} 标记不匹配`);
    }

    return document;
}