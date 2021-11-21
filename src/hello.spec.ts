import { hello } from "./hello";

describe("hello()", () => {
  it("greets the world by default", () => {
    expect(hello()).toEqual("Hello world!");
  });

  it("greets others", () => {
    expect(hello("Pandu")).toEqual("Hello Pandu!");
    expect(hello("friend")).toEqual("Hello friend!");
  });
});
