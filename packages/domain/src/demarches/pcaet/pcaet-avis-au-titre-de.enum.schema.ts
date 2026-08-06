import * as z from 'zod/mini';

export const PcaetAvisAuTitreDeEnum = {
  PREFET_REGION: 'prefet_region',
  AUTORITE_ENVIRONNEMENTALE: 'autorite_environnementale',
} as const;

export const pcaetAvisAuTitreDeValues = [
  PcaetAvisAuTitreDeEnum.PREFET_REGION,
  PcaetAvisAuTitreDeEnum.AUTORITE_ENVIRONNEMENTALE,
] as const;

export const pcaetAvisAuTitreDeSchema = z.enum(pcaetAvisAuTitreDeValues);

export type PcaetAvisAuTitreDe = z.infer<typeof pcaetAvisAuTitreDeSchema>;
