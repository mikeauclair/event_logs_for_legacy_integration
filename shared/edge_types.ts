export type Person = {
  id: number,
  age: number,
  years_licensed: number,
  name: string,
  ssn: string
}

export type Vehicle = {
  id: number,
  make: string,
  model: string,
  year: number,
  vin: string
}

export type LegacyInput = {
  people: Person[],
  vehicles: Vehicle[]
}

export type Exclusion = {
  driver_id: number,
  vehicle_id: number
}

export type Group = {
  id: number
  vehicles: Vehicle[]
  drivers: Person[]
  limit?: number
}

export type Output = {
  groups: Group[]
  exclusions: Exclusion[]
}
