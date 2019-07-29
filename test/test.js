import {
    convert,
    convert2file
} from "../src/index.js";

let template = `
{{#for i in 
    a                    }}a:
{{  #for ii in i}}    b: {{ii}}
{{ #endfor }}
{{ #endfor }}
{{ #if c[0]}}
c[0] is true
{{ #for i in c    }}c: {{i}}
{{ #endfor}}{{#elseif c[1]}}
c[1]
{ { #endif} }

end`;
let tags = {
    "a": [
        [3, 4, 5],
        ["ff"],
        ["8", "aa", "00"]
    ],
    "c": [true, false, false],
}
console.log(convert(tags,template));


let entry = {
    rules: [{
        "name": "GD8",
        "output_file": "commands.awl",
        tags
    }, ],
    template
};
(async function(){
    console.log(await convert2file(entry));
})();