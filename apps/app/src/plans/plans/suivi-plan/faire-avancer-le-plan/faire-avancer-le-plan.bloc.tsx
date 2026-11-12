'use client';

import { makeCollectivitePlanActionUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import {
  FaireAvancerLePlanCompte,
  faireAvancerLePlanFilters,
} from '@tet/domain/plans';
import { Button, Icon, IconValue } from '@tet/ui';
import { useGetFaireAvancerLePlan } from '../data/use-get-faire-avancer-le-plan';
import { SuiviPlanBloc } from '../suivi-plan.bloc';
import { RenseignerAvancementButton } from './renseigner-avancement.side-panel';

const lignes: {
  compte: FaireAvancerLePlanCompte;
  icon: IconValue;
  libelle: (count: number) => string;
  info: string;
}[] = [
  {
    compte: 'enCoursSansAvancement',
    icon: 'progress-1-line',
    libelle: appLabels.faireAvancerLePlanEnCoursSansAvancement,
    info: appLabels.faireAvancerLePlanEnCoursSansAvancementInfo,
  },
  {
    compte: 'nonModifieesDepuisPlusDUnAn',
    icon: 'refresh-line',
    libelle: appLabels.faireAvancerLePlanNonModifiees,
    info: appLabels.faireAvancerLePlanNonModifieesInfo,
  },
  {
    compte: 'aDecider',
    icon: 'alarm-warning-line',
    libelle: appLabels.faireAvancerLePlanADecider,
    info: appLabels.faireAvancerLePlanADeciderInfo,
  },
  {
    compte: 'sansPilote',
    icon: 'user-unfollow-line',
    libelle: appLabels.faireAvancerLePlanSansPilote,
    info: appLabels.faireAvancerLePlanSansPiloteInfo,
  },
];

export const FaireAvancerLePlanBloc = ({
  collectiviteId,
  planId,
}: {
  collectiviteId: number;
  planId: number;
}) => {
  const { data } = useGetFaireAvancerLePlan({ planId });
  const lignesVisibles = data
    ? lignes.filter(({ compte }) => data[compte] > 0)
    : lignes;

  if (lignesVisibles.length === 0) {
    return null;
  }

  return (
    <SuiviPlanBloc
      titre={appLabels.faireAvancerLePlanTitre}
      sousTitre={null}
      dataTest="plans.suivi.faire-avancer-le-plan"
      actions={
        <span className="self-start text-xs text-grey-8 whitespace-nowrap">
          {appLabels.faireAvancerLePlanNonExporte}
        </span>
      }
    >
      <p className="-mt-2 mb-0 text-sm text-grey-8">
        {appLabels.faireAvancerLePlanDescription}
      </p>
      <ul className="flex flex-col mb-0 p-0 list-none border-t border-grey-3">
        {lignesVisibles.map(({ compte, icon, libelle, info }) => {
          const count = data?.[compte];
          return (
            <li
              key={compte}
              className="flex items-center gap-4 py-3 border-b border-grey-3 last:border-b-0"
              data-test={`plans.suivi.faire-avancer-le-plan.${compte}`}
            >
              <span className="flex items-center justify-center shrink-0 size-10 rounded-full bg-primary-1 text-primary-9">
                <Icon icon={icon} />
              </span>
              <div className="flex flex-col flex-1 gap-0.5">
                <span className="text-sm text-primary-9">
                  {count === undefined ? (
                    <span className="inline-block w-6 h-4 align-middle rounded bg-grey-3 animate-pulse" />
                  ) : (
                    <b>{count}</b>
                  )}{' '}
                  {libelle(count ?? 0)}
                </span>
                <span className="text-xs text-grey-8">{info}</span>
              </div>
              {compte === 'enCoursSansAvancement' ? (
                <RenseignerAvancementButton
                  collectiviteId={collectiviteId}
                  planId={planId}
                  dataTest="plans.suivi.faire-avancer-le-plan.renseigner-avancement"
                />
              ) : (
                <Button
                  variant="outlined"
                  size="xs"
                  className="bg-white"
                  icon="arrow-right-s-line"
                  iconPosition="right"
                  href={makeCollectivitePlanActionUrl({
                    collectiviteId,
                    planActionUid: planId.toString(),
                    filters: faireAvancerLePlanFilters[compte],
                  })}
                  dataTest={`plans.suivi.faire-avancer-le-plan.${compte}.voir-les-actions`}
                >
                  {appLabels.faireAvancerLePlanVoirLesActions}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </SuiviPlanBloc>
  );
};
