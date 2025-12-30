import { useState } from 'react';

import {
  makeCollectiviteIndicateursListUrl,
  makeCollectivitePlansActionsListUrl,
  makeCollectivitePlansActionsNouveauUrl,
  makeCollectiviteToutesLesFichesUrl,
} from '@/app/app/paths';
import { NIVEAUX } from '@/app/referentiels/tableau-de-bord/labellisation/LabellisationInfo';
import {
  GreyStar,
  RedStar,
} from '@/app/referentiels/tableau-de-bord/labellisation/Star';
import { MetricCard } from '@/app/tableaux-de-bord/metrics/metric.card';
import { MetricCardSkeleton } from '@/app/tableaux-de-bord/metrics/metric.card-skeleton';
import { useCurrentCollectivite } from '@tet/api/collectivites';

import ModaleCreerIndicateur from '@/app/app/pages/collectivite/PlansActions/FicheAction/Indicateurs/ModaleCreerIndicateur';
import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';
import { useTdbCollectiviteFetchMetrics } from '../_hooks/use-tdb-collectivite-fetch-metrics';

const Metrics = () => {
  const collectivite = useCurrentCollectivite();
  const { collectiviteId, isReadOnly, permissions } = collectivite;

  const { data: metrics, isLoading } = useTdbCollectiviteFetchMetrics();

  const etoilesCaeCount = metrics?.labellisations.cae?.etoiles || 0;
  const etoilesEciCount = metrics?.labellisations.eci?.etoiles || 0;
  const plansCount = metrics?.plans.count || 0;
  const fichesCount = metrics?.plans.fiches || 0;
  const indicateursFavorisCount = metrics?.indicateurs.favoris || 0;
  const indicateursPersonnalisesCount = metrics?.indicateurs.personnalises || 0;

  const [isNewIndicateurOpen, setIsNewIndicateurOpen] = useState(false);

  return (
    <div className="grid sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
      {isLoading ? (
        [1, 2, 3, 4, 5, 6].map((i) => <MetricCardSkeleton key={i} />)
      ) : (
        <>
          <MetricCard
            title="Climat Air Énergie"
            count={etoilesCaeCount}
            countLabel={`Étoile${etoilesCaeCount > 1 ? 's' : ''}`}
            additionalContent={
              <div className="flex gap-2 mt-2">
                {NIVEAUX.map((niveau) => {
                  const obtenue = etoilesCaeCount >= niveau;
                  const Star = obtenue ? RedStar : GreyStar;
                  return <Star key={niveau} className="!w-5 !h-5" />;
                })}
              </div>
            }
          />
          <MetricCard
            title="Économie Circulaire"
            count={etoilesEciCount}
            countLabel={`Étoile${etoilesEciCount > 1 ? 's' : ''}`}
            additionalContent={
              <div className="flex gap-2 mt-2">
                {NIVEAUX.map((niveau) => {
                  const obtenue = etoilesEciCount >= niveau;
                  const Star = obtenue ? RedStar : GreyStar;
                  return <Star key={niveau} className="!w-5 !h-5" />;
                })}
              </div>
            }
          />
          <MetricCard
            title={`Plan${plansCount > 1 ? 's' : ''}`}
            count={plansCount}
            link={
              plansCount > 0
                ? {
                    href: makeCollectivitePlansActionsListUrl({
                      collectiviteId,
                    }),
                    children: 'Voir tous les plans',
                  }
                : isReadOnly
                ? undefined
                : {
                    href: makeCollectivitePlansActionsNouveauUrl({
                      collectiviteId,
                    }),
                    children: 'Créer un plan',
                  }
            }
          />
          <MetricCard
            title={`Action${fichesCount > 1 ? 's' : ''}`}
            count={fichesCount}
            link={
              fichesCount > 0
                ? {
                    href: makeCollectiviteToutesLesFichesUrl({
                      collectiviteId,
                    }),
                    children: 'Voir les actions',
                  }
                : undefined
            }
          />
          <MetricCard
            title={`Indicateur${indicateursFavorisCount > 1 ? 's' : ''} favori${
              indicateursFavorisCount > 1 ? 's' : ''
            }`}
            count={indicateursFavorisCount}
            link={
              indicateursFavorisCount > 0
                ? {
                    href: makeCollectiviteIndicateursListUrl({
                      collectiviteId,
                      listId: 'collectivite',
                    }),
                    children: 'Voir les indicateurs',
                  }
                : undefined
            }
          />
          <MetricCard
            title={`Indicateur${
              indicateursPersonnalisesCount > 1 ? 's' : ''
            } personnalisé${indicateursPersonnalisesCount > 1 ? 's' : ''}`}
            count={indicateursPersonnalisesCount}
            link={
              indicateursPersonnalisesCount > 0
                ? {
                    href: makeCollectiviteIndicateursListUrl({
                      collectiviteId,
                      listId: 'perso',
                    }),
                    children: 'Voir les indicateurs',
                  }
                : isReadOnly ||
                  !hasPermission(permissions, 'indicateurs.indicateurs.create')
                ? undefined
                : {
                    onClick: () => setIsNewIndicateurOpen(true),
                    children: 'Créer un indicateur personnalisé',
                  }
            }
          />
          {!isReadOnly && isNewIndicateurOpen && (
            <ModaleCreerIndicateur
              isOpen={isNewIndicateurOpen}
              setIsOpen={setIsNewIndicateurOpen}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Metrics;
