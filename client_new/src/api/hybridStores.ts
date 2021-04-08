import {IndicateurValueStorable} from "../storables/IndicateurValueStorable";
import {IndicateurValue, IndicateurValueInterface} from "../../generated/models/indicateur_value";
import {getCurrentEpciId} from "./currentEpci";
import {ActionStatus, ActionStatusInterface} from "../../generated/models/action_status";
import {ActionStatusStorable} from "../storables/ActionStatusStorable";
import {ActionCustomStorable} from "../storables/ActionCustomStorable";
import {ActionCustom, ActionCustomInterface} from "../../generated/models/action_custom";
import {getCurrentAPI} from "./currentAPI";
import {MesureCustomStorable} from "../storables/MesureCustomStorable";
import {MesureCustom, MesureCustomInterface} from "../../generated/models/mesure_custom";
import {HybridStore} from "./hybridStore";


export const indicateurValueStore = new HybridStore<IndicateurValueStorable>({
    host: getCurrentAPI(),
    endpoint: `v1/${IndicateurValue.pathname}/${getCurrentEpciId()}`,
    serializer: (storable) => storable,
    deserializer: (serialized) => new IndicateurValueStorable(serialized as IndicateurValueInterface),
});

export const actionStatusStore = new HybridStore<ActionStatusStorable>({
    host: getCurrentAPI(),
    endpoint: `v1/${ActionStatus.pathname}/${getCurrentEpciId()}`,
    serializer: (storable) => storable,
    deserializer: (serialized) => new ActionStatusStorable(serialized as ActionStatusInterface),
});

export const actionCustomStore = new HybridStore<ActionCustomStorable>({
    host: getCurrentAPI(),
    endpoint: `v1/${ActionCustom.pathname}/${getCurrentEpciId()}`,
    serializer: (storable) => storable,
    deserializer: (serialized) => new ActionCustomStorable(serialized as ActionCustomInterface),
});

export const mesureCustomStore = new HybridStore<MesureCustomStorable>({
    host: getCurrentAPI(),
    endpoint: `v1/${MesureCustom.pathname}/${getCurrentEpciId()}`,
    serializer: (storable) => storable,
    deserializer: (serialized) => new MesureCustomStorable(serialized as MesureCustomInterface),
});