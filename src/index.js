import {
    converter
} from "../lib/converter.js";
import {
    rules as proc_rules,
    template as proc_temp
} from "./process_node.js";
import {
    rules as tcon_rules,
    template as tcon_temp
} from "./TCON_PAR.js";
import {
    rules as cmd_DB_rules,
    template as cmd_DB_temp
} from "./commands.js";
import {
    rules as node_DB_rules,
    template as node_DB_temp
} from "./Node_Data.js";

converter(proc_rules, proc_temp);
converter(tcon_rules, tcon_temp);
converter(cmd_DB_rules, cmd_DB_temp);
converter(node_DB_rules, node_DB_temp);
