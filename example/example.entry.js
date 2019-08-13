import {convertRules} from  "../src/index.js";
let rules = [{
    "name": "Node_Data_GD8",
    "tags": {
        "node_name": "GD8",
        "nodeID": 8078,
        "peoples": [{
            "name": '张三',
            "age": 19,
        }, {
            "name": '李四',
            "age": 12,
        }]
    },
}, {
    "name": "Node_Data_GD9",
    "tags": {
        "node_name": "GD9",
        "nodeID": 8079,
        "peoples": [{
            "name": '王五',
            "age": 19,
        }, {
            "name": '赵六',
            "age": 29,
        }]
    },
}];

let template = `station: {{node_name}}
station ID: {{nodeID}}
people:
{{ #for people in peoples}}{{ #if people.age > 18  }}
* {{people.name}}{{#endif}}{{ #endfor}}
`;

for (const {name, content} of convertRules(rules, template)){
    console.log(`${name}\n=======`);
    console.log(content);
}
