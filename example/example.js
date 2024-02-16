import { convert } from "../src/index.js";

let tags = {
    "tyrants": [{
        "name": "腊肉",
        "ID": 18931226,
        "peoples": [
            { name: 'JQ', age: 68 },
            { name: 'ZCC', age: 61 },
            { name: 'YWY', age: 56 },
            { name: 'WHW', age: 45 },
            { name: 'MJY', age: 38 },
            { name: 'WXJ', age: 38 },
            { name: 'WHR', age: 38 },
            { name: 'ZYF', age: 34 },
            { name: 'XJY', age: 33 },
        ]
    }, {
        "name": "包子",
        "ID": 19530615,
        "peoples": [],
    }]
};

let template = `{{no = 0}}_
{{#for tyrant in tyrants}}_
这是一个关于{{tyrant.name}}的测试

{{tyrant.name}}的ID: {{tyrant.ID}}
{{#if tyrant.peoples.length==0}}_
**手下没人!**
{{#else}}_
身边的打手(大于40岁):
{{  #for people in tyrant.peoples}}{{no=no+1}}_
{{   #if people.age > 40 }}_
* {{no}}:{{people.name}}
{{   #endif people.age}}_
{{  #endfor}}_
{{#endif}}_

{{#endfor}}`
console.log(convert(tags, template));
