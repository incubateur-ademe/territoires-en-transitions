import type {
  ActionReferentielScore,
  ActionReferentielScoreInterface,
} from "generated/models/action_referentiel_score";
import { ActionStatus } from "generated/models/action_status";
import type { ActionStatusInterface } from "generated/models/action_status";
import { ActionReferentielScoreStorable } from "storables/ActionReferentielScoreStorable";
import { ActionStatusStorable } from "storables/ActionStatusStorable";
import { APIEndpoint } from "./apiEndpoint";
import { currentAccessToken } from "./authentication";
import { ENV } from "environmentVariables";
import { state } from "core-logic/overmind/state";

const defaultAuthorization = () => `Bearer ${currentAccessToken()}`;

export const actionReferentielScoreEndpoint =
  new APIEndpoint<ActionReferentielScore>({
    host: ENV.backendHost,
    endpoint: () => `v2/notation/eci/${state.epciId}`,
    authorization: defaultAuthorization,
    serializer: (storable) => storable,
    deserializer: (serialized) =>
      new ActionReferentielScoreStorable(
        serialized as ActionReferentielScoreInterface,
      ),
  });

export const actionStatusEndpoint = new APIEndpoint<ActionStatusStorable>({
  host: ENV.backendHost,
  endpoint: () => `v2/${ActionStatus.pathname}/${state.epciId}`,
  authorization: defaultAuthorization,
  serializer: (storable) => storable,
  deserializer: (serialized) =>
    new ActionStatusStorable(serialized as ActionStatusInterface),
});
