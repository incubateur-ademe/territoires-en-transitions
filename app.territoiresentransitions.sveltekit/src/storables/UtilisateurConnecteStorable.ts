import {UtilisateurConnecte} from "../generated/models/utilisateur_connecte";

export class UtilisateurConnecteStorable extends UtilisateurConnecte {
    static readonly id = 'utilisateur_connecte'
    get id(): string {
        return UtilisateurConnecteStorable.id
    }
}