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
import HeaderSticky, {
  StickyHeaderHeightProvider,
  useStickyHeaderHeight,
} from '@/app/ui/layout/HeaderSticky';
import { Alert, VisibleWhen } from '@tet/ui';
import { notFound } from 'next/navigation';
import { ComponentProps, useEffect, useRef, useState } from 'react';

/** Wrapper qui positionne AvanceDemarcheSection en sticky sous le header collant. */
const StickyAvanceDemarche = (
  props: ComponentProps<typeof AvanceDemarcheSection>
) => {
  const headerHeight = useStickyHeaderHeight();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isFloating, setIsFloating] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsFloating(!entry.isIntersecting),
      { threshold: 0, rootMargin: `-${headerHeight + 16}px 0px 0px 0px` }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [headerHeight]);

  return (
    <>
      <div ref={sentinelRef} aria-hidden className="h-px -mb-px" />
      <div
        className={[
          'sticky transition-shadow duration-200 rounded-xl',
          isFloating ? 'shadow-md' : '',
        ].join(' ')}
        style={{ top: headerHeight + 16 }}
      >
        <AvanceDemarcheSection {...props} />
      </div>
    </>
  );
};

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
    <StickyHeaderHeightProvider>
      <PcaetDetailLayout.Root>
        <PcaetDetailLayout.Header>
          <HeaderSticky
            render={({ isSticky }) => (
              <DemarchePcaetHeader
                demarche={demarche}
                collectiviteId={collectiviteId}
                compact={isSticky}
                onDemarcheChange={replaceDemarche}
                onUpdate={update}
              />
            )}
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
            <StickyAvanceDemarche
              collectiviteId={collectiviteId}
              statut={demarche.statut}
              dateTransmis={demarche.dateModification}
              isPublished={isPublished}
              canPublish={completion.canPublish}
              onPublish={publish}
              onUnpublish={unpublish}
            />

            <ContactsSection />

            <HistoriqueDemarchesSection currentDemarcheId={demarche.id} />

            <VisibleWhen condition={isPublished}>
              <Alert
                state="success"
                title={appLabels.demarchePcaetDetailPublieeTitre}
                description={appLabels.demarchePcaetDetailPublieeDescription}
              />
            </VisibleWhen>

            <Alert
              state="info"
              title={appLabels.demarchePcaetDetailVersionProvisoireTitre}
              description={
                appLabels.demarchePcaetDetailVersionProvisoireDescription
              }
            />
          </PcaetDetailLayout.SideBar>
        </PcaetDetailLayout.Container>
      </PcaetDetailLayout.Root>
    </StickyHeaderHeightProvider>
  );
};
