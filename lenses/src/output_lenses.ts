import { Lens, Arrays, Prism } from "@atomic-object/lenses";

import { Person, Vehicle, Exclusion, Group } from "../../shared/edge_types";

import { Output as Output } from "../../shared/edge_types";

interface IDable {
  id: number;
}

function findIndexByID<T extends IDable>(
  collection: T[],
  id: number
): number {
  return collection.findIndex(c => c.id === id);
}

export namespace OutputLens {
  export const groups = Lens.from<Output>().prop("groups");
  export const exclusions = Lens.from<Output>().prop("exclusions");
  export const groupByID = (o: Output, id: number) => {
    const index = findIndexByID(OutputLens.groups.get(o), id);
    return Prism.comp(OutputLens.groups, Arrays.index<Group>(index));
  };
  export const limitForGroup = Lens.from<Group>().prop("limit");
  export const vehiclesForGroup = Lens.from<Group>().prop("vehicles");
}

