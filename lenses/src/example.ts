import { payload as legacyInputInitial } from "../../shared/legacy_input_payloads/initial";
import { payload as legacyInputMissingPersonOne } from "../../shared/legacy_input_payloads/missing_person_one";
import { payload as legacyInputMissingPersonOneAndTwo } from "../../shared/legacy_input_payloads/missing_person_one_and_two";
import { event } from "../../shared/events";

import { handleInput } from "./handler";

// Use tuples for serialization compactness
let events: event[] = [
  ["setExclusion", 1, 2],
  ["setGroup", 1, [1, 2]],
  ["setGroup", 2, [3]],
  ["setGroupLimit", 1, 30000],
  ["setGroupLimit", 2, 50000],
  ["setVehicleGroupAssignment", 1, 1],
  ["setVehicleGroupAssignment", 1, 2],
  ["removeExclusion", 1, 2]
];

[
  legacyInputInitial,
  legacyInputMissingPersonOne,
  legacyInputMissingPersonOneAndTwo
].forEach(function(input) {
  let response = handleInput(input, events);
  console.log(JSON.stringify(response.output));
  console.log(JSON.stringify(response.messages));
  console.log(JSON.stringify(response.events));
  console.log("\n");
});
