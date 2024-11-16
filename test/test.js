import { convert } from "../src/index.js";
import { throws, strictEqual } from "node:assert/strict";
import { suite, test } from 'node:test';
suite('convert(tags, template)', () => {
    suite('模板正确解析', () => {
        suite('{{express}} output', () => {
            test('{{ 变量 }} 输出正确', () => {
                strictEqual( // 测试 变量 括号中变量 含变量的字符串
                    convert({
                        "name": "赵六"
                    }, '人物: {{name}} {{(name)}} {{"name"+name // comment}}'),
                    "人物: 赵六 赵六 name赵六"
                );
            });
            test('{{ 非变量 }} 输出 undefined', () => {
                strictEqual( // 测试 不是变量的标识符
                    convert({
                        "name": "赵六"
                    }, '人物: {{naem}} {{"name"+naem // 变量名称不正确}}'),
                    "人物: undefined nameundefined"
                );
            });
            test('{{ 一元二元运算式 }} 输出正确', () => {
                strictEqual( // 测试数字的二元运算 + - * / %
                    convert(
                        { "length": 8, 'width': 6 },
                        '面积:{{(length+3)*(width-4)/2}} \n空余: {{length % width // comment}}'
                    ),
                    "面积:11 \n空余: 2"
                );
                strictEqual( // 测试布尔的二元运算 && ||
                    convert(
                        { "go": true, 'car': false, ud: null },
                        '步行外出:{{go && !car}} \n乘车外出: {{go && car}} \n有外出: {{go || car}}\n{{ud ?? "无效值" // comment}}'
                    ),
                    "步行外出:true \n乘车外出: false \n有外出: true\n无效值"
                );
                strictEqual( // 测试其它二元运算 == === != !==
                    convert(
                        {},
                        '{{null == undefined}}:{{null === undefined}}:{{null != undefined}}:{{null !== undefined // comment}}'
                    ),
                    "true:false:false:true"
                );
                strictEqual( // 测试成员运算符 . []
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
                strictEqual( // 测试链运算符 ?.
                    convert({
                        "someone": {
                            "addr": { "ID": 3, "value": "xian rd. 128" }
                        }
                    }, '{{someone?.addr?.ID}} {{someone["addr"]?.value}} {{someone["addr"]?.zip}}'),
                    "3 xian rd. 128 undefined"
                );
            });
            test('{{ 三元运算式 }} 输出正确', () => {
                strictEqual( // 测试赋值运算 '?:'
                    convert(
                        { "n": 1, 'b': false },
                        '{{n==1?"n=1":""}}\n{{b?"b=true":"b=false"}}'
                    ),
                    "n=1\nb=false"
                );
            });
            test('{{ 数组字面量 }} 输出正确', () => {
                strictEqual( // 测试数组字面量
                    convert(
                        { common: [true, 'test'] },
                        '{{ [1,2,3,"test"][3] }}_{{ [...common][1] }}'
                    ),
                    "test_test"
                );
            });
            test('{{ 对象字面量 }} 输出正确', () => {
                strictEqual( // 测试对象字面量
                    convert(
                        { n: 1, has: false, common: { name: 'test' } },
                        '{{ ({n, a: 3, has}).has }}_{{ ({...common}).name }}'
                    ),
                    "false_test"
                );
            });
            test('{{ 赋值运算式 }} 输出正确', () => {
                strictEqual( // 测试赋值运算 '=', '+=', '-=', '*=', '**=', '/=', '%='
                    convert(
                        { "n": 1, 'b': false },
                        '{{n+=7}}{{n}}\n{{b=b||true}}{{b}}\n{{n%=5}}{{n}}\n{{"n:",m=10,m}}'
                    ),
                    "8\ntrue\n3\nn:10"
                );
                strictEqual( // 测试赋值运算 '=', '+=', '-=', '*=', '**=', '/=', '%=', '??='
                    convert(
                        { "n": 1, 'b': false },
                        '{{n+=7}}{{n}}\n{{c=b||"on false"}}{{c}}\n{{c=b??"no false"}}{{c}}\n{{n%=5}}{{n}}\n{{"n:",c=10,c}}'
                    ),
                    "8\non false\nfalse\n3\nn:10"
                );
            });
            test('call 输出正确', () => {
                strictEqual( // {{ range() }} 输出正确'
                    convert(
                        {},
                        '{{range(10)// array}}\n{{for i in range(1,11)}}{{i}} {{endfor}}\n{{for i in range(10,-1,-2)}}{{i}} {{endfor}}'
                    ),
                    "0,1,2,3,4,5,6,7,8,9\n1 2 3 4 5 6 7 8 9 10 \n10 8 6 4 2 0 "
                );
                strictEqual( // Object.valueOf Object.entries 输出正确'
                    convert(
                        { 'myobj': { name: 'myobj', value: 'v' } },
                        '{{myobj.valueOf()}} {{Object.entries(myobj)}}'
                    ),
                    "[object Object] name,myobj,value,v"
                );
                strictEqual( // Array.join 输出正确'
                    convert(
                        { 'mylist': ['apple', 'banana', 'orange', 'pear'] },
                        '{{ mylist.join(" | ") }},{{ mylist["join"](" | ") }}'
                    ),
                    "apple | banana | orange | pear,apple | banana | orange | pear"
                );
                strictEqual( // ...展开运算符输出正确
                    convert(
                        { a: [], b: [1, 2, 3] },
                        '{{a.push(...b)}}\n{{a.join("")}}'
                    ),
                    "3\n123"
                );
                strictEqual( // 自定义方法输出正确'
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
        suite('{{for}} loop', () => {
            test('for in 数组', () => {
                strictEqual( // 测试数组遍历
                    convert(
                        { peoplelist: ["张三", "李四", "王五"] },
                        '以下人员:\n{{for name in peoplelist}}人物: {{name}}\n{{endfor}}'
                    ),
                    "以下人员:\n人物: 张三\n人物: 李四\n人物: 王五\n"
                );
                strictEqual( // 测试数组带序号遍历
                    convert(
                        { peoplelist: ["张三", "李四", "王五"] },
                        '{{for sn, name in peoplelist}}人物{{sn+1}}:{{name}}\n{{endfor // sn, name}}'
                    ),
                    '人物1:张三\n人物2:李四\n人物3:王五\n'
                );
            });
            test('for in 对象', () => {
                strictEqual( // 测试对象遍历
                    convert(
                        { person: { "name": "张三", "age": 18, "gender": "男" } },
                        '人员:\n{{for prop in person}}{{prop}}\n{{endfor}}'
                    ),
                    "人员:\n张三\n18\n男\n"
                );
                strictEqual( // 测试对象带键值遍历
                    convert(
                        { person: { "name": "张三", "age": 18, "gender": "男" } },
                        '人员:\n{{for pname, prop in person}}{{pname}}:{{prop}}\n{{endfor}}'
                    ),
                    "人员:\nname:张三\nage:18\ngender:男\n"
                );
            });
            test('for 表达式中有空白符', () => {
                strictEqual( // 表达式中有回车
                    convert({}, `{{\n   \nfor sn, name\n in ["张三", \n"李四", "王五"]\n}}人物{{sn}}:{{name}}\n{{\nendfor \n//sn, name\n}}`),
                    '人物0:张三\n人物1:李四\n人物2:王五\n'
                );
            });
        });
        suite('{{if}} condition', () => {
            test('if condition', () => {
                strictEqual(
                    convert({}, ' {{if "name".length \n>\n0   }}\n人物: {{"XX"}}{{endif}}'),
                    " \n人物: XX"
                );
                strictEqual(
                    convert({
                        "name": "吴七"
                    }, '{{if \nname}}{{name}}{{ endif \n// comment}}'),
                    "吴七"
                );
            });
        });
        suite('other', () => {
            test('// comment', () => {
                strictEqual(
                    convert({}, '{{// let \nr = \n\t5*8/2 }}'),
                    ""
                );
                strictEqual(
                    convert({}, '{{\n \n// begin with blank lines }}'),
                    ""
                );
                strictEqual(
                    convert(
                        {list: [1, 2, 3]},
                        '{{\n \n// comment\nfor i in list//}}{{i}}{{endfor}}'),
                    "123"
                );
            });
            test('空替换符 {{ }} 不输出', () => {
                strictEqual(
                    convert({}, '{{ }}abc{{\t\n}}test\n'),
                    "abctest\n"
                );
            });
            test('取消末尾换行', () => {
                strictEqual(
                    convert({}, '{{// comment}}_\r\n_\n\n_\ntest\n'),
                    "\n_\ntest\n"
                );
            });
        });
    });
    suite('模板语法纠错', () => {
        test('表达式错误', () => {
            throws(() => { // 测试表达式不合法
                convert({}, '{{a ** b}}');
            }, SyntaxError);
        });
        test('使用了不支持的语法', () => {
            throws(() => {
                convert({}, '{{ a++ }}{{ c <<= d }}');
            }, SyntaxError);
            throws(() => {
                convert({}, '{{b = a => a+1}}');
            }, SyntaxError);
        });
        test('if for 指令错误', () => {
            throws(() => {
                convert({}, '{{if9>0}}9>0{{endif}}');
            }, SyntaxError);
            throws(() => {
                convert({}, '{{if 9>0}}9>0{{endif9>0}}');
            }, SyntaxError);
            throws(() => {
                convert({}, '{{fora in [0,1,2]}}{{a}}{{endfor}}');
            }, SyntaxError);
            throws(() => {
                convert({}, '{{for no in [0,1,2]}}{{no}}{{endforno}}');
            }, SyntaxError);
            throws(() => {
                convert({}, '{{if   }}if{{endif}}');
            }, SyntaxError);
            throws(() => {
                convert({}, '{{for   }}if{{endif}}');
            }, SyntaxError);
        });
        test('for endfor 不匹配', () => {
            throws(() => {
                convert({}, '{{for name in ["张三", "李四", "王五"]}}人物: {{name}}');
            }, SyntaxError);
            throws(() => {
                convert({}, '以下人员:{{if "赵六" in ["张三", "李四", "王五"]}}\n人物: {{name}}{{endfor}}');
            }, SyntaxError);
        });
        test('if endif 不匹配', () => {
            throws(() => {
                convert({}, '以下人员:{{if "赵六" in ["张三", "李四", "王五"]}}\n人物: {{name}}');
            }, SyntaxError);
            throws(() => {
                convert({}, '{{for name in ["张三", "李四", "王五"]}}人物: {{name}}{{endif}}');
            }, SyntaxError);
        });
        test('{{ 与 }} 配对不正确', () => {
            throws(() => {
                convert({}, 'r11: {{// {{r12}} r13');
            }, SyntaxError);
            throws(() => {
                convert({}, 'r21: {{name r22');
            }, SyntaxError);
            throws(() => {
                convert({}, 'r31 }}{{name}} r32');
            }, SyntaxError);
            throws(() => {
                convert({}, 'r41: {{name}}r42 }} r43');
            }, SyntaxError);
        });
    });
});
