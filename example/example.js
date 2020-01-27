import {convert} from "../src/index.js";

let tags = {
    "tyrants":[{
        "name": "腊肉",
        "ID": 38,
        "peoples": [
            {"name": '张三', "age": 15}, 
            {"name": '李四', "age": 22}, 
            {"name": '王五', "age": 19}, 
            {"name": '赵六', "age": 29},
        ]
    },{
        "name": "包子",
        "ID": 89,
        "peoples": [],
    }]
};

let template = `{{no = 0}}{{#for tyrant in tyrants
}}这是一个关于{{tyrant.name}}的测试

{{tyrant.name}}的ID: {{tyrant.ID}}
{{#if tyrant.peoples.length==0}}**手下没人!**
{{#else}}身边的打手(大于18岁):{{ #for people in tyrant.peoples}}{{no=no+1}}{{ #if people.age > 18  }}
* {{no}}:{{people.name}}{{#endif}}{{ #endfor}}
{{#endif}}

{{#endfor}}`
console.log(convert(tags, template));
