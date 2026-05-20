'use client';

import { appLabels } from '@/app/labels/catalog';
import { Alert, VisibleWhen } from '@tet/ui';
import { PropsWithChildren } from 'react';
import type { DemarchePcaetCompletion } from '../demarche-pcaet-completion';
import type { DemarchePcaetUpdatePatch } from '../demarche-pcaet.storage';
import type { DemarchePcaet } from '../demarche-pcaet.types';
import { DrealContextBanner } from '../vue-dreal/components/dreal-context-banner';
import { DemarchePcaetHeader } from './header';
import { HistoriqueDemarchesSection } from './historique-demarches-section';
import { PcaetDetailLayout } from './pcaet-detail-layout';
import {
  AvanceDemarcheSection,
  type DemarchePcaetSectionKey,
} from './pcaet-progress.stepper';

type Props = PropsWithChildren<{
  demarche: DemarchePcaet;
  collectiviteId: number;
  completion: DemarchePcaetCompletion;
  activeSection: DemarchePcaetSectionKey;
  onUpdate: (patch: DemarchePcaetUpdatePatch) => void;
  onDemarcheChange: (demarche: DemarchePcaet) => void;
  onPublish: () => void;
  onUnpublish: () => void;
}>;

/**
 * Coquille commune aux pages de sections de la démarche PCAET (documents,
 * diagnostic, plan d'actions) : en-tête, colonne principale et barre latérale
 * avec le stepper « Les étapes de votre démarche ».
 */
export const PcaetDemarcheShell = ({
  demarche,
  collectiviteId,
  completion,
  activeSection,
  onUpdate,
  onDemarcheChange,
  onPublish,
  onUnpublish,
  children,
}: Props) => {
  const isPublished = demarche.statutPublication === 'publie';

  return (
    <PcaetDetailLayout.Root>
      <DrealContextBanner />
      <PcaetDetailLayout.Header>
        <DemarchePcaetHeader
          demarche={demarche}
          collectiviteId={collectiviteId}
          onDemarcheChange={onDemarcheChange}
          onUpdate={onUpdate}
        />
      </PcaetDetailLayout.Header>

      <PcaetDetailLayout.Container>
        <PcaetDetailLayout.Main>{children}</PcaetDetailLayout.Main>

        <PcaetDetailLayout.SideBar>
          <AvanceDemarcheSection
            collectiviteId={collectiviteId}
            demarcheId={demarche.id}
            statut={demarche.statut}
            completion={completion}
            activeSection={activeSection}
            dateTransmis={demarche.dateModification}
            isPublished={isPublished}
            canPublish={completion.canPublish}
            onPublish={onPublish}
            onUnpublish={onUnpublish}
          />

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
  );
};
