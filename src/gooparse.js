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
 * 分析precode, 归类为 if endif for endfor raw 五类的一个
 * @param {string} precode 
 * @return {Goonode}
 */
function parse_code(precode) { 
    let contents = [];

    // meet {{#if express }}
    let match = /^\s*#if\s+([\s\S]*)$/.exec(precode);
    if (match) {
        return {
            "type": "ifs",
            "text": "queue of if",
            "contents": [ // must be [ if, elseif... elseif, else]
                {
                    "type": "if",
                    "text": match[1].replace(/[\r\n]+/g, '').trim(),
                    contents
                },
            ]
        }
    }

    // meet {{#elseif express }}
    match = /^\s*#elseif\s+([\s\S]*)$/.exec(precode);
    if (match) {
        return {
            "type": "elseif",
            "text": match[1].replace(/[\r\n]+/g, '').trim(),
            contents
        }
    }

    // meet {{#else }}
    match = /^\s*#else\s*$/.exec(precode);
    if (match) {
        return {
            "type": "else",
            "text": "else output",
            contents
        }
    }

    // meet {{#endif}}
    match = /^\s*#endif\s*$/.exec(precode);
    if (match) {
        return {
            "type": "endif",
        }
    }

    // meet {{#for express}}
    match = /^\s*#for\s+([\s\S]*)$/.exec(precode);
    if (match) {
        return {
            "type": "for",
            "text": match[1].replace(/[\r\n]+/g, '').trim(),
            contents
        }
    }

    // meet {{#endfor}}
    match = /^\s*#endfor\s*$/.exec(precode);
    if (match) {
        return {
            "type": "endfor"
        }
    }

    // meet {{express}}
    return {
        "type": "express",
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
    if (code.type == "express" || code.type == "raw") {
        // *node[...]
        current_node.contents.push(code); // *node[...*express|raw[] ]
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

    // should current_node == document

    return document;
}