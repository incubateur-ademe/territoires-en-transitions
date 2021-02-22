import {
  Store,
  getStore,
  setStore,
} from './store'

/**
 * Structure of the status of an action in localStorage
 */
export interface ActionStatus {
  avancement: string
  action_id: string
}

/**
 * Set the status of an action in localStorage
 */
let setActionStatusInStore = (
  store: Store,
  action_id: string,
  avancement: string,
  ): Store => {
  let newStore: Store = Object.assign({}, store)

  if (!newStore.action_statuses) {
    newStore['action_statuses'] = {}
  }

  newStore.action_statuses[action_id] = {
    action_id,
    avancement,
  }

  return newStore
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
 * Set the status of an action
 */
export const setActionStatus = (
  actionId: string,
  avancement: string,
): { actionId: string; avancement: string; } => {
  // API call to update the status of an action
  // On the success of the call, we can update the local store.
  const store = getStore()
  const newStore = setActionStatusInStore(store, actionId!, avancement!)

  setStore(newStore)

  // Conversion of action_id to actionId.
  return { actionId, avancement }
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