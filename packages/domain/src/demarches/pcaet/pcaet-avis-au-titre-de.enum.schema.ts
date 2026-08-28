import * as z from 'zod/mini';

/**
 * Les trois avis que le code de l'environnement attend sur un PCAET :
 * l'autorité environnementale (art. R.122-21), le président de région et le
 * préfet de région (art. R.229-54).
 *
 * Ce sont trois titres, pas trois émetteurs : la DREAL porte ceux du préfet de
 * région et de l'autorité environnementale, le conseil régional celui de son
 * président — cf. `pcaet-instructeur.rules`. En pratique un même document peut
 * les porter tous, d'où trois entrées pouvant référencer la même pièce.
 */
export const PcaetAvisAuTitreDeEnum = {
  PREFET_REGION: 'prefet_region',
  AUTORITE_ENVIRONNEMENTALE: 'autorite_environnementale',
  PRESIDENT_REGION: 'president_region',
} as const;

export const pcaetAvisAuTitreDeValues = [
  PcaetAvisAuTitreDeEnum.PREFET_REGION,
  PcaetAvisAuTitreDeEnum.AUTORITE_ENVIRONNEMENTALE,
  PcaetAvisAuTitreDeEnum.PRESIDENT_REGION,
] as const;

export const pcaetAvisAuTitreDeSchema = z.enum(pcaetAvisAuTitreDeValues);

export type PcaetAvisAuTitreDe = z.infer<typeof pcaetAvisAuTitreDeSchema>;
