'use client';

import { useCurrentCollectivite } from '@tet/api/collectivites';
import { ContexteInstruction } from '@tet/domain/demarches';

/**
 * Le service au titre duquel on consulte la collectivité courante, `null` quand
 * on n'y est pas en instructeur.
 *
 * À préférer à `useCollectiviteId()` partout où l'on désigne l'instructeur : sur
 * un dossier, la collectivité courante est la **déposante**, et confondre les
 * deux ferait écrire dans la bibliothèque de la collectivité instruite.
 */
export const useContexteInstruction = (): ContexteInstruction | null =>
  useCurrentCollectivite().contexteInstruction;

/**
 * La collectivité qui instruit, `null` hors contexte d'instruction. C'est elle
 * qui porte les pièces d'un avis : le serveur les résout par l'émetteur.
 */
export const useInstructeurCollectiviteId = (): number | null =>
  useContexteInstruction()?.instructeur.collectiviteId ?? null;
