/* eslint-disable react/no-unescaped-entities */
import BasketPicto from '@components/Picto/BasketPicto';
import EmptyBasketPicto from '@components/Picto/EmptyBasketPicto';
import {ActionImpact} from '@tet/api';
import {Alert, Button} from '@tet/ui';

type PanierActionsProps = {
  actionsListe: ActionImpact[];
  onToggleSelected: (actionId: number, selected: boolean) => void;
};

const PanierActions = ({
  actionsListe,
  onToggleSelected,
}: PanierActionsProps) => {
  return (
    <div className="h-full bg-white border-[0.5px] border-primary-3">
      {actionsListe.length === 0 ? (
        <div className="h-full">
          <Alert
            title="Comment ajouter des actions ?"
            description={`Pour ajouter des actions à votre panier, veuillez cliquer sur le bouton "Ajouter" qui s'affiche au survol de chacune des vignettes d'action.`}
          />
          <div className="flex flex-col items-center mt-32">
            <EmptyBasketPicto />
            <span className="text-primary-8 text-lg font-bold text-center">
              Votre panier d'actions est vide !
            </span>
          </div>
        </div>
      ) : (
        <div className="h-full p-4 flex flex-col gap-8">
          <BasketPicto className="mx-auto" />
          <span className="text-primary-8 text-xl font-extrabold text-center">
            {actionsListe.length} action{actionsListe.length > 1 ? 's' : ''}{' '}
            dans mon panier
          </span>
          {actionsListe.map(action => (
            <div key={action.id} className="p-4 bg-primary-2">
              <div>{action.titre}</div>
              <div>{'€'.repeat(action.fourchette_budgetaire)}</div>
              <div>Complexité : {action.niveau_complexite}</div>
              <button onClick={() => onToggleSelected(action.id, false)}>
                Retirer
              </button>
            </div>
          ))}
          <Button disabled className="w-full justify-center mt-auto">
            Valider la création
          </Button>
        </div>
      )}
    </div>
  );
};

export default PanierActions;
