'use client';

import { makeCollectiviteIndicateursUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { getIndicateurGroup } from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/utils';
import { toLocaleFixed } from '@/app/utils/to-locale-fixed';
import { RouterOutput } from '@tet/api';
import { IndicateurPeriodes } from '@tet/domain/indicateurs';
import { Alert, Button, Icon } from '@tet/ui';
import Link from 'next/link';
import { useState } from 'react';
import { useGetIndicateursObjectifs } from '../data/use-get-indicateurs-objectifs';
import { SuiviPlanBloc } from '../suivi-plan.bloc';

type IndicateurObjectif =
  RouterOutput['plans']['suivi']['getIndicateursObjectifs'][number];

const NB_INDICATEURS_VISIBLES = 10;

const formatValeur = (
  valeur: number,
  { precision, unite }: Pick<IndicateurObjectif, 'precision' | 'unite'>
) => `${toLocaleFixed(valeur, precision)} ${unite}`.trim();

const Valeur = ({
  valeur,
  periode,
  indicateur,
}: {
  valeur: number;
  periode: string;
  indicateur: IndicateurObjectif;
}) => (
  <span className="flex flex-col items-end">
    <span className="font-bold">{formatValeur(valeur, indicateur)}</span>
    <span className="text-xs text-grey-8">{periode}</span>
  </span>
);

const AucuneValeur = () => (
  <span className="text-grey-6">
    {appLabels.indicateursObjectifsSansValeur}
  </span>
);

export const IndicateursObjectifsBloc = ({
  collectiviteId,
  planId,
}: {
  collectiviteId: number;
  planId: number;
}) => {
  const { data: indicateurs, isError } = useGetIndicateursObjectifs({
    planId,
  });
  const [isAllVisible, setIsAllVisible] = useState(false);

  const indicateursVisibles =
    indicateurs && !isAllVisible
      ? indicateurs.slice(0, NB_INDICATEURS_VISIBLES)
      : indicateurs;
  const nbIndicateursMasques = indicateurs
    ? indicateurs.length - NB_INDICATEURS_VISIBLES
    : 0;

  return (
    <SuiviPlanBloc
      titre={appLabels.indicateursObjectifsTitre}
      dataTest="plans.suivi.indicateurs-objectifs"
    >
      {isError ? (
        <Alert
          state="error"
          title={appLabels.indicateursObjectifsErreurChargement}
        />
      ) : indicateurs === undefined ? (
        <div className="flex justify-center p-12">
          <Icon icon="loader-4-line" className="animate-spin text-grey-6" />
        </div>
      ) : indicateurs.length === 0 ? (
        <p className="mb-0 text-sm text-grey-8">
          {appLabels.indicateursObjectifsAucun}
        </p>
      ) : (
        <div className="flex flex-col">
          <table
            className="w-full text-sm text-primary-9"
            data-test="plans.suivi.indicateurs-objectifs.tableau"
          >
            <thead>
              <tr className="text-xs text-grey-8 border-b border-grey-3">
                <th className="py-2 font-normal text-left">
                  {appLabels.indicateursObjectifsIndicateur}
                </th>
                <th className="py-2 font-normal text-right">
                  {appLabels.indicateursObjectifsDerniereValeur}
                </th>
                <th className="py-2 font-normal text-right">
                  {appLabels.indicateursObjectifsObjectif}
                </th>
              </tr>
            </thead>
            <tbody>
              {indicateursVisibles?.map((indicateur) => (
                <tr key={indicateur.id} className="border-b border-grey-3">
                  <td className="py-2 pr-4">
                    <Link
                      href={makeCollectiviteIndicateursUrl({
                        collectiviteId,
                        indicateurView: getIndicateurGroup(
                          indicateur.identifiantReferentiel
                        ),
                        indicateurId: indicateur.id,
                        identifiantReferentiel:
                          indicateur.identifiantReferentiel,
                      })}
                      className="text-primary-9 bg-none hover:underline"
                      data-test="plans.suivi.indicateurs-objectifs.lien-indicateur"
                    >
                      {indicateur.titre}
                    </Link>
                  </td>
                  <td className="py-2 text-right">
                    {indicateur.derniereValeur ? (
                      <Valeur
                        valeur={indicateur.derniereValeur.valeur}
                        periode={IndicateurPeriodes.format(
                          IndicateurPeriodes.containing(
                            indicateur.periodicite,
                            indicateur.derniereValeur.dateValeur
                          )
                        )}
                        indicateur={indicateur}
                      />
                    ) : (
                      <AucuneValeur />
                    )}
                  </td>
                  <td className="py-2 text-right">
                    {indicateur.objectif ? (
                      <Valeur
                        valeur={indicateur.objectif.valeur}
                        periode={String(indicateur.objectif.annee)}
                        indicateur={indicateur}
                      />
                    ) : (
                      <AucuneValeur />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {nbIndicateursMasques > 0 && (
            <Button
              variant="unstyled"
              size="sm"
              className="flex items-center gap-1 self-start mt-3 text-sm text-primary-9"
              icon={isAllVisible ? 'arrow-up-s-line' : 'arrow-down-s-line'}
              iconPosition="right"
              onClick={() => setIsAllVisible((visible) => !visible)}
              dataTest="plans.suivi.indicateurs-objectifs.voir-tout"
            >
              {isAllVisible
                ? appLabels.indicateursObjectifsVoirMoins
                : appLabels.indicateursObjectifsVoirTout(indicateurs.length)}
            </Button>
          )}
        </div>
      )}
    </SuiviPlanBloc>
  );
};
