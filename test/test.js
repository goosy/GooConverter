/* eslint-disable no-undef */
import { convert } from "../src/index.js";
import assert from "assert";
describe('convert(tags, template)', () => {
    describe('模板正确解析', () => {
        describe('{{express}} output', () => {
            it('{{ 变量 }} 输出正确', () => {
                assert.strictEqual( // 测试 变量 括号中变量 含变量的字符串
                    convert({
                        "name": "赵六"
                    }, '人物: {{name}} {{(name)}} {{"name"+name}}'),
                    "人物: 赵六 赵六 name赵六"
                );
            });
            it('{{ 非变量 }} 输出 undefined', () => {
                assert.strictEqual( // 测试 不是变量的标识符
                    convert({
                        "name": "赵六"
                    }, '人物: {{naem}} {{"name"+naem}}'),
                    "人物: undefined nameundefined"
                );
            });
            it('{{ 一元二元运算式 }} 输出正确', () => {
                assert.strictEqual( // 测试数字的二元运算 + - * / %
                    convert(
                        { "length": 8, 'width': 6 },
                        '面积:{{(length+3)*(width-4)/2}} \n空余: {{length % width}}'
                    ),
                    "面积:11 \n空余: 2"
                );
                assert.strictEqual( // 测试布尔的二元运算 && ||
                    convert(
                        { "go": true, 'car': false, ud: null },
                        '步行外出:{{go && !car}} \n乘车外出: {{go && car}} \n有外出: {{go || car}}\n{{ud ?? "无效值"}}'
                    ),
                    "步行外出:true \n乘车外出: false \n有外出: true\n无效值"
                );
                assert.strictEqual( // 测试其它二元运算 == === != !==
                    convert(
                        {},
                        '{{null == undefined}}:{{null === undefined}}:{{null != undefined}}:{{null !== undefined}}'
                    ),
                    "true:false:false:true"
                );
                assert.strictEqual( // 测试成员运算符 . []
                    convert({
                        "ID": 1,
                        "prop": "ID",
                        "conn": {
                            "ID": 2,
                            "addr": { "ID": 3, "value": "xian rd. 128" }
                        }
                    }, '{{ID}} {{conn.ID}} {{conn["ID"]}} {{conn[prop]}} {{conn.addr.ID}} {{conn.addr["value"]}}'),
                    "1 2 2 2 3 xian rd. 128"
                );
                assert.strictEqual( // 测试链运算符 ?.
                    convert({
                        "someone": {
                            "addr": { "ID": 3, "value": "xian rd. 128" }
                        }
                    }, '{{someone?.addr?.ID}} {{someone["addr"]?.value}} {{someone["addr"]?.zip}}'),
                    "3 xian rd. 128 undefined"
                );
            });
            it('{{ 三元运算式 }} 输出正确', () => {
                assert.strictEqual( // 测试赋值运算 '?:'
                    convert(
                        { "n": 1, 'b': false },
                        '{{n==1?"n=1":""}}\n{{b?"b=true":"b=false"}}'
                    ),
                    "n=1\nb=false"
                );
            });
            it('{{ 数组字面量 }} 输出正确', () => {
                assert.strictEqual( // 测试数组字面量
                    convert(
                        { common: [true, 'test'] },
                        '{{ [1,2,3,"test"][3] }}_{{ [...common][1] }}'
                    ),
                    "test_test"
                );
            });
            it('{{ 对象字面量 }} 输出正确', () => {
                assert.strictEqual( // 测试对象字面量
                    convert(
                        { n: 1, has: false, common: { name: 'test' } },
                        '{{ ({n, a: 3, has}).has }}_{{ ({...common}).name }}'
                    ),
                    "false_test"
                );
            });
            it('{{ 赋值运算式 }} 输出正确', () => {
                assert.strictEqual( // 测试赋值运算 '=', '+=', '-=', '*=', '**=', '/=', '%='
                    convert(
                        { "n": 1, 'b': false },
                        '{{n+=7}}{{n}}\n{{b=b||true}}{{b}}\n{{n%=5}}{{n}}\n{{"n:",m=10,m}}'
                    ),
                    "8\ntrue\n3\nn:10"
                );
                assert.strictEqual( // 测试赋值运算 '=', '+=', '-=', '*=', '**=', '/=', '%=', '??='
                    convert(
                        { "n": 1, 'b': false },
                        '{{n+=7}}{{n}}\n{{c=b||"on false"}}{{c}}\n{{c=b??"no false"}}{{c}}\n{{n%=5}}{{n}}\n{{"n:",c=10,c}}'
                    ),
                    "8\non false\nfalse\n3\nn:10"
                );
            });
            it('call 输出正确', () => {
                assert.strictEqual( // {{ range() }} 输出正确'
                    convert(
                        {},
                        '{{range(10)}}\n{{#for i in range(1,11)}}{{i}} {{#endfor}}\n{{#for i in range(10,-1,-2)}}{{i}} {{#endfor}}'
                    ),
                    "0,1,2,3,4,5,6,7,8,9\n1 2 3 4 5 6 7 8 9 10 \n10 8 6 4 2 0 "
                );
                assert.strictEqual( // Object.valueOf Object.entries 输出正确'
                    convert(
                        { 'myobj': { name: 'myobj', value: 'v' } },
                        '{{myobj.valueOf()}} {{Object.entries(myobj)}}'
                    ),
                    "[object Object] name,myobj,value,v"
                );
                assert.strictEqual( // Array.join 输出正确'
                    convert(
                        { 'mylist': ['apple', 'banana', 'orange', 'pear'] },
                        '{{ mylist.join(" | ") }},{{ mylist["join"](" | ") }}'
                    ),
                    "apple | banana | orange | pear,apple | banana | orange | pear"
                );
                assert.strictEqual( // ...展开运算符输出正确
                    convert(
                        { a: [], b: [1, 2, 3] },
                        '{{a.push(...b)}}\n{{a.join("")}}'
                    ),
                    "3\n123"
                );
                assert.strictEqual( // 自定义方法输出正确'
                    convert(
                        {
                            show() {
                                return ['apple', 'banana', 'orange', 'pear'].join(" | ");
                            }
                        },
                        '{{ show() }}'
                    ),
                    "apple | banana | orange | pear"
                );
            });
        });
        describe('{{#for}} loop', () => {
            it('for in 数组', () => {
                assert.strictEqual( // 测试数组遍历
                    convert(
                        { peoplelist: ["张三", "李四", "王五"] },
                        '以下人员:\n{{#for name in peoplelist}}人物: {{name}}\n{{#endfor}}'
                    ),
                    "以下人员:\n人物: 张三\n人物: 李四\n人物: 王五\n"
                );
                assert.strictEqual( // 测试数组带序号遍历
                    convert(
                        { peoplelist: ["张三", "李四", "王五"] },
                        '{{#for sn, name in peoplelist}}人物{{sn+1}}:{{name}}\n{{#endfor sn, name}}'
                    ),
                    '人物1:张三\n人物2:李四\n人物3:王五\n'
                );
            });
            it('for in 对象', () => {
                assert.strictEqual( // 测试对象遍历
                    convert(
                        { person: { "name": "张三", "age": 18, "gender": "男" } },
                        '人员:\n{{#for prop in person}}{{prop}}\n{{#endfor}}'
                    ),
                    "人员:\n张三\n18\n男\n"
                );
                assert.strictEqual( // 测试对象带键值遍历
                    convert(
                        { person: { "name": "张三", "age": 18, "gender": "男" } },
                        '人员:\n{{#for pname, prop in person}}{{pname}}:{{prop}}\n{{#endfor}}'
                    ),
                    "人员:\nname:张三\nage:18\ngender:男\n"
                );
            });
            it('for 表达式中有空白符', () => {
                assert.strictEqual( // 表达式中有回车
                    convert({}, `{{\n   \n#for sn, name\n in ["张三", \n"李四", "王五"]\n}}人物{{sn}}:{{name}}\n{{\n#endfor \nsn, name\n}}`),
                    '人物0:张三\n人物1:李四\n人物2:王五\n'
                );
            });
        });
        describe('{{#if}} condition', () => {
            it('if condition', () => {
                assert.strictEqual(
                    convert({}, ' {{#if "name".length \n>\n0   }}\n人物: {{"XX"}}{{#endif}}'),
                    " \n人物: XX"
                );
                assert.strictEqual(
                    convert({
                        "name": "吴七"
                    }, '{{#if \nname}}{{name}}{{ #endif \ncomment}}'),
                    "吴七"
                );
            });
        });
        describe('other', () => {
            it('# comment', () => {
                assert.strictEqual(
                    convert({}, '{{# let \nr = \n\t5*8/2 }}'),
                    ""
                );
            });
            it('空替换符 {{ }} 不输出', () => {
                assert.strictEqual(
                    convert({}, '{{ }}abc{{\t\n}}test\n'),
                    "abctest\n"
                );
            });
            it('取消末尾换行', () => {
                assert.strictEqual(
                    convert({}, '{{# comment}}_\r\n_\n\n_\ntest\n'),
                    "\n_\ntest\n"
                );
            });
        });
    });
    describe('模板语法纠错', () => {
        it('表达式错误', () => {
            assert.throws(() => { // 测试表达式不合法
                convert({}, '{{a ** b}}');
            }, SyntaxError);
        });
        it('使用了不支持的语法', () => {
            assert.throws(() => {
                convert({}, '{{ a++ }}{{ c <<= d }}');
            }, SyntaxError);
            assert.throws(() => {
                convert({}, '{{b = a => a+1}}');
            }, SyntaxError);
        });
        it('if 指令错误', () => {
            assert.throws(() => {
                convert({}, '{{#if9>0}}9>0{{#endif}}');
            }, SyntaxError);
            assert.throws(() => {
                convert({}, '{{#fora in [0,1,2]}}{{a}}{{#endfor}}');
            }, SyntaxError);
            assert.throws(() => {
                convert({}, '{{#if   }}if{{#endif}}');
            }, SyntaxError);
            assert.throws(() => {
                convert({}, '{{#for   }}if{{#endif}}');
            }, SyntaxError);
        });
        it('#for #endfor 不匹配', () => {
            assert.throws(() => {
                convert({}, '{{#for name in ["张三", "李四", "王五"]}}人物: {{name}}');
            }, SyntaxError);
            assert.throws(() => {
                convert({}, '以下人员:{{#if "赵六" in ["张三", "李四", "王五"]}}\n人物: {{name}}{{#endfor}}');
            }, SyntaxError);
        });
        it('#if #endif 不匹配', () => {
            assert.throws(() => {
                convert({}, '以下人员:{{#if "赵六" in ["张三", "李四", "王五"]}}\n人物: {{name}}');
            }, SyntaxError);
            assert.throws(() => {
                convert({}, '{{#for name in ["张三", "李四", "王五"]}}人物: {{name}}{{#endif}}');
            }, SyntaxError);
        });
        it('{{ 与 }} 配对不正确', () => {
            assert.throws(() => {
                convert({}, 'r11: {{# {{r12}} r13');
            }, SyntaxError);
            assert.throws(() => {
                convert({}, 'r21: {{name r22');
            }, SyntaxError);
            assert.throws(() => {
                convert({}, 'r31 }}{{name}} r32');
            }, SyntaxError);
            assert.throws(() => {
                convert({}, 'r41: {{name}}r42 }} r43');
            }, SyntaxError);
        });
    });
});
