/* eslint-disable no-undef */
import {convert} from "../lib/index.js";
import assert from "assert";
describe('convert(tags, template)', () => {
    describe('模板正确解析', () => {
        describe('{{ express }} 输出正确', () => {
            it('{{ 变量 }} 输出正确', () => {
                assert.equal( // 测试 变量 括号中变量 含变量的字符串
                    convert({
                        "name": "赵六"
                    }, '人物：{{name}} {{(name)}} {{"name"+name}}'),
                    "人物：赵六 赵六 name赵六"
                );
            });
            it('{{ 一元二元运算式 }} 输出正确', () => {
                assert.equal( // 测试数字的二元运算 + - * / %
                    convert(
                        {"length": 8, 'width': 6},
                        '面积:{{(length+3)*(width-4)/2}} \n空余：{{length % width}}'
                    ),
                    "面积:11 \n空余：2"
                );
                assert.equal( // 测试布尔的二元运算 && ||
                    convert(
                        {"go": true, 'car': false},
                        '步行外出:{{go && !car}} \n乘车外出：{{go && car}} \n有外出：{{go || car}}'
                    ),
                    "步行外出:true \n乘车外出：false \n有外出：true"
                );
                assert.equal( // 测试成员运算符 . []
                    convert({
                        "ID": 1,
                        "prop": "ID",
                        "conn": {
                            "ID": 2,
                            "addr": {"ID": 3, "value": "xian rd. 128"}
                        }
                    }, '{{ID}} {{conn.ID}} {{conn["ID"]}} {{conn[prop]}} {{conn.addr.ID}} {{conn.addr["value"]}}'),
                    "1 2 2 2 3 xian rd. 128"
                );
            });
            it('{{ 赋值运算式 }} 输出正确', () => {
                assert.equal( // 测试赋值运算 '=', '+=', '-=', '*=', '**=', '/=', '%='
                    convert(
                        {"n": 1, 'b': false},
                        '{{n+=7}}{{n}}\n{{b=b||true}}{{b}}\n{{n%=5}}{{n}}\n{{"n:",m=10,m}}'
                    ),
                    "8\ntrue\n3\nn:10"
                );
            });
            it('{{ range() }} 输出正确', () => {
                assert.equal( 
                    convert(
                        {},
                        '{{range(10)}}\n{{#for i in range(1,11)}}{{i}} {{#endfor}}\n{{#for i in range(10,-1,-2)}}{{i}} {{#endfor}}'
                    ),
                    "0,1,2,3,4,5,6,7,8,9\n1 2 3 4 5 6 7 8 9 10 \n10 8 6 4 2 0 "
                );
            });
        });
        describe('#for loop', () => {
            it('#for 数组', () => {
                assert.equal( // 测试数组遍历
                    convert(
                        {peoplelist:["张三", "李四", "王五"]}, 
                        '以下人员:\n{{#for name in peoplelist}}人物：{{name}}\n{{#endfor}}'
                    ),
                    "以下人员:\n人物：张三\n人物：李四\n人物：王五\n"
                );
                assert.equal( // 测试数组带序号遍历
                    convert(
                        {peoplelist:["张三", "李四", "王五"]}, 
                        '{{#for sn, name in peoplelist}}人物{{sn+1}}:{{name}}\n{{#endfor sn, name}}'
                    ),
                    '人物1:张三\n人物2:李四\n人物3:王五\n'
                );
            });
            it('#for 对象', () => {
                assert.equal( // 测试对象遍历
                    convert(
                        {person:{"name":"张三", "age":18, "gender":"男"}}, 
                        '人员:\n{{#for prop in person}}{{prop}}\n{{#endfor}}'
                    ),
                    "人员:\n张三\n18\n男\n"
                );
                assert.equal( // 测试对象带键值遍历
                    convert(
                        {person:{"name":"张三", "age":18, "gender":"男"}}, 
                        '人员:\n{{#for pname, prop in person}}{{pname}}:{{prop}}\n{{#endfor}}'
                    ),
                    "人员:\nname:张三\nage:18\ngender:男\n"
                );
            });
            it('#for 表达式中有空白符，如回车', () => {
                assert.equal( // 表达式中有回车
                    convert({}, `{{\n   \n#for sn, name\n in ["张三", \n"李四", "王五"]\n}}人物{{sn}}:{{name}}\n{{\n#endfor \nsn, name\n}}`),
                    '人物0:张三\n人物1:李四\n人物2:王五\n'
                );
            });
        });
        describe('#if condition', () => {
            it('#if condition', () => {
                assert.equal(
                    convert({}, ' {{#if "name".length \n>\n0   }}\n人物：{{"XX"}}{{#endif}}'),
                    " \n人物：XX"
                );
                assert.equal(
                    convert({
                        "name": "吴七"
                    }, '{{#if \nname}}{{name}}{{ #endif \ncomment}}'),
                    "吴七"
                );
            });
        });
        describe('other', () => {
            it('# comment', () => {
                assert.equal(
                    convert({}, '{{# let \nr = \n\t5*8/2 }}'),
                    ""
                );
            });
        });
    });
    describe('模板语法错', () => {
        it('使用了不支持的语法', () => {
            assert.throws(() => {
                convert({}, '{{ a++ }}{{ c <<= d }}');
            }, Error);
        });
        it('{{#指令 错误', () => {
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
