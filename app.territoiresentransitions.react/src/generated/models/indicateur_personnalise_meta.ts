export interface IndicateurPersonnaliseMetaInterface {
  epci_id: string;
  indicateur_id: string;
  meta: {
    commentaire: 'string';
  };
}

export class IndicateurPersonnaliseMeta {
  public static pathname: string = 'indicateur_personnalise_meta';
  get pathname(): string {
    return IndicateurPersonnaliseMeta.pathname;
  }
  epci_id: string;
  indicateur_id: string;
  meta: {
    commentaire: 'string';
  };

  /**
   * Creates a IndicateurPersonnaliseMeta instance.
   */
  constructor({
    epci_id,
    indicateur_id,
    meta,
  }: {
    epci_id: string;
    indicateur_id: string;
    meta: {
      commentaire: 'string';
    };
  }) {
    this.epci_id = epci_id;
    this.indicateur_id = indicateur_id;
    this.meta = meta;
  }
}
