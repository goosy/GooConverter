/**
 * @file 实现基于转换规则和模板转换
 * @author goosy.jo@gmail.com
 * @typedef {Rule[]} Rules 转换规则表
 * @typedef {{name:string, tags:Object}} Rule 转换规则
 */
import {
    parseToDOM
} from "./gooparse.js";

/**
 * 
 * @param {Object} tags 
 * @param {string} template 
 */
export function convert(tags, template) {
    return convert_dom(tags, parseToDOM(template));
}

/**
 * @param {Rules} rules 
 * @param {string} template  
 * @return {IterableIterator<{"name": string, "content": string}>} 
 */
export function* convertRules(rules, template) {
    for (const rule of rules) {
        yield {
            "name": rule.name,
            "content": convert(rule.tags, template)
        };
    }
}

/**
 * 递归计算表达式
 * @param {Object} tags dict of tag and value
 * @param {AST} es_expression 
 * @todo add ?? ?. ?: operater
 */
function computeESExpression(tags, es_expression) {
    function range(start, end, step) {
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
    }
    // 'Identifier' 'AssignmentExpression' 'BinaryExpression' 'Literal'
    if (es_expression.type == "Literal") return es_expression.value;
    if (es_expression.type == "Identifier") {
        return tags[es_expression.name]; // 标识符必须在tags中，否则返回undefined
    }
    if (es_expression.type == "CallExpression") {
        let argus = es_expression.arguments.map(argu => computeESExpression(tags, argu));
        return range(...argus);
    }
    if (es_expression.type == "ArrayExpression") {
        return es_expression.elements.map(el => computeESExpression(tags, el));
    }
    if (es_expression.type == "MemberExpression") {
        let obj = computeESExpression(tags, es_expression.object);
        let property = es_expression.computed ?
            computeESExpression(tags, es_expression.property) :
            es_expression.property.name;
        return obj[property];
    }
    if (es_expression.type == 'UnaryExpression') {
        let result = computeESExpression(tags, es_expression.argument);
        if (es_expression.operator == '+') return +result;
        if (es_expression.operator == '-') return -result;
        if (es_expression.operator == '~') return ~result;
        if (es_expression.operator == '!') return !result;
    }
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
            case '!=':
                return left != right;
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
    if (
        es_expression.type == 'SequenceExpression'
    ) {
        return es_expression.expressions.reduce(
            (str, exp) => str + computeESExpression(tags, exp),
            ""
        );
    }
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
        }
    }
    throw Error(`not expression: "${es_expression}"`);
}

function convert_FOR_Goonode(tags, node) {
    let key,
        value,
        list,
        content = '',
        left = node.expression.left,
        right = computeESExpression(tags, node.expression.right);
    if (!right) throw Error("wrong #for statement!");
    let isArray = Array.isArray(right);
    // {{#for v in object}}
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
    // {{#for k, v in object}}
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
    throw Error("wrong #for statement!");
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