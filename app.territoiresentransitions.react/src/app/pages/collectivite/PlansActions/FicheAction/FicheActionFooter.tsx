import ScrollTopButton from 'ui/shared/ScrollTopButton';
import {TFicheAction} from './data/types/alias';
import {useDeleteFicheAction} from './data/useDeleteFicheAction';
import FicheActionSupprimerModal from './FicheActionSupprimerModal';

type TFicheActionFooter = {
  fiche: TFicheAction;
};

const FicheActionFooter = ({fiche}: TFicheActionFooter) => {
  const {mutate: deleteFiche} = useDeleteFicheAction();

  return (
    <div className="pt-16">
      <FicheActionSupprimerModal onDelete={() => deleteFiche(fiche.id!)} />
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
