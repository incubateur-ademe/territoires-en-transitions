import * as z from 'zod/mini';

export const PcaetAvisSensEnum = {
  FAVORABLE: 'favorable',
  AVEC_RESERVES: 'avec_reserves',
  DEFAVORABLE: 'defavorable',
} as const;

export const pcaetAvisSensValues = [
  PcaetAvisSensEnum.FAVORABLE,
  PcaetAvisSensEnum.AVEC_RESERVES,
  PcaetAvisSensEnum.DEFAVORABLE,
] as const;

export const pcaetAvisSensSchema = z.enum(pcaetAvisSensValues);

export type PcaetAvisSens = z.infer<typeof pcaetAvisSensSchema>;
