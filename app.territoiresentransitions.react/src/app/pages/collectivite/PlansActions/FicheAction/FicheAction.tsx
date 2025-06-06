import { useParams } from 'react-router-dom';
import { useGetFiche } from './data/use-get-fiche';
import { useUpdateFiche } from './data/use-update-fiche';
import FicheActionActeurs from './FicheActionActeurs/FicheActionActeurs';
import FicheActionDescription from './FicheActionDescription/FicheActionDescription';
import FicheActionImpact from './FicheActionImpact';
import FicheActionOnglets from './FicheActionOnglets';
import FicheActionPilotes from './FicheActionPilotes/FicheActionPilotes';
import FicheActionPlanning from './FicheActionPlanning/FicheActionPlanning';
import FicheActionRestreint from './FicheActionRestreint/FicheActionRestreint';
import Header from './Header';

type FicheActionProps = {
  isReadonly: boolean;
};

const FicheAction = ({ isReadonly }: FicheActionProps) => {
  const { ficheUid } = useParams<{ ficheUid: string }>();

  const { data: fiche, isLoading } = useGetFiche(parseInt(ficheUid));

  const { mutate: updateFiche, isPending: isEditLoading } = useUpdateFiche();

  if (!fiche) {
    return null;
  }

  return (
    <>
      <div
        data-test="FicheAction"
        className="w-full px-2 md:px-4 lg:px-6 py-12 bg-grey-2"
      >
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
                {/* Information sur le mode public / privé */}
                <FicheActionRestreint
                  isReadonly={isReadonly}
                  isRestreint={fiche.restreint ?? false}
                  updateRestreint={(restreint) =>
                    updateFiche({
                      ficheId: fiche.id,
                      ficheFields: { restreint },
                    })
                  }
                />

                {/** Fiche action issue du panier d’action */}
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
              fiche={fiche}
              isReadonly={isReadonly}
              isFicheLoading={isLoading}
              isEditLoading={isEditLoading}
              className="col-span-full lg:col-span-2 xl:col-span-7"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default FicheAction;
