import { Prism, Arrays } from "@atomic-object/lenses";

import {
  Person,
  Vehicle,
  LegacyInput,
  Exclusion,
  Group,
  Output
} from "../../shared/edge_types";

import { OutputLens } from "./output_lenses";

import {
  EventCommand,
  Target,
  Value,
  EventIndex,
  event
} from "../../shared/events";

type Message = {
  level: "NOTIFY" | "WARN" | "ERROR";
  content: string;
};

interface EventResponse {
  output: Output;
  message?: Message;
  event: event;
}

type HandlerResult = {
  outputs: Output[];
  messages: Message[];
  events: event[];
};

// Force exhaustiveness checking via the `never` type
const assertNever = (x: never, label: string): never => {
  throw new Error("Unexpected " + label + ": " + x);
};

// noop events should contain the operation they replaced in the value for debugging purposes
const noopFor = (e: event) => {
  let output: event = ["noop", 0, e];
  return output;
};

interface IDable {
  id: number;
}

function findByID<T extends IDable>(
  collection: T[],
  id: number
): T | undefined {
  return collection.find(c => c.id === id);
}

const lookupDrivers = (input: LegacyInput, ids: number[]): Person[] => {
  return ids.reduce((accum: Person[], pid: number) => {
    let driver = findByID(input.people, pid);
    if (driver) {
      return Arrays.push(accum, driver);
    }
    return accum;
  }, []);
};

const handleCommand = (
  legacyInput: LegacyInput,
  e: event,
  output: Output
): EventResponse => {
  let eventType = e[EventIndex.EventCommand];
  let response: EventResponse = { output, event: e };

  switch (eventType) {
    case "setExclusion":
      var driver = findByID(legacyInput.people, e[EventIndex.Target]);
      var vehicle = findByID(legacyInput.vehicles, e[EventIndex.Value]);
      if (!driver || !vehicle) {
        response.event = noopFor(e);
        response.message = { level: "NOTIFY", content: "Exclusion Removed" };
        break;
      }
      var lens = OutputLens.exclusions;
      var newExclusions = Arrays.push(lens.get(output), {
        driver_id: driver.id,
        vehicle_id: vehicle.id
      });
      response.output = lens.set(output, newExclusions);
      break;
      
    case "removeExclusion":
      var driver = findByID(legacyInput.people, e[EventIndex.Target]);
      var vehicle = findByID(legacyInput.vehicles, e[EventIndex.Value]);
      if (!driver || !vehicle) {
        response.event = noopFor(e);
        response.message = {
          level: "NOTIFY",
          content: "Exclusion Not Removed"
        };
        break;
      }
      var lens = OutputLens.exclusions;
      var newExclusions = lens.get(output).filter(r => {
        r.driver_id !== driver!.id || r.vehicle_id !== vehicle!.id;
      });
      response.output = lens.set(output, newExclusions);
      break;

    case "setGroup":
      let drivers = lookupDrivers(legacyInput, e[EventIndex.Value]);
      if (!drivers.length) {
        response.event = noopFor(e);
        response.message = {
          level: "WARN",
          content: "This group is invalid because all drivers have been removed"
        };
        break;
      }
      var newGroup = {
        id: e[EventIndex.Target],
        vehicles: [],
        drivers: drivers
      };
      response.output = OutputLens.groups.set(output, Arrays.push(OutputLens.groups.get(output), newGroup));
      if (drivers.length === e[EventIndex.Value].length) break;
      response.event = [
        "setGroup",
        e[EventIndex.Target],
        drivers.map((d: any) => d.id)
      ];
      response.message = {
        level: "WARN",
        content: "Some drivers were removed from this group"
      };
      break;

    case "setGroupLimit":
      var gl = OutputLens.groupByID(output, e[EventIndex.Target]);
      var group = gl.get(output);
      if (!group) {
        response.event = noopFor(e);
        response.message = { level: "NOTIFY", content: "Limit removed" };
        break;
      }
      response.output = Prism.comp(gl, OutputLens.limitForGroup).set(output, e[EventIndex.Value]);
      break;

    case "setVehicleGroupAssignment":
      var gl = OutputLens.groupByID(output, e[EventIndex.Target]);
      var group = gl.get(output);
      if (group) {
        let vehicle = findByID(legacyInput.vehicles, e[EventIndex.Value]);
        let vehicleLens = Prism.comp(gl, OutputLens.vehiclesForGroup);
        let vehicles = vehicleLens.get(output)
        if (vehicle && vehicles) {
          response.output = vehicleLens.set(output, Arrays.push(vehicles, vehicle));
          break;
        }
        response.message = {
          level: "WARN",
          content: "Vehicle has been removed"
        };
      } else {
        response.message = {
          level: "ERROR",
          content: "Vehicle no longer assigned, group removed"
        };
      }
      response.event = noopFor(e);
      break;

    case "noop":
      break;
    default:
      assertNever(eventType, "parameter");
  }
  return response;
};

export const handleInput = (
  input: LegacyInput,
  events: event[]
): HandlerResult => {
  let outputs: Output[] = [{
    groups: [],
    exclusions: []
  }];
  let response: EventResponse;

  let messages: Message[] = [];
  let newEvents: event[] = [];
  for (var event of events) {
    response = handleCommand(input, event, outputs[outputs.length-1]);
    outputs.push(response.output);
    newEvents.push(response.event);
    if (response.message) {
      if (response.message.level === "ERROR") {
        // We don't want to drown the user in messages, so we swap out all but the last message
        messages = [response.message];
        break;
      }
      messages.push(response.message);
    }
  }
  return { outputs, messages, events: newEvents };
};
