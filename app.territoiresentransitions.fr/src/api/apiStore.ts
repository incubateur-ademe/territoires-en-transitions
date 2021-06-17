import {isStorable} from "./storable";

/**
 * A Store for Storable object using a remote api
 */
export class APIStore<T> {
    constructor(
        {
            host,
            endpoint,
            serializer,
            deserializer,
        }: {
            host: string,
            endpoint: () => string,
            serializer: (storable: T) => object,
            deserializer: (serialized: object) => T,
        }) {
        this.host = host;
        this.pathname = endpoint;
        this.serializer = serializer;
        this.deserializer = deserializer;
    }

    host: string;
    pathname: () => string;
    serializer: (storable: T) => object;
    deserializer: (serialized: object) => T;


    /**
     * Store a Storable at pathname/id.
     *
     * @param storable the object to save
     */
    async store(storable: T): Promise<T> {
        if (!isStorable(storable)) {
            throw new Error(`${typeof storable} is not storable.`)
        }

        const response = await fetch(`${this.host}/${this.pathname()}/`, {
            method: 'POST',
            mode: 'cors',
            body: JSON.stringify(this.serializer(storable))
        });

        return this.deserializer(await response.json());
    }

    /**
     * Return all storable of type T existing at pathname.
     * If nothing is found returns an empty record.
     */
    async retrieveAll(): Promise<Array<T>> {
        return this.retrieveAtPath('all')
    }

    /**
     * Return a storable with matching path and path.
     * Throw if no storable is found or path does not exist.
     *
     * @param id Storable id
     */
    async retrieveById(id: string): Promise<T | null> {
        return this.retrieveByPath(id);
    }

    async retrieveByPath(path: string): Promise<T | null> {
        const response = await fetch(`${this.host}/${this.pathname()}/${path}`, {
            mode: 'cors',
            method: 'GET',
        });

        if (response.status == 404) return null;
        return this.deserializer(await response.json());
    }

    async retrieveAtPath(path: string): Promise<Array<T>> {
        const response = await fetch(`${this.host}/${this.pathname()}/${path}`, {
            mode: 'cors',
            method: 'GET',
        });

        const data = await response.json();
        const results = [];

        for (let i = 0; i < data.length; i++) {
            results.push(this.deserializer(data[i]));
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
        const response = await fetch(`${this.host}/${this.pathname()}/${id}`, {
            mode: 'cors',
            method: 'DELETE',
        });

        return response.status == 200;
    }
}
