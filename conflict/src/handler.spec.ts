import { expect } from "chai";
import { describe, beforeEach, it } from "mocha";

import { payload as legacyInputInitial } from "../../shared/legacy_input_payloads/initial";
import { payload as legacyInputMissingPersonOne } from "../../shared/legacy_input_payloads/missing_person_one";
import { payload as legacyInputMissingPersonOneAndTwo } from "../../shared/legacy_input_payloads/missing_person_one_and_two";
import { event, EventIndex } from "../../shared/events";

import { handleInput } from "./handler";

describe("original events", () => {
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

  it("should have expected results for legacyInputInitial", () => {
    let response = handleInput(legacyInputInitial, events);

    expect(response.events).to.deep.equal(events);

    expect(response.messages).to.deep.equal([]);

    expect(response.output).to.deep.equal({
      groups: [
        {
          id: 1,
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
          ],
          drivers: [
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
            }
          ],
          limit: 30000
        },
        {
          id: 2,
          vehicles: [],
          drivers: [
            {
              id: 3,
              age: 17,
              years_licensed: 1,
              name: "Jimmy Jams II",
              ssn: "333-33-3333"
            }
          ],
          limit: 50000
        }
      ],
      exclusions: []
    });
  });

  it("should have expected results for missingPersonOne", () => {
    let response = handleInput(legacyInputMissingPersonOne, events);

    expect(response.events[0][EventIndex.EventCommand]).to.equal("noop");

    expect(response.events[1][EventIndex.Value]).to.deep.equal([2]);

    [2, 3, 4, 5, 6].forEach(index => {
      expect(response.events[index]).to.deep.equal(events[index]);
    });

    expect(response.events[7][EventIndex.EventCommand]).to.deep.equal("noop");

    expect(response.messages.map(m => m.level)).to.deep.equal([
      "NOTIFY",
      "WARN",
      "NOTIFY"
    ]);

    expect(response.output).to.deep.equal({
      groups: [
        {
          id: 1,
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
          ],
          drivers: [
            {
              id: 2,
              age: 34,
              years_licensed: 18,
              name: "Joanie Jams",
              ssn: "222-22-2222"
            }
          ],
          limit: 30000
        },
        {
          id: 2,
          vehicles: [],
          drivers: [
            {
              id: 3,
              age: 17,
              years_licensed: 1,
              name: "Jimmy Jams II",
              ssn: "333-33-3333"
            }
          ],
          limit: 50000
        }
      ],
      exclusions: []
    });
  });

  it("should have expected results for missingPersonOneAndTwo", () => {
    let response = handleInput(legacyInputMissingPersonOneAndTwo, events);

    expect(response.events).to.deep.equal([
      ["noop", 0, ["setExclusion", 1, 2]],
      ["noop", 0, ["setGroup", 1, [1, 2]]],
      ["setGroup", 2, [3]],
      ["noop", 0, ["setGroupLimit", 1, 30000]],
      ["setGroupLimit", 2, 50000],
      ["noop", 0, ["setVehicleGroupAssignment", 1, 1]]
    ]);

    expect(response.messages).to.deep.equal([
      { level: "ERROR", content: "Vehicle no longer assigned, group removed" }
    ]);

    expect(response.output).to.deep.equal({
      groups: [
        {
          id: 2,
          vehicles: [],
          drivers: [
            {
              id: 3,
              age: 17,
              years_licensed: 1,
              name: "Jimmy Jams II",
              ssn: "333-33-3333"
            }
          ],
          limit: 50000
        }
      ],
      exclusions: []
    });
  });
});
