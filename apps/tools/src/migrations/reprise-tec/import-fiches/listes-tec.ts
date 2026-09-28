/** Les listes de T&C qui qualifient une action, absentes de la copie, et ce que chaque valeur devient dans TeT, désignée par son libellé. */

import { CibleEnum, type Cible } from '@tet/domain/plans';

/** La valeur d'un numéro de T&C dans une des listes ci-dessous ; arrête s'il est inconnu. */
export const translate = <V>(
  liste: ReadonlyMap<number, V>,
  numero: number,
  nom: string
) => {
  const valeur = liste.get(numero);
  if (valeur === undefined) {
    throw new Error(`${nom} T&C ${numero} inconnu.`);
  }
  return valeur;
};

/** Volet du PCAET (T&C) → effet attendu (TeT). */
export const VOLETS = new Map<number, string>([
  [1, 'Réduction des émissions de gaz à effet de serre'], // Atténuation
  [2, "Amélioration de la qualité de l'air"], // Qualité de l'air
  [3, 'Adaptation au changement climatique'], // Adaptation
]);

/** Cible (T&C) → cible (TeT). */
export const CIBLES = new Map<number, Cible>([
  [1, CibleEnum.PARTENAIRES], // acteurs parapublics (bailleurs sociaux)
  [2, CibleEnum.AUTRES_COLLECTIVITES_DU_TERRITOIRE], // acteurs publics (collectivités, administrations)
  [3, CibleEnum.ACTEURS_ECONOMIQUES_DU_SECTEUR_PRIMAIRE], // agriculteurs
  [4, CibleEnum.ASSOCIATIONS], // associations
  [5, CibleEnum.ACTEURS_ECONOMIQUES_DU_SECTEUR_TERTIAIRE], // commerçants / artisans
  [6, CibleEnum.GRAND_PUBLIC], // grand public
  [7, CibleEnum.ACTEURS_ECONOMIQUES_DU_SECTEUR_SECONDAIRE], // industries
]);

/** Type de porteur (T&C) → nom de la structure pilote (TeT), le libellé T&C tel quel. */
export const TYPES_PORTEUR = new Map<number, string>([
  [1, 'Collectivité porteuse'],
  [2, 'Collectivité infra'],
  [3, 'Etablissement public local'],
  [4, 'Etablissement consulaire'],
  [5, 'Entreprise'],
  [6, 'Association'],
]);

/** Type d'action (T&C) → nom du tag personnalisé (TeT), le libellé T&C tel quel. */
export const TYPES_ACTION = new Map<number, string>([
  [1, 'Investissement'],
  [2, 'Etude'],
  [3, 'Communication / Information'],
  [4, 'Animation'],
  [5, 'Financement'],
  [6, 'Outil'],
  [7, "Education à l'environnement"],
  [8, 'Guide'],
  [9, 'Formation'],
  [10, 'Partenariat'],
  [11, 'Gouvernance'],
  [12, 'Observation - suivi - évaluation'],
  [13, 'Diagnostic'],
  [14, 'Concertation - mobilisation'],
  [15, 'Sensibilisation'],
  [16, 'Accompagnement'],
  [17, 'Aménagement'],
  [18, 'Service au public'],
  [19, 'Recherche'],
  [20, 'Autres'],
]);

export type Classement =
  | { sousThematique: string }
  | { thematique: string; sousThematique?: never };

/**
 * Secteur (T&C) → sous-thématique quand elle dit la même chose, sinon la seule thématique.
 * Avec une sous-thématique, la thématique est sa parente : le couple reste d'une même famille.
 */
export const SECTEURS = new Map<number, Classement>([
  // Une sous-thématique qui dit la même chose, et Résidentiel.
  [4, { sousThematique: 'Biodiversité' }], // Biodiversité
  [5, { sousThematique: 'Consommation responsable et achats durables' }], // Consommation responsable
  [10, { sousThematique: 'Communication, formation et sensibilisation' }], // Communication / formation / sensibilisation
  [
    14,
    {
      sousThematique:
        'Partenariats et coopération (publique, privé, associatif, international, infra et supra collectivité)',
    },
  ], // Coopération / partenariat
  [17, { sousThematique: 'Tourisme' }], // Tourisme
  [20, { sousThematique: 'Industrie' }], // Industrie hors branche énergie
  [22, { sousThematique: 'Logement et habitat' }], // Résidentiel
  [23, { sousThematique: 'Santé' }], // Santé
  [27, { sousThematique: 'Espaces verts' }], // Espaces verts
  [28, { sousThematique: 'Forêts' }], // Forêt

  // La seule thématique.
  // Agriculture : la thématique du même nom, pas la sous-thématique homonyme, rangée sous « Activités économiques ».
  [1, { thematique: 'Agriculture et alimentation' }], // Agriculture
  [6, { thematique: 'Économie circulaire et déchets' }], // Déchets
  [7, { thematique: 'Activités économiques' }], // Développement économique
  [8, { thematique: 'Eau, milieux aquatiques et assainissement' }], // Eau
  [11, { thematique: 'Énergie et climat' }], // Gestion / production / distribution de l'énergie
  [18, { thematique: 'Urbanisme, logement, aménagement, bâtiments' }], // Aménagement / urbanisme
  [19, { thematique: 'Mobilité et transport' }], // Autres transports
  [21, { thematique: 'Énergie et climat' }], // Industrie branche énergie
  [24, { thematique: 'Solidarité et lien social' }], // Sécurité civile
  [25, { thematique: 'Activités économiques' }], // Tertiaire
  [26, { thematique: 'Mobilité et transport' }], // Transport routier
]);
