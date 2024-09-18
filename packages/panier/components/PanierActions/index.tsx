/* eslint-disable react/no-unescaped-entities */
import {ActionImpact} from '@tet/panier/components/ActionImpact';
import BasketPicto from '@tet/panier/components/Picto/BasketPicto';
import EmptyBasketPicto from '@tet/panier/components/Picto/EmptyBasketPicto';
import ValiderPanierButton from '@tet/panier/components/ValidationPanier/ValiderPanierButton';
import {ActionImpactFourchetteBudgetaire, ActionImpactSnippet} from '@tet/api';
import {Alert} from '@tet/ui';
import React from 'react';

type PanierActionsProps = {
  actionsListe: ActionImpactSnippet[];
  budgets: ActionImpactFourchetteBudgetaire[];
  onToggleSelected: (actionId: number, selected: boolean) => void;
};

const PanierActions = ({
  actionsListe,
  budgets,
  onToggleSelected,
}: PanierActionsProps) => {
  return (
    <div className="lg:h-screen lg:w-2/5 xl:w-1/3 bg-white border-[0.5px] border-primary-3 sticky top-0">
      {actionsListe.length === 0 ? (
        <div className="h-full relative">
          <Alert
            title="Comment ajouter des actions ?"
            description={`Pour ajouter des actions à votre panier, veuillez cliquer sur le bouton "Ajouter" qui s'affiche au survol de chacune des vignettes d'action.`}
            className="lg:absolute"
          />
          <div className="h-full flex flex-col items-center justify-center max-lg:py-4">
            <EmptyBasketPicto />
            <span className="text-primary-8 text-lg font-bold text-center">
              Votre panier d'actions est vide !
            </span>
          </div>
        </div>
      ) : (
        <div className="h-full p-4 pt-0 flex flex-col gap-5">
          <div className="flex flex-col overflow-y-auto">
            <div className="h-48 mt-6">
              <BasketPicto className="mx-auto h-full" />
            </div>
            <div className="sticky top-0 z-10">
              <div className="bg-white text-primary-8 py-6 text-xl font-extrabold text-center">
                {actionsListe.length} action{actionsListe.length > 1 ? 's' : ''}{' '}
                dans mon panier
              </div>
              <ValiderPanierButton />
              <div className="h-12 bg-gradient-to-b from-white via-white" />
            </div>

            <div className="grid md:max-lg:grid-cols-2 gap-4">
              {actionsListe.map(action => (
                <ActionImpact
                  key={action.id}
                  description={action.description}
                  titre={action.titre}
                  thematiques={action.thematiques}
                  budget={budgets.find(
                    b => b.niveau === action.fourchette_budgetaire,
                  )}
                  panier={true}
                  isSelected={false}
                  onToggleSelected={() => onToggleSelected(action.id, false)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PanierActions;
