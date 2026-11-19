import { appLabels } from '@/app/labels/catalog';
import { Button } from '@tet/ui';
import type { ReactNode } from 'react';

type StepButtonProps = {
  href: string;
  dataTest: string;
  onClick?: () => void;
};

/**
 * La barre collante « Étape précédente | Étape suivante » : flotte au bas du
 * viewport tant que sa position naturelle est sous la ligne de flottaison, puis
 * reprend sa place dans le flux en fin de page.
 */
export const StepsNavBar = ({
  ariaLabel,
  dataTest,
  previous,
  children,
}: {
  ariaLabel: string;
  dataTest: string;
  previous: ReactNode;
  /** Ce qui s'aligne à droite : l'étape suivante, ou l'acte qui clôt le parcours. */
  children: ReactNode;
}) => (
  <nav
    aria-label={ariaLabel}
    data-test={dataTest}
    className="sticky bottom-0 z-10 flex w-full items-center gap-4 border-t border-primary-3 bg-grey-2 py-4 shadow-t-sm"
  >
    {previous}
    <div className="ml-auto flex items-center gap-4">{children}</div>
  </nav>
);

export const StepsNavPreviousButton = ({
  href,
  dataTest,
  onClick,
}: StepButtonProps) => (
  <Button
    dataTest={dataTest}
    variant="outlined"
    size="sm"
    icon="arrow-left-line"
    iconPosition="left"
    href={href}
    onClick={onClick}
  >
    {appLabels.demarcheStepsNavPrevious}
  </Button>
);

export const StepsNavNextButton = ({
  href,
  dataTest,
  onClick,
}: StepButtonProps) => (
  <Button
    dataTest={dataTest}
    variant="primary"
    size="sm"
    icon="arrow-right-line"
    iconPosition="right"
    href={href}
    onClick={onClick}
  >
    {appLabels.demarcheStepsNavNext}
  </Button>
);
