# 模板替换

# 安装
npm install gooconverter

# 例子
```javascript
import {converter} from "gooconverter";
let entry = {
    "rules": [{
        "name": "GD8",
        "output_file": "GD8.txt",
        "tags": {
            "node_name": "GD8",
            "nodeID": 8078,
            "peoples": [{
                "name": '张三',
                "age": 19,
            }, {
                "name": '张三',
                "age": 19,
            }]
        },
    }, {
        "name": "GD9",
        "output_file": "Node_Data.awl",
        "option": {
            "append": true
        },
        "tags": {
            "node_name": "GD9",
            "nodeID": 8079,
        },
    }],
    template: `station: {{node_name}}
station ID: {{nodeID}}
people:{{ #for people in peoples}}{{ #if people.age > 18  }}
* {{people.name}}
{{#endif}}{{ #endfor}}
`
}
console.log(converter(entry));
```
则输出：
```js
Promise {
  [
    'station: GD8\nstation ID: 8078\npeople:\n\n* 张三\n\n',
    'station: GD9\nstation ID: 8079\npeople:\n\n* 王五\n\n* 赵六\n\n'
  ]
}
```
