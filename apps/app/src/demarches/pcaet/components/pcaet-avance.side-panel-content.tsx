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
  demarcheId?: string;
  statut: DemarchePcaet['statut'];
  completion: DemarchePcaetCompletion;
  activeSection?: DemarchePcaetSectionKey | null;
  dateTransmis?: string | null;
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
  demarcheId = '',
  statut,
  completion,
  activeSection = null,
  dateTransmis,
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
      dateTransmis={dateTransmis}
      isPublished={isPublished}
      canPublish={canPublish}
      onPublish={onPublish}
      onUnpublish={onUnpublish}
      isPreview={isPreview}
      hideTitle
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
