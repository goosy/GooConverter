export let rules = [{
    "name": "GD8",
    "outfile": "commands.awl",
    "vars":{
        "node_name":"GD8",
        "nodeID": 8078,
    },
}, {
    "name": "GD9",
    "outfile": "commands.awl",
    "append": true,
    "vars":{
        "node_name":"GD9",
        "nodeID": 8079,
    },
}, {
    "name": "YA7",
    "outfile": "commands.awl",
    "append": true,
    "vars":{
        "node_name":"YA7",
        "nodeID": 8087,
    },
}, {
    "name": "YA1",
    "outfile": "commands.awl",
    "append": true,
    "vars":{
        "node_name":"YA1",
        "nodeID": 8081,
    },
}, {
    "name": "JX7",
    "outfile": "commands.awl",
    "append": true,
    "vars":{
        "node_name":"JX7",
        "nodeID": 8097,
    },
}, {
    "name": "JX1",
    "outfile": "commands.awl",
    "append": true,
    "vars":{
        "node_name":"JX1",
        "nodeID": 8091,
    },
}, {
    "name": "DY8",
    "outfile": "commands.awl",
    "append": true,
    "vars":{
        "node_name":"DY8",
        "nodeID": 8018,
    },
}, {
    "name": "DY9",
    "outfile": "commands.awl",
    "append": true,
    "vars":{
        "node_name":"DY9",
        "nodeID": 8019,
    },
}];

export let template = `DATA_BLOCK "commands_{{node_name}}"
{ S7_Optimized_Access := 'FALSE' }
VERSION : 0.1
   STRUCT 
      nodeID : Int;   // 节点ID
      stopPumps : Bool;   // 命令内容
      stopHeats : Bool;
      warnning : Bool;
      resetWarnning : Bool;
      reserve : Array[0..45] of Byte;
   END_STRUCT;


BEGIN
   nodeID := {{nodeID}};

END_DATA_BLOCK

`;
