'use client';

import { appLabels } from '@/app/labels/catalog';
import { useGetFiche } from '@/app/plans/fiches/data/use-get-fiche';
import { FicheNoAccessPage } from '@/app/plans/fiches/get-fiche/fiche-no-access.page';
import { ErrorPage } from '@/app/utils/error/error.page';
import { FicheWithRelations } from '@tet/domain/plans';
import { NavigationTabs } from './content/navigation.tabs';
import { FicheProvider } from './context/fiche-context';
import { useFicheNavigation } from './data/use-fiche-navigation';
import { Header } from './header';
import { FicheNavigationButtons } from './navigation/fiche-navigation.buttons';

type FicheViewProps = {
  fiche: FicheWithRelations;
  children?: React.ReactNode;
  planId?: number;
};

export const FicheView = ({
  fiche: initialFiche,
  children: content,
  planId,
}: FicheViewProps) => {
  const { data: fiche, error } = useGetFiche({
    id: initialFiche.id,
    initialData: initialFiche,
  });
  const navigation = useFicheNavigation({ ficheId: initialFiche.id, planId });

  if (error) {
    if (error.data?.code === 'FORBIDDEN') {
      return <FicheNoAccessPage />;
    }
    return <ErrorPage error={error} retry={() => window.location.reload()} />;
  }

  if (!fiche) {
    return null;
  }

  return (
    <FicheProvider fiche={fiche} planId={planId}>
      <Header navigation={navigation} />
      <NavigationTabs>{content}</NavigationTabs>
      {navigation && (
        <nav aria-label={appLabels.ficheNavigation} className="mt-6">
          <FicheNavigationButtons {...navigation} />
        </nav>
      )}
    </FicheProvider>
  );
};
