import { getStore, setStore } from './store'

interface SetIndicatorPayload {
  indicatorId: string
  value: string
}

interface GetIndicatorPayload {
  indicatorId: string
}

export interface Indicator {
  indicator_id: string
  value: string
}

/**
 * Set the value of an indicator in localStorage
 */
export const setIndicator = ({ indicatorId, value }: SetIndicatorPayload): Indicator => {
  const store = getStore()
  let newStore = Object.assign({}, store)

  if (!newStore.indicators) {
    newStore['indicators'] = {}
  }

  const indicator = {
    indicator_id: indicatorId,
    value,
  }

  newStore.indicators[indicatorId] = indicator
  setStore(newStore)

  return indicator
}

/**
 * Get the value from localStorage of an indicator
 */
export const getIndicator = ({ indicatorId }: GetIndicatorPayload): Indicator|null => {
  const store = getStore()

  if (!store) return null
  if (!store.indicators) return null

  const indicator = store.indicators[indicatorId]

  if (!indicator) return null

  return indicator
}