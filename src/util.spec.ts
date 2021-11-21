import { toSquareName, fromSquareName } from "./util";

test("toSquareName()", () => {
  expect(toSquareName({ r: 0, c: 0 })).toEqual("a8");
  expect(toSquareName({ r: 7, c: 0 })).toEqual("a1");
  expect(toSquareName({ r: 7, c: 7 })).toEqual("h1");
  expect(toSquareName({ r: 0, c: 7 })).toEqual("h8");
});

test("fromSquareName()", () => {
  expect(fromSquareName("a8")).toEqual({ r: 0, c: 0 });
  expect(fromSquareName("a1")).toEqual({ r: 7, c: 0 });
  expect(fromSquareName("h1")).toEqual({ r: 7, c: 7 });
  expect(fromSquareName("h8")).toEqual({ r: 0, c: 7 });
});
