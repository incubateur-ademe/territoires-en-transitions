import { isFicheSharedWithCollectivite } from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import { ENV } from '@tet/api/environmentVariables';

import { ServicesWidget } from '@betagouv/les-communs-widget';
import { CollectiviteCurrent } from '@tet/api/collectivites';
import { FicheWithRelations } from '@tet/domain/plans';
import { AppEnvironment } from '@tet/domain/utils';
import { Tab, Tabs } from '@tet/ui';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { DocumentsView } from './Documents/documents.view';
import Etapes from './etapes';
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
  collectivite: CollectiviteCurrent;
};

const FicheActionOnglets = ({
  fiche,
  isEditLoading,
  isReadonly,
  className,
  collectivite,
}: FicheActionOngletsProps) => {
  const { collectiviteId, niveauAcces, hasCollectivitePermission } = collectivite;
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
        hasCollectivitePermission('indicateurs.indicateurs.read') ||
        (!niveauAcces &&
          hasCollectivitePermission('indicateurs.indicateurs.read_public')),
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
        hasCollectivitePermission('plans.fiches.read') ||
        (!niveauAcces &&
          hasCollectivitePermission('plans.fiches.read_public')),
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
        hasCollectivitePermission('referentiels.read') ||
        (!niveauAcces &&
          hasCollectivitePermission('referentiels.read_public')),
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
