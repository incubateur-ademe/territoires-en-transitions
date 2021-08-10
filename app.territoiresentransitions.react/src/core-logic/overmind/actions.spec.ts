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
      // overmind.state.epciId = "lala";
      await overmind.actions.setCurrentEpci("lala");

      expect(overmind.state).toEqual({
        epciId: "lala",
        epciDataIsLoading: false,
        allEpcis: [],
      });
    });
    test("should handle errors if epci is empty", async () => {});
    test("should handle errors if epci does not exist", async () => {});
  });
});
