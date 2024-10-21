import { TrackPageView } from '@tet/ui';
import { useCollectiviteId } from 'core-logic/hooks/params';
import { format } from 'date-fns';
import { useParams } from 'next/navigation';
import { useFicheAction } from './data/useFicheAction';
import { useUpdateFicheAction } from './data/useUpdateFicheAction';
import FicheActionActeurs from './FicheActionActeurs/FicheActionActeurs';
import FicheActionDescription from './FicheActionDescription/FicheActionDescription';
import FicheActionHeader from './FicheActionHeader/FicheActionHeader';
import FicheActionImpact from './FicheActionImpact';
import FicheActionOnglets from './FicheActionOnglets';
import FicheActionPlanning from './FicheActionPlanning/FicheActionPlanning';
import FicheActionRestreint from './FicheActionRestreint/FicheActionRestreint';

type FicheActionProps = {
  isReadonly: boolean;
};

const FicheAction = ({ isReadonly }: FicheActionProps) => {
  const { ficheUid } = useParams<{ ficheUid: string }>();

  const collectiviteId = useCollectiviteId()!;

  const { data, isLoading } = useFicheAction(ficheUid);

  const { mutate: updateFiche, isLoading: isEditLoading } =
    useUpdateFicheAction();

  if (!data) {
    return null;
  }

  const fiche = data;

  return (
    <>
      <TrackPageView
        pageName={'app/fiche-action'}
        properties={{ collectivite_id: collectiviteId }}
      />

      <div
        data-test="FicheAction"
        className="w-full px-2 md:px-4 lg:px-6 py-12 bg-grey-2 -mb-8"
      >
        <div className="flex flex-col w-full px-2 mx-auto xl:max-w-7xl 2xl:max-w-8xl">
          {/* Header de la fiche action (titre, fil d'ariane) */}
          <FicheActionHeader
            titre={fiche.titre}
            collectiviteId={fiche.collectiviteId}
            axes={fiche.axes ?? []}
            isReadonly={isReadonly}
            updateTitle={(titre) => updateFiche({ ...fiche, titre })}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-10 gap-5 lg:gap-9 xl:gap-11">
            {/* Description, moyens humains et techniques, et thématiques */}
            <FicheActionDescription
              isReadonly={isReadonly}
              fiche={fiche}
              className="col-span-full lg:col-span-2 xl:col-span-7"
              updateFiche={updateFiche}
            />

            {/* Colonne de droite */}
            <div className="max-lg:col-span-full xl:col-span-3 lg:row-span-3 max-lg:grid max-md:grid-cols-1 md:max-lg:grid-cols-2 lg:flex lg:flex-col gap-5">
              <div className="flex flex-col gap-5">
                {/* Information sur le mode public / privé */}
                <FicheActionRestreint
                  isReadonly={isReadonly}
                  isRestreint={fiche.restreint ?? false}
                  updateRestreint={(restreint) =>
                    updateFiche({ ...fiche, restreint })
                  }
                />

                {/** Fiche action issue du panier d’action */}
                <FicheActionImpact fiche={fiche} />

                {/* Date de dernière modification */}
                {fiche.modifiedAt && (
                  <div className="bg-white border border-grey-3 rounded-lg py-2 px-3.5 text-sm text-primary-10 font-medium italic flex flex-col items-start max-md:items-center gap-1">
                    <span>
                      Dernière modification le{' '}
                      {format(new Date(fiche.modifiedAt), 'dd/MM/yyyy')}
                    </span>
                    {fiche.createdAt && (
                      <span className="text-sm text-primary-10 text-left">
                        Fiche action créée le{' '}
                        {format(new Date(fiche.createdAt), 'dd/MM/yyyy')}
                      </span>
                    )}
                  </div>
                )}

                {/* Planning prévisionnel */}
                <FicheActionPlanning
                  isReadonly={isReadonly}
                  fiche={fiche}
                  updateFiche={updateFiche}
                  className="grow"
                />
              </div>

              {/* Acteurs du projet */}
              <FicheActionActeurs
                isReadonly={isReadonly}
                fiche={fiche}
                updateFiche={updateFiche}
              />
            </div>

            {/* Contenu de la fiche action */}
            <FicheActionOnglets
              fiche={fiche}
              isReadonly={isReadonly}
              isFicheLoading={isLoading}
              isEditLoading={isEditLoading}
              className="col-span-full lg:col-span-2 xl:col-span-7"
              updateFiche={updateFiche}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default FicheAction;
