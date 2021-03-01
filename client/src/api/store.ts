import type {ActionStatus} from './actionStatus'
import type {Indicator} from './indicator'
import type {CustomMesure} from "./customMesure";

/**
 * Structure of all data of the current user in localStorage
 */
export interface Store {
    action_statuses?: {
        [key: string]: ActionStatus
    },
    indicators?: {
        [key: string]: Indicator
    },
    customMesures?: Record<string, CustomMesure>
}

export const storeKey = 'territoiresentransitions'

/**
 * Get all data of the current user from localStorage
 */
export const getStore = (): Store => {
    const storeJson = localStorage.getItem(storeKey) || '{}'

    return JSON.parse(storeJson)
}

/**
 * Set all data of the current user in localStorage
 */
export const setStore = (newStore: Store): Store => {
    localStorage.setItem(storeKey, JSON.stringify(newStore))

    return newStore
}

export interface Storable {
    id: string
}

export const store = (type: string, storable: Storable): Storable => {
    const path = pathForType(type)
    const store = getStore()
    let newStore = Object.assign({}, store)!

    // @ts-ignore
    if (!newStore[path]) {
        // @ts-ignore
        newStore[path] = {}
    }

    // @ts-ignore
    newStore[path][storable.id] = storable as Storable
    setStore(newStore)
    return storable
}

export const retrieve = <T extends Storable>(type: string, id: string): T | null => {
    const store = getStore()

    const path = pathForType(type)
    if (!store) return null

    // @ts-ignore
    if (!store[path]) return null

    // @ts-ignore
    const storable = store[path][id]
    if (!storable) return null
    return storable as T
}

export const retrieveAll = <T extends Storable>(type: string): Record<string, T> => {
    const store = getStore()
    const path = pathForType(type)

    if (!store) return {} as Record<string, T>
    // @ts-ignore
    if (!store[path]) return {} as Record<string, T>

    // @ts-ignore
    const storables = store[path]
    if (!storables) return {} as Record<string, T>
    return storables as Record<string, T>
}

export const deleteById = (id: string, type: string): boolean => {
    const path = pathForType(type)
    const store = getStore()
    let newStore = Object.assign({}, store)!

    // @ts-ignore
    if (!newStore[path]) {
        // @ts-ignore
        newStore[path] = {}
    }

    // @ts-ignore
    if (!newStore[path][id]) return false
    // @ts-ignore
    delete newStore[path][id]
    setStore(newStore)
    return true
}


const pathForType = (type: string): string => {
    let path: string = ''
    switch (type) {
        case 'custom_mesure':
            path = 'customMesures'
            break
        case 'custom_action':
            path = 'customActions'
            break
        case 'action_statuses':
            path = 'actionStatuses'
            break
        default:
            throw new Error(`No store path found for ${type}`)
    }
    return path
}