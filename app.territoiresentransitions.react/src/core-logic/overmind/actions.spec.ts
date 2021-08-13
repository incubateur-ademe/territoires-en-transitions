import { createOvermindMock } from "overmind";
import { config } from "./";

describe("Actions", () => {
  describe("setCurrentEpci", () => {
    test("should change state", async () => {
      const overmind = createOvermindMock(
        config,
        // Eventually, we can "mock" the API here, to test the store separately.
        //    {
        //   api: {
        //     getPost(id) {
        //       return Promise.resolve({
        //         id,
        //       });
        //     },
        //   },
        // }
      );
      overmind.actions.setCurrentEpci("lala");

      expect(overmind.state.epciId).toEqual("lala");
      // TODO : check that it also fetched actions, scores, ...
    });
    test("should handle errors if epci is empty", async () => {});
    test("should handle errors if epci does not exist", async () => {});
  });
});
