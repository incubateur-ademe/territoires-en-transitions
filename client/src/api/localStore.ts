export const storeKey = 'territoiresentransitions'

/**
 * Data that can be stored at path/id.
 */
interface Storable {
    id: string,
    pathname: string,
}

/**
 * Storable type guard.
 */
const isStorable = (storable: any): storable is Storable => {
    return (storable as Storable).id != undefined && (storable as Storable).pathname != undefined
}


/**
 * Get all data of the current user from localStorage
 *
 * Returns an empty store if none found.
 */
export const getStore = (): Record<string, any> => {
    const storeJson = localStorage.getItem(storeKey) || '{}'
    const store = JSON.parse(storeJson)
    // necessary ?
    return Object.assign({}, store)
}

/**
 * Set all data of the current user in localStorage.
 */
export const setStore = (newStore: Record<string, any>): Record<string, any> => {
    localStorage.setItem(storeKey, JSON.stringify(newStore))
    return Object.assign({}, newStore)
}


/**
 * Store a storable in user's store.
 *
 * @param storable the object to save
 */
export const store = <T>(storable: T): T => {
    if (!isStorable(storable)) {
        throw new Error(`${typeof storable} is not storable.`)
    }
    const store = getStore()

    const path = storable.pathname
    if (!store[path]) {
        store[path] = {}
    }

    store[path][storable.id] = storable
    setStore(store)
    return storable
}


/**
 * Return a storable with matching path and path.
 * Throw if no storable is found or path does not exist.
 *
 * @param path Storable pathname
 * @param id Storable id
 */
export const retrieve = <T>(path: string, id: string): T => {
    const store = getStore()

    if (!store[path]) {
        throw new Error(`Path '${path}' does not exist in is store.`)
    }

    const storable = store[path][id]

    if (!storable) {
        throw new Error(`Storable '${path}.${id}' does not exist.`)
    }

    return storable as T
}


/**
 * Return all storable of type T existing at path.
 * If nothing is found returns an empty record.
 *
 * @param path Storable pathname
 */
export const retrieveAll = <T>(path: string): Record<string, T> => {
    const store = getStore()

    if (!store) return {} as Record<string, T>
    if (!store[path]) return {} as Record<string, T>
    return store[path] as Record<string, T>
}

/**
 * Delete a Storable stored at path/id.
 * Return true if something was deleted, false if nothing exists at path/id.
 *
 * @param path Storable pathname
 * @param id Storable id
 */
export const deleteById = (path: string, id: string): boolean => {
    const store = getStore()

    if (!store[path]) return false
    if (!store[path][id]) return false
    delete store[path][id]
    setStore(store)
    return true
}