import { isFicheSharedWithCollectivite } from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Tab as TabUI, Tabs as TabsUI } from '@tet/ui';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { useFicheContext } from '../context/fiche-context';
import { DocumentsView } from './documents/documents.view';
import { Etapes } from './etapes/etapes';
import { FichesLieesTab } from './fiches-liees/FichesLieesTab';
import { IndicateursView } from './indicateurs/indicateurs.view';
import { MesuresLieesView } from './mesures-liees/mesures-liees.view';
import { MoyensTab } from './moyens/MoyensTab';
import { NotesView } from './notes/notes.view';
import { ServicesWidgetTab } from './services-widget/ServicesWidgetTab';

type TabDescriptor = {
  label: string;
  isVisible: boolean;
  render: () => React.ReactNode;
};

type TabsProps = {
  className?: string;
};

export const Tabs = ({ className }: TabsProps) => {
  const {
    fiche,
    isReadonly: globalIsReadonly,

    isUpdatePending,
  } = useFicheContext();
  const collectivite = useCurrentCollectivite();
  const { collectiviteId, niveauAcces, permissions } = collectivite;

  const widgetCommunsFlagEnabled = useFeatureFlagEnabled(
    'is-widget-communs-enabled'
  );
  const cannotBeModifiedBecauseFicheIsShared = isFicheSharedWithCollectivite(
    fiche,
    collectivite.collectiviteId
  );

  const isReadonly = cannotBeModifiedBecauseFicheIsShared || globalIsReadonly;

  const tabDescriptors: TabDescriptor[] = [
    {
      label: 'Indicateurs de suivi',
      isVisible:
        hasPermission(permissions, 'indicateurs.definitions.read') ||
        (!niveauAcces &&
          hasPermission(permissions, 'indicateurs.definitions.read_public')),
      render: () => <IndicateursView isReadonly={isReadonly} fiche={fiche} />,
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
      render: () => <MoyensTab isReadonly={isReadonly} fiche={fiche} />,
    },
    {
      label: 'Actions liées',
      isVisible:
        hasPermission(permissions, 'plans.fiches.read') ||
        (!niveauAcces &&
          hasPermission(permissions, 'plans.fiches.read_public')),
      render: () => (
        <FichesLieesTab
          isReadonly={isReadonly}
          collectivite={collectivite}
          isEditLoading={isUpdatePending}
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
          isReadonly={isReadonly}
          isEditLoading={isUpdatePending}
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
      render: () => <ServicesWidgetTab ficheId={fiche.id} />,
    },
  ];

  const visibleTabElements = tabDescriptors
    .filter((tab) => tab.isVisible)
    .map((tab) => (
      <TabUI key={tab.label} label={tab.label}>
        {tab.render()}
      </TabUI>
    ));

  return (
    <TabsUI
      className={className}
      tabsListClassName="!justify-start pl-0 flex-nowrap overflow-x-scroll"
    >
      {visibleTabElements}
    </TabsUI>
  );
};
