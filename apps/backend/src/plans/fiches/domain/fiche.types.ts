import z from 'zod';

export const StatutEnum = {
  A_VENIR: 'À venir',
  EN_COURS: 'En cours',
  REALISE: 'Réalisé',
  EN_PAUSE: 'En pause',
  ABANDONNE: 'Abandonné',
  BLOQUE: 'Bloqué',
  EN_RETARD: 'En retard',
  A_DISCUTER: 'A discuter',
} as const;
export const statutsEnumValues = [
  StatutEnum.A_VENIR,
  StatutEnum.EN_COURS,
  StatutEnum.REALISE,
  StatutEnum.EN_PAUSE,
  StatutEnum.ABANDONNE,
  StatutEnum.BLOQUE,
  StatutEnum.EN_RETARD,
  StatutEnum.A_DISCUTER,
] as const;

export const statutsEnumSchema = z.enum(statutsEnumValues);

export type Statut = z.infer<typeof statutsEnumSchema>;

export const ciblesEnumValues = [
  'Grand public',
  'Associations',
  'Grand public et associations',
  'Public Scolaire',
  'Autres collectivités du territoire',
  'Acteurs économiques',
  'Acteurs économiques du secteur primaire',
  'Acteurs économiques du secteur secondaire',
  'Acteurs économiques du secteur tertiaire',
  'Partenaires',
  'Collectivité elle-même',
  'Elus locaux',
  'Agents',
] as const;
export type Cible = z.infer<typeof ciblesEnumSchema>;
export const ciblesEnumSchema = z.enum(ciblesEnumValues);

export const prioriteEnumValues = ['Élevé', 'Moyen', 'Bas'] as const;
export const prioriteEnumSchema = z.enum(prioriteEnumValues);

export type Priorite = z.infer<typeof prioriteEnumSchema>;

export const participationCitoyenneEnumValues = [
  'pas-de-participation',
  'information',
  'consultation',
  'concertation',
  'co-construction',
] as const;
export const participationCitoyenneEnumSchema = z.enum(
  participationCitoyenneEnumValues
);
export type ParticipationCitoyenne = z.infer<
  typeof participationCitoyenneEnumSchema
>;

export enum piliersEciEnumType {
  APPROVISIONNEMENT_DURABLE = 'Approvisionnement durable',
  ECOCONCEPTION = 'Écoconception',
  ECOLOGIE_INDUSTRIELLE = 'Écologie industrielle (et territoriale)',
  ECONOMIE_DE_LA_FONCTIONNALITE = 'Économie de la fonctionnalité',
  CONSOMMATION_RESPONSABLE = 'Consommation responsable',
  ALLONGEMENT_DUREE_USAGE = 'Allongement de la durée d’usage',
  RECYCLAGE = 'Recyclage',
}
export const piliersEciEnumValues = Object.values(piliersEciEnumType) as [
  piliersEciEnumType,
  ...piliersEciEnumType[]
];

export const piliersEciEnumSchema = z.enum(piliersEciEnumValues);

export enum ficheActionResultatsAttendusEnumType {
  ADAPTATION_CHANGEMENT_CLIMATIQUE = 'Adaptation au changement climatique',
  ALLONGEMENT_DUREE_USAGE = 'Allongement de la durée d’usage',
  AMELIORATION_QUALITE_VIE = 'Amélioration de la qualité de vie',
  DEVELOPPEMENT_ENERGIES_RENOUVELABLES = 'Développement des énergies renouvelables',
  EFFICACITE_ENERGETIQUE = 'Efficacité énergétique',
  PRESERVATION_BIODIVERSITE = 'Préservation de la biodiversité',
  REDUCTION_CONSOMMATIONS_ENERGETIQUES = 'Réduction des consommations énergétiques',
  REDUCTION_DECHETS = 'Réduction des déchets',
  REDUCTION_EMISSIONS_GES = 'Réduction des émissions de gaz à effet de serre',
  REDUCTION_POLLUANTS_ATMOSPHERIQUES = 'Réduction des polluants atmosphériques',
  SOBRIETE_ENERGETIQUE = 'Sobriété énergétique',
}
export const ficheActionResultatsAttenduValues = Object.values(
  ficheActionResultatsAttendusEnumType
) as [
  ficheActionResultatsAttendusEnumType,
  ...ficheActionResultatsAttendusEnumType[]
];

export interface Fiche {
  id: number;
  collectiviteId: number;
  titre: string;
  description?: string;
  objectifs?: string;
  cibles?: Cible[];
  ressources?: string;
  financements?: string;
  budgetPrevisionnel?: number;
  statut?: Statut;
  priorite?: Priorite;
  dateDebut?: Date;
  dateFin?: Date;
  ameliorationContinue?: boolean;
  calendrier?: string;
  notesComplementaires?: string;
  instanceGouvernance?: string;
  participationCitoyenneType?: ParticipationCitoyenne;
}

export type PersonOrTag = { userId?: string; tagId?: number };

export type FicheAggregate = Fiche & {
  thematiques?: number[];
  sousThematiques?: number[];
  effetsAttendus?: number[];
  structures?: number[];
  services?: number[];
  pilotes?: Array<PersonOrTag>;
  referents?: Array<PersonOrTag>;
  partenaires?: number[];
  financeurs?: Array<{ tagId: number; montant: number }>;
};

export type FicheAggregateCreation = Omit<FicheAggregate, 'id'>;
