'use client';

import { appLabels } from '@/app/labels/catalog';
import type { DemarcheType } from '@tet/domain/demarches';
import { Alert, VisibleWhen } from '@tet/ui';
import type { DemarchePcaetCompletion } from '../completion';
import type { DemarchePcaet } from '../types';
import { HistoriqueDemarchesSection } from './historique.section';
import {
  AvanceDemarcheSection,
  type DemarcheSectionKey,
} from './progress.stepper';

export type DemarcheAvanceSidePanelContentProps = {
  /** Type de démarche : les libellés affichés en dépendent. */
  demarcheType: DemarcheType;
  collectiviteId: number;
  demarcheId?: number;
  statut: DemarchePcaet['statut'];
  completion: DemarchePcaetCompletion;
  activeSection?: DemarcheSectionKey | null;
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
 * Contenu du panneau latéral global pour l’avancée d’une démarche
 * (stepper, historique, alertes).
 */
export const DemarcheAvanceSidePanelContent = ({
  demarcheType,
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
}: DemarcheAvanceSidePanelContentProps) => (
  <div className="flex flex-col gap-4 p-4">
    <AvanceDemarcheSection
      demarcheType={demarcheType}
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
        title={appLabels.demarcheDetailPublieeTitre}
        description={appLabels.demarcheDetailPublieeDescription}
      />
    </VisibleWhen>

    <Alert
      state="info"
      title={appLabels.demarcheDetailVersionProvisoireTitre}
      description={appLabels.demarcheDetailVersionProvisoireDescription}
    />
  </div>
);
