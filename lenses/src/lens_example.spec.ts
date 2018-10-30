import { expect } from "chai";
import { describe, beforeEach, it } from "mocha";
import { Lens, Prism, Arrays } from "@atomic-object/lenses";

describe("person lens", function() {
  it("should update without mutation", () => {
    type Person = { age: number; height_in_inches: number };
    const ageLens = Lens.from<Person>().prop("age");
    let p1: Person = { age: 35, height_in_inches: 71 };
    expect(ageLens.get(p1)).to.equal(35);
    let p1Aged = ageLens.set(p1, 36);
    expect(p1Aged.age).to.equal(p1.age + 1);
  });
  
  it("should update nested attributes", () => {
    type Address = { street_no: string, street_1: string, street_2: string | null, city: string, state: string, zip: string };
    type Person = { age: number; address: Address };
    
    const zipLens = Lens.from<Address>().prop("zip");
    const addrLens = Lens.from<Person>().prop("address");
    const zipInAddrLens = addrLens.comp(zipLens);
    
    let p1: Person = {age: 35, address: {street_no: "1", street_1: "main st", street_2: null, city: "Sometown", state: "IL", zip: "55555"}};
    expect(zipInAddrLens.get(p1)).to.equal("55555");
    let p1WithUpdatedZip = zipInAddrLens.set(p1, "44444")
    expect(p1.address.zip).to.equal("55555");
    expect(p1WithUpdatedZip.address.zip).to.equal("44444");
  });

  it("should update with a prism", () => {
    type Person = { age: number; favorite_numbers: number[] };
    const numbersLens = Lens.from<Person>().prop("favorite_numbers");
    const prismForNumberIndex = (index: number) => {
      return Arrays.index<number>(index);
    }
    const firstNumberInPerson = Prism.comp(numbersLens, prismForNumberIndex(0));
    let p1: Person = { age: 35, favorite_numbers: [3, 1, 45] };
    let firstNum: number | undefined = firstNumberInPerson.get(p1);
    expect(firstNum).to.equal(3);
    let p2 = firstNumberInPerson.set(p1, 22);
    expect(p2.favorite_numbers[0]).to.equal(22);
  });
});
