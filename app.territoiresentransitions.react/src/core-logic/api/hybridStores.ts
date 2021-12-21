import {HybridStore} from './hybridStore';
import {ENV} from 'environmentVariables';
import {getCurrentEpciSiren} from 'core-logic/api/currentEpci';
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
  IndicateurPersonnaliseStorable,
  IndicateurReferentielCommentaireStorable,
} from 'storables';

export const defaultAuthorization = () => 'Bearer';

export const indicateurResultatStore =
  new HybridStore<AnyIndicateurValueStorable>({
    host: ENV.backendHost,
    endpoint: () => `v2/indicateur_resultat/${getCurrentEpciSiren()}`,
    authorization: defaultAuthorization,
    serializer: storable => storable,
    deserializer: serialized =>
      new AnyIndicateurValueStorable(serialized as AnyIndicateurValueInterface),
  });

export const indicateurObjectifStore =
  new HybridStore<AnyIndicateurValueStorable>({
    host: ENV.backendHost,
    endpoint: () => `v2/indicateur_objectif/${getCurrentEpciSiren()}`,
    authorization: defaultAuthorization,
    serializer: storable => storable,
    deserializer: serialized =>
      new AnyIndicateurValueStorable(serialized as AnyIndicateurValueInterface),
  });

export const indicateurPersonnaliseResultatStore =
  new HybridStore<AnyIndicateurValueStorable>({
    host: ENV.backendHost,
    endpoint: () =>
      `v2/indicateur_personnalise_resultat/${getCurrentEpciSiren()}`,
    authorization: defaultAuthorization,
    serializer: storable => storable,
    deserializer: serialized =>
      new AnyIndicateurValueStorable(serialized as AnyIndicateurValueInterface),
  });

export const indicateurPersonnaliseObjectifStore =
  new HybridStore<AnyIndicateurValueStorable>({
    host: ENV.backendHost,
    endpoint: () =>
      `v2/indicateur_personnalise_objectif/${getCurrentEpciSiren()}`,
    authorization: defaultAuthorization,
    serializer: storable => storable,
    deserializer: serialized =>
      new AnyIndicateurValueStorable(serialized as AnyIndicateurValueInterface),
  });

export const actionStatusStore = new HybridStore<ActionStatusStorable>({
  host: ENV.backendHost,
  endpoint: () => `v2/${ActionStatus.pathname}/${getCurrentEpciSiren()}`,
  authorization: defaultAuthorization,
  serializer: storable => storable,
  deserializer: serialized =>
    new ActionStatusStorable(serialized as ActionStatusInterface),
});

export const indicateurPersonnaliseStore =
  new HybridStore<IndicateurPersonnaliseStorable>({
    host: ENV.backendHost,
    endpoint: () =>
      `v2/${IndicateurPersonnalise.pathname}/${getCurrentEpciSiren()}`,
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
      `v2/${
        IndicateurReferentielCommentaire.pathname
      }/${getCurrentEpciSiren()}`,
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
  collectiviteId: string;
  referentiel: Referentiel;
}) =>
  new HybridStore<ActionReferentielScoreStorable>({
    host: ENV.backendHost,
    endpoint: () => `v2/notation/${props.referentiel}/${props.collectiviteId}`,
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
  collectiviteId: string;
  referentiel: Referentiel;
}) => {
  if (
    !actionReferentielScoreStoreForReferentielForEpci[props.referentiel][
      props.collectiviteId
    ]
  ) {
    actionReferentielScoreStoreForReferentielForEpci[props.referentiel][
      props.collectiviteId
    ] = makeActionReferentielScoreStoreForReferentielForEpci(props);
  }
  return actionReferentielScoreStoreForReferentielForEpci[props.referentiel][
    props.collectiviteId
  ];
};

export const getActionReferentielScoreStoreFromId = (id: string) => {
  const collectiviteId = getCurrentEpciSiren()!;
  const referentiel: Referentiel = id.includes('eci') ? 'eci' : 'cae';

  return getActionReferentielScoreStoreForReferentielForEpci({
    collectiviteId,
    referentiel,
  });
};

export const actionMetaStore = new HybridStore<ActionMetaStorable>({
  host: ENV.backendHost,
  endpoint: () => `v2/${ActionMeta.pathname}/${getCurrentEpciSiren()}`,
  authorization: defaultAuthorization,
  serializer: storable => storable,
  deserializer: serialized =>
    new ActionMetaStorable(serialized as ActionMetaInterface),
});

// export const planActionStore = new HybridStore<PlanActionStorable>({
//   host: ENV.backendHost,
//   endpoint: () => `v2/${PlanAction.pathname}/${getCurrentEpciSiren()}`,
//   authorization: defaultAuthorization,
//   serializer: storable => storable,
//   deserializer: serialized =>
//     new PlanActionStorable(serialized as PlanActionInterface),
// });
