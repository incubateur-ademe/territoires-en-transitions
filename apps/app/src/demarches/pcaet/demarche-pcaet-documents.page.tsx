'use client';

import { DemarchePcaetSection } from '@/app/demarches/pcaet/components/demarche-pcaet-section';
import { PcaetDemarcheShell } from '@/app/demarches/pcaet/components/pcaet-demarche.shell';
import { PcaetDocumentsTable } from '@/app/demarches/pcaet/components/pcaet-documents-table';
import { getDemarchePcaetCompletion } from '@/app/demarches/pcaet/demarche-pcaet-completion';
import { useDemarchePcaet } from '@/app/demarches/pcaet/use-demarche-pcaet';
import { appLabels } from '@/app/labels/catalog';
import { notFound } from 'next/navigation';

type Props = {
  demarcheId: string;
};

export const DemarchePcaetDocumentsPage = ({ demarcheId }: Props) => {
  const {
    demarche,
    update,
    replaceDemarche,
    publish,
    unpublish,
    collectiviteId,
  } = useDemarchePcaet(demarcheId);

  if (!demarche) {
    notFound();
  }

  const isPublished = demarche.statutPublication === 'publie';
  const completion = getDemarchePcaetCompletion(demarche);

  return (
    <PcaetDemarcheShell
      demarche={demarche}
      collectiviteId={collectiviteId}
      completion={completion}
      activeSection="documents"
      onUpdate={update}
      onDemarcheChange={replaceDemarche}
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
