'use client';

import { useCurrentCollectivite } from '@/api/collectivites';
import FicheActionAcces from '@/app/app/pages/collectivite/PlansActions/FicheAction/FicheActionAcces/FicheActionAcces';
import { FicheNoAccessPage } from '@/app/plans/fiches/get-fiche/fiche-no-access.page';
import { isFicheEditableByCollectivite } from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import { ErrorPage } from '@/app/utils/error/error.page';
import { FicheWithRelations } from '@/domain/plans';
import { Fiche, useGetFiche } from './data/use-get-fiche';
import { useUpdateFiche } from './data/use-update-fiche';
import FicheActionActeurs from './FicheActionActeurs/FicheActionActeurs';
import FicheActionDescription from './FicheActionDescription/FicheActionDescription';
import FicheActionImpact from './FicheActionImpact';
import FicheActionOnglets from './FicheActionOnglets';
import FicheActionPilotes from './FicheActionPilotes/FicheActionPilotes';
import FicheActionPlanning from './FicheActionPlanning/FicheActionPlanning';
import { Header } from './Header';

type FicheActionProps = {
  fiche: Fiche;
  planId?: number;
};

export const FicheAction = ({
  fiche: initialFiche,
  planId,
}: FicheActionProps) => {
  const collectivite = useCurrentCollectivite();

  const { data: fiche, error } = useGetFiche({
    id: initialFiche.id,
    initialData: initialFiche,
  });

  const { mutate: updateFiche, isPending: isEditLoading } = useUpdateFiche();

  if (error) {
    if (error.data?.code === 'FORBIDDEN') {
      // Suppose to happen only for "restreint" fiches
      return <FicheNoAccessPage />;
    }
    return <ErrorPage error={error} reset={() => window.location.reload()} />;
  }

  if (!fiche) {
    return null;
  }

  const isReadonly =
    collectivite.isReadOnly ||
    !isFicheEditableByCollectivite(fiche, collectivite);

  const handleUpdateAccess = ({
    restreint,
    sharedWithCollectivites,
  }: Pick<FicheWithRelations, 'restreint' | 'sharedWithCollectivites'>) => {
    updateFiche({
      ficheId: fiche.id,
      ficheFields: { restreint, sharedWithCollectivites },
    });
  };

  return (
    <>
      <div data-test="FicheAction" className="w-full bg-grey-2">
        <div className="flex flex-col w-full px-2 mx-auto xl:max-w-7xl 2xl:max-w-8xl">
          {/* Header de la fiche action (titre, fil d'ariane) */}
          <Header
            fiche={fiche}
            isReadonly={isReadonly}
            updateTitle={(titre) =>
              updateFiche({
                ficheId: fiche.id,
                ficheFields: { titre },
              })
            }
            planId={planId}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-10 gap-5 lg:gap-9 xl:gap-11">
            {/* Description, moyens humains et techniques, et thématiques */}
            <FicheActionDescription
              isReadonly={isReadonly}
              fiche={fiche}
              className="col-span-full lg:col-span-2 xl:col-span-7"
            />

            {/* Colonne de droite */}
            <div className="max-lg:col-span-full xl:col-span-3 lg:row-span-3 max-lg:grid max-md:grid-cols-1 md:max-lg:grid-cols-2 lg:flex lg:flex-col gap-5">
              <div className="flex flex-col gap-5">
                {/* Information sur le mode public / privé et le partage */}
                <FicheActionAcces
                  isReadonly={isReadonly}
                  fiche={fiche}
                  onUpdateAccess={handleUpdateAccess}
                />

                {/** Fiche action issue du panier d'action */}
                <FicheActionImpact ficheId={fiche.id} />

                {/* Pilotes */}
                <FicheActionPilotes isReadonly={isReadonly} fiche={fiche} />
              </div>

              {/* Planning prévisionnel */}
              <FicheActionPlanning isReadonly={isReadonly} fiche={fiche} />

              {/* Acteurs du projet */}
              <FicheActionActeurs
                isReadonly={isReadonly}
                fiche={fiche}
                className="md:max-lg:col-span-2"
              />
            </div>

            {/* Contenu de la fiche action */}
            <FicheActionOnglets
              collectivite={collectivite}
              fiche={fiche}
              isEditLoading={isEditLoading}
              className="col-span-full lg:col-span-2 xl:col-span-7"
            />
          </div>
        </div>
      </div>
    </>
  );
};
