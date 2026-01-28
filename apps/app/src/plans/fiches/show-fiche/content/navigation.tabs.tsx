import { makeCollectiviteActionUrl } from '@/app/app/paths';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Spacer } from '@tet/ui';
import {
  TabsList,
  TabsPanel,
  TabsTab,
  Tabs as TabsUI,
} from '@tet/ui/design-system/TabsNext/index';
import { useSelectedLayoutSegment } from 'next/navigation';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { useFicheContext } from '../context/fiche-context';
import { FicheSectionId, isFicheSectionId } from './type';

export const NavigationTabs = ({ children }: { children: React.ReactNode }) => {
  const rawActiveTab = useSelectedLayoutSegment();
  const activeTab =
    rawActiveTab && isFicheSectionId(rawActiveTab) ? rawActiveTab : 'details';
  const { fiche, indicateurs, actionsLiees, documents } = useFicheContext();
  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();

  const widgetCommunsFlagEnabled = useFeatureFlagEnabled(
    'is-widget-communs-enabled'
  );

  const tabDescriptors: Array<{
    label: string;
    isVisible?: boolean;
    id: FicheSectionId;
  }> = [
    {
      label: 'Présentation',
      id: 'details',
    },
    {
      label: `Indicateurs ${
        indicateurs.list.length > 0 ? `(${indicateurs.list.length})` : ''
      }`,
      isVisible:
        hasCollectivitePermission('indicateurs.indicateurs.read') ||
        hasCollectivitePermission('indicateurs.indicateurs.read_public'),
      id: 'indicateurs',
    },
    {
      label: 'Étapes',
      id: 'etapes',
    },
    {
      label: `Notes ${
        Array.isArray(fiche.notes) && fiche.notes.length > 0
          ? `(${fiche.notes.length})`
          : ''
      }`,
      id: 'notes',
    },
    {
      label: 'Moyens',
      id: 'moyens',
    },
    {
      label: `Actions liées ${
        actionsLiees.list.length > 0 ? `(${actionsLiees.list.length})` : ''
      }`,
      isVisible:
        hasCollectivitePermission('plans.fiches.read') ||
        hasCollectivitePermission('plans.fiches.read_public'),
      id: 'actions-liees',
    },
    {
      label: 'Mesures liées',
      isVisible:
        hasCollectivitePermission('referentiels.read') ||
        hasCollectivitePermission('referentiels.read_public'),
      id: 'mesures-liees',
    },
    {
      label: `Documents ${
        documents.list && documents.list.length > 0
          ? `(${documents.list.length})`
          : ''
      }`,
      id: 'documents',
    },
    {
      label: 'Services liés',
      isVisible: widgetCommunsFlagEnabled ?? false,
      id: 'services',
    },
  ];

  const tabsToDisplay = tabDescriptors
    .filter((tab) => tab.isVisible ?? true)
    .map((tab) => (
      <TabsTab
        key={tab.id}
        label={tab.label}
        href={makeCollectiviteActionUrl({
          collectiviteId,
          ficheUid: fiche.id.toString(),
          content: tab.id,
        })}
        isActive={activeTab === tab.id}
      />
    ));

  return (
    <TabsUI>
      <TabsList className="flex justify-start gap-2 md:gap-3 m-0 p-0">
        {tabsToDisplay}
      </TabsList>
      <Spacer height={1.5} />
      <TabsPanel className="border-none">{children}</TabsPanel>
    </TabsUI>
  );
};
