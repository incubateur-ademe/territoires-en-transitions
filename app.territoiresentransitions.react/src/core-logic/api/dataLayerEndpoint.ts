import {Storable} from './storable';
import {ChangeNotifier} from 'core-logic/api/reactivity';
import {supabase} from './supabase';
import {PostgrestResponse} from '@supabase/supabase-js';

export interface DataEvent<T extends Storable> {
  outcome: 'error' | 'success';
  intent: 'store' | 'retrieve' | 'delete';
  stored: T | null;
  status: number;
}

/**
 * Data layer read only endpoint
 */
export abstract class DataLayerReadEndpoint<
  T extends Storable,
  GetParams
> extends ChangeNotifier {
  protected constructor({name}: {name: string}) {
    super();
    this.name = name;
  }

  private readonly name: string;
  private _lastEvent: DataEvent<T> | null = null;
  private _lastResponse: PostgrestResponse<T> | null = null;

  get lastResponse(): PostgrestResponse<T> | null {
    return this._lastResponse;
  }

  get lastEvent(): DataEvent<T> | null {
    return this._lastEvent;
  }

  get _table() {
    return supabase.from(this.name).select();
  }

  /**
   * Get a list of T using getParams.
   *
   * Uses query.
   */
  async getBy(getParams: GetParams): Promise<T[]> {
    const queryResponse = await this.query(getParams);

    return this.handleResponse(queryResponse);
  }

  /**
   * Query our data layer.
   *
   * @param getParams
   */
  abstract query(getParams: GetParams): Promise<PostgrestResponse<T>>;

  /**
   * Default response handler.
   */
  handleResponse(response: PostgrestResponse<T>): T[] {
    this._lastResponse = response;

    if (response.error !== null) {
      this._lastEvent = {
        outcome: 'error',
        intent: 'retrieve',
        stored: null,
        status: response.status,
      };
      this.notifyListeners();
      return [];
    }

    this._lastEvent = {
      outcome: 'success',
      intent: 'retrieve',
      stored: null,
      status: response.status,
    };
    this.notifyListeners();
    return response.data;
  }
}

/**
 * Data layer write only endpoint
 */
export abstract class DataLayerWriteEndpoint<
  T extends Storable
> extends ChangeNotifier {
  protected constructor({name}: {name: string}) {
    super();
    this.name = name;
  }

  private readonly name: string;
  private _lastEvent: DataEvent<T> | null = null;
  private _lastResponse: PostgrestResponse<T> | null = null;

  get lastResponse(): PostgrestResponse<T> | null {
    return this._lastResponse;
  }

  get lastEvent(): DataEvent<T> | null {
    return this._lastEvent;
  }

  get _table() {
    return supabase.from(this.name).select();
  }

  /**
   * Get a list of T using getParams.
   *
   * Uses query.
   */
  async save(storable: T): Promise<T | null> {
    const queryResponse = await this.query(storable);

    return this.handleResponse(queryResponse);
  }

  /**
   * Query our data layer.
   */
  abstract query(storable: T): Promise<PostgrestResponse<T>>;

  /**
   * Default response handler.
   */
  handleResponse(response: PostgrestResponse<T>): T | null {
    this._lastResponse = response;

    if (response.error !== null) {
      this._lastEvent = {
        outcome: 'error',
        intent: 'retrieve',
        stored: null,
        status: response.status,
      };
      this.notifyListeners();
      return null;
    }

    const saved = response.data[0];
    this._lastEvent = {
      outcome: 'success',
      intent: 'store',
      stored: saved,
      status: response.status,
    };
    this.notifyListeners();
    return saved;
  }
}
