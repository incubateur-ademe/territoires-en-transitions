/* eslint-disable react/no-unescaped-entities */
import BasketPicto from '@components/Picto/BasketPicto';
import EmptyBasketPicto from '@components/Picto/EmptyBasketPicto';
import {ActionImpact} from '@tet/api';
import {Alert, Button, CarteActionImpact} from '@tet/ui';

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
          <div className="flex flex-col gap-4">
            {actionsListe.map(action => (
              <CarteActionImpact
                key={action.id}
                titre={action.titre}
                categorie={''}
                complexite={action.niveau_complexite as 1 | 2 | 3}
                budget={action.fourchette_budgetaire as 1 | 2 | 3}
                panier={true}
                onToggleSelected={() => onToggleSelected(action.id, false)}
              />
            ))}
          </div>
          <Button disabled className="w-full justify-center mt-auto">
            Valider la création
          </Button>
        </div>
      )}
    </div>
  );
};

export default PanierActions;
