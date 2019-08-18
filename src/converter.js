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

function getExpressionResult(tags, expression) {
    // 'Identifier' 'AssignmentExpression' 'BinaryExpression' 'Literal'
    if (expression.type == "Literal") return expression.value;
    if (expression.type == "Identifier") {
        let value = tags[expression.name];
        return value != undefined ? value : expression.name;
    }
    if (expression.type == "ArrayExpression") {
        return expression.elements.map(el => getExpressionResult(tags, el));
    }
    if (expression.type == "MemberExpression") {
        let obj = getExpressionResult(tags, expression.object);
        let property = expression.computed ?
            getExpressionResult(tags, expression.property) :
            expression.property.name;        
        return obj[property];
    }
    if (expression.type == 'UnaryExpression') {
        let result = getExpressionResult(tags, expression.argument);
        if (expression.operator == '+') return +result;
        if (expression.operator == '-') return -result;
        if (expression.operator == '~') return ~result;
        if (expression.operator == '!') return !result;
    }
    if (
        expression.type == 'BinaryExpression' || 
        expression.type == 'LogicalExpression'
    ) {
        let left = getExpressionResult(tags, expression.left);
        let right = getExpressionResult(tags, expression.right);
        switch (expression.operator) {
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
        expression.type == 'SequenceExpression'
    ) {
        return expression.expressions.reduce(
            (str,exp) => str+getExpressionResult(tags, exp),
            ""
        );
    }
    if (
        expression.type == 'AssignmentExpression'
    ) {
        let left = expression.left.name;
        let right = getExpressionResult(tags, expression.right);
        switch (expression.operator) {
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
    throw Error(`not expression: "${expression.type}"`);
}

function do_for_expression(tags, node) {
    let key,
        value,
        list,
        content = '',
        left = node.expression.left,
        right = getExpressionResult(tags, node.expression.right);
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

/**
 * 
 * @param {Object} tags 
 * @param {Goonode} dom 
 */
function convert_dom(tags, dom) {
    let content = '';
    dom.contents.forEach(node => {
        if (node.type == "raw") {
            content += node.text;
            return;
        }
        if (node.type == "expression") {
            content += getExpressionResult(tags, node.expression);
            return;
        }
        if (node.type == "ifs") {
            let truenode = node.contents.find(node => {
                if (node.type == "if" || node.type == "elseif") { // node.text 转换求值后，决定是否呈现 if body
                    return getExpressionResult(tags, node.expression);
                }
                if (node.type == "else") return true;
                return false;
            });
            if (truenode) content += convert_dom({
                ...tags
            }, truenode);
            return;
        }
        if (node.type == "for") {
            content += do_for_expression(tags, node);
            return;
        }
    })
    return content;
}