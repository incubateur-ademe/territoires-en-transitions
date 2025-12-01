import { isFicheSharedWithCollectivite } from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import { MoyensView } from '@/app/plans/fiches/update-fiche/moyens/moyens.view';
import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';
import { ENV } from '@tet/api/environmentVariables';

import { ServicesWidget } from '@betagouv/les-communs-widget';
import { CollectiviteAccess } from '@tet/domain/users';
import { AppEnvironment } from '@tet/domain/utils';
import { Tab, Tabs } from '@tet/ui';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import FichesLieesTab from './FichesLiees/FichesLieesTab';
import IndicateursTab from './Indicateurs/IndicateursTab';
import NotesDeSuiviTab from './NotesDeSuivi/NotesDeSuiviTab';
import NotesEtDocumentsTab from './NotesEtDocuments/NotesEtDocumentsTab';
import { Fiche } from './data/use-get-fiche';
import Etapes from './etapes';
import { MesuresLieesView } from './mesures-liees/mesures-liees.view';

type TabDescriptor = {
  label: string;
  isVisible: boolean;
  render: () => React.ReactNode;
};

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
  const { collectiviteId, permissions, niveauAcces } = collectivite;
  const widgetCommunsFlagEnabled = useFeatureFlagEnabled(
    'is-widget-communs-enabled'
  );

  const cannotBeModifiedBecauseFicheIsShared = isFicheSharedWithCollectivite(
    fiche,
    collectiviteId
  );

  const tabDescriptors: TabDescriptor[] = [
    {
      label: 'Indicateurs de suivi',
      isVisible:
        hasPermission(permissions, 'indicateurs.definitions.read') ||
        (!niveauAcces &&
          hasPermission(permissions, 'indicateurs.definitions.read_public')),
      render: () => (
        <IndicateursTab
          isReadonly={cannotBeModifiedBecauseFicheIsShared || isReadonly}
          fiche={fiche}
        />
      ),
    },
    {
      label: 'Étapes',
      isVisible: true,
      render: () => <Etapes isReadonly={isReadonly} fiche={fiche} />,
    },
    {
      label: 'Notes de suivi',
      isVisible: true,
      render: () => <NotesDeSuiviTab isReadonly={isReadonly} fiche={fiche} />,
    },
    {
      label: 'Moyens',
      isVisible: true,
      render: () => <MoyensView isReadonly={isReadonly} fiche={fiche} />,
    },
    {
      label: 'Fiches action liées',
      isVisible:
        hasPermission(permissions, 'plans.fiches.read') ||
        (!niveauAcces &&
          hasPermission(permissions, 'plans.fiches.read_public')),
      render: () => (
        <FichesLieesTab
          isReadonly={cannotBeModifiedBecauseFicheIsShared || isReadonly}
          collectivite={collectivite}
          isEditLoading={isEditLoading}
          fiche={fiche}
        />
      ),
    },
    {
      label: 'Mesures des référentiels liées',
      isVisible:
        hasPermission(permissions, 'referentiels.read') ||
        (!niveauAcces &&
          hasPermission(permissions, 'referentiels.read_public')),
      render: () => (
        <MesuresLieesView
          isReadonly={cannotBeModifiedBecauseFicheIsShared || isReadonly}
          isEditLoading={isEditLoading}
          fiche={fiche}
        />
      ),
    },
    {
      label: 'Notes et documents',
      isVisible: true,
      render: () => (
        <NotesEtDocumentsTab isReadonly={isReadonly} fiche={fiche} />
      ),
    },
    {
      label: 'Services liés',
      isVisible: widgetCommunsFlagEnabled ?? false,
      render: () => (
        <ServicesWidget
          projectId={fiche.id.toString()}
          isStagingEnv={ENV.application_env === AppEnvironment.STAGING}
          idType={'tetId'}
        />
      ),
    },
  ];

  const visibleTabElements = tabDescriptors
    .filter((tab) => tab.isVisible)
    .map((tab) => (
      <Tab key={tab.label} label={tab.label}>
        {tab.render()}
      </Tab>
    ));

  return (
    <Tabs
      className={className}
      tabsListClassName="!justify-start pl-0 flex-nowrap overflow-x-scroll"
    >
      {visibleTabElements}
    </Tabs>
  );
};

export default FicheActionOnglets;
