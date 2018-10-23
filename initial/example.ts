import {Person, Vehicle, LegacyInput, Exclusion, Group, Output} from '../shared/edge_types'

import {payload as legacyInput} from '../shared/legacy_input_payloads/initial.js';

type Command = "set" | "remove";
type TargetType = 'exclusion' | 'group' | 'groupLimit' | 'vehicleGroupAssignment';
type Target = number;
type Value = any;

enum EventIndex {Command, Type, Target, Value}

type event = [Command, TargetType, Target, Value];

let events: event[] = [
  ["set", "exclusion", 1, 2],
  ["set", "group", 1, [1, 2]],
  ["set", "group", 2, [3]],
  ["set", "groupLimit", 1, 30000],
  ["set", "groupLimit", 2, 50000],
  ["set", "vehicleGroupAssignment", 1, 1],
  ["set", "vehicleGroupAssignment", 1, 2],
  ["remove", "exclusion", 1, 2]
];

let output: Output = {
  groups: [],
  exclusions: []
};

// Force exhaustiveness checking via the `never` type
function assertNever(x: never, label: string): never {
  throw new Error("Unexpected " + label + ": " + x);
}

let handleSet = (e: event) => {
  let eventType = e[EventIndex.Type];
  switch (eventType) {
    case "exclusion":
      output.exclusions.push({ driver_id: e[EventIndex.Target], vehicle_id: e[EventIndex.Value] });
      break;
    case "group":
      output.groups.push({
        id: e[EventIndex.Target],
        vehicles: [],
        drivers: e[EventIndex.Value].map((pid: number) => {
          legacyInput.people.find(p => p.id === pid);
        })
      });
      break;
    case "groupLimit":
      output.groups.find(g => g.id === e[EventIndex.Target]).limit = e[EventIndex.Value];
      break;
    case "vehicleGroupAssignment":
      output.groups
        .find(g => g.id === e[EventIndex.Target])
        .vehicles.push(legacyInput.vehicles.find(v => v.id === e[EventIndex.Value]));
      break;
    default:
      assertNever(eventType, "parameter");
  }
};

let handleRemove = (e: event) => {
  let eventType = e[EventIndex.Type];
  switch(eventType) {
    case "exclusion":
      output.exclusions = output.exclusions.filter(r => {
        r.driver_id !== e[EventIndex.Target] || r.vehicle_id !== e[EventIndex.Value]
      });
      break;
    case "group":
    case "groupLimit":
    case "vehicleGroupAssignment":
      throw new Error(`Parameter ${eventType} is invalid for command Remove`);
      break;
    default:
      assertNever(eventType, "parameter");
  }
}

events.forEach(e => {
  switch (e[EventIndex.Command]) {
    case "set":
      handleSet(e);
      break;
    case "remove":
      handleRemove(e);
      break;
    default:
      throw "Invalid command: " + e[EventIndex.Command]
  }
});

console.log(JSON.stringify(output));
