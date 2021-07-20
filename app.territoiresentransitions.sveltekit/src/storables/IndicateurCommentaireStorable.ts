import {IndicateurReferentielCommentaire} from "$generated/models/indicateur_referentiel_commentaire";

export class IndicateurCommentaireStorable extends IndicateurReferentielCommentaire {
    static buildId(epci_id: string, indicateur_id: string) : string {
        return `${epci_id}/${indicateur_id}`
    }

    get id(): string {
        return IndicateurCommentaireStorable.buildId(this.epci_id, this.indicateur_id)
    }
}
