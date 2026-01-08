import { useListFiches } from '@/app/plans/fiches/list-all-fiches/data/use-list-fiches';
import { isFicheSharedWithCollectivite } from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';
import { ENV } from '@tet/api/environmentVariables';

import { SousActionTable } from '@/app/plans/sous-actions/list/table/sous-action.table';
import { ServicesWidget } from '@betagouv/les-communs-widget';
import { FicheWithRelations } from '@tet/domain/plans';
import { CollectiviteAccess } from '@tet/domain/users';
import { AppEnvironment } from '@tet/domain/utils';
import { Tab, Tabs } from '@tet/ui';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { DocumentsView } from './Documents/documents.view';
import FichesLieesTab from './FichesLiees/FichesLieesTab';
import IndicateursTab from './Indicateurs/IndicateursTab';
import { MesuresLieesView } from './mesures-liees/mesures-liees.view';
import { MoyensView } from './moyens/moyens.view';
import { NotesView } from './notes/notes.view';

type TabDescriptor = {
  label: string;
  isVisible: boolean;
  render: () => React.ReactNode;
};

type FicheActionOngletsProps = {
  fiche: FicheWithRelations;
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

  const { count: countSousActions } = useListFiches(
    collectivite.collectiviteId,
    { filters: { parentsId: [fiche.id] }, queryOptions: { limit: 1, page: 1 } }
  );

  const tabDescriptors: TabDescriptor[] = [
    {
      label: 'Indicateurs de suivi',
      isVisible:
        hasPermission(permissions, 'indicateurs.indicateurs.read') ||
        (!niveauAcces &&
          hasPermission(permissions, 'indicateurs.indicateurs.read_public')),
      render: () => (
        <IndicateursTab
          isReadonly={cannotBeModifiedBecauseFicheIsShared || isReadonly}
          fiche={fiche}
        />
      ),
    },
    {
      label: `Sous-actions (${countSousActions})`,
      isVisible: true,
      render: () => <SousActionTable />,
    },
    {
      label: 'Notes',
      isVisible: true,
      render: () => <NotesView isReadonly={isReadonly} fiche={fiche} />,
    },
    {
      label: 'Moyens',
      isVisible: true,
      render: () => <MoyensView isReadonly={isReadonly} fiche={fiche} />,
    },
    {
      label: 'Actions liées',
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
      label: 'Documents',
      isVisible: true,
      render: () => (
        <DocumentsView
          isReadonly={isReadonly}
          collectiviteId={collectiviteId}
          fiche={fiche}
        />
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
