/**
 * @file 解析模板为语法树
 * @author goosy<'goosy.jo@gmail.com'>
 */

/**
 * @typedef {{type:string, text:string, expression:{} contents:Goonode[]}} Goonode
 */

import esprima from "esprima";

function isLimitedExpression(expression){
    let {
        type,
        operator
    } = expression;
    // 仅支持以下表达式和列出的操作符
    if (
         ['Identifier', 'Literal'].includes(type)
    ) return true;
    if (
        type == 'AssignmentExpression' &&
        ['=', '+=', '-=', '*=', '**=', '/=', '%='].includes(operator) &&
        expression.left.type == "Identifier" &&
        isLimitedExpression(expression.right) 
    ) return true;
    if (
        type == 'UnaryExpression' && 
        ['+', '-', '~', '!'].includes(operator) &&
        isLimitedExpression(expression.argument)
    ) return true;
    if (
        type == 'BinaryExpression' && 
        ['in', '+', '-', '*', '/', '%', '==', '!=', '<', '>', '<=', '>='].includes(operator) &&
        isLimitedExpression(expression.left) &&
        isLimitedExpression(expression.right) 
    ) return true;
    if(
        type == 'ArrayExpression' &&
        !expression.elements.find(e => !isLimitedExpression(e))
    ) return true;
    if (
        type == "MemberExpression" &&
        isLimitedExpression(expression.object) &&
        isLimitedExpression(expression.property)
    ) return true;
    if (
        type == 'SequenceExpression' &&
        !expression.expressions.find(e => !isLimitedExpression(e))
    ) return true;
    if (
        type == 'LogicalExpression' &&
        (operator == '||' || operator == '&&') &&
        isLimitedExpression(expression.left) &&
        isLimitedExpression(expression.right) 
    ) return true;
    return false;
}

/**
 * 
 * @param {string} code 
 */
function parse_expression(code) {
    let error = Error("expression syntax error");
    if (typeof code != 'string') throw error;
    let ast = esprima.parseScript(code);
    if (ast.type != "Program" || ast.body.length != 1) throw error;
    if (ast.body[0].type != 'ExpressionStatement') throw error;
    let expression = ast.body[0].expression;
    if (!isLimitedExpression(expression)) throw error;
    return expression;
}

/**
 * 
 * @param {string} code 
 */
function parse_forloop_expression(code){
    let error = Error("#for expression syntax error");
    let expression = parse_expression(code)
    if (expression.type == 'BinaryExpression') return expression;
    let expressions = expression.expressions;
    if (!expressions) throw error;
    if (expressions.length != 2) throw error;
    if (expressions[0].type != 'Identifier') throw error;
    if (expressions[1].type != 'BinaryExpression') throw error;
    if (expressions[1].left.type != 'Identifier') throw error;
    if (expressions[1].operator != 'in') throw error;

    expression = expressions[1];
    expression.left = [expressions[0], expression.left];
    expression.left.type = 'ArrayExpression';
    return expression;
}

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
    let contents = [];

    // meet {{#if expression }}
    if (precode.startsWith('#if')) {
        let error = Error("#if expression syntax error!");
        let text = precode.replace(/^#if\s+/, '');
        if (text == precode) throw error;
        let expression = parse_expression(text);
        if (!expression) throw error;
        return {
            "type": "ifs",
            "text": "queue of if",
            "contents": [ // must be [ if, elseif... elseif, else]
                {
                    "type": "if",
                    expression,
                    contents
                },
            ]
        }
    }

    // meet {{#elseif expression }}
    if (precode.startsWith('#elseif')) {
        let error = Error("#elseif expression syntax error!");
        let text = precode.replace(/^#elseif\s+/, '');
        if (text == precode) throw error;
        expression = parse_expression(text);
        if (!expression) throw error;
        return {
            "type": "elseif",
            expression,
            contents
        }
    }

    // meet {{#else }}
    if (precode.startsWith('#else')) {
        let text = precode.substr(5);
        if (!/^(\s|$)/.test(text)) throw Error("#esle must be followed a space or nothing!");
        let comment = text.trim();
        return {
            "type": "else",
            "text": comment,
            contents
        }
    }

    // meet {{#endif}}
    if (precode.startsWith('#endif')) {
        let text = precode.substr(6);
        if (!/^(\s|$)/.test(text)) throw Error("#endif must be followed a space or nothing!");
        let comment = text.trim();
        return {
            "type": "endif",
            "text": comment,
        }
    }

    // meet {{#for expression}}
    if (precode.startsWith('#for')) {
        let error = Error("#for expression syntax error!");
        let text = precode.replace(/^#for\s+/, '');
        if (text == precode) throw error;
        let expression = parse_forloop_expression(text);
        return {
            "type": "for",
            "text": "for statement",
            expression,
            contents
        }
    }

    // meet {{#endfor}}
    if (precode.startsWith('#endfor')) {
        let text = precode.substr(7);
        if (!/^(\s|$)/.test(text)) throw Error("#endfor must be followed a space or nothing!");
        let comment = text.trim();
        return {
            "type": "endfor",
            "text": comment,
        }
    }

    // meet {{#}}
    if (precode.startsWith('#')) {
        return {
            "type": "comment",
            "text": precode.substr(1).trim(),
        }
    }

    // meet {{expression}}
    let error = Error("expression syntax error!");
    let expression = parse_expression(precode);
    if (!expression) throw error;
    return {
        "type": "expression",
        "text": "expression",
        expression,
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

    // ifs[if[]]
    if (code.type == "ifs") {
        // *node[...]*
        stack_push(code); // node[... ifs[*if[]* ] ]
        return;
    }

    // if|elseif[]
    if (code.type == "elseif" || code.type == "else") {

        // 不能和上一个 {{#if}} 或 {{#elseif}} 匹配，报错
        // ifs[...*if|elseif[...]]
        let type = current_node.type;
        if (type != "if" && type != "elseif") throw Error("wrong pair of IF!");

        // 出栈
        stack_pop(); // *ifs[...if|elseif[...]]

        // 重新入栈
        stack_push(code); // ifs[...if|elseif[...], *elseif|else[] ] 

        return;
    }

    // endif
    if (code.type == "endif") {

        // 不能和上一个 {{#if}} 或 {{#elseif}} 或 {{#else}} 匹配，报错
        // node[...ifs[...*if|elseif|else[...]*]]
        let type = current_node.type;
        if (type != "if" && type != "elseif" && type != "else") throw Error("wrong pair of IF!");

        // 出栈，如不在 ifs 队列中，报错
        stack_pop(); // node[...*ifs[...if|elseif|else[...]]*]
        if (current_node.type != "ifs") throw Error("wrong pair of IF!");

        // 再次出栈
        stack_pop(); // *node[...ifs[...if|elseif|else[...]]]*
        return;
    }

    // for[]
    if (code.type == "for") {
        // *node[...]*
        stack_push(code); // node[...*for[]*]
        return;
    }

    // endfor
    if (code.type == "endfor") {
        // node[...*for[...]*]
        if (current_node.type != "for") throw Error("wrong pair of FOR!");
        stack_pop(); // *node[...for[...]]*
        return;
    }

    // expression|raw[]
    if (code.type == "expression" || code.type == "raw") {
        // *node[...]*
        current_node.contents.push(code); // *node[...*expression|raw[]* ]
        return;
    }

    // #
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
        type: "root",
        text: "",
        contents: []
    };
    let reg_left = /\{\{\s*/g; // 寻找 '{{' 
    let reg_right = /\s*\}\}/g; // 寻找 '}}' 
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