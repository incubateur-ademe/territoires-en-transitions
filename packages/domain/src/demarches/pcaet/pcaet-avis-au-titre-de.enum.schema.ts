import * as z from 'zod/mini';

/**
 * Les titres au nom desquels un avis est rendu sur un PCAET, sur cette
 * plateforme : le préfet de région (art. R.229-54 du code de l'environnement)
 * et le président de région.
 *
 * Un titre par émetteur : la DREAL porte celui du préfet de région, le conseil
 * régional celui de son président — cf. `pcaet-instructeur.rules`. L'avis de
 * l'autorité environnementale (art. R.122-21) existe bien, mais il se rend sur
 * une autre plateforme : il n'a pas de titre ici. Le modèle « un avis par titre
 * et par demande » reste en place pour pouvoir l'accueillir un jour.
 */
export const PcaetAvisAuTitreDeEnum = {
  PREFET_REGION: 'prefet_region',
  PRESIDENT_REGION: 'president_region',
} as const;

export const pcaetAvisAuTitreDeValues = [
  PcaetAvisAuTitreDeEnum.PREFET_REGION,
  PcaetAvisAuTitreDeEnum.PRESIDENT_REGION,
] as const;

export const pcaetAvisAuTitreDeSchema = z.enum(pcaetAvisAuTitreDeValues);

export type PcaetAvisAuTitreDe = z.infer<typeof pcaetAvisAuTitreDeSchema>;
