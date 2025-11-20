import z from 'zod';

export const collectiviteTypeEnum = {
  REGION: 'region',
  DEPARTEMENT: 'departement',
  EPCI: 'epci',
  COMMUNE: 'commune',
  TEST: 'test',
} as const;

export type CollectiviteType =
  (typeof collectiviteTypeEnum)[keyof typeof collectiviteTypeEnum];

export const collectiviteTypeEnumSchema = z.enum(collectiviteTypeEnum);
