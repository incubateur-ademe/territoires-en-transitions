import {ActionCustom, ActionCustomInterface} from "../../../generated/models/action_custom";
import {ActionCustomStorable} from "../storables/ActionCustomStorable";
import {ActionStatusStorable} from "../storables/ActionStatusStorable";
import {ActionStatus, ActionStatusInterface} from "../../../generated/models/action_status";
import {isStorable} from "./storable";
import {FicheActionStorable} from "../storables/FicheActionStorable";
import type {FicheActionInterface} from "../../../generated/models/fiche_action";
import {FicheActionCategorieStorable} from "../storables/FicheActionCategorieStorable";
import type {FicheActionCategorieInterface} from "../../../generated/models/fiche_action_categorie";
import {IndicateurPersonnaliseStorable} from "../storables/IndicateurPersonnaliseStorable";
import type {IndicateurPersonnaliseInterface} from "../../../generated/models/indicateur_personnalise";
import {IndicateurPersonnaliseValueStorable} from "../storables/IndicateurPersonnaliseValueStorable";
import type {IndicateurPersonnaliseValueInterface} from "../../../generated/models/indicateur_personnalise_value";
import {UtilisateurConnecteStorable} from "../storables/UtilisateurConnecteStorable";
import {UtilisateurConnecte, UtilisateurConnecteInterface} from "../../../generated/models/utilisateur_connecte";

/**
 * Get store by pathname from localStorage
 *
 * Returns an empty store if none found.
 */
const getStore = (pathname: string): Record<string, object> => {
    const storeJson = localStorage.getItem(pathname) || '{}'
    return JSON.parse(storeJson)
}

/**
 * Set store data at pathname.
 */
const saveStore = (pathname: string, newStore: Record<string, object>): void => {
    localStorage.setItem(pathname, JSON.stringify(newStore))
}

/**
 * A Store for Storable object using local storage.
 */
export class LocalStore<T> {
    constructor(
        {
            pathname,
            serializer,
            deserializer,
        }: {
            pathname: string,
            serializer: (storable: T) => object,
            deserializer: (serialized: object) => T,
        }) {
        this.pathname = pathname;
        this.serializer = serializer;
        this.deserializer = deserializer;
    }

    pathname: string;
    serializer: (storable: T) => object;
    deserializer: (serialized: object) => T;


    /**
     * Store a Storable at pathname/id.
     *
     * @param storable the object to save
     */
    store(storable: T): T {
        if (!isStorable(storable)) {
            throw new Error(`${typeof storable} is not storable.`)
        }

        const store = getStore(this.pathname)
        store[storable.id] = storable
        saveStore(this.pathname, store)
        return storable
    }

    /**
     * Return all storable of type T existing at pathname.
     * If nothing is found returns an empty record.
     */
    retrieveAll(): Array<T> {
        const store = getStore(this.pathname)
        if (!Object.keys(store)) return []
        return this.deserializeStore(store);
    }

    /**
     * Return a storable with matching path and path.
     * Throw if no storable is found or path does not exist.
     *
     * @param id Storable id
     */
    retrieveById(id: string): T {
        const store = getStore(this.pathname)
        const serialized = store[id]
        if (!serialized) {
            throw new Error(`Storable '${this.pathname}.${id}' does not exist.`)
        }

        return this.deserializer(serialized)
    }

    /**
     * Delete a Storable stored at pathname/id.
     * Return true if something was deleted, false if nothing exists at pathname/id.
     *
     * @param id Storable id
     */
    deleteById(id: string): boolean {
        const store = getStore(this.pathname)
        if (!store[id]) return false
        delete store[id]
        saveStore(this.pathname, store)
        return true
    }

    /**
     * Return an Array of storable that matches a predicate.
     * Iterate on *all* storables.
     *
     * @param predicate A function that returns true on match
     */
    where(predicate: (storable: T) => boolean): Array<T> {
        const matches: T[] = []
        const all = this.retrieveAll()
        for (let storable of all) {
            if (predicate(storable)) matches.push(storable)
        }
        return matches;
    }


    /**
     * Deserialize a record retrieved from local storage.
     */
    private deserializeStore(store: Record<string, object>): Array<T> {
        const reducer = (accumulator: Array<T>, serialized: object) => {
            accumulator.push(this.deserializer(serialized))
            return accumulator
        }
        return Object.values(store).reduce(reducer, []) as Array<T>
    }
}


export const actionCustomStore = new LocalStore<ActionCustomStorable>({
    pathname: ActionCustom.pathname,
    serializer: (storable) => storable,
    deserializer: (serialized) => new ActionCustomStorable(serialized as ActionCustomInterface),
});

export const actionStatusStore = new LocalStore<ActionStatusStorable>({
    pathname: ActionStatus.pathname,
    serializer: (storable) => storable,
    deserializer: (serialized) => new ActionStatusStorable(serialized as ActionStatusInterface),
});

export const ficheActionStore = new LocalStore<FicheActionStorable>({
    pathname: FicheActionStorable.pathname,
    serializer: (storable) => storable,
    deserializer: (serialized) => new FicheActionStorable(serialized as FicheActionInterface),
});

export const ficheActionCategorieStore = new LocalStore<FicheActionCategorieStorable>({
    pathname: FicheActionCategorieStorable.pathname,
    serializer: (storable) => storable,
    deserializer: (serialized) => new FicheActionCategorieStorable(serialized as FicheActionCategorieInterface),
});

export const indicateurPersonnaliseStore = new LocalStore<IndicateurPersonnaliseStorable>({
    pathname: IndicateurPersonnaliseStorable.pathname,
    serializer: (storable) => storable,
    deserializer: (serialized) => new IndicateurPersonnaliseStorable(serialized as IndicateurPersonnaliseInterface),
});

export const indicateurPersonnaliseValueStore = new LocalStore<IndicateurPersonnaliseValueStorable>({
    pathname: IndicateurPersonnaliseValueStorable.pathname,
    serializer: (storable) => storable,
    deserializer: (serialized) => new IndicateurPersonnaliseValueStorable(serialized as IndicateurPersonnaliseValueInterface),
});

export const utilisateurConnecteStore = new LocalStore<UtilisateurConnecteStorable>({
    pathname: UtilisateurConnecte.pathname,
    serializer: (storable) => storable,
    deserializer: (serialized) => new UtilisateurConnecteStorable(serialized as UtilisateurConnecteInterface),
});