import { createClientWithoutCookieOptions } from '@/api/utils/supabase/browser-client';
import { ChangeNotifier } from '@/app/core-logic/api/reactivity';
import { PostgrestResponse } from '@supabase/supabase-js';

export interface DataEvent<T> {
  outcome: 'error' | 'success';
  intent: 'store' | 'retrieve' | 'delete';
  stored: T | null;
  status: number;
}

/**
 * Data layer read only endpoint
 */
export abstract class DataLayerReadEndpoint<
  T,
  GetParams
> extends ChangeNotifier {
  abstract readonly name: string;
  private _lastEvent: DataEvent<T> | null = null;
  private _lastResponse: PostgrestResponse<T> | null = null;

  get lastResponse(): PostgrestResponse<T> | null {
    return this._lastResponse;
  }

  get lastEvent(): DataEvent<T> | null {
    return this._lastEvent;
  }

  get _table() {
    const supabase = createClientWithoutCookieOptions();
    //@ts-expect-error dynamic table name
    return supabase.from(this.name).select();
  }

  /**
   * Get a list of T using getParams.
   *
   * Uses query.
   */
  async getBy(getParams: GetParams): Promise<T[]> {
    const queryResponse = await this._read(getParams);

    return this.handleResponse(queryResponse);
  }

  /**
   * Query our data layer.
   *
   * @param getParams
   */
  abstract _read(getParams: GetParams): Promise<PostgrestResponse<T>>;

  /**
   * Default response handler.
   *
   * Returns response data on success and an empty list on failure.
   * Saves last response and last event.
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
 * Data layer read only endpoint that cache results.
 */
export abstract class DataLayerReadCachedEndpoint<
  T,
  GetParams
> extends DataLayerReadEndpoint<T, GetParams> {
  constructor(changeNotifiers: ChangeNotifier[]) {
    super();
    for (const changeNotifier of changeNotifiers) {
      changeNotifier.addListener(() => {
        this.clearCache();
      });
    }
  }

  _cache: Record<string, T[]> = {};
  _promises: Record<string, Promise<PostgrestResponse<T>>> = {};
  clearCache() {
    this._cache = {};
  }

  /**
   * Get a list of T using getParams.
   *
   * Results are memoized by params.
   */
  async getBy(getParams: GetParams): Promise<T[]> {
    const key = JSON.stringify(getParams);
    if (this._cache[key] !== undefined) {
      return this._cache[key];
    }

    if (this._promises[key] === undefined)
      this._promises[key] = this._read(getParams);
    const queryResponse = await this._promises[key];
    delete this._promises[key];

    this._cache[key] = this.handleResponse(queryResponse);

    return this._cache[key];
  }
}
