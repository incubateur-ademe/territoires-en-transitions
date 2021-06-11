import jwt_decode from "jwt-decode";
import {UtilisateurConnecteStorable} from "../storables/UtilisateurConnecteStorable";
import {utilisateurConnecteStore} from "./localStore";


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
export const isConnected = (): boolean => {
    const utilisateur = utilisateurConnecteStore.retrieveById(UtilisateurConnecteStorable.id)
    if (utilisateur == null) return false

    // todo check token.

    return true
}

/**
 * Retrieve current user, returns an UtilisateurConnecte if the user is connected otherwise returns null.
 */
export const currentUser = (): UtilisateurConnecteStorable | null => {
    if (isConnected())
        return utilisateurConnecteStore.retrieveById(UtilisateurConnecteStorable.id)
    return null
}


/**
 * Sign the current user out. Return true on success, false otherwise.
 */
export const signOut = (): boolean => {
    return utilisateurConnecteStore.deleteById(UtilisateurConnecteStorable.id)
}
