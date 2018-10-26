import {
  Person,
  Vehicle,
  LegacyInput,
  Exclusion,
  Group,
  Output
} from "../../shared/edge_types";

import { payload as legacyInputInitial } from "../../shared/legacy_input_payloads/initial.js";
import { payload as legacyInputMissingPersonOne } from "../../shared/legacy_input_payloads/missing_person_one.js";
import { payload as legacyInputMissingPersonOneAndTwo } from "../../shared/legacy_input_payloads/missing_person_one_and_two.js";

type Command = "set" | "remove" | "noop";
type TargetType =
  | "exclusion"
  | "group"
  | "groupLimit"
  | "vehicleGroupAssignment"
  | "none";
type Target = number;
// Really this could be number | number[] | event, but you run into having to add interface indirection
// see: https://github.com/Microsoft/TypeScript/issues/3496#issuecomment-128553540
type Value = any;

type Message = {
  level: "NOTIFY" | "WARN" | "ERROR";
  content: string;
};

interface HandlerResponse {
  output: Output;
  message?: Message;
  event: event;
}

enum EventIndex {
  Command,
  Type,
  Target,
  Value
}

type event = [Command, TargetType, Target, Value];

interface DriverLookupResult {
  found: Person[];
  missing: number[];
}

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

// Force exhaustiveness checking via the `never` type
const assertNever = (x: never, label: string): never => {
  throw new Error("Unexpected " + label + ": " + x);
};

const noopFor = (e: event) => {
  let output: event = ["noop", "none", 0, e];
  return output;
};

const handleSet = (
  legacyInput: LegacyInput,
  e: event,
  output: Output
): HandlerResponse => {
  let eventType = e[EventIndex.Type];
  switch (eventType) {
    case "exclusion":
      let driver = legacyInput.people.find(p => p.id === e[EventIndex.Target]);
      let vehicle = legacyInput.vehicles.find(
        v => v.id === e[EventIndex.Value]
      );
      if (!driver || !vehicle) {
        return {
          output,
          event: noopFor(e),
          message: { level: "NOTIFY", content: "Exclusion Removed" }
        };
      }
      output.exclusions.push({ driver_id: driver.id, vehicle_id: vehicle.id });
      return { output, event: e };
    case "group":
      let drivers = e[EventIndex.Value].reduce(
        (accum: DriverLookupResult, pid: number) => {
          let driver = legacyInput.people.find(p => p.id === pid);
          if (driver) {
            accum.found.push(driver);
          } else {
            accum.missing.push(pid);
          }
          return accum;
        },
        { found: [], missing: [] }
      );
      if (drivers.found.length) {
        output.groups.push({
          id: e[EventIndex.Target],
          vehicles: [],
          drivers: drivers.found
        });
        if (drivers.missing.length) {
          let newEvent: event = [
            "set",
            "group",
            e[EventIndex.Target],
            drivers.found.map((d: any) => d.id)
          ];
          return {
            output,
            event: newEvent,
            message: {
              level: "WARN",
              content: "Some drivers were removed from this group"
            }
          };
        } else {
          return { output, event: e };
        }
      } else {
        return {
          output,
          event: noopFor(e),
          message: {
            level: "WARN",
            content:
              "This group is invalid because all drivers have been removed"
          }
        };
      }
      break;
    case "groupLimit":
      var group = output.groups.find(g => g.id === e[EventIndex.Target]);
      if (group) {
        group.limit = e[EventIndex.Value];
        return { output, event: e };
      } else {
        return {
          output,
          event: noopFor(e),
          message: { level: "NOTIFY", content: "Limit removed" }
        };
      }
      break;
    case "vehicleGroupAssignment":
      var group = output.groups.find(g => g.id === e[EventIndex.Target]);
      if (group) {
        let vehicle = legacyInput.vehicles.find(
          v => v.id === e[EventIndex.Value]
        );
        if (vehicle) {
          group.vehicles.push(vehicle);
          return { output, event: e };
        } else {
          return {
            output,
            event: noopFor(e),
            message: { level: "WARN", content: "Vehicle has been removed" }
          };
        }
      } else {
        return {
          output,
          event: noopFor(e),
          message: {
            level: "ERROR",
            content: "Vehicle no longer assigned, group removed"
          }
        };
      }

      break;
    case "none":
      break;
    default:
      assertNever(eventType, "parameter");
  }
  return { output, event: e };
};

const handleRemove = (
  legacyInput: LegacyInput,
  e: event,
  output: Output
): HandlerResponse => {
  let eventType = e[EventIndex.Type];
  switch (eventType) {
    case "exclusion":
      let driver = legacyInput.people.find(p => p.id === e[EventIndex.Target]);
      let vehicle = legacyInput.vehicles.find(
        v => v.id === e[EventIndex.Value]
      );
      if (!driver || !vehicle) {
        return {
          output,
          event: noopFor(e),
          message: { level: "NOTIFY", content: "Exclusion Not Removed" }
        };
      }
      output.exclusions = output.exclusions.filter(r => {
        r.driver_id !== driver!.id || r.vehicle_id !== vehicle!.id;
      });
      return { output, event: e };
      break;
    case "group":
    case "groupLimit":
    case "vehicleGroupAssignment":
      throw new Error(`Parameter ${eventType} is invalid for command Remove`);
      break;
    case "none":
      break;
    default:
      assertNever(eventType, "parameter");
  }
  return { output, event: e };
};

const handleInput = (input: LegacyInput) => {
  let output: Output = {
    groups: [],
    exclusions: []
  };
  let response: HandlerResponse;

  let messages: Message[] = [];

  let newEvents = events.map(e => {
    switch (e[EventIndex.Command]) {
      case "set":
        response = handleSet(input, e, output);
        break;
      case "remove":
        response = handleRemove(input, e, output);
        break;
      case "noop":
        response = { output, event: noopFor(e) };
        break;
      default:
        throw "Invalid command: " + e[EventIndex.Command];
    }
    output = response.output;
    if (response.message) {
      if (response.message.level === "ERROR") {
        let err: any = new Error("Log Replay Error");
        err.replayMessage = response.message;
        throw err;
      }
      messages.push(response.message);
    }
    return response.event;
  });

  console.log(JSON.stringify(output));
  console.log(JSON.stringify(messages));
  console.log(JSON.stringify(newEvents));
  console.log("\n");
};

try {
  handleInput(legacyInputInitial);
  handleInput(legacyInputMissingPersonOne);
  handleInput(legacyInputMissingPersonOneAndTwo);
} catch (e) {
  console.log(e.message);
  console.log(JSON.stringify(e.replayMessage));
}
