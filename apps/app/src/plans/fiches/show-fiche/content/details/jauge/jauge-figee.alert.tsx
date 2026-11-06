import { appLabels } from '@/app/labels/catalog';
import { ficheStatutToColorVariant } from '@/app/plans/fiches/show-fiche/components/fiche-statut.badge';
import { variantClassNames } from '@tet/design-tokens';
import { StatutFigeantJauge } from '@tet/domain/plans';
import { cn, Icon } from '@tet/ui';
import { JSX } from 'react';

export const JaugeFigeeAlert = ({
  statut,
}: {
  statut: StatutFigeantJauge;
}): JSX.Element => {
  const styles = variantClassNames[ficheStatutToColorVariant[statut]].solid;

  return (
    <div
      className={cn('flex gap-3 rounded-lg p-4', styles.background)}
      data-test="fiche.jauge.figee"
    >
      <Icon icon="information-fill" className={cn('mt-0.5', styles.icon)} />
      <div className="flex flex-col gap-3">
        <p className={cn('mb-0 text-base font-bold', styles.text)}>
          {appLabels.ficheJaugeFigeeTitre}
        </p>
        <p className="mb-0 text-sm font-medium text-grey-9">
          {appLabels.ficheJaugeFigee[statut]}
        </p>
      </div>
    </div>
  );
};
