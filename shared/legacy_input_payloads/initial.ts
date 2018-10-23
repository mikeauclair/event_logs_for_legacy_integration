import {LegacyInput} from '../edge_types';

export let payload: LegacyInput = {
  people: [
    {
      id: 1,
      age: 35,
      years_licensed: 18,
      name: "Jimmy Jams",
      ssn: "111-11-1111"
    },
    {
      id: 2,
      age: 34,
      years_licensed: 18,
      name: "Joanie Jams",
      ssn: "222-22-2222"
    },
    {
      id: 3,
      age: 17,
      years_licensed: 1,
      name: "Jimmy Jams II",
      ssn: "333-33-3333"
    }
  ],
  vehicles: [
    {
      id: 1,
      make: "GMC",
      model: "Sonoma",
      year: 2005,
      vin: "12345678901234"
    },
    {
      id: 2,
      make: "Chevy",
      model: "Sonoma",
      year: 2005,
      vin: "43210987654321"
    }
  ]
};
