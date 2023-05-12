import ScrollTopButton from 'ui/buttons/ScrollTopButton';
import {FicheAction} from './data/types';
import {useDeleteFicheAction} from './data/useDeleteFicheAction';
import FicheActionSupprimerModal from './FicheActionSupprimerModal';

type TFicheActionFooter = {
  fiche: FicheAction;
  isReadonly: boolean;
};

const FicheActionFooter = ({fiche, isReadonly}: TFicheActionFooter) => {
  const {mutate: deleteFiche} = useDeleteFicheAction();

  return (
    <div className="pt-16">
      {!isReadonly && (
        <FicheActionSupprimerModal
          fiche={fiche}
          onDelete={() => deleteFiche(fiche.id!)}
        />
      )}
      <div className="flex justify-end gap-6 my-8">
        {/* <button className="fr-btn fr-btn--secondary fr-fi-arrow-left-line fr-btn--icon-left">
          Fiche précédente
        </button>
        <button className="fr-btn fr-btn fr-fi-arrow-right-line fr-btn--icon-right">
          Fiche suivante
        </button> */}
      </div>
      <ScrollTopButton />
    </div>
  );
};

export default FicheActionFooter;
