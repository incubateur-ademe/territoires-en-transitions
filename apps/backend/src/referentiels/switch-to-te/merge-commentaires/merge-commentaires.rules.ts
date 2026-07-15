import { sortByReferentielOrder } from '../shared/action-origine';
import {
  getScoreRatios,
  getStatutAvancement,
  StatutAvancementEnum,
  type ActionScore,
  type ReferentielId,
} from '@tet/domain/referentiels';
import { htmlToText } from '@tet/domain/utils';

export const MERGE_COMMENTAIRES_PREFIX =
  '<p><span data-text-color="red">Les textes ci-après et les statuts associés sont issus de la bascule depuis les anciens référentiels CAE et/ou ECi. Ils sont à actualiser pour répondre à l\'actuelle sous-mesure.</span></p>\n<p>&nbsp;</p>';

export const MERGE_COMMENTAIRES_BLOCK_SEPARATOR = '<p>&nbsp;</p>\n';

export type MergeCommentaireSource = {
  referentielId: ReferentielId;
  origineActionId: string;
  nom: string | null;
  scoreLabel: string;
  explication: string;
};

export const isExplicationNonVide = (explication: string): boolean =>
  htmlToText(explication).trim().length > 0;

export const formatSourceScoreLabel = (actionScore: ActionScore): string => {
  const statut = getStatutAvancement({
    avancement: actionScore.avancement,
    desactive: actionScore.desactive,
    concerne: actionScore.concerne,
  });

  switch (statut) {
    case StatutAvancementEnum.FAIT:
      return 'FAIT';
    case StatutAvancementEnum.PROGRAMME:
      return 'PROGRAMMÉ';
    case StatutAvancementEnum.PAS_FAIT:
      return 'PAS FAIT';
    case StatutAvancementEnum.NON_RENSEIGNE:
    case StatutAvancementEnum.NON_RENSEIGNABLE:
      return 'NON RENSEIGNÉ';
    case StatutAvancementEnum.DETAILLE_AU_POURCENTAGE:
    case StatutAvancementEnum.DETAILLE_A_LA_TACHE: {
      const { ratioFait } = getScoreRatios({
        pointFait: actionScore.pointFait ?? 0,
        pointProgramme: actionScore.pointProgramme ?? 0,
        pointPasFait: actionScore.pointPasFait ?? 0,
        pointNonRenseigne: actionScore.pointNonRenseigne ?? 0,
        pointPotentiel: actionScore.pointPotentiel ?? 0,
        pointReferentiel: actionScore.pointReferentiel ?? 0,
        completedTachesCount: actionScore.completedTachesCount ?? 0,
        totalTachesCount: actionScore.totalTachesCount ?? 0,
        pasFaitTachesAvancement: actionScore.pasFaitTachesAvancement ?? 0,
        faitTachesAvancement: actionScore.faitTachesAvancement ?? 0,
        programmeTachesAvancement: actionScore.programmeTachesAvancement ?? 0,
        pasConcerneTachesAvancement:
          actionScore.pasConcerneTachesAvancement ?? 0,
        pointPotentielPerso: actionScore.pointPotentielPerso ?? null,
        concerne: actionScore.concerne,
        desactive: actionScore.desactive,
        renseigne: actionScore.renseigne,
        actionId: actionScore.actionId,
      });
      const faitPercent = Math.floor(ratioFait * 100);
      return `${faitPercent} % FAIT`;
    }
    case StatutAvancementEnum.NON_CONCERNE:
      throw new Error(
        'formatSourceScoreLabel ne doit pas être appelé pour une source non concernée'
      );
    default: {
      return statut;
    }
  }
};

export const buildSourceBlockHeader = (
  source: MergeCommentaireSource
): string => {
  const titleParts = [source.origineActionId];
  if (source.nom) {
    titleParts.push(source.nom);
  }
  titleParts.push(source.scoreLabel);
  return `<p><strong>${titleParts.join(' - ')}</strong></p>`;
};

export const buildSourceBlock = (source: MergeCommentaireSource): string =>
  `${buildSourceBlockHeader(source)}\n${source.explication}`;

export const sortMergeCommentaireSources = (
  sources: MergeCommentaireSource[]
): MergeCommentaireSource[] => sortByReferentielOrder(sources);

export const mergeCommentairesFromSources = (
  sources: MergeCommentaireSource[]
): string | null => {
  const sourcesWithText = sources.filter((source) =>
    isExplicationNonVide(source.explication)
  );

  if (sourcesWithText.length === 0) {
    return null;
  }

  const sortedSources = sortMergeCommentaireSources(sourcesWithText);
  const blocks = sortedSources.map((source) => buildSourceBlock(source));

  return `${MERGE_COMMENTAIRES_PREFIX}${blocks.join(
    MERGE_COMMENTAIRES_BLOCK_SEPARATOR
  )}`;
};
