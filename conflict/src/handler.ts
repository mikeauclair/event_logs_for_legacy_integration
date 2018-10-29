import {
  Person,
  Vehicle,
  LegacyInput,
  Exclusion,
  Group,
  Output
} from "../../shared/edge_types";

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
  output: Output;
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
      accum.push(driver);
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
      output.exclusions.push({
        driver_id: driver.id,
        vehicle_id: vehicle.id
      });
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
      output.exclusions = output.exclusions.filter(r => {
        r.driver_id !== driver!.id || r.vehicle_id !== vehicle!.id;
      });
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
      output.groups.push({
        id: e[EventIndex.Target],
        vehicles: [],
        drivers: drivers
      });
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
      var group = findByID(output.groups, e[EventIndex.Target]);
      if (!group) {
        response.event = noopFor(e);
        response.message = { level: "NOTIFY", content: "Limit removed" };
        break;
      }
      group.limit = e[EventIndex.Value];
      break;

    case "setVehicleGroupAssignment":
      var group = findByID(output.groups, e[EventIndex.Target]);
      if (group) {
        let vehicle = findByID(legacyInput.vehicles, e[EventIndex.Value]);
        if (vehicle) {
          group.vehicles.push(vehicle);
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
  let output: Output = {
    groups: [],
    exclusions: []
  };
  let response: EventResponse;

  let messages: Message[] = [];
  let newEvents: event[] = [];
  for (var event of events) {
    response = handleCommand(input, event, output);
    output = response.output;
    if (response.message) {
      if (response.message.level === "ERROR") {
        // We don't want to drown the user in messages, so we swap out all but the last message
        messages = [response.message];
        break;
      }
      messages.push(response.message);
    }
    newEvents.push(response.event);
  }
  return { output, messages, events: newEvents };
};
