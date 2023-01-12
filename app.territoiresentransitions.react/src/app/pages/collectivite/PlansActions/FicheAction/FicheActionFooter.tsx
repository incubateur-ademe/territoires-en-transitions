import ScrollTopButton from 'ui/shared/ScrollTopButton';
import {TFicheAction} from './data/types/alias';
import {useDeleteFicheAction} from './data/useDeleteFicheAction';

type TFicheActionFooter = {
  fiche: TFicheAction;
};

const FicheActionFooter = ({fiche}: TFicheActionFooter) => {
  const {mutate: deleteFiche} = useDeleteFicheAction();

  return (
    <div className="pt-16">
      <div className="inline-flex border border-red-700">
        <button
          className="fr-btn fr-btn--secondary fr-text-default--error !shadow-none"
          onClick={() => deleteFiche(fiche.id!)}
        >
          Supprimer cette fiche
        </button>
      </div>
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
