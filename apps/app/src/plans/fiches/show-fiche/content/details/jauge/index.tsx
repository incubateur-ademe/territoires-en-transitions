import { appLabels } from '@/app/labels/catalog';
import { DetailedAction } from '@/app/ui/detailed-action/detailed-action.layout';
import {
  isJaugeFigee,
  JAUGE_MAX,
  JAUGE_MIN,
  JAUGE_STEP,
  StatutEnum,
} from '@tet/domain/plans';
import { cn, Icon, Slider, Tooltip } from '@tet/ui';
import { format } from 'date-fns';
import { JSX, useState } from 'react';
import { getJaugeColors } from '@/app/plans/shared/jauge/get-jauge-colors';
import { JaugeBadge } from '@/app/plans/shared/jauge/jauge.badge';
import { useFicheContext } from '../../../context/fiche-context';
import { JaugeFigeeAlert } from './jauge-figee.alert';
import { SousActionsRealiseesSkeleton } from './sous-actions-realisees.skeleton';

export const Jauge = (): JSX.Element => {
  const { fiche, isReadonly, update, sousActions } = useFicheContext();
  const [jauge, setJauge] = useState(fiche.jauge);
  const [savedJauge, setSavedJauge] = useState(fiche.jauge);

  if (fiche.jauge !== savedJauge) {
    setSavedJauge(fiche.jauge);
    setJauge(fiche.jauge);
  }

  const statut = fiche.statut;
  const isFigee = isJaugeFigee(statut);
  const isDisabled = isReadonly || isFigee;
  const colors = getJaugeColors({ jauge, isDisabled });
  const sousActionsRealisees = sousActions.list.filter(
    (sousAction) => sousAction.statut === StatutEnum.REALISE
  ).length;

  return (
    <DetailedAction.Section>
      <div className="flex flex-col gap-4" data-test="fiche.jauge">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="mb-0 text-lg font-bold leading-4 text-primary-10">
            {appLabels.ficheJauge}
          </h2>
          <JaugeBadge
            value={jauge}
            statut={statut}
            isDisabled={isDisabled}
            isLarge
          />
          {fiche.jaugeModifiedAt && (
            <p className="mb-0 ml-auto text-xs font-light italic text-grey-7">
              {appLabels.ficheJaugeMiseAJour(
                format(new Date(fiche.jaugeModifiedAt), 'dd/MM/yyyy')
              )}
            </p>
          )}
        </div>

        <Slider
          aria-label={appLabels.ficheJauge}
          min={JAUGE_MIN}
          max={JAUGE_MAX}
          step={JAUGE_STEP}
          value={[jauge]}
          disabled={isDisabled}
          rangeColors={[colors.fill, colors.track]}
          className={cn(
            'my-2 [&>span:first-child]:h-2 [&_[role=slider]]:border-2',
            isDisabled
              ? 'cursor-not-allowed [&_[role=slider]]:cursor-not-allowed [&_[role=slider]]:border-grey-5 [&_[role=slider]]:bg-grey-3'
              : cn(
                  '[&_[role=slider]]:ring-4 [&_[role=slider]]:shadow-md',
                  jauge === JAUGE_MAX
                    ? '[&_[role=slider]]:border-success-1 [&_[role=slider]]:ring-success-1/15'
                    : '[&_[role=slider]]:border-primary-9 [&_[role=slider]]:ring-primary-9/15'
                )
          )}
          onValueChange={([value]) => setJauge(value)}
          onValueCommit={([value]) => {
            if (value === fiche.jauge) return;
            update({ ficheId: fiche.id, ficheFields: { jauge: value } });
          }}
          data-test="fiche.jauge.slider"
        />

        <div className="flex justify-between text-xs leading-5 text-grey-7">
          <span>{`${JAUGE_MIN} %`}</span>
          <Tooltip label={appLabels.ficheJaugeInfo}>
            <span className="flex items-center gap-1">
              {`${JAUGE_MAX} %`}
              <Icon icon="information-line" size="xs" />
            </span>
          </Tooltip>
        </div>

        {isFigee && <JaugeFigeeAlert statut={statut} />}

        {sousActions.isLoading && <SousActionsRealiseesSkeleton />}

        {!sousActions.isLoading && sousActions.list.length > 0 && (
          <p className="mb-0 text-sm text-grey-8">
            {appLabels.ficheJaugeSousActionsRealisees({
              realisees: sousActionsRealisees,
              total: sousActions.list.length,
            })}
          </p>
        )}
      </div>
    </DetailedAction.Section>
  );
};
