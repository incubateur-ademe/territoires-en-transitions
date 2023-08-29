import Chemins from './Chemins';
import FicheActionSupprimerModal from '../FicheActionSupprimerModal';

import {useDeleteFicheAction} from '../data/useDeleteFicheAction';
import {FicheAction} from '../data/types';

type TFicheActionHeader = {fiche: FicheAction; isReadonly: boolean};

const FicheActionHeader = ({fiche, isReadonly}: TFicheActionHeader) => {
  const {mutate: deleteFiche} = useDeleteFicheAction();

  return (
    <div className="py-6">
      {/** Actions */}
      {!isReadonly && (
        <div className="mb-6 flex items-center justify-end gap-4">
          <FicheActionSupprimerModal
            fiche={fiche}
            onDelete={() => deleteFiche(fiche.id!)}
          />
        </div>
      )}
      {/** Fils d'ariane */}
      <Chemins fiche={fiche} />
    </div>
  );
};

export default FicheActionHeader;
