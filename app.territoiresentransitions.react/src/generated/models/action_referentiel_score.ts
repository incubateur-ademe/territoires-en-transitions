export interface ActionReferentielScoreInterface {
  action_id: string;
  action_nomenclature_id: string;
  avancement: 'faite' | 'programmee' | 'pas_faite' | 'non_concernee' | '';
  points: number;
  percentage: number;
  potentiel: number;
  referentiel_points: number;
  referentiel_percentage: number;
}

export class ActionReferentielScore {
  public static pathname = 'action_referentiel_score';
  get pathname(): string {
    return ActionReferentielScore.pathname;
  }
  action_id: string;
  action_nomenclature_id: string;
  avancement: 'faite' | 'programmee' | 'pas_faite' | 'non_concernee' | '';
  points: number;
  percentage: number;
  potentiel: number;
  referentiel_points: number;
  referentiel_percentage: number;

  /**
   * Creates a ActionReferentielScore instance.
   */
  constructor({
    action_id,
    action_nomenclature_id,
    avancement,
    points,
    percentage,
    potentiel,
    referentiel_points,
    referentiel_percentage,
  }: {
    action_id: string;
    action_nomenclature_id: string;
    avancement: 'faite' | 'programmee' | 'pas_faite' | 'non_concernee' | '';
    points: number;
    percentage: number;
    potentiel: number;
    referentiel_points: number;
    referentiel_percentage: number;
  }) {
    this.action_id = action_id;
    this.action_nomenclature_id = action_nomenclature_id;
    this.avancement = avancement;
    this.points = points;
    this.percentage = percentage;
    this.potentiel = potentiel;
    this.referentiel_points = referentiel_points;
    this.referentiel_percentage = referentiel_percentage;
  }
  equals(other: ActionReferentielScoreInterface | null): boolean {
    if (!other) return false;
    return (
      other.action_id === this.action_id &&
      other.action_nomenclature_id === this.action_nomenclature_id &&
      other.avancement === this.avancement &&
      other.points === this.points &&
      other.percentage === this.percentage &&
      other.potentiel === this.potentiel &&
      other.referentiel_points === this.referentiel_points &&
      other.referentiel_percentage === this.referentiel_percentage
    );
  }
}
