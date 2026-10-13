'use client';

import { makeRepriseTecUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { Breadcrumbs, EmptyCard, PageHeader } from '@tet/ui';
import { parseAsInteger, useQueryState } from 'nuqs';
import { useGetCollectivite } from '../data/use-get-collectivite';
import { DossierSections } from './dossier-sections';
import { IdCopiable } from './id-copiable';
import { InfosCollectivite } from './infos-collectivite';
import { DossiersOnglets } from './dossiers-onglets';

export const RepriseTecCollectiviteView = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) => {
  const { data, isLoading, error } = useGetCollectivite(collectiviteId);
  const [dossierId, setDossierId] = useQueryState(
    'dossier',
    parseAsInteger.withOptions({ history: 'replace' })
  );

  if (isLoading) {
    return (
      <div className="flex justify-center p-10">
        <SpinnerLoader />
      </div>
    );
  }
  if (!data) {
    return (
      <EmptyCard
        dataTest="admin.reprise-tec.collectivite-erreur"
        title={
          error?.data?.code === 'PRECONDITION_FAILED'
            ? appLabels.repriseTecRecetteNonConstruite
            : appLabels.repriseTecCollectiviteIntrouvable
        }
      />
    );
  }

  const { collectivite, dossiers } = data;
  const actif =
    dossiers.find((d) => d.tecDossierId === dossierId) ??
    dossiers.find((d) => d.demarcheId !== null) ??
    dossiers[0];

  return (
    <div
      className="flex flex-col gap-4"
      data-test="admin.reprise-tec.collectivite"
    >
      <PageHeader className="mb-0">
        <PageHeader.Navigation label={appLabels.repriseTecTerritoire}>
          <Breadcrumbs
            size="sm"
            items={[
              { label: appLabels.repriseTecFrance, href: makeRepriseTecUrl() },
              ...(collectivite.region
                ? [
                    {
                      label: collectivite.region,
                      href: makeRepriseTecUrl({ region: collectivite.region }),
                    },
                  ]
                : []),
              ...(collectivite.departement
                ? [
                    {
                      label: collectivite.departement,
                      href: makeRepriseTecUrl({
                        region: collectivite.region,
                        departement: collectivite.departement,
                      }),
                    },
                  ]
                : []),
              { label: collectivite.nom },
            ]}
          />
        </PageHeader.Navigation>
        <PageHeader.Title>{collectivite.nom}</PageHeader.Title>
        <PageHeader.Subtitle>
          <div className="flex items-center gap-3">
            <IdCopiable
              label={appLabels.repriseTecCollectiviteIdTet}
              value={String(collectivite.id)}
              tooltip={appLabels.repriseTecCopierIdCollectivite}
              dataTest="admin.reprise-tec.id-collectivite"
            />
            <InfosCollectivite collectivite={collectivite} />
          </div>
        </PageHeader.Subtitle>
      </PageHeader>

      {actif ? (
        <>
          <DossiersOnglets
            nom={collectivite.nom}
            collectiviteId={collectivite.id}
            dossiers={dossiers}
            actif={actif}
            onChoisir={setDossierId}
          />
          <DossierSections
            key={actif.tecDossierId}
            collectiviteId={collectivite.id}
            tecDossierId={actif.tecDossierId}
          />
        </>
      ) : (
        <EmptyCard title={appLabels.repriseTecAucunDossier} />
      )}
    </div>
  );
};
