import z from 'zod';

export const collectiviteTypeEnum = {
  REGION: 'region',
  DEPARTEMENT: 'departement',
  EPCI: 'epci',
  COMMUNE: 'commune',
  TEST: 'test',
  PREFECTURE_REGION: 'prefecture_region',
  PREFECTURE_DEPARTEMENT: 'prefecture_departement',
  SERVICE_PUBLIC: 'service_public',
} as const;

export type CollectiviteType =
  (typeof collectiviteTypeEnum)[keyof typeof collectiviteTypeEnum];

export const collectiviteTypeEnumSchema = z.enum(collectiviteTypeEnum);
