export let rules = [{
   "name": "GD8",
   "outfile": "Node_Data.awl",
   "vars": {
      "node_name": "GD8",
      "nodeID": 8078,
   },
}, {
   "name": "GD9",
   "outfile": "Node_Data.awl",
   "append": true,
   "vars": {
      "node_name": "GD9",
      "nodeID": 8079,
   },
}, {
   "name": "YA7",
   "outfile": "Node_Data.awl",
   "append": true,
   "vars": {
      "node_name": "YA7",
      "nodeID": 8087,
   },
}, {
   "name": "YA1",
   "outfile": "Node_Data.awl",
   "append": true,
   "vars": {
      "node_name": "YA1",
      "nodeID": 8081,
   },
}, {
   "name": "JX7",
   "outfile": "Node_Data.awl",
   "append": true,
   "vars": {
      "node_name": "JX7",
      "nodeID": 8097,
   },
}, {
   "name": "JX1",
   "outfile": "Node_Data.awl",
   "append": true,
   "vars": {
      "node_name": "JX1",
      "nodeID": 8091,
   },
}, {
   "name": "DY8",
   "outfile": "Node_Data.awl",
   "append": true,
   "vars": {
      "node_name": "DY8",
      "nodeID": 8018,
   },
}, {
   "name": "DY9",
   "outfile": "Node_Data.awl",
   "append": true,
   "vars": {
      "node_name": "DY9",
      "nodeID": 8019,
   },
}];

export let template=`DATA_BLOCK "Node_{{node_name}}_Data"
{ S7_Optimized_Access := 'FALSE' }
VERSION : 0.1
   STRUCT 
      nodeID : Int;   // 节点ID
      Work_OK : Bool;   // 节点工作正常
      Comm_OK : Bool;   // 通讯正常
      pump_Run1 : Bool;   // 本段泵1状态
      pump_Run2 : Bool;   // 本段泵2状态
      pump_Run3 : Bool;   // 本段泵3状态
      pump_Run4 : Bool;   // 本段泵4状态
      pump_Run5 : Bool;   // 本段泵5状态
      heater1_run : Bool;   // 加热炉1运行
      heater2_run : Bool;   // 炉2
      heater3_run : Bool;   // 炉3
      heater4_run : Bool;   // 炉4
      heater5_run : Bool;   // 炉5
      year : Byte;   // 对应的BCD值
      month : Byte;   // BCD
      day : Byte;   // BCD
      hour : Byte;   // BCD
      minute : Byte;   // BCD
      second : Byte;   // BCD
      ms : Word;   // BCD
      temperature : Real;   // 温度
      press1 : Real;   // 压力
      flowmeter : Real;   // 流量
      reserve : Array[0..25] of Byte;
   END_STRUCT;


BEGIN
   nodeID := {{nodeID}};
   Comm_OK := TRUE;
   year := BYTE#16#99;
   month := BYTE#16#99;
   day := BYTE#16#99;
   hour := BYTE#16#99;
   minute := BYTE#16#99;
   second := BYTE#16#99;

END_DATA_BLOCK
`
