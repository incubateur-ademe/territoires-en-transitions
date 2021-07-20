import {FicheActionCategorie} from "$generated/models/fiche_action_categorie";


export class FicheActionCategorieStorable extends FicheActionCategorie {
    static buildId(epci_id: string, uid: string) : string {
        return `${epci_id}/${uid}`;
    }
    get id(): string {
        return FicheActionCategorieStorable.buildId(this.epci_id, this.uid)
    }
}