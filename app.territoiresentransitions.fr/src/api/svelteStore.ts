import type { ActionReferentiel } from '$generated/models/action_referentiel';
import type { ActionReferentielScore } from '$generated/models/action_referentiel_score';
import type { ActionStatus } from '$generated/models/action_status';
import { Writable, writable } from 'svelte/store';
import { getCurrentEpciId } from './currentEpci';
import {actions as actions_referentiels} from "$generated/data/actions_referentiels"
import {actions as referentiels} from "$generated/data/referentiels"
import * as R from 'ramda';
import { actionReferentielScoreStore, actionStatusStore } from './hybridStores';
import { ActionStatusStorable } from '$storables/ActionStatusStorable';
import { actionReferentielScoreApi, actionStatusApi } from './currentAPI';


type ActionsReferentielsWithStatusAndScore = ActionReferentiel & {status?: ActionStatus, score?: ActionReferentielScore}
type ActionsReferentielsWithStatusAndScoreById = Record<string, Writable<ActionsReferentielsWithStatusAndScore>>
type State = {
  actionsReferentielsWithStatusAndScoreById: Record<string, Writable<ActionsReferentielsWithStatusAndScore>>
}


const flattenActionReferentielActions = (accActions: ActionReferentiel[] , action: ActionReferentiel) => {
  accActions.push(action);
  if (action.actions.length > 0) {
      return action.actions.reduce(flattenActionReferentielActions, accActions);
  }
  return accActions;
}

export const storeState: State = {actionsReferentielsWithStatusAndScoreById: 
  R.reduce<ActionReferentiel, ActionsReferentielsWithStatusAndScoreById>((acc, action) => {
  return ({ ...acc , [action.id]: writable(action)});
}, {}, [...referentiels,...actions_referentiels].reduce(flattenActionReferentielActions, []))}


const updateStoreScoresFromApi = async () => {
  const newScores = await actionReferentielScoreApi.retrieveAll() //actionReferentielScoreStore.retrieveById(actionId)
  newScores.forEach((newScore) => {
    storeState.actionsReferentielsWithStatusAndScoreById[newScore.action_id].update((state) => {
      state.score = newScore
      return state
    })
  })
}

// This should be generared. 
export type Avancement = "" | "faite" | "programmee" | "pas_faite" | "non_concernee" | "en_cours"


const updateAvancementForAction = async (actionId: string, avancement: Avancement): Promise<void> => {
  const epciId = getCurrentEpciId() // TODO : I guess, this should be state store as well. 
  const newStatus = new ActionStatusStorable({
    epci_id: epciId,
    action_id: actionId,
    avancement: avancement
})

  // Update status in DB
  const updatedStatus = await actionStatusApi.store(newStatus)
  
  // Update in store
  storeState.actionsReferentielsWithStatusAndScoreById[actionId].update((state) => {
    state.status = updatedStatus
    return state  
})

await updateStoreScoresFromApi()

}

const fetchAllActionsReferentielsStatusAndScoreForThisEpci = async (): Promise<void> => {
  const epciId = getCurrentEpciId() // TODO : I guess, this should be state store as well. 
  await Promise.all(Object.keys(storeState.actionsReferentielsWithStatusAndScoreById).map(async (actionId) => {
    const newStatus = await actionStatusStore.retrieveById(`${epciId}/${actionId}`);
    const newScore = await actionReferentielScoreStore.retrieveById(`${epciId}/${actionId}`);
    
    storeState.actionsReferentielsWithStatusAndScoreById[actionId].update((action) => {
      action.status = newStatus
      action.score = newScore
      return action;
    });
  }))
  await updateStoreScoresFromApi()
}

export const storeActions = { fetchAllActionsReferentielsStatusAndScoreForThisEpci, updateAvancementForAction}