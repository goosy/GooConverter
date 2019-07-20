/**
 * @file 拆分模板为语法树
 * @author 'goosy.jo@gmail.com'
 */

/**
 * @typedef {{type:string, text:string, children:Goonode[]}} Goonode
 */
/**
 * 分析precode, 归类为 if endif for endfor raw 五类的一个
 * @param {string} precode 
 * @return {Goonode}
 */
function parse_code(precode) {
    let children = [];
    let match = /^\s*#if\s+([\s\S]*)$/.exec(precode);
    if (match) {
        return {
            "type": "if",
            "text": match[1].replace(/[\r\n]+/g, '').trim(),
            children
        }
    }
    match = /^\s*#endif\s*$/.exec(precode);
    if (match) {
        return {
            "type": "endif",
            "text": '',
            children
        }
    }
    match = /^\s*#for\s+([\s\S]*)$/.exec(precode);
    if (match) {
        return {
            "type": "for",
            "text": match[1].replace(/[\r\n]+/g, '').trim(),
            children
        }
    }
    match = /^\s*#endfor\s*$/.exec(precode);
    if (match) {
        return {
            "type": "endfor",
            "text": '',
            children
        }
    }
    return {
        "type": "express",
        "text": precode,
        children
    }
}


/**
 * 
 * @param {string} template 
 */
export function parseToDOM(template) {
    /**
     * @type {Goonode[]} process_queue
     * @type {Goonode[]} current_queue
     */
    let process_queue, current_queue;
    current_queue = process_queue = [];
    let statement_stack = [];

    /**
     * 
     * @param {Goonode} code 
     */
    function push_code(code) {
        if (code.type == "for" || code.type == "if") {
            current_queue.push(code);
            statement_stack.push(code.type);
            code.children.parents_queue = current_queue;
            current_queue = code.children;
            return;
        }
        if (code.type == "endfor" || code.type == "endif") {
            let type = statement_stack.pop();
            if (code.type != `end${type}`) throw Error("wrong pair!");
            current_queue = current_queue.parents_queue;
            return;
        }
        current_queue.push(code);
    }

    let reg_left = /\{\{/g; // 寻找 '{{' 
    let reg_right = /\}\}/g; // 寻找 '{{' 
    let current_index = 0;

    // 寻找{{.*}}直至完成。当正则式搜索不到匹配时，lastIndex会重新变成0
    // eslint-disable-next-line no-constant-condition
    while (true) {
        let match = reg_left.exec(template);
        if (!match) break;
        if (reg_left.lastIndex < current_index) throw Error("tags mark wrong!");
        push_code({
            "type": 'raw',
            "text": template.substring(current_index, match.index),
            "children": []
        });
        current_index = reg_left.lastIndex;

        match = reg_right.exec(template);
        if (reg_right.lastIndex < current_index) throw Error("tags mark wrong!");
        push_code(parse_code(template.substring(current_index, match.index)));
        current_index = reg_right.lastIndex;
    }

    if (template.length > current_index) current_queue.push({
        "type": "raw",
        "text": template.substring(current_index, template.length),
        "children": []
    });
    
    return process_queue;
}