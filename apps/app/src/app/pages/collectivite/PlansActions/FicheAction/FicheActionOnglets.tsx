import { useCollectiviteId } from '@/api/collectivites';
import { CollectiviteAccess } from '@/domain/users';
import { ENV } from '@/api/environmentVariables';
import { isFicheSharedWithCollectivite } from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import { MoyensView } from '@/app/plans/fiches/update-fiche/moyens/moyens.view';
import { FicheWithRelations } from '@/domain/plans';
import { AppEnvironment } from '@/domain/utils';
import { Tab, Tabs } from '@/ui';
import { ServicesWidget } from '@betagouv/les-communs-widget';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import ActionsLieesTab from './ActionsLiees/ActionsLieesTab';
import FichesLieesTab from './FichesLiees/FichesLieesTab';
import IndicateursTab from './Indicateurs/IndicateursTab';
import NotesDeSuiviTab from './NotesDeSuivi/NotesDeSuiviTab';
import NotesEtDocumentsTab from './NotesEtDocuments/NotesEtDocumentsTab';
import Etapes from './etapes';

type FicheActionOngletsProps = {
  fiche: FicheWithRelations;
  isEditLoading: boolean;
  className?: string;
  collectivite: CollectiviteAccess;
};

const FicheActionOnglets = ({
  fiche,
  isEditLoading,
  className,
  collectivite,
}: FicheActionOngletsProps) => {
  const collectiviteId = useCollectiviteId();
  const widgetCommunsFlagEnabled = useFeatureFlagEnabled(
    'is-widget-communs-enabled'
  );

  const cannotBeModifiedBecauseFicheIsShared = isFicheSharedWithCollectivite(
    fiche,
    collectiviteId
  );
  const isReadonly = collectivite.isReadOnly;
  return (
    <Tabs
      className={className}
      tabsListClassName="!justify-start pl-0 flex-nowrap overflow-x-scroll"
    >
      {/* Indicateurs de suivi */}
      <Tab label="Indicateurs de suivi">
        <IndicateursTab
          isReadonly={cannotBeModifiedBecauseFicheIsShared || isReadonly}
          fiche={fiche}
        />
      </Tab>

      {/* Étapes */}
      <Tab label="Étapes">
        <Etapes isReadonly={isReadonly} fiche={fiche} />
      </Tab>

      {/* Notes de suivi */}
      <Tab label="Notes de suivi">
        <NotesDeSuiviTab isReadonly={isReadonly} fiche={fiche} />
      </Tab>

      <Tab label="Moyens">
        <MoyensView isReadonly={isReadonly} fiche={fiche} />
      </Tab>

      {/* Fiches action liées */}
      <Tab label="Fiches action">
        <FichesLieesTab
          isReadonly={cannotBeModifiedBecauseFicheIsShared || isReadonly}
          collectivite={collectivite}
          isEditLoading={isEditLoading}
          fiche={fiche}
        />
      </Tab>

      {/* Mesures des référentiels liées */}
      <Tab label="Mesures des référentiels">
        <ActionsLieesTab
          isReadonly={cannotBeModifiedBecauseFicheIsShared || isReadonly}
          isEditLoading={isEditLoading}
          fiche={fiche}
        />
      </Tab>

      {/* Notes et documents */}
      <Tab label="Notes et documents ">
        <NotesEtDocumentsTab isReadonly={isReadonly} fiche={fiche} />
      </Tab>

      {widgetCommunsFlagEnabled ? (
        <Tab label="Services liés">
          <ServicesWidget
            projectId={fiche.id.toString()}
            isStagingEnv={ENV.application_env === AppEnvironment.STAGING}
            idType={'tetId'}
          />
        </Tab>
      ) : undefined}
    </Tabs>
  );
};

export default FicheActionOnglets;
