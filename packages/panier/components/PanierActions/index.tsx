/* eslint-disable react/no-unescaped-entities */
import {ActionImpact} from '@tet/panier/components/ActionImpact';
import BasketPicto from '@tet/panier/components/Picto/BasketPicto';
import EmptyBasketPicto from '@tet/panier/components/Picto/EmptyBasketPicto';
import ValiderPanierButton from '@tet/panier/components/ValidationPanier/ValiderPanierButton';
import {ActionImpactFourchetteBudgetaire, ActionImpactState} from '@tet/api';
import {Alert} from '@tet/ui';
import {AjouterActionsRealiseesOuEnCours} from './AjouterActionsRealiseesOuEnCours';
import {useAjouterActionsRealiseesOuEnCoursState} from './useAjouterActionsRealiseesOuEnCoursState';

type PanierActionsProps = {
  actionsListe: ActionImpactState[];
  budgets: ActionImpactFourchetteBudgetaire[];
  onToggleSelected: (actionId: number, selected: boolean) => void;
};

const PanierActions = ({
  actionsListe,
  budgets,
  onToggleSelected,
}: PanierActionsProps) => {
  const ajouterActionsRealiseesOuEnCours =
    useAjouterActionsRealiseesOuEnCoursState();
  const {nbEnCours, nbRealisees} = ajouterActionsRealiseesOuEnCours;

  // ventile les actions en sections par statut
  const actionsParStatut = getActionsParStatut(actionsListe);
  // et détermine les sections à afficher
  const sections = SECTIONS.map(section =>
    actionsParStatut[section.statut].length
      ? {...section, actions: actionsParStatut[section.statut]}
      : null,
  ).filter(section => section !== null);

  return (
    <div className="lg:h-screen lg:w-2/5 xl:w-1/3 bg-white border-[0.5px] border-primary-3 sticky top-0">
      {actionsListe.length === 0 ? (
        <div className="h-full flex flex-col items-center">
          <Alert
            title="Comment ajouter des actions ?"
            description={`Pour ajouter des actions à votre panier, veuillez cliquer sur le bouton "Ajouter" qui s'affiche au survol de chacune des vignettes d'action.`}
          />
          <div className="w-full relative p-4">
            <AjouterActionsRealiseesOuEnCours
              className="mt-4"
              state={ajouterActionsRealiseesOuEnCours}
            />
            {nbEnCours + nbRealisees > 0 && (
              <ValiderPanierButton disabled={true} />
            )}
          </div>
          <div className="flex items-center h-full">
            <div className="flex flex-col items-center max-lg:py-4">
              <EmptyBasketPicto />
              <span className="text-primary-8 text-lg font-bold text-center">
                Votre panier d'actions est vide !
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full p-4 pt-0 flex flex-col gap-5">
          <div className="flex flex-col overflow-y-auto">
            <div className="h-48 mt-6">
              <BasketPicto className="mx-auto h-full" />
            </div>
            <div className="sticky top-0 z-10 bg-white">
              <div className="bg-white text-primary-8 py-6 text-xl font-extrabold text-center">
                {actionsListe.length} action{actionsListe.length > 1 ? 's' : ''}{' '}
                dans mon panier
              </div>
              <AjouterActionsRealiseesOuEnCours
                className="justify-self-start mt-4"
                state={ajouterActionsRealiseesOuEnCours}
              />

              <ValiderPanierButton />
              <div className="h-12 bg-gradient-to-b from-white via-white" />
            </div>

            <div className="grid md:max-lg:grid-cols-2 gap-4">
              {sections.map(({statut, nom, nomPluriel, actions}) => (
                <>
                  <p
                    key={statut}
                    className="font-bold uppercase text-primary-10 text-center mb-0"
                  >
                    {actions.length} {actions.length > 1 ? nomPluriel : nom}
                  </p>
                  {actions.map(({action, thematiques, typologie}) => (
                    <ActionImpact
                      key={action.id}
                      description={action.description}
                      typologie={typologie}
                      titre={action.titre}
                      thematiques={thematiques}
                      budget={budgets.find(
                        b => b.niveau === action.fourchette_budgetaire,
                      )}
                      panier={true}
                      isSelected={false}
                      onToggleSelected={() =>
                        onToggleSelected(action.id, false)
                      }
                    />
                  ))}
                </>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// pour afficher les actions du panier par statut
const SECTIONS = [
  {
    statut: 'nouvelle',
    nom: 'nouvelle action',
    nomPluriel: 'nouvelles actions',
  },
  {
    statut: 'realise',
    nom: 'action réalisée',
    nomPluriel: 'actions réalisées',
  },
  {
    statut: 'en_cours',
    nom: 'action en cours de réalisation',
    nomPluriel: 'actions en cours de réalisation',
  },
  {
    statut: 'importee',
    nom: 'action déjà importée',
    nomPluriel: 'actions déjà importées',
  },
] as const;
type Statut = (typeof SECTIONS)[number]['statut'];

// regroupe les actions par statut
const getActionsParStatut = (actionsListe: ActionImpactState[]) => {
  const actionsParStatut: Record<Statut, ActionImpactState[]> = {
    realise: [],
    en_cours: [],
    importee: [],
    nouvelle: [],
  };
  actionsListe.forEach(state => {
    const statut = state.dejaImportee
      ? 'importee'
      : state.statut?.categorie_id === 'realise' ||
        state.statut?.categorie_id === 'en_cours'
      ? state.statut.categorie_id
      : 'nouvelle';

    actionsParStatut[statut].push(state);
  });
  return actionsParStatut;
};

export default PanierActions;
