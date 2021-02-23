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
 * Get all custom mesures saved in localStorage
 */
export const getAllCustomMesures = (): Record<string, CustomMesure>|null => {
    const store = getStore()

    if (!store) return null
    if (!store.customMesures) return null

    return store.customMesures
}