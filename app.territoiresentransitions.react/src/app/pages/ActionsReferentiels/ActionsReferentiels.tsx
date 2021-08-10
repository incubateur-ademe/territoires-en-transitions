import { Route } from "type-route";
import { routes } from "app/Router";

import "app/DesignSystem/core.css";

type ActionsReferentielsProps = {
  route: Route<typeof routes.actionsReferentiels>;
};

export const ActionsReferentiels = (props: ActionsReferentielsProps) => (
  <div className="app mx-5 mt-5">
    <h1> Actions Referentiels </h1>
  </div>
);
