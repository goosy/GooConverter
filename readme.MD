# 模板替换

## 安装

`npm install gooconverter`

## 替换

- 表达式替换
    计算表达式，并在所在位置替换成结果。可以在表达式中使用JS语法的运算符、方法。
    `{{表达式}}`
    在表达式中还可以使用转换器的唯一内置函数:
    `range(start, end, step)`
    参数为整数，输出一个从 start 开始，小于end，步长为 step 的数组。
- 赋值：
    建立一个新变量，并赋值表达式的值。赋值不会产生替换，可以在后继替换中使用新建变量。
    `{{varname = 表达式}}`
- 条件替换
    根据条件决定是否显示对应结果，`#elseif` `#else` 是可选的，`#elseif` 可以有多个。
    1. `{{#if 条件1}} 结果1 {{#endif}}`
    2. `{{#if 条件1}} 结果1 {{#else}}其它结果 {{#endif}}`
    3. `{{#if 条件1}} 结果1 {{#elseif 条件2}} 结果2 {{#else}}其它结果 {{#endif}}` 
- 循环替换
    - `{{#for value in object}} 内容:{{value}} {{#endfor}}`
        循环输出，遍历object的所有自身属性值（不是属性键值）。
    - `{{#for key, value in Object}} 键值:{{key}}, 属性值:{{value}} {{#endfor}}`
        同时遍历键和值，当object为Array时，键值为数字。
- `{{# 注释}}`
    仅用于说明上下文相关，不产生输出。

## 例子

```javascript
import {convert} from "gooconverter";
let tags = {
    "name": "GD8",
    "ID": 8078,
    "peoples": [{
        "name": '张三',
        "age": 15,
    }, {
        "name": '李四',
        "age": 22,
    }, {
        "name": '王五',
        "age": 19,
    }, {
        "name": '赵六',
        "age": 29,
    }]
};
let template = `group: {{name}}{{ID = ID-8000 }}{{# 说明：取ID后2位形成编号}}
ID: {{ID}}
adult:{{ #for people in peoples}}{{ #if people.age > 18  }}
- {{people.name}}{{#endif}}{{ #endfor}}
`
console.log(convert(tags, template));
```

则输出：

```plaintext
group: GD8
ID: 78
people:
- 李四
- 王五
- 赵六
```

如果要应用多条转换规则，用`convertRules`函数，见 ./example/example.entry.js
