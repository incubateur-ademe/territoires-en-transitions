import { FicheSecteurs, OrigineSecteursEnum } from '@tet/domain/plans';
import { FicheActionSecteurAttribution } from './fiche-action-secteur-attribution.table';

export const toFicheSecteurs = (
  attribution: Pick<FicheActionSecteurAttribution, 'origine' | 'secteurs'>
): FicheSecteurs => {
  const { origine } = attribution;
  if (origine === OrigineSecteursEnum.INDISPONIBLE) {
    return { etat: 'a_renseigner' };
  }
  if (attribution.secteurs.length === 0) {
    return { etat: 'non_attribuable', origine };
  }
  return { etat: 'attribue', secteurs: attribution.secteurs, origine };
};

/** Au-delà, un 404 est définitif : si Communs devait recevoir la fiche, il l'aurait reçue */
export const DELAI_404_DEFINITIF_MS = 30 * 60 * 1000;

export const is404Definitif = (
  ficheModifiedAt: string,
  now: Date = new Date()
): boolean =>
  now.getTime() - new Date(ficheModifiedAt).getTime() > DELAI_404_DEFINITIF_MS;

export const hasTitre = (titre: string | null): boolean =>
  Boolean(titre?.trim());
