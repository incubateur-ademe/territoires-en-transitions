'use client';

import { FicheNoAccessPage } from '@/app/plans/fiches/get-fiche/fiche-no-access.page';
import { ErrorPage } from '@/app/utils/error/error.page';
import { FicheWithRelations } from '@tet/domain/plans';
import { NavigationTabs } from './content/navigation.tabs';
import { FicheProvider } from './context/fiche-context';
import { useGetFiche } from './data/use-get-fiche';
import { Header } from './header';

type FicheActionImprovedProps = {
  fiche: FicheWithRelations;
  children?: React.ReactNode;
  planId?: number;
};

export const FicheActionImprovedView = ({
  fiche: initialFiche,
  children: content,
  planId,
}: FicheActionImprovedProps) => {
  const { data: fiche, error } = useGetFiche({
    id: initialFiche.id,
    initialData: initialFiche,
  });

  if (error) {
    if (error.data?.code === 'FORBIDDEN') {
      return <FicheNoAccessPage />;
    }
    return <ErrorPage error={error} reset={() => window.location.reload()} />;
  }

  if (!fiche) {
    return null;
  }

  return (
    <FicheProvider fiche={fiche} planId={planId}>
      <div className="w-full bg-grey-2">
        <div className="flex flex-col w-full px-2 mx-auto xl:max-w-7xl 2xl:max-w-8xl">
          <Header />
          <NavigationTabs>{content}</NavigationTabs>
        </div>
      </div>
    </FicheProvider>
  );
};
