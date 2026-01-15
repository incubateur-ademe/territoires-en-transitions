import { makeCollectiviteActionUrl } from '@/app/app/paths';
import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import {
  TabsList,
  TabsPanel,
  TabsTab,
  Tabs as TabsUI,
} from '@tet/ui/design-system/TabsNext/index';
import { useSelectedLayoutSegment } from 'next/navigation';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { useListFiches } from '../../list-all-fiches/data/use-list-fiches';
import { useFicheContext } from '../context/fiche-context';
import { FicheSectionId, isFicheSectionId } from './type';

export const NavigationTabs = ({ children }: { children: React.ReactNode }) => {
  const rawActiveTab = useSelectedLayoutSegment();
  const activeTab =
    rawActiveTab && isFicheSectionId(rawActiveTab) ? rawActiveTab : 'details';
  const { fiche, indicateurs, actionsLiees } = useFicheContext();
  const collectivite = useCurrentCollectivite();
  const { niveauAcces, permissions } = collectivite;

  const { count: countSousActions } = useListFiches(
    collectivite.collectiviteId,
    { filters: { parentsId: [fiche.id] }, queryOptions: { limit: 1, page: 1 } }
  );

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
      label: `Indicateurs de suivi ${
        indicateurs.list.length > 0 ? `(${indicateurs.list.length})` : ''
      }`,
      isVisible:
        hasPermission(permissions, 'indicateurs.indicateurs.read') ||
        (!niveauAcces &&
          hasPermission(permissions, 'indicateurs.indicateurs.read_public')),
      id: 'indicateurs',
    },
    {
      label: `Sous-actions (${countSousActions})`,
      isVisible: true,
      id: 'sous-actions',
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
        hasPermission(permissions, 'plans.fiches.read') ||
        (!niveauAcces &&
          hasPermission(permissions, 'plans.fiches.read_public')),
      id: 'actions-liees',
    },
    {
      label: 'Mesures des référentiels liées',
      isVisible:
        hasPermission(permissions, 'referentiels.read') ||
        (!niveauAcces &&
          hasPermission(permissions, 'referentiels.read_public')),
      id: 'mesures-liees',
    },
    {
      label: 'Documents',
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
          collectiviteId: collectivite.collectiviteId,
          ficheUid: fiche.id.toString(),
          content: tab.id,
        })}
        isActive={activeTab === tab.id}
      />
    ));

  return (
    <TabsUI>
      <TabsList className="flex justify-start gap-2 md:gap-3">
        {tabsToDisplay}
      </TabsList>
      <TabsPanel className="border-none">{children}</TabsPanel>
    </TabsUI>
  );
};
