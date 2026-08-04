'use client';

import { appLabels } from '@/app/labels/catalog';
import { Alert, VisibleWhen } from '@tet/ui';
import type { DemarchePcaetCompletion } from '../demarche-pcaet-completion';
import type { DemarchePcaet } from '../demarche-pcaet.types';
import { HistoriqueDemarchesSection } from './historique-demarches-section';
import {
  AvanceDemarcheSection,
  type DemarchePcaetSectionKey,
} from './pcaet-progress.stepper';

export type PcaetAvanceSidePanelContentProps = {
  collectiviteId: number;
  demarcheId?: number;
  statut: DemarchePcaet['statut'];
  completion: DemarchePcaetCompletion;
  activeSection?: DemarchePcaetSectionKey | null;
  avisDeadlineAt?: string | null;
  canTransmettre?: boolean;
  onTransmettre?: () => void;
  canReprendre?: boolean;
  onReprendre?: () => void;
  isPublished?: boolean;
  canPublish?: boolean;
  onPublish?: () => void;
  onUnpublish?: () => void;
  isPreview?: boolean;
};

/**
 * Contenu du panneau latéral global pour l’avancée de la démarche PCAET
 * (stepper, historique, alertes).
 */
export const PcaetAvanceSidePanelContent = ({
  collectiviteId,
  demarcheId = 0,
  statut,
  completion,
  activeSection = null,
  avisDeadlineAt,
  canTransmettre,
  onTransmettre,
  canReprendre,
  onReprendre,
  isPublished = false,
  canPublish,
  onPublish,
  onUnpublish,
  isPreview = false,
}: PcaetAvanceSidePanelContentProps) => (
  <div className="flex flex-col gap-4 p-4">
    <AvanceDemarcheSection
      collectiviteId={collectiviteId}
      demarcheId={demarcheId}
      statut={statut}
      completion={completion}
      activeSection={activeSection}
      avisDeadlineAt={avisDeadlineAt}
      canTransmettre={canTransmettre}
      onTransmettre={onTransmettre}
      canReprendre={canReprendre}
      onReprendre={onReprendre}
      isPublished={isPublished}
      canPublish={canPublish}
      onPublish={onPublish}
      onUnpublish={onUnpublish}
      isPreview={isPreview}
    />

    <HistoriqueDemarchesSection currentDemarcheId={demarcheId} />

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
      description={appLabels.demarchePcaetDetailVersionProvisoireDescription}
    />
  </div>
);
