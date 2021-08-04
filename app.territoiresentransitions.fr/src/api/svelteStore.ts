import type { ActionReferentiel } from '$generated/models/action_referentiel';
import type { ActionReferentielScore } from '$generated/models/action_referentiel_score';
import type { ActionStatus } from '$generated/models/action_status';
import { Writable, writable } from 'svelte/store';
import {actions as actions_referentiels} from "$generated/data/actions_referentiels"
import {actions as referentiels} from "$generated/data/referentiels"
import * as R from 'ramda';
import { actionReferentielScoreStore, actionStatusStore } from './hybridStores';
import { ActionStatusStorable } from '$storables/ActionStatusStorable';
import { actionReferentielScoreApi, actionStatusApi } from './currentAPI';


type ActionsReferentielsWithStatusAndScore = ActionReferentiel & {status?: ActionStatus, score?: ActionReferentielScore}
type ActionsReferentielsWithStatusAndScoreById = Record<string, Writable<ActionsReferentielsWithStatusAndScore>>
type State = {
  epciId: Writable<string>,
  actionsReferentielsWithStatusAndScoreById: Record<string, Writable<ActionsReferentielsWithStatusAndScore>>
}

const flattenActionReferentielActions = (accActions: ActionReferentiel[] , action: ActionReferentiel) => {
  accActions.push(action);
  if (action.actions.length > 0) {
      return action.actions.reduce(flattenActionReferentielActions, accActions);
  }
  return accActions;
}

let currentEpciId = ""

export const updateEpciIdAndFetchAll = async (epciId: string): Promise<void> => {
  storeState.epciId.set(epciId)
  await fetchAllActionsReferentielsStatusAndScoreForThisEpci()
}

// Initial state
export const storeState: State = {
  epciId: writable(currentEpciId),
  actionsReferentielsWithStatusAndScoreById: 
  R.reduce<ActionReferentiel, ActionsReferentielsWithStatusAndScoreById>((acc, action) => {
  return ({ ...acc , [action.id]: writable(action)});
}, {}, [...referentiels,...actions_referentiels].reduce(flattenActionReferentielActions, []))}

storeState.epciId.subscribe(value => {
  currentEpciId = value;
})


const updateStoreScoresFromApi = async () => {
  const newScores = await actionReferentielScoreApi.retrieveAll() //actionReferentielScoreStore.retrieveById(actionId)
  newScores.forEach((newScore) => {
    storeState.actionsReferentielsWithStatusAndScoreById[newScore.action_id].update((state) => {
      state.score = newScore
      return state
    })
  })
}

type Avancement = "" | "faite" | "programmee" | "pas_faite" | "non_concernee" | "en_cours"



export const updateAvancementForAction = async (actionId: string, avancement: Avancement): Promise<void> => {
  const newStatus = new ActionStatusStorable({
    epci_id: currentEpciId,
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
  await Promise.all(Object.keys(storeState.actionsReferentielsWithStatusAndScoreById).map(async (actionId) => {
    const newStatus = await actionStatusStore.retrieveById(`${storeState.epciId}/${actionId}`);
    const newScore = await actionReferentielScoreStore.retrieveById(`${storeState.epciId}/${actionId}`);
    
    storeState.actionsReferentielsWithStatusAndScoreById[actionId].update((action) => {
      action.status = newStatus
      action.score = newScore
      return action;
    });
  }))
  await updateStoreScoresFromApi()
}
