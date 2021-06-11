import {UtilisateurConnecte} from "../../../generated/models/utilisateur_connecte";

export class UtilisateurConnecteStorable extends UtilisateurConnecte {
    get id(): string {
        return 'utilisateur_connecte'
    }
}