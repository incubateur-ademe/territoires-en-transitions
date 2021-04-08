import {isStorable, Storable} from "./storable";
import {IndicateurValueStorable} from "../storables/IndicateurValueStorable";
import {IndicateurValue, IndicateurValueInterface} from "../../generated/models/indicateur_value";
import {APIStore} from "./apiStore";
import {getCurrentEpciId} from "./currentEpci";
import {ActionStatus, ActionStatusInterface} from "../../generated/models/action_status";
import {ActionStatusStorable} from "../storables/ActionStatusStorable";
import {ActionCustomStorable} from "../storables/ActionCustomStorable";
import {ActionCustom, ActionCustomInterface} from "../../generated/models/action_custom";
import {getCurrentAPI} from "./currentAPI";
import {MesureCustomStorable} from "../storables/MesureCustomStorable";
import {MesureCustom, MesureCustomInterface} from "../../generated/models/mesure_custom";

/**
 * A Store for Storable object using a remote api and a local cache.
 *
 * The local cache is kept in memory for now.
 */
class HybridStore<T extends Storable> {
    constructor(
        {
            host,
            endpoint,
            serializer,
            deserializer,
        }: {
            host: string,
            endpoint: string,
            serializer: (storable: T) => object,
            deserializer: (serialized: object) => T,
        }) {
        this.host = host;
        this.pathname = endpoint;
        this.serializer = serializer;
        this.deserializer = deserializer;

        this.api = new APIStore<T>({
            host: this.host,
            endpoint: this.pathname,
            serializer: this.serializer,
            deserializer: this.deserializer
        });

        /*
        todo use local store for caching
        this.local = new LocalStore<T>({
            pathname: this.pathname,
            serializer: this.serializer,
            deserializer: this.deserializer
        });
        */
    }

    host: string;
    pathname: string;
    serializer: (storable: T) => object;
    deserializer: (serialized: object) => T;
    api: APIStore<T>;
    private cache: T[] | null = null;

    // local: LocalStore<T>;


    /**
     * Store a Storable at pathname/id.
     *
     * @param storable the object to save
     */
    async store(storable: T): Promise<T> {
        if (!isStorable(storable)) {
            throw new Error(`${typeof storable} is not storable.`)
        }

        const stored = await this.api.store(storable);
        return this.writeInCache(stored);
    }


    /**
     * Return all storable of type T existing at pathname.
     * If nothing is found returns an empty record.
     */
    retrieveAll(): Promise<Array<T>> {
        return this.getCache();
    }


    /**
     * Return a storable with matching id.
     * Throw if no storable is found or path does not exist.
     *
     * @param id Storable id
     */
    async retrieveById(id: string): Promise<T | null> {
        return this.retrieveByPath(id);
    }

    /**
     * Return a storable with matching path.
     * Throw if no storable is found or path does not exist.
     *
     * @param path Storable path
     */
    async retrieveByPath(path: string): Promise<T | null> {
        const cache = await this.getCache();
        for (let storable of cache) {
            if (storable.id.startsWith(path)) return storable;
        }
        return null;
    }

    /**
     * Return all storable of type T existing at path under pathname.
     * If nothing is found returns an empty list.
     */
    async retrieveAtPath(path: string): Promise<Array<T>> {
        const cache = await this.getCache();
        const results = [];

        for (let storable of cache) {
            if (storable.id.startsWith(path)) results.push(storable);
        }

        return results;
    }

    /**
     * Delete a Storable stored at pathname/id.
     * Return true if something was deleted, false if nothing exists at pathname/id.
     *
     * @param id Storable id
     */
    async deleteById(id: string): Promise<boolean> {
        const deleted = await this.api.deleteById(this.stripId(id));
        const cache = await this.getCache();
        this.cache = cache.filter(cached => cached.id !== id);
        return deleted;
    }


    /**
     * Strip id removes redundant parts shared by the id and the endpoint.
     *
     * Ex: if the endpoint path is `v1/endpoint/epci_id/`
     * and the id is `epci_id/part_a/part_b`
     * the resulting stripped id would be `part_a/part_b`,
     * a path removed from the redundant part `epci_id`
     */
    private stripId(id: string): string {
        const endpoint = this.pathname.split('/');
        let path = id.split('/');
        let match = false;

        for (let i = 0; i < endpoint.length; i++) {
            let part = endpoint[i];
            if (part == path[0]) {
                match = true;
                path = path.slice(1);
            } else if (match) {
                break;
            }
        }

        return path.join('/');
    }

    private async writeInCache(storable: T): Promise<T> {
        await this.removeFromCache(storable.id);
        const cache = await this.getCache();
        cache.push(storable);
        this.cache = cache;
        return storable;
    }

    private async removeFromCache(id: string): Promise<boolean> {
        const cache = await this.getCache();
        const filtered = cache.filter(cached => cached.id !== id);
        const deleted = filtered.length != cache.length;
        this.cache = filtered;
        return deleted;
    }

    private async getCache(): Promise<Array<T>> {
        if (this.cache !== null) return this.cache;

        if (this.retrieving === null) {
            this.retrieving = this.api.retrieveAll();

            this.retrieving.then((retrieved) => {
                this.cache = retrieved;
            });
        }
        return this.retrieving;
    }

    private retrieving: Promise<Array<T>> | null = null;
}


export const indicateurValueStore = new HybridStore<IndicateurValueStorable>({
    host: getCurrentAPI(),
    endpoint: `v1/${IndicateurValue.pathname}/${getCurrentEpciId()}`,
    serializer: (storable) => storable,
    deserializer: (serialized) => new IndicateurValueStorable(serialized as IndicateurValueInterface),
});

export const actionStatusStore = new HybridStore<ActionStatusStorable>({
    host: getCurrentAPI(),
    endpoint: `v1/${ActionStatus.pathname}/${getCurrentEpciId()}`,
    serializer: (storable) => storable,
    deserializer: (serialized) => new ActionStatusStorable(serialized as ActionStatusInterface),
});

export const actionCustomStore = new HybridStore<ActionCustomStorable>({
    host: getCurrentAPI(),
    endpoint: `v1/${ActionCustom.pathname}/${getCurrentEpciId()}`,
    serializer: (storable) => storable,
    deserializer: (serialized) => new ActionCustomStorable(serialized as ActionCustomInterface),
});

export const mesureCustomStore = new HybridStore<MesureCustomStorable>({
    host: getCurrentAPI(),
    endpoint: `v1/${MesureCustom.pathname}/${getCurrentEpciId()}`,
    serializer: (storable) => storable,
    deserializer: (serialized) => new MesureCustomStorable(serialized as MesureCustomInterface),
});