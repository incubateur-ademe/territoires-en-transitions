export interface ActionReferentielScoreInterface {
    action_id: string,
        action_nomenclature_id: string,
        avancement: 'faite' | 'programmee' | 'pas_faite' | 'non_concernee',
        points: number,
        percentage: number,
        potentiel: number,
        referentiel_points: number,
        referentiel_percentage: number,
}

export class ActionReferentielScore {
    public static pathname: string = 'action_referentiel_score';
    get pathname(): string {
        return ActionReferentielScore.pathname;
    }
    action_id: string;
    action_nomenclature_id: string;
    avancement: 'faite' | 'programmee' | 'pas_faite' | 'non_concernee';
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
        action_id: string,
        action_nomenclature_id: string,
        avancement: 'faite' | 'programmee' | 'pas_faite' | 'non_concernee',
        points: number,
        percentage: number,
        potentiel: number,
        referentiel_points: number,
        referentiel_percentage: number,
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
}