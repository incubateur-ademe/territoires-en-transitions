import { useCollectiviteId } from '@/api/collectivites';
import { ENV } from '@/api/environmentVariables';
import { Fiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-get-fiche';
import { isFicheSharedWithCollectivite } from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';
import { CollectiviteAccess } from '@/domain/users';
import { AppEnvironment } from '@/domain/utils';
import { Tab, Tabs } from '@/ui';
import { ServicesWidget } from '@betagouv/les-communs-widget';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import ActionsLieesTab from './ActionsLiees/ActionsLieesTab';
import BudgetTab from './Budget/BudgetTab';
import FichesLieesTab from './FichesLiees/FichesLieesTab';
import IndicateursTab from './Indicateurs/IndicateursTab';
import NotesDeSuiviTab from './NotesDeSuivi/NotesDeSuiviTab';
import NotesEtDocumentsTab from './NotesEtDocuments/NotesEtDocumentsTab';
import Etapes from './etapes';

type FicheActionOngletsProps = {
  fiche: Fiche;
  isEditLoading: boolean;
  isReadonly: boolean;
  className?: string;
  collectivite: CollectiviteAccess;
};

const FicheActionOnglets = ({
  fiche,
  isEditLoading,
  isReadonly,
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

  return (
    <Tabs
      className={className}
      tabsListClassName="!justify-start pl-0 flex-nowrap overflow-x-scroll"
    >
      {/* Indicateurs de suivi */}
      {hasPermission(collectivite.permissions, 'indicateurs.read') ? (
        <Tab label="Indicateurs de suivi">
          <IndicateursTab
            isReadonly={cannotBeModifiedBecauseFicheIsShared || isReadonly}
            fiche={fiche}
          />
        </Tab>
      ) : undefined}

      {/* Étapes */}
      <Tab label="Étapes">
        <Etapes isReadonly={isReadonly} fiche={fiche} />
      </Tab>

      {/* Notes de suivi */}
      <Tab label="Notes de suivi">
        <NotesDeSuiviTab isReadonly={isReadonly} fiche={fiche} />
      </Tab>

      {/* Budget */}
      <Tab label="Budget">
        <BudgetTab isReadonly={isReadonly} fiche={fiche} />
      </Tab>

      {/* Fiches action liées */}
      {hasPermission(collectivite.permissions, 'plans.fiches.read') ? (
        <Tab label="Fiches action">
          <FichesLieesTab
            isReadonly={cannotBeModifiedBecauseFicheIsShared || isReadonly}
            collectivite={collectivite}
            isEditLoading={isEditLoading}
            fiche={fiche}
          />
        </Tab>
      ) : undefined}

      {/* Mesures des référentiels liées */}
      {hasPermission(collectivite.permissions, 'referentiels.read') ? (
        <Tab label="Mesures des référentiels">
          <ActionsLieesTab
            isReadonly={cannotBeModifiedBecauseFicheIsShared || isReadonly}
            isEditLoading={isEditLoading}
            fiche={fiche}
          />
        </Tab>
      ) : undefined}

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
