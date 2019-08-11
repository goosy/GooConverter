# 模板替换

## 安装
npm install gooconverter

## 替换宏

* {{表达式}}
    计算表达式，并在所在位置替换成结果
* {{#var 赋值表达式}}
    形成一个新的变量，加入到tags里。
* {{#if 条件1}}结果1 {{#elseif 条件2}} 结果2 {{#else}}其它结果 {{#endif}}
    根据条件决定是否显示对应结果，#elseif #else 是可选的
* {{#for 变量 in 枚举范围}} {{变量}} {{#endfor}}
    循环输出，遍历所有的枚举
* {{# 注释}}
    仅用于说明上下文相关，不产生输出

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
{{#var ID = ID-8000 }}{{# 说明：取ID后2位形成编号
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

如果要应用多条转换并各自输出到文件，用 convert2file 函数，见 ./example/example.entry.js
