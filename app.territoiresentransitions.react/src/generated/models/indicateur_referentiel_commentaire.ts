export interface IndicateurReferentielCommentaireInterface {
  epci_id: string;
  indicateur_id: string;
  value: string;
}

export class IndicateurReferentielCommentaire {
  public static pathname = 'indicateur_referentiel_commentaire';
  get pathname(): string {
    return IndicateurReferentielCommentaire.pathname;
  }
  epci_id: string;
  indicateur_id: string;
  value: string;

  /**
   * Creates a IndicateurReferentielCommentaire instance.
   */
  constructor({
    epci_id,
    indicateur_id,
    value,
  }: {
    epci_id: string;
    indicateur_id: string;
    value: string;
  }) {
    this.epci_id = epci_id;
    this.indicateur_id = indicateur_id;
    this.value = value;
  }
  equals(other: IndicateurReferentielCommentaireInterface | null): boolean {
    if (!other) return false;
    return (
      other.epci_id === this.epci_id &&
      other.indicateur_id === this.indicateur_id &&
      other.value === this.value
    );
  }
}
