import * as z from 'zod/mini';
import { DemarchePcaetObligationEnum } from './demarche-pcaet-obligation.enum.schema';

/**
 * La situation d'une collectivité au regard du PCAET, telle que le suivi
 * d'instruction l'affiche.
 *
 * Plus large que `DemarchePcaetObligation`, qui qualifie un dépôt : « volontaire »
 * dit une démarche engagée. Un EPCI sous le seuil qui n'a rien déposé n'est donc
 * pas volontaire mais non obligé — valeur qui n'a pas de sens sur un dépôt.
 */
export const CollectivitePcaetObligationEnum = {
  ...DemarchePcaetObligationEnum,
  NON_OBLIGE: 'non_oblige',
} as const;

export const collectivitePcaetObligationValues = [
  CollectivitePcaetObligationEnum.OBLIGATOIRE,
  CollectivitePcaetObligationEnum.VOLONTAIRE,
  CollectivitePcaetObligationEnum.NON_OBLIGE,
] as const;

export const collectivitePcaetObligationSchema = z.enum(
  collectivitePcaetObligationValues
);

export type CollectivitePcaetObligation = z.infer<
  typeof collectivitePcaetObligationSchema
>;
