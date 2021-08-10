import { ActionsReferentiels } from "app/pages/ActionsReferentiels/ActionsReferentiels";
import { Epcis } from "app/pages/Epcis/Epcis";

import { createRouter, defineRoute } from "type-route";

export const { RouteProvider, useRoute, routes } = createRouter({
  epcis: defineRoute(["/", "/epcis"]),
  actionsReferentiels: defineRoute("/actions_referentiels"),
});

export const Router = () => {
  const route = useRoute();

  return (
    <>
      {route.name !== "epcis" && <div className="w-full h-12" />}
      {route.name === "epcis" && <Epcis route={route} />}
      {route.name === "actionsReferentiels" && (
        <ActionsReferentiels route={route} />
      )}
    </>
  );
};
