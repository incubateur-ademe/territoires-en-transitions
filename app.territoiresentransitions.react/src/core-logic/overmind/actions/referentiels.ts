import type {Effects, State} from 'core-logic/overmind';
import type {Avancement} from 'types';
import {ActionStatusStorable} from 'storables/ActionStatusStorable';
import {ActionMetaStorable} from 'storables/ActionMetaStorable';

const fetchAllActionReferentielScoresFromApi = async ({
  state,
  effects,
}: {
  state: State;
  effects: Effects;
}) => {
  const allActionReferentielScores =
    await effects.actionReferentielScoreStore.api.retrieveAll();

  allActionReferentielScores.forEach(score => {
    state.actionReferentielScoresById[score.action_id] = score;
  });
};

const fetchAllActionReferentielStatusAvancementsFromApi = async ({
  state,
  effects,
}: {
  state: State;
  effects: Effects;
}) => {
  const allActionReferentielStatuses =
    await effects.actionStatusStore.api.retrieveAll(); // Note that if I don't call API, it does not work ...

  allActionReferentielStatuses.forEach(status => {
    state.actionReferentielStatusAvancementById[status.action_id] =
      status.avancement;
  });
};

const fetchAllActionReferentielCommentaireFromApi = async ({
  state,
  effects,
}: {
  state: State;
  effects: Effects;
}) => {
  const allActionMetastorables = await effects.actionMetaStore.retrieveAll();
  allActionMetastorables.forEach(metaStorable => {
    // eslint-disable-next-line
    const metaObject = metaStorable.meta as any; // TODO : object is not easy to use in react :/
    state.actionReferentielCommentaireById[metaStorable.action_id] =
      metaObject?.commentaire || '';
  });
};

const updateActionReferentielAvancement = async (
  {
    state,
    effects,
  }: {
    state: State;
    effects: Effects;
  },
  {actionId, avancement}: {actionId: string; avancement: Avancement}
) => {
  if (state.currentEpciId) {
    const actionStatusStorable = new ActionStatusStorable({
      action_id: actionId,
      avancement: avancement,
      epci_id: state.currentEpciId,
    });
    const updatedStatus = await effects.actionStatusStore.store(
      actionStatusStorable
    );
    state.actionReferentielStatusAvancementById[actionId] =
      updatedStatus.avancement;
    await fetchAllActionReferentielScoresFromApi({state, effects});
    // TODO / Question : Je trouve ça troublant que le "avancement" de status et de score pour une même action ne soit pas les mêmes (pour programmee par ex.) Revoir la logique, nan ?
  }
};

const updateActionReferentielCommentaire = async (
  {
    state,
    effects,
  }: {
    state: State;
    effects: Effects;
  },
  props: {actionId: string; commentaire: string}
) => {
  if (!state.currentEpciId) return; // TODO : Should raise ? Or at lease not happened.
  const stored = await effects.actionMetaStore.store(
    new ActionMetaStorable({
      action_id: props.actionId,
      epci_id: state.currentEpciId,
      meta: {commentaire: props.commentaire},
    })
  );
  state.actionReferentielCommentaireById[props.actionId] =
    (stored.meta as any).commentaire ?? '';
};

export const actionsReferentiels = {
  fetchAllActionReferentielScoresFromApi,
  fetchAllActionReferentielStatusAvancementsFromApi,
  fetchAllActionReferentielCommentaireFromApi,
  updateActionReferentielAvancement,
  updateActionReferentielCommentaire,
};
