'use client';

import { AvanceDemarcheSection } from '@/app/demarches/pcaet/components/avance-demarche-section';
import { ContactsSection } from '@/app/demarches/pcaet/components/contacts-section';
import { DemarcheDescriptionField } from '@/app/demarches/pcaet/components/demarche-description-field';
import { DemarchePcaetSection } from '@/app/demarches/pcaet/components/demarche-pcaet-section';
import { DiagnosticVoletsSection } from '@/app/demarches/pcaet/components/diagnostic-volets-section';
import { DemarchePcaetHeader } from '@/app/demarches/pcaet/components/header';
import { HistoriqueDemarchesSection } from '@/app/demarches/pcaet/components/historique-demarches-section';
import { PcaetDetailLayout } from '@/app/demarches/pcaet/components/pcaet-detail-layout';
import { PcaetDocumentsTable } from '@/app/demarches/pcaet/components/pcaet-documents-table';
import { ProgrammeActionsSection } from '@/app/demarches/pcaet/components/programme-actions-section';
import { getDemarchePcaetCompletion } from '@/app/demarches/pcaet/demarche-pcaet-completion';
import { useDemarchePcaet } from '@/app/demarches/pcaet/use-demarche-pcaet';
import { appLabels } from '@/app/labels/catalog';
import { Alert, VisibleWhen } from '@tet/ui';
import { notFound } from 'next/navigation';

type Props = {
  demarcheId: string;
};

export const DemarchePcaetDetailPage = ({ demarcheId }: Props) => {
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
    <PcaetDetailLayout.Root>
      <PcaetDetailLayout.Header>
        <DemarchePcaetHeader
          demarche={demarche}
          collectiviteId={collectiviteId}
          onDemarcheChange={replaceDemarche}
          onUpdate={update}
        />
      </PcaetDetailLayout.Header>

      <PcaetDetailLayout.Container>
        <PcaetDetailLayout.Main>
          <DemarchePcaetSection
            title={appLabels.demarchePcaetDetailDescriptionTitre}
            status={completion.description}
            showIcon={false}
          >
            <DemarcheDescriptionField
              value={demarche.description}
              isReadonly={isPublished}
              onChange={(description) => update({ description })}
            />
          </DemarchePcaetSection>

          <DiagnosticVoletsSection
            collectiviteId={collectiviteId}
            demarche={demarche}
            isReadonly={isPublished}
            onDocumentsChange={(documents) => update({ documents })}
            status={completion.diagnostic}
          />

          <ProgrammeActionsSection
            demarche={demarche}
            onUpdateAction={update}
            status={completion.plan}
          />

          <DemarchePcaetSection
            title={appLabels.demarchePcaetDetailDocumentsTitre}
            description={appLabels.demarchePcaetDetailDocumentsDescription}
            status={completion.documents}
            className="gap-2"
          >
            <PcaetDocumentsTable
              value={demarche.documents}
              isReadonly={isPublished}
              onChange={(documents) => update({ documents })}
            />
          </DemarchePcaetSection>
        </PcaetDetailLayout.Main>

        <PcaetDetailLayout.SideBar>
          <Alert
            state="info"
            title={appLabels.demarchePcaetDetailVersionProvisoireTitre}
            description={appLabels.demarchePcaetDetailVersionProvisoireDescription}
          />

          <ContactsSection
            contacts={demarche.contacts}
            isReadonly={isPublished}
            onChange={(contacts) => update({ contacts })}
          />

          <AvanceDemarcheSection
            collectiviteId={collectiviteId}
            statut={demarche.statut}
            isPublished={isPublished}
            canPublish={completion.canPublish}
            onPublish={publish}
            onUnpublish={unpublish}
          />

          <HistoriqueDemarchesSection currentDemarcheId={demarche.id} />

          <VisibleWhen condition={isPublished}>
            <Alert
              state="success"
              title={appLabels.demarchePcaetDetailPublieeTitre}
              description={appLabels.demarchePcaetDetailPublieeDescription}
            />
          </VisibleWhen>
        </PcaetDetailLayout.SideBar>
      </PcaetDetailLayout.Container>
    </PcaetDetailLayout.Root>
  );
};
