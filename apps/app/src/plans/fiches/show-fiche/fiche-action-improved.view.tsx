'use client';

import { FicheNoAccessPage } from '@/app/plans/fiches/get-fiche/fiche-no-access.page';
import { ErrorPage } from '@/app/utils/error/error.page';
import { FicheWithRelations } from '@tet/domain/plans';
import { FicheProvider } from './context/fiche-context';
import { useGetFiche } from './data/use-get-fiche';
import { Header } from './header';
import { Tabs } from './tabs';
import { FicheActionActeurs } from './tabs/acteurs/FicheActionActeurs';
import { FicheActionDescription } from './tabs/description/FicheActionDescription';
import { FicheActionImpact } from './tabs/impact/FicheActionImpact';
import { FicheActionPlanning } from './tabs/planning/FicheActionPlanning';

type FicheActionImprovedProps = {
  fiche: FicheWithRelations;
  planId?: number;
};

export const FicheActionImprovedView = ({
  fiche: initialFiche,
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-10 gap-5 lg:gap-9 xl:gap-11">
            <FicheActionDescription className="col-span-full lg:col-span-2 xl:col-span-7" />

            <div className="max-lg:col-span-full xl:col-span-3 lg:row-span-3 max-lg:grid max-md:grid-cols-1 md:max-lg:grid-cols-2 lg:flex lg:flex-col gap-5">
              <FicheActionImpact />

              <FicheActionPlanning />

              <FicheActionActeurs className="md:max-lg:col-span-2" />
            </div>

            <Tabs className="col-span-full lg:col-span-2 xl:col-span-7" />
          </div>
        </div>
      </div>
    </FicheProvider>
  );
};
