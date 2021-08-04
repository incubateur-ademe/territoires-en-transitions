import type { ActionReferentiel } from '$generated/models/action_referentiel';
import type { ActionReferentielScore } from '$generated/models/action_referentiel_score';
import type { ActionStatus } from '$generated/models/action_status';
import { Writable, writable } from 'svelte/store';
import {actions as actions_referentiels} from "$generated/data/actions_referentiels"
import {actions as referentiels} from "$generated/data/referentiels"
import * as R from 'ramda';
import { ActionStatusStorable } from '$storables/ActionStatusStorable';
import { actionReferentielScoreEndpoint, actionStatusEndpoint } from './apiEndpoints';


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

export let currentEpciId = ""

export const updateEpciIdAndFetchAll = async (epciId: string): Promise<void> => {
  storeState.epciId.set(epciId)
  await fetchAllActionsReferentielsStatusesAndScoresForThisEpci()
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


const fetchAllActionReferentielScoresFromApi = async () => {
  const allActionReferentielScores = await actionReferentielScoreEndpoint.retrieveAll()
  allActionReferentielScores.forEach((actionReferentielScore) => storeState.actionsReferentielsWithStatusAndScoreById[actionReferentielScore.action_id].update((action) => {
    action.score = actionReferentielScore
    return action}))
}

const fetchAllActionStatusesFromApi = async () => {
  const allActionStatuses = await actionStatusEndpoint.retrieveAll()
  
  allActionStatuses.forEach((actionStatus) => storeState.actionsReferentielsWithStatusAndScoreById[actionStatus.action_id].update((action) => {
    action.status = actionStatus
    return action}))

}

type Avancement = "" | "faite" | "programmee" | "pas_faite" | "non_concernee" | "en_cours"



export const updateAvancementForAction = async (actionId: string, avancement: Avancement): Promise<void> => {
  const newStatus = new ActionStatusStorable({
    epci_id: currentEpciId,
    action_id: actionId,
    avancement: avancement
})

  // Update status in DB
  const updatedStatus = await actionStatusEndpoint.store(newStatus)
  // Update in store
  storeState.actionsReferentielsWithStatusAndScoreById[actionId].update((state) => {
    state.status = updatedStatus
    return state  
})

await fetchAllActionReferentielScoresFromApi()

}

const fetchAllActionsReferentielsStatusesAndScoresForThisEpci = async (): Promise<void> => {
  await fetchAllActionStatusesFromApi()
  await fetchAllActionReferentielScoresFromApi()

}
