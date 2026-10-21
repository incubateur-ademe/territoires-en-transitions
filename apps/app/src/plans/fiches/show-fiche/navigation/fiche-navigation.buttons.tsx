import { appLabels } from '@/app/labels/catalog';
import { Button } from '@tet/ui';

export type FicheNavigationLinks = {
  previousHref?: string;
  nextHref?: string;
};

export const FicheNavigationButtons = ({
  previousHref,
  nextHref,
}: FicheNavigationLinks) => (
  <div className="flex flex-wrap justify-between gap-2">
    <Button
      href={previousHref}
      disabled={!previousHref}
      variant="outlined"
      size="sm"
      className="h-9 py-0"
      icon="arrow-left-line"
      dataTest="plans.fiches.navigation.previous"
    >
      {appLabels.ficheNavigationPrecedente}
    </Button>
    <Button
      href={nextHref}
      disabled={!nextHref}
      variant="outlined"
      size="sm"
      className="h-9 py-0"
      icon="arrow-right-line"
      iconPosition="right"
      dataTest="plans.fiches.navigation.next"
    >
      {appLabels.ficheNavigationSuivante}
    </Button>
  </div>
);
