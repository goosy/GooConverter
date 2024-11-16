/**
 * @file Implements template conversion based on conversion rules
 * @author goosy.jo@gmail.com
 * @typedef {Object.<string, Object>} Tags  tag and value dict
 * @typedef {{name:string, tags:Tags}} Rule Conversion rule
 * @typedef {Rule[]} Rules Conversion rule table
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
    range(...argus) {
        let [start, end, step] = argus;
        if (start === undefined) return [];
        if (end === undefined) {
            end = start
            start = 0
        }
        const direct = start < end;
        step ??= direct ? 1 : -1;
        const ret = [];
        let index = start;
        while (direct ? index < end : index > end) {
            ret.push(index);
            index += step;
        }
        return ret;
    },
    Object, Array, Map, Set, // Transparently transmit some system objects
}

/**
 * Recursively evaluate expressions
 * @param {Object} tags tag and value dict
 * @param {AST} es_expression
 * @return {*}
 */
function computeESExpression(tags, es_expression) {
    // 'Identifier' 'AssignmentExpression' 'BinaryExpression' 'Literal'
    if (es_expression.type === "Literal") return es_expression.value;
    if (es_expression.type === "Identifier") {
        return { ...global_tags, ...tags }[es_expression.name]; // The identifier must be in tags, otherwise undefined is returned
    }

    // obj.foo
    if (es_expression.type === "MemberExpression") {
        const { obj, property } = parseMemberExpression(tags, es_expression);
        return obj[property];
    }

    // obj?.foo
    if (es_expression.type === "ChainExpression") {
        const { obj, property } = parseMemberExpression(tags, es_expression.expression);
        if (obj === null || obj === undefined) return undefined;
        return obj[property];
    }

    // +expr -expr ~expr !expr
    if (es_expression.type === 'UnaryExpression') {
        const result = computeESExpression(tags, es_expression.argument);
        if (es_expression.operator === '+') return +result;
        if (es_expression.operator === '-') return -result;
        if (es_expression.operator === '~') return ~result;
        if (es_expression.operator === '!') return !result;
    }

    // expr1 operator expr2
    if (
        es_expression.type === 'BinaryExpression' ||
        es_expression.type === 'LogicalExpression'
    ) {
        const left = computeESExpression(tags, es_expression.left);
        const right = computeESExpression(tags, es_expression.right);
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
                // biome-ignore lint/suspicious/noDoubleEquals: This is the interpreter
                return left == right;
            case '===':
                return left === right;
            case '!=':
                // biome-ignore lint/suspicious/noDoubleEquals: This is the interpreter
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
    if (es_expression.type === 'SequenceExpression') {
        return es_expression.expressions.reduce(
            (str, exp) => str + computeESExpression(tags, exp),
            ""
        );
    }

    // expr1 ? expr2 : expr3
    if (es_expression.type === 'ConditionalExpression') {
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
        es_expression.type === 'AssignmentExpression'
    ) {
        const left = es_expression.left.name;
        const right = computeESExpression(tags, es_expression.right);
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
    if (es_expression.type === "CallExpression") {
        const argus = [];
        for (const argu of es_expression.arguments) {
            if (argu.type === "SpreadElement") {
                argus.push(...computeESExpression(tags, argu.argument));
            } else {
                argus.push(computeESExpression(tags, argu));
            }
        }
        const callee = es_expression.callee;
        if (callee.type === "Identifier") {
            return computeESExpression(tags, callee)(...argus);
        }
        if (callee.type === "MemberExpression") {
            const { obj, property } = parseMemberExpression(tags, callee);
            return obj[property](...argus);
        }
        return '';
    }

    // [expr1, expr2, ...]
    if (es_expression.type === "ArrayExpression") {
        const ret = [];
        for (const el of es_expression.elements) {
            if (el.type === "SpreadElement") {
                ret.push(...computeESExpression(tags, el.argument));
            } else {
                ret.push(computeESExpression(tags, el));
            }
        }
        return ret;
    }

    // {a: expr1, expr2, ...expr3}
    if (es_expression.type === "ObjectExpression") {
        const ret = {};
        for (const prop of es_expression.properties) {
            if (prop.type === "SpreadElement") {
                Object.assign(ret, computeESExpression(tags, prop.argument));
            }
            if (prop.type === "Property") {
                const key = prop.computed
                    ? computeESExpression(tags, prop.key)
                    : prop.key.name;
                const value = computeESExpression(tags, prop.value);
                ret[key] = value;
            }
        }
        return ret;
    }

    // throw error in other cases
    throw Error(`not expression: "${es_expression}"`);
}

function convert_FOR_Goonode(tags, node) {
    let key;
    let value;
    let list;
    let content = '';
    const left = node.expression.left;
    const right = computeESExpression(tags, node.expression.right);
    if (!right) throw Error("wrong for statement!");
    const isArray = Array.isArray(right);
    // {{for v in object}}
    if (left.type === 'Identifier') {
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
    if (left.type === "ArrayExpression") {
        key = left[0].name;
        value = left[1].name;
        list = Object.entries(right);
        for (let [k, v] of list) {
            k = isArray ? Number.parseInt(k) : k;
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
    const truenode = node.contents.find(node => {
        if (node.type === "if" || node.type === "elseif") { // After node.text conversion evaluation, decide whether to render the if body
            return computeESExpression(tags, node.expression);
        }
        if (node.type === "else") return true;
        return false;
    });
    if (truenode) {
        return convert_dom({ ...tags }, truenode);
    }
    return "";
}

/**
 * Convert goonode DOM to text
 * @param {Object} tags
 * @param {Goonode} dom
 * @returns {string}
 */
function convert_dom(tags, dom) {
    let content = '';
    for (const node of dom.contents) {
        if (node.type === "raw") {
            content += node.text;
        } else if (node.type === "expression") {
            content += computeESExpression(tags, node.expression);
        } else if (node.type === "ifs") {
            content += convert_IF_Goonode(tags, node);
        } else if (node.type === "for") {
            content += convert_FOR_Goonode(tags, node);
        }
    }
    return content;
}