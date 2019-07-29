/**
 * @file 拆分模板为语法树
 * @author 'goosy.jo@gmail.com'
 */

/**
 * @typedef {{type:string, text:string, children:Goonode[]}} Goonode
 */

/**
 * @type {Goonode[]} process_queue
 */
let process_queue;
/**
 * @type {Goonode[]} current_queue
 */
let current_queue;

/**
 * 分析precode, 归类为 if endif for endfor raw 五类的一个
 * @param {string} precode 
 * @return {Goonode}
 */
function parse_code(precode) { 
    let children = [];

    // meet {{#if express }}
    let match = /^\s*#if\s+([\s\S]*)$/.exec(precode);
    if (match) {
        return {
            "type": "ifs",
            "text": "queue of if",
            "children": [ // must be [ if, elseif... elseif, else]
                {
                    "type": "if",
                    "text": match[1].replace(/[\r\n]+/g, '').trim(),
                    children
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
            children
        }
    }

    // meet {{#else }}
    match = /^\s*#else\s*$/.exec(precode);
    if (match) {
        return {
            "type": "else",
            "text": "else output",
            children
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
            children
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
        children
    }
}

function stack_push(code) { 
    current_queue.push(code);
    code.children.parents_queue = current_queue;
    current_queue = code.children;
    current_queue.type = code.type;
    if (code.type == "ifs") { 
        current_queue[0].children.parents_queue = current_queue;
        current_queue = current_queue[0].children;
        current_queue.type = "if";
    }
}

function stack_pop() {
    current_queue = current_queue.parents_queue;
}
/**
 * 
 * @param {Goonode} code 
 */

function gen_tree(code) { 
    if (code.type == "ifs") {
        // 【...】
        stack_push(code); // [... ifs[...if【...】]]
        return;
    }
    if (code.type == "elseif" || code.type == "else") {
        // [... ifs[...if|elseif【...】]] 
        
        // 不能和上一个 {{#if}} 或 {{#elseif}} 匹配，报错
        let type = current_queue.type;
        if (type != "if" && type != "elseif") throw Error("wrong pair of IF!");
        
        // 出栈
        stack_pop(); // [... ifs【...if|elseif[...]】]
        
        // 重新入栈
        stack_push(code);// [... ifs[...if|elseif[...], elseif|else【】]] 
        
        return;
    }
    if (code.type == "endif") {
        // [... ifs[...if|elseif|else【...】]] 
        
        // 不能和上一个 {{#if}} 或 {{#elseif}} 或 {{#else}} 匹配，报错
        let type = current_queue.type;
        if (type != "if" && type != "elseif" && type != "else") throw Error("wrong pair of IF!");
        
        // 出栈，如不在 ifs 队列中，报错
        stack_pop(); // [... ifs【...if|elseif|else[...]】]
        if (current_queue.type != "ifs") throw Error("wrong pair of IF!");

        // 再次出栈
        stack_pop(); // 【... ifs[...if|elseif|else[...]]】
        return;
    }
    if (code.type == "for") {
        // 【...】
        stack_push(code); // [... for【...】]
        return;
    }

    if (code.type == "endfor") {
        // [...for【...】]
        if (current_queue.type != "for") throw Error("wrong pair of FOR!");
        stack_pop(); // 【...for[...]】
        return;
    }
    if (code.type == "express" || code.type == "raw") {
        // 【...】
        current_queue.push(code); // 【...express|raw】
        return;
    }
    throw Error("wrong node");
}

/**
 * 
 * @param {string} template 
 */
export function parseToDOM(template) {

    // init process_queue
    current_queue = process_queue = [];
    process_queue.type = "root";
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
            "children": []
        });
        current_index = reg_left.lastIndex;

        match = reg_right.exec(template);
        if (reg_right.lastIndex < current_index) throw Error("tags mark wrong!");
        gen_tree(parse_code(template.substring(current_index, match.index)));
        current_index = reg_right.lastIndex;
    }

    if (template.length > current_index) current_queue.push({
        "type": "raw",
        "text": template.substring(current_index, template.length),
        "children": []
    });

    return process_queue;
}