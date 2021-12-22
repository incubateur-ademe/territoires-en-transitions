import {getCurrentEpciSiren} from 'core-logic/api/currentEpci';
import {ENV} from 'environmentVariables';
import {
  ActionMeta,
  ActionMetaInterface,
  ActionReferentielScoreInterface,
  ActionStatus,
  ActionStatusInterface,
  Epci,
  EpciInterface,
  IndicateurPersonnalise,
  IndicateurPersonnaliseInterface,
} from 'generated/models';
import {
  ActionMetaStorable,
  ActionReferentielScoreStorable,
  ActionStatusStorable,
  EpciStorable,
  IndicateurPersonnaliseStorable,
} from 'storables';
import {Referentiel} from 'types';
import {HybridStore} from './hybridStore';

export const defaultAuthorization = () => 'Bearer';

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
