import type { ActionReferentielScore, ActionReferentielScoreInterface } from "$generated/models/action_referentiel_score";
import { ActionStatus } from "$generated/models/action_status";
import type {ActionStatusInterface} from "$generated/models/action_status";
import { ActionReferentielScoreStorable } from "$storables/ActionReferentielScoreStorable";
import { ActionStatusStorable } from "$storables/ActionStatusStorable";
import { APIStore } from "./apiStore";
import { currentAccessToken } from "./authentication";
import { getCurrentEpciId } from "./currentEpci";

export const API_URL = import.meta.env.VITE_API_URL;

/**
 * @deprecated use API_URL instead.
 */
export const getCurrentAPI = (): string => {
    return API_URL;
}

const defaultAuthorization = () => `Bearer ${currentAccessToken()}`

export const actionReferentielScoreApi = new APIStore<ActionReferentielScore>({
  host: getCurrentAPI(),
  endpoint: () => `v2/notation/eci/${getCurrentEpciId()}`,
  authorization: defaultAuthorization,
  serializer: (storable) => storable,
  deserializer: (serialized) => new ActionReferentielScoreStorable(serialized as ActionReferentielScoreInterface),
});

export const actionStatusApi = new APIStore<ActionStatusStorable>({
    host: getCurrentAPI(),
    endpoint: () => `v2/${ActionStatus.pathname}/${getCurrentEpciId()}`,
    authorization: defaultAuthorization,
    serializer: (storable) => storable,
    deserializer: (serialized) => new ActionStatusStorable(serialized as ActionStatusInterface),
  });

  
