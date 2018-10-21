let legacy_input = {
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

let events = [
  ["set", "exclude", 1, 2],
  ["set", "group", 1, [1, 2]],
  ["set", "group", 2, [3]],
  ["set", "groupLimit", 1, 30000],
  ["set", "groupLimit", 2, 50000],
  ["set", "vehicleGroupAssignment", 1, 1],
  ["set", "vehicleGroupAssignment", 1, 2]
];

let output = {
  groups: [],
  exclusions: []
};

let handleSet = e => {
  switch (e[1]) {
    case "exclude":
      output.exclusions.push({ driver_id: e[2], vehicle_id: e[3] });
      break;
    case "group":
      output.groups.push({
        id: e[2],
        vehicles: [],
        drivers: e[3].map(pid => {
          legacy_input.people.find(p => p.id === pid);
        })
      });
      break;
    case "groupLimit":
      output.groups.find(g => g.id === e[2]).limit = e[3];
      break;
    case "vehicleGroupAssignment":
      output.groups
        .find(g => g.id === e[2])
        .vehicles.push(legacy_input.vehicles.find(v => v.id === e[3]));
      break;
  }
};

events.forEach(e => {
  switch (e[0]) {
    case "set":
      handleSet(e);
      break;
  }
});

console.log(JSON.stringify(output));
