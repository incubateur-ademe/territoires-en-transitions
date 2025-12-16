import { makeCollectiviteActionUrl } from '@/app/app/paths';
import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import {
  TabsList,
  TabsPanel,
  TabsTab,
  Tabs as TabsUI,
} from '@tet/ui/design-system/TabsNext/index';
import { usePathname } from 'next/navigation';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { useFicheContext } from '../context/fiche-context';
import { FicheSectionId } from './type';

export const NavigationTabs = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { fiche } = useFicheContext();
  const collectivite = useCurrentCollectivite();
  const { niveauAcces, permissions } = collectivite;

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
      label: 'Indicateurs de suivi',
      isVisible:
        hasPermission(permissions, 'indicateurs.definitions.read') ||
        (!niveauAcces &&
          hasPermission(permissions, 'indicateurs.definitions.read_public')),
      id: 'indicateurs',
    },
    {
      label: 'Étapes',
      id: 'etapes',
    },
    {
      label: 'Notes',
      id: 'notes',
    },
    {
      label: 'Moyens',
      id: 'moyens',
    },
    {
      label: 'Actions liées',
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
        isActive={pathname.endsWith(tab.id)}
      />
    ));

  return (
    <TabsUI>
      <TabsList className="flex justify-start gap-2 md:gap-3">
        {tabsToDisplay}
      </TabsList>
      <TabsPanel>{children}</TabsPanel>
    </TabsUI>
  );
};
