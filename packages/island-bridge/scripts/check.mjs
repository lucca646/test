#!/usr/bin/env node
import { interpret } from "../src/interpret.js";
import { normalizeCommand } from "../src/protocol.js";

let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed += 1;
  } else {
    console.log("OK:", msg);
  }
}

// interpret("mode score\nstart\nphase 2")
const { commands, errors } = interpret("mode score\nstart\nphase 2");
assert(errors.length === 0, "interpret: no errors");
assert(commands.length === 3, "interpret: 3 commands");
assert(commands[0]?.op === "mode" && commands[0]?.mode === "score", "interpret: mode score");
assert(commands[1]?.op === "start", "interpret: start");
assert(commands[2]?.op === "phase" && commands[2]?.delta === 2, "interpret: phase delta 2");

// normalizeCommand({op:"mode",mode:"nope"}) has error
const badMode = normalizeCommand({ op: "mode", mode: "nope" });
assert(badMode.error != null, "normalizeCommand: invalid mode returns error");

// normalizeCommand({op:"phase",delta:3}).value.delta === 3
const phase = normalizeCommand({ op: "phase", delta: 3 });
assert(phase.value?.delta === 3, "normalizeCommand: phase delta 3");

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}

console.log("\nAll checks passed");
process.exit(0);
