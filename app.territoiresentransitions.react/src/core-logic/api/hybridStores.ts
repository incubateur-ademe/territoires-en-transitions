import {HybridStore} from './hybridStore';
import {currentAccessToken} from './authentication';
import {ENV} from 'environmentVariables';
import {getCurrentEpciId} from 'core-logic/api/currentEpci';
import {Referentiel} from 'types';

import {
  ActionMeta,
  ActionMetaInterface,
  ActionReferentielScoreInterface,
  ActionStatus,
  ActionStatusInterface,
  Epci,
  EpciInterface,
  FicheActionCategorie,
  FicheActionCategorieInterface,
  FicheAction,
  FicheActionInterface,
  IndicateurPersonnalise,
  IndicateurPersonnaliseInterface,
  IndicateurReferentielCommentaire,
  IndicateurReferentielCommentaireInterface,
  AnyIndicateurValueInterface,
  PlanAction,
  PlanActionInterface,
} from 'generated/models';
import {
  ActionStatusStorable,
  ActionMetaStorable,
  ActionReferentielScoreStorable,
  AnyIndicateurValueStorable,
  EpciStorable,
  FicheActionStorable,
  FicheActionCategorieStorable,
  IndicateurPersonnaliseStorable,
  IndicateurReferentielCommentaireStorable,
  PlanActionStorable,
} from 'storables';

const defaultAuthorization = () => `Bearer ${currentAccessToken()}`;

export const indicateurResultatStore =
  new HybridStore<AnyIndicateurValueStorable>({
    host: ENV.backendHost,
    endpoint: () => `v2/indicateur_resultat/${getCurrentEpciId()}`,
    authorization: defaultAuthorization,
    serializer: storable => storable,
    deserializer: serialized =>
      new AnyIndicateurValueStorable(serialized as AnyIndicateurValueInterface),
  });

export const indicateurObjectifStore =
  new HybridStore<AnyIndicateurValueStorable>({
    host: ENV.backendHost,
    endpoint: () => `v2/indicateur_objectif/${getCurrentEpciId()}`,
    authorization: defaultAuthorization,
    serializer: storable => storable,
    deserializer: serialized =>
      new AnyIndicateurValueStorable(serialized as AnyIndicateurValueInterface),
  });

export const indicateurPersonnaliseResultatStore =
  new HybridStore<AnyIndicateurValueStorable>({
    host: ENV.backendHost,
    endpoint: () => `v2/indicateur_personnalise_resultat/${getCurrentEpciId()}`,
    authorization: defaultAuthorization,
    serializer: storable => storable,
    deserializer: serialized =>
      new AnyIndicateurValueStorable(serialized as AnyIndicateurValueInterface),
  });

export const indicateurPersonnaliseObjectifStore =
  new HybridStore<AnyIndicateurValueStorable>({
    host: ENV.backendHost,
    endpoint: () => `v2/indicateur_personnalise_objectif/${getCurrentEpciId()}`,
    authorization: defaultAuthorization,
    serializer: storable => storable,
    deserializer: serialized =>
      new AnyIndicateurValueStorable(serialized as AnyIndicateurValueInterface),
  });

export const actionStatusStore = new HybridStore<ActionStatusStorable>({
  host: ENV.backendHost,
  endpoint: () => `v2/${ActionStatus.pathname}/${getCurrentEpciId()}`,
  authorization: defaultAuthorization,
  serializer: storable => storable,
  deserializer: serialized =>
    new ActionStatusStorable(serialized as ActionStatusInterface),
});

const makeFicheActionStoreForEpci = (epciId: string) => {
  return new HybridStore<FicheActionStorable>({
    host: ENV.backendHost,
    endpoint: () => `v2/${FicheAction.pathname}/${epciId}`,
    authorization: defaultAuthorization,
    serializer: storable => storable,
    deserializer: serialized =>
      new FicheActionStorable(serialized as FicheActionInterface),
  });
};

const ficheActionStoreForEpci: Record<
  string,
  HybridStore<FicheActionStorable>
> = {};

export const getFicheActionStoreForEpci = (epciId: string) => {
  if (!ficheActionStoreForEpci[epciId]) {
    ficheActionStoreForEpci[epciId] = makeFicheActionStoreForEpci(epciId);
  }
  return ficheActionStoreForEpci[epciId];
};

const makePlanActionStoreForEpci = (epciId: string) => {
  return new HybridStore<PlanActionStorable>({
    host: ENV.backendHost,
    endpoint: () => `v2/${PlanAction.pathname}/${epciId}`,
    authorization: defaultAuthorization,
    serializer: storable => storable,
    deserializer: serialized =>
      new PlanActionStorable(serialized as PlanActionInterface),
  });
};

const planActionStoreForEpci: Record<
  string,
  HybridStore<PlanActionStorable>
> = {};

export const getPlanActionStoreForEpci = (epciId: string) => {
  if (!planActionStoreForEpci[epciId]) {
    planActionStoreForEpci[epciId] = makePlanActionStoreForEpci(epciId);
  }
  return planActionStoreForEpci[epciId];
};

export const ficheActionCategorieStore =
  new HybridStore<FicheActionCategorieStorable>({
    host: ENV.backendHost,
    endpoint: () => `v2/${FicheActionCategorie.pathname}/${getCurrentEpciId()}`,
    authorization: defaultAuthorization,
    serializer: storable => storable,
    deserializer: serialized =>
      new FicheActionCategorieStorable(
        serialized as FicheActionCategorieInterface
      ),
  });

export const indicateurPersonnaliseStore =
  new HybridStore<IndicateurPersonnaliseStorable>({
    host: ENV.backendHost,
    endpoint: () =>
      `v2/${IndicateurPersonnalise.pathname}/${getCurrentEpciId()}`,
    authorization: defaultAuthorization,
    serializer: storable => storable,
    deserializer: serialized =>
      new IndicateurPersonnaliseStorable(
        serialized as IndicateurPersonnaliseInterface
      ),
  });

export const indicateurReferentielCommentaireStore =
  new HybridStore<IndicateurReferentielCommentaireStorable>({
    host: ENV.backendHost,
    endpoint: () =>
      `v2/${IndicateurReferentielCommentaire.pathname}/${getCurrentEpciId()}`,
    authorization: defaultAuthorization,
    serializer: storable => storable,
    deserializer: serialized =>
      new IndicateurReferentielCommentaireStorable(
        serialized as IndicateurReferentielCommentaireInterface
      ),
  });

export const epciStore = new HybridStore<EpciStorable>({
  host: ENV.backendHost,
  endpoint: () => `v2/${Epci.pathname}`,
  authorization: defaultAuthorization,
  serializer: storable => storable,
  deserializer: serialized => new EpciStorable(serialized as EpciInterface),
});

const makeActionReferentielScoreStoreForReferentielForEpci = (props: {
  epciId: string;
  referentiel: Referentiel;
}) =>
  new HybridStore<ActionReferentielScoreStorable>({
    host: ENV.backendHost,
    endpoint: () => `v2/notation/${props.referentiel}/${props.epciId}`,
    authorization: defaultAuthorization,
    serializer: storable => storable,
    deserializer: serialized =>
      new ActionReferentielScoreStorable(
        serialized as ActionReferentielScoreInterface
      ),
  });

const actionReferentielScoreStoreForReferentielForEpci: Record<
  Referentiel,
  Record<string, HybridStore<ActionReferentielScoreStorable>>
> = {eci: {}, cae: {}};

export const getActionReferentielScoreStoreForReferentielForEpci = (props: {
  epciId: string;
  referentiel: Referentiel;
}) => {
  if (
    !actionReferentielScoreStoreForReferentielForEpci[props.referentiel][
      props.epciId
    ]
  ) {
    actionReferentielScoreStoreForReferentielForEpci[props.referentiel][
      props.epciId
    ] = makeActionReferentielScoreStoreForReferentielForEpci(props);
  }
  return actionReferentielScoreStoreForReferentielForEpci[props.referentiel][
    props.epciId
  ];
};

export const getActionReferentielScoreStoreFromId = (id: string) => {
  const epciId = getCurrentEpciId()!;
  const referentiel: Referentiel = id.includes('economie_circulaire')
    ? 'eci'
    : 'cae';

  return getActionReferentielScoreStoreForReferentielForEpci({
    epciId,
    referentiel,
  });
};

export const actionMetaStore = new HybridStore<ActionMetaStorable>({
  host: ENV.backendHost,
  endpoint: () => `v2/${ActionMeta.pathname}/${getCurrentEpciId()}`,
  authorization: defaultAuthorization,
  serializer: storable => storable,
  deserializer: serialized =>
    new ActionMetaStorable(serialized as ActionMetaInterface),
});

export const planActionStore = new HybridStore<PlanActionStorable>({
  host: ENV.backendHost,
  endpoint: () => `v2/${PlanAction.pathname}/${getCurrentEpciId()}`,
  authorization: defaultAuthorization,
  serializer: storable => storable,
  deserializer: serialized =>
    new PlanActionStorable(serialized as PlanActionInterface),
});
