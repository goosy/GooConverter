/**
 * @file 实现基于转换规则和模板转换
 * @author goosy.jo@gmail.com
 * @typedef {Object.<string, Object>} Tags 替换变量
 * @typedef {{name:string, tags:Tags}} Rule 转换规则
 * @typedef {Rule[]} Rules 转换规则表
 */

import {
    parseToDOM
} from "./gooparse.js";

/**
 * @param {Tags} tags tags dict for template
 * @param {string} template template string
 * @return {string}
 */
export function convert(tags, template) {
    return convert_dom(tags, parseToDOM(template));
}

/**
 * @param {Rules} rules
 * @param {string} template
 * @return {Array.<{"name": string, "content": string}>}
 */
export function convertRules(rules, template) {
    return rules.map(rule => ({
        name: rule.name,
        content: convert(rule.tags, template)
    }));
}

function parseMemberExpression(tags, es_expression) {
    const obj = computeESExpression(tags, es_expression.object);
    const property = es_expression.computed ?
        computeESExpression(tags, es_expression.property) :
        es_expression.property.name;
    return { obj, property };
}

const global_tags = {
    range(start, end, step) {
        if (start === undefined) return [];
        if (end === undefined) {
            end = start
            start = 0
        }
        let direct = start < end;
        step = step === undefined ? (direct ? 1 : -1) : step;
        let ret = [], index = start;
        while (direct ? index < end : index > end) {
            ret.push(index);
            index += step;
        }
        return ret;
    },
    Object, Array, Map, Set, // 透传一些系统对象
}

/**
 * 递归计算表达式
 * @param {Object} tags dict of tag and value
 * @param {AST} es_expression
 * @return {*}
 */
function computeESExpression(tags, es_expression) {
    // 'Identifier' 'AssignmentExpression' 'BinaryExpression' 'Literal'
    if (es_expression.type == "Literal") return es_expression.value;
    if (es_expression.type == "Identifier") {
        return { ...global_tags, ...tags }[es_expression.name]; // 标识符必须在tags中，否则返回undefined
    }

    // obj.foo
    if (es_expression.type == "MemberExpression") {
        const { obj, property } = parseMemberExpression(tags, es_expression);
        return obj[property];
    }

    // obj?.foo
    if (es_expression.type == "ChainExpression") {
        const { obj, property } = parseMemberExpression(tags, es_expression.expression);
        if (obj === null || obj === undefined) return undefined;
        return obj[property];
    }

    // +expr -expr ~expr !expr
    if (es_expression.type == 'UnaryExpression') {
        let result = computeESExpression(tags, es_expression.argument);
        if (es_expression.operator == '+') return +result;
        if (es_expression.operator == '-') return -result;
        if (es_expression.operator == '~') return ~result;
        if (es_expression.operator == '!') return !result;
    }

    // expr1 operator expr2
    if (
        es_expression.type == 'BinaryExpression' ||
        es_expression.type == 'LogicalExpression'
    ) {
        let left = computeESExpression(tags, es_expression.left);
        let right = computeESExpression(tags, es_expression.right);
        switch (es_expression.operator) {
            case '+':
                return left + right;
            case '-':
                return left - right;
            case '*':
                return left * right;
            case '/':
                return left / right;
            case '%':
                return left % right;
            case '==':
                return left == right;
            case '===':
                return left === right;
            case '!=':
                return left != right;
            case '!==':
                return left !== right;
            case '??':
                return left ?? right;
            case 'in':
                return left in right;
            case '<':
                return left < right;
            case '>':
                return left > right;
            case '<=':
                return left <= right;
            case '>=':
                return left >= right;
            case '||':
                return left || right;
            case '&&':
                return left && right;
        }
    }

    // expr1, expr2, ..., exprN
    if (es_expression.type == 'SequenceExpression') {
        return es_expression.expressions.reduce(
            (str, exp) => str + computeESExpression(tags, exp),
            ""
        );
    }

    // expr1 ? expr2 : expr3
    if (es_expression.type == 'ConditionalExpression') {
        const test = computeESExpression(tags, es_expression.test);
        const consequent = computeESExpression(tags, es_expression.consequent);
        const alternate = computeESExpression(tags, es_expression.alternate);
        return test ? consequent : alternate;
    }

    // expr1 = expr2
    // expr1 += expr2
    // expr1 -= expr2
    // expr1 *= expr2
    // expr1 **= expr2
    // expr1 /= expr2
    // expr1 %= expr2
    // expr1 ??= expr2
    if (
        es_expression.type == 'AssignmentExpression'
    ) {
        let left = es_expression.left.name;
        let right = computeESExpression(tags, es_expression.right);
        switch (es_expression.operator) {
            case '=':
                tags[left] = right;
                return "";
            case '+=':
                tags[left] += right;
                return "";
            case '-=':
                tags[left] -= right;
                return "";
            case '*=':
                tags[left] *= right;
                return "";
            case '**=':
                tags[left] **= right;
                return "";
            case '/=':
                tags[left] /= right;
                return "";
            case '%=':
                tags[left] %= right;
                return "";
            case '??=':
                tags[left] ??= right;
                return "";
        }
    }

    // foo() obj.foo() obj["foo"]()
    if (es_expression.type == "CallExpression") {
        const argus = [];
        es_expression.arguments.forEach(argu => {
            if (argu.type == "SpreadElement") {
                argus.push(...computeESExpression(tags, argu.argument));
            } else {
                argus.push(computeESExpression(tags, argu));
            }
        });
        const callee = es_expression.callee;
        if (callee.type == "Identifier") {
            return computeESExpression(tags, callee)(...argus);
        }
        if (callee.type == "MemberExpression") {
            const { obj, property } = parseMemberExpression(tags, callee);
            return obj[property](...argus);
        }
        return '';
    }

    // [expr1, expr2, ...]
    if (es_expression.type == "ArrayExpression") {
        const ret = [];
        es_expression.elements.forEach(el => {
            if (el.type == "SpreadElement") {
                ret.push(...computeESExpression(tags, el.argument));
            } else {
                ret.push(computeESExpression(tags, el));
            }
        });
        return ret;
    }

    // {a: expr1, expr2, ...expr3}
    if (es_expression.type == "ObjectExpression") {
        const ret = {};
        es_expression.properties.forEach(prop => {
            if (prop.type == "SpreadElement") {
                Object.assign(ret, computeESExpression(tags, prop.argument));
            }
            if (prop.type == "Property") {
                let key = prop.computed
                    ? computeESExpression(tags, prop.key)
                    : prop.key.name;
                const value = computeESExpression(tags, prop.value);
                ret[key] = value;
            }
        });
        return ret;
    }

    // throw error in other cases
    throw Error(`not expression: "${es_expression}"`);
}

function convert_FOR_Goonode(tags, node) {
    let key,
        value,
        list,
        content = '',
        left = node.expression.left,
        right = computeESExpression(tags, node.expression.right);
    if (!right) throw Error("wrong for statement!");
    let isArray = Array.isArray(right);
    // {{for v in object}}
    if (left.type == 'Identifier') {
        value = left.name;
        list = Object.values(right);
        for (const item of list) {
            content += convert_dom({
                ...tags,
                [value]: item
            }, node);
        }
        return content;
    }
    // {{for k, v in object}}
    if (left.type == "ArrayExpression") {
        key = left[0].name;
        value = left[1].name;
        list = Object.entries(right);
        for (let [k, v] of list) {
            k = isArray ? parseInt(k) : k;
            content += convert_dom({
                ...tags,
                [key]: k,
                [value]: v
            }, node);
        }
        return content;
    }
    throw Error("wrong for statement!");
}

function convert_IF_Goonode(tags, node) {
    let truenode = node.contents.find(node => {
        if (node.type == "if" || node.type == "elseif") { // node.text 转换求值后，决定是否呈现 if body
            return computeESExpression(tags, node.expression);
        }
        if (node.type == "else") return true;
        return false;
    });
    if (truenode) {
        return convert_dom({ ...tags }, truenode);
    }
    return "";
}

/**
 * 将 goonode DOM 转化为文字
 * @param {Object} tags
 * @param {Goonode} dom
 * @returns {string}
 */
function convert_dom(tags, dom) {
    let content = '';
    dom.contents.forEach(node => {
        if (node.type == "raw") {
            content += node.text;
        } else if (node.type == "expression") {
            content += computeESExpression(tags, node.expression);
        } else if (node.type == "ifs") {
            content += convert_IF_Goonode(tags, node);
        } else if (node.type == "for") {
            content += convert_FOR_Goonode(tags, node);
        }
    })
    return content;
}