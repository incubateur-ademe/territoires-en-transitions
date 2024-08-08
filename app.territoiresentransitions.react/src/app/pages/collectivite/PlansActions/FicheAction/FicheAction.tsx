import {useParams} from 'react-router-dom';
import {format} from 'date-fns';
import {useFicheAction} from './data/useFicheAction';
import {useEditFicheAction} from './data/useUpsertFicheAction';
import FicheActionHeader from './FicheActionHeader/FicheActionHeader';
import FicheActionDescription from '../FicheActionNew/FicheActionDescription/FicheActionDescription';
import FicheActionPlanning from '../FicheActionNew/FicheActionPlanning/FicheActionPlanning';
import FicheActionActeurs from '../FicheActionNew/FicheActionActeurs/FicheActionActeurs';
import FicheActionRestreint from '../FicheActionNew/FicheActionRestreint/FicheActionRestreint';
import FicheActionOnglets from '../FicheActionNew/FicheActionOnglets';

type FicheActionProps = {
  isReadonly: boolean;
};

const FicheAction = ({isReadonly}: FicheActionProps) => {
  const {ficheUid} = useParams<{ficheUid: string}>();
  const data = useFicheAction(ficheUid);
  const {mutate: updateFiche} = useEditFicheAction();

  if (!data || !data.fiche) return null;

  const {fiche} = data;

  return (
    <div
      data-test="FicheAction"
      className="w-full px-2 md:px-4 lg:px-6 py-12 bg-grey-2 -mb-8"
    >
      <div className="flex flex-col w-full px-2 mx-auto xl:max-w-7xl 2xl:max-w-8xl">
        {/* Header de la fiche action (titre, fil d'ariane) */}
        <FicheActionHeader
          titre={fiche.titre}
          collectiviteId={fiche.collectivite_id!}
          axes={fiche.axes}
          isReadonly={isReadonly}
          updateTitle={titre => updateFiche({...fiche, titre})}
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
                updateRestreint={restreint =>
                  updateFiche({...fiche, restreint})
                }
              />

              {/* Date de dernière modification */}
              {fiche.modified_at && (
                <div className="bg-white border border-grey-3 rounded-lg py-2 px-3.5 h-14 text-sm text-primary-10 font-medium italic flex items-center max-md:justify-center">
                  <span>
                    Dernière modification le{' '}
                    {format(new Date(fiche.modified_at), 'dd/MM/yyyy')}
                  </span>
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
            className="col-span-full lg:col-span-2 xl:col-span-7"
            updateFiche={updateFiche}
          />
        </div>
      </div>
    </div>
  );
};

export default FicheAction;
