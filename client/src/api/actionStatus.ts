import {
  ActionStatus,
  Store,
  getStore,
  setStore,
} from './store'

interface SetActionStatusInStorePayload {
  store: Store,
  action_id: string,
  avancement: string,
}

interface GetActionStatusInStorePayload {
  store: Store,
  action_id: string,
}

let setActionStatusInStore = ({ store, action_id, avancement }: SetActionStatusInStorePayload): Store => {
  let newStore: Store = Object.assign({}, store)

  if (!newStore.actions) {
    newStore.actions = {
      [action_id]: {
        statut: {
          action_id,
          avancement,
        }
      }
    }

    return newStore
  }

  if (!newStore.actions[action_id]) {
    newStore.actions[action_id] = {
      statut: {
        action_id,
        avancement,
      }
    }

    return newStore
  }

  newStore.actions[action_id].statut = { action_id, avancement }

  return newStore
}

const getActionStatusInStore = ({ store, action_id }: GetActionStatusInStorePayload): ActionStatus|null => {
  if (!store.actions) return null
  if (!store.actions[action_id]) return null

  return store.actions[action_id].statut
}

export const updateActionStatus = ({ avancement, actionId }: ActionStatus): ActionStatus => {
  // API call to update the status of an action
  // On the success of the call, we can update the local store.
  const store = getStore()
  const newStore = setActionStatusInStore({ store, action_id: actionId!, avancement: avancement! })

  setStore(newStore)

  // Conversion of action_id to actionId.
  return { actionId, avancement }
}

export const getActionStatus = ({ actionId }: ActionStatus): ActionStatus|null => {
  const store = getStore()

  if (!store) return null

  const status = getActionStatusInStore({ store, action_id: actionId! })

  if (!status) return null

  // Conversion of action_id to actionId.
  return {
    actionId: status!.action_id,
    avancement: status!.avancement,
  }
}