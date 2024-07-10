import {useParams} from 'react-router-dom';
import {useFicheAction} from '../FicheAction/data/useFicheAction';
import {useEditFicheAction} from '../FicheAction/data/useUpsertFicheAction';
import FicheActionHeader from './FicheActionHeader/FicheActionHeader';
import FicheActionDescription from './FicheActionDescription/FicheActionDescription';
import FicheActionPlanning from './FicheActionPlanning/FicheActionPlanning';
import FicheActionActeurs from './FicheActionActeurs/FicheActionActeurs';
import classNames from 'classnames';

const getFormattedDate = (date: string) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
};

type FicheActionProps = {
  isReadonly: boolean;
};

const FicheAction = ({isReadonly}: FicheActionProps) => {
  const {ficheUid} = useParams<{ficheUid: string}>();
  const data = useFicheAction(ficheUid);
  const {mutate: updateFiche} = useEditFicheAction();

  if (!data || !data.fiche) return null;

  const {fiche} = data;
  const isTwoColumns = !!fiche.calendrier;

  return (
    <div
      data-test="FicheAction"
      className="w-full px-2 md:px-4 lg:px-6 py-12 bg-grey-2 -mb-8"
    >
      <div className="flex flex-col w-full px-2 mx-auto xl:max-w-7xl 2xl:max-w-8xl">
        <FicheActionHeader
          titre={fiche.titre}
          isReadonly={isReadonly}
          updateTitle={titre => updateFiche({...fiche, titre})}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 lg:gap-9 xl:gap-11">
          <FicheActionDescription
            isReadonly={isReadonly}
            fiche={fiche}
            className="col-span-full lg:col-span-2 xl:col-span-3"
            updateFiche={updateFiche}
          />
          <div
            className={classNames(
              'max-lg:col-span-full lg:row-span-3 max-lg:grid max-lg:grid-cols-1 lg:flex lg:flex-col gap-5',
              {
                'md:max-lg:grid-cols-3': !isTwoColumns,
                'md:max-lg:grid-cols-2': isTwoColumns,
              }
            )}
          >
            <div className="flex flex-col gap-5">
              {fiche.modified_at && (
                <div className="bg-white border border-grey-3 rounded-lg py-3.5 px-5 lg:px-6 xl:px-8 text-sm text-primary-10 max-lg:text-center font-medium italic">
                  Dernière modification le {getFormattedDate(fiche.modified_at)}
                </div>
              )}
              <FicheActionPlanning
                isReadonly={isReadonly}
                fiche={fiche}
                updateFiche={updateFiche}
                className="grow"
              />
            </div>

            <FicheActionActeurs
              isReadonly={isReadonly}
              fiche={fiche}
              updateFiche={updateFiche}
              className={classNames({'md:max-lg:col-span-2': !isTwoColumns})}
            />
          </div>
          <div className="col-span-full lg:col-span-2 xl:col-span-3 bg-white border border-grey-3 rounded-lg py-10 px-8">
            Onglets
          </div>
        </div>
      </div>
    </div>
  );
};

export default FicheAction;
