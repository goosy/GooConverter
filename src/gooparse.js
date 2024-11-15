/**
 * @file 解析模板为语法树
 * @author goosy<'goosy.jo@gmail.com'>
 */

/**
 * @typedef {{type:string, text:string, expression:{} contents:Goonode[]}} Goonode
 */

import { parse } from 'acorn';

function isLimitedExpression(es_expression) {
    const {
        type,
        operator
    } = es_expression;
    // 仅支持以下表达式和列出的操作符
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
        isLimitedExpression(es_expression.alternate)
    ) return true;
    function is_spread_element(expr) { // 扩展运算符
        return expr.type == "SpreadElement" && isLimitedExpression(expr.argument);
    }
    if ( // call 运算符
        type == "CallExpression" &&
        ['Identifier', 'MemberExpression'].includes(es_expression.callee.type) &&
        isLimitedExpression(es_expression.callee) &&
        es_expression.arguments.every(argu => is_spread_element(argu) || isLimitedExpression(argu))
    ) return true;
    if ( // [expr1, expr2, ...]
        type == "ArrayExpression" &&
        es_expression.elements.every(element => {
            return is_spread_element(element) || isLimitedExpression(element);
        })
    ) return true;
    if ( // {a: expr1, expr2, ...expr3}
        type == "ObjectExpression" &&
        es_expression.properties.every(prop => {
            if (is_spread_element(prop)) return true;
            if (prop.type == "Property") {
                return isLimitedExpression(prop.key) && isLimitedExpression(prop.value);
            }
            return false;
        })
    ) return true;
    return false;
}

/**
 * if the parsed code represents a single expression
 * returns that expression if it meets certain criteria
 * otherwise it throws a syntax error.
 * @param {string} code 
 * @return {Node|null}
 */
function parse_es_expression(code) {
    const error = SyntaxError("expression syntax error");
    if (typeof code != 'string') throw error;
    const ast = parse(code, { ecmaVersion: 2023 });
    if (ast.type != "Program") throw error;
    if (ast.body.length === 0) return null;
    if (ast.body.length != 1) throw error;
    if (ast.body[0].type != 'ExpressionStatement') throw error;
    const es_expression = ast.body[0].expression;
    if (!isLimitedExpression(es_expression)) throw error;
    return es_expression;
}

/**
 * 
 * @param {string} code 
 */
function parse_esforloop_expression(code) {
    const error = SyntaxError("for expression syntax error");
    let expression = parse_es_expression(code)
    if (expression.type == 'BinaryExpression') return expression;
    const expressions = expression.expressions;
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
    const contents = [];
    const gtcode = GTCode.replace(/^(\s*(\/\/.*)?\r?\n)+/, '');

    // meet {{if expression }}
    if (gtcode.startsWith('if')) {
        const error = SyntaxError("if expression syntax error!");
        const text = gtcode.replace(/^if\s+/, '');
        if (text == gtcode) throw error;
        const expression = parse_es_expression(text);
        if (!expression) throw error;
        return {
            type: "ifs",
            text,
            contents: [ // finally the contents will be [ if, elseif... elseif, else]
                {
                    type: "if",
                    expression,
                    contents
                },
            ]
        }
    }

    // meet {{elseif expression }}
    if (gtcode.startsWith('elseif')) {
        const error = SyntaxError("elseif expression syntax error!");
        let text = gtcode.replace(/^elseif\s+/, '');
        if (text == gtcode) throw error;
        const expression = parse_es_expression(text);
        if (!expression) throw error;
        return {
            type: "elseif",
            text,
            expression,
            contents
        }
    }

    // meet {{else }}
    if (gtcode.startsWith('else')) {
        const text = gtcode.substring(4).trim();
        if (parse_es_expression(text) !== null) throw SyntaxError("else syntax error!");
        return {
            type: "else",
            text,
            contents
        }
    }

    // meet {{endif}}
    if (gtcode.startsWith('endif')) {
        const text = gtcode.substring(5).trim();
        if (parse_es_expression(text) !== null) throw SyntaxError("endif syntax error!");
        return {
            type: "endif",
            text,
        }
    }

    // meet {{for expression}}
    if (gtcode.startsWith('for')) {
        const error = SyntaxError("for expression syntax error!");
        const text = gtcode.replace(/^for\s+/, '');
        if (text == gtcode) throw error;
        const expression = parse_esforloop_expression(text);
        return {
            type: "for",
            text,
            expression,
            contents
        }
    }

    // meet {{endfor}}
    if (gtcode.startsWith('endfor')) {
        const text = gtcode.substring(6).trim();
        if (parse_es_expression(text) !== null) throw SyntaxError("endfor syntax error!");
        return {
            type: "endfor",
            text,
        }
    }

    // meet {{ }} or {{ // comment }}
    const expression = parse_es_expression(gtcode);
    if (expression === null) return {
        type: "comment",
        text: GTCode.trim(),
    };

    // meet {{expression}}
    const error = SyntaxError("expression syntax error!");
    if (!expression) throw error;
    return {
        type: "expression",
        text: gtcode,
        expression,
        contents,
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

        // 不能和上一个 {{if}} 或 {{elseif}} 匹配，报错
        const type = current_node.type;
        if (type != "if" && type != "elseif") throw SyntaxError("wrong pair of IF!");

        // 出栈
        stack_pop(); // 当前节点 ►ifs[...(if|elseif)[...]]◄

        // 重新入栈
        stack_push(code); // 当前节点 ifs[...if|elseif[...], ►elseif|else[]◄ ]

        return;
    }

    // endif
    if (code.type == "endif") {
        // 当前节点 node[...ifs[...►(if|elseif|else)[...]◄]]

        // 不能和上一个 {{if}} 或 {{elseif}} 或 {{else}} 匹配，报错
        const type = current_node.type;
        if (type != "if" && type != "elseif" && type != "else") throw SyntaxError("wrong pair of IF!");

        // 出栈，如不在 ifs 队列中，报错
        stack_pop(); // 当前节点 node[...►ifs[...if|elseif|else[...]]◄]
        if (current_node.type != "ifs") throw SyntaxError("wrong pair of IF!");

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
        if (current_node.type != "for") throw SyntaxError("wrong pair of FOR!");
        stack_pop(); // 当前节点 ►node[...for[...]]◄
        return;
    }

    // expression|raw[]
    if (code.type == "expression" || code.type == "raw") {
        // 当前节点 ►node[...]◄
        current_node.contents.push(code); // 仅附加内容，当前节点不变 ►node[...(expression|raw)[] ]◄
        return;
    }

    // //
    if (code.type == "comment") {
        return;
    }
    throw SyntaxError("wrong node");
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
    const reg_left = /\{\{/g; // 寻找 '{{' 
    const reg_right = /\}\}(_\r?\n)*/g; // 寻找 '}}_\n' 或 '}}'
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
        const gtcode = template.substring(content_left, content_right).trim();
        const goonode = GTCode2Goonode(gtcode);
        goonode.range = [range_left, content_left, content_right, range_right];
        GT_tree_append(goonode);
        current_index = range_right;
        last_range = [range_left, range_right];
    }
    match = reg_right.exec(template);
    if (match) throw_wrong_pair([current_index, reg_right.lastIndex]);

    if (template.length > current_index) current_node.contents.push({
        type: "raw",
        text: template.substring(current_index, template.length),
        contents: []
    });

    if (current_node != document) {
        throw SyntaxError(`${current_node.type} 标记不匹配`);
    }

    return document;
}