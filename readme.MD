# 模板替换

# 安装
npm install gooconverter

# 例子
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
station ID: {{ID}}
people:{{ #for people in peoples}}{{ #if people.age > 18  }}
* {{people.name}}{{#endif}}{{ #endfor}}
`
console.log(convert(tags, template));
```
则输出：
```plaintext
station: GD8
station ID: 8078
people:
* 李四
* 王五
* 赵六

```

如果要应用多条转换并各自输出到文件，用 convert2file 函数，见 test/example.entry.js
