export type EventCommand =
  | "setExclusion"
  | "removeExclusion"
  | "setGroup"
  | "setGroupLimit"
  | "setVehicleGroupAssignment"
  | "noop";

export type Target = number;
// Really this could be number | number[] | event, but you run into having to add interface indirection
// see: https://github.com/Microsoft/TypeScript/issues/3496#issuecomment-128553540
export type Value = any;

export enum EventIndex {
  EventCommand,
  Target,
  Value
}

export type event = [EventCommand, Target, Value];
