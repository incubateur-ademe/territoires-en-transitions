export interface FicheActionInterface {
    epci_id: string,
        uid: string,
        custom_id: string,
        avancement: string,
        en_retard: boolean,
        referentiel_action_ids: string[],
        referentiel_indicateur_ids: string[],
        titre: string,
        description: string,
        budget: number,
        personne_referente: string,
        structure_pilote: string,
        partenaires: string,
        elu_referent: string,
        commentaire: string,
        date_debut: string,
        date_fin: string,
        indicateur_personnalise_ids: string[],
}

export class FicheAction {
    public static pathname: string = 'fiche_action';
    get pathname(): string {
        return FicheAction.pathname;
    }
    epci_id: string;
    uid: string;
    custom_id: string;
    avancement: string;
    en_retard: boolean;
    referentiel_action_ids: string[];
    referentiel_indicateur_ids: string[];
    titre: string;
    description: string;
    budget: number;
    personne_referente: string;
    structure_pilote: string;
    partenaires: string;
    elu_referent: string;
    commentaire: string;
    date_debut: string;
    date_fin: string;
    indicateur_personnalise_ids: string[];

    /**
     * Creates a FicheAction instance.
     */
    constructor({
        epci_id,
        uid,
        custom_id,
        avancement,
        en_retard,
        referentiel_action_ids,
        referentiel_indicateur_ids,
        titre,
        description,
        budget,
        personne_referente,
        structure_pilote,
        partenaires,
        elu_referent,
        commentaire,
        date_debut,
        date_fin,
        indicateur_personnalise_ids,
    }: {
        epci_id: string,
        uid: string,
        custom_id: string,
        avancement: string,
        en_retard: boolean,
        referentiel_action_ids: string[],
        referentiel_indicateur_ids: string[],
        titre: string,
        description: string,
        budget: number,
        personne_referente: string,
        structure_pilote: string,
        partenaires: string,
        elu_referent: string,
        commentaire: string,
        date_debut: string,
        date_fin: string,
        indicateur_personnalise_ids: string[],
    }) {
        this.epci_id = epci_id;
        this.uid = uid;
        this.custom_id = custom_id;
        this.avancement = avancement;
        this.en_retard = en_retard;
        this.referentiel_action_ids = referentiel_action_ids;
        this.referentiel_indicateur_ids = referentiel_indicateur_ids;
        this.titre = titre;
        this.description = description;
        this.budget = budget;
        this.personne_referente = personne_referente;
        this.structure_pilote = structure_pilote;
        this.partenaires = partenaires;
        this.elu_referent = elu_referent;
        this.commentaire = commentaire;
        this.date_debut = date_debut;
        this.date_fin = date_fin;
        this.indicateur_personnalise_ids = indicateur_personnalise_ids;
    }
}