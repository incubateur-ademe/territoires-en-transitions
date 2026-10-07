'use client';

import type {
  DemarchePcaetTransitionEvaluations,
  DemarcheType,
} from '@tet/domain/demarches';
import type { DemarchePcaetCompletion } from '../completion';
import type { DemarcheSectionKey } from '../steps';
import type { DemarchePcaet } from '../types';
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
  isPublished?: boolean;
  onPublish?: () => void;
  /** Le dossier a été transmis pour avis hors de la plateforme. */
  horsPlateforme?: boolean;
  isPreview?: boolean;
};

/**
 * Contenu du panneau latéral global pour l’avancée d’une démarche
 * (stepper, alertes).
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
  isPublished = false,
  onPublish,
  horsPlateforme = false,
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
      isPublished={isPublished}
      onPublish={onPublish}
      horsPlateforme={horsPlateforme}
      isPreview={isPreview}
    />
  </div>
);
