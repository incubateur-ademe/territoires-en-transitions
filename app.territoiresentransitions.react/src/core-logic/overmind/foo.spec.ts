import "@testing-library/jest-dom/extend-expect";

//  Dummy test, for POC purpose, running in CI.
const add = (n: number) => n + 1;

test("adds 1 to a number", () => {
  expect(add(3)).toEqual(4);
});
