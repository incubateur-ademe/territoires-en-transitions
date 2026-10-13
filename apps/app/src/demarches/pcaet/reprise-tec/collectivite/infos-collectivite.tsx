'use client';

import { appLabels } from '@/app/labels/catalog';
import { Icon, Tooltip } from '@tet/ui';
import { Fragment } from 'react';
import type { RecetteCollectiviteDetail } from '../data/use-get-collectivite';

export const InfosCollectivite = ({
  collectivite,
}: {
  collectivite: RecetteCollectiviteDetail['collectivite'];
}) => {
  const infos: [string, string][] = [
    [
      appLabels.repriseTecInfoSiren,
      collectivite.siren ?? appLabels.repriseTecAucun,
    ],
    [
      appLabels.repriseTecInfoTerritoire,
      [collectivite.departement, collectivite.region]
        .filter(Boolean)
        .join(', ') || appLabels.repriseTecInconnu,
    ],
    ...(collectivite.population
      ? [
          [
            appLabels.repriseTecInfoHabitants,
            collectivite.population.toLocaleString('fr-FR'),
          ] as [string, string],
        ]
      : []),
  ];
  return (
    <Tooltip
      activatedBy="click"
      placement="bottom-start"
      label={
        <span className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          {infos.map(([cle, valeur]) => (
            <Fragment key={cle}>
              <span className="text-grey-8">{cle}</span>
              <span className="font-medium tabular-nums text-grey-10">
                {valeur}
              </span>
            </Fragment>
          ))}
        </span>
      }
    >
      <button
        type="button"
        aria-label={appLabels.repriseTecInfosCollectivite}
        data-test="admin.reprise-tec.infos-collectivite"
        className="flex h-8 w-8 items-center justify-center rounded-md border border-grey-4 bg-white text-primary-9 hover:border-primary-7 focus-visible:outline-2 focus-visible:outline-primary-7"
      >
        <Icon icon="information-line" size="sm" />
      </button>
    </Tooltip>
  );
};
