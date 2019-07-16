export let rules = [{
    "name": "GD8",
    "outfile": "process_node_GD8.awl",
    "vars":{
        "node_name":"GD8",
        "conn_DB_No": 1,
        "send_DB_No": 21,
        "recv_DB_No": 11,
        "SectionData": "Section78Data",
        "LineData": "Line781Data",
    },
}, {
    "name": "GD9",
    "outfile": "process_node_GD9.awl",
    "vars":{
        "node_name":"GD9",
        "conn_DB_No": 2,
        "send_DB_No": 22,
        "recv_DB_No": 12,
        "SectionData": "Section79Data",
        "LineData": "Line791Data",
    },
}, {
    "name": "YA7",
    "outfile": "process_node_YA7.awl",
    "vars":{
        "node_name":"YA7",
        "conn_DB_No": 3,
        "send_DB_No": 23,
        "recv_DB_No": 13,
        "SectionData": "Section78Data",
        "LineData": "Line781Data",
    },
}, {
    "name": "YA1",
    "outfile": "process_node_YA1.awl",
    "vars":{
        "node_name":"YA1",
        "conn_DB_No": 4,
        "send_DB_No": 24,
        "recv_DB_No": 14,
        "SectionData": "Section81Data",
        "LineData": "Line781Data",
    },
}, {
    "name": "JX7",
    "outfile": "process_node_JX7.awl",
    "vars":{
        "node_name":"JX7",
        "conn_DB_No": 5,
        "send_DB_No": 25,
        "recv_DB_No": 15,
        "SectionData": "Section79Data",
        "LineData": "Line791Data",
    },
}, {
    "name": "JX1",
    "outfile": "process_node_JX1.awl",
    "vars":{
        "node_name":"JX1",
        "conn_DB_No": 6,
        "send_DB_No": 26,
        "recv_DB_No": 16,
        "SectionData": "Section91Data",
        "LineData": "Line791Data",
    },
}, {
    "name": "DY8",
    "outfile": "process_node_DY8.awl",
    "vars":{
        "node_name":"DY8",
        "conn_DB_No": 7,
        "send_DB_No": 27,
        "recv_DB_No": 17,
        "SectionData": "Section81Data",
        "LineData": "Line781Data",
    },
}, {
    "name": "DY9",
    "outfile": "process_node_DY9.awl",
    "vars":{
        "node_name":"DY9",
        "conn_DB_No": 8,
        "send_DB_No": 28,
        "recv_DB_No": 18,
        "SectionData": "Section91Data",
        "LineData": "Line791Data",
    },
}];

export let template = `FUNCTION_BLOCK "process_node_{{node_name}}"
{ S7_Optimized_Access := 'FALSE' }
VERSION : 0.1
   VAR_INPUT 
      TCON_REQ : Bool;
      TSEND_REQ : Bool;
      TRCV_ENR : Bool;
      TDISCON_REQ : Bool;
   END_VAR

   VAR 
      TCON_DONE : Bool;
      TCON_BUSY : Bool;
      TCON_ERROR : Bool;
      TSEND_DONE : Bool;
      TSEND_BUSY : Bool;
      TSEND_ERROR : Bool;
      TRCV_NDR : Bool;
      TRCV_BUSY : Bool;
      TRCV_ERROR : Bool;
      TDISCON_DONE : Bool;
      TDISCON_BUSY : Bool;
      TDISCON_ERROR : Bool;
      TCON_STATUS : Word;
      TSEND_STATUS : Word;
      TRCV_STATUS : Word;
      TDISCON_STATUS : Word;
      comm_TOF {InstructionName := 'TOF'; LibVersion := '1.0'} : TOF;
      time_TOF : Time := T#5S;
      pump1_run_prev : Bool;
      pump2_run_prev : Bool;
      pump3_run_prev : Bool;
      pump4_run_prev : Bool;
      pump5_run_prev : Bool;
   END_VAR

   VAR_TEMP 
      comm_ok : Bool;
   END_VAR


BEGIN
NETWORK
TITLE = connect
      CALL TCON, "TCON_DB_{{node_name}}"
      {con_type := 'Any', id_type := 'Word'}
      (  REQ                         := #TCON_REQ , 
         ID                          := "conn_{{node_name}}_DB".id , 
         DONE                        := #TCON_DONE , 
         BUSY                        := #TCON_BUSY , 
         ERROR                       := #TCON_ERROR , 
         STATUS                      := #TCON_STATUS , 
         CONNECT                     := P#DB{{conn_DB_No}}.DBX0.0 BYTE 64
      );
      NOP 0;
NETWORK
TITLE = send commander
      CALL TSEND, "TSEND_DB_{{node_name}}"
      {data_type := 'Any', len_type := 'Int', id_type := 'Word'}
      (  REQ                         := #TSEND_REQ , 
         ID                          := "conn_{{node_name}}_DB".id , 
         LEN                         := 50 , 
         DONE                        := #TSEND_DONE , 
         BUSY                        := #TSEND_BUSY , 
         ERROR                       := #TSEND_ERROR , 
         STATUS                      := #TSEND_STATUS , 
         DATA                        := P#DB{{send_DB_No}}.DBX0.0 BYTE 50
      );

NETWORK
TITLE = receive data from {{node_name}}
      CALL TRCV, "TRCV_DB_{{node_name}}"
      {ptr_type := 'Any', value_type := 'Int', id_type := 'Word'}
      (  EN_R                        := #TRCV_ENR , 
         ID                          := "conn_{{node_name}}_DB".id , 
         LEN                         := 50 , 
         NDR                         := #TRCV_NDR , 
         BUSY                        := #TRCV_BUSY , 
         ERROR                       := #TRCV_ERROR , 
         STATUS                      := #TRCV_STATUS , 
         DATA                        := P#DB{{recv_DB_No}}.DBX0.0 BYTE 50
      );

NETWORK
TITLE = communication status
      A #TRCV_NDR;
      A "Node_{{node_name}}_Data".Comm_OK;
      = #comm_ok;
      CALL #comm_TOF
      {time_type := 'Time'}
      (  IN                          := #comm_ok , 
         PT                          := #time_TOF , 
         Q                           := "Node_{{node_name}}_Data".Comm_OK
      );

NETWORK
TITLE = disconnect
      CALL TDISCON, "TDISCON_DB_{{node_name}}"
      {id_type := 'Word'}
      (  REQ                         := #TDISCON_REQ , 
         ID                          := "conn_{{node_name}}_DB".id , 
         DONE                        := #TDISCON_DONE , 
         BUSY                        := #TDISCON_BUSY , 
         ERROR                       := #TDISCON_BUSY , 
         STATUS                      := #TDISCON_STATUS
      );

NETWORK
TITLE = pump run edge
      O(;
      X "Node_{{node_name}}_Data".pump_Run1;
      X #pump1_run_prev;
      );
      O(;
      X "Node_{{node_name}}_Data".pump_Run2;
      X #pump2_run_prev;
      );
      O(;
      X "Node_{{node_name}}_Data".pump_Run3;
      X #pump3_run_prev;
      );
      O(;
      X "Node_{{node_name}}_Data".pump_Run4;
      X #pump4_run_prev;
      );
      O(;
      X "Node_{{node_name}}_Data".pump_Run5;
      X #pump5_run_prev;
      );
      S "{{SectionData}}".PumpChangeTrigger1;//输出到段的泵状态改变

      A "Node_{{node_name}}_Data".pump_Run1;
      = #pump1_run_prev;
      A "Node_{{node_name}}_Data".pump_Run2;
      = #pump2_run_prev;
      A "Node_{{node_name}}_Data".pump_Run3;
      = #pump3_run_prev;
      A "Node_{{node_name}}_Data".pump_Run4;
      = #pump4_run_prev;
      A "Node_{{node_name}}_Data".pump_Run5;
      = #pump5_run_prev;

NETWORK
TITLE = update pump run status
      O "Node_{{node_name}}_Data".pump_Run1;
      O "Node_{{node_name}}_Data".pump_Run2;
      O "Node_{{node_name}}_Data".pump_Run3;
      O "Node_{{node_name}}_Data".pump_Run4;
      O "Node_{{node_name}}_Data".pump_Run5;
      = "{{SectionData}}".node1_pump_run;

NETWORK
TITLE = stop pump
      A "{{LineData}}".lineStopCmd;
      A "{{SectionData}}".node1_pump_run;
      = "commands_{{node_name}}".stopPumps;

END_FUNCTION_BLOCK

`
