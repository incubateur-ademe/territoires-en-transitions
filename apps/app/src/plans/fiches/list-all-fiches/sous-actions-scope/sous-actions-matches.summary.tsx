import type { SousActionsMatches } from '@/app/plans/fiches/list-all-fiches/data/use-count-sous-actions-matches';
import { appLabels } from '@/app/labels/catalog';

type Props = {
  sousActionsMatches?: SousActionsMatches;
  /** Nombre d'actions listées, affiché juste avant ce résumé. */
  totalActionsCount: number;
};

/**
 * « K sous-actions correspondantes (dans M d'entre elles) », à la suite du
 * nombre de résultats.
 */
export const SousActionsMatchesSummary = ({
  sousActionsMatches,
  totalActionsCount,
}: Props) => {
  if (!sousActionsMatches?.sousActionsCount) {
    return null;
  }
  return (
    <span data-test="plans.fiches.filtres.resume-sous-actions">
      {' · '}
      {appLabels.filtresSousActionsCorrespondantes({
        ...sousActionsMatches,
        totalActionsCount,
      })}
    </span>
  );
};
