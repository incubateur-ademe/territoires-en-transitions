'use client';

import { DemarchePcaetSection } from '@/app/demarches/pcaet/components/demarche-pcaet-section';
import { DemarchePcaetPublicationStatusEnum } from '@tet/domain/demarches';
import { PcaetDemarcheShell } from '@/app/demarches/pcaet/components/pcaet-demarche.shell';
import { PcaetDocumentsTable } from '@/app/demarches/pcaet/components/pcaet-documents-table';
import { getDemarchePcaetCompletion } from '@/app/demarches/pcaet/demarche-pcaet-completion';
import { useDemarchePcaet } from '@/app/demarches/pcaet/data/use-demarche-pcaet';
import { useDemarchePcaetId } from '@/app/demarches/pcaet/use-demarche-pcaet-id';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { appLabels } from '@/app/labels/catalog';
import { notFound } from 'next/navigation';

export const DemarchePcaetDocumentsPage = () => {
  const demarcheId = useDemarchePcaetId();
  const {
    demarche,
    isLoading,
    update,
    applyTransition,
    publish,
    unpublish,
    collectiviteId,
  } = useDemarchePcaet(demarcheId);

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
  const completion = getDemarchePcaetCompletion(demarche);

  return (
    <PcaetDemarcheShell
      demarche={demarche}
      collectiviteId={collectiviteId}
      completion={completion}
      activeSection="documents"
      onUpdate={update}
      onTransmettre={() => applyTransition('transmettre_pour_avis')}
      onReprendre={() => applyTransition('reprendre_elaboration')}
      onPublish={publish}
      onUnpublish={unpublish}
    >
      <DemarchePcaetSection
        title={appLabels.demarchePcaetDetailDocumentsTitre}
        description={appLabels.demarchePcaetDetailDocumentsDescription}
        className="gap-2"
      >
        <PcaetDocumentsTable
          value={demarche.documents}
          isReadonly={isPublished}
          onChange={(documents) => update({ documents })}
        />
      </DemarchePcaetSection>
    </PcaetDemarcheShell>
  );
};
