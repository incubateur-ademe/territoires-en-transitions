import jwt_decode from "jwt-decode";
import {UtilisateurConnecteStorable} from "../storables/UtilisateurConnecteStorable";
import {utilisateurConnecteStore} from "./localStore";
import {UtilisateurDroits, UtilisateurDroitsInterface} from "../../../generated/models/utilisateur_droits";
import {getCurrentAPI} from "./currentAPI";

/**
 * Save the access token, the user is considered connected as long as the token is valid.
 */
export const saveTokens = (accessToken: string, refreshToken: string) => {
    const decoded = jwt_decode(accessToken)
    const storable = new UtilisateurConnecteStorable({
        ademe_user_id: decoded['sub'] || '',
        access_token: accessToken,
        refresh_token: refreshToken,
        email: decoded['email'] || '',
        nom: decoded['family_name'] || '',
        prenom: decoded['given_name'] || '',
    })
    utilisateurConnecteStore.store(storable)
}

/**
 * Returns true if the user have a valid token.
 */
export const connected = (): boolean => {
    let utilisateur: UtilisateurConnecteStorable

    try {
        utilisateur = utilisateurConnecteStore.retrieveById(UtilisateurConnecteStorable.id)
    } catch (e) {
        return false
    }
    if (utilisateur == null) return false

    const decoded = jwt_decode(utilisateur.access_token)
    const secondsLeft = decoded['exp'] - (Date.now() / 1000)

    return secondsLeft > 0
}

/**
 * Retrieve current user, returns an UtilisateurConnecte if the user is connected otherwise returns null.
 */
export const currentUser = (): UtilisateurConnecteStorable | null => {
    if (connected())
        return utilisateurConnecteStore.retrieveById(UtilisateurConnecteStorable.id)
    return null
}


/**
 * Retrieve the current access token, returns null if not connected
 */
export const currentAccessToken = (): string | null => {
    if (connected())
        return currentUser().access_token
    return null
}

/**
 * Sign the current user out. Return true on success, false otherwise.
 */
export const signOut = (): boolean => {
    return utilisateurConnecteStore.deleteById(UtilisateurConnecteStorable.id)
}

/**
 * Retrieve utilisateurs droits from our API, returns an empty list if not connected
 */
export const currentUtilisateurDroits = async (): Promise<UtilisateurDroits[]> => {
    if (!connected()) return []
    const user: UtilisateurConnecteStorable = currentUser()
    const token = currentAccessToken()
    const api = getCurrentAPI()
    const endpoint = 'v2/utilisateur_droits'
    const response = await fetch(
        `${api}/${endpoint}/${user.ademe_user_id}`,
        {
            mode: 'cors',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
    if (response.status == 404) return null
    const data = await response.json() as UtilisateurDroitsInterface[]

    return data.map<UtilisateurDroits>((serialized) => new UtilisateurDroits(serialized))
}

/**
 * Add utilisateurs droits to our API, returns true on success.
 */
export const addDroits = async (epciId: string, ecriture: boolean): Promise<boolean> => {
    if (!connected())
        throw "User must be connected to add droits"

    const droits: UtilisateurDroitsInterface = {
        ademe_user_id: currentUser().ademe_user_id,
        epci_id: epciId,
        ecriture: ecriture,
    }

    const token = currentAccessToken()
    const api = getCurrentAPI()
    const endpoint = 'v2/utilisateur_droits'
    const response = await fetch(
        `${api}/${endpoint}`,
        {
            mode: 'cors',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(droits)
        })

    return response.ok
}
