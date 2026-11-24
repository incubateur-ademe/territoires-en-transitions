import { getIndicateurGroup } from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/utils';
import { makeCollectiviteIndicateursUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { toLocaleFixed } from '@/app/utils/to-locale-fixed';
import { RouterOutput } from '@tet/api';
import { IndicateurPeriodes } from '@tet/domain/indicateurs';
import {
  computeAvancementObjectif,
  pickDepart,
  pickDernier,
  pickObjectifAHorizon,
} from '@tet/domain/plans';
import { Icon, InfoTooltip } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import Link from 'next/link';
import {
  formatEvolution,
  IndicateurObjectifAvancement,
} from './indicateur-objectif.avancement';
import { IndicateurObjectifSparkline } from './indicateur-objectif.sparkline';

export type IndicateurObjectif =
  RouterOutput['plans']['suivi']['getIndicateursObjectifs'][number];

const SaisirLink = ({ href, children }: { href: string; children: string }) => (
  <Link
    href={href}
    className="text-sm text-primary-9 underline bg-none hover:text-primary-8"
    data-test="plans.suivi.indicateurs-objectifs.saisir"
  >
    {children}
  </Link>
);

export const IndicateurObjectifCard = ({
  collectiviteId,
  indicateur,
  horizon,
  canMutateValeurs,
}: {
  collectiviteId: number;
  indicateur: IndicateurObjectif;
  horizon: number;
  canMutateValeurs: boolean;
}) => {
  const { titre, unite, precision, periodicite, favori, resultats, objectifs } =
    indicateur;
  const href = makeCollectiviteIndicateursUrl({
    collectiviteId,
    indicateurView: getIndicateurGroup(indicateur.identifiantReferentiel),
    indicateurId: indicateur.id,
    identifiantReferentiel: indicateur.identifiantReferentiel,
  });

  const formatNombre = (valeur: number) => toLocaleFixed(valeur, precision);
  const formatValeur = (valeur: number) =>
    `${formatNombre(valeur)} ${unite}`.trim();

  const points = resultats?.points ?? [];
  const dernier = points.at(-1);
  const isOpenData = resultats?.source.type === 'open-data';
  const objectifsAHorizon = objectifs.filter(({ annee }) => annee <= horizon);
  const cible = pickObjectifAHorizon(objectifs, horizon);
  const avancement = computeAvancementObjectif({
    depart: pickDepart(points),
    dernier: pickDernier(points),
    cible,
    anneeCourante: new Date().getFullYear(),
  });

  return (
    <article
      className="flex flex-col gap-3 p-4 bg-white border border-grey-3 rounded-lg"
      data-test="plans.suivi.indicateurs-objectifs.carte"
    >
      <div className="flex items-start gap-2">
        {favori && (
          <Icon
            icon="star-fill"
            size="sm"
            className="mt-0.5 text-warning-1 shrink-0"
            title={appLabels.indicateursObjectifsFavori}
          />
        )}
        <Link
          href={href}
          className="text-sm font-bold text-primary-9 bg-none hover:underline"
          data-test="plans.suivi.indicateurs-objectifs.lien-indicateur"
        >
          {titre}
        </Link>
      </div>

      {dernier && (
        <div className="flex flex-wrap items-baseline gap-x-1.5">
          <span
            className={cn(
              'text-2xl font-bold leading-none',
              isOpenData ? 'text-info-1' : 'text-primary-9'
            )}
          >
            {formatNombre(dernier.valeur)}
          </span>
          <span className="text-sm text-primary-9">{unite}</span>
          <span className="text-sm text-grey-8">
            {appLabels.indicateursObjectifsEnPeriode(
              IndicateurPeriodes.format(
                IndicateurPeriodes.containing(periodicite, dernier.dateValeur)
              )
            )}
          </span>
          {resultats?.source.type === 'open-data' && (
            <InfoTooltip
              label={appLabels.indicateursObjectifsOpenData(
                resultats.source.libelle
              )}
              ariaLabel={appLabels.indicateursObjectifsOpenData(
                resultats.source.libelle
              )}
              iconClassName="text-info-1"
            />
          )}
        </div>
      )}

      {points.length ? (
        <IndicateurObjectifSparkline
          resultats={points}
          objectifs={objectifsAHorizon}
          cible={cible}
          depart={avancement?.depart}
          isOpenData={isOpenData}
          formatValeur={formatNombre}
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 py-6 text-sm text-grey-8 bg-grey-2 rounded">
          <span>{appLabels.indicateursObjectifsAucunResultat}</span>
          {canMutateValeurs && (
            <SaisirLink href={href}>
              {appLabels.indicateursObjectifsSaisirResultat}
            </SaisirLink>
          )}
        </div>
      )}

      {(cible || dernier) && (
        <div className="flex flex-col gap-2 pt-3 mt-auto text-sm border-t border-grey-3">
          {cible ? (
            <>
              <span className="text-primary-9">
                {appLabels.indicateursObjectifsObjectifAnnee(cible.annee)}{' '}
                <b>{formatValeur(cible.valeur)}</b>
                {avancement && avancement.evolutionObjectif !== null && (
                  <span className="block text-xs text-grey-8">
                    {appLabels.indicateursObjectifsEvolutionObjectif(
                      formatEvolution(avancement.evolutionObjectif),
                      avancement.depart.annee
                    )}
                  </span>
                )}
              </span>
              {avancement && (
                <IndicateurObjectifAvancement
                  avancement={avancement}
                  formatValeur={formatValeur}
                />
              )}
            </>
          ) : canMutateValeurs ? (
            <SaisirLink href={href}>
              {appLabels.indicateursObjectifsSaisirObjectif}
            </SaisirLink>
          ) : (
            <span className="text-grey-8">
              {appLabels.indicateursObjectifsSansObjectif(horizon)}
            </span>
          )}
        </div>
      )}
    </article>
  );
};
