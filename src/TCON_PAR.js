import {numberBytes} from "../lib/converter.js"

export let rules = [{
    "name": "GD8",
    "outfile": "TCON_PAR.awl",
    "vars":{
        "node_name":"GD8",
        "id": 1,
        "active_est": false,
        "local_tsap_id": numberBytes(2000),
        "rem_staddr": [192,168,7,18],
        "rem_tsap_id": numberBytes(2000),
    },
}, {
    "name": "GD9",
    "outfile": "TCON_PAR.awl",
    "append": true,
    "vars":{
        "node_name":"GD9",
        "id": 2,
        "active_est": false,
        "local_tsap_id": numberBytes(2000),
        "rem_staddr": [192,168,7,19,],
        "rem_tsap_id": numberBytes(2000),
    },
}, {
    "name": "YA7",
    "outfile": "TCON_PAR.awl",
    "append": true,
    "vars":{
        "node_name":"YA7",
        "id": 3,
        "active_est": false,
        "local_tsap_id": numberBytes(2000),
        "rem_staddr": [192,168,8,17,],
        "rem_tsap_id": numberBytes(2000),
    },
}, {
    "name": "YA1",
    "outfile": "TCON_PAR.awl",
    "append": true,
    "vars":{
        "node_name":"YA1",
        "id": 4,
        "active_est": false,
        "local_tsap_id": numberBytes(2000),
        "rem_staddr": [192,168,8,11,],
        "rem_tsap_id": numberBytes(2000),
    },
}, {
    "name": "JX7",
    "outfile": "TCON_PAR.awl",
    "append": true,
    "vars":{
        "node_name":"JX7",
        "id": 5,
        "active_est": false,
        "local_tsap_id": numberBytes(2000),
        "rem_staddr": [192,168,9,17,],
        "rem_tsap_id": numberBytes(2000),
    },
}, {
    "name": "JX1",
    "outfile": "TCON_PAR.awl",
    "append": true,
    "vars":{
        "node_name":"JX1",
        "id": 6,
        "active_est": false,
        "local_tsap_id": numberBytes(2000),
        "rem_staddr": [192,168,9,11,],
        "rem_tsap_id": numberBytes(2000),
    },
}, {
    "name": "DY8",
    "outfile": "TCON_PAR.awl",
    "append": true,
    "vars":{
        "node_name":"DY8",
        "id": 7,
        "active_est": false,
        "local_tsap_id": numberBytes(2000),
        "rem_staddr": [192,168,1,18,],
        "rem_tsap_id": numberBytes(2000),
    },
}, {
    "name": "DY9",
    "outfile": "TCON_PAR.awl",
    "append": true,
    "vars":{
        "node_name":"DY9",
        "id": 8,
        "active_est": false,
        "local_tsap_id": numberBytes(2000),
        "rem_staddr": [192,168,1,19,],
        "rem_tsap_id": numberBytes(2000),
    },
}];

export let template = `DATA_BLOCK "conn_{{node_name}}_DB"
{InstructionName := 'TCON_PAR';
 LibVersion := '1.0';
 S7_Optimized_Access := 'FALSE' }
AUTHOR : SIMATIC
FAMILY : MC7Plus
NAME : TCON_PAR
VERSION : 1.0
TCON_PAR

BEGIN
   id := {{id}};
   active_est := false;
   local_tsap_id_len := 2;
   rem_staddr_len := 4;
   rem_tsap_id_len := 2;
   local_tsap_id[1] := B#16#{{local_tsap_id[1]}};
   local_tsap_id[2] := B#16#{{local_tsap_id[0]}};
   local_tsap_id[3] := B#16#00;
   local_tsap_id[4] := B#16#00;
   local_tsap_id[5] := B#16#00;
   local_tsap_id[6] := B#16#00;
   local_tsap_id[7] := B#16#00;
   local_tsap_id[8] := B#16#00;
   local_tsap_id[9] := B#16#00;
   local_tsap_id[10] := B#16#00;
   local_tsap_id[11] := B#16#00;
   local_tsap_id[12] := B#16#00;
   local_tsap_id[13] := B#16#00;
   local_tsap_id[14] := B#16#00;
   local_tsap_id[15] := B#16#00;
   local_tsap_id[16] := B#16#00;
   rem_staddr[1] := {{rem_staddr[0]}};
   rem_staddr[2] := {{rem_staddr[1]}};
   rem_staddr[3] := {{rem_staddr[2]}};
   rem_staddr[4] := {{rem_staddr[3]}};
   rem_tsap_id[1] := B#16#{{rem_tsap_id[1]}};
   rem_tsap_id[2] := B#16#{{rem_tsap_id[0]}};
   rem_tsap_id[3] := B#16#00;
   rem_tsap_id[4] := B#16#00;
   rem_tsap_id[5] := B#16#00;
   rem_tsap_id[6] := B#16#00;
   rem_tsap_id[7] := B#16#00;
   rem_tsap_id[8] := B#16#00;
   rem_tsap_id[9] := B#16#00;
   rem_tsap_id[10] := B#16#00;
   rem_tsap_id[11] := B#16#00;
   rem_tsap_id[12] := B#16#00;
   rem_tsap_id[13] := B#16#00;
   rem_tsap_id[14] := B#16#00;
   rem_tsap_id[15] := B#16#00;
   rem_tsap_id[16] := B#16#00;

END_DATA_BLOCK

`;