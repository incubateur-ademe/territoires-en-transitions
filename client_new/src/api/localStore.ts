import {MesureCustom, MesureCustomInterface} from "../../generated/models/mesure_custom";
import {ActionCustom, ActionCustomInterface} from "../../generated/models/action_custom";
import {ActionCustomStorable} from "../storables/ActionCustomStorable";
import {MesureCustomStorable} from "../storables/MesureCustomStorable";
import {ActionStatusStorable} from "../storables/ActionStatusStorable";
import {ActionStatus, ActionStatusInterface} from "../../generated/models/action_status";
import {isStorable} from "./storable";
import {FicheActionStorable} from "../storables/FicheActionStorable";
import type {FicheActionInterface} from "../../generated/models/fiche_action";
import {FicheActionCategorieStorable} from "../storables/FicheActionCategorieStorable";
import type {FicheActionCategorieInterface} from "../../generated/models/fiche_action_categorie";
import {IndicateurPersonnaliseStorable} from "../storables/IndicateurPersonnaliseStorable";
import type {IndicateurPersonnaliseInterface} from "../../generated/models/indicateur_personnalise";
import {IndicateurPersonnaliseValueStorable} from "../storables/IndicateurPersonnaliseValueStorable";
import type {IndicateurPersonnaliseValueInterface} from "../../generated/models/indicateur_personnalise_value";
import {IndicateurReferentielCommentaireStorable} from "../storables/IndicateurReferentielCommentaireStorable";
import type {IndicateurReferentielCommentaireInterface} from "../../generated/models/indicateur_referentiel_commentaire";

export const storeKey = 'territoiresentransitions'


/**
 * Get all data of the current user from localStorage
 *
 * Returns an empty store if none found.
 */
const getStore = (): Record<string, any> => {
    const storeJson = localStorage.getItem(storeKey) || '{}'
    return JSON.parse(storeJson)
}

/**
 * Set all data of the current user in localStorage.
 */
const setStore = (newStore: Record<string, any>): Record<string, any> => {
    localStorage.setItem(storeKey, JSON.stringify(newStore))
    return Object.assign({}, newStore)
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
        const store = getStore()

        if (!store[storable.pathname]) {
            store[storable.pathname] = {}
        }

        store[storable.pathname][storable.id] = storable
        setStore(store)
        return storable
    }

    /**
     * Return all storable of type T existing at pathname.
     * If nothing is found returns an empty record.
     */
    retrieveAll(): Array<T> {
        const store = getStore()
        console.log(store)

        if (!store) return []
        if (!store[this.pathname]) return []
        const serialized = store[this.pathname] as Record<string, object>

        return this.deserializeRecord(serialized);
    }

    /**
     * Return a storable with matching path and path.
     * Throw if no storable is found or path does not exist.
     *
     * @param id Storable id
     */
    retrieveById(id: string): T {
        const store = getStore()
        if (!store[this.pathname]) {
            throw new Error(`Path '${this.pathname}' does not exist in is store.`)
        }

        const serialized = store[this.pathname][id]
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
        const store = getStore()
        if (!store[this.pathname]) return false
        if (!store[this.pathname][id]) return false
        delete store[this.pathname][id]
        setStore(store)
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
    private deserializeRecord(record: Record<string, object>): Array<T> {
        const reducer = (accumulator: Array<T>, serialized: object) => {
            accumulator.push(this.deserializer(serialized))
            return accumulator
        }
        return Object.values(record).reduce(reducer, []) as Array<T>
    }
}

export const mesureCustomStore = new LocalStore<MesureCustomStorable>({
    pathname: MesureCustom.pathname,
    serializer: (storable) => storable,
    deserializer: (serialized) => new MesureCustomStorable(serialized as MesureCustomInterface),
});

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

export const indicateurCommentaireStore = new LocalStore<IndicateurCommentaireStorable>({
    pathname: IndicateurCommentaireStorable.pathname,
    serializer: (storable) => storable,
    deserializer: (serialized) => new IndicateurCommentaireStorable(serialized as IndicateurReferentielCommentaireInterface),
});
