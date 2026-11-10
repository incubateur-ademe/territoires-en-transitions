import { appLabels } from '@/app/labels/catalog';
import { JaugeBar } from '@/app/plans/shared/jauge/jauge.bar';
import { isJaugeFigee, Statut } from '@tet/domain/plans';
import { Tooltip } from '@tet/ui';
import { JSX } from 'react';

type FicheJaugeProps = {
  jauge: number;
  statut: Statut | null;
};

export const FicheJauge = ({ jauge, statut }: FicheJaugeProps): JSX.Element => (
  <Tooltip
    label={`${appLabels.ficheStatut} : ${statut ?? appLabels.filtreNoStatut}`}
  >
    <div data-test="fiche.card.jauge">
      <JaugeBar
        value={jauge}
        statut={statut}
        isDisabled={isJaugeFigee(statut)}
      />
    </div>
  </Tooltip>
);
