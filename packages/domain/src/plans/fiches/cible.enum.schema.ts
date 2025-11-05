import * as z from 'zod/mini';

export const CibleEnum = {
  GRAND_PUBLIC: 'Grand public',
  ASSOCIATIONS: 'Associations',
  GRAND_PUBLIC_ET_ASSOCIATIONS: 'Grand public et associations',
  PUBLIC_SCOLAIRE: 'Public Scolaire',
  AUTRES_COLLECTIVITES_DU_TERRITOIRE: 'Autres collectivités du territoire',
  ACTEURS_ECONOMIQUES: 'Acteurs économiques',
  ACTEURS_ECONOMIQUES_DU_SECTEUR_PRIMAIRE:
    'Acteurs économiques du secteur primaire',
  ACTEURS_ECONOMIQUES_DU_SECTEUR_SECONDAIRE:
    'Acteurs économiques du secteur secondaire',
  ACTEURS_ECONOMIQUES_DU_SECTEUR_TERTIAIRE:
    'Acteurs économiques du secteur tertiaire',
  PARTENAIRES: 'Partenaires',
  COLLECTIVITE_ELLE_MEME: 'Collectivité elle-même',
  ELUS_LOCAUX: 'Elus locaux',
  AGENTS: 'Agents',
} as const;

export const cibleEnumValues = [
  CibleEnum.GRAND_PUBLIC,
  CibleEnum.ASSOCIATIONS,
  CibleEnum.GRAND_PUBLIC_ET_ASSOCIATIONS,
  CibleEnum.PUBLIC_SCOLAIRE,
  CibleEnum.AUTRES_COLLECTIVITES_DU_TERRITOIRE,
  CibleEnum.ACTEURS_ECONOMIQUES,
  CibleEnum.ACTEURS_ECONOMIQUES_DU_SECTEUR_PRIMAIRE,
  CibleEnum.ACTEURS_ECONOMIQUES_DU_SECTEUR_SECONDAIRE,
  CibleEnum.ACTEURS_ECONOMIQUES_DU_SECTEUR_TERTIAIRE,
  CibleEnum.PARTENAIRES,
  CibleEnum.COLLECTIVITE_ELLE_MEME,
  CibleEnum.ELUS_LOCAUX,
  CibleEnum.AGENTS,
] as const;

export const cibleEnumSchema = z.enum(cibleEnumValues);

export type Cible = z.infer<typeof cibleEnumSchema>;
