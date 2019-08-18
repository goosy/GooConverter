# 模板替换

## 安装

`npm install gooconverter`

## 替换宏

* `{{表达式}}`
    计算表达式，并在所在位置替换成结果。
    赋值表达式不会产生替换，只建立更新变量。
    唯一在表达式中可以使用的方法（函数）为 range(start, end, step)，参数须为整数。
* `{{#if 条件1}}` 结果1 `{{#elseif 条件2}}` 结果2 `{{#else}`}其它结果 `{{#endif}}`
    根据条件决定是否显示对应结果，`#elseif` `#else` 是可选的，`#elseif` 可以有多个。
* `{{#for value in object}}` 属性值:`{{value}}` `{{#endfor}}`
    循环输出，遍历object的所有自身属性值（不是属性键值）。
    需要使用键值，使用语法： `{{#for key, value in Object}}` 键值:{{key}}, 属性值:`{{value}}` `{{#endfor}}`
    当object为Array时，键值为数字。
* `{{# 注释}}`
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
let template = `station: {{name}}
{{ID = ID-8000 }}{{# 说明：取ID后2位形成编号
}}station ID: {{ID}}
people:{{ #for people in peoples}}{{ #if people.age > 18  }}
* {{people.name}}{{#endif}}{{ #endfor}}
`
console.log(convert(tags, template));
```

则输出：

```plaintext
station: GD8
station ID: 78
people:
* 李四
* 王五
* 赵六
```

如果要应用多条转换规则，用`convertRules`函数，见 ./example/example.entry.js
