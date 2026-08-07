'use client';

import { makeCollectiviteDemarchePcaetRootUrl } from '@/app/app/paths';
import { DemarchePcaetPublicationStatusEnum } from '@tet/domain/demarches';
import { VulnerabiliteTable } from '@/app/demarches/pcaet/diagnostic/vulnerabilite-table';
import { isVulnerabiliteComplete } from '@/app/demarches/completion';
import { useDemarchePcaet } from '@/app/demarches/pcaet/data/use-demarche';
import { useDemarcheId } from '@/app/demarches/use-demarche-id';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { appLabels } from '@/app/labels/catalog';
import { Breadcrumbs, Divider } from '@tet/ui';
import { notFound } from 'next/navigation';

export const VulnerabiliteTerritoirePage = () => {
  const demarcheId = useDemarcheId();
  const { demarche, isLoading, update, collectiviteId } =
    useDemarchePcaet(demarcheId);

  if (isLoading) {
    return (
      <div className="flex grow items-center justify-center">
        <SpinnerLoader />
      </div>
    );
  }

  if (!demarche) {
    notFound();
  }

  const isPublished =
    demarche.statutPublication === DemarchePcaetPublicationStatusEnum.PUBLISHED;

  const handleVulnerabiliteChange = (
    vulnerabilite: typeof demarche.vulnerabilite
  ) => {
    const complete = isVulnerabiliteComplete(vulnerabilite);
    update({
      vulnerabilite,
      vulnerabiliteValideeLe: complete ? new Date().toISOString() : null,
    });
  };

  return (
    <div
      className="flex flex-col gap-4 pb-12"
      data-test="VulnerabiliteTerritoirePage"
    >
      <div className="w-full">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h1 className="text-primary-9 mb-0">
            {appLabels.demarcheVulnerabiliteTitre}
          </h1>
        </div>

        <Breadcrumbs
          items={[
            {
              label: demarche.titre,
              href: makeCollectiviteDemarchePcaetRootUrl({
                collectiviteId,
                demarcheId: demarche.id,
              }),
            },
            { label: appLabels.demarcheVulnerabiliteTitre },
          ]}
        />

        <Divider color="primary" className="my-3" />
      </div>

      <p className="text-sm text-primary-9 m-0">
        {appLabels.demarcheVulnerabiliteDescription}
      </p>

      <div className="max-xl:overflow-x-auto p-4 pt-2 lg:p-8 lg:pt-4 bg-white rounded-xl border border-grey-3">
        <VulnerabiliteTable
          value={demarche.vulnerabilite}
          isReadonly={isPublished}
          onChange={handleVulnerabiliteChange}
        />
      </div>
    </div>
  );
};
