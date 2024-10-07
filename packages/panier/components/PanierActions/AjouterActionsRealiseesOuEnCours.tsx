import { Checkbox } from '@tet/ui';
import classNames from 'classnames';
import { AjouterActionsRealiseesOuEnCoursState } from './useAjouterActionsRealiseesOuEnCoursState';

/**
 * Affiche les cases à cocher permettant d'ajouter/enlever la sélection
 * d'actions "réalisées" ou "en cours" du panier
 */
export const AjouterActionsRealiseesOuEnCours = ({
  className,
  state,
}: {
  className?: string;
  state: AjouterActionsRealiseesOuEnCoursState;
}) => {
  const {
    nbEnCours,
    nbEnCoursInPanier,
    nbRealisees,
    nbRealiseesInPanier,
    ajoutEnCours,
    toggleAjoutEnCours,
    ajoutRealisees,
    toggleAjoutRealisees,
  } = state;

  return nbEnCours + nbRealisees === 0 ? null : (
    <div
      className={classNames('flex flex-col items-center gap-2 mb-8', className)}
    >
      {!!nbEnCours && (
        <Checkbox
          label={`Ajouter les actions classées “en cours” (${nbEnCoursInPanier}/${nbEnCours})`}
          checked={ajoutEnCours}
          onChange={toggleAjoutEnCours}
        />
      )}
      {!!nbRealisees && (
        <Checkbox
          label={`Ajouter les actions classées “réalisées” (${nbRealiseesInPanier}/${nbRealisees})`}
          checked={ajoutRealisees}
          onChange={toggleAjoutRealisees}
        />
      )}
    </div>
  );
};
