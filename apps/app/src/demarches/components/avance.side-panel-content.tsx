'use client';

import { appLabels } from '@/app/labels/catalog';
import type {
  DemarcheType,
  DemarchePcaetTransitionEvaluations,
} from '@tet/domain/demarches';
import { Alert, VisibleWhen } from '@tet/ui';
import type { DemarchePcaetCompletion } from '../completion';
import type { DemarchePcaet } from '../types';
import type { DemarcheSectionKey } from '../steps';
import { HistoriqueDemarchesSection } from './historique.section';
import { AvanceDemarcheSection } from './progress.stepper';

export type DemarcheAvanceSidePanelContentProps = {
  /** Type de démarche : les libellés affichés en dépendent. */
  demarcheType: DemarcheType;
  collectiviteId: number;
  demarcheId?: number;
  statut: DemarchePcaet['statut'];
  completion: DemarchePcaetCompletion;
  activeSection?: DemarcheSectionKey | null;
  avisDeadlineAt?: string | null;
  /** État serveur des transitions (absent en preview). */
  transitions?: DemarchePcaetTransitionEvaluations;
  onTransmettre?: () => void;
  onReprendre?: () => void;
  isPublished?: boolean;
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
  transitions,
  onTransmettre,
  onReprendre,
  isPublished = false,
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
      transitions={transitions}
      onTransmettre={onTransmettre}
      onReprendre={onReprendre}
      isPublished={isPublished}
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
