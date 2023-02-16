import FicheActionHeader from './FicheActionHeader/FicheActionHeader';
import FicheActionForm from './FicheActionForm/FicheActionForm';
import FicheActionFooter from './FicheActionFooter';

import {useParams} from 'react-router-dom';
import {useFicheAction} from './data/useFicheAction';
import {FicheActionVueRow} from './data/types/ficheActionVue';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';

type FicheActionProps = {
  fiche: FicheActionVueRow;
};

export const FicheAction = ({fiche}: FicheActionProps) => {
  const collectivite = useCurrentCollectivite();
  return (
    <div className="w-full">
      <div className="bg-indigo-400">
        <h5 className="max-w-4xl mx-auto m-0 py-8 px-10 text-white">
          {fiche.titre && fiche.titre.length > 0 ? fiche.titre : 'Sans titre'}
        </h5>
      </div>
      <div className="max-w-4xl mx-auto px-10">
        <FicheActionHeader fiche={fiche} />
        <FicheActionForm
          fiche={fiche}
          isReadonly={collectivite?.readonly ?? false}
        />
        <FicheActionFooter
          fiche={fiche}
          isReadonly={collectivite?.readonly ?? false}
        />
      </div>
    </div>
  );
};

const FicheActionConnected = () => {
  const {ficheUid} = useParams<{ficheUid: string}>();

  const data = useFicheAction(ficheUid);

  return data ? <FicheAction fiche={data.fiche} /> : <div></div>;
};

export default FicheActionConnected;
