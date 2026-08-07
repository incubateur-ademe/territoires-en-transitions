'use client';

import { DemarcheSection } from '@/app/demarches/components/section';
import { DemarchePcaetPublicationStatusEnum } from '@tet/domain/demarches';
import { DemarcheShell } from '@/app/demarches/components/shell';
import { PcaetDocumentsTable } from '@/app/demarches/pcaet/components/pcaet-documents-table';
import { getDemarchePcaetCompletion } from '@/app/demarches/completion';
import { useDemarchePcaet } from '@/app/demarches/pcaet/data/use-demarche';
import { useDemarcheId } from '@/app/demarches/use-demarche-id';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { appLabels } from '@/app/labels/catalog';
import { notFound } from 'next/navigation';

export const DemarchePcaetDocumentsPage = () => {
  const demarcheId = useDemarcheId();
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
    <DemarcheShell
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
      <DemarcheSection
        title={appLabels.demarcheDetailDocumentsTitre}
        description={appLabels.demarcheDetailDocumentsDescription}
        className="gap-2"
      >
        <PcaetDocumentsTable
          value={demarche.documents}
          isReadonly={isPublished}
          onChange={(documents) => update({ documents })}
        />
      </DemarcheSection>
    </DemarcheShell>
  );
};
