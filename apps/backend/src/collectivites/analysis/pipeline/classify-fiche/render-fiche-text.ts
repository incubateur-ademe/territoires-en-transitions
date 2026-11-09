import { AxePath } from '../../analyze-fiches/fiche-axe-path.repository';
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_TITRE_LENGTH,
  sanitize,
  truncate,
} from '../classify-fiches/render-fiches-text';

export const MAX_CONTEXTE_LENGTH = 500;

const WITHOUT_CONTEXTE = 'non renseigné';
const WITHOUT_TITRE = '(sans titre)';
const WITHOUT_DESCRIPTION = 'aucune';
const WITHOUT_AXE_NAME = '(sans nom)';
const AXE_SEPARATOR = ' > ';
const AXE_PATH_SEPARATOR = ' | ';

export type FicheToClassify = {
  ficheId: number;
  titre: string;
  description: string | null;
  axePaths: readonly AxePath[];
};

export type RenderedFiche = {
  ficheId: number;
  text: string;
  isDescriptionTruncated: boolean;
};

const renderContexte = (axePaths: readonly AxePath[]): string => {
  if (axePaths.length === 0) {
    return WITHOUT_CONTEXTE;
  }
  return truncate(
    axePaths
      .map((axePath) =>
        axePath
          .map((nom) => sanitize(nom) || WITHOUT_AXE_NAME)
          .join(AXE_SEPARATOR)
      )
      .join(AXE_PATH_SEPARATOR),
    MAX_CONTEXTE_LENGTH
  );
};

export const renderFicheText = (
  fiche: FicheToClassify,
  nonce: string
): RenderedFiche => {
  const titre = truncate(sanitize(fiche.titre), MAX_TITRE_LENGTH);
  const sanitizedDescription = sanitize(fiche.description ?? '');
  const description = truncate(sanitizedDescription, MAX_DESCRIPTION_LENGTH);

  return {
    ficheId: fiche.ficheId,
    text: [
      `<fiche nonce="${nonce}">`,
      `Contexte : ${renderContexte(fiche.axePaths)}`,
      `Titre : ${titre || WITHOUT_TITRE}`,
      `Description : ${description || WITHOUT_DESCRIPTION}`,
      '</fiche>',
    ].join('\n'),
    isDescriptionTruncated:
      Array.from(sanitizedDescription).length > MAX_DESCRIPTION_LENGTH,
  };
};
