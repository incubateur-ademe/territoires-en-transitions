import jwt_decode, {JwtPayload} from 'jwt-decode';
import {UtilisateurConnecteLocalStorable} from 'storables/UtilisateurConnecteStorable';
import {utilisateurConnecteLocalStore} from './localStore';
import type {UtilisateurDroitsInterface} from 'generated/models/utilisateur_droits';
import {UtilisateurDroits} from 'generated/models/utilisateur_droits';
import {ENV} from 'environmentVariables';
import {ChangeNotifier} from 'core-logic/api/reactivity';

const _dummyToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkdW1teSIsImdpdmVuX25hbWUiOiJGcmVkIiwiZmFtaWx5X25hbWUiOiJEdXBvbnQiLCJlbWFpbCI6ImR1bW15QHRlcnJpdG9pcmVzZW50cmFuc2l0aW9ucy5mciJ9.u42Ygg2_TtgjjuVBakqHpIotwOZMlRFHIYdvAnLhj9c';

/**
 * Authentication, only manage rights for now.
 */
class Authentication extends ChangeNotifier {
  get currentUtilisateurDroits(): UtilisateurDroits[] | null {
    return this._currentUtilisateurDroits;
  }

  set currentUtilisateurDroits(value: UtilisateurDroits[] | null) {
    this._currentUtilisateurDroits = value;
    this.notifyListeners();
  }

  private _currentUtilisateurDroits: UtilisateurDroits[] | null = [];
}

/**
 * The global auth object.
 */
export const auth = new Authentication();

utilisateurConnecteLocalStore.addListener(() => {
  auth.currentUtilisateurDroits = null;
});

/**
 * Save fake tokens, the user will be connected until replaced.
 */
export const saveDummyTokens = () => {
  saveTokens(_dummyToken, _dummyToken);
};

/**
 * Save the access token, the user is considered connected as long as the token is valid.
 */
export const saveTokens = (accessToken: string, refreshToken: string) => {
  const decoded = jwt_decode<JwtPayload>(accessToken);
  const storable = new UtilisateurConnecteLocalStorable({
    ademe_user_id: decoded['sub'] || '',
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  utilisateurConnecteLocalStore.store(storable);
};

/**
 * Returns true if the user have a valid token.
 */
export const connected = (): boolean => {
  let utilisateur: UtilisateurConnecteLocalStorable;
  try {
    utilisateur = utilisateurConnecteLocalStore.retrieveById(
      UtilisateurConnecteLocalStorable.id
    );
  } catch (e) {
    return false;
  }
  if (utilisateur === null) return false;
  if (utilisateur.access_token === _dummyToken) return true;

  const decoded = jwt_decode<JwtPayload>(utilisateur.access_token);
  // const secondsLeft = decoded.exp ? decoded.exp - Date.now() / 1000 : 1;
  // return secondsLeft > 0;

  return decoded !== null && decoded !== undefined;
};

/**
 * Retrieve current user, returns an UtilisateurConnecte if the user is connected otherwise returns null.
 */
export const currentUser = (): UtilisateurConnecteLocalStorable | null => {
  if (connected())
    return utilisateurConnecteLocalStore.retrieveById(
      UtilisateurConnecteLocalStorable.id
    );
  return null;
};

/**
 * Retrieve the current access token, returns null if not connected
 */
export const currentAccessToken = (): string | null => {
  const user = currentUser();
  if (!user) return null;
  return user.access_token;
};

/**
 * Retrieve the current refresh token, returns null if not connected
 */
export const currentRefreshToken = (): string | null => {
  const user = currentUser();
  if (!user) return null;
  return user.refresh_token;
};

/**
 * Sign the current user out. Return true on success, false otherwise.
 */
export const signOut = (): boolean => {
  return utilisateurConnecteLocalStore.deleteById(
    UtilisateurConnecteLocalStorable.id
  );
};

/**
 * Retrieve utilisateurs droits from our API, returns an empty list if not connected
 */
export const currentUtilisateurDroits = async (
  force?: boolean | undefined
): Promise<UtilisateurDroits[] | null> => {
  const user = currentUser();
  if (!user) return [];
  if (droitsFetchedForUser === user.ademe_user_id && !force) {
    return auth.currentUtilisateurDroits;
  }

  droitsFetchedForUser = user.ademe_user_id;
  const token = currentAccessToken();
  const api = ENV.backendHost;
  const endpoint = 'v2/utilisateur_droits';
  const response = await fetch(`${api}/${endpoint}/${user.ademe_user_id}`, {
    mode: 'cors',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    droitsFetchedForUser = '';
    return null;
  } // we should raise

  const data = (await response.json()) as UtilisateurDroitsInterface[];

  const droits = data.map<UtilisateurDroits>(
    serialized => new UtilisateurDroits(serialized)
  );

  auth.currentUtilisateurDroits = droits;
  return droits;
};

// todo should use memoization on fetch.
let droitsFetchedForUser = '';

/**
 * Add utilisateurs droits to our API, returns true on success.
 */
export const addDroits = async (
  epciId: string,
  ecriture: boolean
): Promise<boolean> => {
  const user = currentUser();
  if (!user) throw Error('User must be connected to add droits');

  const droits: UtilisateurDroitsInterface = {
    ademe_user_id: user.ademe_user_id,
    epci_id: epciId,
    ecriture: ecriture,
  };

  const token = currentAccessToken();
  const api = ENV.backendHost;
  const endpoint = 'v2/utilisateur_droits';
  const response = await fetch(`${api}/${endpoint}`, {
    mode: 'cors',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(droits),
  });

  if (response.ok) {
    const current = auth.currentUtilisateurDroits ?? [];
    auth.currentUtilisateurDroits = [new UtilisateurDroits(droits), ...current];
  }

  return response.ok;
};
