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
 *   figée. Un dépôt hors plateforme n'a pas de transmission pour le fermer :
 *   son amont reste ouvert, en même temps que son aval, et c'est la publication
 *   qui les ferme tous deux.
 * - **aval** — ce qui est attendu après les avis (mémoire de réponse,
 *   délibération d'adoption) : s'ouvre à la clôture de l'instruction, **avant**
 *   la publication, puisque c'est le dépôt de la délibération d'adoption qui
 *   rend le dossier publiable. La publication le referme : le PCAET adopté est
 *   celui que le public consulte, ses pièces ne bougent plus. Une démarche
 *   archivée, publiée avant de l'être, reste fermée.
 *
 * Le **contenu** du dossier — diagnostic, objectifs, programme d'actions — suit
 * une troisième règle : fermé pendant la phase d'avis, comme l'amont, mais
 * rouvert à la clôture de l'instruction, comme l'aval. La collectivité y reprend
 * son dossier pour tenir compte des avis avant le dépôt final ; l'en-tête et les
 * pièces amont, eux, restent tels qu'ils ont été transmis.
 *
 * Ce ne sont pas des permissions utilisateur : celles-ci sont portées par
 * `demarches.pcaet.mutate` et répondent à « cette personne a-t-elle le droit
 * d'écrire ici ». Ces règles répondent à « le dossier accepte-t-il encore cette
 * écriture », et la réponse vaut pour tout le monde, quel que soit le rôle —
 * à une exception près : les pilotes, qu'un admin peut changer à tout statut
 * (`demarches.pcaet.mutate_pilotes_any_status`).
 *
 * Hors du workflow, volontairement : aucune de ces écritures ne déplace un
 * statut. Le serveur les vérifie sous verrou dans `assertWritable`, le front lit
 * les deux drapeaux du DTO pour passer en lecture seule ce qui est fermé.
 */

/** Les deux temps du dossier — mêmes valeurs que `DemarcheDocumentEtape`. */
export type DemarchePcaetEtapeDossier = 'amont' | 'aval';

export const isDemarchePcaetAmontModifiable = (
  status: DemarchePcaetStatus
): boolean =>
  status === DemarchePcaetStatusEnum.EN_ELABORATION ||
  status === DemarchePcaetStatusEnum.INSTRUIT_HORS_PLATEFORME;

export const isDemarchePcaetAvalModifiable = (
  status: DemarchePcaetStatus
): boolean =>
  status === DemarchePcaetStatusEnum.INSTRUIT ||
  status === DemarchePcaetStatusEnum.INSTRUIT_HORS_PLATEFORME;

export const isDemarchePcaetContenuModifiable = (
  status: DemarchePcaetStatus
): boolean =>
  isDemarchePcaetAmontModifiable(status) ||
  isDemarchePcaetAvalModifiable(status);

/** Aiguille sur le bon temps du dossier — l'étape d'une pièce s'y branche. */
export const isDemarchePcaetEtapeModifiable = (
  status: DemarchePcaetStatus,
  etape: DemarchePcaetEtapeDossier
): boolean =>
  etape === 'amont'
    ? isDemarchePcaetAmontModifiable(status)
    : isDemarchePcaetAvalModifiable(status);

/** Ce qu'une écriture vise : un temps du dossier, ou son contenu. */
export type DemarchePcaetPartieDossier = DemarchePcaetEtapeDossier | 'contenu';

export const isDemarchePcaetPartieModifiable = (
  status: DemarchePcaetStatus,
  partie: DemarchePcaetPartieDossier
): boolean =>
  partie === 'contenu'
    ? isDemarchePcaetContenuModifiable(status)
    : isDemarchePcaetEtapeModifiable(status, partie);
