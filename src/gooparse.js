/**
 * @file 解析模板为语法树
 * @author goosy<'goosy.jo@gmail.com'>
 */

/**
 * @typedef {{type:string, text:string, expression:{} contents:Goonode[]}} Goonode
 */

import { parse } from 'acorn';

function isLimitedExpression(es_expression) {
    let {
        type,
        operator
    } = es_expression;
    // 仅支持以下表达式和列出的操作符
    // 为安全性不会支持函数表达式
    // @todo add ?? ?. ?: operater
    if (
        ['Identifier', 'Literal'].includes(type)
    ) return true;
    if (
        type == 'AssignmentExpression' &&
        ['=', '+=', '-=', '*=', '**=', '/=', '%=', '??='].includes(operator) &&
        es_expression.left.type == "Identifier" &&
        isLimitedExpression(es_expression.right)
    ) return true;
    if (
        type == 'UnaryExpression' &&
        ['+', '-', '~', '!'].includes(operator) &&
        isLimitedExpression(es_expression.argument)
    ) return true;
    if (
        type == 'BinaryExpression' &&
        ['in', '+', '-', '*', '/', '%', '==', '===', '!=', '!==', '<', '>', '<=', '>='].includes(operator) &&
        isLimitedExpression(es_expression.left) &&
        isLimitedExpression(es_expression.right)
    ) return true;
    if (
        type == 'ArrayExpression' &&
        !es_expression.elements.find(e => !isLimitedExpression(e))
    ) return true;
    if (
        type == "ChainExpression" &&
        isLimitedExpression(es_expression.expression)
    ) return true;
    if (
        type == "MemberExpression" &&
        isLimitedExpression(es_expression.object) &&
        isLimitedExpression(es_expression.property)
    ) return true;
    if (
        type == 'SequenceExpression' &&
        !es_expression.expressions.find(e => !isLimitedExpression(e))
    ) return true;
    if (
        type == 'LogicalExpression' &&
        (operator == '||' || operator == '&&' || operator == '??') &&
        isLimitedExpression(es_expression.left) &&
        isLimitedExpression(es_expression.right)
    ) return true;
    if ( // 三目运算符 ? :
        type == "ConditionalExpression" &&
        isLimitedExpression(es_expression.test) &&
        isLimitedExpression(es_expression.consequent) &&
        isLimitedExpression(es_expression.alternate)) return true;
    if (
        type == "CallExpression" &&
        ['Identifier', 'MemberExpression'].includes(es_expression.callee.type) &&
        isLimitedExpression(es_expression.callee) &&
        es_expression.arguments.every(argu => isLimitedExpression(argu))
    ) return true;
    return false;
}

/**
 * 
 * @param {string} code 
 * @return 
 */
function parse_es_expression(code) {
    let error = Error("expression syntax error");
    if (typeof code != 'string') throw error;
    let ast = parse(code, { ecmaVersion: 2020 });
    if (ast.type != "Program" || ast.body.length != 1) throw error;
    if (ast.body[0].type != 'ExpressionStatement') throw error;
    let es_expression = ast.body[0].expression;
    if (!isLimitedExpression(es_expression)) throw error;
    return es_expression;
}

/**
 * 
 * @param {string} code 
 */
function parse_esforloop_expression(code) {
    let error = Error("#for expression syntax error");
    let expression = parse_es_expression(code)
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
 * 分析GTCode, 归类为 if endif for endfor raw let comment 几种Goonode的一个
 * @param {string} GTCode 
 * @return {Goonode}
 */
function GTCode2Goonode(GTCode) {
    let contents = [];

    // meet {{#if expression }}
    if (GTCode.startsWith('#if')) {
        let error = Error("#if expression syntax error!");
        let text = GTCode.replace(/^#if\s+/, '');
        if (text == GTCode) throw error;
        let expression = parse_es_expression(text);
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
    if (GTCode.startsWith('#elseif')) {
        let error = Error("#elseif expression syntax error!");
        let text = GTCode.replace(/^#elseif\s+/, '');
        if (text == GTCode) throw error;
        expression = parse_es_expression(text);
        if (!expression) throw error;
        return {
            "type": "elseif",
            expression,
            contents
        }
    }

    // meet {{#else }}
    if (GTCode.startsWith('#else')) {
        let text = GTCode.substring(5);
        if (!/^(\s|$)/.test(text)) throw Error("#esle must be followed a space or nothing!");
        let comment = text.trim();
        return {
            "type": "else",
            "text": comment,
            contents
        }
    }

    // meet {{#endif}}
    if (GTCode.startsWith('#endif')) {
        let text = GTCode.substring(6);
        if (!/^(\s|$)/.test(text)) throw Error("#endif must be followed a space or nothing!");
        let comment = text.trim();
        return {
            "type": "endif",
            "text": comment,
        }
    }

    // meet {{#for expression}}
    if (GTCode.startsWith('#for')) {
        let error = Error("#for expression syntax error!");
        let text = GTCode.replace(/^#for\s+/, '');
        if (text == GTCode) throw error;
        let expression = parse_esforloop_expression(text);
        return {
            "type": "for",
            "text": "for statement",
            expression,
            contents
        }
    }

    // meet {{#endfor}}
    if (GTCode.startsWith('#endfor')) {
        let text = GTCode.substring(7);
        if (!/^(\s|$)/.test(text)) throw Error("#endfor must be followed a space or nothing!");
        let comment = text.trim();
        return {
            "type": "endfor",
            "text": comment,
        }
    }

    // meet {{#}}
    if (GTCode.startsWith('#')) {
        return {
            "type": "comment",
            "text": GTCode.substring(1).trim(),
        }
    }

    // meet {{expression}}
    let error = Error("expression syntax error!");
    let expression = parse_es_expression(GTCode);
    if (!expression) throw error;
    return {
        "type": "expression",
        "text": "expression",
        expression,
        contents
    }
}

function stack_push(code) {
    current_node.contents.push(code);
    code.parents = current_node;
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

function GT_tree_append(code) {

    // gen ifs[] if[]
    if (code.type == "ifs") {
        // 当前节点 ►node[...]◄ 

        stack_push(code); // 当前节点 node[... ifs[►if[]◄] ]
        return;
    }

    // gen elseif[]
    if (code.type == "elseif" || code.type == "else") {
        // 当前节点 ifs[...►(if|elseif)[...]◄ ]

        // 不能和上一个 {{#if}} 或 {{#elseif}} 匹配，报错
        let type = current_node.type;
        if (type != "if" && type != "elseif") throw Error("wrong pair of IF!");

        // 出栈
        stack_pop(); // 当前节点 ►ifs[...(if|elseif)[...]]◄

        // 重新入栈
        stack_push(code); // 当前节点 ifs[...if|elseif[...], ►elseif|else[]◄ ]

        return;
    }

    // endif
    if (code.type == "endif") {
        // 当前节点 node[...ifs[...►(if|elseif|else)[...]◄]]

        // 不能和上一个 {{#if}} 或 {{#elseif}} 或 {{#else}} 匹配，报错
        let type = current_node.type;
        if (type != "if" && type != "elseif" && type != "else") throw Error("wrong pair of IF!");

        // 出栈，如不在 ifs 队列中，报错
        stack_pop(); // 当前节点 node[...►ifs[...if|elseif|else[...]]◄]
        if (current_node.type != "ifs") throw Error("wrong pair of IF!");

        // 再次出栈
        stack_pop(); // 当前节点 ►node[...ifs[...if|elseif|else[...]]]◄
        return;
    }

    // for[]
    if (code.type == "for") {
        // ►node[...]◄
        stack_push(code); // 当前节点 node[...►for[]◄]
        return;
    }

    // endfor
    if (code.type == "endfor") {
        // 当前节点 node[...►for[...]◄]
        if (current_node.type != "for") throw Error("wrong pair of FOR!");
        stack_pop(); // 当前节点 ►node[...for[...]]◄
        return;
    }

    // expression|raw[]
    if (code.type == "expression" || code.type == "raw") {
        // 当前节点 ►node[...]◄
        current_node.contents.push(code); // 仅附加内容，当前节点不变 ►node[...(expression|raw)[] ]◄
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
    function throw_wrong_pair(range) {
        throw SyntaxError(`wrong pair of replacement标记不配对！
position 位置: ${range[0]}:${range[1]}
content 内容: ${template.substring(...range)}`);
    }

    // init document
    current_node = document = {
        type: "root",
        text: "",
        contents: []
    };
    let reg_left = /\{\{/g; // 寻找 '{{' 
    let reg_right = /\}\}(_\r?\n)*/g; // 寻找 '}}_\n' 或 '}}'
    let current_index = 0;
    let last_range = [0, 0];
    let match;

    // 寻找{{.*}}直至完成。当正则式搜索不到匹配时，lastIndex会重新变成0
    // eslint-disable-next-line no-constant-condition
    while (match = reg_left.exec(template), match) {
        const range_left = match.index;
        const content_left = reg_left.lastIndex;
        if (range_left < current_index) throw_wrong_pair(last_range);
        const raw_range = [current_index, range_left];
        const raw_node = {
            type: 'raw',
            text: template.substring(...raw_range),
            contents: [],
            range: [raw_range[0], ...raw_range, raw_range[1]],
        }
        GT_tree_append(raw_node);

        match = reg_right.exec(template);
        if (!match) throw_wrong_pair([range_left, template.length]);
        const content_right = match.index;
        const range_right = reg_right.lastIndex;
        if (content_right < content_left) throw_wrong_pair(raw_range);
        // `{{ }}` 视为 `{{""}}`
        const gtcode = template.substring(content_left, content_right).trim() || '""';
        const goonode = GTCode2Goonode(gtcode);
        goonode.range = [range_left, content_left, content_right, range_right];
        GT_tree_append(goonode);
        current_index = range_right;
        last_range = [range_left, range_right];
    }
    match = reg_right.exec(template);
    if (match) throw_wrong_pair([current_index, reg_right.lastIndex]);

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