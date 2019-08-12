/* eslint-disable no-undef */
const {
    convert
} = require("../lib/index.cjs");
const assert = require("assert");

describe('convert(tags, template)', () => {
    describe('模板正确解析', () => {
        it('{{ express }} 输出正确', () => {
            assert.equal(
                convert({"name":"赵六"}, '人物：{{name}}'),
                "人物：赵六"
            );
            assert.equal( // (express)
                convert({"name":"赵六"}, '人物：{{(name)}}'),
                "人物：赵六"
            );
            assert.equal( // "express"
                convert({"name": "赵六"}, '人物：{{"name"}}'),
                "人物：name"
            );
            assert.equal(
                convert({"length": 8, 'index': 6}, 'length > index：{{length > index}}'),
                "length > index：true"
            );
        });
        it('#for loop', () => {
            assert.equal(
                convert({}, '以下人员:{{#for name in ["张三", \n"李四", "王五"]\n}}\n人物：{{name}}{{#endfor}}'),
                "以下人员:\n人物：张三\n人物：李四\n人物：王五"
            );
            assert.equal(
                convert({}, '{{#for sn, name in ["张三", "李四", "王五"]}}人物{{sn}}:{{name}}\n{{#endfor sn, name}}'),
                '人物0:张三\n人物1:李四\n人物2:王五\n'
            );
            assert.equal( // 表达式中有回车
                convert({}, `{{\n   \n#for sn, name\n in ["张三", \n"李四", "王五"]\n}}人物{{sn}}:{{name}}\n{{\n#endfor \nsn, name\n}}`),
                '人物0:张三\n人物1:李四\n人物2:王五\n'
            );
        });
        it('#if condition', () => {
            assert.equal(
                convert({}, ' {{#if "name".length \n>\n0   }}\n人物：{{"XX"}}{{#endif}}'),
                " \n人物：XX"
            );
            assert.equal(
                convert({"name": "吴七"}, '{{#if \nname}}{{name}}{{ #endif \ncomment}}'),
                "吴七"
            );
        });
        it('#var assignment expression', () => {
            assert.equal(
                convert({}, '{{#var r = 5*8/2 }}{{r}}'),
                "20"
            );
        });
        it('# comment', () => {
            assert.equal(
                convert({}, '{{# let \nr = \n\t5*8/2 }}'),
                ""
            );
        });
    });
    describe('模板语法错', () => {
        it('{{#指令 正确', () => {
            assert.throws(() => {
                convert({}, '{{#if9>0}}9>0{{#endif}}');
            }, Error);
            assert.throws(() => {
                convert({}, '{{#fora in [0,1,2]}}{{a}}{{#endfor}}');
            }, Error);
            assert.throws(() => {
                convert({}, '{{#if   }}if{{#endif}}');
            }, Error);
            assert.throws(() => {
                convert({}, '{{#for   }}if{{#endif}}');
            }, Error);
            assert.throws(() => {
                convert({}, '人物：{{#var}}let error');
            }, Error);
        });
        it('#for #endfor 不匹配', () => {
            assert.throws(() => {
                convert({}, '{{#for name in ["张三", "李四", "王五"]}}人物：{{name}}');
            }, Error);
            assert.throws(() => {
                convert({}, '以下人员:{{#if "赵六" in ["张三", "李四", "王五"]}}\n人物：{{name}}{{#endfor}}');
            }, Error);
        });
        it('#if #endif 不匹配', () => {
            assert.throws(() => {
                convert({}, '以下人员:{{#if "赵六" in ["张三", "李四", "王五"]}}\n人物：{{name}}');
            }, Error);
            assert.throws(() => {
                convert({}, '{{#for name in ["张三", "李四", "王五"]}}人物：{{name}}{{#endif}}');
            }, Error);
        });
        it('{{ 与 }} 配套嵌套正确', () => {
            assert.throws(() => {
                convert({}, '人物：{{name"赵六"');
            }, Error);
        });
    });
});

