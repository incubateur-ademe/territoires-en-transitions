import {
  DemarchePcaetStatusEnum,
  type DemarchePcaetStatus,
} from './demarche-pcaet-status.enum.schema';

/**
 * Ce qui reste modifiable dans un dossier PCAET, selon son statut.
 *
 * Le dossier a deux temps, ceux que le modèle documentaire nomme déjà `amont`
 * et `aval` :
 *
 * - **amont** — tout ce qui se remplit avant les avis : l'en-tête, le
 *   diagnostic, les pièces du dossier d'élaboration. La transmission ferme cet
 *   ensemble d'un coup, parce que les instances consultatives doivent lire un
 *   dossier stable — c'est aussi à ce moment que la photo du diagnostic est
 *   figée.
 * - **aval** — ce qui est attendu après les avis (délibération d'adoption,
 *   évaluations) : ne s'ouvre qu'à l'adoption, et reste ouvert ensuite.
 *
 * Ce ne sont pas des permissions utilisateur : celles-ci sont portées par
 * `demarches.pcaet.mutate` et répondent à « cette personne a-t-elle le droit
 * d'écrire ici ». Ces règles répondent à « le dossier accepte-t-il encore cette
 * écriture », et la réponse vaut pour tout le monde, quel que soit le rôle.
 *
 * Hors du workflow, volontairement : aucune de ces écritures ne déplace un
 * statut. Le serveur les vérifie sous verrou dans `assertWritable`, le front lit
 * les deux drapeaux du DTO pour passer en lecture seule ce qui est fermé.
 */

/** Les deux temps du dossier — mêmes valeurs que `DemarcheDocumentEtape`. */
export type DemarchePcaetEtapeDossier = 'amont' | 'aval';

export const isDemarchePcaetAmontModifiable = (
  status: DemarchePcaetStatus
): boolean => status === DemarchePcaetStatusEnum.EN_ELABORATION;

export const isDemarchePcaetAvalModifiable = (
  status: DemarchePcaetStatus
): boolean =>
  status === DemarchePcaetStatusEnum.ADOPTE ||
  status === DemarchePcaetStatusEnum.PUBLIE ||
  status === DemarchePcaetStatusEnum.ARCHIVE;

/** Aiguille sur le bon temps du dossier — l'étape d'une pièce s'y branche. */
export const isDemarchePcaetEtapeModifiable = (
  status: DemarchePcaetStatus,
  etape: DemarchePcaetEtapeDossier
): boolean =>
  etape === 'amont'
    ? isDemarchePcaetAmontModifiable(status)
    : isDemarchePcaetAvalModifiable(status);
