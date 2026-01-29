import * as z from 'zod/mini';

export const PiliersEciEnum = {
  APPROVISIONNEMENT_DURABLE: 'Approvisionnement durable',
  ECOCONCEPTION: 'Écoconception',
  ECOLOGIE_INDUSTRIELLE: 'Écologie industrielle (et territoriale)',
  ECONOMIE_DE_LA_FONCTIONNALITE: 'Économie de la fonctionnalité',
  CONSOMMATION_RESPONSABLE: 'Consommation responsable',
  ALLONGEMENT_DUREE_USAGE: 'Allongement de la durée d’usage',
  RECYCLAGE: 'Recyclage',
} as const;

export const piliersEciEnumValues = [
  PiliersEciEnum.APPROVISIONNEMENT_DURABLE,
  PiliersEciEnum.ECOCONCEPTION,
  PiliersEciEnum.ECOLOGIE_INDUSTRIELLE,
  PiliersEciEnum.ECONOMIE_DE_LA_FONCTIONNALITE,
  PiliersEciEnum.CONSOMMATION_RESPONSABLE,
  PiliersEciEnum.ALLONGEMENT_DUREE_USAGE,
  PiliersEciEnum.RECYCLAGE,
] as const;

export const piliersEciEnumSchema = z.enum(piliersEciEnumValues);
export const isPilierEci = (value: string): value is PilierEci => {
  return piliersEciEnumValues.includes(value as typeof piliersEciEnumValues[number]);
};
export type PilierEci = z.infer<typeof piliersEciEnumSchema>;
