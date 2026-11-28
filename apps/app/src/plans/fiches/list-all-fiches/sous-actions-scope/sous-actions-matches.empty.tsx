import type { SousActionsMatches } from '@/app/plans/fiches/list-all-fiches/data/use-count-sous-actions-matches';
import { appLabels } from '@/app/labels/catalog';
import PictoExpert from '@/app/ui/pictogrammes/PictoExpert';
import { EmptyCard } from '@tet/ui';

type Props = {
  /** Sous-actions qui correspondent aux filtres, quand on ne les inclut pas */
  sousActionsMatches?: SousActionsMatches;
  onIncludeSousActions: () => void;
};

/**
 * Aucune action ne correspond aux filtres. Si des sous-actions y
 * correspondent, on le signale et on propose de les inclure.
 */
export const SousActionsMatchesEmpty = ({
  sousActionsMatches,
  onIncludeSousActions,
}: Props) => {
  const hasSousActionsMatches = !!sousActionsMatches?.sousActionsCount;
  return (
    <EmptyCard
      picto={(props) => <PictoExpert {...props} />}
      title={appLabels.aucuneActionRecherche}
      subTitle={
        hasSousActionsMatches
          ? appLabels.filtresSousActionsCorrespondent(sousActionsMatches)
          : undefined
      }
      actions={[
        {
          children: appLabels.filtresInclureSousActions,
          onClick: onIncludeSousActions,
          isVisible: hasSousActionsMatches,
          dataTest: 'plans.fiches.filtres.inclure-sous-actions-button',
        },
      ]}
      variant="transparent"
    />
  );
};
