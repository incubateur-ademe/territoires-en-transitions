import {ENV} from 'environmentVariables';
import {IndicateurValue} from 'generated/models/indicateur_value';
import {getCurrentEpciId} from 'core-logic/api/currentEpci';
import {
  defaultAuthorization,
  ReactiveStore,
} from 'core-logic/api/reactiveStore';
import {State} from 'core-logic/overmind/state';
import {FicheActionStorable} from 'storables/FicheActionStorable';
import {FicheActionInterface} from 'generated/models/fiche_action';
import {FicheActionCategorieStorable} from 'storables/FicheActionCategorieStorable';
import {FicheActionCategorieInterface} from 'generated/models/fiche_action_categorie';
import {VoidCallback} from 'core-logic/api/reactivity';

export const fichesStore = new ReactiveStore<FicheActionStorable, State>({
  host: ENV.backendHost,
  endpoint: () => `v2/${IndicateurValue.pathname}/${getCurrentEpciId()}`,
  authorization: defaultAuthorization,
  stateAccessor: state => state.allFiches,
  serializer: storable => storable,
  deserializer: serialized =>
    new FicheActionStorable(serialized as FicheActionInterface),
});

export const ficheCategoriesStore = new ReactiveStore<
  FicheActionCategorieStorable,
  State
>({
  host: ENV.backendHost,
  endpoint: () => `v2/${IndicateurValue.pathname}/${getCurrentEpciId()}`,
  authorization: defaultAuthorization,
  stateAccessor: state => state.allFicheCategories,
  serializer: storable => storable,
  deserializer: serialized =>
    new FicheActionCategorieStorable(
      serialized as FicheActionCategorieInterface
    ),
});

export const ficheActions = {
  storeFiche: fichesStore.store,
  getFiche: fichesStore.retrieveById,
  getAllFiches: fichesStore.retrieveAll,
  // eslint-disable-next-line no-empty-pattern
  addListenerToFiches: ({}, listener: VoidCallback) =>
    fichesStore.addListener(listener),
  // eslint-disable-next-line no-empty-pattern
  removeListenerFromFiches: ({}, listener: VoidCallback) =>
    fichesStore.removeListener(listener),

  storeCategorie: ficheCategoriesStore.store,
  getCategorie: ficheCategoriesStore.retrieveById,
  getAllCategorie: ficheCategoriesStore.retrieveAll,
};
