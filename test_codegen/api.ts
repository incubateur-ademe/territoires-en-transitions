/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface ActionMeta {
  /**
   * @min 1
   * @max 2147483647
   */
  id: number;
  action_id: string;
  epci_id: string;
  meta?: any;

  /** @format date-time */
  created_at: string;

  /** @format date-time */
  modified_at: string;
  latest: boolean;
}

export interface ActionMetaIn {
  action_id: string;
  epci_id: string;
  meta?: any;
}

export interface ActionReferentielScore {
  action_id: string;
  action_nomenclature_id: string;
  avancement: "faite" | "programmee" | "pas_faite" | "non_concernee" | "" | "en_cours";
  points: number;
  percentage: number;
  potentiel: number;
  referentiel_points: number;
  referentiel_percentage: number;
}

export interface ActionStatus {
  /**
   * @min 1
   * @max 2147483647
   */
  id: number;
  action_id: string;
  epci_id: string;
  avancement: string;

  /** @format date-time */
  created_at: string;

  /** @format date-time */
  modified_at: string;
  latest: boolean;
}

export interface ActionStatusIn {
  action_id: string;
  epci_id: string;
  avancement: string;
}

export interface AdemeUser {
  userId: string;
  username: string;
  lastname: string;
  firstname: string;
  email: string;
  enabled: boolean;
}

export interface Epci {
  /**
   * @min 1
   * @max 2147483647
   */
  id: number;
  uid: string;
  insee: string;
  siren: string;
  nom: string;

  /** @format date-time */
  created_at: string;

  /** @format date-time */
  modified_at: string;
  latest: boolean;
}

export interface EpciIn {
  uid: string;
  insee: string;
  siren: string;
  nom: string;
}

export interface FicheAction {
  /**
   * @min 1
   * @max 2147483647
   */
  id: number;
  epci_id: string;
  uid: string;
  custom_id: string;
  avancement: string;
  en_retard: boolean;
  referentiel_action_ids?: any;
  referentiel_indicateur_ids?: any;
  titre: string;
  description: string;
  budget: number;
  personne_referente: string;
  structure_pilote: string;
  elu_referent: string;
  partenaires: string;
  commentaire: string;
  date_debut: string;
  date_fin: string;
  indicateur_personnalise_ids?: any;
  latest: boolean;
  deleted: boolean;

  /** @format date-time */
  created_at: string;

  /** @format date-time */
  modified_at: string;
}

export interface FicheActionCategorie {
  /**
   * @min 1
   * @max 2147483647
   */
  id: number;
  epci_id: string;
  uid: string;
  parent_uid: string;
  nom: string;
  fiche_actions_uids?: any;

  /** @format date-time */
  created_at: string;

  /** @format date-time */
  modified_at: string;
  latest: boolean;
  deleted: boolean;
}

export interface FicheActionCategorieIn {
  epci_id: string;
  uid: string;
  parent_uid: string;
  nom: string;
  fiche_actions_uids?: any;
}

export interface FicheActionIn {
  epci_id: string;
  uid: string;
  custom_id: string;
  avancement: string;
  en_retard: boolean;
  referentiel_action_ids?: any;
  referentiel_indicateur_ids?: any;
  titre: string;
  description: string;
  budget: number;
  personne_referente: string;
  structure_pilote: string;
  elu_referent: string;
  partenaires: string;
  commentaire: string;
  date_debut: string;
  date_fin: string;
  indicateur_personnalise_ids?: any;
}

export interface HTTPNotFoundError {
  detail: string;
}

export interface HTTPValidationError {
  detail?: ValidationError[];
}

export interface IndicateurPersonnalise {
  /**
   * @min 1
   * @max 2147483647
   */
  id: number;
  epci_id: string;
  uid: string;
  custom_id: string;
  nom: string;
  description: string;
  unite: string;
  meta?: any;

  /** @format date-time */
  created_at: string;

  /** @format date-time */
  modified_at: string;
  latest: boolean;
  deleted: boolean;
}

export interface IndicateurPersonnaliseIn {
  epci_id: string;
  uid: string;
  custom_id: string;
  nom: string;
  description: string;
  unite: string;
  meta?: any;
}

export interface IndicateurPersonnaliseValue {
  /**
   * @min 1
   * @max 2147483647
   */
  id: number;
  epci_id: string;
  indicateur_id: string;
  value: string;

  /**
   * @min -2147483648
   * @max 2147483647
   */
  year: number;

  /** @format date-time */
  created_at: string;

  /** @format date-time */
  modified_at: string;
  latest: boolean;
}

export interface IndicateurPersonnaliseValueIn {
  epci_id: string;
  indicateur_id: string;
  value: string;

  /**
   * @min -2147483648
   * @max 2147483647
   */
  year: number;
}

export interface IndicateurReferentielCommentaire {
  /**
   * @min 1
   * @max 2147483647
   */
  id: number;
  epci_id: string;
  indicateur_id: string;
  value: string;

  /** @format date-time */
  created_at: string;

  /** @format date-time */
  modified_at: string;
  latest: boolean;
}

export interface IndicateurReferentielCommentaireIn {
  epci_id: string;
  indicateur_id: string;
  value: string;
}

export interface IndicateurValue {
  /**
   * @min 1
   * @max 2147483647
   */
  id: number;
  epci_id: string;
  indicateur_id: string;
  value: string;

  /**
   * @min -2147483648
   * @max 2147483647
   */
  year: number;

  /** @format date-time */
  created_at: string;

  /** @format date-time */
  modified_at: string;
  latest: boolean;
}

export interface IndicateurValueIn {
  epci_id: string;
  indicateur_id: string;
  value: string;

  /**
   * @min -2147483648
   * @max 2147483647
   */
  year: number;
}

export interface Status {
  message: string;
}

/**
* Represent a connected user.

Used client side to keep as `session` data.
Used server side to use access token Personally Identifiable Information.
*/
export interface UtilisateurConnecte {
  ademe_user_id: string;
  access_token: string;
  refresh_token: string;
  email: string;
  nom: string;
  prenom: string;
}

export interface UtilisateurDroits {
  /**
   * @min 1
   * @max 2147483647
   */
  id: number;
  ademe_user_id: string;
  epci_id: string;
  ecriture: boolean;

  /** @format date-time */
  created_at: string;

  /** @format date-time */
  modified_at: string;
  latest: boolean;
}

export interface UtilisateurDroitsIn {
  ademe_user_id: string;
  epci_id: string;
  ecriture: boolean;
}

/**
 * User data retrieved from OpenId token
 */
export interface UtilisateurInscription {
  email: string;
  nom: string;
  prenom: string;
  vie_privee_conditions: string;
}

export interface ValidationError {
  loc: string[];
  msg: string;
  type: string;
}

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">;

export interface FullRequestParams extends Omit<RequestInit, "body"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat;
  /** request body */
  body?: unknown;
  /** base url */
  baseUrl?: string;
  /** request cancellation token */
  cancelToken?: CancelToken;
}

export type RequestParams = Omit<FullRequestParams, "body" | "method" | "query" | "path">;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
  securityWorker?: (securityData: SecurityDataType | null) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown> extends Response {
  data: D;
  error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
  Json = "application/json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = "";
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private abortControllers = new Map<CancelToken, AbortController>();
  private customFetch = (...fetchParams: Parameters<typeof fetch>) => fetch(...fetchParams);

  private baseApiParams: RequestParams = {
    credentials: "same-origin",
    headers: {},
    redirect: "follow",
    referrerPolicy: "no-referrer",
  };

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig);
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  private encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`;
  }

  private addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key]);
  }

  private addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key];
    return value.map((v: any) => this.encodeQueryParam(key, v)).join("&");
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter((key) => "undefined" !== typeof query[key]);
    return keys
      .map((key) => (Array.isArray(query[key]) ? this.addArrayQueryParam(query, key) : this.addQueryParam(query, key)))
      .join("&");
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : "";
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string") ? JSON.stringify(input) : input,
    [ContentType.FormData]: (input: any) =>
      Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key];
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === "object" && property !== null
            ? JSON.stringify(property)
            : `${property}`,
        );
        return formData;
      }, new FormData()),
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  private mergeRequestParams(params1: RequestParams, params2?: RequestParams): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  private createAbortSignal = (cancelToken: CancelToken): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken);
      if (abortController) {
        return abortController.signal;
      }
      return void 0;
    }

    const abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  };

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken);

    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  };

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<HttpResponse<T, E>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || requestParams.format;

    return this.customFetch(`${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`, {
      ...requestParams,
      headers: {
        ...(type && type !== ContentType.FormData ? { "Content-Type": type } : {}),
        ...(requestParams.headers || {}),
      },
      signal: cancelToken ? this.createAbortSignal(cancelToken) : void 0,
      body: typeof body === "undefined" || body === null ? null : payloadFormatter(body),
    }).then(async (response) => {
      const r = response as HttpResponse<T, E>;
      r.data = null as unknown as T;
      r.error = null as unknown as E;

      const data = !responseFormat
        ? r
        : await response[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data;
              } else {
                r.error = data;
              }
              return r;
            })
            .catch((e) => {
              r.error = e;
              return r;
            });

      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }

      if (!response.ok) throw data;
      return data;
    });
  };
}

/**
 * @title The best API ever
 * @version 0.0.1 beta
 *
 * API for humans
 */
export class Api<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
  v2 = {
    /**
     * No description
     *
     * @name WriteEpciActionStatusV2ActionStatusEpciIdPost
     * @summary Write Epci Action Status
     * @request POST:/v2/action_status/{epci_id}
     * @secure
     */
    writeEpciActionStatusV2ActionStatusEpciIdPost: (epciId: string, data: ActionStatusIn, params: RequestParams = {}) =>
      this.request<ActionStatus, HTTPValidationError>({
        path: `/v2/action_status/${epciId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @name GetAllEpciActionsStatusV2ActionStatusEpciIdAllGet
     * @summary Get All Epci Actions Status
     * @request GET:/v2/action_status/{epci_id}/all
     */
    getAllEpciActionsStatusV2ActionStatusEpciIdAllGet: (epciId: string, params: RequestParams = {}) =>
      this.request<ActionStatus[], HTTPValidationError>({
        path: `/v2/action_status/${epciId}/all`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @name GetActionStatusV2ActionStatusEpciIdActionIdGet
     * @summary Get Action Status
     * @request GET:/v2/action_status/{epci_id}/{action_id}
     */
    getActionStatusV2ActionStatusEpciIdActionIdGet: (epciId: string, actionId: string, params: RequestParams = {}) =>
      this.request<ActionStatus, HTTPNotFoundError | HTTPValidationError>({
        path: `/v2/action_status/${epciId}/${actionId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @name WriteEpciFicheActionV2FicheActionEpciIdPost
     * @summary Write Epci Fiche Action
     * @request POST:/v2/fiche_action/{epci_id}
     * @secure
     */
    writeEpciFicheActionV2FicheActionEpciIdPost: (epciId: string, data: FicheActionIn, params: RequestParams = {}) =>
      this.request<FicheAction, HTTPValidationError>({
        path: `/v2/fiche_action/${epciId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @name GetAllEpciActionsStatusV2FicheActionEpciIdAllGet
     * @summary Get All Epci Actions Status
     * @request GET:/v2/fiche_action/{epci_id}/all
     */
    getAllEpciActionsStatusV2FicheActionEpciIdAllGet: (epciId: string, params: RequestParams = {}) =>
      this.request<FicheAction[], HTTPValidationError>({
        path: `/v2/fiche_action/${epciId}/all`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @name GetFicheActionV2FicheActionEpciIdUidGet
     * @summary Get Fiche Action
     * @request GET:/v2/fiche_action/{epci_id}/{uid}
     */
    getFicheActionV2FicheActionEpciIdUidGet: (epciId: string, uid: string, params: RequestParams = {}) =>
      this.request<FicheAction, HTTPNotFoundError | HTTPValidationError>({
        path: `/v2/fiche_action/${epciId}/${uid}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @name DeleteFicheActionV2FicheActionEpciIdUidDelete
     * @summary Delete Fiche Action
     * @request DELETE:/v2/fiche_action/{epci_id}/{uid}
     * @secure
     */
    deleteFicheActionV2FicheActionEpciIdUidDelete: (epciId: string, uid: string, params: RequestParams = {}) =>
      this.request<Status, HTTPNotFoundError | HTTPValidationError>({
        path: `/v2/fiche_action/${epciId}/${uid}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @name WriteEpciFicheActionCategorieV2FicheActionCategorieEpciIdPost
     * @summary Write Epci Fiche Action Categorie
     * @request POST:/v2/fiche_action_categorie/{epci_id}
     * @secure
     */
    writeEpciFicheActionCategorieV2FicheActionCategorieEpciIdPost: (
      epciId: string,
      data: FicheActionCategorieIn,
      params: RequestParams = {},
    ) =>
      this.request<FicheActionCategorie, HTTPValidationError>({
        path: `/v2/fiche_action_categorie/${epciId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @name GetAllEpciActionCategoriesStatusV2FicheActionCategorieEpciIdAllGet
     * @summary Get All Epci Action Categories Status
     * @request GET:/v2/fiche_action_categorie/{epci_id}/all
     */
    getAllEpciActionCategoriesStatusV2FicheActionCategorieEpciIdAllGet: (epciId: string, params: RequestParams = {}) =>
      this.request<FicheActionCategorie[], HTTPValidationError>({
        path: `/v2/fiche_action_categorie/${epciId}/all`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @name GetFicheActionCategorieV2FicheActionCategorieEpciIdUidGet
     * @summary Get Fiche Action Categorie
     * @request GET:/v2/fiche_action_categorie/{epci_id}/{uid}
     */
    getFicheActionCategorieV2FicheActionCategorieEpciIdUidGet: (
      epciId: string,
      uid: string,
      params: RequestParams = {},
    ) =>
      this.request<FicheActionCategorie, HTTPNotFoundError | HTTPValidationError>({
        path: `/v2/fiche_action_categorie/${epciId}/${uid}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @name DeleteFicheActionCategorieV2FicheActionCategorieEpciIdUidDelete
     * @summary Delete Fiche Action Categorie
     * @request DELETE:/v2/fiche_action_categorie/{epci_id}/{uid}
     * @secure
     */
    deleteFicheActionCategorieV2FicheActionCategorieEpciIdUidDelete: (
      epciId: string,
      uid: string,
      params: RequestParams = {},
    ) =>
      this.request<Status, HTTPNotFoundError | HTTPValidationError>({
        path: `/v2/fiche_action_categorie/${epciId}/${uid}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @name WriteEpciIndicateurReferentielCommentaireV2IndicateurReferentielCommentaireEpciIdPost
     * @summary Write Epci Indicateur Referentiel Commentaire
     * @request POST:/v2/indicateur_referentiel_commentaire/{epci_id}
     * @secure
     */
    writeEpciIndicateurReferentielCommentaireV2IndicateurReferentielCommentaireEpciIdPost: (
      epciId: string,
      data: IndicateurReferentielCommentaireIn,
      params: RequestParams = {},
    ) =>
      this.request<IndicateurReferentielCommentaire, HTTPValidationError>({
        path: `/v2/indicateur_referentiel_commentaire/${epciId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @name GetAllEpciIndicateurReferentielCommentaireV2IndicateurReferentielCommentaireEpciIdAllGet
     * @summary Get All Epci Indicateur Referentiel Commentaire
     * @request GET:/v2/indicateur_referentiel_commentaire/{epci_id}/all
     */
    getAllEpciIndicateurReferentielCommentaireV2IndicateurReferentielCommentaireEpciIdAllGet: (
      epciId: string,
      params: RequestParams = {},
    ) =>
      this.request<IndicateurReferentielCommentaire[], HTTPValidationError>({
        path: `/v2/indicateur_referentiel_commentaire/${epciId}/all`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @name GetIndicateurReferentielCommentaireV2IndicateurReferentielCommentaireEpciIdIndicateurIdGet
     * @summary Get Indicateur Referentiel Commentaire
     * @request GET:/v2/indicateur_referentiel_commentaire/{epci_id}/{indicateur_id}
     */
    getIndicateurReferentielCommentaireV2IndicateurReferentielCommentaireEpciIdIndicateurIdGet: (
      epciId: string,
      indicateurId: string,
      params: RequestParams = {},
    ) =>
      this.request<IndicateurReferentielCommentaire, HTTPNotFoundError | HTTPValidationError>({
        path: `/v2/indicateur_referentiel_commentaire/${epciId}/${indicateurId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Register a new user
     *
     * @name RegisterV2AuthRegisterPost
     * @summary Register
     * @request POST:/v2/auth/register
     */
    registerV2AuthRegisterPost: (data: UtilisateurInscription, params: RequestParams = {}) =>
      this.request<any, HTTPValidationError>({
        path: `/v2/auth/register`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * @description Returns a token from a code
     *
     * @name TokenV2AuthTokenGet
     * @summary Token
     * @request GET:/v2/auth/token
     */
    tokenV2AuthTokenGet: (query: { code: string; redirect_uri: string }, params: RequestParams = {}) =>
      this.request<any, HTTPValidationError>({
        path: `/v2/auth/token`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * @description Return the identity of the currently authenticated user
     *
     * @name GetCurrentUserV2AuthIdentityGet
     * @summary Get Current User
     * @request GET:/v2/auth/identity
     * @secure
     */
    getCurrentUserV2AuthIdentityGet: (params: RequestParams = {}) =>
      this.request<UtilisateurConnecte, any>({
        path: `/v2/auth/identity`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description Compter le nombre d'utilisateurs en base (permet de tester la connexion a l'API de l'ADEME)
     *
     * @name SupervisionCountV2AuthSupervisionCountGet
     * @summary Supervision Count
     * @request GET:/v2/auth/supervision/count
     */
    supervisionCountV2AuthSupervisionCountGet: (params: RequestParams = {}) =>
      this.request<any, any>({
        path: `/v2/auth/supervision/count`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @name WriteDroitsV2UtilisateurDroitsPost
     * @summary Write Droits
     * @request POST:/v2/utilisateur_droits
     * @secure
     */
    writeDroitsV2UtilisateurDroitsPost: (data: UtilisateurDroitsIn, params: RequestParams = {}) =>
      this.request<UtilisateurDroits, HTTPValidationError>({
        path: `/v2/utilisateur_droits`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @name GetDroitsV2UtilisateurDroitsAdemeUserIdGet
     * @summary Get Droits
     * @request GET:/v2/utilisateur_droits/{ademe_user_id}
     */
    getDroitsV2UtilisateurDroitsAdemeUserIdGet: (ademeUserId: string, params: RequestParams = {}) =>
      this.request<UtilisateurDroits[], HTTPNotFoundError | HTTPValidationError>({
        path: `/v2/utilisateur_droits/${ademeUserId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description For an existing Epci corresponding `utilisateur droits` are needed. Otherwise `utilisateur droits` are created for the token bearer.
     *
     * @name WriteEpciV2EpciPost
     * @summary Write Epci
     * @request POST:/v2/epci
     * @secure
     */
    writeEpciV2EpciPost: (data: EpciIn, params: RequestParams = {}) =>
      this.request<Epci, HTTPValidationError>({
        path: `/v2/epci`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @name GetAllEpciV2EpciAllGet
     * @summary Get All Epci
     * @request GET:/v2/epci/all
     */
    getAllEpciV2EpciAllGet: (params: RequestParams = {}) =>
      this.request<Epci[], any>({
        path: `/v2/epci/all`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @name GetEpciV2EpciUidGet
     * @summary Get Epci
     * @request GET:/v2/epci/{uid}
     */
    getEpciV2EpciUidGet: (uid: string, params: RequestParams = {}) =>
      this.request<Epci, HTTPNotFoundError | HTTPValidationError>({
        path: `/v2/epci/${uid}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @name WriteEpciIndicateurPersonnaliseValueV2IndicateurPersonnaliseValueEpciIdPost
     * @summary Write Epci Indicateur Personnalise Value
     * @request POST:/v2/indicateur_personnalise_value/{epci_id}
     * @secure
     */
    writeEpciIndicateurPersonnaliseValueV2IndicateurPersonnaliseValueEpciIdPost: (
      epciId: string,
      data: IndicateurPersonnaliseValueIn,
      params: RequestParams = {},
    ) =>
      this.request<IndicateurPersonnaliseValue, HTTPValidationError>({
        path: `/v2/indicateur_personnalise_value/${epciId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @name GetAllEpciIndicateursValuesV2IndicateurPersonnaliseValueEpciIdAllGet
     * @summary Get All Epci Indicateurs Values
     * @request GET:/v2/indicateur_personnalise_value/{epci_id}/all
     */
    getAllEpciIndicateursValuesV2IndicateurPersonnaliseValueEpciIdAllGet: (
      epciId: string,
      params: RequestParams = {},
    ) =>
      this.request<IndicateurPersonnaliseValue[], HTTPValidationError>({
        path: `/v2/indicateur_personnalise_value/${epciId}/all`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @name GetIndicateurPersonnaliseYearlyValuesV2IndicateurPersonnaliseValueEpciIdIndicateurIdGet
     * @summary Get Indicateur Personnalise Yearly Values
     * @request GET:/v2/indicateur_personnalise_value/{epci_id}/{indicateur_id}
     */
    getIndicateurPersonnaliseYearlyValuesV2IndicateurPersonnaliseValueEpciIdIndicateurIdGet: (
      epciId: string,
      indicateurId: string,
      params: RequestParams = {},
    ) =>
      this.request<IndicateurPersonnaliseValue[], HTTPValidationError>({
        path: `/v2/indicateur_personnalise_value/${epciId}/${indicateurId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @name GetIndicateurPersonnaliseValueV2IndicateurPersonnaliseValueEpciIdIndicateurIdYearGet
     * @summary Get Indicateur Personnalise Value
     * @request GET:/v2/indicateur_personnalise_value/{epci_id}/{indicateur_id}/{year}
     */
    getIndicateurPersonnaliseValueV2IndicateurPersonnaliseValueEpciIdIndicateurIdYearGet: (
      epciId: string,
      indicateurId: string,
      year: number,
      params: RequestParams = {},
    ) =>
      this.request<IndicateurPersonnaliseValue, HTTPNotFoundError | HTTPValidationError>({
        path: `/v2/indicateur_personnalise_value/${epciId}/${indicateurId}/${year}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @name WriteEpciIndicateurPersonnaliseV2IndicateurPersonnaliseEpciIdPost
     * @summary Write Epci Indicateur Personnalise
     * @request POST:/v2/indicateur_personnalise/{epci_id}
     * @secure
     */
    writeEpciIndicateurPersonnaliseV2IndicateurPersonnaliseEpciIdPost: (
      epciId: string,
      data: IndicateurPersonnaliseIn,
      params: RequestParams = {},
    ) =>
      this.request<IndicateurPersonnalise, HTTPValidationError>({
        path: `/v2/indicateur_personnalise/${epciId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @name GetAllEpciIndicateursPersonnalisesV2IndicateurPersonnaliseEpciIdAllGet
     * @summary Get All Epci Indicateurs Personnalises
     * @request GET:/v2/indicateur_personnalise/{epci_id}/all
     */
    getAllEpciIndicateursPersonnalisesV2IndicateurPersonnaliseEpciIdAllGet: (
      epciId: string,
      params: RequestParams = {},
    ) =>
      this.request<IndicateurPersonnalise[], HTTPValidationError>({
        path: `/v2/indicateur_personnalise/${epciId}/all`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @name GetIndicateurPersonnaliseV2IndicateurPersonnaliseEpciIdUidGet
     * @summary Get Indicateur Personnalise
     * @request GET:/v2/indicateur_personnalise/{epci_id}/{uid}
     */
    getIndicateurPersonnaliseV2IndicateurPersonnaliseEpciIdUidGet: (
      epciId: string,
      uid: string,
      params: RequestParams = {},
    ) =>
      this.request<IndicateurPersonnalise, HTTPNotFoundError | HTTPValidationError>({
        path: `/v2/indicateur_personnalise/${epciId}/${uid}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @name DeleteIndicateurPersonnaliseV2IndicateurPersonnaliseEpciIdUidDelete
     * @summary Delete Indicateur Personnalise
     * @request DELETE:/v2/indicateur_personnalise/{epci_id}/{uid}
     * @secure
     */
    deleteIndicateurPersonnaliseV2IndicateurPersonnaliseEpciIdUidDelete: (
      epciId: string,
      uid: string,
      params: RequestParams = {},
    ) =>
      this.request<Status, HTTPNotFoundError | HTTPValidationError>({
        path: `/v2/indicateur_personnalise/${epciId}/${uid}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @name WriteEpciIndicateurValueV2IndicateurValueEpciIdPost
     * @summary Write Epci Indicateur Value
     * @request POST:/v2/indicateur_value/{epci_id}
     * @secure
     */
    writeEpciIndicateurValueV2IndicateurValueEpciIdPost: (
      epciId: string,
      data: IndicateurValueIn,
      params: RequestParams = {},
    ) =>
      this.request<IndicateurValue, HTTPValidationError>({
        path: `/v2/indicateur_value/${epciId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @name GetAllEpciIndicateursValuesV2IndicateurValueEpciIdAllGet
     * @summary Get All Epci Indicateurs Values
     * @request GET:/v2/indicateur_value/{epci_id}/all
     */
    getAllEpciIndicateursValuesV2IndicateurValueEpciIdAllGet: (epciId: string, params: RequestParams = {}) =>
      this.request<IndicateurValue[], HTTPValidationError>({
        path: `/v2/indicateur_value/${epciId}/all`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @name GetIndicateurYearlyValuesV2IndicateurValueEpciIdIndicateurIdGet
     * @summary Get Indicateur Yearly Values
     * @request GET:/v2/indicateur_value/{epci_id}/{indicateur_id}
     */
    getIndicateurYearlyValuesV2IndicateurValueEpciIdIndicateurIdGet: (
      epciId: string,
      indicateurId: string,
      params: RequestParams = {},
    ) =>
      this.request<IndicateurValue[], HTTPValidationError>({
        path: `/v2/indicateur_value/${epciId}/${indicateurId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @name GetIndicateurValueV2IndicateurValueEpciIdIndicateurIdYearGet
     * @summary Get Indicateur Value
     * @request GET:/v2/indicateur_value/{epci_id}/{indicateur_id}/{year}
     */
    getIndicateurValueV2IndicateurValueEpciIdIndicateurIdYearGet: (
      epciId: string,
      indicateurId: string,
      year: number,
      params: RequestParams = {},
    ) =>
      this.request<IndicateurValue, HTTPNotFoundError | HTTPValidationError>({
        path: `/v2/indicateur_value/${epciId}/${indicateurId}/${year}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @name WriteEpciActionMetaV2ActionMetaEpciIdPost
     * @summary Write Epci Action Meta
     * @request POST:/v2/action_meta/{epci_id}
     * @secure
     */
    writeEpciActionMetaV2ActionMetaEpciIdPost: (epciId: string, data: ActionMetaIn, params: RequestParams = {}) =>
      this.request<ActionMeta, HTTPValidationError>({
        path: `/v2/action_meta/${epciId}`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @name GetAllEpciActionsMetaV2ActionMetaEpciIdAllGet
     * @summary Get All Epci Actions Meta
     * @request GET:/v2/action_meta/{epci_id}/all
     */
    getAllEpciActionsMetaV2ActionMetaEpciIdAllGet: (epciId: string, params: RequestParams = {}) =>
      this.request<ActionMeta[], HTTPValidationError>({
        path: `/v2/action_meta/${epciId}/all`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @name GetActionMetaV2ActionMetaEpciIdActionIdGet
     * @summary Get Action Meta
     * @request GET:/v2/action_meta/{epci_id}/{action_id}
     */
    getActionMetaV2ActionMetaEpciIdActionIdGet: (epciId: string, actionId: string, params: RequestParams = {}) =>
      this.request<ActionMeta, HTTPNotFoundError | HTTPValidationError>({
        path: `/v2/action_meta/${epciId}/${actionId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @name GetEciScoresV2NotationEciEpciIdAllGet
     * @summary Get Eci Scores
     * @request GET:/v2/notation/eci/{epci_id}/all
     */
    getEciScoresV2NotationEciEpciIdAllGet: (epciId: string, params: RequestParams = {}) =>
      this.request<ActionReferentielScore[], HTTPValidationError>({
        path: `/v2/notation/eci/${epciId}/all`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description Forward to ADEME's users endpoint.
     *
     * @name GetUserV2AdminUsersAdemeUserIdGet
     * @summary Get User
     * @request GET:/v2/admin/users/{ademe_user_id}
     * @secure
     */
    getUserV2AdminUsersAdemeUserIdGet: (ademeUserId: string, params: RequestParams = {}) =>
      this.request<AdemeUser, HTTPNotFoundError | HTTPValidationError>({
        path: `/v2/admin/users/${ademeUserId}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),
  };
}
