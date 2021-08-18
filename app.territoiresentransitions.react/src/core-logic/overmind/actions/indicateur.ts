import {IndicateurValueStorable} from 'storables/IndicateurValueStorable';
import {ENV} from 'environmentVariables';
import {
  IndicateurValue,
  IndicateurValueInterface,
} from 'generated/models/indicateur_value';
import {getCurrentEpciId} from 'core-logic/api/currentEpci';
import {
  defaultAuthorization,
  ReactiveStore,
} from 'core-logic/api/reactiveStore';
import {State} from 'core-logic/overmind/state';

const indicateurValueStore = new ReactiveStore<IndicateurValueStorable, State>({
  host: ENV.backendHost,
  endpoint: () => `v2/${IndicateurValue.pathname}/${getCurrentEpciId()}`,
  authorization: defaultAuthorization,
  stateAccessor: state => state.allIndicateurValues,
  serializer: storable => storable,
  deserializer: serialized =>
    new IndicateurValueStorable(serialized as IndicateurValueInterface),
});

export const indicateurActions = {
  storeIndicateurReferentielValue: indicateurValueStore.store,
  getIndicateurReferentielValue: indicateurValueStore.retrieveById,
  getAllIndicateurReferentielValues: indicateurValueStore.retrieveAll,
};
