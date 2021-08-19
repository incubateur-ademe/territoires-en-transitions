import {isStorable, Storable} from './storable';
import {APIEndpoint} from './apiEndpoint';
import {ChangeNotifier} from 'core-logic/api/reactivity';

/**
 * A Store for Storable object using a remote api and a local cache.
 *
 * The local cache is kept in memory for now.
 */
export class HybridStore<T extends Storable> extends ChangeNotifier {
  constructor({
    host,
    endpoint,
    serializer,
    deserializer,
    authorization = () => '',
  }: {
    host: string;
    endpoint: () => string;
    serializer: (storable: T) => object;
    deserializer: (serialized: object) => T;
    authorization?: () => string;
  }) {
    super();
    this.host = host;
    this.pathname = endpoint;
    this.serializer = serializer;
    this.deserializer = deserializer;

    this.api = new APIEndpoint<T>({
      host: this.host,
      endpoint: this.pathname,
      serializer: this.serializer,
      deserializer: this.deserializer,
      authorization: authorization,
    });

    /*
        todo use local store for caching
        this.local = new LocalStore<T>({
            pathname: this.pathname(),
            serializer: this.serializer,
            deserializer: this.deserializer
        });
        */
  }

  host: string;
  pathname: () => string;
  serializer: (storable: T) => object;
  deserializer: (serialized: object) => T;
  api: APIEndpoint<T>;
  private cache: Map<string, T> = new Map<string, T>();

  // local: LocalStore<T>;

  /**
   * Store a Storable at pathname/id.
   *
   * @param storable the object to save
   */
  async store(storable: T): Promise<T> {
    if (!isStorable(storable)) {
      throw new Error(`${typeof storable} is not storable.`);
    }

    const stored = await this.api.store(storable);
    return this.writeInCache(stored);
  }

  /**
   * Return all storables of type T existing at pathname.
   * If nothing is found returns an empty record.
   */
  async retrieveAll(): Promise<Array<T>> {
    const all = await this.getCache();
    return [...all.values()];
  }

  /**
   * Return all storables by id in map of type string, T existing at pathname.
   * If nothing is found returns an empty record.
   */
  async retrieveAllAsMap(): Promise<Map<string, T>> {
    const all = await this.getCache();
    return new Map(all);
  }

  /**
   * Return a storable with matching id.
   * Throw if no storable is found or path does not exist.
   *
   * @param id Storable id
   */
  async retrieveById(id: string): Promise<T | null> {
    const cache = await this.getCache();
    return cache.get(id) ?? null;
  }

  /**
   * Return a storable with matching path.
   * Throw if no storable is found or path does not exist.
   *
   * @param path Storable path
   */
  async retrieveByPath(path: string): Promise<T | null> {
    const cache = await this.getCache();
    for (const key of cache.keys()) {
      if (key.startsWith(path)) return cache.get(key)!;
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

    for (const key of cache.keys()) {
      if (key.startsWith(path)) results.push(cache.get(key)!);
    }

    return [...results];
  }

  /**
   * Delete a Storable stored at pathname/id.
   * Return true if something was deleted, false if nothing exists at pathname/id.
   *
   * @param id Storable id
   */
  async deleteById(id: string): Promise<boolean> {
    const deleted = await this.api.deleteById(this.stripId(id));
    await this.removeFromCache(id);
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
    const endpoint = this.pathname().split('/');
    let path = id.split('/');
    let match = false;

    for (let i = 0; i < endpoint.length; i++) {
      const part = endpoint[i];
      if (part === path[0]) {
        match = true;
        path = path.slice(1);
      } else if (match) {
        break;
      }
    }

    return path.join('/');
  }

  private async writeInCache(storable: T): Promise<T> {
    const cache = await this.getCache();
    cache.set(storable.id, storable);
    this.notifyListeners();
    return storable;
  }

  private async removeFromCache(id: string): Promise<boolean> {
    const cache = await this.getCache();
    return cache.delete(id);
  }

  private async getCache(): Promise<Map<string, T>> {
    const pathname = this.pathname();

    if (this.fetchedPaths.includes(pathname)) {
      return this.cache;
    }

    if (!this.retrieving[pathname]) {
      const promise = this.api.retrieveAll().then(all => {
        const retrieved = new Map<string, T>();
        for (const storable of all) {
          retrieved.set(storable.id, storable);
        }
        return retrieved;
      });

      promise.then(retrieved => {
        for (const [key, value] of retrieved.entries()) {
          this.cache.set(key, value);
        }
        this.notifyListeners();
        this.fetchedPaths.push(pathname);
      });

      this.retrieving[pathname] = promise;
    }

    return this.retrieving[pathname];
  }

  private fetchedPaths: string[] = [];
  private retrieving: Record<string, Promise<Map<string, T>>> = {};
}
