import { toSquareName } from "./util";

test("toSquareName()", () => {
  expect(toSquareName({ r: 0, c: 0 })).toEqual("a8");
  expect(toSquareName({ r: 7, c: 0 })).toEqual("a1");
  expect(toSquareName({ r: 7, c: 7 })).toEqual("h1");
  expect(toSquareName({ r: 0, c: 7 })).toEqual("h8");
});
