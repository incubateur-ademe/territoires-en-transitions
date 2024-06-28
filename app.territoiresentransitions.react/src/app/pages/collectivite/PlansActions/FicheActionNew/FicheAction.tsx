import {useParams} from 'react-router-dom';
import {useFicheAction} from '../FicheAction/data/useFicheAction';
import {useEditFicheAction} from '../FicheAction/data/useUpsertFicheAction';
import FicheActionHeader from './FicheActionHeader/FicheActionHeader';
import FicheActionDescription from './FicheActionDescription/FicheActionDescription';

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
      className="w-full px-4 lg:px-6 py-12 bg-grey-2 -mb-8"
    >
      <div className="flex flex-col w-full px-2 mx-auto xl:max-w-7xl 2xl:max-w-8xl">
        <FicheActionHeader
          titre={fiche.titre}
          isReadonly={isReadonly}
          updateTitle={titre => updateFiche({...fiche, titre})}
        />
        <div className="grid grid-cols-4">
          <FicheActionDescription
            isReadonly={isReadonly}
            fiche={fiche}
            className="col-span-4"
            updateFiche={updateFiche}
          />
        </div>
      </div>
    </div>
  );
};

export default FicheAction;
