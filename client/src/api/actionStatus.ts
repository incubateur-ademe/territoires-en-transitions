import {
  Store,
  getStore,
  setStore, Storable,
} from './store'

/**
 * Structure of the status of an action in localStorage
 */
export interface ActionStatus extends Storable {
  id: string,
  avancement: string
  action_id: string
}

/**
 * Get the status of an action from localStorage
 */
const getActionStatusInStore = (
  store: Store,
  action_id: string,
): ActionStatus|null => {
  if (!store.action_statuses) return null
  if (!store.action_statuses[action_id]) return null

  return store.action_statuses[action_id]
}

/**
 * Get the status of an action
 */
export const getActionStatus = (
  actionId: string
): { actionId: string; avancement: string; }|null => {
  const store = getStore()

  if (!store) return null

  const status = getActionStatusInStore(store, actionId!)

  if (!status) return null

  // Conversion of action_id to actionId.
  return {
    actionId: status!.action_id,
    avancement: status!.avancement,
  }
}