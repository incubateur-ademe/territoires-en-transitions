import {getStore, setStore} from './store'

/**
 * Structure of a custom mesure in localStorage
 */
export interface CustomMesure {
    id: string,
    climat_pratic_thematic: string,
    name: string,
}

/**
 * Set a custom mesure in localStorage
 */
export const setCustomMesure = (mesure: CustomMesure): CustomMesure => {
    const store = getStore()
    let newStore = Object.assign({}, store)

    if (!newStore.customMesures) {
        newStore.customMesures = {}
    }

    newStore.customMesures[mesure.id] = mesure
    setStore(newStore)

    return mesure
}

/**
 * Get a custom mesure from localStorage
 */
export const getCustomMesure = (id: string): CustomMesure|null => {
    const store = getStore()

    if (!store) return null
    if (!store.customMesures) return null

    const mesure = store.customMesures[id]

    if (!mesure) return null

    return mesure
}

/**
 * Get custom mesures saved in localStorage
 */
export const getAllCustomMesures = (thematic?: string): Record<string, CustomMesure>|null => {
    const store = getStore()

    if (!store) return null
    if (!store.customMesures) return null
    if (!thematic) return store.customMesures

    const filterByThematic = (
      memo: Record<string, CustomMesure>,
      currentMesure: CustomMesure,
    ): Record<string, CustomMesure> => {
        if (currentMesure.climat_pratic_thematic == thematic) {
            memo[currentMesure.id] = currentMesure
        }

        return memo
    }

    return Object.values(store.customMesures).reduce(filterByThematic, {})
}

/**
 * Delete a custom mesure saved in localStorage
 */
export const deleteCustomMesure = (id: string): CustomMesure|boolean => {
    const store = getStore()

    if (!store) return false
    if (!store.customMesures) return false
    if (!store.customMesures[id]) return false

    let newStore = Object.assign({}, store)
    const mesure = newStore.customMesures![id]

    delete newStore.customMesures![id]

    setStore(newStore)

    return mesure
}