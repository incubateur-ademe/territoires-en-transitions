import { z } from 'zod';
import { CollectiviteNatureType } from './collectivite-banatic-type.enum';
import { collectiviteSchema } from './collectivite.schema';

export enum CollectiviteTypeEnum {
  EPCI = 'EPCI',
  COMMUNE = 'commune',
}

export enum CollectiviteSousTypeEnum {
  EPCI_FP = 'epci_a_fiscalite_propre',
  SYNDICAT = 'syndicat',
  POLE = 'pole',
}

export enum CollectivitePopulationTypeEnum {
  MOINS_DE_3000 = 'moins_de_3000',
  MOINS_DE_5000 = 'moins_de_5000',
  MOINS_DE_10000 = 'moins_de_10000',
  MOINS_DE_20000 = 'moins_de_20000',
  MOINS_DE_50000 = 'moins_de_50000',
  MOINS_DE_100000 = 'moins_de_100000',
  PLUS_DE_3000 = 'plus_de_3000',
  PLUS_DE_20000 = 'plus_de_20000',
  PLUS_DE_50000 = 'plus_de_50000',
  PLUS_DE_100000 = 'plus_de_100000',
  PLUS_DE_300000 = 'plus_de_300000',
  PLUS_DE_800000 = 'plus_de_800000',
}

export enum CollectiviteLocalisationTypeEnum {
  DOM = 'DOM',
  METROPOLE = 'Metropole',
}

export const NATURE_TO_SOUS_TYPE: Record<
  CollectiviteNatureType,
  CollectiviteSousTypeEnum
> = {
  CC: CollectiviteSousTypeEnum.EPCI_FP,
  CA: CollectiviteSousTypeEnum.EPCI_FP,
  CU: CollectiviteSousTypeEnum.EPCI_FP,
  METRO: CollectiviteSousTypeEnum.EPCI_FP,
  EPT: CollectiviteSousTypeEnum.EPCI_FP,
  SMF: CollectiviteSousTypeEnum.SYNDICAT,
  SMO: CollectiviteSousTypeEnum.SYNDICAT,
  SIVU: CollectiviteSousTypeEnum.SYNDICAT,
  SIVOM: CollectiviteSousTypeEnum.SYNDICAT,
  POLEM: CollectiviteSousTypeEnum.POLE,
  PETR: CollectiviteSousTypeEnum.POLE,
};

export const identiteCollectiviteSchema = z.object({
  type: z.enum(CollectiviteTypeEnum),
  soustype: z.enum(CollectiviteSousTypeEnum).nullable(),
  populationTags: z.array(z.enum(CollectivitePopulationTypeEnum)),
  drom: z.boolean().nullable(),
  test: z.boolean().optional(),
  dansAireUrbaine: z.boolean().nullable().optional(),
});

export type IdentiteCollectivite = z.infer<typeof identiteCollectiviteSchema>;

export const collectiviteAvecTypeSchema = collectiviteSchema.merge(
  identiteCollectiviteSchema
);

export type CollectiviteAvecType = z.infer<typeof collectiviteAvecTypeSchema>;
