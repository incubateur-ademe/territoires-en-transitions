// Temporary interfaces for API
export interface ActionStatus {
  avancement?: string,
  action_id?: string,
  actionId?: string,
}

export interface Action {
  statut: ActionStatus,
}

export interface Store {
  actions?: {
    [key: string]: Action,
  }
}

export const storeKey = 'territoiresentransitions'

export const getStore = (): Store => {
  const storeJson = localStorage.getItem(storeKey) || '{}'

  return JSON.parse(storeJson)
}

export const setStore = (newStore: Store): Store => {
  localStorage.setItem(storeKey, JSON.stringify(newStore))

  return newStore
}