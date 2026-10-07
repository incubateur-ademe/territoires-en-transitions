import * as z from 'zod/mini';

/**
 * Par quel territoire de la déposante un service a été saisi.
 *
 * Un EPCI à fiscalité propre peut chevaucher plusieurs départements et plusieurs
 * régions, et la transmission saisit les services de tous ses territoires : la
 * DDT du Morbihan doit voir le dossier de Redon Agglomération. Mais l'avis du
 * préfet de région de ce dossier revient à la DREAL du siège, pas à celle de la
 * région limitrophe, qui le lit sans s'y prononcer.
 *
 * D'où deux natures de saisine, pour un même destinataire et un même type :
 * la même DREAL est principale sur un dossier et secondaire sur un autre. C'est
 * la saisine qui porte la distinction, pas la collectivité.
 *
 * Le fait est écrit à la transmission plutôt que déduit à la lecture : le calcul
 * des périmètres se rejoue chaque année depuis Banatic, et un dossier en cours
 * d'instruction ne doit pas changer de nature entre deux millésimes.
 */
export const PcaetPerimetreSaisineEnum = {
  /** Le territoire que `collectivite` porte elle-même. */
  PRINCIPAL: 'principal',
  /** Un territoire de `collectivite_perimetre_secondaire`. */
  SECONDAIRE: 'secondaire',
} as const;

export const pcaetPerimetreSaisineValues = [
  PcaetPerimetreSaisineEnum.PRINCIPAL,
  PcaetPerimetreSaisineEnum.SECONDAIRE,
] as const;

export const pcaetPerimetreSaisineSchema = z.enum(pcaetPerimetreSaisineValues);

export type PcaetPerimetreSaisine = z.infer<typeof pcaetPerimetreSaisineSchema>;
