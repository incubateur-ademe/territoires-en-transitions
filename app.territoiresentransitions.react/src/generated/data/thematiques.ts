export class Thematique {
    id: string;
    name: string;
    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
    }
}

export const thematiques: Thematique[] = [

    new Thematique("strategie", "Stratégie"),

    new Thematique("urbanisme", "Urbanisme et aménagement"),

    new Thematique("batiments", "Bâtiments et patrimoine"),

    new Thematique("energie", "Gestion, production et distribution de l'énergie"),

    new Thematique("mobilites", "Mobilités"),

    new Thematique("agri_alim", "Agriculture et alimentation"),

    new Thematique("foret_biodiv", "Forêts, espaces verts et biodiversité"),

    new Thematique("conso_resp", "Consommation écoresponsable"),

    new Thematique("dechets", "Déchets"),

    new Thematique("eau", "Eau et assainissement"),

    new Thematique("preca_energie", "Précarité énergétique"),

    new Thematique("dev_eco", "Activités économiques"),

    new Thematique("tourisme", "Tourisme"),

    new Thematique("orga_interne", "Organisation interne"),

    new Thematique("forma_sensib", "Formation, sensibilisation, communication"),

    new Thematique("parten_coop", "Partenariat et coopération"),

    new Thematique("eci", "Économie circulaire"),

]