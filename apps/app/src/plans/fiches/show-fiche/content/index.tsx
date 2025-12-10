import { isFicheSharedWithCollectivite } from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Tab as TabUI, Tabs as TabsUI } from '@tet/ui';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import React from 'react';
import { useFicheContext } from '../context/fiche-context';
import { DetailsView } from './details/details.view';
import { DocumentsView } from './documents/documents.view';
import { Etapes } from './etapes/etapes';
import { FichesLieesTab } from './fiches-liees/FichesLieesTab';
import { IndicateursView } from './indicateurs/indicateurs.view';
import { MesuresLieesView } from './mesures-liees/mesures-liees.view';
import { MoyensView } from './moyens/moyens.view';
import { NotesView } from './notes/notes.view';
import { ServicesWidgetTab } from './services-widget/ServicesWidgetTab';

const TabContent = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="bg-white border border-grey-3 rounded-lg py-7 lg:py-8 xl:py-10 px-5 lg:px-6 xl:px-8 flex flex-col gap-5">
      {children}
    </div>
  );
};
export const Content = () => {
  const {
    fiche,
    isReadonly: globalIsReadonly,

    isUpdatePending,
  } = useFicheContext();
  const collectivite = useCurrentCollectivite();
  const { collectiviteId, niveauAcces, permissions } = collectivite;

  const { selectedIndicateurs } = useFicheContext();
  const widgetCommunsFlagEnabled = useFeatureFlagEnabled(
    'is-widget-communs-enabled'
  );
  const cannotBeModifiedBecauseFicheIsShared = isFicheSharedWithCollectivite(
    fiche,
    collectivite.collectiviteId
  );

  const isReadonly = cannotBeModifiedBecauseFicheIsShared || globalIsReadonly;

  const tabDescriptors: Array<{
    id: string;
    label: string;
    isVisible?: boolean;
    render: JSX.Element;
  }> = [
    {
      id: 'presentation',
      label: 'Présentation',
      render: <DetailsView />,
    },
    {
      id: 'indicateurs',
      label: `Indicateurs de suivi ${
        selectedIndicateurs.length > 0 ? `(${selectedIndicateurs.length})` : ''
      }`,
      isVisible:
        hasPermission(permissions, 'indicateurs.definitions.read') ||
        (!niveauAcces &&
          hasPermission(permissions, 'indicateurs.definitions.read_public')),
      render: (
        <TabContent>
          <IndicateursView />
        </TabContent>
      ),
    },
    {
      id: 'etapes',
      label: 'Étapes',
      render: (
        <TabContent>
          <Etapes isReadonly={isReadonly} fiche={fiche} />
        </TabContent>
      ),
    },
    {
      id: 'notes',
      label: 'Notes',
      render: (
        <TabContent>
          <NotesView isReadonly={isReadonly} fiche={fiche} />
        </TabContent>
      ),
    },
    {
      id: 'moyens',
      label: 'Moyens',
      render: (
        <TabContent>
          <MoyensView isReadonly={isReadonly} fiche={fiche} />
        </TabContent>
      ),
    },
    {
      id: 'fiches-liees',
      label: 'Fiches action liées',
      isVisible:
        hasPermission(permissions, 'plans.fiches.read') ||
        (!niveauAcces &&
          hasPermission(permissions, 'plans.fiches.read_public')),
      render: (
        <FichesLieesTab
          isReadonly={isReadonly}
          collectivite={collectivite}
          isEditLoading={isUpdatePending}
          fiche={fiche}
        />
      ),
    },
    {
      id: 'mesures-liees',
      label: 'Mesures des référentiels liées',
      isVisible:
        hasPermission(permissions, 'referentiels.read') ||
        (!niveauAcces &&
          hasPermission(permissions, 'referentiels.read_public')),
      render: (
        <MesuresLieesView
          isReadonly={isReadonly}
          isEditLoading={isUpdatePending}
          fiche={fiche}
        />
      ),
    },
    {
      id: 'documents',
      label: 'Documents',
      render: (
        <DocumentsView
          isReadonly={isReadonly}
          collectiviteId={collectiviteId}
          fiche={fiche}
        />
      ),
    },
    {
      id: 'services-liees',
      label: 'Services liés',
      isVisible: widgetCommunsFlagEnabled ?? false,
      render: <ServicesWidgetTab ficheId={fiche.id} />,
    },
  ];

  const tabsToDisplay = tabDescriptors
    .filter((tab) => tab.isVisible ?? true)
    .map((tab) => (
      /** id is used as key cause it's stable contrary to label */
      <TabUI key={tab.id} label={tab.label}>
        {tab.render}
      </TabUI>
    ));

  return <TabsUI layoutOnOverflow="wrap">{tabsToDisplay}</TabsUI>;
};
