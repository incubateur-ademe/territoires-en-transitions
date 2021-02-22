import { getStore, setStore } from './store'

/**
 * Structure of an indicator in localStorage
 */
export interface Indicator {
  indicator_id: string
  value: string
}

/**
 * Set the value of an indicator in localStorage
 */
export const setIndicator = (indicatorId: string, value: string): Indicator => {
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
 * Get the value of an indicator from localStorage
 */
export const getIndicator = (indicatorId: string): Indicator|null => {
  const store = getStore()

  if (!store) return null
  if (!store.indicators) return null

  const indicator = store.indicators[indicatorId]

  if (!indicator) return null

  return indicator
}