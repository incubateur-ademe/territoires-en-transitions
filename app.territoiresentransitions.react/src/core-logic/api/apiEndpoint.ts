import {isStorable, Storable} from './storable';
import {ChangeNotifier} from 'core-logic/api/reactivity';

export interface APIEvent<T extends Storable> {
  outcome: 'error' | 'success';
  intent: 'store' | 'retrieve' | 'delete';
  stored: T | null;
}

/**
 * A Store for Storable object using a remote api
 */
export class APIEndpoint<T extends Storable> extends ChangeNotifier {
  constructor({
    host,
    endpoint,
    serializer,
    deserializer,
    authorization,
  }: {
    host: string;
    endpoint: () => string;
    serializer: (storable: T) => object;
    deserializer: (serialized: object) => T;
    authorization: () => string;
  }) {
    super();
    this.host = host;
    this.pathname = endpoint;
    this.serializer = serializer;
    this.deserializer = deserializer;
    this.authorization = authorization;
  }

  private readonly host: string;
  private readonly pathname: () => string;
  private readonly authorization: () => string;
  private readonly serializer: (storable: T) => object;
  private readonly deserializer: (serialized: object) => T;
  private _lastEvent: APIEvent<T> | null = null;
  private _lastResponse: Response | null = null;

  get lastResponse(): Response | null {
    return this._lastResponse;
  }

  get lastEvent(): APIEvent<T> | null {
    return this._lastEvent;
  }

  /**
   * Store a Storable at pathname/id.
   *
   * @param storable the object to save
   */
  async store(storable: T): Promise<T> {
    if (!isStorable(storable)) {
      throw new Error(`${typeof storable} is not storable.`);
    }
    const response = await fetch(`${this.host}/${this.pathname()}/`, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.authorization(),
      },
      body: JSON.stringify(this.serializer(storable)),
    }).catch(() => {
      this._lastResponse = null;
    });

    this._lastResponse = response ?? null;
    this._lastEvent = {
      outcome: response?.ok ? 'success' : 'error',
      stored: storable,
      intent: 'store',
    };
    this.notifyListeners();

    if (!response) throw new Error('Network error');
    return this.deserializer(await response.json());
  }

  /**
   * ;Return all storable of type T existing at pathname.
   * If nothing is found returns an empty record.
   */
  async retrieveAll(): Promise<Array<T>> {
    return this.retrieveAtPath('all');
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
      headers: {
        Authorization: this.authorization(),
      },
    });

    this._lastResponse = response;

    let storable: T | null;

    try {
      if (response.status === 404) storable = null;
      storable = this.deserializer(await response.json());
      this._lastEvent = {
        outcome: 'success',
        intent: 'retrieve',
        stored: null,
      };
    } catch (e) {
      this._lastEvent = {
        outcome: 'error',
        intent: 'retrieve',
        stored: null,
      };
      storable = null;
    } finally {
      this.notifyListeners();
    }

    return storable;
  }

  async retrieveAtPath(path: string): Promise<Array<T>> {
    const response = await fetch(`${this.host}/${this.pathname()}/${path}`, {
      mode: 'cors',
      method: 'GET',
      headers: {
        Authorization: this.authorization(),
      },
    });

    this._lastResponse = response;
    const results: T[] = [];

    try {
      const data = await response.json();

      for (let i = 0; i < data.length; i++) {
        results.push(this.deserializer(data[i]));
      }
      this._lastEvent = {
        outcome: 'success',
        intent: 'retrieve',
        stored: null,
      };
    } catch (e) {
      this._lastEvent = {
        outcome: 'error',
        intent: 'retrieve',
        stored: null,
      };
    } finally {
      this.notifyListeners();
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
      headers: {
        Authorization: this.authorization(),
      },
    });

    this._lastResponse = response;

    if (response.ok) {
      this._lastEvent = {
        outcome: 'success',
        intent: 'delete',
        stored: null,
      };
    } else {
      this._lastEvent = {
        outcome: 'error',
        intent: 'delete',
        stored: null,
      };
    }
    this.notifyListeners();
    return response.ok;
  }
}
