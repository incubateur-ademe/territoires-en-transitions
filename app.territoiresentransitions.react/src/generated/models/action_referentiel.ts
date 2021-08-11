export interface ActionReferentielInterface {
    id: string,
        id_nomenclature: string,
        nom: string,
        description: string,
        thematique_id: string,
        points: number,
        actions: ActionReferentiel[],
}

export class ActionReferentiel {
    public static pathname: string = 'action_referentiel';
    get pathname(): string {
        return ActionReferentiel.pathname;
    }
    id: string;
    id_nomenclature: string;
    nom: string;
    description: string;
    thematique_id: string;
    points: number;
    actions: ActionReferentiel[];

    /**
     * Creates a ActionReferentiel instance.
     */
    constructor({
        id,
        id_nomenclature,
        nom,
        description,
        thematique_id,
        points,
        actions,
    }: {
        id: string,
        id_nomenclature: string,
        nom: string,
        description: string,
        thematique_id: string,
        points: number,
        actions: ActionReferentiel[],
    }) {
        this.id = id;
        this.id_nomenclature = id_nomenclature;
        this.nom = nom;
        this.description = description;
        this.thematique_id = thematique_id;
        this.points = points;
        this.actions = actions;
    }
}