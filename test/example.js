import {convert} from "../lib/index.js";
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