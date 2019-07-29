const {
    convert
} = require("../lib/index.cjs");
const assert = require("assert");

describe('convert(tags, template)', () => {
    describe('模板解析正确', () => {
        it('#for #if 不匹配', () => {
            assert.throws(() => {
                    convert({}, '{{#for name in ["张三", "李四", "王五"]}}人物：{{name}}');
                },
                Error);
            assert.throws(() => {
                    convert({}, '以下人员:{{#if "赵六" in ["张三", "李四", "王五"]}}\n人物：{{name}}{{#endfor}}');
                },
                Error);
        });
        it('{{ 与 }} 配套嵌套正确', () => {
            assert.throws(() => {
                    convert({}, '人物：{{name"赵六"');
                },
                Error);
        });
        it('#for loop', () => {
            assert.equal(
                convert({}, '以下人员:{{#for name in ["张三", \n"李四", "王五"]\n}}\n人物：{{name}}{{#endfor}}'),
                "以下人员:\n人物：张三\n人物：李四\n人物：王五"
            );
        });
        it('#if condition', () => {
            assert.equal(
                convert({}, ' {{#if "name".length \n>\n0   }}\n人物：{{"XX"}}{{ #endif }}'),
                " \n人物：XX"
            );
        });
    });
});