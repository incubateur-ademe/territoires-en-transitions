import FicheActionHeader from './FicheActionHeader/FicheActionHeader';
import FicheActionForm from './FicheActionForm/FicheActionForm';
import FicheActionFooter from './FicheActionFooter';

import {useParams} from 'react-router-dom';
import {useFicheAction} from './data/useFicheAction';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import HeaderTitle from '../components/HeaderTitle';
import {useEditFicheAction} from './data/useUpsertFicheAction';
import {FicheAction as FicheActionType} from './data/types';

type FicheActionProps = {
  fiche: FicheActionType;
};

export const FicheAction = ({fiche}: FicheActionProps) => {
  const collectivite = useCurrentCollectivite();
  const {mutate: updateFiche} = useEditFicheAction();
  return (
    <div data-test="FicheAction" className="w-full">
      <HeaderTitle
        titre={fiche.titre}
        onUpdate={titre => updateFiche({...fiche, titre: titre})}
        isReadonly={collectivite?.readonly ?? false}
      />
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

  return data && data.fiche ? <FicheAction fiche={data.fiche} /> : <div></div>;
};

export default FicheActionConnected;
