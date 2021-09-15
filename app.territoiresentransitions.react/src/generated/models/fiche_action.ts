export interface FicheActionInterface {
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
}

export class FicheAction {
  public static pathname = 'fiche_action';
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
  equals(other: FicheActionInterface | null): boolean {
    if (!other) return false;
    return (
      other.epci_id === this.epci_id &&
      other.uid === this.uid &&
      other.custom_id === this.custom_id &&
      other.avancement === this.avancement &&
      other.en_retard === this.en_retard &&
      other.referentiel_action_ids === this.referentiel_action_ids &&
      other.referentiel_indicateur_ids === this.referentiel_indicateur_ids &&
      other.titre === this.titre &&
      other.description === this.description &&
      other.budget === this.budget &&
      other.personne_referente === this.personne_referente &&
      other.structure_pilote === this.structure_pilote &&
      other.partenaires === this.partenaires &&
      other.elu_referent === this.elu_referent &&
      other.commentaire === this.commentaire &&
      other.date_debut === this.date_debut &&
      other.date_fin === this.date_fin &&
      other.indicateur_personnalise_ids === this.indicateur_personnalise_ids
    );
  }
}
